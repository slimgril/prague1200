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

  /* 2b. 翻頁順序：每一個 pXX-live.html 就是一個完整跨頁（左右兩頁一起，一顆
     iframe 撐滿整個書本寬度），P00 封面到 P11 封底，共 12 個跨頁。
     每個跨頁另外配一張同比例 WebP 靜態預覽圖（previews/pXX.webp），只在翻頁
     動畫過程中短暫使用，翻頁本身絕不去複製/重新載入互動網址。 */
  /* 每個 pXX-live.html 是獨立網址，瀏覽器／GitHub Pages CDN 對它沒有任何
     cache-busting，跟 style.css／flipbook.js／pages_*.js 不一樣（那些每次
     改完都會記得把 index.html 裡的 ?v= 往上加）。這造成好幾次「明明已經
     修好、也確認 push 上去了，但讀者那邊看起來還是舊的」的誤會（例如 P09、
     P10）。修法：每個跨頁網址也統一加上 ?v=CHAPTER_ASSET_VERSION，之後只
     要有任何一個 pXX-live.html 內容變動，就把這個版本號 +1，瀏覽器就會直接
     抓新的，不會再被舊的快取檔卡住。 */
  const CHAPTER_ASSET_VERSION = 5;
  const spreads = Array.from({ length: 12 }, (_, i) => {
    const id = 'p' + String(i).padStart(2, '0');
    return { title: id, url: `${id}-live.html?v=${CHAPTER_ASSET_VERSION}`, preview: `previews/${id}.webp` };
  });

  /* 3. Init the flipbook（跨頁預載管理器內建在 SoftFlipBook 裡：目前跨頁
     一顯示完成就背景準備下一跨頁，翻頁動畫本身一定等內容 ready 才開始，
     「載入中」提示也由 flipbook.js 在需要時自己顯示/收起，這裡不用管） */
  const book = new SoftFlipBook({
    spreads,
    playFlipSound: () => SoundEngine.pageTurn(),
    onSpreadChange: (s, total) => {
      const ind = document.getElementById('page-indicator');
      if (ind) ind.textContent = `${s + 1} / ${total}`;
    }
  });
  window._book = book;

  /* 4. Build scroll (reading) mode：獨立產生自己的 iframe，
     跟翻頁書的唯一互動 iframe 互不影響 */
  const scrollView = document.getElementById('scroll-view');
  if (scrollView) {
    spreads.forEach(sp => {
      const wrap = document.createElement('div');
      wrap.className = 'scroll-pg';
      wrap.appendChild(buildLiveSpread(sp.url));
      scrollView.appendChild(wrap);
    });
    // 相簿附錄（沿用既有的縮圖格狀版面，接在章節之後）
    buildAlbumPages(albumDays).forEach(p => {
      const wrap = document.createElement('div');
      wrap.className = 'scroll-pg';
      wrap.appendChild(p);
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
  document.getElementById('btn-archive')?.addEventListener('click', () => window.open('album.html', '_blank'));

  /* 8. Sound toggle */
  document.getElementById('btn-sound')?.addEventListener('click', () => {
    const on = SoundEngine.toggle();
    const btn = document.getElementById('btn-sound');
    if (btn) btn.textContent = on ? '🔊' : '🔇';
  });

  /* 9. 第一次互動就自動打開音效：SoundEngine 預設是關的（🔇），配樂全靠
     那顆小小的按鈕才能聽到，讀者常常沒注意到那顆鈕，一直以為「配樂壞了」
     （P06／P08／P10 都回報過同樣狀況）。瀏覽器的自動播放限制只要求「使用者
     跟這個網站互動過一次」，翻頁、點照片本身就已經算數，不需要特地點那顆
     鈕才行——這裡改成只要讀者第一次點擊／觸控／按鍵盤，就自動打開音效，
     除非那第一下就是點在音效鈕本身（那顆鈕自己的開關邏輯優先，不要搶著
     處理，否則會變成「點兩下才會有聲音」）。 */
  function autoEnableSoundOnFirstInteraction(e) {
    if (e.target?.closest?.('#btn-sound')) return; // 交給上面按鈕自己的開關邏輯
    document.removeEventListener('pointerdown', autoEnableSoundOnFirstInteraction, true);
    document.removeEventListener('keydown',     autoEnableSoundOnFirstInteraction, true);
    if (!SoundEngine.isEnabled()) {
      SoundEngine.enable();
      const btn = document.getElementById('btn-sound');
      if (btn) { btn.textContent = '🔊'; btn.title = 'Sound On'; }
    }
  }
  document.addEventListener('pointerdown', autoEnableSoundOnFirstInteraction, true);
  document.addEventListener('keydown',     autoEnableSoundOnFirstInteraction, true);
}

document.addEventListener('DOMContentLoaded', init);
