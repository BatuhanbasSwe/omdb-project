import { $, escapeHtml } from '../utils.js';
import { IC_HEART_OUT } from './icons.js';
import { renderCard, renderSkeleton } from './card.js';

const grid        = () => $('[data-results-grid]');
const favGrid     = () => $('[data-favorites-grid]');
const homeSection = () => $('[data-home-section]');
const homeGrid    = () => $('[data-home-grid]');
const homeCatTitle= () => $('[data-home-cat-title]');
const homeCount   = () => $('[data-home-count]');
const status      = () => $('[data-results-status]');
const metaEl      = () => $('[data-results-meta]');
const titleEl     = () => $('[data-results-title]');
const countEl     = () => $('[data-results-count]');
const paginEl     = () => $('[data-pagination]');
const pageInfo    = () => $('[data-page-info]');
const btnPrev     = () => $('[data-page-prev]');
const btnNext     = () => $('[data-page-next]');

function setMeta(titleHtml, countText) {
  titleEl().innerHTML = titleHtml;
  countEl().textContent = countText;
  metaEl().hidden = false;
}

function clearStatus() {
  const s = status();
  s.textContent = '';
  s.removeAttribute('data-tone');
}

/* ---- Home section show/hide ---- */
const loadMoreWrapEl = () => $('[data-load-more-wrap]');

export function showHomeSection() {
  homeSection().hidden = false;
  grid().hidden = true;
  favGrid().hidden = true;
  favGrid().innerHTML = '';
  metaEl().hidden = true;
  paginEl().hidden = true;
  clearStatus();
}

export function hideHomeSection() {
  homeSection().hidden = true;
  const lm = loadMoreWrapEl();
  if (lm) lm.hidden = true;
  grid().hidden = false;
}

/* ---- Home grid rendering ---- */
export function renderHomeGrid(items, catLabel, favorites, isLoading = false) {
  const tEl = homeCatTitle();
  const cEl = homeCount();
  if (tEl) tEl.textContent = catLabel;
  if (cEl) cEl.textContent = items.length ? `${items.length} başlık` : '';
  
  if (isLoading) {
    homeGrid().innerHTML = renderSkeleton(10);
  } else if (items.length === 0) {
    homeGrid().innerHTML = `<div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 4rem 0; color: var(--text-secondary);">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 1rem; opacity: 0.5;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>Gösterilecek içerik bulunamadı veya API günlük limiti aşıldı.</p>
    </div>`;
  } else {
    homeGrid().innerHTML = items.map(item => renderCard(item, favorites.includes(item.imdbID))).join('');
  }
}

/* ---- Skeleton while loading ---- */
export function showSkeleton() {
  clearStatus();
  paginEl().hidden = true;
  grid().innerHTML = renderSkeleton(10);
  document.querySelector('main').setAttribute('aria-busy', 'true');
}

/* ---- Render search results grid ---- */
export function showResults(items, query, total, page, favorites) {
  clearStatus();
  document.querySelector('main').setAttribute('aria-busy', 'false');

  const totalPages = Math.ceil(total / 10);
  const from = (page - 1) * 10 + 1;
  const to   = Math.min(page * 10, total);

  setMeta(
    `Sonuçlar: <strong>"${escapeHtml(query)}"</strong>`,
    `${from}–${to} / ${total} başlık`,
  );

  grid().innerHTML = items.map(item => renderCard(item, favorites.includes(item.imdbID))).join('');

  if (totalPages > 1) {
    pageInfo().innerHTML = `Sayfa <strong>${page}</strong> / <strong>${totalPages}</strong>`;
    btnPrev().disabled = page <= 1;
    btnNext().disabled = page >= totalPages;
    paginEl().hidden = false;
  } else {
    paginEl().hidden = true;
  }
}

/* ---- Re-render search grid with genre filter applied ---- */
export function filterAndShowCards(items, favorites) {
  grid().innerHTML = items.map(item => renderCard(item, favorites.includes(item.imdbID))).join('');
}

/* ---- Render favorites grid ---- */
export function showFavorites(items, favorites) {
  clearStatus();
  metaEl().hidden = true;
  paginEl().hidden = true;
  grid().innerHTML = '';
  grid().hidden = true;

  const fg = favGrid();
  fg.hidden = false;

  if (items.length === 0) {
    fg.innerHTML = emptyFavoritesHtml();
    return;
  }

  fg.innerHTML = items.map(item => renderCard(item, favorites.includes(item.imdbID))).join('');
}

export function hideFavoritesGrid() {
  const fg = favGrid();
  fg.hidden = true;
  fg.innerHTML = '';
  grid().hidden = false;
}

/* ---- Sync fav-pin state without full re-render ---- */
export function updateCardFavPin(imdbID, isFav) {
  document.querySelectorAll(`[data-fav="${CSS.escape(imdbID)}"]`).forEach(btn => {
    btn.className = `fav-pin${isFav ? ' is-fav' : ''}`;
    btn.setAttribute('aria-pressed', String(isFav));
    btn.setAttribute('aria-label', isFav ? 'Favorilerden çıkar' : 'Favorilere ekle');
    btn.innerHTML = isFav
      ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  });
}

/* ---- Error and empty states ---- */
export function showError(message) {
  clearStatus();
  paginEl().hidden = true;
  metaEl().hidden = true;
  grid().innerHTML = `
    <div class="error-state" style="grid-column:1/-1">
      <div class="empty-art danger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </div>
      <h3>Film bulunamadı</h3>
      <p>${escapeHtml(message)}</p>
      <div class="hint">Yazımı kontrol et veya yıl filtresini kaldır</div>
    </div>`;
  document.querySelector('main').setAttribute('aria-busy', 'false');
}

export function showEmpty(query) {
  clearStatus();
  paginEl().hidden = true;
  metaEl().hidden = true;
  grid().innerHTML = `
    <div class="error-state" style="grid-column:1/-1">
      <div class="empty-art danger">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </div>
      <h3>Sonuç bulunamadı</h3>
      <p><strong>"${escapeHtml(query)}"</strong> için herhangi bir sonuç bulunamadı. Yazımı kontrol et veya filtreni değiştir.</p>
    </div>`;
  document.querySelector('main').setAttribute('aria-busy', 'false');
}

export function showInitialState() {
  clearStatus();
  paginEl().hidden = true;
  metaEl().hidden = true;
  grid().innerHTML = '';
}

function emptyFavoritesHtml() {
  return `
    <div class="empty-state" style="grid-column:1/-1">
      <div class="empty-art">
        ${IC_HEART_OUT}
      </div>
      <h3>Henüz favori yok</h3>
      <p>Herhangi bir film kartındaki kalp ikonuna tıklayarak favorilere ekleyebilirsin.</p>
      <div class="hint">Arama sekmesini dene →</div>
    </div>`;
}
