declare module 'torrent-search-api' {
  const torrentSearch: {
    disableAllProviders(): void;
    enableProvider(provider: string): void;
    search(query: string, category: string, limit: number): Promise<unknown[]>;
    getMagnet(torrent: unknown): Promise<string>;
  };

  export default torrentSearch;
}
