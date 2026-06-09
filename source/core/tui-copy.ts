import type {TuiMode, TuiState} from './tui-state.js';

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

export function buildFooterContent(mode: TuiMode): string {
  if (mode === 'search') {
    return 'Enter search · Esc Esc quit · Ctrl+C Ctrl+C quit';
  }

  if (mode === 'output') {
    return '↑/↓ choose · Enter save · Esc search · Esc Esc quit · Ctrl+C Ctrl+C quit';
  }

  return '↑/↓ select · Enter stream · Esc search · p provider · s subtitles · o output · Esc Esc quit';
}

export function buildEmptyResultsText(mode: TuiMode, status: string): string {
  if (status.toLowerCase().startsWith('searching ')) {
    return 'Waiting for provider response...';
  }

  if (mode === 'search') {
    return 'Results will appear here.';
  }

  return 'No matching torrents to show.';
}
