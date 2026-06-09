import {describe, expect, it} from 'vitest';
import {formatResultMetaColumns, formatResultMetaLine, formatTorrentAge} from '../source/core/result-format.js';

const now = new Date('2026-06-09T00:00:00Z');

describe('result formatting', () => {
  it('labels seeders and leechers as distinct columns with neutral localized age', () => {
    const line = formatResultMetaLine({
      title: 'Sintel',
      provider: 'ThePirateBay',
      seeds: 5,
      peers: 9,
      size: '380.9 MB',
      time: 'Tue, 22 Jul 2025 19:24:44 GMT'
    }, {locale: 'de-AT', now});

    expect(line).toContain('ThePirateBay');
    expect(line).toContain('S 5');
    expect(line).toContain('L 9');
    expect(line).toContain('380.9 MB');
    expect(line).toContain('11 Monate (22.07.25)');
  });

  it('falls back to explicit values for missing metadata', () => {
    expect(formatResultMetaColumns({title: 'Sintel'})).toEqual({
      provider: 'unknown',
      seeders: '0',
      leechers: '0',
      size: 'unknown',
      age: 'unknown'
    });
  });

  it('passes through unparseable age values', () => {
    expect(formatTorrentAge('not a date', {locale: 'de-AT', now})).toBe('not a date');
  });
});
