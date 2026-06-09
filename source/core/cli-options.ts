export type ParsedShellflixCli = {
  query: string;
  provider?: string;
  timeout: number;
  subtitles: boolean;
  help: boolean;
  version: boolean;
};

const defaultTimeout = 30_000;

export function parseShellflixCliArgs(argv: string[]): ParsedShellflixCli {
  const queryArgs: string[] = [];
  let provider: string | undefined;
  let timeout = defaultTimeout;
  let subtitles = false;
  let help = false;
  let version = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '-h' || arg === '--help') {
      help = true;
      continue;
    }

    if (arg === '-v' || arg === '--version') {
      version = true;
      continue;
    }

    if (arg === '--subtitles') {
      subtitles = true;
      continue;
    }

    if (arg === '--provider') {
      provider = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg?.startsWith('--provider=')) {
      provider = arg.slice('--provider='.length);
      continue;
    }

    if (arg === '--timeout') {
      timeout = parseTimeout(argv[index + 1], timeout);
      index += 1;
      continue;
    }

    if (arg?.startsWith('--timeout=')) {
      timeout = parseTimeout(arg.slice('--timeout='.length), timeout);
      continue;
    }

    if (arg) {
      queryArgs.push(arg);
    }
  }

  return {
    query: queryArgs.join(' ').trim(),
    provider,
    timeout,
    subtitles,
    help,
    version
  };
}

export function isHelpOrVersionArg(argv: string[]): boolean {
  return argv.some(arg => arg === '-h' || arg === '--help' || arg === '-v' || arg === '--version');
}

function parseTimeout(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
