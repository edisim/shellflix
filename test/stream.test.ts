import {EventEmitter} from 'node:events';
import {describe, expect, it} from 'vitest';
import {loadConfig} from '../source/core/config.js';
import {startTorrentStream} from '../source/core/stream.js';

describe('torrent stream session', () => {
  it('starts webtorrent as a controllable background process', () => {
    const child = createFakeChild();
    const updates: string[] = [];
    const killed: Array<{pid: number; signal: NodeJS.Signals}> = [];
    const config = loadConfig({homeDir: '/Users/test', fileExists: () => false});
    const session = startTorrentStream({
      torrent: 'magnet:?xt=urn:btih:test',
      webtorrentOptions: ['--port', '9000'],
      config,
      output: 'VLC'
    }, {
      spawnProcess: (file, args, options) => {
        expect(file).toBe(process.execPath);
        expect(args).toContain('download');
        expect(args).toContain('magnet:?xt=urn:btih:test');
        expect(args).toContain('--vlc');
        expect(args).toContain('--port');
        expect(options?.detached).toBe(true);
        expect(options?.stdio).toEqual(['ignore', 'pipe', 'pipe']);
        return child;
      },
      killProcess: (pid, signal) => {
        killed.push({pid: Number(pid), signal: signal as NodeJS.Signals});
        return true;
      },
      onUpdate: snapshot => {
        updates.push(`${snapshot.status}:${snapshot.log.at(-1) ?? ''}`);
      }
    });

    child.emit('spawn');
    child.stdout.emit('data', '\u001B[32mserver running\u001B[0m\r\n');

    expect(session.isActive()).toBe(true);
    expect(session.snapshot()).toMatchObject({
      status: 'running',
      pid: 4242,
      log: ['server running']
    });
    expect(updates).toContain('running:server running');

    session.stop();

    expect(killed).toEqual([{pid: -4242, signal: 'SIGTERM'}]);
  });

  it('starts IINA without the helper defaulting to picture-in-picture', () => {
    const child = createFakeChild();
    const config = loadConfig({homeDir: '/Users/test', fileExists: () => false});

    startTorrentStream({
      torrent: 'magnet:?xt=urn:btih:test',
      webtorrentOptions: [],
      config,
      output: 'IINA'
    }, {
      spawnProcess: (_file, args) => {
        expect(args).toContain('--iina');
        expect(args).toContain('--not-on-top');
        expect(args).not.toContain('--pip');
        return child;
      }
    });
  });
});

function createFakeChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    pid: number;
    killed: boolean;
    killSignal?: NodeJS.Signals;
    kill: (signal?: NodeJS.Signals) => boolean;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.pid = 4242;
  child.killed = false;
  child.kill = signal => {
    child.killSignal = signal;
    child.killed = true;
    return true;
  };

  return child as never;
}
