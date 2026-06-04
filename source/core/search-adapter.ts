import torrentSearch from 'torrent-search-api';
import type {TorrentResult} from './types.js';

export const torrentSearchAdapter = {
  async search(provider: string, query: string, category: string, limit: number): Promise<TorrentResult[]> {
    torrentSearch.disableAllProviders();
    torrentSearch.enableProvider(provider);
    return torrentSearch.search(query, category, limit) as Promise<TorrentResult[]>;
  },

  async getMagnet(torrent: TorrentResult): Promise<string | undefined> {
    try {
      return await torrentSearch.getMagnet(torrent);
    } catch {
      return undefined;
    }
  }
};
