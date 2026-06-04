import {describe, expect, it, vi} from 'vitest';
import {orderProviders, searchProviders, withTimeout} from '../source/core/search.js';

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

  it('orders providers from the active provider and wraps around', () => {
    expect(orderProviders(['A', 'B', 'C'], 'B')).toEqual(['B', 'C', 'A']);
    expect(orderProviders(['A', 'B', 'C'], 'Missing')).toEqual(['A', 'B', 'C']);
  });

  it('does not wrap a promise with timeout when timeout is disabled', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 0, 'timeout')).resolves.toBe('ok');
  });
});
