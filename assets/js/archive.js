/**
 * Prague1200 — Back Half: Daily Photo Archive
 * Low-key white/light-grey grid — the "隨行日常流水帳"
 */

let _archivePhotos = [];
let _archiveFilter = 'all';
let _lightboxList  = [];
let _lightboxIdx   = 0;

function initArchive(photos) {
  _archivePhotos = photos;
  buildArchiveUI();
}

function buildArchiveUI() {
  const view = document.getElementById('archive-view');
  if (!view) return;

  view.innerHTML = `
    <div class="archive-topbar">
      <h1 class="archive-title">Photo Archive</h1>
      <p class="archive-sub">相簿附錄 · 隨行日常足跡 · ${_archivePhotos.length} Photos</p>
    </div>
    <div class="archive-filters" id="arch-filters">
      <button class="arch-filter active" data-f="all">全部 All</button>
      <button class="arch-filter" data-f="day1">Day 1 · 布拉格</button>
      <button class="arch-filter" data-f="day2">Day 2 · 城堡</button>
      <button class="arch-filter" data-f="day3">Day 3 · CK</button>
      <button class="arch-filter" data-f="day4">Day 4 · 溫泉</button>
    </div>
    <div class="archive-masonry" id="arch-grid"></div>
    <div id="arch-lightbox" class="arch-lightbox">
      <span class="lb-close" id="lb-close">×</span>
      <span class="lb-nav lb-prev" id="lb-prev">‹</span>
      <img id="lb-img" src="" alt="">
      <span class="lb-nav lb-next" id="lb-next">›</span>
      <div class="lb-caption" id="lb-caption"></div>
    </div>`;

  // Filter events
  view.querySelectorAll('.arch-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      view.querySelectorAll('.arch-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      _archiveFilter = btn.dataset.f;
      renderGrid();
    });
  });

  // Lightbox events
  document.getElementById('lb-close')?.addEventListener('click', closeLightbox);
  document.getElementById('lb-prev')?.addEventListener('click', () => moveLightbox(-1));
  document.getElementById('lb-next')?.addEventListener('click', () => moveLightbox(1));
  document.getElementById('arch-lightbox')?.addEventListener('click', e => {
    if (e.target.id === 'arch-lightbox') closeLightbox();
  });
  document.addEventListener('keydown', e => {
    if (!document.getElementById('arch-lightbox')?.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  moveLightbox(-1);
    if (e.key === 'ArrowRight') moveLightbox(1);
  });

  renderGrid();
}

function renderGrid() {
  const grid = document.getElementById('arch-grid');
  if (!grid) return;

  const filtered = _archiveFilter === 'all'
    ? _archivePhotos
    : _archivePhotos.filter(p => p.day === _archiveFilter);

  _lightboxList = filtered;

  grid.innerHTML = filtered.map((p, i) => {
    const src = window.photoSrc ? window.photoSrc(p) : '';
    return `
      <div class="arch-item" data-idx="${i}" style="animation-delay:${Math.min(i*0.03,0.8)}s">
        <img src="${src}" alt="" loading="lazy"
             onerror="this.parentElement.classList.add('missing')">
        <div class="arch-overlay">
          <span class="arch-date">${(p.datetime||'').split(' ')[1]||''}</span>
        </div>
      </div>`;
  }).join('');

  grid.querySelectorAll('.arch-item').forEach(item => {
    item.addEventListener('click', () => openLightbox(parseInt(item.dataset.idx)));
  });
}

function openLightbox(idx) {
  _lightboxIdx = idx;
  const lb = document.getElementById('arch-lightbox');
  if (!lb) return;
  lb.classList.add('active');
  updateLightbox();
}
function closeLightbox() {
  document.getElementById('arch-lightbox')?.classList.remove('active');
}
function moveLightbox(dir) {
  _lightboxIdx = (_lightboxIdx + dir + _lightboxList.length) % _lightboxList.length;
  updateLightbox();
}
function updateLightbox() {
  const p   = _lightboxList[_lightboxIdx];
  const img = document.getElementById('lb-img');
  const cap = document.getElementById('lb-caption');
  if (!p || !img) return;
  const src = window.photoSrc ? window.photoSrc(p) : '';
  img.src = src;
  if (cap) cap.textContent =
    `${p.day} · ${p.datetime || ''} · ${_lightboxIdx + 1} / ${_lightboxList.length}`;
}

window.initArchive = initArchive;
