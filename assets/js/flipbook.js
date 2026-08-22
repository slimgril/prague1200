/**
 * Prague1200 — Hardcover Page-Turn Engine + 跨頁預載管理器
 *
 * 翻頁動畫本身（硬紙板、只有右半頁繞書脊旋轉、背面露出下一跨頁左半頁）
 * 已經驗證可行，這裡完全沒有改動翻頁機制——這次只解決「翻頁後圖片還在
 * 下載，畫面空白/跳動/逐張補上」的問題，做法是「跨頁預載管理器」：
 *
 *   - 每個跨頁的互動網址養在自己專屬的 iframe 裡，三個 iframe 輪流服務
 *     「上一跨頁 / 目前跨頁 / 下一跨頁」（用 index % 3 分配，因為每次
 *     只會移動到相鄰跨頁，相鄰三個 index 取 mod 3 一定落在三個不同格子，
 *     不需要額外的搬移/回收帳本）。
 *   - 目前跨頁一顯示完成，就立刻在背景把「下一跨頁」的 iframe 準備好：
 *     等 iframe load、抓出裡面所有 <img> 呼叫 decode()、再等兩次
 *     requestAnimationFrame，確認真的畫出來了才算 ready。
 *   - 翻頁動畫「正式開始」前一定會 await 下一跨頁 ready；如果使用者手速
 *     快過預載，才會短暫顯示「載入中」，翻頁動畫本身永遠只在內容已經
 *     準備好之後才開始轉——不會出現轉完頁、下一跨頁還在補圖的狀況。
 *   - 翻頁完成後不是「重新設定同一顆 iframe 的 src」（那樣等於整個重新
 *     載入，白準備了），而是直接把已經準備好的 iframe 切到可見／可互動，
 *     舊的那顆退到背景繼續留著（變成新的「上一跨頁」）。
 *   - 非目前跨頁的 iframe 一律靜音其中的 audio/video，避免預載時提前
 *     發出聲音；切到目前跨頁時才解除靜音（不主動幫忙按播放，維持原本
 *     「使用者點擊才播放」的設計）。
 *
 * 另外沿用先前驗證過的修正：iframe 內部事件不會冒泡到外層文件，所以
 * 左右邊緣另外疊了 tap-zone，並用 setPointerCapture 讓「熱區起手、滑進
 * 中間互動內容」的滑動手勢仍收得到終點。
 */

const FLIP_CONFIG = {
  duration: 2000,       // ms — 翻頁時間（實際動畫時間由 CSS 變數 --turn-duration 控制，這裡僅供參考）
  prepareTimeout: 6000, // ms — 單一跨頁預載安全逾時，避免壞掉的資源卡住翻頁
};

class SoftFlipBook {
  constructor(opts = {}) {
    this.spreads      = opts.spreads || [];
    this.currentIndex = 0;
    this.busy         = false;
    this.onSpreadChange = opts.onSpreadChange || null;
    this._playSoundFn   = opts.playFlipSound || (() => {});

    this.$book         = document.getElementById('book');
    this.$liveStage     = document.querySelector('.live-stage');
    this.$previewStage  = document.getElementById('previewStage');
    this.$destPreview   = document.getElementById('destinationPreview');
    this.$turningLeaf   = document.getElementById('turningLeaf');
    this.$leafFront     = document.getElementById('leafFront');
    this.$leafBack      = document.getElementById('leafBack');
    this.$tapPrev       = document.getElementById('tapZonePrev');
    this.$tapNext       = document.getElementById('tapZoneNext');
    this.$loadingOverlay = document.getElementById('page-loading');

    this._pointerStartX = 0;
    this._pointerStartY = 0;

    // 三個 iframe 輪流服務「上一跨頁 / 目前跨頁 / 下一跨頁」
    this._frames = [0, 1, 2].map(() => this._makeFrame());

    this._bindEvents();
    this._openBook();
  }

  get totalSpreads() { return this.spreads.length; }
  get spreadIndex()  { return this.currentIndex; }

  _makeFrame() {
    const f = document.createElement('iframe');
    f.className = 'live-frame';
    f.setAttribute('allow', 'autoplay; fullscreen');
    f.dataset.idx = '-1';
    f.dataset.state = 'idle';
    this._muteMedia(f); // 尚未指派內容，先當作非目前跨頁處理
    this.$liveStage?.appendChild(f);
    return f;
  }

  _frameSlot(idx) {
    return this._frames[((idx % 3) + 3) % 3];
  }

  _muteMedia(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      doc.querySelectorAll('audio,video').forEach(el => {
        if (el.dataset._wasMuted === undefined) el.dataset._wasMuted = el.muted ? '1' : '0';
        el.muted = true;
        el.pause?.();
      });
    } catch (e) { /* 同源理應不會丟錯，保險起見忽略 */ }
  }

  _unmuteMedia(frame) {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      doc.querySelectorAll('audio,video').forEach(el => {
        if (el.dataset._wasMuted !== undefined) el.muted = el.dataset._wasMuted === '1';
      });
    } catch (e) { /* ignore */ }
  }

  /* ── 確保某個跨頁的 iframe 已載入、首屏圖片已 decode、且至少畫過兩次畫面 ── */
  _ensurePrepared(idx) {
    if (idx < 0 || idx >= this.totalSpreads) return Promise.resolve();
    const frame = this._frameSlot(idx);
    if (Number(frame.dataset.idx) === idx && frame._readyPromise) {
      return frame._readyPromise;
    }

    frame.dataset.idx   = String(idx);
    frame.dataset.state = 'loading';
    const spread = this.spreads[idx];

    const promise = new Promise(resolve => {
      let settled = false;
      let polling = null;
      const finish = (state) => {
        if (settled) return;
        settled = true;
        if (polling) clearInterval(polling);
        frame.dataset.state = state;
        resolve();
      };
      const startScan = () => {
        this._muteMedia(frame); // 預載階段先靜音，避免提前發聲
        this._waitForCriticalPaint(frame).then(() => finish('ready'));
      };
      // 不能只等 iframe 的 load 事件——網頁裡的字型／外部資源萬一很慢或連不上，
      // load 事件會被拖住，但畫面其實早就能看了。改成輪詢 contentDocument.
      // readyState，一旦 HTML 解析完成（interactive）就直接開始掃描首屏圖片。
      const tryScan = () => {
        let doc;
        try { doc = frame.contentDocument; } catch (e) { return false; }
        if (!doc || doc.readyState === 'loading') return false;
        startScan();
        return true;
      };
      polling = setInterval(() => { if (tryScan()) clearInterval(polling); }, 50);
      frame.addEventListener('load', () => tryScan(), { once: true });
      frame.addEventListener('error', () => finish('error'), { once: true });
      setTimeout(() => finish(frame.dataset.state === 'loading' ? 'error' : frame.dataset.state), FLIP_CONFIG.prepareTimeout);
    });

    frame._readyPromise = promise;
    frame.src = spread.url;
    this._preloadImage(spread.preview).catch(() => {}); // 順便預熱翻頁預覽圖
    return promise;
  }

  /* ── 等首屏圖片下載完成、decode()、再等兩次 rAF 確認真的畫出來了 ──
     不只是等 iframe 的 load 事件：load 不代表內部圖片都已解碼繪製完成。 */
  async _waitForCriticalPaint(frame) {
    let doc;
    try { doc = frame.contentDocument; } catch (e) { return; }
    if (!doc) return;

    // 排除 src="" 的圖片（例如燈箱用的預留 <img>，點擊時才會被填入真正的
    // src）——空 src 的 <img> 依規範永遠不會觸發 load 或 error，等下去只會
    // 卡住整個「準備下一跨頁」流程；這類圖片本來就不屬於「首屏」內容。
    const imgs = Array.from(doc.images || []).filter(img => {
      const src = img.getAttribute('src');
      return src && src.trim() !== '';
    });
    await Promise.all(imgs.map(img => {
      const decodeOrResolve = () =>
        (img.decode ? img.decode().catch(() => {}) : Promise.resolve());
      if (img.complete && img.naturalWidth > 0) return decodeOrResolve();
      return new Promise(resolve => {
        img.addEventListener('load',  () => decodeOrResolve().then(resolve), { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    }));

    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }

  _activateFrame(idx) {
    const frame = this._frameSlot(idx);
    this._frames.forEach(f => {
      if (f !== frame && f.classList.contains('slot-active')) {
        f.classList.remove('slot-active');
        this._notifySpread(f, '__onSpreadDeactivated');
      }
    });
    const wasAlreadyActive = frame.classList.contains('slot-active');
    frame.classList.add('slot-active');
    this._unmuteMedia(frame);
    if (!wasAlreadyActive) this._notifySpread(frame, '__onSpreadActivated');
    return frame;
  }

  /* 通用的「本跨頁上場／下場」通知：讓個別頁面（例如需要跟外層 SoundEngine
     配合淡入淡出配樂、或有計時器動畫的頁面）可以掛上 window.__onSpreadActivated／
     window.__onSpreadDeactivated，取代原本用 iframe 的 load 事件來判斷——
     load 事件在預載階段（頁面還在背景、根本還沒翻到）就會提早觸發，導致配樂
     在使用者看到這頁之前就試著播放，常常因為瀏覽器自動播放限制而播放失敗，
     翻頁翻到時卻又不會再觸發，變成完全沒有聲音。
     （這段機制曾經在「換成硬紙板翻頁引擎」那次調整中被整批覆蓋掉，導致
     P06／P07／P08／P10 的配樂與計時器全部失效——這裡是補回來。） */
  _notifySpread(frame, hookName) {
    try {
      const win = frame.contentWindow;
      if (win && typeof win[hookName] === 'function') win[hookName]();
    } catch (e) {}
  }

  /* ── 保底手動觸發：不管前面自動播放的判斷邏輯猜得準不準，只要讀者
     手動點一下右上角的喇叭鈕，這裡會直接對「目前這一跨頁」發出
     __onSoundKick 通知——這是貨真價實、瀏覽器不可能拒絕的使用者手勢，
     哪個瀏覽器的自動播放規則都擋不住。個別頁面只要掛上
     window.__onSoundKick，就能在讀者手動點擊時重新嘗試播放配樂。 */
  kickSound() {
    const frame = this._frameSlot(this.currentIndex);
    this._notifySpread(frame, '__onSoundKick');
  }

  async _openBook() {
    await this._ensurePrepared(0);
    this._activateFrame(0);
    this._updateNav();
    // 一開始就顧到「目前 + 下一跨頁」的預載（第一跨頁沒有上一跨頁）
    this._ensurePrepared(1);
  }

  _updateNav() {
    document.getElementById('nav-prev')
      ?.classList.toggle('disabled', this.busy || this.currentIndex <= 0);
    document.getElementById('nav-next')
      ?.classList.toggle('disabled', this.busy || this.currentIndex >= this.totalSpreads - 1);
    if (this.onSpreadChange) this.onSpreadChange(this.currentIndex, this.totalSpreads);
  }

  _preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  _setLeafImage(el, url, position) {
    el.style.backgroundImage  = `url("${url}")`;
    el.style.backgroundPosition = position;
  }

  _resetTurnUI() {
    this.$previewStage.style.opacity = '0';
    this.$book.classList.remove('is-turning');
    this.$turningLeaf.classList.remove('animate', 'turned');
    this.$loadingOverlay?.classList.remove('active');
    this.busy = false;
    this._updateNav();
  }

  /* ── 前往下一跨頁：右半頁翻起，背面露出下一跨頁左半頁 ── */
  async flipForward() {
    if (this.busy || this.currentIndex >= this.totalSpreads - 1) return;
    window.SoundEngine?.unlockMedia?.(); // 翻頁本身就是使用者手勢，同步解鎖一次保險
    this.busy = true;
    this._updateNav();

    const current = this.spreads[this.currentIndex];
    const destIdx = this.currentIndex + 1;
    const dest    = this.spreads[destIdx];

    try {
      // 下一跨頁首屏尚未準備完成時，不允許翻頁動畫正式開始
      if (this._frameSlot(destIdx).dataset.state !== 'ready') {
        this.$loadingOverlay?.classList.add('active');
      }
      await Promise.all([
        this._preloadImage(current.preview),
        this._preloadImage(dest.preview),
        this._ensurePrepared(destIdx),
      ]);
      this.$loadingOverlay?.classList.remove('active');

      this.$destPreview.src = dest.preview;
      this._setLeafImage(this.$leafFront, current.preview, 'right center');
      this._setLeafImage(this.$leafBack,  dest.preview,    'left center');

      this._playSoundFn();
      this.$previewStage.style.opacity = '1';
      this.$book.classList.add('is-turning');
      this.$turningLeaf.classList.remove('turned');
      this.$turningLeaf.classList.add('animate');

      requestAnimationFrame(() => requestAnimationFrame(() => {
        this.$turningLeaf.classList.add('turned');
      }));

      this.$turningLeaf.addEventListener('transitionend', () => {
        this.currentIndex = destIdx;
        this.$turningLeaf.classList.remove('animate', 'turned');
        this._activateFrame(destIdx);
        this._ensurePrepared(destIdx + 1); // 三層保留往前推一格
        setTimeout(() => {
          this.$previewStage.style.opacity = '0';
          this.$book.classList.remove('is-turning');
          this.busy = false;
          this._updateNav();
          this.$book.focus({ preventScroll: true });
        }, 120);
      }, { once: true });
    } catch (err) {
      console.error('下一跨頁翻頁失敗：', err);
      this._resetTurnUI();
    }
  }

  /* ── 返回上一跨頁：對稱動作 ── */
  async flipBackward() {
    if (this.busy || this.currentIndex <= 0) return;
    window.SoundEngine?.unlockMedia?.(); // 翻頁本身就是使用者手勢，同步解鎖一次保險
    this.busy = true;
    this._updateNav();

    const destIdx = this.currentIndex - 1;
    const dest    = this.spreads[destIdx];
    const current = this.spreads[this.currentIndex];

    try {
      if (this._frameSlot(destIdx).dataset.state !== 'ready') {
        this.$loadingOverlay?.classList.add('active');
      }
      await Promise.all([
        this._preloadImage(dest.preview),
        this._preloadImage(current.preview),
        this._ensurePrepared(destIdx),
      ]);
      this.$loadingOverlay?.classList.remove('active');

      this.$destPreview.src = dest.preview;
      this._setLeafImage(this.$leafFront, dest.preview,    'right center');
      this._setLeafImage(this.$leafBack,  current.preview, 'left center');

      this._playSoundFn();
      this.$previewStage.style.opacity = '1';
      this.$book.classList.add('is-turning');
      this.$turningLeaf.classList.remove('animate');
      this.$turningLeaf.classList.add('turned');

      requestAnimationFrame(() => requestAnimationFrame(() => {
        this.$turningLeaf.classList.add('animate');
        this.$turningLeaf.classList.remove('turned');
      }));

      this.$turningLeaf.addEventListener('transitionend', () => {
        this.currentIndex = destIdx;
        this.$turningLeaf.classList.remove('animate', 'turned');
        this._activateFrame(destIdx);
        this._ensurePrepared(destIdx - 1); // 三層保留往後推一格
        setTimeout(() => {
          this.$previewStage.style.opacity = '0';
          this.$book.classList.remove('is-turning');
          this.busy = false;
          this._updateNav();
          this.$book.focus({ preventScroll: true });
        }, 120);
      }, { once: true });
    } catch (err) {
      console.error('上一跨頁翻頁失敗：', err);
      this._resetTurnUI();
    }
  }

  /* ── 直接跳頁（不經過翻頁動畫） ── */
  async goTo(i) {
    if (this.busy || i < 0 || i >= this.totalSpreads) return;
    this.currentIndex = i;
    await this._ensurePrepared(i);
    this._activateFrame(i);
    this._updateNav();
    this._ensurePrepared(i + 1);
    this._ensurePrepared(i - 1);
  }

  _bindEvents() {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      document.documentElement.style.setProperty('--turn-duration', '1ms');
    }

    document.addEventListener('keydown', e => {
      if (document.getElementById('lightbox')?.classList.contains('active')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.flipForward(); }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); this.flipBackward(); }
    });

    // 專用翻頁熱區（仿電子書）：每一跨頁內容都是 iframe，iframe 內部的點擊／
    // 觸控事件不會冒泡到外層文件。這兩個熱區是一般 <div>，疊在 iframe 之上，
    // 事件會正常冒泡，確保左右邊緣永遠點得到、翻得了頁。
    this.$tapNext?.addEventListener('click', () => this.flipForward());
    this.$tapPrev?.addEventListener('click', () => this.flipBackward());

    // 邊緣熱區用 setPointerCapture：手指從邊緣熱區開始滑動、途中移到中央
    // 互動內容（iframe）上方時，熱區仍持續收到 pointermove/pointerup，
    // 不會因為滑到 iframe 上方而漏接滑動終點。
    [this.$tapPrev, this.$tapNext].forEach(zone => {
      zone?.addEventListener('pointerdown', e => zone.setPointerCapture(e.pointerId));
    });

    // 書本整體：滑動手勢 + 邊緣點擊（作為熱區以外區域的後備）
    this.$book?.addEventListener('pointerdown', e => {
      this._pointerStartX = e.clientX;
      this._pointerStartY = e.clientY;
    });
    this.$book?.addEventListener('pointerup', e => {
      if (this.busy) return;
      const dx = e.clientX - this._pointerStartX;
      const dy = e.clientY - this._pointerStartY;
      if (Math.abs(dx) >= 55 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0 ? this.flipForward() : this.flipBackward();
        return;
      }
      const bounds = this.$book.getBoundingClientRect();
      const localX = e.clientX - bounds.left;
      if (localX >= bounds.width * 0.82) this.flipForward();
      else if (localX <= bounds.width * 0.18) this.flipBackward();
    });
  }
}

window.SoftFlipBook = SoftFlipBook;
