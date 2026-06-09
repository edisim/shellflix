import type {TuiLayout, TuiMode, TuiState} from './tui-state.js';
import {truncateTerminal} from './terminal-width.js';

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
    context.push(`Query "${truncateTerminal(query, 48)}"`);
  }

  return context.join(' · ');
}

export function buildSearchInputContent(value: string): string {
  const query = value.trimEnd();

  return `> ${query}${query ? '_' : ''}`;
}

export function buildSearchHintContent(): string {
  return 'Example: Sintel, public-domain title, magnet URI, or .torrent URL';
}

export function buildFooterContent(mode: TuiMode, layout: TuiLayout = 'full', streamActive = false): string {
  if (mode === 'search') {
    return streamActive
      ? 'Type query · Enter search · Ctrl+X stop stream · Esc quit'
      : 'Type query · Enter search · Esc quit · Ctrl+C quit';
  }

  if (mode === 'output') {
    return '↑/↓ choose · Enter save · Esc quit · Ctrl+C quit';
  }

  if (mode === 'streaming') {
    return 'x stop stream · r restart · / search · ↑/↓ select\nEnter start selected · Esc quit · Ctrl+C quit';
  }

  if (layout === 'compact') {
    return streamActive
      ? '↑/↓ select · Enter stream · / search · x stop stream\np provider · s subtitles · o output · Esc quit'
      : '↑/↓ select · Enter stream · / search · Esc quit\np provider · s subtitles · o output · Ctrl+C quit';
  }

  return streamActive
    ? '↑/↓ select · Enter stream · / search · p provider · s subtitles · o output\nx stop stream · Esc quit · Ctrl+C quit'
    : '↑/↓ select · Enter stream · / search · p provider · s subtitles · o output\nEsc quit · Ctrl+C quit';
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
