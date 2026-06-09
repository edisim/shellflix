import {describe, expect, it} from 'vitest';
import {buildStreamView} from '../source/core/stream-view.js';
import type {TorrentStreamSnapshot} from '../source/core/stream.js';

describe('stream view copy', () => {
  it('does not claim playback while metadata is still loading', () => {
    const view = buildStreamView(snapshot({
      status: 'running',
      log: ['fetching torrent metadata from 0 peers']
    }), {title: 'Project Hail Mary (2026) [1080p] [WEBRip] [5.1]', output: 'IINA'}, 'VLC');

    expect(view.label).toBe('CONNECTING');
    expect(view.tone).toBe('starting');
    expect(view.status).not.toContain('WebTorrent');
    expect(view.status).toContain('Finding peers');
    expect(view.body).not.toContain('PID');
    expect(view.activity).toBe('Fetching torrent metadata (0 peers)...');
  });

  it('claims playback only after the stream server is ready', () => {
    const view = buildStreamView(snapshot({
      status: 'running',
      log: ['Streaming to: IINA  Server running at: http://localhost:51733/0']
    }), {title: 'Project Hail Mary (2026) [1080p] [WEBRip] [5.1]', output: 'IINA'}, 'VLC');

    expect(view.label).toBe('PLAYING');
    expect(view.tone).toBe('running');
    expect(view.status).toContain('Streaming Project Hail Mary');
    expect(view.activity).toBe('Player connected. Stream server is ready.');
  });

  it('shows preparation without implying playback', () => {
    const view = buildStreamView(snapshot({
      status: 'running',
      log: ['verifying existing torrent data...']
    }), {title: 'Project Hail Mary (2026) [1080p] [WEBRip] [5.1]', output: 'IINA'}, 'VLC');

    expect(view.label).toBe('PREPARING');
    expect(view.tone).toBe('starting');
    expect(view.status).toContain('Preparing Project Hail Mary');
    expect(view.activity).toBe('Verifying existing torrent data...');
  });

  it('keeps user-requested stop visible over late process logs', () => {
    const view = buildStreamView(snapshot({
      status: 'running',
      log: ['fetching torrent metadata from 0 peers']
    }), {title: 'Project Hail Mary (2026) [1080p] [WEBRip] [5.1]', output: 'IINA'}, 'VLC', 80, {stopping: true});

    expect(view.label).toBe('STOPPING');
    expect(view.tone).toBe('starting');
    expect(view.status).toBe('Stopping stream...');
    expect(view.controls).not.toContain('x stop');
    expect(view.activity).toBe('Waiting for stream to stop...');
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
