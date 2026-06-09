#!/usr/bin/env node
'use strict';

const {spawn, spawnSync} = require('node:child_process');
const {existsSync, mkdirSync, writeFileSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
const createTorrent = require('../../node_modules/shellflix-webtorrent-cli/node_modules/create-torrent');

const repoRoot = join(__dirname, '..', '..');
const distCli = join(repoRoot, 'dist', 'cli.js');
const supportedPlayers = ['iina', 'vlc', 'mpv'];

main().catch(error => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!existsSync(distCli)) {
    throw new Error('dist/cli.js is missing. Run npm run build before test:live-player.');
  }

  const player = options.player ?? detectPlayer();

  if (!player) {
    throw new Error('No supported live player found. Install IINA, VLC, or mpv, or pass --player <iina|vlc|mpv>.');
  }

  if (!isPlayerAvailable(player)) {
    throw new Error(`Player "${player}" is not available on this machine.`);
  }

  const root = makeTempDir();
  const home = join(root, 'home');
  const downloads = join(root, 'downloads');
  const fixture = join(downloads, 'shellflix-live-player-test.wav');
  const torrentPath = join(root, 'shellflix-live-player-test.torrent');

  mkdirSync(home, {recursive: true});
  mkdirSync(downloads, {recursive: true});
  writeFileSync(fixture, createWavTone());
  writeFileSync(join(home, '.shellflix.json'), JSON.stringify({
    downloads: {
      path: downloads,
      save: true
    },
    outputs: {
      favorites: [player]
    },
    webtorrent: {
      options: ['--keep-seeding']
    }
  }, null, 2));
  await createTorrentFile(fixture, torrentPath);

  console.log(`Shellflix live-player test`);
  console.log(`Player: ${player}`);
  console.log(`Fixture: ${fixture}`);
  console.log(`This opens the real player against a local legal torrent stream.`);
  console.log(options.keepOpen ? 'Stop with Ctrl+C when you are done.' : `Shellflix will stop after ${options.durationSeconds}s.`);
  console.log('');

  await runShellflix({
    args: [torrentPath, '--', '--port', '0'],
    cwd: root,
    env: {
      ...process.env,
      HOME: home,
      SHELLFLIX_RENDERER: 'ink'
    },
    durationMs: options.keepOpen ? null : options.durationSeconds * 1000
  });
}

function parseArgs(args) {
  const options = {
    durationSeconds: 20,
    help: false,
    keepOpen: false,
    player: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--keep-open') {
      options.keepOpen = true;
      continue;
    }

    if (arg === '--duration') {
      const rawValue = args[index + 1];
      const duration = Number(rawValue);

      if (!Number.isFinite(duration) || duration <= 0) {
        throw new Error('--duration must be a positive number of seconds.');
      }

      options.durationSeconds = duration;
      index += 1;
      continue;
    }

    if (arg === '--player') {
      const player = args[index + 1]?.toLowerCase();

      if (!supportedPlayers.includes(player)) {
        throw new Error('--player must be one of: iina, vlc, mpv.');
      }

      options.player = player;
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage: npm run test:live-player -- [options]

Opens a real local player against a legal local Shellflix torrent stream.

Options:
  --player <iina|vlc|mpv>  Player to open. Defaults to first installed player.
  --duration <seconds>     Stop Shellflix after this many seconds. Default: 20.
  --keep-open              Keep Shellflix running until Ctrl+C.
  -h, --help               Show this help.

Examples:
  npm run test:live-player
  npm run test:live-player -- --player iina --duration 30
  npm run test:live-player -- --player vlc --keep-open
`);
}

function detectPlayer() {
  return supportedPlayers.find(isPlayerAvailable) ?? null;
}

function isPlayerAvailable(player) {
  if (player === 'iina') {
    return existsSync('/Applications/IINA.app/Contents/MacOS/iina-cli');
  }

  if (player === 'vlc') {
    return commandExists('vlc') || existsSync('/Applications/VLC.app/Contents/MacOS/VLC');
  }

  if (player === 'mpv') {
    return commandExists('mpv');
  }

  return false;
}

function commandExists(command) {
  return spawnSync('which', [command], {stdio: 'ignore'}).status === 0;
}

function makeTempDir() {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const root = join(tmpdir(), `shellflix-live-player-${id}`);

  mkdirSync(root, {recursive: true});
  return root;
}

function createTorrentFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    createTorrent(inputPath, {
      name: 'shellflix-live-player-test.wav',
      createdBy: 'shellflix live player test',
      announce: []
    }, (error, torrent) => {
      if (error) {
        reject(error);
        return;
      }

      writeFileSync(outputPath, torrent);
      resolve();
    });
  });
}

function createWavTone() {
  const durationSeconds = 8;
  const sampleRate = 44_100;
  const channels = 1;
  const bytesPerSample = 2;
  const sampleCount = sampleRate * durationSeconds;
  const dataSize = sampleCount * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < sampleCount; index += 1) {
    const progress = index / sampleCount;
    const envelope = Math.min(1, progress * 20, (1 - progress) * 20);
    const sample = Math.sin(2 * Math.PI * 440 * (index / sampleRate)) * 0.08 * envelope;

    buffer.writeInt16LE(Math.round(sample * 0x7fff), 44 + index * bytesPerSample);
  }

  return buffer;
}

function runShellflix({args, cwd, env, durationMs}) {
  return new Promise((resolve, reject) => {
    const detached = process.platform !== 'win32';
    const child = spawn(process.execPath, [distCli, ...args], {
      cwd,
      detached,
      env,
      stdio: 'inherit'
    });
    let stopped = false;
    let timer = null;

    const stop = signal => {
      if (stopped) {
        return;
      }

      stopped = true;
      if (timer) {
        clearTimeout(timer);
      }

      console.log(`\nStopping Shellflix live-player test (${signal}).`);

      try {
        if (detached) {
          process.kill(-child.pid, 'SIGINT');
        } else {
          child.kill('SIGINT');
        }
      } catch {
        child.kill('SIGTERM');
      }

      setTimeout(() => {
        if (!child.killed) {
          try {
            if (detached) {
              process.kill(-child.pid, 'SIGTERM');
            } else {
              child.kill('SIGTERM');
            }
          } catch {}
        }
      }, 2_000).unref();
    };

    if (durationMs) {
      timer = setTimeout(() => stop('duration elapsed'), durationMs);
    }

    process.once('SIGINT', () => stop('Ctrl+C'));

    child.on('error', error => {
      if (timer) {
        clearTimeout(timer);
      }

      reject(error);
    });
    child.on('exit', code => {
      if (timer) {
        clearTimeout(timer);
      }

      if (code === 0 || stopped) {
        resolve();
        return;
      }

      reject(new Error(`shellflix exited with ${code}`));
    });
  });
}
