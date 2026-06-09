import {describe, expect, it} from 'vitest';
import {applyPreferredOutput, expandHomePath, loadConfig, saveOutputFavorite} from '../source/core/config.js';

describe('config path handling', () => {
  it('expands ~ and $HOME download paths', () => {
    expect(expandHomePath('~/Movies', '/Users/test')).toBe('/Users/test/Movies');
    expect(expandHomePath('$HOME/Movies', '/Users/test')).toBe('/Users/test/Movies');
    expect(expandHomePath('~', '/Users/test')).toBe('/Users/test');
  });

  it('merges local config over defaults and preserves array replacement semantics', () => {
    const config = loadConfig({
      homeDir: '/Users/test',
      fileExists: () => true,
      readFile: () => '{"downloads":{"path":"~/Video"},"outputs":{"favorites":["IINA"]}}'
    });

    expect(config.downloads.path).toBe('/Users/test/Video');
    expect(config.outputs.favorites).toEqual(['IINA']);
  });

  it('keeps defaults when no local config exists', () => {
    const config = loadConfig({
      homeDir: '/Users/test',
      fileExists: () => false,
      locale: 'de-DE'
    });

    expect(config.localConfigPath).toBe('/Users/test/.shellflix.json');
    expect(config.downloads.path).toBe('/Users/test/Downloads');
    expect(config.subtitles.languages.favorites[0]).toBe('German');
  });

  it('promotes the selected output in memory', () => {
    const config = applyPreferredOutput(loadConfig({
      homeDir: '/Users/test',
      fileExists: () => false,
      locale: 'en-US'
    }), 'IINA');

    expect(config.outputs.favorites.slice(0, 2)).toEqual(['IINA', 'VLC']);
  });

  it('saves the selected output to the local config file without dropping other settings', () => {
    let writtenPath = '';
    let writtenConfig = '';

    saveOutputFavorite('IINA', {
      homeDir: '/Users/test',
      fileExists: () => true,
      readFile: () => '{"downloads":{"path":"~/Video"},"outputs":{"favorites":["VLC"]}}',
      mkdir: () => undefined,
      writeFile: (path, value) => {
        writtenPath = path;
        writtenConfig = value;
      }
    });

    expect(writtenPath).toBe('/Users/test/.shellflix.json');
    expect(JSON.parse(writtenConfig)).toEqual({
      downloads: {
        path: '~/Video'
      },
      outputs: {
        favorites: ['IINA', 'VLC']
      }
    });
  });
});
