import { escapeHtml, isValidPoster, posterArtHtml } from '../utils.js';
import { IC_HEART_OUT, IC_HEART_FILL } from './icons.js';

export function renderCard(item, isFav) {
  const title   = item.Title      || '';
  const year    = item.Year       || '';
  const id      = item.imdbID     || '';
  const type    = item.Type       || 'movie';
  const poster  = item.Poster;
  const rating  = item.imdbRating;
  const runtime = item.Runtime;

  const posterHtml = isValidPoster(poster)
    ? `<img class="poster-art" src="${escapeHtml(poster)}" alt="${escapeHtml(title)} posteri" loading="lazy" />`
    : posterArtHtml(title, year, type);

  const favClass = isFav ? ' is-fav' : '';
  const favLabel = isFav ? 'Favorilerden çıkar' : 'Favorilere ekle';
  const favIcon  = isFav ? IC_HEART_FILL : IC_HEART_OUT;

  const hasRating  = rating && rating !== 'N/A';
  const hasRuntime = runtime && runtime !== 'N/A';

  const ratingHtml = hasRating
    ? `<span class="dot"></span><span class="star-badge">★ ${escapeHtml(rating)}</span>`
    : `<span class="card-enrich-slot" data-enrich="${escapeHtml(id)}"></span>`;

  const runtimeHtml = hasRuntime
    ? `<span class="dot"></span><span class="runtime-badge">${escapeHtml(runtime)}</span>`
    : '';

  return `
    <article class="card" data-id="${escapeHtml(id)}" tabindex="0" role="button" aria-label="${escapeHtml(title)} — detayı aç">
      <div class="poster">
        <span class="type-badge t-${escapeHtml(type)}">${escapeHtml(type)}</span>
        <button class="fav-pin${favClass}" data-fav="${escapeHtml(id)}" aria-label="${favLabel}" aria-pressed="${isFav}">
          ${favIcon}
        </button>
        ${posterHtml}
      </div>
      <div class="card-meta">
        <div class="card-title">${escapeHtml(title)}</div>
        <div class="card-sub">
          <span>${escapeHtml(year)}</span>
          ${ratingHtml}
          ${runtimeHtml}
        </div>
      </div>
    </article>`;
}

export function renderSkeleton(count = 10) {
  return Array.from({ length: count }, () => `
    <article class="card skeleton" aria-hidden="true">
      <div class="poster"><div class="shimmer"></div></div>
      <div class="card-meta">
        <div class="sk-line" style="width:85%"><div class="shimmer"></div></div>
        <div class="sk-line short" style="margin-top:8px;height:9px"><div class="shimmer"></div></div>
      </div>
    </article>`).join('');
}
