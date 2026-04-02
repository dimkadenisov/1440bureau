import { ru, type TranslationKey } from './ru';
import { en } from './en';

export type Lang = 'ru' | 'en';

const LANGS: Lang[] = ['ru', 'en'];

const translations: Record<Lang, typeof ru> = { ru, en: en as unknown as typeof ru };

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  if (first !== undefined && (LANGS as string[]).includes(first)) return first as Lang;
  return 'ru';
}

export function useTranslations(lang: Lang) {
  return function t(key: TranslationKey | string): string {
    return (translations[lang] as Record<string, string>)[key] ?? key;
  };
}

export function getLocalePath(lang: Lang, path = ''): string {
  return lang === 'ru' ? `/${path}` : `/en/${path}`;
}
