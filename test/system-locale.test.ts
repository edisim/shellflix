import {describe, expect, it} from 'vitest';
import {normalizeLocale, resolveSystemLocale} from '../source/core/system-locale.js';

describe('system locale', () => {
  it('uses the macOS AppleLocale before terminal environment variables', () => {
    expect(resolveSystemLocale({
      platform: 'darwin',
      readMacLocale: () => 'de_AT',
      env: {
        LC_ALL: 'C.UTF-8',
        LANG: 'en_US.UTF-8'
      },
      defaultLocale: 'en-US'
    })).toBe('de-AT');
  });

  it('ignores C and POSIX locales', () => {
    expect(normalizeLocale('C.UTF-8')).toBeUndefined();
    expect(normalizeLocale('POSIX')).toBeUndefined();
  });

  it('falls back to normalized terminal environment locales', () => {
    expect(resolveSystemLocale({
      platform: 'linux',
      env: {
        LC_ALL: 'C.UTF-8',
        LC_TIME: 'fr_FR.UTF-8',
        LANG: 'en_US.UTF-8'
      },
      defaultLocale: 'en-US'
    })).toBe('fr-FR');
  });
});
