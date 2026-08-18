/**
 * Prague1200 — Soft Paper Flip Engine v2
 *
 * 翻頁原理：
 *   - 把右頁切成 N 個垂直切片（Slices），每片獨立 rotateY
 *   - 最外側切片 delay=0（先動），最內側 delay=最大（後動）
 *   - 結果：右緣先揚起，脊側最後跟上 → 視覺上形成「柔紙弧度」
 *   - 同時疊加漸層陰影 overlay 在 90° 峰值最深，模擬光影折曲
 *   - backface 套用 backdrop-filter blur 模擬透光感
 *
 * cubic-bezier(0.25, 1, 0.5, 1)  ← Ease-Out Quint，紙張落下慣性
 * Duration: 900ms (within 0.8-1.2s spec)
 */

const FLIP_CONFIG = {
  slices:      7,
  duration:    1100,      // ms — slower, more paper feel
  maxDelay:    200,       // outer leads 0ms, spine delays 200ms → visible wave
  easing:      'cubic-bezier(0.23, 1, 0.32, 1)',  // Ease-Out Quint, soft landing
  perspective: 1800,      // tighter perspective = more dramatic bend
};

/* ── Helper: clone a page el ── */
function clonePageEl(el) {
  if (!el) return _blankPage();
  const c = el.cloneNode(true);
  // Re-run any init if the page exposes it
  if (el.__onClone) el.__onClone(c);
  return c;
}
function _blankPage(side = 'right') {
  const d = document.createElement('div');
  d.className = 'page pg-endpaper';
  d.dataset.side = side;
  return d;
}

/* ════════════════════════════════════════════
   SoftFlipBook
   ════════════════════════════════════════════ */
class SoftFlipBook {
  constructor(opts = {}) {
    this.pages       = opts.pages || [];   // Array of DOM elements (front faces)
    this.spreadIndex = 0;
    this.isAnimating = false;
    this.onSpreadChange = opts.onSpreadChange || null;
    this._playSoundFn   = opts.playFlipSound || (() => {});

    // DOM refs
    this.$book     = document.getElementById('book');
    this.$bgLeft   = document.getElementById('page-left-bg');
    this.$bgRight  = document.getElementById('page-right-bg');
    this.$flipWrap = document.getElementById('flip-wrap');
    this.$shadow   = document.getElementById('flip-shadow');

    this._sliceEls = [];

    this._initSlices();
    this._render();
    this._bindEvents();
  }

  /* ── Spread geometry ──────────────────────────── */
  get totalSpreads() {
    // Spread 0: blank left + page[0] right (cover)
    // Spread s: page[2s-1] left + page[2s] right
    return Math.ceil((this.pages.length + 1) / 2) + 1;
  }
  _leftIdx(s)  { return s * 2 - 1; }
  _rightIdx(s) { return s * 2;     }

  _getPage(idx) {
    if (idx < 0 || idx >= this.pages.length) return null;
    return this.pages[idx];
  }

  /* ── Init the N flip slices ───────────────────── */
  _initSlices() {
    this.$flipWrap.innerHTML = '';
    this._sliceEls = [];
    const N = FLIP_CONFIG.slices;
    const pct = 100 / N;

    for (let i = 0; i < N; i++) {
      const slice = document.createElement('div');
      slice.className = 'flip-slice';
      slice.style.cssText = `
        position: absolute;
        top: 0;
        left: ${i * pct}%;
        width: ${pct + 0.2}%;
        height: 100%;
        overflow: hidden;
        transform-origin: left center;
        transform-style: preserve-3d;
        backface-visibility: visible;
        will-change: transform;
      `;

      // Front face (clips into front page content)
      const front = document.createElement('div');
      front.className = 'slice-face slice-front';
      front.style.cssText = `
        position: absolute; inset: 0;
        overflow: hidden;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      `;
      const frontInner = document.createElement('div');
      frontInner.className = 'slice-inner';
      // Position full-page content so this slice's window reveals column i
      frontInner.style.cssText = `
        position: absolute;
        top: 0; left: ${-(i * pct)}%;
        width: ${N * 100}%;
        height: 100%;
        pointer-events: none;
      `;
      front.appendChild(frontInner);

      // Shadow overlay — creates fold-shadow that deepens mid-flip
      const frontShadow = document.createElement('div');
      frontShadow.className = 'slice-shadow';
      frontShadow.style.cssText = `
        position:absolute; inset:0; pointer-events:none; z-index:2;
        background:linear-gradient(to right, rgba(0,0,0,0.18), transparent);
        opacity:0; transition:opacity 0.1s;
      `;
      front.appendChild(frontShadow);

      // Back face (clips into back page content, viewed from behind)
      const back = document.createElement('div');
      back.className = 'slice-face slice-back';
      back.style.cssText = `
        position: absolute; inset: 0;
        overflow: hidden;
        transform: rotateY(180deg);
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      `;
      const backInner = document.createElement('div');
      backInner.className = 'slice-inner';
      // When viewed from behind: slice i of back = column (N-1-i) from right
      // i.e. back column index = N-1-i, offset = (N-1-i) * pct from left
      const backCol = (N - 1 - i);
      backInner.style.cssText = `
        position: absolute;
        top: 0; left: ${-(backCol * pct)}%;
        width: ${N * 100}%;
        height: 100%;
        pointer-events: none;
        transform: scaleX(-1);     /* correct mirror from rotateY(180deg) */
      `;
      back.appendChild(backInner);

      slice.appendChild(front);
      slice.appendChild(back);
      this.$flipWrap.appendChild(slice);
      this._sliceEls.push({ slice, front, frontInner, back, backInner, frontShadow });
    }
  }

  /* ── Fill a slice with content ─────────────────── */
  _fillSlice(sliceData, frontEl, backEl) {
    const N = FLIP_CONFIG.slices;
    // Front
    sliceData.frontInner.innerHTML = '';
    if (frontEl) sliceData.frontInner.appendChild(clonePageEl(frontEl));
    // Back
    sliceData.backInner.innerHTML = '';
    if (backEl) sliceData.backInner.appendChild(clonePageEl(backEl));
  }

  /* ── Render current spread ─────────────────────── */
  _render(s = this.spreadIndex) {
    const li = this._leftIdx(s);
    const ri = this._rightIdx(s);

    // Background left / right
    this.$bgLeft.innerHTML  = '';
    this.$bgRight.innerHTML = '';
    const lp = this._getPage(li);
    const rp = this._getPage(ri);
    if (lp) this.$bgLeft.appendChild(clonePageEl(lp));
    else     this.$bgLeft.appendChild(_blankPage('left'));
    if (rp) this.$bgRight.appendChild(clonePageEl(rp));
    else     this.$bgRight.appendChild(_blankPage('right'));

    // Reset flip wrap
    this.$flipWrap.style.opacity = '0';
    this.$flipWrap.style.transition = 'none';
    this._clearSliceTransitions();

    // Shadow off
    this.$shadow.style.opacity = '0';

    this._updateNav();
    if (this.onSpreadChange) this.onSpreadChange(s, this.totalSpreads);

    // Call onEnter for pages that need it
    [this.$bgLeft, this.$bgRight].forEach(container => {
      const page = container.firstElementChild;
      if (page?.__onEnter) page.__onEnter();
    });
  }

  _clearSliceTransitions() {
    this._sliceEls.forEach(({ slice }) => {
      slice.style.transition = 'none';
      slice.style.transform  = 'perspective(2400px) rotateY(0deg)';
    });
  }

  /* ── Forward flip ──────────────────────────────── */
  flipForward() {
    if (this.isAnimating || this.spreadIndex >= this.totalSpreads - 1) return;
    const s  = this.spreadIndex;
    const ri = this._rightIdx(s);      // current right = flip front
    const nl = ri + 1;                 // next left     = flip back

    const frontEl = this._getPage(ri);
    const backEl  = this._getPage(nl);

    // Load all slices
    this._sliceEls.forEach(d => this._fillSlice(d, frontEl, backEl));

    // Reset transform
    this._clearSliceTransitions();
    this.$flipWrap.style.opacity = '1';

    // Shadow setup
    this.$shadow.style.transition = 'none';
    this.$shadow.style.opacity    = '0';

    this._playSoundFn();
    this.isAnimating = true;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const N   = FLIP_CONFIG.slices;
      const dur = FLIP_CONFIG.duration;
      const ease = FLIP_CONFIG.easing;

      // Animate each slice — outer (index N-1) leads, inner (index 0) follows
      this._sliceEls.forEach(({ slice, frontShadow }, i) => {
        // i=0 inner/spine, i=N-1 outer/edge
        const t     = i / (N - 1);  // 0=inner, 1=outer
        const delay = FLIP_CONFIG.maxDelay * (1 - t);  // outer=0ms, inner=maxDelay
        slice.style.transition =
          `transform ${dur}ms ${ease} ${delay}ms`;
        slice.style.transform  =
          `perspective(${FLIP_CONFIG.perspective}px) rotateY(-180deg)`;
        // fold shadow peaks at ~half-way
        if (frontShadow) {
          const shadowDelay = delay;
          setTimeout(() => { frontShadow.style.opacity = String(0.5 + 0.5 * t); },  shadowDelay);
          setTimeout(() => { frontShadow.style.opacity = '0'; }, shadowDelay + dur * 0.55);
        }
      });

      // Shadow peak at midpoint
      const midTime = dur * 0.45 + FLIP_CONFIG.maxDelay;
      this.$shadow.style.transition = `opacity ${dur * 0.4}ms ease-in`;
      this.$shadow.style.opacity    = '1';
      setTimeout(() => {
        this.$shadow.style.transition = `opacity ${dur * 0.45}ms ease-out`;
        this.$shadow.style.opacity    = '0';
      }, midTime);

      // Update left background at ~45% (before slices fully reveal it)
      setTimeout(() => {
        this.$bgLeft.innerHTML = '';
        const nextLeft = this._getPage(nl);
        if (nextLeft) this.$bgLeft.appendChild(clonePageEl(nextLeft));
        else          this.$bgLeft.appendChild(_blankPage('left'));
      }, dur * 0.45);

      // Done
      const totalTime = dur + FLIP_CONFIG.maxDelay + 60;
      setTimeout(() => {
        this.spreadIndex++;
        this.isAnimating = false;
        this._render();
      }, totalTime);
    }));
  }

  /* ── Backward flip ─────────────────────────────── */
  flipBackward() {
    if (this.isAnimating || this.spreadIndex <= 0) return;
    const s  = this.spreadIndex;
    const li = this._leftIdx(s);    // current left = reveals as right after flip
    const pr = li - 1;              // prev right = what was there before

    const frontEl = this._getPage(pr);  // flip front shows "prev right"
    const backEl  = this._getPage(li);  // flip back shows "current left"

    this._sliceEls.forEach(d => this._fillSlice(d, frontEl, backEl));

    // Start at -180° (on left side), animate to 0°
    this._clearSliceTransitions();
    this._sliceEls.forEach(({ slice }) => {
      slice.style.transform = `perspective(${FLIP_CONFIG.perspective}px) rotateY(-180deg)`;
    });
    this.$flipWrap.style.opacity = '1';
    this.$shadow.style.opacity   = '0';

    this._playSoundFn();
    this.isAnimating = true;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const N    = FLIP_CONFIG.slices;
      const dur  = FLIP_CONFIG.duration;
      const ease = FLIP_CONFIG.easing;

      // For backward: inner leads, outer follows (reverse the delay)
      this._sliceEls.forEach(({ slice }, i) => {
        const t     = i / (N - 1);
        const delay = FLIP_CONFIG.maxDelay * t;  // inner=0, outer=maxDelay
        slice.style.transition =
          `transform ${dur}ms ${ease} ${delay}ms`;
        slice.style.transform  =
          `perspective(${FLIP_CONFIG.perspective}px) rotateY(0deg)`;
      });

      const midTime = dur * 0.45;
      this.$shadow.style.transition = `opacity ${dur * 0.4}ms ease-in`;
      this.$shadow.style.opacity    = '1';
      setTimeout(() => {
        this.$shadow.style.transition = `opacity ${dur * 0.45}ms ease-out`;
        this.$shadow.style.opacity    = '0';
      }, midTime);

      // Update right background
      setTimeout(() => {
        this.$bgRight.innerHTML = '';
        const prevRight = this._getPage(pr);
        if (prevRight) this.$bgRight.appendChild(clonePageEl(prevRight));
        else           this.$bgRight.appendChild(_blankPage('right'));
      }, dur * 0.45);

      const totalTime = dur + FLIP_CONFIG.maxDelay + 60;
      setTimeout(() => {
        this.spreadIndex--;
        this.isAnimating = false;
        this._render();
      }, totalTime);
    }));
  }

  /* ── Jump to spread ─────────────────────────────── */
  goTo(s) {
    if (s < 0 || s >= this.totalSpreads || this.isAnimating) return;
    this.spreadIndex = s;
    this._render();
  }

  /* ── Nav state ──────────────────────────────────── */
  _updateNav() {
    document.getElementById('nav-prev')
      ?.classList.toggle('disabled', this.spreadIndex <= 0);
    document.getElementById('nav-next')
      ?.classList.toggle('disabled', this.spreadIndex >= this.totalSpreads - 1);
  }

  /* ── Input events ───────────────────────────────── */
  _bindEvents() {
    document.addEventListener('keydown', e => {
      if (document.getElementById('lightbox')?.classList.contains('active')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.flipForward();
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   this.flipBackward();
    });

    // Click zones on the book itself
    this.$book?.addEventListener('click', e => {
      const rect = this.$book.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const frac = x / rect.width;
      if (frac < 0.22) this.flipBackward();
      else if (frac > 0.78) this.flipForward();
    });

    // Touch swipe
    let tx = 0;
    this.$book?.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
    this.$book?.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 44) { dx < 0 ? this.flipForward() : this.flipBackward(); }
    }, { passive: true });
  }
}

window.SoftFlipBook = SoftFlipBook;
