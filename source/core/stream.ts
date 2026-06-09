import {spawnSync} from 'node:child_process';
import {withOutputWebtorrentOption} from './output.js';
import {buildWebtorrentCommand} from './webtorrent.js';
import type {ShellflixConfig} from './types.js';

type StreamInput = {
  torrent: string;
  webtorrentOptions: string[];
  config: ShellflixConfig;
  output?: string;
};

export function streamTorrent(input: StreamInput): number {
  const command = buildWebtorrentCommand({
    torrent: input.torrent,
    dynamicOptions: withOutputWebtorrentOption(input.webtorrentOptions, input.output ?? input.config.outputs.favorites[0]),
    defaultOptions: input.config.webtorrent.options,
    downloadsPath: input.config.downloads.path
  });

  const result = spawnSync(command.file, command.args, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  return result.status ?? 1;
}
