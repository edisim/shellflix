import {spawnSync} from 'node:child_process';
import {buildWebtorrentCommand} from './webtorrent.js';
import type {ShellflixConfig} from './types.js';

type StreamInput = {
  torrent: string;
  webtorrentOptions: string[];
  config: ShellflixConfig;
};

export function streamTorrent(input: StreamInput): number {
  const command = buildWebtorrentCommand({
    torrent: input.torrent,
    dynamicOptions: input.webtorrentOptions,
    defaultOptions: input.config.webtorrent.options,
    downloadsPath: input.config.downloads.path
  });

  const result = spawnSync(command.file, command.args, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  return result.status ?? 1;
}
