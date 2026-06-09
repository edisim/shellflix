import {spawnSync} from 'node:child_process';

type TtyLike = {
  isTTY?: boolean;
};

type EnvLike = Record<string, string | undefined>;

export function shouldLaunchOpenTui(argv: string[], env: EnvLike, stdin: TtyLike, stdout: TtyLike): boolean {
  if (env.SHELLFLIX_RENDERER === 'ink' || env.SHELLFLIX_RENDERER === 'pastel') {
    return false;
  }

  if (env.SHELLFLIX_DISABLE_OPENTUI === '1') {
    return false;
  }

  if (argv.some(arg => arg === '-h' || arg === '--help' || arg === '-v' || arg === '--version')) {
    return false;
  }

  return Boolean(stdin.isTTY && stdout.isTTY);
}

export function hasBunRuntime(): boolean {
  const result = spawnSync('bun', ['--version'], {stdio: 'ignore'});
  return !result.error && result.status === 0;
}
