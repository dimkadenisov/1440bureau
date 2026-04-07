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

describe('solutions descriptions', () => {
  it('ru desc keys exist and are non-empty', () => {
    const t = useTranslations('ru');
    const keys = [
      'solutions.extractive_desc', 'solutions.geo_desc', 'solutions.telecom_desc',
      'solutions.aviation_desc', 'solutions.rail_desc', 'solutions.maritime_desc',
      'solutions.auto_desc', 'solutions.education_desc', 'solutions.health_desc',
      'solutions.emergency_desc', 'solutions.gov_desc',
    ] as const;
    for (const key of keys) {
      const val = t(key as any);
      expect(val).not.toBe(key); // not falling back to key = exists
      expect(val.length).toBeGreaterThan(10);
    }
  });

  it('en desc keys exist and are non-empty', () => {
    const t = useTranslations('en');
    const keys = [
      'solutions.extractive_desc', 'solutions.geo_desc', 'solutions.telecom_desc',
      'solutions.aviation_desc', 'solutions.rail_desc', 'solutions.maritime_desc',
      'solutions.auto_desc', 'solutions.education_desc', 'solutions.health_desc',
      'solutions.emergency_desc', 'solutions.gov_desc',
    ] as const;
    for (const key of keys) {
      const val = t(key as any);
      expect(val).not.toBe(key);
      expect(val.length).toBeGreaterThan(10);
    }
  });
});
