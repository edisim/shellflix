export type SplitArgsResult = {
  pastelArgs: string[];
  webtorrentOptions: string[];
  query: string;
};

export function splitShellflixArgs(argv: string[]): SplitArgsResult {
  const separatorIndex = argv.indexOf('--');
  const pastelArgs = separatorIndex >= 0 ? argv.slice(0, separatorIndex) : [...argv];
  const webtorrentOptions = separatorIndex >= 0 ? argv.slice(separatorIndex + 1) : [];

  return {
    pastelArgs,
    webtorrentOptions,
    query: pastelArgs.join(' ').trim()
  };
}
