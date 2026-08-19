'use client';

// Small localStorage helpers shared by the tool pages, favorites and history.

export const HISTORY_KEY = 'qtb_history';
export const FAVORITES_KEY = 'qtb_favorites';
export const SAVED_KEY = 'qtb_saved';

export function readList(key) {
  if (typeof window === 'undefined') return [];
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function writeList(key, value) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/** Record a tool visit (most recent first, de-duplicated, capped at 30). */
export function recordVisit({ slug, title, href }) {
  if (typeof window === 'undefined' || !slug) return;
  const list = readList(HISTORY_KEY).filter((x) => x && x.href !== href);
  writeList(HISTORY_KEY, [{ slug, title, href, at: Date.now() }, ...list].slice(0, 30));
}

export function isFavorite(href) {
  return readList(FAVORITES_KEY).some((x) => x && x.href === href);
}

export function toggleFavorite({ slug, title, href }) {
  const list = readList(FAVORITES_KEY);
  const exists = list.some((x) => x && x.href === href);
  const next = exists ? list.filter((x) => x && x.href !== href) : [...list, { slug, title, href }];
  writeList(FAVORITES_KEY, next);
  return !exists;
}
