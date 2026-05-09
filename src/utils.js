export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function debounce(fn, wait = 250) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

export function escapeHtml(value) {
  if (value == null) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isValidPoster(poster) {
  return poster && poster !== 'N/A' && poster.startsWith('http');
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/* ---- Poster art (placeholder when no real poster available) ---- */
const PALETTES = [
  { p1: '#1d2840', p2: '#06070d', p3: 'rgba(255,210,140,0.32)', text: '#fff5e0', glyph: 'C' },
  { p1: '#2a1620', p2: '#0a0509', p3: 'rgba(255,160,160,0.28)', text: '#ffe8e8', glyph: '◈' },
  { p1: '#0f2b2a', p2: '#04100f', p3: 'rgba(140,255,210,0.28)', text: '#e0fff5', glyph: '◉' },
  { p1: '#241a36', p2: '#0a0712', p3: 'rgba(190,160,255,0.28)', text: '#ede5ff', glyph: '◇' },
  { p1: '#332210', p2: '#0c0805', p3: 'rgba(255,180,90,0.32)', text: '#ffeacb', glyph: '◎' },
  { p1: '#10243a', p2: '#040a14', p3: 'rgba(140,180,255,0.30)', text: '#e0ecff', glyph: '⊹' },
  { p1: '#2c1a0e', p2: '#0c0604', p3: 'rgba(255,140,80,0.30)', text: '#ffe2cc', glyph: '△' },
  { p1: '#1a2c1a', p2: '#040a04', p3: 'rgba(180,255,150,0.28)', text: '#e6ffd9', glyph: '⦿' },
];

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function posterArtHtml(title, year, type) {
  const seed = hashStr(String(title));
  const pal = PALETTES[seed % PALETTES.length];
  const glyphRot = (seed % 60) - 30;
  const glyphX = 20 + (seed % 50);
  const glyphY = 50 + ((seed >> 3) % 25);
  const cssVars = `--p1:${pal.p1};--p2:${pal.p2};--p3:${pal.p3};--p-text:${pal.text}`;
  const glyphStyle = [
    'font-size:180px',
    'font-weight:800',
    `transform:translate(-50%,-50%) rotate(${glyphRot}deg)`,
    `left:${glyphX}%`,
    `top:${glyphY}%`,
    `color:${pal.text}`,
    'line-height:1',
    'position:absolute',
  ].join(';');

  return `<div class="poster-art" style="${cssVars}">
    <div class="pa-glyph" style="${glyphStyle}">${pal.glyph}</div>
    <div class="pa-title">${escapeHtml(title)}</div>
    <div class="pa-meta">
      <span>${escapeHtml(type || 'film')}</span>
      <span>${escapeHtml(year || '')}</span>
    </div>
  </div>`;
}
