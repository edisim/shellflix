let forwardedWebtorrentOptions: string[] = [];

export function setForwardedWebtorrentOptions(options: string[]): void {
  forwardedWebtorrentOptions = [...options];
}

export function getForwardedWebtorrentOptions(): string[] {
  return [...forwardedWebtorrentOptions];
}
