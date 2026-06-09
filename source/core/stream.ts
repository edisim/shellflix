import {spawn, spawnSync, type ChildProcessByStdio} from 'node:child_process';
import type {Readable} from 'node:stream';
import {withOutputWebtorrentOption} from './output.js';
import {buildWebtorrentCommand, type WebtorrentCommand} from './webtorrent.js';
import type {ShellflixConfig} from './types.js';

type StreamInput = {
  torrent: string;
  webtorrentOptions: string[];
  config: ShellflixConfig;
  output?: string;
};

export type TorrentStreamStatus = 'starting' | 'running' | 'stopped' | 'failed';

export type TorrentStreamSnapshot = {
  status: TorrentStreamStatus;
  command: WebtorrentCommand;
  pid?: number;
  exitCode?: number | null;
  signal?: NodeJS.Signals | null;
  log: string[];
};

export type TorrentStreamSession = {
  snapshot: () => TorrentStreamSnapshot;
  isActive: () => boolean;
  stop: () => void;
};

type StartTorrentStreamOptions = {
  onUpdate?: (snapshot: TorrentStreamSnapshot) => void;
  spawnProcess?: SpawnProcess;
  killProcess?: typeof process.kill;
  maxLogLines?: number;
};

type StreamChildProcess = ChildProcessByStdio<null, Readable, Readable>;
type SpawnProcess = (file: string, args: string[], options: Parameters<typeof spawn>[2]) => StreamChildProcess;

export function streamTorrent(input: StreamInput): number {
  const command = buildWebtorrentCommand({
    torrent: input.torrent,
    dynamicOptions: withOutputWebtorrentOption(input.webtorrentOptions, input.output ?? input.config.outputs.favorites[0]),
    defaultOptions: input.config.webtorrent.options,
    downloadsPath: input.config.downloads.path
  });

  const result = spawnSync(command.file, command.args, {
    cwd: process.cwd(),
    stdio: 'inherit'
  });

  return result.status ?? 1;
}

export function startTorrentStream(input: StreamInput, options: StartTorrentStreamOptions = {}): TorrentStreamSession {
  const command = buildWebtorrentCommand({
    torrent: input.torrent,
    dynamicOptions: withOutputWebtorrentOption(input.webtorrentOptions, input.output ?? input.config.outputs.favorites[0]),
    defaultOptions: input.config.webtorrent.options,
    downloadsPath: input.config.downloads.path
  });
  const child = options.spawnProcess?.(command.file, command.args, {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  }) ?? spawn(command.file, command.args, {
    cwd: process.cwd(),
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const maxLogLines = options.maxLogLines ?? 8;
  const killProcess = options.killProcess ?? process.kill;
  const log: string[] = [];
  let status: TorrentStreamStatus = 'starting';
  let exitCode: number | null | undefined;
  let signal: NodeJS.Signals | null | undefined;
  let killTimer: NodeJS.Timeout | undefined;
  let stopRequested = false;

  function snapshot(): TorrentStreamSnapshot {
    return {
      status,
      command,
      pid: child.pid,
      exitCode,
      signal,
      log: [...log]
    };
  }

  function notify(): void {
    options.onUpdate?.(snapshot());
  }

  function appendOutput(chunk: Buffer | string): void {
    const lines = stripAnsi(String(chunk))
      .replace(/\r/g, '\n')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      log.push(line);
    }

    if (log.length > maxLogLines) {
      log.splice(0, log.length - maxLogLines);
    }

    if (lines.length > 0) {
      notify();
    }
  }

  child.stdout.on('data', appendOutput);
  child.stderr.on('data', appendOutput);
  child.once('spawn', () => {
    status = 'running';
    notify();
  });
  child.once('error', error => {
    status = 'failed';
    log.push(error.message);
    notify();
  });
  child.once('exit', (code, nextSignal) => {
    if (killTimer) {
      clearTimeout(killTimer);
      killTimer = undefined;
    }

    exitCode = code;
    signal = nextSignal;
    status = code === 0 || nextSignal === 'SIGTERM' ? 'stopped' : 'failed';
    notify();
  });

  notify();

  return {
    snapshot,
    isActive: () => status === 'starting' || status === 'running',
    stop: () => {
      if (stopRequested || !(status === 'starting' || status === 'running')) {
        return;
      }

      stopRequested = true;
      killChild(child, 'SIGTERM', killProcess);
      killTimer = setTimeout(() => {
        if (status === 'starting' || status === 'running') {
          killChild(child, 'SIGKILL', killProcess);
        }
      }, 2500);
    }
  };
}

function killChild(child: Pick<StreamChildProcess, 'pid' | 'kill'>, signal: NodeJS.Signals, killProcess: typeof process.kill): void {
  if (!child.pid) {
    child.kill(signal);
    return;
  }

  try {
    killProcess(-child.pid, signal);
  } catch {
    child.kill(signal);
  }
}

function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, '');
}
