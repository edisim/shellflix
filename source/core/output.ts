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
  const nextOptions = [...options];
  const hasDynamicPlayer = nextOptions.some(option => playerFlags.has(option.toLowerCase()));
  const outputOption = outputToWebtorrentOption(output);

  if (!hasDynamicPlayer && outputOption) {
    nextOptions.push(outputOption);
  }

  if (usesIina(nextOptions) && !usesOption(nextOptions, '--pip') && !usesOption(nextOptions, '--not-on-top')) {
    nextOptions.push('--not-on-top');
  }

  return nextOptions;
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.filter(value => value.trim()))];
}

function usesIina(options: string[]): boolean {
  return usesOption(options, '--iina');
}

function usesOption(options: string[], option: string): boolean {
  return options.some(value => value.toLowerCase() === option);
}
