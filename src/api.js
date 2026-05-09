import { OMDB_API_KEY, OMDB_BASE_URL } from './config.js';

const cache = new Map();
let activeController = null;

function buildUrl(params) {
  const url = new URL(OMDB_BASE_URL);
  url.searchParams.set('apikey', OMDB_API_KEY);
  for (const [key, value] of Object.entries(params)) {
    if (value === '' || value == null) continue;
    url.searchParams.set(key, value);
  }
  return url.toString();
}

function cacheKey(params) {
  return Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k] ?? ''}`)
    .join('&');
}

async function request(params, { signal } = {}) {
  const key = cacheKey(params);
  if (cache.has(key)) return cache.get(key);

  const promise = fetch(buildUrl(params), { signal }).then(async (res) => {
    if (!res.ok) {
      throw new Error(`Ağ hatası (${res.status})`);
    }
    const data = await res.json();
    if (data.Response === 'False') {
      const err = new Error(data.Error || 'Bilinmeyen hata');
      err.code = 'OMDB_ERROR';
      throw err;
    }
    return data;
  });

  cache.set(key, promise);
  try {
    return await promise;
  } catch (err) {
    cache.delete(key);
    throw err;
  }
}

export async function search({ query, type = '', year = '', page = 1 }) {
  if (!query || !query.trim()) {
    const err = new Error('Lütfen bir başlık gir.');
    err.code = 'EMPTY_QUERY';
    throw err;
  }

  if (activeController) activeController.abort();
  activeController = new AbortController();

  const data = await request(
    { s: query.trim(), type, y: year, page },
    { signal: activeController.signal },
  );

  return {
    items: data.Search ?? [],
    total: parseInt(data.totalResults ?? '0', 10),
    page,
  };
}

export async function byId(imdbID) {
  if (!imdbID) throw new Error('imdbID gerekli');
  return request({ i: imdbID, plot: 'full' });
}

export function clearCache() {
  cache.clear();
}
