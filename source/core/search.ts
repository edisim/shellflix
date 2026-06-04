import type {TorrentResult} from './types.js';

export type SearchAttempt = {
  provider: string;
  status: 'success' | 'empty' | 'timeout' | 'error';
  error?: string;
};

type SearchAdapter = {
  search: (provider: string, query: string, category: string, limit: number) => Promise<TorrentResult[]>;
};

export type SearchProvidersInput = {
  query: string;
  providers: string[];
  activeProvider: string;
  limit: number;
  timeoutMs: number;
  adapter: SearchAdapter;
};

export type SearchProvidersResult = {
  results: TorrentResult[];
  attempts: SearchAttempt[];
};

const providerCategories: Record<string, string> = {
  ThePirateBay: 'Video',
  TorrentProject: 'Video'
};

export async function searchProviders(input: SearchProvidersInput): Promise<SearchProvidersResult> {
  const providerOrder = orderProviders(input.providers, input.activeProvider);
  const attempts: SearchAttempt[] = [];

  for (const provider of providerOrder) {
    try {
      const results = await withTimeout(
        input.adapter.search(provider, input.query, providerCategories[provider] ?? 'All', input.limit),
        input.timeoutMs,
        `Search via "${provider}" timed out after ${input.timeoutMs}ms.`
      );

      if (results.length > 0) {
        attempts.push({provider, status: 'success'});
        return {
          results: results.map(result => ({...result, provider: result.provider ?? provider})),
          attempts
        };
      }

      attempts.push({provider, status: 'empty'});
    } catch (error) {
      attempts.push({
        provider,
        status: error instanceof TimeoutError ? 'timeout' : 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  return {results: [], attempts};
}

export function orderProviders(providers: string[], activeProvider: string): string[] {
  if (!activeProvider || !providers.includes(activeProvider)) {
    return [...providers];
  }

  const start = providers.indexOf(activeProvider);
  return [...providers.slice(start), ...providers.slice(0, start)];
}

export class TimeoutError extends Error {}

export function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  if (ms <= 0) {
    return promise;
  }

  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(message)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
