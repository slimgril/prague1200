/**
 * Prague1200 — Surprise Pages P01–P05
 */

/* ═══════════════════════════════════════
   COVER — Cinematic artistic opening
   ═══════════════════════════════════════ */
function buildCover() {
  const pg = document.createElement('div');
  pg.className = 'page pg-cover';
  pg.innerHTML = `
    <!-- Full-bleed AI night image -->
    <div class="cover-photo">
      <img src="${surpriseSrc('jimeng_20260810_203758_gemini.jpg')}"
           alt="" class="cover-photo-img"
           onerror="this.style.display='none'">
    </div>
    <!-- Gradient overlays -->
    <div class="cover-vignette"></div>
    <div class="cover-grain"></div>

    <!-- Top: eyebrow -->
    <div class="cover-eyebrow">Prague · 2026 · 120 Hours</div>

    <!-- Center: title -->
    <div class="cover-center">
      <div class="cover-title-line">PRAGUE</div>
      <div class="cover-title-num">1200</div>
      <div class="cover-divider"></div>
      <div class="cover-sub">兩位女醫師的布拉格挑戰誌</div>
    </div>

    <!-- Bottom: flip hint -->
    <div class="cover-hint">
      <span class="cover-hint-arrow">▸</span>
      <span class="cover-hint-text">翻頁開始</span>
    </div>
  `;

  // Click anywhere on cover → flip
  pg.__onEnter = () => {
    pg.style.cursor = 'pointer';
    pg.addEventListener('click', () => {
      SoundEngine.pageTurn?.();
      window._book?.flipForward();
    }, { once: true });
  };
  return pg;
}

/* ── Narrative bridge helpers ── */

/**
 * Adds a bottom bridge caption to any page element.
 * Appears as a subtle gold italic subtitle pointing to the next chapter.
 */
function addBridge(pg, text) {
  const b = document.createElement('div');
  b.className = 'narrative-bridge';
  b.textContent = text;
  pg.appendChild(b);
}

/**
 * Creates a pure breathing-space bridge page:
 * full-black, one sentence, auto-flips after delayMs.
 */
function buildBridgePage(sentence, delayMs = 2500) {
  const pg = document.createElement('div');
  pg.className = 'page pg-bridge';
  pg.innerHTML = `
    <div class="bridge-bg"></div>
    <div class="bridge-sentence" id="bridge-text" style="opacity:0">
      ${sentence}
    </div>
    <div class="bridge-skip" id="bridge-skip">點擊跳過</div>`;

  pg.__onEnter = () => {
    const txt  = pg.querySelector('#bridge-text');
    const skip = pg.querySelector('#bridge-skip');

    // Fade sentence in
    if (txt) {
      setTimeout(() => {
        txt.style.transition = 'opacity 1.2s ease';
        txt.style.opacity    = '1';
      }, 200);
    }

    // Auto-flip
    const timer = setTimeout(() => {
      window._book?.flipForward();
    }, delayMs);

    // Allow click-to-skip
    pg.addEventListener('click', () => {
      clearTimeout(timer);
      window._book?.flipForward();
    }, { once: true });

    // Show skip hint after 0.8s
    if (skip) setTimeout(() => skip.style.opacity = '0.35', 800);
  };
  return pg;
}


let _photosCache = [];
function setPhotos(arr) { _photosCache = arr; }

function pickPhoto(opts = {}) {
  let pool = [..._photosCache];
  if (opts.day)  pool = pool.filter(p => p.day  === opts.day);
  if (opts.minH) pool = pool.filter(p => (p.hour||12) >= opts.minH);
  if (opts.maxH) pool = pool.filter(p => (p.hour||12) <= opts.maxH);
  if (!pool.length) pool = _photosCache;
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function photoSrc(p) {
  if (!p) return '';
  return `photos/${p.day}/${p.file}`;
}

function photoImg(p, cls = '') {
  const src = photoSrc(p);
  return src
    ? `<img src="${src}" alt="" class="${cls}" onerror="this.style.display='none'">`
    : '';
}

/* ── surprise photo helper ── */
function surpriseSrc(filename) {
  return `surprise/${filename}`;
}
function surpriseImg(filename, cls = '', style = '') {
  return `<img src="${surpriseSrc(filename)}" alt="" class="${cls}" style="${style}" onerror="this.style.display='none'">`;
}
function spawnParticles(canvas, colors, count = 60) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const particles = Array.from({ length: count }, () => ({
    x: cx, y: cy,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 8 - 2,
    r: Math.random() * 5 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    life: 1,
    decay: Math.random() * 0.02 + 0.015,
    shape: Math.random() > 0.5 ? 'star' : 'circle',
  }));

  let rafId;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    particles.forEach(p => {
      if (p.life <= 0) return;
      alive = true;
      p.x += p.vx; p.y += p.vy;
      p.vy += 0.15;
      p.life -= p.decay;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.shape === 'star') {
        drawStar(ctx, p.x, p.y, p.r * 0.5, p.r, 5);
      } else {
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      }
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (alive) rafId = requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, W, H); canvas.remove(); }
  }
  rafId = requestAnimationFrame(draw);
  return () => { cancelAnimationFrame(rafId); canvas.remove(); };
}

function drawStar(ctx, x, y, r1, r2, n) {
  ctx.moveTo(x, y - r2);
  for (let i = 0; i < n; i++) {
    const a1 = (i * 2 * Math.PI / n) - Math.PI / 2;
    const a2 = a1 + Math.PI / n;
    ctx.lineTo(x + Math.cos(a1) * r2, y + Math.sin(a1) * r2);
    ctx.lineTo(x + Math.cos(a2) * r1, y + Math.sin(a2) * r1);
  }
  ctx.closePath();
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.style.cssText = `position:absolute;inset:0;pointer-events:none;z-index:50;`;
  return c;
}

/* ═══════════════════════════════════════
   P01 — Challenge Launch Timer
   ═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   P01 — PVP Activation / Challenge Start
   ═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   P01 — 起跑線 / Starting Line
   ═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   P01 — 起跑線 / Starting Line
   公式：標題 + 金句 + 大照片 + 留白
   ═══════════════════════════════════════ */
function buildP01() {
  const pg = document.createElement('div');
  pg.className = 'page pg-p01';
  pg.innerHTML = `
    <div class="p01-bg-photo">
      ${surpriseImg('jimeng_20260810_203758_gemini.jpg','p01-bg-img')}
    </div>
    <div class="p01-bg-overlay"></div>

    <div class="p01-layout">

      <!-- LEFT: Text column -->
      <div class="p01-left">
        <div class="p01-chapter">P.01</div>
        <h1 class="p01-title">起跑線</h1>
        <p class="p01-en">Starting Line</p>

        <div class="p01-quote-rule"></div>
        <blockquote class="p01-quote">
          放下聽診器，拿起這張券。<br>
          120 小時，布拉格，起跑。
        </blockquote>
        <div class="p01-quote-rule"></div>

        <!-- Key facts (minimal) -->
        <ul class="p01-facts">
          <li><span>120h</span> 通行時效</li>
          <li><span>70+</span> 官方推薦景點</li>
          <li><span>無限次</span> 大眾運輸</li>
          <li><span>兩位醫師</span> 一場打卡馬拉松</li>
        </ul>

        <button class="p01-btn" id="p01-start">
          出發 ▸
        </button>
      </div>

      <!-- RIGHT: Large pass photo + map -->
      <div class="p01-right">
        <div class="p01-pass-wrap" id="p01-card">
          ${surpriseImg('pass.png','p01-pass-img','')}
          <div class="p01-card-glow" id="p01-glow"></div>
        </div>

        <!-- Prague map — small, lower right, breathing room -->
        <div class="p01-map-inset">
          ${surpriseImg('卡羅維利地圖.PNG','p01-map-img','')}
          <div class="p01-map-label">Prague · 建議足跡地圖</div>
        </div>
      </div>

    </div>`;

  pg.__onEnter = () => {
    const card = pg.querySelector('#p01-card');
    const glow = pg.querySelector('#p01-glow');
    const btn  = pg.querySelector('#p01-start');

    if (btn) {
      btn.onclick = () => {
        btn.disabled = true;
        if (card) card.classList.add('activated');
        if (glow) glow.classList.add('on');
        SoundEngine.achievement();
        setTimeout(() => window._book?.flipForward(), 600);
      };
    }
  };
  addBridge(pg, '放下聽診器，這 11 公里，我們布拉格見。');
  return pg;
}

/* ═══════════════════════════════════════
   P02 — PVP 挑戰起跑線 (Sports Dashboard)
   精確像素施工圖版
   ═══════════════════════════════════════ */
function buildP02() {
  const pg = document.createElement('div');
  pg.className = 'page pg-p02';
  pg.innerHTML = `
    <!-- LEFT PANEL 40% : tech black -->
    <div class="p02-left-panel">

      <!-- A: Title block (top 15%) -->
      <div class="p02-title-block">
        <div class="p02-main-title">120小時的<br>破關鑰匙</div>
        <div class="p02-pvp-label">PRAGUE VISITOR PASS</div>
      </div>

      <!-- B: Orange PVP e-Pass card (top 35%, centred) -->
      <div class="p02-card" id="p02-card">
        <div class="p02-card-inner">
          <div class="p02-card-top-row">
            <div class="p02-card-passtext">120h<br><span>e-Pass</span></div>
            <div class="p02-card-logo">PVP</div>
          </div>
          <div class="p02-card-mid">PRAGUE VISITOR PASS</div>
          <div class="p02-card-bottom-row">
            <div class="p02-card-valid">VALID 120 HOURS · 70+ EXPERIENCES</div>
            <!-- Minimal SVG QR code -->
            <svg class="p02-qr" viewBox="0 0 21 21" fill="white">
              <rect x="0" y="0" width="7" height="7"/>
              <rect x="1" y="1" width="5" height="5" fill="#FF5A00"/>
              <rect x="2" y="2" width="3" height="3" fill="white"/>
              <rect x="14" y="0" width="7" height="7"/>
              <rect x="15" y="1" width="5" height="5" fill="#FF5A00"/>
              <rect x="16" y="2" width="3" height="3" fill="white"/>
              <rect x="0" y="14" width="7" height="7"/>
              <rect x="1" y="15" width="5" height="5" fill="#FF5A00"/>
              <rect x="2" y="16" width="3" height="3" fill="white"/>
              <rect x="9" y="0" width="1" height="1"/><rect x="11" y="0" width="1" height="1"/>
              <rect x="10" y="2" width="1" height="1"/><rect x="8" y="3" width="1" height="1"/>
              <rect x="12" y="3" width="1" height="1"/><rect x="9" y="5" width="1" height="1"/>
              <rect x="11" y="6" width="1" height="1"/><rect x="8" y="8" width="1" height="1"/>
              <rect x="10" y="9" width="1" height="1"/><rect x="12" y="8" width="1" height="1"/>
              <rect x="9" y="11" width="1" height="1"/><rect x="11" y="10" width="1" height="1"/>
              <rect x="8" y="12" width="1" height="1"/><rect x="10" y="13" width="1" height="1"/>
              <rect x="9" y="14" width="1" height="1"/><rect x="11" y="15" width="1" height="1"/>
              <rect x="8" y="16" width="1" height="1"/><rect x="12" y="17" width="1" height="1"/>
              <rect x="10" y="18" width="1" height="1"/><rect x="9" y="20" width="1" height="1"/>
            </svg>
          </div>
        </div>
        <div class="p02-card-scan-hint">點擊感應啟動</div>
      </div>

      <!-- C: Race stats (top 75%) -->
      <div class="p02-stats-block">
        <div class="p02-stat-line">⏱ <span>TIME:</span> 120 Hours</div>
        <div class="p02-stat-line">👟 <span>DISTANCE:</span> 11 km</div>
        <div class="p02-stat-line">🏰 <span>TARGETS:</span> 70+ Experiences</div>
      </div>

    </div>

    <!-- RIGHT PANEL 60% : dark grey + tech grid -->
    <div class="p02-right-panel">

      <!-- D: SVG Prague treasure map (centred) -->
      <div class="p02-map-wrap">
        <svg viewBox="0 0 600 500" class="p02-prague-map">
          <!-- Vltava River S-curve -->
          <path d="M 300 500 Q 250 400 350 300 T 250 100 T 300 0"
                stroke="#2a2a2a" stroke-width="10" fill="none"/>
          <!-- Charles Bridge dashed connector -->
          <line x1="280" y1="230" x2="330" y2="210"
                stroke="#D4AF37" stroke-width="3" stroke-dasharray="6 3" fill="none"/>
          <text x="295" y="250" fill="#D4AF37" font-size="11" font-family="sans-serif"
                text-anchor="middle" font-style="italic">查理大橋</text>

          <!-- Node 1: Old Town Hall / Astronomical Clock -->
          <g class="p02-map-node" id="node-clock">
            <circle cx="380" cy="210" r="28" class="p02-ping" fill="rgba(60,60,60,0.15)" stroke="none"/>
            <circle cx="380" cy="210" r="8" class="p02-dot" fill="#555" stroke="#aaa" stroke-width="2"/>
            <text x="408" y="204" class="p02-node-label" fill="#888"
                  font-size="14" font-family="sans-serif" font-weight="bold">舊市政廳與天文鐘</text>
            <text x="408" y="222" class="p02-node-sublabel" fill="#666"
                  font-size="11" font-family="sans-serif" font-weight="500">Old Town Hall &amp; Clock</text>
          </g>

          <!-- Node 2: Prague Castle -->
          <g class="p02-map-node" id="node-castle">
            <circle cx="195" cy="155" r="28" class="p02-ping" fill="rgba(60,60,60,0.15)" stroke="none"/>
            <circle cx="195" cy="155" r="8" class="p02-dot" fill="#555" stroke="#aaa" stroke-width="2"/>
            <text x="10" y="147" class="p02-node-label" fill="#888"
                  font-size="14" font-family="sans-serif" font-weight="bold">布拉格城堡區</text>
            <text x="10" y="165" class="p02-node-sublabel" fill="#666"
                  font-size="11" font-family="sans-serif" font-weight="500">Prague Castle</text>
          </g>

          <!-- Node 3: Powder Tower -->
          <g class="p02-map-node" id="node-powder">
            <circle cx="440" cy="260" r="28" class="p02-ping" fill="rgba(60,60,60,0.15)" stroke="none"/>
            <circle cx="440" cy="260" r="8" class="p02-dot" fill="#555" stroke="#aaa" stroke-width="2"/>
            <text x="468" y="253" class="p02-node-label" fill="#888"
                  font-size="14" font-family="sans-serif" font-weight="bold">火藥塔</text>
            <text x="468" y="271" class="p02-node-sublabel" fill="#666"
                  font-size="11" font-family="sans-serif" font-weight="500">Powder Tower</text>
          </g>
        </svg>
      </div>

      <!-- E: Gold quote (bottom 15%, right-aligned) -->
      <div class="p02-quote-block">
        「放下聽診器，這 11 公里，我們布拉格見。」
      </div>

    </div>
  `;

  pg.__onEnter = () => {
    const card  = pg.querySelector('#p02-card');
    let activated = false;

    card?.addEventListener('click', () => {
      if (activated) return;
      activated = true;

      // Bounce feedback
      card.style.transition = 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)';
      card.style.transform  = 'scale(1.05)';
      setTimeout(() => { card.style.transform = 'scale(1)'; }, 150);

      // Beep
      SoundEngine.achievement();

      // Power up map nodes one by one
      pg.querySelectorAll('.p02-map-node').forEach((node, i) => {
        setTimeout(() => {
          // Light up dot
          node.querySelector('.p02-dot').style.fill        = '#FF5A00';
          node.querySelector('.p02-dot').style.stroke      = '#fff';
          // Activate ping
          node.querySelector('.p02-ping').style.fill       = 'rgba(255,90,0,0.25)';
          node.querySelector('.p02-ping').classList.add('active');
          // Light up labels to white
          const label    = node.querySelector('.p02-node-label');
          const sublabel = node.querySelector('.p02-node-sublabel');
          if (label)    label.style.fill    = '#FFFFFF';
          if (sublabel) sublabel.style.fill = '#FF5A00';
          SoundEngine.tick();
        }, 300 + i * 280);
      });
    });
  };

  addBridge(pg, '白袍之下，住著一個愛冒險的靈魂，正準備踏入時光的溫泉。');
  return pg;
}

/* ═══════════════════════════════════════
   P03 — 普普飯店・歲月處方箋
   左欄 50% 電影海報 | 右欄 50% 手帳日記
   ═══════════════════════════════════════ */
function buildP03() {
  const pg = document.createElement('div');
  pg.className = 'page pg-p03';
  pg.innerHTML = `
    <!-- LEFT PANEL 50%: movie poster / night black -->
    <div class="p03-hero-panel" id="p03-hero">
      <div class="p03-gun-barrel" id="p03-barrel"></div>
      <div class="p03-hero-photo">
        ${surpriseImg('kv_elegant.png','p03-hero-img','')}
      </div>
      <div class="p03-film-title">
        <div class="p03-film-main">雙生浪漫</div>
        <div class="p03-film-sub">卡羅維瓦利的星空下</div>
        <div class="p03-film-date">Karlovy Vary · 4.08.15</div>
      </div>
    </div>

    <!-- RIGHT PANEL 50%: cream diary -->
    <div class="p03-diary-panel">

      <!-- D: Brass time-slider -->
      <div class="p03-slider-wrap">
        <div class="p03-slider-labels">
          <span>年輕的我們<br><em>奔跑著</em></span>
          <span>現在的我們<br><em>在聆聽</em></span>
          <span>未來的我們<br><em>透著光</em></span>
        </div>
        <input type="range" min="0" max="100" value="50"
               class="p03-slider" id="p03-slider">
      </div>

      <!-- E: Life reflection text -->
      <div class="p03-reflection">
        <p class="p03-ref-opening">老去不是失去，<br>是時間留下的<span>價值</span>——</p>
        <p class="p03-ref-body">
          卡羅維瓦利的溫泉水，<br>
          自地底湧出，帶著 1370 年的時光。<br><br>
          普普飯店的石磚，<br>
          見過多少旅人，<br>
          也見過我們這對醫師同事。
        </p>
      </div>

      <!-- F: Funny afternoon tea polaroid (rotate 8deg) -->
      <div class="p03-polaroid" id="p03-polaroid">
        ${surpriseImg('卡羅維瓦利.png','p03-polaroid-img','')}
        <div class="p03-polaroid-cap">Grandhotel Pupp · 下午茶</div>
        <canvas class="p03-particles" id="p03-canvas" width="200" height="200"></canvas>
      </div>

    </div>
  `;

  pg.__onEnter = () => {
    const hero     = pg.querySelector('#p03-hero');
    const barrel   = pg.querySelector('#p03-barrel');
    const slider   = pg.querySelector('#p03-slider');
    const heroImg  = pg.querySelector('.p03-hero-img');
    const polaroid = pg.querySelector('#p03-polaroid');
    const canvas   = pg.querySelector('#p03-canvas');

    // C: 007 Gun Barrel — follow mouse
    hero?.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left)  / r.width  * 100).toFixed(1);
      const y = ((e.clientY - r.top)   / r.height * 100).toFixed(1);
      barrel.style.background = `radial-gradient(circle at ${x}% ${y}%, transparent 26%, rgba(0,0,0,0.96) 62%)`;
      barrel.style.opacity = '1';
    });
    hero?.addEventListener('mouseleave', () => { barrel.style.opacity = '0'; });

    // D→E slider interactions
    slider?.addEventListener('input', () => {
      const v = parseInt(slider.value, 10);
      // Toward 未來 (high) → sepia filter on hero photo
      if (heroImg) {
        const s = Math.max(0, (v - 50) / 50);
        heroImg.style.filter = `sepia(${s.toFixed(2)}) brightness(${(1 - s * 0.18).toFixed(2)})`;
      }
      // Toward 年輕 (low) → enlarge + saturate polaroid
      if (polaroid) {
        const sc = v < 40 ? 1 + (40 - v) / 80 : 1;
        polaroid.style.transform = `rotate(8deg) scale(${sc.toFixed(2)})`;
        polaroid.style.filter    = v < 40 ? 'saturate(1.6) brightness(1.05)' : 'saturate(1)';
      }
      // Burst particles when dragged to very young end
      if (canvas && v < 25) {
        spawnParticles(canvas, ['#FF5A00','#FFD700','#FF69B4','#7CFC00','#00BFFF'], 28);
      }
    });
  };

  addBridge(pg, '治癒了疲憊，我們走回布拉格那顆跳動了千年的心臟。');
  return pg;
}

/* ═══════════════════════════════════════
   P04 — 布拉格之春 / Prague Spring
   公式：標題 + 金句 + 4張仰望大照片 + 留白
   ═══════════════════════════════════════ */
function buildP04() {
  // Pick 4 photos from the Library — user said even wrong ones are fine
  const p1 = pickPhoto({ day:'day4' });
  const p2 = pickPhoto({ day:'day4' });
  const p3 = pickPhoto({ day:'day4' });
  const p4 = pickPhoto({ day:'day4' });

  const pg = document.createElement('div');
  pg.className = 'page pg-p04';
  pg.innerHTML = `
    <div class="p04-stone-bg"></div>

    <!-- Top section: title + quote -->
    <div class="p04-header">
      <div class="p04-chapter">P.04</div>
      <h1 class="p04-title">布拉格之春</h1>
      <p class="p04-en">Prague · The Gothic Heart · 1475</p>
      <div class="p04-rule"></div>
      <blockquote class="p04-quote">
        穿過這道門，<br>我們走進了六百年的榮光。
      </blockquote>
    </div>

    <!-- Photo collage: scattered, varying sizes, "looking up" -->
    <div class="p04-collage">

      <!-- Large vertical: main hero photo — left, slightly rotated -->
      <div class="p04-photo p04-photo-a">
        ${photoImg(p1, 'p04-img')}
        <div class="p04-photo-label">火藥塔<span>Powder Tower · 1475</span></div>
      </div>

      <!-- Medium horizontal: top-right -->
      <div class="p04-photo p04-photo-b">
        ${photoImg(p2, 'p04-img')}
        <div class="p04-photo-label">查理大橋<span>Charles Bridge · 1357</span></div>
      </div>

      <!-- Small: mid-right -->
      <div class="p04-photo p04-photo-c">
        ${photoImg(p3, 'p04-img')}
        <div class="p04-photo-label">布拉格城堡<span>Prague Castle</span></div>
      </div>

      <!-- Accent small: bottom-left, offset -->
      <div class="p04-photo p04-photo-d">
        ${photoImg(p4, 'p04-img')}
      </div>

      <!-- Kafka easter egg — bottom-left corner, barely visible -->
      <div class="p04-kafka">
        黃金巷 22 號 ——<br>卡夫卡的診間，與我們查房的距離。
      </div>
    </div>
  `;

  addBridge(pg, '穿過六百年的城門，她們跳上了一輛載滿童心的紅色電車。');
  return pg;
}

/* ═══════════════════════════════════════
   P05 — Prague Tram (scrapbook / bulletin-board feel)
   ═══════════════════════════════════════ */
function buildP05() {
  const pg = document.createElement('div');
  pg.className = 'page pg-p05';
  pg.innerHTML = `
    <div class="p05-corkboard"></div>

    <div class="p05-torn-header">
      <div class="p05-torn-inner">
        <span class="p05-torn-num">No. 42</span>
        Prague Heritage Tram
        <span class="p05-torn-emoji">🚃</span>
      </div>
    </div>

    <div class="p05-pin-area">
      <!-- Main tram photo — real shot, pinned with tape -->
      <div class="p05-photo-pinned" id="p05-tram">
        <div class="p05-tape p05-tape-tl"></div>
        <div class="p05-tape p05-tape-tr"></div>
        ${surpriseImg('電車.JPG','p05-collage-img')}
      </div>

      <!-- Q-version collage as secondary pinned photo -->
      <div class="p05-photo-secondary">
        ${surpriseImg('電車樂園.png','p05-collage-img')}
      </div>

      <div class="p05-right-col">
        <div class="p05-sticky" id="p05-sticky">
          <div class="p05-sticky-title">📋 TODAY'S MISSION</div>
          <ul class="p05-mission-list" id="p05-mission-list">
            <li>搭 42 號電車環遊布拉格</li>
            <li>Pohořelec → 城堡山頂</li>
            <li>Malostranské 廣場下車</li>
            <li>查理大橋拍照 × 50</li>
          </ul>
        </div>

        <div class="p05-stamp-badge" id="p05-stamp">
          <div>🙂 MISSION</div>
          <div>COMPLETE!</div>
        </div>

        <div class="p05-ticket">
          <div>RIDE TICKET · TRAM 42 · PRAGUE</div>
          <div class="p05-ticket-line">♦♦♦♦♦♦♦♦♦♦♦♦</div>
          <div>今天的門診暫停，我們在電車上查房。♡</div>
        </div>
      </div>
    </div>`;

  pg.__onEnter = () => {
    const tram  = pg.querySelector('#p05-tram');
    const items = pg.querySelectorAll('#p05-mission-list li');
    const stamp = pg.querySelector('#p05-stamp');

    if (tram) {
      tram.style.transform = 'translateX(100%) rotate(2deg)';
      tram.style.opacity   = '0';
      tram.style.transition = 'none';
      setTimeout(() => {
        tram.style.transition = 'transform 1.1s cubic-bezier(0.25,1,0.5,1), opacity 0.4s ease';
        tram.style.transform  = 'translateX(0) rotate(-1deg)';
        tram.style.opacity    = '1';
        SoundEngine.tramBell();
      }, 200);
    }

    items.forEach((li, i) => {
      li.classList.remove('done');
      setTimeout(() => {
        li.classList.add('done');
        SoundEngine.tick();
      }, 1400 + i * 360);
    });

    setTimeout(() => {
      if (stamp) {
        stamp.classList.add('dropped');
        SoundEngine.stampThud();
      }
    }, 3100);
  };
  addBridge(pg, '電車緩緩駛出了城市，帶領她們去了更遠的童話世界。');
  return pg;
}

window.buildP01 = buildP01;
window.buildP02 = buildP02;
window.buildP03 = buildP03;
window.buildP04 = buildP04;
window.buildP05 = buildP05;
window.buildBridgePage = buildBridgePage;
window.setPhotos = setPhotos;
window.pickPhoto = pickPhoto;
window.photoSrc  = photoSrc;
window.photoImg  = photoImg;
window.spawnParticles = spawnParticles;
window.makeCanvas     = makeCanvas;
