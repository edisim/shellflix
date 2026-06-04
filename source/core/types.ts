export type TorrentResult = {
  title: string;
  provider?: string;
  seeds?: number;
  peers?: number;
  size?: string;
  time?: string;
  magnet?: string;
  desc?: string;
  [key: string]: unknown;
};

export type SubtitleResult = {
  url: string;
  filename: string;
  downloads?: number;
};

export type ShellflixConfig = {
  localConfigPath: string;
  downloads: {
    path: string;
    save: boolean;
  };
  outputs: {
    supported: string[];
    available: string[];
    favorites: string[];
  };
  torrents: {
    limit: number;
    timeout: number;
    details: {
      seeders: boolean;
      leechers: boolean;
      size: boolean;
      time: boolean;
    };
    providers: {
      available: string[];
      active: string;
    };
  };
  subtitles: {
    limit: number;
    details: {
      downloads: boolean;
    };
    languages: {
      available: string[];
      favorites: string[];
    };
    opensubtitles: {
      useragent: string;
      username: string | null;
      password: string | null;
      ssl: boolean;
    };
  };
  webtorrent: {
    options: string[];
  };
  prompt: {
    rows: number;
  };
};
