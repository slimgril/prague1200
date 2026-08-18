/**
 * Prague1200 App — Main Orchestration
 */

async function init() {
  /* 1. Load photos */
  let photos = [];
  try {
    const dataUrl = 'data/photos.json';
    const resp = await fetch(dataUrl);
    const data = await resp.json();
    photos = data.photos || [];
  } catch (e) {
    console.warn('photos.json not found:', e);
  }
  setPhotos(photos);  // from pages_p1_p5.js

  /* 2a. Load album manifest */
  let albumDays = [];
  try {
    const manifestUrl = 'album-manifest.json';
    albumDays = await fetch(manifestUrl).then(r => r.json());
  } catch (e) {
    console.warn('album-manifest.json not found:', e);
  }

  /* 2b. Cover；P01–P10 用定稿 live HTML 全跨頁 */
  const liveChapters = [
    'p01-live.html','p02-live.html','p03-live.html','p04-live.html','p05-live.html',
    'p06-live.html','p07-live.html','p08-live.html','p09-live.html',
    'p10-live.html',
  ];
  const surprisePages = [
    buildCover(),
    ...liveChapters.flatMap(src => [buildBlankPage(), buildLiveSpread(src)]),
    ...buildAlbumPages(albumDays),
  ];

  /* 3. Init the flipbook */
  const book = new SoftFlipBook({
    pages: surprisePages,
    playFlipSound: () => SoundEngine.pageTurn(),
    onSpreadChange: (s, total) => {
      const ind = document.getElementById('page-indicator');
      if (ind) ind.textContent = `${s + 1} / ${total}`;
    }
  });
  window._book = book;

  /* 4. Build scroll (reading) mode */
  const scrollView = document.getElementById('scroll-view');
  if (scrollView) {
    surprisePages.forEach(p => {
      const wrap = document.createElement('div');
      wrap.className = 'scroll-pg';
      wrap.appendChild(p.cloneNode(true));
      // Trigger onEnter for scroll clones too
      if (p.__onEnter) {
        const clone = wrap.firstElementChild;
        clone.__onEnter = p.__onEnter;
        // Trigger after a tick so DOM is ready
        requestAnimationFrame(() => clone.__onEnter?.());
      }
      scrollView.appendChild(wrap);
    });
    // Add archive at bottom of scroll view
    const archDiv = document.createElement('div');
    archDiv.id = 'scroll-archive';
    archDiv.style.cssText = 'background:#F8F8F6;padding:40px 20px;max-width:720px;margin:0 auto;';
    archDiv.innerHTML = `<div style="text-align:center;margin-bottom:24px;">
      <h2 style="font-family:Georgia,serif;font-size:28px;color:#1a1a2e">Photo Archive</h2>
      <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#888;margin-top:4px">相簿附錄 · ${photos.length} 張照片</p>
    </div>`;
    scrollView.appendChild(archDiv);
  }

  /* 5. Init archive view */
  initArchive(photos);

  /* 6. Wire up nav buttons */
  document.getElementById('nav-prev')?.addEventListener('click', () => book.flipBackward());
  document.getElementById('nav-next')?.addEventListener('click', () => book.flipForward());

  /* 7. Mode switcher */
  function setMode(mode) {
    const fv = document.getElementById('flipbook-view');
    const sv = document.getElementById('scroll-view');
    const av = document.getElementById('archive-view');
    const bf = document.getElementById('btn-flip');
    const bs = document.getElementById('btn-scroll');
    const ba = document.getElementById('btn-archive');

    [fv, sv, av].forEach(el => { if (el) el.style.display = 'none'; });
    [bf, bs, ba].forEach(b => b?.classList.remove('active'));

    if (mode === 'flip') {
      if (fv) fv.style.display = 'flex';
      bf?.classList.add('active');
    } else if (mode === 'scroll') {
      if (sv) sv.style.display = 'block';
      bs?.classList.add('active');
    } else if (mode === 'archive') {
      if (av) av.style.display = 'block';
      ba?.classList.add('active');
    }
  }

  document.getElementById('btn-flip')?.addEventListener('click',    () => setMode('flip'));
  document.getElementById('btn-scroll')?.addEventListener('click',  () => setMode('scroll'));
  document.getElementById('btn-archive')?.addEventListener('click', () => setMode('archive'));

  /* 8. Sound toggle */
  document.getElementById('btn-sound')?.addEventListener('click', () => {
    const on = SoundEngine.toggle();
    const btn = document.getElementById('btn-sound');
    if (btn) btn.textContent = on ? '🔊' : '🔇';
  });
}

document.addEventListener('DOMContentLoaded', init);
