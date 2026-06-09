import {describe, expect, it} from 'vitest';
import {isHelpOrVersionArg, parseShellflixCliArgs} from '../source/core/cli-options.js';

describe('CLI option parsing', () => {
  it('parses OpenTUI renderer options without consuming query words', () => {
    expect(parseShellflixCliArgs(['--provider', 'ThePirateBay', '--timeout=1500', '--subtitles', 'Sintel', '2010'])).toEqual({
      query: 'Sintel 2010',
      provider: 'ThePirateBay',
      timeout: 1500,
      subtitles: true,
      help: false,
      version: false
    });
  });

  it('keeps invalid timeout values on the default', () => {
    expect(parseShellflixCliArgs(['--timeout', 'wat']).timeout).toBe(30_000);
  });

  it('detects help and version args', () => {
    expect(isHelpOrVersionArg(['--help'])).toBe(true);
    expect(isHelpOrVersionArg(['-v'])).toBe(true);
    expect(isHelpOrVersionArg(['Sintel'])).toBe(false);
  });
});
