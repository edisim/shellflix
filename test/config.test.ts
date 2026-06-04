import {describe, expect, it} from 'vitest';
import {expandHomePath, loadConfig} from '../source/core/config.js';

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
});
