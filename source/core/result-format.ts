import type {TorrentResult} from './types.js';
import {resolveSystemLocale} from './system-locale.js';

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
  const locale = options.locale ?? resolveSystemLocale();

  return {
    provider: String(result.provider ?? 'unknown'),
    seeders: formatNumber(result.seeds, locale),
    leechers: formatNumber(result.peers, locale),
    size: formatSize(result.size, locale),
    age: formatTorrentAge(result.time, {...options, locale})
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

  const locale = options.locale ?? resolveSystemLocale();
  const relative = formatRelativeDate(date, options.now ?? new Date(), locale);
  const localDate = new Intl.DateTimeFormat(locale, {
    dateStyle: 'short'
  }).format(date);

  return `${relative} (${localDate})`;
}

function formatNumber(value: unknown, locale: string): string {
  return typeof value === 'number' ? normalizeNumberGroupSeparators(new Intl.NumberFormat(locale).format(value), locale) : '0';
}

function formatSize(value: unknown, locale: string): string {
  if (typeof value !== 'string') {
    return 'unknown';
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)$/);

  if (!match) {
    return trimmed;
  }

  const [, rawNumber, unit] = match;
  const numericValue = Number(rawNumber.replace(',', '.'));

  if (!Number.isFinite(numericValue)) {
    return trimmed;
  }

  const fractionDigits = rawNumber.includes('.') || rawNumber.includes(',')
    ? rawNumber.split(/[.,]/)[1]?.length ?? 0
    : 0;
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(numericValue);

  return `${normalizeNumberGroupSeparators(number, locale)} ${unit}`;
}

function normalizeNumberGroupSeparators(value: string, locale: string): string {
  return locale.toLowerCase().startsWith('de') ? value.replace(/[\s\u00a0\u202f]/g, '.') : value;
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
