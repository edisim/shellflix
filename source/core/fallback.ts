import {cancel, intro, isCancel, select, text} from '@clack/prompts';
import type {ShellflixConfig, TorrentResult} from './types.js';

type FallbackInput = {
  initialQuery: string;
  config: ShellflixConfig;
  search: (query: string) => Promise<TorrentResult[]>;
};

export async function runClackFallback(input: FallbackInput): Promise<TorrentResult | undefined> {
  intro('Shellflix');

  const query = input.initialQuery || await text({
    message: 'What do you want to watch?',
    placeholder: 'Sintel or your own legal torrent'
  });

  if (isCancel(query)) {
    cancel('Cancelled');
    return;
  }

  const results = await input.search(String(query));

  if (results.length === 0) {
    cancel('No torrents found. Try another query or provider.');
    return;
  }

  const selected = await select({
    message: 'Which torrent?',
    options: results.slice(0, input.config.prompt.rows).map((result, index) => ({
      label: result.title,
      value: String(index),
      hint: [result.provider, result.size].filter(Boolean).join(' · ')
    }))
  });

  if (isCancel(selected)) {
    cancel('Cancelled');
    return;
  }

  return results[Number(selected)];
}
