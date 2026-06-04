#!/usr/bin/env node
import Pastel from 'pastel';
import {setForwardedWebtorrentOptions} from './runtime.js';
import {splitShellflixArgs} from './core/args.js';

const {pastelArgs, webtorrentOptions} = splitShellflixArgs(process.argv.slice(2));
setForwardedWebtorrentOptions(webtorrentOptions);

const app = new Pastel({
  importMeta: import.meta,
  name: 'shellflix',
  description: 'Find and stream legal torrents from a modern terminal UI.'
});

await app.run([process.argv[0] ?? 'node', process.argv[1] ?? 'shellflix', ...pastelArgs]);
