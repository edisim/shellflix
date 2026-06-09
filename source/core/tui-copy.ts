import type {TuiLayout, TuiMode, TuiState} from './tui-state.js';

export function buildOpenTuiTitle(): string {
  return 'Shellflix';
}

export function buildOpenTuiMeta(state: Pick<TuiState, 'provider' | 'output' | 'subtitleEnabled' | 'query'>): string {
  const query = state.query.trim();
  const context = [
    `Provider ${state.provider}`,
    `Output ${state.output}`,
    `Subtitles ${state.subtitleEnabled ? 'on' : 'off'}`
  ];

  if (query) {
    context.push(`Query "${query}"`);
  }

  return context.join(' · ');
}

export function buildSearchInputContent(value: string): string {
  const query = value.trimEnd();

  return `> ${query || 'Sintel or magnet/torrent URL'}${query ? '_' : ''}`;
}

export function buildFooterContent(mode: TuiMode, layout: TuiLayout = 'full'): string {
  if (mode === 'search') {
    return 'Type query · Enter search · Esc quit · Ctrl+C quit';
  }

  if (mode === 'output') {
    return '↑/↓ choose · Enter save · Esc quit · Ctrl+C quit';
  }

  if (layout === 'compact') {
    return '↑/↓ select · Enter stream · / search · Esc quit\np provider · s subtitles · o output · Ctrl+C quit';
  }

  return '↑/↓ select · Enter stream · / search · p provider · s subtitles · o output\nEsc quit · Ctrl+C quit';
}

export function buildEmptyResultsText(mode: TuiMode, status: string): string {
  if (status.toLowerCase().startsWith('searching ')) {
    return 'Waiting for provider response...';
  }

  if (mode === 'search') {
    return 'Type a query above, then press Enter.';
  }

  return 'No matching torrents. Try another query or provider.';
}
