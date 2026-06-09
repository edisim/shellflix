#!/usr/bin/env node
'use strict';

const {spawn} = require('node:child_process');
const {createHash} = require('node:crypto');
const {existsSync, mkdirSync, readFileSync, writeFileSync} = require('node:fs');
const {tmpdir} = require('node:os');
const {dirname, join} = require('node:path');
const createTorrent = require('../../node_modules/shellflix-webtorrent-cli/node_modules/create-torrent');

const repoRoot = join(__dirname, '..', '..');
const distCli = join(repoRoot, 'dist', 'cli.js');
const expectedContent = Buffer.from('Shellflix legal local stream e2e fixture.\nSelected player must receive these bytes.\n', 'utf8');
const expectedSha256 = createHash('sha256').update(expectedContent).digest('hex');

main().catch(error => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});

async function main() {
  if (!existsSync(distCli)) {
    throw new Error('dist/cli.js is missing. Run npm run build before test:e2e:player.');
  }

  const root = makeTempDir();
  const home = join(root, 'home');
  const downloads = join(root, 'downloads');
  const bin = join(root, 'bin');
  const fixture = join(downloads, 'shellflix-e2e-stream.txt');
  const torrentPath = join(root, 'shellflix-e2e-stream.torrent');
  const playerLog = join(root, 'player-log.json');

  mkdirSync(home, {recursive: true});
  mkdirSync(downloads, {recursive: true});
  mkdirSync(bin, {recursive: true});
  writeFileSync(fixture, expectedContent);
  writeFileSync(join(home, '.shellflix.json'), JSON.stringify({
    downloads: {
      path: downloads,
      save: true
    },
    outputs: {
      favorites: ['mpv']
    },
    webtorrent: {
      options: ['--keep-seeding']
    }
  }, null, 2));
  writeFakePlayer(join(bin, 'mpv'));
  await createTorrentFile(fixture, torrentPath);

  const result = await runShellflix({
    args: [torrentPath, '--', '--port', '0'],
    cwd: root,
    env: {
      ...process.env,
      HOME: home,
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      SHELLFLIX_RENDERER: 'ink',
      SHELLFLIX_FAKE_PLAYER_LOG: playerLog,
      SHELLFLIX_FAKE_PLAYER_EXPECTED_SHA256: expectedSha256
    },
    timeoutMs: 20_000
  });

  if (result.code !== 0) {
    throw new Error([
      `shellflix exited with ${result.code}`,
      '--- stdout ---',
      result.stdout,
      '--- stderr ---',
      result.stderr
    ].join('\n'));
  }

  if (!existsSync(playerLog)) {
    throw new Error('Fake player did not write a player log, so the selected player was not opened.');
  }

  const log = JSON.parse(readFileSync(playerLog, 'utf8'));

  assertEqual(log.player, 'mpv', 'selected player binary');
  assertEqual(log.sha256, expectedSha256, 'stream sha256');
  assertEqual(log.bytes, expectedContent.length, 'stream byte count');

  if (!String(log.url).startsWith('http://localhost:')) {
    throw new Error(`Expected local WebTorrent stream URL, got ${log.url}`);
  }

  console.log(`player-stream e2e passed: mpv opened ${log.url} and received ${log.bytes} bytes`);
}

function makeTempDir() {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const root = join(tmpdir(), `shellflix-player-e2e-${id}`);

  mkdirSync(root, {recursive: true});
  return root;
}

function createTorrentFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    createTorrent(inputPath, {
      name: 'shellflix-e2e-stream.txt',
      createdBy: 'shellflix e2e',
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

function runShellflix({args, cwd, env, timeoutMs}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [distCli, ...args], {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`shellflix did not finish within ${timeoutMs}ms`));
    }, timeoutMs);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', chunk => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('exit', code => {
      clearTimeout(timeout);
      resolve({code, stdout, stderr});
    });
  });
}

function writeFakePlayer(path) {
  const script = `#!/usr/bin/env node
'use strict';

const {createHash} = require('node:crypto');
const {writeFileSync, mkdirSync} = require('node:fs');
const {dirname, basename} = require('node:path');
const http = require('node:http');
const https = require('node:https');

const url = process.argv.find(arg => /^https?:\\/\\//.test(arg));
const logPath = process.env.SHELLFLIX_FAKE_PLAYER_LOG;
const expectedSha256 = process.env.SHELLFLIX_FAKE_PLAYER_EXPECTED_SHA256;

if (!url) {
  console.error('fake player did not receive a stream URL');
  process.exit(2);
}

if (!logPath) {
  console.error('SHELLFLIX_FAKE_PLAYER_LOG is missing');
  process.exit(2);
}

const client = url.startsWith('https:') ? https : http;

client.get(url, response => {
  const chunks = [];

  if (response.statusCode && response.statusCode >= 400) {
    console.error('stream request failed with status ' + response.statusCode);
    process.exit(3);
  }

  response.on('data', chunk => {
    chunks.push(chunk);
  });
  response.on('end', () => {
    const body = Buffer.concat(chunks);
    const sha256 = createHash('sha256').update(body).digest('hex');

    if (expectedSha256 && sha256 !== expectedSha256) {
      console.error('stream sha256 mismatch: ' + sha256);
      process.exit(4);
    }

    mkdirSync(dirname(logPath), {recursive: true});
    writeFileSync(logPath, JSON.stringify({
      player: basename(process.argv[1]),
      url,
      statusCode: response.statusCode,
      bytes: body.length,
      sha256
    }, null, 2));
  });
}).on('error', error => {
  console.error(error.stack || error.message);
  process.exit(5);
});
`;

  writeFileSync(path, script, {mode: 0o755});
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`Expected ${label} ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}
