import { describe, it, expect } from 'vitest';
import { getLangFromUrl, useTranslations } from './utils';

describe('getLangFromUrl', () => {
  it('returns ru for root path', () => {
    expect(getLangFromUrl(new URL('https://1440.space/'))).toBe('ru');
  });

  it('returns en for /en/ path', () => {
    expect(getLangFromUrl(new URL('https://1440.space/en/'))).toBe('en');
  });

  it('returns ru for unknown lang', () => {
    expect(getLangFromUrl(new URL('https://1440.space/fr/'))).toBe('ru');
  });
});

describe('useTranslations', () => {
  it('returns ru translation', () => {
    const t = useTranslations('ru');
    expect(t('nav.mission')).toBe('Миссия');
  });

  it('returns en translation', () => {
    const t = useTranslations('en');
    expect(t('nav.mission')).toBe('Mission');
  });

  it('falls back to key if translation missing', () => {
    const t = useTranslations('ru');
    expect(t('nonexistent.key' as any)).toBe('nonexistent.key');
  });
});
