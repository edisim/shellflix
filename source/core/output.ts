import type {ShellflixConfig} from './types.js';

const playerOptions = new Map([
  ['airplay', '--airplay'],
  ['chromecast', '--chromecast'],
  ['dlna', '--dlna'],
  ['mplayer', '--mplayer'],
  ['mpv', '--mpv'],
  ['omx', '--omx'],
  ['vlc', '--vlc'],
  ['iina', '--iina'],
  ['xbmc', '--xbmc'],
  ['stdout', '--stdout']
]);

const playerFlags = new Set(playerOptions.values());

export function getOutputChoices(config: ShellflixConfig): string[] {
  return uniqueValues([
    ...config.outputs.available,
    ...config.outputs.favorites,
    ...config.outputs.supported
  ]);
}

export function outputToWebtorrentOption(output: string | undefined): string | undefined {
  if (!output) {
    return undefined;
  }

  return playerOptions.get(output.trim().toLowerCase());
}

export function withOutputWebtorrentOption(options: string[], output: string | undefined): string[] {
  if (options.some(option => playerFlags.has(option.toLowerCase()))) {
    return [...options];
  }

  const outputOption = outputToWebtorrentOption(output);

  return outputOption ? [...options, outputOption] : [...options];
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(value => value.trim()))];
}
