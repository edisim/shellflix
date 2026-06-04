import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const playerFlags = ['Airplay', 'Chromecast', 'DLNA', 'MPlayer', 'mpv', 'omx', 'VLC', 'IINA', 'XBMC', 'stdout'].map(player => `--${player.toLowerCase()}`);

export type WebtorrentCommandInput = {
  torrent: string;
  dynamicOptions: string[];
  defaultOptions: string[];
  downloadsPath: string;
  resolveBinary?: () => string;
};

export type WebtorrentCommand = {
  file: string;
  args: string[];
};

export function normalizeWebtorrentOptions(input: Omit<WebtorrentCommandInput, 'torrent' | 'resolveBinary'>): string[] {
  const dynamicOptions = [...input.dynamicOptions];
  const hasDynamicPlayer = dynamicOptions.some(option => playerFlags.includes(option.toLowerCase()));
  const defaults = hasDynamicPlayer ? input.defaultOptions.filter(option => !playerFlags.includes(option.toLowerCase())) : [...input.defaultOptions];
  const options = [...defaults, ...dynamicOptions];
  const hasOut = options.some((option, index) => option === '--out' || option === '-o' || (index > 0 && (options[index - 1] === '--out' || options[index - 1] === '-o')));

  if (!hasOut) {
    options.push('--out', input.downloadsPath);
  }

  return options;
}

export function buildWebtorrentCommand(input: WebtorrentCommandInput): WebtorrentCommand {
  const binary = input.resolveBinary?.() ?? require.resolve('shellflix-webtorrent-cli/bin/cmd.js');
  const options = normalizeWebtorrentOptions(input);

  return {
    file: process.execPath,
    args: [binary, 'download', input.torrent, ...options]
  };
}
