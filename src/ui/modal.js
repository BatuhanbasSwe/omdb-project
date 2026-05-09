import { $, escapeHtml, isValidPoster, posterArtHtml } from '../utils.js';
import { IC_STAR, IC_HEART_OUT, IC_HEART_FILL, IC_X } from './icons.js';

const scrim    = () => $('[data-modal]');
const poster   = () => $('[data-modal-poster]');
const body     = () => $('[data-modal-body]');

export function openModal() {
  const el = scrim();
  el.hidden = false;
  el.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';
  el.focus();
}

export function closeModal() {
  const el = scrim();
  el.hidden = true;
  el.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

export function renderModalLoading() {
  poster().innerHTML = '';
  body().innerHTML = '<div class="modal-loading">Yükleniyor…</div>';
  openModal();
}

export function renderModalContent(movie, isFav) {
  const {
    Title = '', Year = '', Type = 'movie', Poster,
    Runtime = 'N/A', Genre = '', Director = 'N/A',
    Actors = 'N/A', Plot = '', Awards = 'N/A',
    imdbRating = 'N/A', imdbID = '',
    Tagline,
  } = movie;

  const posterHtml = isValidPoster(Poster)
    ? `<img class="poster-art-bg" src="${escapeHtml(Poster)}" aria-hidden="true" />
       <img class="poster-art" src="${escapeHtml(Poster)}" alt="${escapeHtml(Title)} posteri" />`
    : posterArtHtml(Title, Year, Type);

  poster().innerHTML = posterHtml;

  const genres = Genre !== 'N/A' ? Genre.split(',').map(g => g.trim()) : [];
  const genreHtml = genres.map(g => `<span class="genre">${escapeHtml(g)}</span>`).join('');

  const rating = imdbRating !== 'N/A'
    ? `<span class="imdb">${IC_STAR} IMDb ${escapeHtml(imdbRating)}</span>`
    : '';

  const favClass = isFav ? ' is-on' : '';
  const favIcon  = isFav ? IC_HEART_FILL : IC_HEART_OUT;
  const favLabel = isFav ? 'Favorilerden çıkar' : 'Favorilere ekle';

  body().innerHTML = `
    <div class="modal-eyebrow">
      <span>${escapeHtml(Type)} · ${escapeHtml(Year)} · ${escapeHtml(Runtime)}</span>
      ${rating}
    </div>
    <h2 id="modal-title">${escapeHtml(Title)}</h2>
    ${Tagline ? `<div class="modal-tagline">"${escapeHtml(Tagline)}"</div>` : ''}
    ${genreHtml ? `<div class="genre-row">${genreHtml}</div>` : ''}
    <div class="kv-grid">
      <div><div class="k">Yönetmen</div><div class="v">${escapeHtml(Director)}</div></div>
      <div><div class="k">Oyuncular</div><div class="v">${escapeHtml(Actors)}</div></div>
      <div><div class="k">Süre</div><div class="v">${escapeHtml(Runtime)}</div></div>
      <div><div class="k">Ödüller</div><div class="v">${escapeHtml(Awards)}</div></div>
    </div>
    ${Plot && Plot !== 'N/A' ? `<p class="modal-plot">${escapeHtml(Plot)}</p>` : ''}
    <div class="modal-actions">
      <button class="btn btn-primary${favClass}" data-modal-fav="${escapeHtml(imdbID)}" aria-pressed="${isFav}">
        ${favIcon} ${favLabel}
      </button>
      <button class="btn btn-ghost" data-modal-close>
        ${IC_X} Kapat (ESC)
      </button>
    </div>`;

  openModal();
}

export function renderModalError(message) {
  poster().innerHTML = '';
  body().innerHTML = `
    <div class="modal-loading" style="flex-direction:column;gap:12px;color:var(--danger)">
      <span>Yüklenemedi</span>
      <small style="color:var(--muted)">${escapeHtml(message)}</small>
    </div>`;
}

export function updateModalFavButton(imdbID, isFav) {
  const btn = $(`[data-modal-fav="${CSS.escape(imdbID)}"]`);
  if (!btn) return;
  btn.className = `btn btn-primary${isFav ? ' is-on' : ''}`;
  btn.setAttribute('aria-pressed', String(isFav));
  btn.innerHTML = `${isFav ? IC_HEART_FILL : IC_HEART_OUT} ${isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}`;
}
