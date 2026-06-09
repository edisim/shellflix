import {execFileSync} from 'node:child_process';
import process from 'node:process';

type LocaleResolverOptions = {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform | string;
  readMacLocale?: () => string | undefined;
  defaultLocale?: string;
};

let cachedLocale: string | undefined;

export function resolveSystemLocale(options: LocaleResolverOptions = {}): string {
  const useCache = Object.keys(options).length === 0;

  if (useCache && cachedLocale) {
    return cachedLocale;
  }

  const env = options.env ?? process.env;
  const platform = options.platform ?? process.platform;
  const readMacLocale = options.readMacLocale ?? readAppleLocale;
  const candidates = [
    platform === 'darwin' ? readMacLocale() : undefined,
    env.LC_ALL,
    env.LC_TIME,
    env.LANG,
    options.defaultLocale,
    Intl.DateTimeFormat().resolvedOptions().locale
  ];
  const locale = candidates.map(normalizeLocale).find(Boolean) ?? 'en-US';

  if (useCache) {
    cachedLocale = locale;
  }

  return locale;
}

export function normalizeLocale(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const locale = value
    .trim()
    .replace(/^"|"$/g, '')
    .split('\n')[0]
    .split('.')[0]
    .split('@')[0]
    .replace(/_/g, '-');

  if (!locale || /^(c|posix)$/i.test(locale)) {
    return undefined;
  }

  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
}

function readAppleLocale(): string | undefined {
  try {
    return execFileSync('defaults', ['read', '-g', 'AppleLocale'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
  } catch {
    return undefined;
  }
}
