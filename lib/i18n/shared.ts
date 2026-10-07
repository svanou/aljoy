import { french } from './fr';

export type Locale = 'en' | 'fr';
export const localeCookie = 'aiflow-language';
export const normalizeLocale = (value: string | undefined | null): Locale => value === 'fr' ? 'fr' : 'en';

export function translate(locale: Locale, text: string, values: Record<string, string> = {}) {
  const key = text.trim().replace(/\s+/g, ' ');
  const translated = locale === 'fr' ? french[key] : undefined;
  const result = translated
    ? (text.match(/^\s*/)?.[0] || '') + translated + (text.match(/\s*$/)?.[0] || '')
    : text;
  return result.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
}

export const translator = (locale: Locale) => (text: string, values?: Record<string, string>) => translate(locale, text, values);
