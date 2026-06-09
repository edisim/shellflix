import type {TorrentStreamSnapshot, TorrentStreamStatus} from './stream.js';
import {truncateTerminal} from './terminal-width.js';

export type StreamViewRequest = {
  title: string;
  output: string;
};

export type StreamViewTone = 'starting' | 'running' | 'stopped' | 'failed';
type StreamViewPhase = 'starting' | 'metadata' | 'preparing' | 'ready' | 'stopping' | 'stopped' | 'failed';

export type StreamViewModel = {
  label: string;
  tone: StreamViewTone;
  status: string;
  body: string;
  controls: string;
  activity: string;
};

export type StreamViewOptions = {
  stopping?: boolean;
};

export function buildStreamView(snapshot: TorrentStreamSnapshot, request: StreamViewRequest | undefined, fallbackOutput: string, width = 80, options: StreamViewOptions = {}): StreamViewModel {
  const phase = getStreamPhase(snapshot, options);
  const tone = getStreamTone(phase);
  const title = truncateTerminal(request?.title ?? 'Selected stream', getTitleWidth(width));
  const output = request?.output ?? fallbackOutput;

  return {
    label: getStreamLabel(phase),
    tone,
    status: buildStreamStatus(phase, title, output),
    body: `${title} · Output ${output}`,
    controls: buildStreamControls(phase),
    activity: phase === 'stopping'
      ? truncateTerminal('Waiting for stream to stop...', Math.max(24, width))
      : buildStreamActivity(snapshot, width)
  };
}

function getStreamPhase(snapshot: TorrentStreamSnapshot, options: StreamViewOptions): StreamViewPhase {
  if (snapshot.status === 'failed') {
    return 'failed';
  }

  if (snapshot.status === 'stopped') {
    return 'stopped';
  }

  if (options.stopping) {
    return 'stopping';
  }

  const latest = getLatestUserFacingLog(snapshot.log)?.toLowerCase() ?? '';

  if (latest.includes('streaming to:') || latest.includes('server running at:')) {
    return 'ready';
  }

  if (latest.includes('verifying existing torrent data')) {
    return 'preparing';
  }

  if (latest.includes('fetching torrent metadata')) {
    return 'metadata';
  }

  return 'starting';
}

function getStreamTone(phase: StreamViewPhase): StreamViewTone {
  if (phase === 'failed') {
    return 'failed';
  }

  if (phase === 'ready') {
    return 'running';
  }

  if (phase === 'stopped') {
    return 'stopped';
  }

  return 'starting';
}

function getStreamLabel(phase: StreamViewPhase): string {
  if (phase === 'ready') {
    return 'PLAYING';
  }

  if (phase === 'metadata') {
    return 'CONNECTING';
  }

  if (phase === 'preparing') {
    return 'PREPARING';
  }

  if (phase === 'stopping') {
    return 'STOPPING';
  }

  if (phase === 'failed') {
    return 'ATTENTION';
  }

  return phase.toUpperCase();
}

function buildStreamStatus(phase: StreamViewPhase, title: string, output: string): string {
  if (phase === 'ready') {
    return `Streaming ${title}. Press x to stop or / to search.`;
  }

  if (phase === 'metadata') {
    return `Finding peers for ${title}. Press x to stop.`;
  }

  if (phase === 'preparing') {
    return `Preparing ${title} for ${output}...`;
  }

  if (phase === 'failed') {
    return 'Stream failed. Press r to retry or choose another result.';
  }

  if (phase === 'stopping') {
    return 'Stopping stream...';
  }

  if (phase === 'stopped') {
    return 'Stream stopped. Press r to restart.';
  }

  return `Preparing ${title} for ${output}...`;
}

function buildStreamControls(phase: StreamViewPhase): string {
  if (phase === 'stopped') {
    return 'r restart · Enter start selected · / search';
  }

  if (phase === 'failed') {
    return 'r retry · Enter start selected · / search';
  }

  if (phase === 'stopping') {
    return 'Waiting for stream to stop';
  }

  return 'x stop · / search · ↑/↓ select another';
}

function buildStreamActivity(snapshot: TorrentStreamSnapshot, width: number): string {
  const activityWidth = Math.max(24, width);

  if (snapshot.status === 'stopped') {
    return truncateTerminal('Ready to restart or choose another result.', activityWidth);
  }

  const latest = getLatestUserFacingLog(snapshot.log);

  if (!latest) {
    const fallback = snapshot.status === 'failed'
      ? 'Player or torrent process stopped unexpectedly.'
      : 'Waiting for torrent metadata...';

    return truncateTerminal(fallback, activityWidth);
  }

  return truncateTerminal(formatLogLine(latest), activityWidth);
}

function getLatestUserFacingLog(log: string[]): string | undefined {
  return [...log].reverse().find(line => {
    const normalized = line.trim().toLowerCase();

    return normalized.length > 0 &&
      !normalized.includes('webtorrent-is-exiting') &&
      !normalized.includes('webtorrent is exiting') &&
      !normalized.includes('unexpected error:');
  });
}

function formatLogLine(line: string): string {
  const trimmed = line.trim();
  const metadataMatch = /^fetching torrent metadata from ([0-9]+) peers?$/i.exec(trimmed);

  if (metadataMatch) {
    return `Fetching torrent metadata (${metadataMatch[1]} peers)...`;
  }

  if (/^verifying existing torrent data/i.test(trimmed)) {
    return 'Verifying existing torrent data...';
  }

  if (/streaming to:/i.test(trimmed) || /server running at:/i.test(trimmed)) {
    return 'Player connected. Stream server is ready.';
  }

  return trimmed;
}

function getTitleWidth(width: number): number {
  return Math.min(54, Math.max(24, width - 34));
}
