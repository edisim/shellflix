import type {TorrentResult} from './types.js';

export type ResultFormatOptions = {
  locale?: string;
  now?: Date;
};

export type ResultMetaColumns = {
  provider: string;
  seeders: string;
  leechers: string;
  size: string;
  age: string;
};

export function formatResultMetaColumns(result: TorrentResult, options: ResultFormatOptions = {}): ResultMetaColumns {
  return {
    provider: String(result.provider ?? 'unknown'),
    seeders: formatNumber(result.seeds),
    leechers: formatNumber(result.peers),
    size: String(result.size ?? 'unknown'),
    age: formatTorrentAge(result.time, options)
  };
}

export function formatResultMetaLine(result: TorrentResult, options: ResultFormatOptions = {}): string {
  const columns = formatResultMetaColumns(result, options);

  return [
    padColumn(columns.provider, 14),
    `S ${padColumn(columns.seeders, 4)}`,
    `L ${padColumn(columns.leechers, 4)}`,
    padColumn(columns.size, 9),
    columns.age
  ].join('  ');
}

export function formatTorrentAge(value: unknown, options: ResultFormatOptions = {}): string {
  if (typeof value !== 'string' || !value.trim()) {
    return 'unknown';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const locale = options.locale;
  const relative = formatRelativeDate(date, options.now ?? new Date(), locale);
  const localDate = new Intl.DateTimeFormat(locale, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit'
  }).format(date);

  return `${relative} (${localDate})`;
}

function formatNumber(value: unknown): string {
  return typeof value === 'number' ? String(value) : '0';
}

function padColumn(value: string, width: number): string {
  return value.length >= width ? value : value.padEnd(width, ' ');
}

function formatRelativeDate(date: Date, now: Date, locale?: string): string {
  const absMs = Math.abs(date.getTime() - now.getTime());
  const units = [
    {unit: 'year', ms: 365 * 24 * 60 * 60 * 1000},
    {unit: 'month', ms: 30 * 24 * 60 * 60 * 1000},
    {unit: 'day', ms: 24 * 60 * 60 * 1000},
    {unit: 'hour', ms: 60 * 60 * 1000},
    {unit: 'minute', ms: 60 * 1000},
    {unit: 'second', ms: 1000}
  ] as const;

  const selected = units.find(unit => absMs >= unit.ms) ?? units[units.length - 1];
  const value = Math.round(absMs / selected.ms);

  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: selected.unit,
    unitDisplay: 'long'
  }).format(value);
}
