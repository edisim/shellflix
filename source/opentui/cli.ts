#!/usr/bin/env bun
import {
  BoxRenderable,
  CliRenderEvents,
  createCliRenderer,
  InputRenderable,
  InputRenderableEvents,
  SelectRenderable,
  TextRenderable
} from '@opentui/core';
import {splitShellflixArgs} from '../core/args.js';
import {parseShellflixCliArgs, type ParsedShellflixCli} from '../core/cli-options.js';
import {loadConfig} from '../core/config.js';
import {isSearchableTorrentResult, searchProviders} from '../core/search.js';
import {torrentSearchAdapter} from '../core/search-adapter.js';
import {streamTorrent} from '../core/stream.js';
import {canStreamSelectedResult, createInitialTuiState, reduceTuiState, type TuiState} from '../core/tui-state.js';
import type {ShellflixConfig, TorrentResult} from '../core/types.js';

const rawArgs = process.argv.slice(2);
const {pastelArgs, webtorrentOptions} = splitShellflixArgs(rawArgs);
const parsed = parseShellflixCliArgs(pastelArgs);
const config = withCliOptions(loadConfig(), parsed);

await runOpenTuiShellflix({
  query: parsed.query,
  subtitles: parsed.subtitles,
  config,
  webtorrentOptions
});

type RunOpenTuiInput = {
  query: string;
  subtitles: boolean;
  config: ShellflixConfig;
  webtorrentOptions: string[];
};

async function runOpenTuiShellflix(input: RunOpenTuiInput): Promise<void> {
  if (input.query && isTorrentIdentifier(input.query)) {
    process.exit(streamTorrent({torrent: input.query, webtorrentOptions: input.webtorrentOptions, config: input.config}));
  }

  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    clearOnShutdown: true,
    openConsoleOnError: false,
    targetFps: 30,
    useKittyKeyboard: {
      disambiguate: true,
      alternateKeys: true
    }
  });

  let didQuit = false;
  let state = createInitialTuiState({
    query: input.query,
    provider: input.config.torrents.providers.active,
    mode: input.query ? 'idle' : 'search',
    status: input.query ? 'Ready to search' : 'Enter a legal torrent search',
    subtitleEnabled: input.subtitles,
    output: input.config.outputs.favorites[0],
    terminalWidth: renderer.width
  });

  const app = new BoxRenderable(renderer, {
    id: 'shellflix-open-tui',
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    gap: 1,
    paddingX: 1
  });

  const header = new BoxRenderable(renderer, {
    id: 'shellflix-header',
    width: '100%',
    borderStyle: 'single',
    borderColor: '#666666',
    paddingX: 1,
    flexDirection: 'column'
  });
  const title = new TextRenderable(renderer, {id: 'shellflix-title', content: '', fg: '#d7e1e8'});
  const query = new TextRenderable(renderer, {id: 'shellflix-query', content: '', fg: '#a7b0b7'});
  const status = new TextRenderable(renderer, {id: 'shellflix-status', content: '', fg: '#8bd5ff'});
  header.add(title);
  header.add(query);
  header.add(status);

  const resultsPanel = new BoxRenderable(renderer, {
    id: 'shellflix-results-panel',
    width: '100%',
    flexGrow: 1,
    minHeight: 8,
    borderStyle: 'single',
    borderColor: '#666666',
    paddingX: 1,
    flexDirection: 'column'
  });
  const resultsTitle = new TextRenderable(renderer, {id: 'shellflix-results-title', content: 'Results', fg: '#d7e1e8'});
  const emptyResults = new TextRenderable(renderer, {
    id: 'shellflix-empty-results',
    content: 'No results yet. Try Sintel, public-domain torrents, or your own magnet link.',
    fg: '#7c858d',
    wrapMode: 'word'
  });
  const results = new SelectRenderable(renderer, {
    id: 'shellflix-results',
    width: '100%',
    height: 10,
    options: [],
    showDescription: true,
    showScrollIndicator: true,
    wrapSelection: false,
    backgroundColor: '#0b0f12',
    textColor: '#d7e1e8',
    selectedBackgroundColor: '#18323f',
    selectedTextColor: '#ffffff',
    descriptionColor: '#77838c',
    selectedDescriptionColor: '#b6c4cd'
  });
  resultsPanel.add(resultsTitle);
  resultsPanel.add(emptyResults);
  resultsPanel.add(results);

  const details = new BoxRenderable(renderer, {
    id: 'shellflix-details',
    width: '100%',
    height: 5,
    borderStyle: 'single',
    borderColor: '#666666',
    paddingX: 1,
    flexDirection: 'column'
  });
  const detailsTitle = new TextRenderable(renderer, {id: 'shellflix-details-title', content: 'Details', fg: '#d7e1e8'});
  const detailsBody = new TextRenderable(renderer, {id: 'shellflix-details-body', content: '', fg: '#a7b0b7', wrapMode: 'word'});
  details.add(detailsTitle);
  details.add(detailsBody);

  const searchInput = new InputRenderable(renderer, {
    id: 'shellflix-search-input',
    width: '100%',
    value: state.query,
    placeholder: 'Sintel or your own legal torrent',
    backgroundColor: '#111820',
    focusedBackgroundColor: '#17232d',
    textColor: '#ffffff',
    cursorColor: '#8bd5ff'
  });

  const footer = new TextRenderable(renderer, {
    id: 'shellflix-footer',
    content: 'Enter stream · / search · p provider · s subtitles · o output · Esc/Ctrl+C quit',
    fg: '#7c858d'
  });

  app.add(header);
  app.add(resultsPanel);
  app.add(details);
  app.add(searchInput);
  app.add(footer);
  renderer.root.add(app);

  function quit(code = 130): void {
    if (didQuit) {
      process.exit(code);
    }

    didQuit = true;
    renderer.destroy();
    process.exit(code);
  }

  function setState(next: TuiState): void {
    state = next;
    renderState();
  }

  function renderState(): void {
    const selected = state.results[state.selectedIndex];
    const mode = state.mode.toUpperCase();

    title.content = `Shellflix ${mode} · ${state.provider} · ${state.layout} · OpenTUI`;
    query.content = `Search: ${state.query || 'press / to search legal torrents'}`;
    status.content = state.status;
    status.fg = state.mode === 'error' ? '#ff6b6b' : '#8bd5ff';

    emptyResults.visible = state.results.length === 0;
    results.visible = state.results.length > 0;
    results.options = state.results.map((result, index) => ({
      name: `${index === state.selectedIndex ? '›' : ' '} ${truncate(result.title, state.layout === 'compact' ? 54 : 72)}`,
      description: describeTorrent(result, state.layout),
      value: index
    }));

    if (state.results.length > 0) {
      results.setSelectedIndex(state.selectedIndex);
    }

    details.visible = state.layout === 'full' && Boolean(selected);
    detailsBody.content = selected
      ? `${selected.title}\nProvider ${selected.provider ?? 'unknown'} · Output ${state.output} · Subtitles ${state.subtitleEnabled ? 'on' : 'off'}`
      : '';

    searchInput.visible = state.mode === 'search';
    if (state.mode === 'search') {
      searchInput.focus();
    } else {
      searchInput.blur();
    }

    renderer.root.requestRender();
  }

  async function runSearch(queryValue: string): Promise<void> {
    setState({...state, query: queryValue, mode: 'idle', status: `Searching ${state.provider}...`, results: [], selectedIndex: 0});

    const result = await searchProviders({
      query: queryValue,
      providers: input.config.torrents.providers.available,
      activeProvider: state.provider,
      limit: input.config.torrents.limit,
      timeoutMs: input.config.torrents.timeout,
      adapter: torrentSearchAdapter
    });
    const lastAttempt = result.attempts.at(-1);

    setState({
      ...state,
      provider: lastAttempt?.provider ?? state.provider,
      results: result.results,
      selectedIndex: 0,
      status: result.results.length > 0
        ? `Found ${result.results.length} result(s) via ${lastAttempt?.provider ?? state.provider}`
        : 'No torrents found. Press / to search again or p to change provider.'
    });
  }

  async function startSelectedStream(torrent: TorrentResult | undefined): Promise<void> {
    if (!isSearchableTorrentResult(torrent)) {
      setState({...state, mode: 'idle', status: 'No streamable result selected. Press / to search again.'});
      return;
    }

    setState({...state, mode: 'streaming', status: 'Resolving magnet...'});
    const magnet = torrent.magnet ?? await torrentSearchAdapter.getMagnet(torrent);

    if (!magnet) {
      setState({...state, mode: 'error', status: 'Magnet not found. Press / and try another result.'});
      return;
    }

    renderer.destroy();
    process.exit(streamTorrent({torrent: magnet, webtorrentOptions: input.webtorrentOptions, config: input.config}));
  }

  searchInput.on(InputRenderableEvents.ENTER, value => {
    const nextQuery = String(value).trim();
    if (nextQuery) {
      void runSearch(nextQuery);
    }
  });

  results.on('selectionChanged', index => {
    if (typeof index === 'number' && index !== state.selectedIndex) {
      setState({...state, selectedIndex: index});
    }
  });

  renderer.keyInput.on('keypress', key => {
    if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
      quit();
      return;
    }

    if (state.mode === 'search') {
      return;
    }

    if (key.name === 'up') {
      setState(reduceTuiState(state, {type: 'moveSelection', direction: -1}));
      return;
    }

    if (key.name === 'down') {
      setState(reduceTuiState(state, {type: 'moveSelection', direction: 1}));
      return;
    }

    if (key.name === 'return') {
      if (!canStreamSelectedResult(state)) {
        setState(reduceTuiState(state, {type: 'keyboard', key: 'return'}));
        return;
      }

      void startSelectedStream(state.results[state.selectedIndex]);
      return;
    }

    if (key.sequence === '/') {
      searchInput.value = '';
      setState(reduceTuiState(state, {type: 'keyboard', key: '/'}));
      return;
    }

    if (key.sequence === 'p') {
      setState(cycleProvider(state, input.config));
      return;
    }

    if (key.sequence === 's') {
      setState(reduceTuiState(state, {type: 'keyboard', key: 's'}));
      return;
    }

    if (key.sequence === 'o') {
      setState(cycleOutput(state, input.config));
    }
  });

  renderer.on(CliRenderEvents.RESIZE, () => {
    setState({
      ...state,
      layout: renderer.width < 80 ? 'compact' : 'full'
    });
  });

  process.once('SIGINT', () => quit());
  process.once('SIGTERM', () => quit(143));

  renderState();

  if (input.query) {
    void runSearch(input.query);
  }
}

function withCliOptions(config: ShellflixConfig, cliOptions: ParsedShellflixCli): ShellflixConfig {
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
  const outputs = config.outputs.favorites.length > 0 ? config.outputs.favorites : config.outputs.available;
  const currentIndex = outputs.indexOf(state.output);
  const nextOutput = outputs[(currentIndex + 1) % outputs.length] ?? state.output;

  return {
    ...state,
    output: nextOutput,
    mode: 'output',
    status: `Output set to ${nextOutput}.`
  };
}

function describeTorrent(result: TorrentResult, layout: TuiState['layout']): string {
  const meta = [result.provider, formatNumber(result.seeds), formatNumber(result.peers), result.size, result.time]
    .filter(Boolean)
    .join('  ');

  return layout === 'compact' ? String(result.provider ?? '') : meta;
}

function formatNumber(value: unknown): string {
  return typeof value === 'number' ? String(value) : '';
}

function truncate(value: string, length: number): string {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1)}…`;
}

function isTorrentIdentifier(value: string): boolean {
  return value.startsWith('magnet:') || value.startsWith('http://') || value.startsWith('https://') || value.endsWith('.torrent');
}
