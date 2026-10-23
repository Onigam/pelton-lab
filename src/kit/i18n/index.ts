// Tiny i18n layer: every user-facing text is either a UI key (see ui.ts) or an inline
// bilingual object `{ fr, en }` stored next to the data it describes.

export type Lang = 'fr' | 'en';
export interface L {
  fr: string;
  en: string;
}

const STORAGE_KEY = 'pelton-lab:lang';
const listeners = new Set<(lang: Lang) => void>();

function detect(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    /* storage unavailable: fall back to the browser language */
  }
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

let current: Lang = detect();

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang;
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn: (lang: Lang) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Resolve a bilingual value (or pass a plain string through). */
export function tr(value: L | string | undefined): string {
  if (value === undefined) return '';
  return typeof value === 'string' ? value : value[current];
}

/** Shorthand to build a bilingual value. */
export function l(fr: string, en: string): L {
  return { fr, en };
}
