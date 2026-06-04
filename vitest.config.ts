import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'source/core/args.ts',
        'source/core/config.ts',
        'source/core/search.ts',
        'source/core/subtitles.ts',
        'source/core/tui-state.ts',
        'source/core/webtorrent.ts',
        'source/components/**/*.tsx'
      ]
    }
  }
});
