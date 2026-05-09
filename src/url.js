export function getUrlParams() {
  const p = new URLSearchParams(location.search);
  return {
    q: p.get('q') || '',
    type: p.get('type') || '',
    year: p.get('year') || '',
    sort: p.get('sort') || 'relevance',
    page: Math.max(1, parseInt(p.get('page') || '1', 10)),
  };
}

export function setUrlParams({ q, type, year, sort, page }) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (type) p.set('type', type);
  if (year) p.set('year', year);
  if (sort && sort !== 'relevance') p.set('sort', sort);
  if (page && page > 1) p.set('page', String(page));
  const newUrl = p.toString() ? `?${p.toString()}` : location.pathname;
  history.replaceState(null, '', newUrl);
}
