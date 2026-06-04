import {describe, expect, it} from 'vitest';
import {buildWebtorrentCommand, normalizeWebtorrentOptions} from '../source/core/webtorrent.js';

describe('webtorrent command building', () => {
  it('builds a node command against the resolved bundled binary without npx', () => {
    const command = buildWebtorrentCommand({
      torrent: 'magnet:?xt=urn:btih:test',
      dynamicOptions: ['--vlc'],
      defaultOptions: ['--keep-seeding'],
      downloadsPath: '/tmp/downloads',
      resolveBinary: () => '/pkg/shellflix-webtorrent-cli/bin/cmd.js'
    });

    expect(command.file).toBe(process.execPath);
    expect(command.args).toEqual(['/pkg/shellflix-webtorrent-cli/bin/cmd.js', 'download', 'magnet:?xt=urn:btih:test', '--keep-seeding', '--vlc', '--out', '/tmp/downloads']);
    expect(command.args).not.toContain('npx');
  });

  it('deduplicates player flags and preserves explicit output paths', () => {
    const options = normalizeWebtorrentOptions({
      dynamicOptions: ['--iina', '--out', '/custom'],
      defaultOptions: ['--keep-seeding', '--vlc'],
      downloadsPath: '/tmp/downloads'
    });

    expect(options).toEqual(['--keep-seeding', '--iina', '--out', '/custom']);
  });
});
