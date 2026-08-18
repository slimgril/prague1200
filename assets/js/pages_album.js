/**
 * Prague1200 — Album Pages (P11–P16)
 * 每個 day = 翻頁書裡一個雜誌版面，接在 P10 後面
 */

const _ALB_META = {
  day1: { title: '抵達布拉格',        sub: 'ARRIVAL · PRAGUE' },
  day2: { title: '舊城區 · 查理大橋', sub: 'OLD TOWN · CHARLES BRIDGE' },
  day3: { title: '小城區 · 城堡山',   sub: 'MALÁ STRANA · CASTLE HILL' },
  day4: { title: '城堡區 · 皇家之路', sub: 'PRAGUE CASTLE · ROYAL ROUTE' },
  day5: { title: '庫倫洛夫',          sub: 'ČESKÝ KRUMLOV' },
  day6: { title: '維也納 · 歸途',     sub: 'VIENNA · HOMEWARD' },
};

/* ── 注入 CSS（只跑一次） ── */
function _injectAlbumCSS() {
  if (document.getElementById('_alb-css')) return;
  const s = document.createElement('style');
  s.id = '_alb-css';
  s.textContent = `
    .pg-album {
      background: #0b0b0b;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      -webkit-overflow-scrolling: touch;
    }

    /* ── 雜誌版頭（滿版橫條） ── */
    .alb-hdr {
      display: flex; align-items: center;
      padding: 0 32px;
      height: 64px; min-height: 64px;
      flex-shrink: 0;
      background: #0b0b0b;
      border-bottom: 1px solid #1e1e1e;
      position: relative;
    }
    /* 左側：品牌 */
    .alb-hdr-brand {
      font-family: -apple-system, sans-serif;
      font-size: 0.6rem; letter-spacing: 0.4em;
      color: #333; text-transform: uppercase;
      white-space: nowrap;
    }
    /* 中央：大標題（絕對置中） */
    .alb-hdr-center {
      position: absolute; left: 50%; transform: translateX(-50%);
      text-align: center; pointer-events: none;
    }
    .alb-hdr-center h2 {
      font-family: Georgia, serif;
      font-size: 1rem; font-weight: 300;
      color: #c8a84b; letter-spacing: 0.22em;
      line-height: 1;
    }
    .alb-hdr-center p {
      font-family: -apple-system, sans-serif;
      font-size: 0.55rem; letter-spacing: 0.3em;
      color: #333; margin-top: 3px;
    }
    /* 右側：計數 */
    .alb-hdr-count {
      margin-left: auto;
      font-family: -apple-system, sans-serif;
      font-size: 0.6rem; letter-spacing: 0.18em;
      color: #2a2a2a;
    }
    /* 版頭下方細金線 */
    .alb-hdr::after {
      content: '';
      position: absolute; bottom: -1px; left: 50%;
      transform: translateX(-50%);
      width: 80px; height: 1px;
      background: #c8a84b;
    }

    .alb-num {
      font-size: 4.5rem; font-weight: 300;
      color: #191919; line-height: 1;
      letter-spacing: -0.02em; user-select: none;
      font-family: Georgia, serif;
    }
    .alb-meta h2 {
      font-size: 1.05rem; font-weight: 300;
      color: #c8a84b; letter-spacing: 0.2em;
      font-family: Georgia, serif;
    }
    .alb-meta p {
      font-size: 0.6rem; letter-spacing: 0.3em;
      color: #3a3a3a; font-family: -apple-system, sans-serif;
      margin-top: 4px;
    }
    .alb-badge {
      margin-left: auto;
      font-size: 0.6rem; letter-spacing: 0.18em;
      color: #2e2e2e; font-family: -apple-system, sans-serif;
      align-self: center;
    }
    .alb-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 3px; padding: 3px;
      flex: 1 1 auto;
    }
    @media (max-width: 900px) { .alb-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 500px) { .alb-grid { grid-template-columns: repeat(2, 1fr); } }

    .alb-th {
      aspect-ratio: 4 / 3;
      overflow: hidden; background: #111;
      cursor: pointer; position: relative;
    }
    .alb-th.feat {
      grid-column: span 2;
      grid-row: span 2;
    }
    .alb-th img {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
      transition: transform 0.35s ease;
    }
    .alb-th:hover img { transform: scale(1.04); }

    /* ── Lightbox ── */
    #_alb-lb {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.93);
      z-index: 9999; align-items: center; justify-content: center;
    }
    #_alb-lb.open { display: flex; }
    #_alb-lb img {
      max-width: 90vw; max-height: 88vh;
      object-fit: contain; display: block;
    }
    #_alb-lb-close {
      position: fixed; top: 16px; right: 22px;
      background: none; border: none;
      color: rgba(255,255,255,.45); font-size: 1.7rem;
      cursor: pointer; z-index: 10000; line-height: 1;
      transition: color .2s;
    }
    #_alb-lb-close:hover { color: #fff; }
    .alb-lb-arrow {
      position: fixed; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,.07); border: none;
      color: rgba(255,255,255,.55); font-size: 2rem;
      width: 50px; height: 80px; cursor: pointer;
      z-index: 10000; border-radius: 3px;
      display: flex; align-items: center; justify-content: center;
      transition: background .2s, color .2s;
    }
    .alb-lb-arrow:hover { background: rgba(255,255,255,.16); color: #fff; }
    #_alb-lb-prev { left: 10px; }
    #_alb-lb-next { right: 10px; }
    #_alb-lb-info {
      position: fixed; bottom: 18px; left: 50%;
      transform: translateX(-50%);
      font-size: 0.62rem; letter-spacing: 0.2em;
      color: rgba(255,255,255,.3);
      font-family: -apple-system, sans-serif;
    }
  `;
  document.head.appendChild(s);
}

/* ── 建立 Lightbox DOM（只建一次） ── */
function _initAlbumLightbox() {
  if (document.getElementById('_alb-lb')) return;
  const lb = document.createElement('div');
  lb.id = '_alb-lb';
  lb.innerHTML = `
    <button id="_alb-lb-close">✕</button>
    <button class="alb-lb-arrow" id="_alb-lb-prev">‹</button>
    <img src="" alt="">
    <button class="alb-lb-arrow" id="_alb-lb-next">›</button>
    <div id="_alb-lb-info"></div>`;
  document.body.appendChild(lb);

  let _srcs = [], _i = 0;
  const lbImg  = lb.querySelector('img');
  const lbInfo = document.getElementById('_alb-lb-info');

  window._albOpen = (srcs, idx) => {
    _srcs = srcs; _i = idx;
    lbImg.src = srcs[idx];
    lbInfo.textContent = `${idx + 1}  /  ${srcs.length}`;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const move = d => {
    _i = (_i + d + _srcs.length) % _srcs.length;
    lbImg.src = _srcs[_i];
    lbInfo.textContent = `${_i + 1}  /  ${_srcs.length}`;
  };
  const close = () => {
    lb.classList.remove('open');
    lbImg.src = '';
    document.body.style.overflow = '';
  };

  document.getElementById('_alb-lb-close').addEventListener('click', close);
  document.getElementById('_alb-lb-prev').addEventListener('click', () => move(-1));
  document.getElementById('_alb-lb-next').addEventListener('click', () => move(1));
  lb.addEventListener('click', e => { if (e.target === lb) close(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'ArrowLeft')  move(-1);
    if (e.key === 'ArrowRight') move(1);
    if (e.key === 'Escape')     close();
  });
  let _tx = 0;
  lb.addEventListener('touchstart', e => { _tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend',   e => {
    const dx = e.changedTouches[0].clientX - _tx;
    if (Math.abs(dx) > 40) move(dx < 0 ? 1 : -1);
  });
}

/* ── 主函式：給 app.js 呼叫 ── */
function buildAlbumPages(daysData) {
  _injectAlbumCSS();
  _initAlbumLightbox();

  const FEAT_POS = [0, 3, 1, 4, 0, 2]; // 每天大圖在第幾張

  return daysData.map((day, di) => {
    const meta = _ALB_META[day.id] || { title: day.label, sub: '' };
    const srcs = day.photos.map(p => p.src);
    const featIdx = FEAT_POS[di] ?? 0;

    const pg = document.createElement('div');
    pg.className = 'page pg-album';

    // 版頭（雜誌橫條）
    pg.innerHTML = `
      <div class="alb-hdr">
        <span class="alb-hdr-brand">布拉格 1200 &nbsp;·&nbsp; 精選相簿</span>
        <div class="alb-hdr-center">
          <h2>${meta.title}</h2>
          <p>${meta.sub}</p>
        </div>
        <span class="alb-hdr-count">${String(di + 1).padStart(2,'0')} / 06 &nbsp;·&nbsp; ${day.count} 張</span>
      </div>`;

    // 格狀縮圖
    const grid = document.createElement('div');
    grid.className = 'alb-grid';

    day.photos.forEach((photo, pi) => {
      const th = document.createElement('div');
      th.className = pi === featIdx ? 'alb-th feat' : 'alb-th';

      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';

      th.addEventListener('click', () => window._albOpen(srcs, pi));
      th.appendChild(img);
      grid.appendChild(th);
    });

    pg.appendChild(grid);
    return pg;
  });
}
