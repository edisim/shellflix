import {describe, expect, it} from 'vitest';
import {splitShellflixArgs} from '../source/core/args.js';

describe('splitShellflixArgs', () => {
  it('keeps query arguments before -- and forwards webtorrent options after --', () => {
    const result = splitShellflixArgs(['Sintel', '2010', '--', '--vlc', '--port', '1234']);

    expect(result.pastelArgs).toEqual(['Sintel', '2010']);
    expect(result.webtorrentOptions).toEqual(['--vlc', '--port', '1234']);
    expect(result.query).toBe('Sintel 2010');
  });

  it('handles interactive mode without a query', () => {
    const result = splitShellflixArgs([]);

    expect(result.pastelArgs).toEqual([]);
    expect(result.webtorrentOptions).toEqual([]);
    expect(result.query).toBe('');
  });
});
