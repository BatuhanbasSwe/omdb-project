import { STORAGE_KEYS } from './config.js';

export function getFavorites() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites)) || []; } catch { return []; }
}
export function saveFavorites(ids) {
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(ids));
}

export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
}
export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

export function getLastSearch() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.lastSearch)) || null; } catch { return null; }
}
export function saveLastSearch(params) {
  localStorage.setItem(STORAGE_KEYS.lastSearch, JSON.stringify(params));
}
