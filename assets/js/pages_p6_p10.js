/**
 * Prague1200 — Surprise Pages P06–P10
 */

/* ── surprise photo helper (same pattern as pages_p1_p5) ── */
function surpriseSrc6(filename) {
  return `surprise/${filename}`;
}
function surpriseImg6(filename, cls = '', style = '') {
  return `<img src="${surpriseSrc6(filename)}" alt="" class="${cls}" style="${style}" onerror="this.style.display='none'">`;
}

/* ═══════════════════════════════════════
   P06 — 布拉格之春的迴旋：舊城、橋影與深夜金光
   電影全景軌道 + 固定字幕層
   ═══════════════════════════════════════ */
function buildP06() {
  const pg = document.createElement('div');
  pg.className = 'page pg-p06';

  const s = surpriseSrc6;

  pg.innerHTML = `
    <div class="p06-cinema-window">

      <!-- 底層：移動的全景軌道 -->
      <div class="p06-panorama-rail">
        <div class="p06-time-slice p06-slice-left"
             style="background-image:url('${s('image_oxeP6p.png')}')"></div>
        <div class="p06-time-slice p06-slice-mid"
             style="background-image:url('${s('image_111llO.png')}')"></div>
        <div class="p06-time-slice p06-slice-right"
             style="background-image:url('${s('image_9KIY5C.png')}')"></div>
        <div class="p06-music-overlay"></div>

        <div class="p06-photo-card p06-c-size"
             style="top:24%;left:4%;transform:rotate(-1.5deg)">
          <img src="${s('image_fR_FA9.png')}" alt="老城街道合照" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
        <div class="p06-photo-card p06-b-size"
             style="top:10%;left:18%;transform:rotate(2deg)">
          <img src="${s('image_-rPWeY.png')}" alt="中世紀風合照" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
        <div class="p06-photo-card p06-b-size"
             style="top:16%;left:36%;transform:rotate(-2deg)">
          <img src="${s('image_Ex9PZd.png')}" alt="天文鐘樓雙人合照" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
        <div class="p06-photo-card p06-c-size"
             style="top:6%;left:44%;transform:rotate(3deg);z-index:14">
          <img src="${s('image_7jQQNK.png')}" alt="單人溫柔特寫" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
        <div class="p06-photo-card p06-c-size"
             style="top:44%;left:52%;transform:rotate(-3deg)">
          <img src="${s('image_5-SNAy.png')}" alt="胡斯雕像合照" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
        <div class="p06-photo-card p06-d-size"
             style="bottom:6%;left:40%;transform:rotate(-8deg);filter:blur(0.3px)">
          <img src="${s('image_KkSKiY.png')}" alt="天文鐘死神碎片" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
        <div class="p06-photo-card p06-d-size"
             style="top:12%;left:58%;transform:rotate(6deg)">
          <img src="${s('image__Oqjd2.png')}" alt="天文鐘內部使徒碎片" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
        <div class="p06-photo-card"
             style="top:5%;left:74%;width:320px;z-index:10;filter:hue-rotate(35deg) brightness(0.32) contrast(1.15)">
          <img src="${s('image_fUPCtw.png')}" alt="老城橋塔全景實景照" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
        <div class="p06-photo-card p06-c-size"
             style="top:8%;left:88%;transform:rotate(-1deg)">
          <img src="${s('image_9KIY5C.png')}" alt="聖方濟沙勿略雕像" onerror="this.style.display='none'">
          <div class="p06-edge-vignette"></div>
        </div>
      </div>

      <!-- 上層：固定不動的字幕層 -->
      <div class="p06-subtitle-layer">
        <div class="p06-movie-subtitle p06-subtitle-left p06-magenta-text">
          穿過火藥塔的陰影，<br>舊城開始慢慢亮起。
        </div>
        <div class="p06-movie-subtitle p06-subtitle-mid">
          <div class="p06-movie-caption">Spring was not only a season. It was a sound.</div>
          <span class="p06-magenta-text">春天不只是一個季節，<br>也是一座城市被音樂喚醒的聲音。</span>
        </div>
        <div class="p06-movie-subtitle p06-subtitle-right p06-magenta-text">
          走到查理大橋時，<br>布拉格不再是景點，<br>而是一段會反覆播放的記憶。
        </div>
      </div>

    </div>`;

  addBridge(pg, '夢境還未醒來，布拉格的夜晚已悄悄換上了另一張臉。');
  return pg;
}

/* ═══════════════════════════════════════
   P07 — Charles Bridge Before/After Slider
   ═══════════════════════════════════════ */
function buildP07() {
  const earlyPhoto = pickPhoto({ minH: 7,  maxH: 10 });
  const latePhoto  = pickPhoto({ minH: 16, maxH: 20 });
  const filmStrip  = [pickPhoto(), pickPhoto(), pickPhoto()];

  const pg = document.createElement('div');
  pg.className = 'page pg-p07';
  pg.innerHTML = `
    <div class="p07-header">
      <div class="p07-eyebrow">Day 2 · Charles Bridge</div>
      <h2 class="p07-title">黃昏與黎明<br><em>魔幻時刻</em></h2>
    </div>

    <!-- Comparison Slider -->
    <div class="p07-compare-wrap">
      <div class="p07-before-side">
        ${photoImg(earlyPhoto, 'compare-img')}
        <div class="compare-placeholder early">🌅 清晨 · 空無一人</div>
        <div class="compare-label left">清晨 6:00</div>
      </div>
      <div class="p07-after-side" id="p07-after">
        ${photoImg(latePhoto, 'compare-img')}
        <div class="compare-placeholder late">🌆 黃昏 · 人潮洶湧</div>
        <div class="compare-label right">黃昏 18:00</div>
      </div>
      <div class="p07-divider" id="p07-divider">
        <div class="divider-handle">◀▶</div>
      </div>
    </div>
    <input type="range" class="compare-slider" id="p07-slider"
           min="10" max="90" value="50">

    <!-- Film strip -->
    <div class="p07-filmstrip">
      ${filmStrip.map(p => `
        <div class="film-frame">
          ${photoImg(p,'film-img')}
          <div class="film-placeholder">🌉</div>
        </div>`).join('')}
    </div>
    <div class="p07-caption">查理大橋 · 同一地點 · 不同時光</div>`;

  pg.__onEnter = () => {
    const slider  = pg.querySelector('#p07-slider');
    const after   = pg.querySelector('#p07-after');
    const divider = pg.querySelector('#p07-divider');

    function update(v) {
      const pct = v + '%';
      if (after)   { after.style.clipPath = `inset(0 0 0 ${pct})`; }
      if (divider) { divider.style.left   = pct; }
    }

    slider?.addEventListener('input', () => update(slider.value));
    update(50);
  };

  addBridge(pg, '同一座橋的兩個世界，今晚，我們不問診斷，只問啤酒。');
  return pg;
}

/* ═══════════════════════════════════════
   P08 — Beer Therapy (微醺特輯)
   ═══════════════════════════════════════ */
function buildP08() {
  const pg = document.createElement('div');
  pg.className = 'page pg-p08';
  pg.innerHTML = `
    <div class="p08-wood-bg"></div>
    <div class="p08-content">
      <div class="p08-header">
        <div class="p08-eyebrow">After Hours · Night Special</div>
        <h2 class="p08-title">皮爾森啤酒療法</h2>
        <div class="p08-rx-tag">Rx: Pilsner Urquell</div>
      </div>
      <div class="p08-photos-row">
        <!-- Left: real drinking photo (IMG_0702) -->
        <div class="p08-photo-card left" id="p08-left">
          ${surpriseImg6('IMG_0702.JPG','p08-photo-img',
            'width:100%;height:100%;object-fit:cover;object-position:center top')}
          <div class="p08-photo-label">Before</div>
          <div class="p08-click-hint">👆 點我</div>
        </div>
        <!-- Arrow -->
        <div class="p08-arrow" id="p08-arrow">→</div>
        <!-- Right: real foam mustache photo (IMG_0703) -->
        <div class="p08-photo-card right" id="p08-right" style="opacity:0;transform:scale(0.9)">
          ${surpriseImg6('IMG_0703.JPG','p08-photo-img',
            'width:100%;height:100%;object-fit:cover;object-position:center top')}
          <div class="p08-annotation">
            <div class="p08-arrow-label">◀ Rx: 皮爾森白鬍子<br><small>臨床證實有助於釋放生活壓力</small></div>
          </div>
          <div class="p08-mustache-sticker">👨</div>
        </div>
      </div>
      <!-- Bubbles container -->
      <div class="p08-bubbles" id="p08-bubbles"></div>
      <div class="p08-footer">
        <span>🍺 Czech Pilsner</span>
        <span>·</span>
        <span>1 杯 = 0.5L</span>
        <span>·</span>
        <span>酒精：4.4%</span>
        <span>·</span>
        <span>療效：立竿見影</span>
      </div>
    </div>`;

  pg.__onEnter = () => {
    const leftCard  = pg.querySelector('#p08-left');
    const rightCard = pg.querySelector('#p08-right');
    const bubblesEl = pg.querySelector('#p08-bubbles');

    pg.style.animation = 'drunkFloat 4s ease-in-out infinite';

    function doReveal() {
      SoundEngine.beerGlug();
      if (bubblesEl) spawnBeerBubbles(bubblesEl);
      setTimeout(() => {
        if (rightCard) {
          rightCard.style.transition = 'all 0.5s cubic-bezier(0.25,1,0.5,1)';
          rightCard.style.opacity    = '1';
          rightCard.style.transform  = 'scale(1.08)';
          setTimeout(() => { rightCard.style.transform = 'scale(1)'; }, 500);
        }
      }, 700);
    }

    leftCard?.addEventListener('click', doReveal);
    leftCard?.addEventListener('mouseenter', doReveal);
  };

  addBridge(pg, '120 小時的歡笑與步履，都在這 11 公里裡找到了答案。');
  return pg;
}

function spawnBeerBubbles(container) {
  const canvas = makeCanvas(
    container.offsetWidth || 380,
    container.offsetHeight || 80
  );
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const bubbles = Array.from({length:30}, () => ({
    x: Math.random() * W,
    y: H,
    r: Math.random() * 6 + 2,
    speed: Math.random() * 2 + 1,
    alpha: Math.random() * 0.6 + 0.3,
  }));
  let raf;
  function draw() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    bubbles.forEach(b => {
      b.y -= b.speed; b.alpha -= 0.008;
      if (b.alpha <= 0 || b.y < -b.r) return;
      alive = true;
      ctx.globalAlpha = b.alpha;
      ctx.fillStyle = '#F5D060';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI*2); ctx.fill();
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.3, 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (alive) raf = requestAnimationFrame(draw);
    else { ctx.clearRect(0,0,W,H); canvas.remove(); }
  }
  raf = requestAnimationFrame(draw);
}

/* ═══════════════════════════════════════
   P09 — Visitor Pass Card Game
   ═══════════════════════════════════════ */
function buildP09() {
  const cards = [
    { photo: pickPhoto(), name: 'Prague Castle',       stamp: '🏰', pts: 100 },
    { photo: pickPhoto(), name: 'Charles Bridge',      stamp: '🌉', pts: 80  },
    { photo: pickPhoto(), name: 'Astronomical Clock',  stamp: '🕰️', pts: 90  },
    { photo: pickPhoto(), name: 'Český Krumlov',       stamp: '🏰', pts: 95  },
    { photo: pickPhoto(), name: 'Karlovy Vary',        stamp: '💧', pts: 85  },
    { photo: pickPhoto(), name: 'Old Town Square',     stamp: '🏛️', pts: 75  },
  ];

  const badges = [
    { icon:'🏅', name:'Visitor Pass Master',  unlocked:true  },
    { icon:'🏃', name:'Marathon Traveler',    unlocked:true  },
    { icon:'🏰', name:'CK Conqueror',         unlocked:true  },
    { icon:'💧', name:'Spa Town Healer',      unlocked:true  },
    { icon:'📸', name:'1200 Photos Shot',     unlocked:true  },
    { icon:'👑', name:'Prague Royalty',       unlocked:false },
  ];

  const pg = document.createElement('div');
  pg.className = 'page pg-p09';
  pg.innerHTML = `
    <div class="p09-header">
      <div class="p09-eyebrow">Visitor Pass · Challenge Complete</div>
      <h2 class="p09-title">遊戲破關 <span>LEVEL CLEAR</span></h2>
    </div>
    <div class="p09-card-tray" id="p09-tray">
      ${cards.map((c,i) => `
        <div class="pass-card" style="animation-delay:${i*0.12}s">
          <div class="card-inner">
            <div class="card-photo">
              ${photoImg(c.photo,'card-photo-img')}
              <div class="card-photo-placeholder">${c.stamp}</div>
            </div>
            <div class="card-name">${c.name}</div>
            <div class="card-pts">+${c.pts} pts</div>
            <div class="card-stamp">✅ VISITED</div>
          </div>
        </div>`).join('')}
    </div>
    <div class="p09-badges-row">
      ${badges.map(b => `
        <div class="badge-chip ${b.unlocked?'':'locked'}">
          <span>${b.icon}</span>
          <div>${b.name}</div>
        </div>`).join('')}
    </div>
    <div class="p09-total">
      <span class="total-pts">530 PTS</span>
      <span class="total-label">Total Score · Prague Champion 🏆</span>
    </div>`;

  pg.__onEnter = () => {
    // Cards deal in
    pg.querySelectorAll('.pass-card').forEach((card, i) => {
      card.style.opacity   = '0';
      card.style.transform = 'translateY(30px) rotate(-5deg)';
      setTimeout(() => {
        card.style.transition = 'all 0.4s cubic-bezier(0.25,1,0.5,1)';
        card.style.opacity    = '1';
        card.style.transform  = 'translateY(0) rotate(0deg)';
        if (i === 0) SoundEngine.achievement();
      }, 200 + i * 120);
    });
  };

  return pg;
}

/* ═══════════════════════════════════════
   P10 — Case Closed (Terminal Transition)
   ═══════════════════════════════════════ */
/* ═══════════════════════════════════════
   P10 — 終章 / The Finish Line
   公式：標題 + 金句 + 兩張八恰 + 留白
   ═══════════════════════════════════════ */
function buildP10() {
  const pg = document.createElement('div');
  pg.className = 'page pg-p10';
  pg.innerHTML = `
    <div class="p10-bg"></div>

    <div class="p10-inner">
      <div class="p10-chapter">P.10</div>
      <h1 class="p10-title">終點線</h1>
      <p class="p10-en">120 Hours · 11 Kilometres · The Finish</p>

      <div class="p10-quote-rule"></div>
      <blockquote class="p10-quote">
        這場馬拉松沒有排名，沒有輸贏，<br>
        只有對自己的詰問：<em>我們是否還有能力？</em><br><br>
        在年輕時，我們追求達成；<br>
        十年後，我們反思餘裕。<br><br>
        無論答案為何，這場靈魂的行走證明了——<br>
        <em>我們依舊有能力，擁抱下一個十年。</em>
      </blockquote>
      <div class="p10-quote-rule"></div>

      <!-- Two achievement photos, side by side, large -->
      <div class="p10-photos">
        <div class="p10-photo-block">
          ${surpriseImg('馬拉松的戰績.JPG','p10-photo-img','')}
          <div class="p10-photo-cap">每天平均 17,000 步 · 12.0 km</div>
        </div>
        <div class="p10-photo-block">
          ${surpriseImg('馬拉松的戰績2.JPG','p10-photo-img','')}
          <div class="p10-photo-cap">每天步行約 10.5 公里</div>
        </div>
      </div>

      <!-- CLOSED stamp -->
      <div class="p10-stamp" id="p10-stamp">CLOSED</div>
    </div>`;

  pg.__onEnter = () => {
    const stamp = pg.querySelector('#p10-stamp');
    setTimeout(() => {
      if (stamp) {
        stamp.classList.add('dropped');
        SoundEngine.stampThud?.();
      }
    }, 800);
  };

  return pg;
}

window.buildP06 = buildP06;
window.buildP07 = buildP07;
window.buildP08 = buildP08;
window.buildP09 = buildP09;
window.buildP10 = buildP10;

/* Live HTML 半頁（P01 左 40% / 右 60% 對齊翻頁引擎 50/50） */
function buildLiveHalfSpread(href, side) {
  const pg = document.createElement('div');
  pg.className = 'page pg-live pg-live-half';
  pg.dataset.half = side;
  const iframe = document.createElement('iframe');
  iframe.src = href;
  iframe.title = `${href} (${side})`;
  iframe.setAttribute('allow', 'autoplay');
  pg.appendChild(iframe);
  return pg;
}

/* Live HTML 全跨頁（P02–P10 定稿頁） */
function buildLiveSpread(href) {
  const pg = document.createElement('div');
  pg.className = 'page pg-live';
  const iframe = document.createElement('iframe');
  iframe.src = href;
  iframe.title = href;
  iframe.setAttribute('allow', 'autoplay');
  pg.appendChild(iframe);
  return pg;
}
function buildBlankPage() {
  const pg = document.createElement('div');
  pg.className = 'page pg-endpaper pg-endpaper--spacer';
  pg.dataset.side = 'left';
  return pg;
}
window.buildLiveHalfSpread = buildLiveHalfSpread;
window.buildLiveSpread = buildLiveSpread;
window.buildBlankPage = buildBlankPage;
