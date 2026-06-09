import {describe, expect, it} from 'vitest';
import {buildStreamView} from '../source/core/stream-view.js';
import type {TorrentStreamSnapshot} from '../source/core/stream.js';

describe('stream view copy', () => {
  it('keeps running stream copy user-facing', () => {
    const view = buildStreamView(snapshot({
      status: 'running',
      log: ['fetching torrent metadata from 0 peers']
    }), {title: 'Project Hail Mary (2026) [1080p] [WEBRip] [5.1]', output: 'IINA'}, 'VLC');

    expect(view.label).toBe('PLAYING');
    expect(view.status).not.toContain('WebTorrent');
    expect(view.status).toContain('Press x to stop');
    expect(view.body).not.toContain('PID');
    expect(view.activity).toBe('Fetching torrent metadata (0 peers)...');
  });

  it('does not show stop actions or internal process output after stopping', () => {
    const view = buildStreamView(snapshot({
      status: 'stopped',
      pid: 70307,
      log: ['fetching torrent metadata from 0 peers', 'webtorrent-is-exiting...']
    }), {title: 'Project Hail Mary (2026) [1080p] [WEBRip] [5.1]', output: 'IINA'}, 'VLC');

    expect(view.label).toBe('STOPPED');
    expect(view.status).toBe('Stream stopped. Press r to restart.');
    expect(view.controls).not.toContain('x stop');
    expect(view.activity).not.toContain('webtorrent');
    expect(view.body).not.toContain('70307');
  });
});

function snapshot(input: Partial<TorrentStreamSnapshot>): TorrentStreamSnapshot {
  return {
    status: input.status ?? 'starting',
    command: input.command ?? {file: 'node', args: []},
    pid: input.pid,
    exitCode: input.exitCode,
    signal: input.signal,
    log: input.log ?? []
  };
}
