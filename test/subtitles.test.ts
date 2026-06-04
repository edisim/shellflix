import {mkdtempSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach, describe, expect, it} from 'vitest';
import {downloadSubtitle, encodeSubtitleUrl, sanitizeSubtitleFilename} from '../source/core/subtitles.js';

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, {recursive: true, force: true});
  }
});

describe('subtitles', () => {
  it('sanitizes unsafe subtitle filenames', () => {
    expect(sanitizeSubtitleFilename('../bad:name?.srt')).toBe('bad_name_.srt');
  });

  it('encodes subtitle URLs without double-encoding existing escapes', () => {
    expect(encodeSubtitleUrl('https://example.com/a file%20name.srt')).toBe('https://example.com/a%20file%20name.srt');
  });

  it('creates target directories before writing downloaded subtitles', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'shellflix-subtitle-'));
    tempDirs.push(dir);

    const result = await downloadSubtitle(
      {url: 'https://example.com/sub title.srt', filename: '../unsafe:name.srt'},
      {
        downloadsPath: join(dir, 'nested'),
        save: true,
        fetchText: async url => `from ${url}`
      }
    );

    expect(result.path.endsWith('unsafe_name.srt')).toBe(true);
    expect(readFileSync(result.path, 'utf8')).toBe('from https://example.com/sub%20title.srt');
  });

  it('writes to temp when downloads are not saved', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'shellflix-temp-subtitle-'));
    const previousTmpDir = process.env.TMPDIR;
    tempDirs.push(dir);
    process.env.TMPDIR = dir;

    try {
      const result = await downloadSubtitle(
        {url: 'https://example.com/sub.srt', filename: 'temp.srt'},
        {
          downloadsPath: '/ignored',
          save: false,
          fetchText: async () => 'temporary'
        }
      );

      expect(readFileSync(result.path, 'utf8')).toBe('temporary');
    } finally {
      process.env.TMPDIR = previousTmpDir;
    }
  });
});
