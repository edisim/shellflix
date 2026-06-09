import {describe, expect, it} from 'vitest';
import {getOutputChoices, outputToWebtorrentOption, withOutputWebtorrentOption} from '../source/core/output.js';
import {loadConfig} from '../source/core/config.js';

describe('output selection', () => {
  it('offers available outputs instead of only favorites', () => {
    const config = loadConfig({
      homeDir: '/Users/test',
      fileExists: () => false,
      locale: 'en-US'
    });

    expect(config.outputs.favorites).toEqual(['VLC']);
    expect(getOutputChoices(config)).toContain('IINA');
  });

  it('maps selected outputs to webtorrent player flags', () => {
    expect(outputToWebtorrentOption('IINA')).toBe('--iina');
    expect(outputToWebtorrentOption('VLC')).toBe('--vlc');
  });

  it('keeps explicitly forwarded player flags ahead of the TUI setting', () => {
    expect(withOutputWebtorrentOption(['--iina'], 'VLC')).toEqual(['--iina', '--not-on-top']);
    expect(withOutputWebtorrentOption(['--port', '1234'], 'IINA')).toEqual(['--port', '1234', '--iina', '--not-on-top']);
  });

  it('preserves explicit IINA picture-in-picture requests', () => {
    expect(withOutputWebtorrentOption(['--iina', '--pip'], 'VLC')).toEqual(['--iina', '--pip']);
  });
});
