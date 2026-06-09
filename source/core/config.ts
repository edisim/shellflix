import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {dirname, join} from 'node:path';
import JSON5 from 'json5';
import localeCode from 'locale-code';
import type {ShellflixConfig} from './types.js';

type ConfigLoaderOptions = {
  homeDir?: string;
  fileExists?: (path: string) => boolean;
  readFile?: (path: string) => string;
  locale?: string;
};

type ConfigWriterOptions = ConfigLoaderOptions & {
  localConfigPath?: string;
  mkdir?: (path: string) => void;
  writeFile?: (path: string, value: string) => void;
};

export const defaultConfig: ShellflixConfig = {
  localConfigPath: join(homedir(), '.shellflix.json'),
  downloads: {
    path: join(homedir(), 'Downloads'),
    save: true
  },
  outputs: {
    supported: ['Airplay', 'Chromecast', 'DLNA', 'MPlayer', 'mpv', 'omx', 'VLC', 'IINA', 'XBMC', 'stdout'],
    available: ['Airplay', 'Chromecast', 'DLNA', 'MPlayer', 'mpv', 'VLC', 'IINA', 'XBMC'],
    favorites: ['VLC']
  },
  torrents: {
    limit: 30,
    timeout: 30_000,
    details: {
      seeders: true,
      leechers: true,
      size: true,
      time: false
    },
    providers: {
      available: ['1337x', 'ThePirateBay', 'ExtraTorrent', 'Rarbg', 'Torrent9', 'KickassTorrents', 'TorrentProject', 'Torrentz2'],
      active: '1337x'
    }
  },
  subtitles: {
    limit: 30,
    details: {
      downloads: true
    },
    languages: {
      available: ['Afrikaans', 'Albanian', 'Arabic', 'Armenian', 'Asturian', 'Azerbaijani', 'Basque', 'Belarusian', 'Bengali', 'Bosnian', 'Breton', 'Bulgarian', 'Burmese', 'Catalan', 'Chinese (simplified)', 'Chinese (traditional)', 'Chinese bilingual', 'Croatian', 'Czech', 'Danish', 'Dutch', 'English', 'Esperanto', 'Estonian', 'Extremaduran', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Indonesian', 'Italian', 'Japanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish', 'Latvian', 'Lithuanian', 'Luxembourgish', 'Macedonian', 'Malay', 'Malayalam', 'Manipuri', 'Mongolian', 'Montenegrin', 'Norwegian', 'Occitan', 'Persian', 'Polish', 'Portuguese', 'Portuguese (BR)', 'Portuguese (MZ)', 'Romanian', 'Russian', 'Serbian', 'Sinhalese', 'Slovak', 'Slovenian', 'Spanish', 'Swahili', 'Swedish', 'Syriac', 'Tagalog', 'Tamil', 'Telugu', 'Thai', 'Turkish', 'Ukrainian', 'Urdu', 'Vietnamese'],
      favorites: ['English', 'French', 'German', 'Hindi', 'Italian', 'Japanese', 'Portuguese', 'Russian', 'Spanish']
    },
    opensubtitles: {
      useragent: 'Shellflix v2',
      username: null,
      password: null,
      ssl: true
    }
  },
  webtorrent: {
    options: ['--keep-seeding']
  },
  prompt: {
    rows: 10
  }
};

export function expandHomePath(value: unknown, home = homedir()): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  if (value === '~' || value === '$HOME') {
    return home;
  }

  if (value.startsWith('~/')) {
    return join(home, value.slice(2));
  }

  if (value.startsWith('$HOME/')) {
    return join(home, value.slice(6));
  }

  return value;
}

export function loadConfig(options: ConfigLoaderOptions = {}): ShellflixConfig {
  const home = options.homeDir ?? homedir();
  const config = structuredClone(defaultConfig);
  config.localConfigPath = join(home, '.shellflix.json');
  config.downloads.path = join(home, 'Downloads');

  const fileExists = options.fileExists ?? existsSync;
  const readFile = options.readFile ?? (path => readFileSync(path, 'utf8'));

  if (fileExists(config.localConfigPath)) {
    const rawConfig = readFile(config.localConfigPath);

    if (rawConfig.trim()) {
      const localConfig = JSON5.parse(rawConfig) as Partial<ShellflixConfig>;
      mergeConfig(config, localConfig);
    }
  }

  const locale = options.locale ?? Intl.DateTimeFormat().resolvedOptions().locale.replace('_', '-');
  const languageName = localeCode.getLanguageName(locale);
  const localLanguage = config.subtitles.languages.available.find(language => language.startsWith(languageName));

  if (localLanguage) {
    config.subtitles.languages.favorites = [...new Set([localLanguage, ...config.subtitles.languages.favorites])];
  }

  config.downloads.path = expandHomePath(config.downloads.path, home) as string;

  return config;
}

export function applyPreferredOutput(config: ShellflixConfig, output: string): ShellflixConfig {
  const next = structuredClone(config);
  next.outputs.favorites = promoteValue(output, next.outputs.favorites);

  return next;
}

export function saveOutputFavorite(output: string, options: ConfigWriterOptions = {}): void {
  const home = options.homeDir ?? homedir();
  const localConfigPath = options.localConfigPath ?? join(home, '.shellflix.json');
  const fileExists = options.fileExists ?? existsSync;
  const readFile = options.readFile ?? (path => readFileSync(path, 'utf8'));
  const writeFile = options.writeFile ?? ((path, value) => writeFileSync(path, value));
  const mkdir = options.mkdir ?? (path => mkdirSync(path, {recursive: true}));
  const localConfig = readLocalConfig(localConfigPath, fileExists, readFile);
  const outputs = isPlainObject(localConfig.outputs) ? {...localConfig.outputs} : {};
  const favorites = Array.isArray(outputs.favorites) ? outputs.favorites.filter(isString) : [];

  outputs.favorites = promoteValue(output, favorites);
  localConfig.outputs = outputs;

  mkdir(dirname(localConfigPath));
  writeFile(localConfigPath, `${JSON.stringify(localConfig, null, 2)}\n`);
}

function mergeConfig(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      target[key] = value;
      continue;
    }

    if (isPlainObject(value) && isPlainObject(target[key])) {
      mergeConfig(target[key] as Record<string, unknown>, value);
      continue;
    }

    target[key] = value;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readLocalConfig(
  localConfigPath: string,
  fileExists: (path: string) => boolean,
  readFile: (path: string) => string
): Record<string, unknown> {
  if (!fileExists(localConfigPath)) {
    return {};
  }

  const rawConfig = readFile(localConfigPath);

  if (!rawConfig.trim()) {
    return {};
  }

  const localConfig = JSON5.parse(rawConfig) as unknown;

  if (!isPlainObject(localConfig)) {
    throw new Error(`${localConfigPath} must contain an object.`);
  }

  return localConfig;
}

function promoteValue(value: string, values: string[]): string[] {
  return [value, ...values.filter(item => item !== value)];
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
