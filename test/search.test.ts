import {describe, expect, it, vi} from 'vitest';
import {isSearchableTorrentResult, orderProviders, searchProviders, withTimeout} from '../source/core/search.js';

describe('searchProviders', () => {
  it('falls back to the next provider when the first provider times out', async () => {
    vi.useFakeTimers();

    const searchPromise = searchProviders({
      query: 'Sintel',
      providers: ['SlowProvider', 'FastProvider'],
      activeProvider: 'SlowProvider',
      limit: 2,
      timeoutMs: 100,
      adapter: {
        search: async provider => {
          if (provider === 'SlowProvider') {
            return new Promise(() => {});
          }

          return [{title: 'Sintel', provider, seeds: 10, peers: 1, size: '1 GB'}];
        }
      }
    });

    await vi.advanceTimersByTimeAsync(100);
    const result = await searchPromise;
    vi.useRealTimers();

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.provider).toBe('FastProvider');
    expect(result.attempts.map(attempt => attempt.status)).toEqual(['timeout', 'success']);
  });

  it('records empty and error attempts before returning no results', async () => {
    const result = await searchProviders({
      query: 'missing',
      providers: ['EmptyProvider', 'BrokenProvider'],
      activeProvider: 'EmptyProvider',
      limit: 2,
      timeoutMs: 100,
      adapter: {
        search: async provider => {
          if (provider === 'BrokenProvider') {
            throw new Error('blocked');
          }

          return [];
        }
      }
    });

    expect(result.results).toEqual([]);
    expect(result.attempts.map(attempt => attempt.status)).toEqual(['empty', 'error']);
  });

  it('filters provider placeholder rows before deciding a provider succeeded', async () => {
    const result = await searchProviders({
      query: 'lfow',
      providers: ['ThePirateBay', '1337x'],
      activeProvider: 'ThePirateBay',
      limit: 2,
      timeoutMs: 100,
      adapter: {
        search: async provider => {
          if (provider === 'ThePirateBay') {
            return [{title: 'No results returned', provider, seeds: 0, peers: 0, size: '0 B', time: 'Thu, 01 Jan 1970 00:00:00 GMT'}];
          }

          return [];
        }
      }
    });

    expect(result.results).toEqual([]);
    expect(result.attempts.map(attempt => attempt.status)).toEqual(['empty', 'empty']);
  });

  it('recognizes placeholder rows as non-searchable', () => {
    expect(isSearchableTorrentResult({title: 'No results returned'})).toBe(false);
    expect(isSearchableTorrentResult({title: ''})).toBe(false);
    expect(isSearchableTorrentResult({title: 'Sintel 1080p'})).toBe(true);
  });

  it('orders providers from the active provider and wraps around', () => {
    expect(orderProviders(['A', 'B', 'C'], 'B')).toEqual(['B', 'C', 'A']);
    expect(orderProviders(['A', 'B', 'C'], 'Missing')).toEqual(['A', 'B', 'C']);
  });

  it('does not wrap a promise with timeout when timeout is disabled', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 0, 'timeout')).resolves.toBe('ok');
  });
});
