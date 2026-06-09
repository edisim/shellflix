#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import Pastel from 'pastel';
import {setForwardedWebtorrentOptions} from './runtime.js';
import {splitShellflixArgs} from './core/args.js';
import {hasBunRuntime, shouldLaunchOpenTui} from './core/opentui-runtime.js';

const rawArgs = process.argv.slice(2);
const {pastelArgs, webtorrentOptions} = splitShellflixArgs(rawArgs);

if (shouldLaunchOpenTui(pastelArgs, process.env, process.stdin, process.stdout) && hasBunRuntime()) {
  const opentuiEntry = fileURLToPath(new URL('./opentui/cli.js', import.meta.url));
  const result = spawnSync('bun', [opentuiEntry, ...rawArgs], {
    stdio: 'inherit',
    env: {
      ...process.env,
      SHELLFLIX_RENDERER: 'opentui'
    }
  });

  process.exit(result.status ?? 1);
}

setForwardedWebtorrentOptions(webtorrentOptions);

const app = new Pastel({
  importMeta: import.meta,
  name: 'shellflix',
  description: 'Find and stream legal torrents from a modern terminal UI.'
});

await app.run([process.argv[0] ?? 'node', process.argv[1] ?? 'shellflix', ...pastelArgs]);
