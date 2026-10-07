import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonEn from './common/en.json';
import commonAr from './common/ar.json';
import { formatQuantity } from '@shared/lib/money';

export const COMMON_NAMESPACE = 'common';

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    lng: 'ar',
    fallbackLng: 'ar',
    supportedLngs: ['en', 'ar'],
    ns: [COMMON_NAMESPACE],
    defaultNS: COMMON_NAMESPACE,
    resources: {
      ar: { [COMMON_NAMESPACE]: commonAr },
      en: { [COMMON_NAMESPACE]: commonEn },
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
  // `{{count, num}}`: counts inside sentences get the same digits as formatNumber.
  i18next.services.formatter?.add('num', (value, lng) => formatQuantity(value, lng));
}

/** Registers a feature namespace's bundle once its i18n/index.ts loader resolves (ADR-007). */
export function addNamespaceBundle(
  ns: string,
  locale: 'en' | 'ar',
  bundle: Record<string, unknown>,
): void {
  if (!i18next.hasResourceBundle(locale, ns)) {
    i18next.addResourceBundle(locale, ns, bundle);
  }
}

export function hasNamespaceBundle(ns: string, locale: 'en' | 'ar'): boolean {
  return i18next.hasResourceBundle(locale, ns);
}

export default i18next;
