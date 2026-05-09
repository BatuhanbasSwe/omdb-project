import { search, byId } from './api.js';
import { $, $$, escapeHtml } from './utils.js';
import { getFavorites, saveFavorites, getTheme, saveTheme, getLastSearch, saveLastSearch } from './storage.js';
import { getUrlParams, setUrlParams } from './url.js';
import { TOP_MOVIES, TOP_SERIES, NEW_RELEASES } from './top250.js';
import {
  showSkeleton, showResults, showError, showEmpty,
  showInitialState, showFavorites, hideFavoritesGrid,
  updateCardFavPin, filterAndShowCards,
  showHomeSection, hideHomeSection, renderHomeGrid,
} from './ui/results.js';
import {
  renderModalLoading, renderModalContent, renderModalError,
  closeModal, updateModalFavButton,
} from './ui/modal.js';

/* ---- State ---- */
const HOME_PAGE_SIZE = 20;

const state = {
  view: 'search',       // 'home' | 'search' | 'favorites'
  homeCategory: 'movies', // 'movies' | 'series' | 'new'
  query: '',
  type: '',
  year: '',
  sort: 'relevance',
  genre: '',            // search genre filter
  homeGenre: '',        // home genre filter
  page: 1,
  loading: false,
  favorites: [],
  theme: 'dark',
  activeId: null,
  lastResults: [],
  lastTotal: 0,
  enrichedItems: [],    // lastResults enriched with Genre/Runtime/Rating
  homeData:   { movies: [], series: [], new: [] }, // loaded items per category
  homeOffset: { movies: 0,  series: 0,  new: 0  }, // how many IDs already fetched
  homeLoading:{ movies: false, series: false, new: false }, // race condition guard
};

/* ---- DOM refs ---- */
const searchForm     = $('[data-search-form]');
const searchInput    = $('[data-search-input]');
const clearBtn       = $('[data-search-clear]');
const filterType     = $('[data-filter-type]');
const filterYear     = $('[data-filter-year]');
const filterSort     = $('[data-filter-sort]');
const themeToggle    = $('[data-theme-toggle]');
const tabBtns        = $$('[data-view]');
const homeCatBtns    = $$('[data-home-cat]');
const favCountBadge  = $('[data-favorites-count]');
const scrim          = $('[data-modal]');
const pagePrev       = $('[data-page-prev]');
const pageNext       = $('[data-page-next]');
const searchSection  = $('[data-view-section="search"]');
const favSection     = $('[data-view-section="favorites"]');
const homeHeroSection= $('[data-view-section="home"]');
const genreFilter    = $('[data-genre-filter]');
const homeGenreFilter= $('[data-home-genre-filter]');
const loadMoreWrap   = $('[data-load-more-wrap]');
const loadMoreBtn    = $('[data-home-load-more]');

/* ---- Theme ---- */
function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  saveTheme(theme);
}

/* ---- Favorites badge ---- */
function syncFavBadge() {
  const count = state.favorites.length;
  favCountBadge.textContent = count;
  favCountBadge.classList.toggle('is-empty', count === 0);
}

/* ---- Sort results (client-side) ---- */
function applySortLocal(items) {
  if (state.sort === 'year-desc') {
    return [...items].sort((a, b) => parseInt(b.Year || '0') - parseInt(a.Year || '0'));
  }
  if (state.sort === 'title-asc') {
    return [...items].sort((a, b) => (a.Title || '').localeCompare(b.Title || ''));
  }
  return items;
}

/* ---- Genre filter (client-side, after enrichment) ---- */
function applyGenreFilter(genre) {
  state.genre = genre;

  /* Update chip active states */
  document.querySelectorAll('[data-genre]').forEach(btn => {
    btn.classList.toggle('is-on', btn.dataset.genre === genre);
  });

  const source = state.enrichedItems.length ? state.enrichedItems : state.lastResults;
  if (!source.length) return;

  const filtered = genre
    ? source.filter(item => (item.Genre || '').toLowerCase().includes(genre.toLowerCase()))
    : source;

  filterAndShowCards(filtered, state.favorites);
}

/* ---- URL sync ---- */
function syncUrl() {
  if (state.view !== 'search') return;
  setUrlParams({
    q: state.query,
    type: state.type,
    year: state.year,
    sort: state.sort,
    page: state.page,
  });
}

/* ---- Background enrichment: fetch rating/runtime/genre for search cards ---- */
async function enrichSearchCards(items) {
  const results = await Promise.allSettled(items.map(item => byId(item.imdbID)));
  const enriched = [];

  results.forEach((r, i) => {
    const base = items[i];
    if (r.status !== 'fulfilled') {
      enriched.push(base);
      return;
    }
    const m = r.value;
    enriched.push(m);

    /* Update DOM enrich slots */
    const slot = document.querySelector(`[data-results-grid] [data-enrich="${CSS.escape(m.imdbID)}"]`);
    if (!slot) return;
    const parts = [];
    if (m.imdbRating && m.imdbRating !== 'N/A') {
      parts.push(`<span class="dot"></span><span class="star-badge">★ ${escapeHtml(m.imdbRating)}</span>`);
    }
    if (m.Runtime && m.Runtime !== 'N/A') {
      parts.push(`<span class="dot"></span><span class="runtime-badge">${escapeHtml(m.Runtime)}</span>`);
    }
    if (parts.length) slot.outerHTML = parts.join('');
  });

  state.enrichedItems = enriched;

  /* Re-apply genre filter if one is active */
  if (state.genre) applyGenreFilter(state.genre);
}

/* ---- Core search ---- */
async function runSearch() {
  if (!state.query.trim()) return;
  if (state.loading) return;

  state.loading = true;
  state.enrichedItems = [];
  showSkeleton();

  try {
    const data = await search({
      query: state.query,
      type: state.type,
      year: state.year,
      page: state.page,
    });

    const items = applySortLocal(data.items);
    state.lastResults = items;
    state.lastTotal   = data.total;
    state.loading     = false;

    if (items.length === 0) {
      showEmpty(state.query);
    } else {
      showResults(items, state.query, data.total, state.page, state.favorites);
      /* Reset genre filter chip to "Tümü" when new search runs */
      applyGenreFilter(state.genre);
      enrichSearchCards(items); // background — no await
    }

    syncUrl();
    saveLastSearch({ q: state.query, type: state.type, year: state.year, sort: state.sort, page: state.page });
  } catch (err) {
    state.loading = false;
    if (err.name === 'AbortError') return;
    showError(err.message || 'Bir hata oluştu.');
  }
}

/* ---- Card / detail modal ---- */
async function openCard(imdbID) {
  state.activeId = imdbID;
  renderModalLoading();
  try {
    const movie = await byId(imdbID);
    const isFav = state.favorites.includes(imdbID);
    renderModalContent(movie, isFav);
  } catch (err) {
    renderModalError(err.message || 'Detay yüklenemedi.');
  }
}

/* ---- Favorites ---- */
function toggleFav(imdbID) {
  const idx = state.favorites.indexOf(imdbID);
  if (idx === -1) {
    state.favorites = [...state.favorites, imdbID];
  } else {
    state.favorites = state.favorites.filter(id => id !== imdbID);
  }
  saveFavorites(state.favorites);
  syncFavBadge();

  const isFav = state.favorites.includes(imdbID);
  updateCardFavPin(imdbID, isFav);
  updateModalFavButton(imdbID, isFav);

  if (state.view === 'favorites') loadFavoritesView();
}

/* ---- Home category labels ---- */
const HOME_CAT_LABELS = {
  movies: 'Top 250 Film',
  series: 'Top 250 Dizi',
  new:    'Son Çıkanlar',
};
const HOME_CAT_IDS = {
  movies: TOP_MOVIES,
  series: TOP_SERIES,
  new:    NEW_RELEASES,
};

/* ---- Home Genre filter ---- */
function applyHomeGenreFilter(genre) {
  state.homeGenre = genre;
  if (homeGenreFilter) {
    homeGenreFilter.querySelectorAll('[data-genre]').forEach(btn => {
      btn.classList.toggle('is-on', btn.dataset.genre === genre);
    });
  }
  renderHomeView();
}

function renderHomeView() {
  const cat = state.homeCategory;
  const source = state.homeData[cat] || [];

  // Sort by IMDb rating descending
  const sortedSource = [...source].sort((a, b) => {
    const ratingA = parseFloat(a.imdbRating) || 0;
    const ratingB = parseFloat(b.imdbRating) || 0;
    return ratingB - ratingA;
  });

  const filtered = state.homeGenre
    ? sortedSource.filter(item => (item.Genre || '').toLowerCase().includes(state.homeGenre.toLowerCase()))
    : sortedSource;
  renderHomeGrid(filtered, HOME_CAT_LABELS[cat], state.favorites);
  updateLoadMoreBtn(cat);
}

/* ---- Home load more helpers ---- */
function updateLoadMoreBtn(cat) {
  const ids = HOME_CAT_IDS[cat];
  const hasMore = state.homeOffset[cat] < ids.length;
  if (loadMoreWrap) loadMoreWrap.hidden = !hasMore;
}

/* ---- Switch home category ---- */
function setHomeCategory(cat) {
  state.homeCategory = cat;
  homeCatBtns.forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.homeCat === cat);
  });

  /* If already have data, render and update button */
  if (state.homeData[cat].length > 0) {
    renderHomeView();
    return;
  }

  /* Fresh load: reset offset and fetch first batch */
  state.homeOffset[cat] = 0;
  loadHomeCategoryBatch(cat);
}

async function loadHomeCategoryBatch(cat) {
  if (state.homeLoading[cat]) return;
  
  const ids = HOME_CAT_IDS[cat];
  const offset = state.homeOffset[cat];
  const batch = ids.slice(offset, offset + HOME_PAGE_SIZE);
  if (!batch.length) return;

  state.homeLoading[cat] = true;

  /* Show skeletons only on first load */
  if (offset === 0) {
    renderHomeGrid([], HOME_CAT_LABELS[cat], state.favorites, true);
  }

  try {
    const results = await Promise.allSettled(batch.map(id => byId(id)));
    const loaded = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .filter(m => m?.imdbID);

    // For curated lists, drop anything below 7.0 — new releases are exempt (may lack votes)
    const MIN_HOME_RATING = 7.0;
    const ratingFiltered = cat === 'new'
      ? loaded
      : loaded.filter(m => parseFloat(m.imdbRating) >= MIN_HOME_RATING);

    // Deduplicate to prevent any manual duplicates in top250 arrays
    const newItems = ratingFiltered.filter(m => !state.homeData[cat].some(existing => existing.imdbID === m.imdbID));

    state.homeOffset[cat] = offset + batch.length;
    state.homeData[cat] = [...state.homeData[cat], ...newItems];

    /* Only render if still on this category */
    if (state.view === 'home' && state.homeCategory === cat) {
      renderHomeView();
    }
  } finally {
    state.homeLoading[cat] = false;
  }
}

/* ---- View switching ---- */
function switchView(view) {
  const prevView = state.view;
  state.view = view;
  tabBtns.forEach(btn => {
    const active = btn.dataset.view === view;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  });

  const isSearch    = view === 'search';
  const isFavorites = view === 'favorites';
  const isHome      = view === 'home';

  searchSection.hidden     = !isSearch;
  favSection.hidden        = !isFavorites;
  homeHeroSection.hidden   = !isHome;

  if (isHome) {
    history.replaceState(null, '', location.pathname);
    showHomeSection();
    setHomeCategory(state.homeCategory);
  } else if (isSearch) {
    hideHomeSection();
    hideFavoritesGrid();
    if (prevView === 'home') {
      /* Keşfet'ten gelince temiz başlangıç — input sıfırla, sonuç gösterme */
      searchInput.value = '';
      clearBtn.hidden = true;
      showInitialState();
    } else if (state.lastResults.length > 0) {
      showResults(state.lastResults, state.query, state.lastTotal, state.page, state.favorites);
      if (state.genre) applyGenreFilter(state.genre);
    } else {
      showInitialState();
    }
  } else {
    history.replaceState(null, '', location.pathname);
    hideHomeSection();
    loadFavoritesView();
  }
}

/* ---- Favorites view ---- */
async function loadFavoritesView() {
  if (state.favorites.length === 0) {
    showFavorites([], state.favorites);
    return;
  }

  showFavorites(
    state.favorites.map(id => ({ imdbID: id, Title: id, Year: '', Type: 'movie', Poster: 'N/A' })),
    state.favorites,
  );

  const results = await Promise.allSettled(state.favorites.map(id => byId(id)));
  const movies = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  showFavorites(movies, state.favorites);
}

/* ---- Filter segment ---- */
function setTypeFilter(value) {
  state.type = value;
  state.page = 1;
  $$('[data-type-val]').forEach(btn => {
    btn.classList.toggle('is-on', btn.dataset.typeVal === value);
  });
}

/* ---- Event binding ---- */
function bindEvents() {
  /* Search submit */
  searchForm.addEventListener('submit', e => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (!q) return;
    state.query = q;
    state.page  = 1;
    if (state.view !== 'search') switchView('search');
    runSearch();
  });

  /* Search input — show/hide clear button */
  searchInput.addEventListener('input', () => {
    clearBtn.hidden = !searchInput.value;
  });

  /* Clear button */
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.hidden = true;
    searchInput.focus();
  });

  /* Type segment */
  filterType.addEventListener('click', e => {
    const btn = e.target.closest('[data-type-val]');
    if (!btn) return;
    setTypeFilter(btn.dataset.typeVal);
    if (state.query) runSearch();
  });

  /* Year filter */
  filterYear.addEventListener('change', () => {
    state.year = filterYear.value;
    state.page = 1;
    if (state.query) runSearch();
  });

  /* Sort filter */
  filterSort.addEventListener('change', () => {
    state.sort = filterSort.value;
    state.page = 1;
    if (state.query) runSearch();
  });

  /* Genre chips */
  if (genreFilter) {
    genreFilter.addEventListener('click', e => {
      const chip = e.target.closest('[data-genre]');
      if (!chip) return;
      applyGenreFilter(chip.dataset.genre);
    });
  }

  /* Home Genre chips */
  if (homeGenreFilter) {
    homeGenreFilter.addEventListener('click', e => {
      const chip = e.target.closest('[data-genre]');
      if (!chip) return;
      applyHomeGenreFilter(chip.dataset.genre);
    });
  }

  /* Home category tabs */
  homeCatBtns.forEach(btn => {
    btn.addEventListener('click', () => setHomeCategory(btn.dataset.homeCat));
  });

  /* Load More */
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      loadHomeCategoryBatch(state.homeCategory);
    });
  }

  /* Main tab buttons */
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  /* Theme toggle */
  themeToggle.addEventListener('click', () => {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark');
  });

  /* Card grid — event delegation */
  document.addEventListener('click', e => {
    const favPin = e.target.closest('[data-fav]');
    if (favPin) {
      e.stopPropagation();
      toggleFav(favPin.dataset.fav);
      return;
    }

    const card = e.target.closest('.card:not(.skeleton)');
    if (card && card.dataset.id) {
      openCard(card.dataset.id);
      return;
    }

    const modalFavBtn = e.target.closest('[data-modal-fav]');
    if (modalFavBtn) {
      toggleFav(modalFavBtn.dataset.modalFav);
      return;
    }

    if (e.target.closest('[data-modal-close]') || e.target === scrim) {
      closeModal();
    }
  });

  /* ESC closes modal, / focuses search */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !scrim.hidden) closeModal();
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      if (state.view !== 'search') switchView('search');
      searchInput.focus();
    }
  });

  /* Card keyboard activation */
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const card = e.target.closest('.card:not(.skeleton)');
      if (card && card.dataset.id) openCard(card.dataset.id);
    }
  });

  /* Pagination */
  pagePrev.addEventListener('click', () => {
    state.page = Math.max(1, state.page - 1);
    runSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  pageNext.addEventListener('click', () => {
    state.page += 1;
    runSearch();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ---- Init ---- */
function init() {
  applyTheme(getTheme());

  state.favorites = getFavorites();
  syncFavBadge();

  const urlParams  = getUrlParams();
  const lastSearch = getLastSearch();

  const initial = urlParams.q
    ? urlParams
    : (lastSearch?.q ? lastSearch : null);

  if (initial) {
    state.query = initial.q;
    state.type  = initial.type  || '';
    state.year  = initial.year  || '';
    state.sort  = initial.sort  || 'relevance';
    state.page  = initial.page  || 1;

    searchInput.value = state.query;
    clearBtn.hidden   = !state.query;

    setTypeFilter(state.type);
    filterYear.value = state.year;
    filterSort.value = state.sort;
  }

  bindEvents();

  if (state.query) {
    runSearch();
  }
}

document.addEventListener('DOMContentLoaded', init);
