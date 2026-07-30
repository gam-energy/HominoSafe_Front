import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import faCommon from './locales/fa/common.json';

const COOKIE = 'i18nextLng';

export function normalizeLng(lang?: string | null): 'en' | 'fa' {
  return lang && lang.toLowerCase().startsWith('fa') ? 'fa' : 'en';
}

export function readStoredLng(): 'en' | 'fa' {
  if (typeof window === 'undefined') return 'en';
  try {
    const fromLs = window.localStorage.getItem(COOKIE);
    if (fromLs) return normalizeLng(fromLs);
  } catch {
    /* ignore */
  }
  try {
    const match = document.cookie.match(/(?:^|; )i18nextLng=([^;]+)/);
    if (match?.[1]) return normalizeLng(decodeURIComponent(match[1]));
  } catch {
    /* ignore */
  }
  return normalizeLng(document.documentElement.lang);
}

export function persistLng(lang: string) {
  const lng = normalizeLng(lang);
  try {
    window.localStorage.setItem(COOKIE, lng);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${COOKIE}=${lng};path=/;max-age=31536000;SameSite=Lax`;
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'fa' ? 'rtl' : 'ltr';
}

/**
 * Always init with `en` so SSR HTML matches the first client render (avoids React #418).
 * Call `hydrateLanguage()` after mount to apply the user's stored language.
 */
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { common: enCommon },
      fa: { common: faCommon },
    },
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

/** Apply localStorage/cookie language after hydration. */
export function hydrateLanguage(): Promise<'en' | 'fa'> {
  const lng = readStoredLng();
  persistLng(lng);
  if (normalizeLng(i18n.language) === lng) {
    return Promise.resolve(lng);
  }
  return i18n.changeLanguage(lng).then(() => lng);
}

export default i18n;
