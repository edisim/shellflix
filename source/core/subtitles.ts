import {mkdirSync, writeFileSync} from 'node:fs';
import {basename, dirname, join} from 'node:path';
import {fetch} from 'undici';
import type {SubtitleResult} from './types.js';

type DownloadOptions = {
  downloadsPath: string;
  save: boolean;
  fetchText?: (url: string) => Promise<string>;
};

type DownloadedSubtitle = {
  path: string;
};

export function sanitizeSubtitleFilename(filename: string): string {
  return basename(String(filename)).replace(/[\\/:*?"<>|\x00-\x1F]/g, '_');
}

export function encodeSubtitleUrl(url: string): string {
  return encodeURI(decodeURI(url));
}

export async function downloadSubtitle(subtitle: SubtitleResult, options: DownloadOptions): Promise<DownloadedSubtitle> {
  const url = encodeSubtitleUrl(subtitle.url);
  const filename = sanitizeSubtitleFilename(subtitle.filename);
  const targetPath = join(options.downloadsPath, filename);
  const fetchText = options.fetchText ?? defaultFetchText;
  const content = await fetchText(url);

  if (options.save) {
    mkdirSync(dirname(targetPath), {recursive: true});
    writeFileSync(targetPath, content);
    return {path: targetPath};
  }

  const tempPath = join(process.env.TMPDIR ?? '/tmp', filename);
  writeFileSync(tempPath, content);
  return {path: tempPath};
}

async function defaultFetchText(url: string): Promise<string> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Unable to download subtitle (${response.status} ${response.statusText}).`);
  }

  return response.text();
}
