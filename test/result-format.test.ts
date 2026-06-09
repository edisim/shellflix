import {describe, expect, it} from 'vitest';
import {formatResultMetaColumns, formatResultMetaLine, formatTorrentAge} from '../source/core/result-format.js';

const now = new Date('2026-06-09T00:00:00Z');

describe('result formatting', () => {
  it('labels seeders and leechers as distinct columns with neutral localized age', () => {
    const line = formatResultMetaLine({
      title: 'Sintel',
      provider: 'ThePirateBay',
      seeds: 1234,
      peers: 9,
      size: '380.9 MB',
      time: 'Tue, 22 Jul 2025 19:24:44 GMT'
    }, {locale: 'de-AT', now});

    expect(line).toContain('ThePirateBay');
    expect(line).toContain('S 1.234');
    expect(line).toContain('L 9');
    expect(line).toContain('380,9 MB');
    expect(line).toContain('11 Monate (22.07.25)');
  });

  it('localizes short dates, singular relative units, and sizes', () => {
    expect(formatTorrentAge('Mon, 08 Jun 2026 00:00:00 GMT', {locale: 'de-AT', now})).toBe('1 Tag (08.06.26)');
    expect(formatResultMetaColumns({title: 'Sintel', seeds: 1234, peers: 4, size: '1.7 GB'}, {locale: 'de-AT', now})).toMatchObject({
      seeders: '1.234',
      leechers: '4',
      size: '1,7 GB'
    });
  });

  it('keeps en-US formatting when that locale is selected', () => {
    expect(formatTorrentAge('Wed, 18 Mar 2026 00:00:00 GMT', {locale: 'en-US', now})).toBe('3 months (3/18/26)');
    expect(formatResultMetaColumns({title: 'Sintel', size: '1.7 GB'}, {locale: 'en-US', now}).size).toBe('1.7 GB');
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
    expect(formatResultMetaColumns({title: 'Sintel', size: 'huge'}, {locale: 'de-AT', now}).size).toBe('huge');
  });
});
