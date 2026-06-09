import type {TorrentStreamSnapshot, TorrentStreamStatus} from './stream.js';
import {truncateTerminal} from './terminal-width.js';

export type StreamViewRequest = {
  title: string;
  output: string;
};

export type StreamViewTone = 'starting' | 'running' | 'stopped' | 'failed';

export type StreamViewModel = {
  label: string;
  tone: StreamViewTone;
  status: string;
  body: string;
  controls: string;
  activity: string;
};

export function buildStreamView(snapshot: TorrentStreamSnapshot, request: StreamViewRequest | undefined, fallbackOutput: string, width = 80): StreamViewModel {
  const tone = getStreamTone(snapshot.status);
  const title = truncateTerminal(request?.title ?? 'Selected stream', getTitleWidth(width));
  const output = request?.output ?? fallbackOutput;

  return {
    label: getStreamLabel(snapshot.status),
    tone,
    status: buildStreamStatus(snapshot.status, title, output),
    body: `${title} · Output ${output}`,
    controls: buildStreamControls(snapshot.status),
    activity: buildStreamActivity(snapshot, width)
  };
}

function getStreamTone(status: TorrentStreamStatus): StreamViewTone {
  if (status === 'failed') {
    return 'failed';
  }

  if (status === 'running') {
    return 'running';
  }

  if (status === 'stopped') {
    return 'stopped';
  }

  return 'starting';
}

function getStreamLabel(status: TorrentStreamStatus): string {
  if (status === 'running') {
    return 'PLAYING';
  }

  if (status === 'failed') {
    return 'ATTENTION';
  }

  return status.toUpperCase();
}

function buildStreamStatus(status: TorrentStreamStatus, title: string, output: string): string {
  if (status === 'running') {
    return `Streaming ${title}. Press x to stop or / to search.`;
  }

  if (status === 'failed') {
    return 'Stream failed. Press r to retry or choose another result.';
  }

  if (status === 'stopped') {
    return 'Stream stopped. Press r to restart.';
  }

  return `Opening ${title} in ${output}...`;
}

function buildStreamControls(status: TorrentStreamStatus): string {
  if (status === 'stopped') {
    return 'r restart · Enter start selected · / search';
  }

  if (status === 'failed') {
    return 'r retry · Enter start selected · / search';
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

  return trimmed;
}

function getTitleWidth(width: number): number {
  return Math.min(54, Math.max(24, width - 34));
}
