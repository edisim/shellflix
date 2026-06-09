import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Box, Text, useApp, useInput, useStdout} from 'ink';
import {TextInput} from '@inkjs/ui';
import {argument, option} from 'pastel';
import zod from 'zod';
import {ShellflixTui} from '../components/shellflix-tui.js';
import {applyPreferredOutput, loadConfig, saveOutputFavorite} from '../core/config.js';
import {runClackFallback} from '../core/fallback.js';
import {getOutputChoices} from '../core/output.js';
import {isSearchableTorrentResult, searchProviders} from '../core/search.js';
import {torrentSearchAdapter} from '../core/search-adapter.js';
import {streamTorrent} from '../core/stream.js';
import {resolveSystemLocale} from '../core/system-locale.js';
import {canStreamSelectedResult, createInitialTuiState, getExitIntent, reduceTuiState, type ExitIntent, type TuiState} from '../core/tui-state.js';
import type {ShellflixConfig, TorrentResult} from '../core/types.js';
import {getForwardedWebtorrentOptions} from '../runtime.js';

export const args = zod.array(
  zod.string().describe(
    argument({
      name: 'title-or-torrent',
      description: 'Video title, magnet URI, torrent URL, or local torrent path.'
    })
  )
).default([]);

export const options = zod.object({
  provider: zod.string().optional().describe(
    option({
      description: 'Start search with a specific provider.',
      valueDescription: 'provider'
    })
  ),
  timeout: zod.number().default(30_000).describe(
    option({
      description: 'Provider timeout in milliseconds.',
      defaultValueDescription: '30000'
    })
  ),
  subtitles: zod.boolean().default(false).describe(
    option({
      description: 'Start with subtitles enabled.'
    })
  )
});

type Props = {
  args: zod.infer<typeof args>;
  options: zod.infer<typeof options>;
};

export default function IndexCommand(props: Props) {
  const config = useMemo(() => withCliOptions(loadConfig(), props.options), [props.options]);
  const locale = useMemo(() => resolveSystemLocale(), []);
  const initialQuery = props.args.join(' ').trim();
  const canPrompt = Boolean(process.stdin.isTTY);
  const canRenderTui = Boolean(process.stdin.isTTY && process.stdout.isTTY);
  const {exit} = useApp();
  const {stdout} = useStdout();
  const didStart = useRef(false);
  const [searchInput, setSearchInput] = useState(initialQuery);
  const [state, setState] = useState<TuiState>(() => createInitialTuiState({
    query: initialQuery,
    provider: config.torrents.providers.active,
    mode: initialQuery ? 'idle' : 'search',
    status: initialQuery ? 'Ready to search' : 'Enter a legal torrent search',
    subtitleEnabled: props.options.subtitles,
    output: config.outputs.favorites[0],
    terminalWidth: stdout.columns
  }));

  const runSearch = useCallback(async (query: string) => {
    setState(current => ({...current, query, mode: 'idle', status: `Searching ${current.provider}...`, results: []}));

    const result = await searchProviders({
      query,
      providers: config.torrents.providers.available,
      activeProvider: config.torrents.providers.active,
      limit: config.torrents.limit,
      timeoutMs: config.torrents.timeout,
      adapter: torrentSearchAdapter
    });

    const lastAttempt = result.attempts.at(-1);
    setState(current => ({
      ...current,
      results: result.results,
      selectedIndex: 0,
      status: result.results.length > 0
        ? `Found ${result.results.length} result(s) via ${lastAttempt?.provider ?? current.provider}`
        : 'No torrents found. Press / to search again or p to change provider.'
    }));
  }, [config]);

  const startSelectedStream = useCallback(async (torrent: TorrentResult | undefined, output = state.output) => {
    if (!isSearchableTorrentResult(torrent)) {
      setState(current => ({...current, mode: 'idle', status: 'No streamable result selected. Press / to search again.'}));
      return;
    }

    setState(current => ({...current, mode: 'streaming', status: 'Resolving magnet...'}));
    const magnet = torrent.magnet ?? await torrentSearchAdapter.getMagnet(torrent);

    if (!magnet) {
      setState(current => ({...current, mode: 'error', status: 'Magnet not found. Press / and try another result.'}));
      return;
    }

    const status = streamTorrent({
      torrent: magnet,
      webtorrentOptions: getForwardedWebtorrentOptions(),
      config,
      output
    });

    process.exitCode = status;
    exit();
  }, [config, exit, state.output]);

  const handleExitIntent = useCallback((_intent: ExitIntent) => {
    exit();
    process.exit(130);
  }, [exit]);

  useEffect(() => {
    if (!canRenderTui) {
      return;
    }

    const handleSigint = () => handleExitIntent('ctrl+c');
    process.on('SIGINT', handleSigint);
    return () => {
      process.off('SIGINT', handleSigint);
    };
  }, [canRenderTui, handleExitIntent]);

  useEffect(() => {
    if (didStart.current) {
      return;
    }

    didStart.current = true;

    if (!canRenderTui) {
      if (!canPrompt && !initialQuery) {
        console.error('Shellflix needs a TTY for interactive search. Pass a legal title, magnet URI, torrent URL, or run it in a terminal.');
        process.exitCode = 1;
        exit();
        return;
      }

      if (!canPrompt && initialQuery) {
        void runHeadlessQuery(initialQuery, config, startSelectedStream, exit);
        return;
      }

      runClackFallback({
        initialQuery,
        config,
        search: async query => (await searchProviders({
          query,
          providers: config.torrents.providers.available,
          activeProvider: config.torrents.providers.active,
          limit: config.torrents.limit,
          timeoutMs: config.torrents.timeout,
          adapter: torrentSearchAdapter
        })).results
      }).then(startSelectedStream).catch(error => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
        exit();
      });
      return;
    }

    if (initialQuery && isTorrentIdentifier(initialQuery)) {
      setState(current => ({...current, mode: 'streaming', status: 'Starting direct stream...'}));
      exit(streamTorrent({torrent: initialQuery, webtorrentOptions: getForwardedWebtorrentOptions(), config}));
      return;
    }

    if (initialQuery) {
      void runSearch(initialQuery);
    }
  }, [canPrompt, canRenderTui, config, exit, initialQuery, runSearch, startSelectedStream]);

  useInput((input, key) => {
    const exitIntent = getExitIntent(input, key);

    if (exitIntent) {
      handleExitIntent(exitIntent);
      return;
    }

    if (state.mode === 'search') {
      return;
    }

    if (key.upArrow) {
      setState(current => reduceTuiState(current, {type: 'moveSelection', direction: -1}));
      return;
    }

    if (key.downArrow) {
      setState(current => reduceTuiState(current, {type: 'moveSelection', direction: 1}));
      return;
    }

    if (key.return) {
      if (!canStreamSelectedResult(state)) {
        setState(current => reduceTuiState(current, {type: 'keyboard', key: 'return'}));
        return;
      }

      void startSelectedStream(state.results[state.selectedIndex]);
      return;
    }

    if (input === '/') {
      setSearchInput('');
      setState(current => reduceTuiState(current, {type: 'keyboard', key: '/'}));
      return;
    }

    if (input === 'p') {
      setState(current => cycleProvider(current, config));
      return;
    }

    if (input === 's') {
      setState(current => reduceTuiState(current, {type: 'keyboard', key: input}));
      return;
    }

    if (input === 'o') {
      setState(current => cycleOutput(current, config));
    }
  }, {isActive: canRenderTui});

  if (!canRenderTui) {
    return null;
  }

  return (
    <Box flexDirection="column">
      <ShellflixTui state={state} locale={locale} />
      {state.mode === 'search' ? (
        <Box marginTop={1}>
          <Text color="gray">Query </Text>
          <TextInput
            placeholder="Sintel or your own legal torrent"
            defaultValue={searchInput}
            onChange={value => {
              setSearchInput(value);
            }}
            onSubmit={query => {
              if (query.trim()) {
                void runSearch(query.trim());
              }
            }}
          />
        </Box>
      ) : null}
    </Box>
  );
}

function withCliOptions(config: ShellflixConfig, cliOptions: zod.infer<typeof options>): ShellflixConfig {
  const next = structuredClone(config);
  next.torrents.timeout = cliOptions.timeout;

  if (cliOptions.provider) {
    next.torrents.providers.active = cliOptions.provider;
  }

  return next;
}

function cycleProvider(state: TuiState, config: ShellflixConfig): TuiState {
  const providers = config.torrents.providers.available;
  const currentIndex = providers.indexOf(state.provider);
  const nextProvider = providers[(currentIndex + 1) % providers.length] ?? providers[0];

  return {
    ...state,
    provider: nextProvider,
    mode: 'provider',
    status: `Provider set to ${nextProvider}. Press / to search.`
  };
}

function cycleOutput(state: TuiState, config: ShellflixConfig): TuiState {
  const outputs = getOutputChoices(config);
  const currentIndex = outputs.indexOf(state.output);
  const nextOutput = outputs[(currentIndex + 1) % outputs.length] ?? state.output;
  const nextConfig = applyPreferredOutput(config, nextOutput);

  try {
    saveOutputFavorite(nextOutput, {localConfigPath: nextConfig.localConfigPath});
    return {...reduceTuiState(state, {type: 'setOutput', output: nextOutput}), status: `Output set to ${nextOutput}. Saved to ~/.shellflix.json.`};
  } catch (error) {
    return {
      ...state,
      output: nextOutput,
      mode: 'output',
      status: `Output set to ${nextOutput}, but config could not be saved: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function isTorrentIdentifier(value: string): boolean {
  return value.startsWith('magnet:') || value.startsWith('http://') || value.startsWith('https://') || value.endsWith('.torrent');
}

async function runHeadlessQuery(
  query: string,
  config: ShellflixConfig,
  startSelectedStream: (torrent: TorrentResult | undefined) => Promise<void>,
  exit: () => void
): Promise<void> {
  if (isTorrentIdentifier(query)) {
    process.exitCode = streamTorrent({torrent: query, webtorrentOptions: getForwardedWebtorrentOptions(), config});
    exit();
    return;
  }

  const result = await searchProviders({
    query,
    providers: config.torrents.providers.available,
    activeProvider: config.torrents.providers.active,
    limit: 1,
    timeoutMs: config.torrents.timeout,
    adapter: torrentSearchAdapter
  });

  await startSelectedStream(result.results[0]);
  if (!isSearchableTorrentResult(result.results[0])) {
    console.error('No torrents found. Try another legal title or pass a magnet URI directly.');
    process.exitCode = 1;
    exit();
  }
}
