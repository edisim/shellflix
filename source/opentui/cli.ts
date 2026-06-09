#!/usr/bin/env bun
import {
  BoxRenderable,
  CliRenderEvents,
  createCliRenderer,
  bg,
  fg,
  StyledText,
  type TextChunk,
  TextRenderable
} from '@opentui/core';
import {splitShellflixArgs} from '../core/args.js';
import {parseShellflixCliArgs, type ParsedShellflixCli} from '../core/cli-options.js';
import {applyPreferredOutput, loadConfig, saveOutputFavorite} from '../core/config.js';
import {getOutputChoices} from '../core/output.js';
import {formatResultMetaColumns} from '../core/result-format.js';
import {isSearchableTorrentResult, searchProviders} from '../core/search.js';
import {torrentSearchAdapter} from '../core/search-adapter.js';
import {startTorrentStream, type TorrentStreamSession, type TorrentStreamSnapshot} from '../core/stream.js';
import {buildStreamView, type StreamViewModel, type StreamViewTone} from '../core/stream-view.js';
import {resolveSystemLocale} from '../core/system-locale.js';
import {padTerminalEnd, truncateTerminal} from '../core/terminal-width.js';
import {buildEmptyResultsText, buildFooterContent, buildOpenTuiMeta, buildOpenTuiTitle, buildSearchHintContent, buildSearchInputContent} from '../core/tui-copy.js';
import {canStreamSelectedResult, createInitialTuiState, getExitIntent, reduceTuiState, type ExitIntent, type TuiState} from '../core/tui-state.js';
import type {ShellflixConfig, TorrentResult} from '../core/types.js';

const rawArgs = process.argv.slice(2);
const {pastelArgs, webtorrentOptions} = splitShellflixArgs(rawArgs);
const parsed = parseShellflixCliArgs(pastelArgs);
const config = withCliOptions(loadConfig(), parsed);
const locale = resolveSystemLocale();
const maxVisibleResultCount = 12;
const minVisibleResultCount = 4;
const colors = {
  border: '#666666',
  text: '#d7e1e8',
  muted: '#7c858d',
  secondary: '#a7b0b7',
  info: '#8bd5ff',
  error: '#ff6b6b',
  panelBg: '#071012',
  selectedBg: '#0e3a47',
  seeders: '#7bd88f',
  leechers: '#f5b85b',
  size: '#b8c7d1',
  age: '#8fa0aa'
};

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
  const renderer = await createCliRenderer({
    exitOnCtrlC: false,
    clearOnShutdown: true,
    openConsoleOnError: false,
    targetFps: 30,
    useMouse: false,
    useKittyKeyboard: {
      disambiguate: true,
      alternateKeys: true
    }
  });

  let didQuit = false;
  let activeConfig = input.config;
  let selectedOutputIndex = Math.max(0, getOutputChoices(activeConfig).indexOf(activeConfig.outputs.favorites[0] ?? 'VLC'));
  let state = {
    ...createInitialTuiState({
      query: input.query,
      provider: activeConfig.torrents.providers.active,
      mode: input.query ? 'idle' : 'search',
      status: input.query ? 'Ready to search' : 'Type a legal torrent query, then press Enter.',
      subtitleEnabled: input.subtitles,
      output: activeConfig.outputs.favorites[0],
      terminalWidth: renderer.width
    }),
    layout: getOpenTuiLayout(renderer.width)
  };
  let searchValue = state.query;
  let streamSession: TorrentStreamSession | undefined;
  let streamSnapshot: TorrentStreamSnapshot | undefined;
  let streamPending = false;
  let lastStreamRequest: {torrent: string; title: string; output: string} | undefined;

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
    borderColor: colors.border,
    paddingX: 1,
    flexDirection: 'column'
  });
  const title = new TextRenderable(renderer, {id: 'shellflix-title', content: '', fg: colors.text, width: '100%', height: 1});
  const meta = new TextRenderable(renderer, {id: 'shellflix-meta', content: '', fg: colors.secondary, width: '100%', height: 1});
  const status = new TextRenderable(renderer, {id: 'shellflix-status', content: '', fg: colors.info, width: '100%', height: 1});
  header.add(title);
  header.add(meta);
  header.add(status);

  const searchPanel = new BoxRenderable(renderer, {
    id: 'shellflix-search-panel',
    width: '100%',
    borderStyle: 'single',
    borderColor: colors.info,
    paddingX: 1,
    flexDirection: 'column'
  });
  const searchLabel = new TextRenderable(renderer, {
    id: 'shellflix-search-label',
    content: 'Search query',
    fg: colors.muted,
    width: '100%',
    height: 1
  });
  const searchInput = new TextRenderable(renderer, {
    id: 'shellflix-search-input',
    width: '100%',
    height: 1,
    content: '',
    fg: colors.text,
    bg: colors.panelBg
  });
  const searchHint = new TextRenderable(renderer, {
    id: 'shellflix-search-hint',
    width: '100%',
    height: 1,
    content: buildSearchHintContent(),
    fg: colors.muted
  });
  searchPanel.add(searchLabel);
  searchPanel.add(searchInput);
  searchPanel.add(searchHint);

  const resultsPanel = new BoxRenderable(renderer, {
    id: 'shellflix-results-panel',
    width: '100%',
    flexGrow: 1,
    minHeight: 8,
    borderStyle: 'single',
    borderColor: colors.border,
    paddingX: 1,
    flexDirection: 'column'
  });
  const resultsTitle = new TextRenderable(renderer, {id: 'shellflix-results-title', content: 'Results', fg: colors.text, width: '100%', height: 1});
  const resultsLegend = new TextRenderable(renderer, {
    id: 'shellflix-results-legend',
    content: buildResultsLegend(state.layout),
    fg: colors.muted,
    width: '100%',
    height: 1
  });
  const emptyResults = new TextRenderable(renderer, {
    id: 'shellflix-empty-results',
    content: 'No results yet. Try Sintel, public-domain torrents, or your own magnet link.',
    fg: colors.muted,
    width: '100%',
    height: 2,
    wrapMode: 'word'
  });
  const resultRows = Array.from({length: maxVisibleResultCount}, (_, index) => ({
    line: new TextRenderable(renderer, {
      id: `shellflix-result-line-${index}`,
      content: '',
      fg: colors.text,
      bg: colors.panelBg,
      width: '100%',
      height: 1,
      truncate: true
    })
  }));
  const resultRowsPanel = new BoxRenderable(renderer, {
    id: 'shellflix-results',
    width: '100%',
    height: minVisibleResultCount,
    flexDirection: 'column'
  });
  resultsPanel.add(resultsTitle);
  resultsPanel.add(resultsLegend);
  resultsPanel.add(emptyResults);
  resultsPanel.add(resultRowsPanel);

  for (const row of resultRows) {
    resultRowsPanel.add(row.line);
  }

  const details = new BoxRenderable(renderer, {
    id: 'shellflix-details',
    width: '100%',
    height: 5,
    borderStyle: 'single',
    borderColor: colors.border,
    paddingX: 1,
    flexDirection: 'column'
  });
  const detailsTitle = new TextRenderable(renderer, {id: 'shellflix-details-title', content: 'Details', fg: colors.text, width: '100%', height: 1});
  const detailsBody = new TextRenderable(renderer, {id: 'shellflix-details-body', content: '', fg: colors.secondary, width: '100%', height: 2, wrapMode: 'word'});
  details.add(detailsTitle);
  details.add(detailsBody);

  const outputPanel = new BoxRenderable(renderer, {
    id: 'shellflix-output-panel',
    width: '100%',
    height: 8,
    borderStyle: 'single',
    borderColor: colors.border,
    paddingX: 1,
    flexDirection: 'column'
  });
  const outputTitle = new TextRenderable(renderer, {id: 'shellflix-output-title', content: 'Output', fg: colors.text, width: '100%', height: 1});
  const outputHint = new TextRenderable(renderer, {
    id: 'shellflix-output-hint',
    content: '↑/↓ choose · Enter save · Esc quit',
    fg: colors.muted,
    width: '100%',
    height: 1
  });
  const outputRows = Array.from({length: 5}, (_, index) => new TextRenderable(renderer, {
    id: `shellflix-output-row-${index}`,
    content: '',
    fg: colors.text,
    width: '100%',
    height: 1
  }));
  outputPanel.add(outputTitle);
  outputPanel.add(outputHint);

  for (const row of outputRows) {
    outputPanel.add(row);
  }

  const streamPanel = new BoxRenderable(renderer, {
    id: 'shellflix-stream-panel',
    width: '100%',
    height: 6,
    borderStyle: 'single',
    borderColor: colors.info,
    paddingX: 1,
    flexDirection: 'column'
  });
  const streamTitle = new TextRenderable(renderer, {
    id: 'shellflix-stream-title',
    content: '',
    fg: colors.text,
    width: '100%',
    height: 1
  });
  const streamBody = new TextRenderable(renderer, {
    id: 'shellflix-stream-body',
    content: '',
    fg: colors.secondary,
    width: '100%',
    height: 1,
    truncate: true
  });
  const streamControls = new TextRenderable(renderer, {
    id: 'shellflix-stream-controls',
    content: 'x stop · r restart · / search · Enter start selected',
    fg: colors.muted,
    width: '100%',
    height: 1,
    truncate: true
  });
  const streamLog = new TextRenderable(renderer, {
    id: 'shellflix-stream-log',
    content: '',
    fg: colors.muted,
    width: '100%',
    height: 1,
    truncate: true
  });
  streamPanel.add(streamTitle);
  streamPanel.add(streamBody);
  streamPanel.add(streamControls);
  streamPanel.add(streamLog);

  const footer = new TextRenderable(renderer, {
    id: 'shellflix-footer',
    content: '',
    fg: colors.muted,
    width: '100%',
    height: 2
  });

  app.add(header);
  app.add(searchPanel);
  app.add(resultsPanel);
  app.add(details);
  app.add(outputPanel);
  app.add(streamPanel);
  app.add(footer);
  renderer.root.add(app);

  function finishWithCode(code: number): void {
    if (didQuit) {
      return;
    }

    didQuit = true;
    streamSession?.stop();
    cleanupProcessListeners();
    process.exitCode = code;
    renderer.destroy();
  }

  function quit(code = 130): void {
    finishWithCode(code);
  }

  function setState(next: TuiState): void {
    state = next;
    renderState();
  }

  function handleExitIntent(_intent: ExitIntent): void {
    quit();
  }

  function renderOutputMenu(): void {
    const outputs = getOutputChoices(activeConfig);
    const start = getOutputVisibleStart(selectedOutputIndex, outputs.length, outputRows.length);

    outputPanel.visible = state.mode === 'output';
    selectedOutputIndex = Math.min(Math.max(0, selectedOutputIndex), Math.max(0, outputs.length - 1));

    for (let index = 0; index < outputRows.length; index += 1) {
      const outputIndex = start + index;
      const output = outputs[outputIndex];
      const row = outputRows[index];
      const selected = outputIndex === selectedOutputIndex;
      const current = output === state.output;

      row.visible = Boolean(output);
      row.bg = selected ? colors.selectedBg : colors.panelBg;

      if (!output) {
        row.content = '';
        continue;
      }

      row.content = new StyledText([
        resultChunk(selected ? '> ' : '  ', selected ? '#ffffff' : colors.muted, selected),
        resultChunk(padTerminalEnd(output, 14), selected ? '#ffffff' : colors.text, selected),
        resultChunk(current ? ' current' : '', colors.info, selected)
      ]);
    }
  }

  function renderState(): void {
    const selected = state.results[state.selectedIndex];

    const streamActive = streamPending || Boolean(streamSession?.isActive());
    const streamView = streamSnapshot ? buildStreamView(streamSnapshot, lastStreamRequest, state.output, Math.max(24, renderer.width - 6)) : undefined;

    title.content = buildHeaderTitle(state.mode, streamView);
    meta.content = buildOpenTuiMeta(state);
    status.content = state.status;
    status.fg = streamView
      ? getStreamToneColor(streamView.tone)
      : state.mode === 'error'
      ? colors.error
      : colors.info;

    emptyResults.visible = state.results.length === 0;
    emptyResults.content = buildEmptyResultsText(state.mode, state.status);
    resultsLegend.visible = state.results.length > 0;
    resultsLegend.content = buildResultsLegend(state.layout);
    resultRowsPanel.visible = state.results.length > 0;
    renderOutputMenu();

    const visibleResultCount = getVisibleResultCount(renderer.height, state, Boolean(streamSnapshot));
    resultRowsPanel.height = visibleResultCount;

    const visibleStart = getVisibleResultStart(state.selectedIndex, state.results.length, visibleResultCount);
    resultsTitle.content = state.results.length > 0
      ? `Results ${visibleStart + 1}-${Math.min(visibleStart + visibleResultCount, state.results.length)} / ${state.results.length}`
      : 'Results';

    for (let index = 0; index < resultRows.length; index += 1) {
      const resultIndex = visibleStart + index;
      const result = state.results[resultIndex];
      const row = resultRows[index];
      const selectedRow = resultIndex === state.selectedIndex;

      row.line.visible = index < visibleResultCount && Boolean(result);

      if (index >= visibleResultCount || !result) {
        row.line.content = '';
        continue;
      }

      const rowBg = selectedRow ? colors.selectedBg : colors.panelBg;
      row.line.bg = rowBg;
      row.line.content = buildResultRow(result, selectedRow, state.layout, locale);
    }

    details.visible = state.layout === 'full' && Boolean(selected) && !streamSnapshot;
    detailsBody.content = selected
      ? `${selected.title}\nProvider ${selected.provider ?? 'unknown'} · Output ${state.output} · Subtitles ${state.subtitleEnabled ? 'on' : 'off'}`
      : '';

    searchPanel.visible = state.mode === 'search';
    searchInput.content = buildSearchInputContent(searchValue);
    searchHint.visible = searchValue.trim().length === 0;
    streamPanel.visible = Boolean(streamSnapshot);
    streamPanel.borderColor = streamView ? getStreamToneColor(streamView.tone) : colors.info;
    streamTitle.content = streamView ? buildStreamTitle(streamView) : '';
    streamTitle.fg = streamView ? getStreamToneColor(streamView.tone) : colors.text;
    streamBody.content = streamView?.body ?? '';
    streamControls.content = state.mode === 'search' && streamActive
      ? 'Ctrl+X stop · Enter search · Esc quit'
      : streamView?.controls ?? '';
    streamLog.content = streamView?.activity ?? '';
    footer.content = buildFooterContent(state.mode, state.layout, streamActive);

    renderer.root.requestRender();
  }

  async function runSearch(queryValue: string): Promise<void> {
    setState({...state, query: queryValue, mode: 'idle', status: `Searching ${state.provider}...`, results: [], selectedIndex: 0});

    const result = await searchProviders({
      query: queryValue,
      providers: activeConfig.torrents.providers.available,
      activeProvider: state.provider,
      limit: activeConfig.torrents.limit,
      timeoutMs: activeConfig.torrents.timeout,
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

    startStreamSession({
      torrent: magnet,
      title: torrent.title,
      output: state.output
    });
  }

  function startDirectStream(torrent: string): void {
    startStreamSession({
      torrent,
      title: 'Direct torrent',
      output: state.output
    });
  }

  function startStreamSession(request: {torrent: string; title: string; output: string}): void {
    streamSession?.stop();
    lastStreamRequest = request;
    streamSnapshot = undefined;
    streamPending = true;
    setState({
      ...state,
      mode: 'streaming',
      status: `Opening ${truncateTerminal(request.title, 42)} in ${request.output}...`
    });
    streamSession = startTorrentStream({
      torrent: request.torrent,
      webtorrentOptions: input.webtorrentOptions,
      config: activeConfig,
      output: request.output
    }, {
      maxLogLines: 5,
      onUpdate: snapshot => {
        streamSnapshot = snapshot;
        streamPending = snapshot.status === 'starting' || snapshot.status === 'running';

        if (didQuit) {
          return;
        }

        state = {
          ...state,
          mode: snapshot.status === 'failed' ? 'error' : 'streaming',
          status: buildStreamView(snapshot, lastStreamRequest, state.output, Math.max(24, renderer.width - 6)).status
        };
        renderState();
      }
    });
  }

  function stopStream(): void {
    if (!streamSession?.isActive()) {
      setState({...state, status: 'No active stream to stop.'});
      return;
    }

    streamSession.stop();
    setState({...state, mode: 'streaming', status: 'Stopping stream...'});
  }

  function restartStream(): void {
    if (!lastStreamRequest) {
      setState({...state, status: 'No previous stream to restart.'});
      return;
    }

    startStreamSession(lastStreamRequest);
  }

  function moveOutputSelection(direction: 1 | -1): void {
    const outputs = getOutputChoices(activeConfig);
    selectedOutputIndex = Math.min(Math.max(0, selectedOutputIndex + direction), Math.max(0, outputs.length - 1));
    renderState();
  }

  function openOutputMenu(): void {
    const outputs = getOutputChoices(activeConfig);
    selectedOutputIndex = Math.max(0, outputs.indexOf(state.output));
    setState({...state, mode: 'output', status: 'Choose output app. Enter saves to ~/.shellflix.json.'});
  }

  function saveSelectedOutput(): void {
    const output = getOutputChoices(activeConfig)[selectedOutputIndex];

    if (!output) {
      setState({...state, mode: 'idle', status: 'No output app selected.'});
      return;
    }

    activeConfig = applyPreferredOutput(activeConfig, output);

    try {
      saveOutputFavorite(output, {localConfigPath: activeConfig.localConfigPath});
      setState(reduceTuiState(state, {type: 'setOutput', output}));
    } catch (error) {
      setState({
        ...state,
        output,
        mode: 'idle',
        status: `Output set to ${output}, but config could not be saved: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }

  function handleSearchKey(key: {name?: string; sequence?: string; ctrl?: boolean; meta?: boolean}): void {
    if (key.name === 'return') {
      const nextQuery = searchValue.trim();

      if (nextQuery) {
        void runSearch(nextQuery);
      }

      return;
    }

    if (key.name === 'backspace' || key.name === 'delete') {
      searchValue = searchValue.slice(0, -1);
      searchInput.content = buildSearchInputContent(searchValue);
      renderer.root.requestRender();
      return;
    }

    if (!key.ctrl && !key.meta && key.sequence && key.sequence.length === 1 && key.sequence >= ' ') {
      searchValue += key.sequence;
      searchInput.content = buildSearchInputContent(searchValue);
      renderer.root.requestRender();
    }
  }

  renderer.keyInput.on('keypress', key => {
    const exitIntent = getExitIntent(key.sequence ?? '', {escape: key.name === 'escape', ctrl: key.ctrl});

    if (exitIntent) {
      handleExitIntent(exitIntent);
      return;
    }

    if (streamSession?.isActive() && (key.sequence === '\u0018' || (key.ctrl && key.name === 'x'))) {
      stopStream();
      return;
    }

    if (state.mode === 'search') {
      handleSearchKey(key);
      return;
    }

    if (state.mode === 'output') {
      if (key.name === 'up') {
        moveOutputSelection(-1);
        return;
      }

      if (key.name === 'down') {
        moveOutputSelection(1);
        return;
      }

      if (key.name === 'return') {
        saveSelectedOutput();
      }

      return;
    }

    if (key.sequence === 'x') {
      stopStream();
      return;
    }

    if (key.sequence === 'r') {
      restartStream();
      return;
    }

    if (key.sequence === 'q') {
      quit(0);
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
      searchValue = '';
      setState(reduceTuiState(state, {type: 'keyboard', key: '/'}));
      return;
    }

    if (key.sequence === 'p') {
      setState(cycleProvider(state, activeConfig));
      return;
    }

    if (key.sequence === 's') {
      setState(reduceTuiState(state, {type: 'keyboard', key: 's'}));
      return;
    }

    if (key.sequence === 'o') {
      openOutputMenu();
    }
  });

  renderer.on(CliRenderEvents.RESIZE, () => {
    setState({
      ...state,
      layout: getOpenTuiLayout(renderer.width)
    });
  });

  function handleRawInput(data: Buffer): void {
    const inputValue = data.toString('utf8');

    if (inputValue === '\u001B\u001B') {
      handleExitIntent('escape');
      return;
    }

    if (inputValue === '\u0003\u0003') {
      handleExitIntent('ctrl+c');
      return;
    }

    if (inputValue === '\u001B') {
      handleExitIntent('escape');
      return;
    }

    if (inputValue === '\u0003') {
      handleExitIntent('ctrl+c');
    }
  }

  function handleSigint(): void {
    handleExitIntent('ctrl+c');
  }

  function handleSigterm(): void {
    quit(143);
  }

  function cleanupProcessListeners(): void {
    process.stdin.off('data', handleRawInput);
    process.off('SIGINT', handleSigint);
    process.off('SIGTERM', handleSigterm);
  }

  process.stdin.on('data', handleRawInput);
  process.on('SIGINT', handleSigint);
  process.once('SIGTERM', handleSigterm);

  renderState();

  if (input.query && isTorrentIdentifier(input.query)) {
    startDirectStream(input.query);
  } else if (input.query) {
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

function buildResultsLegend(layout: TuiState['layout']): StyledText {
  return new StyledText([
    fg(colors.muted)('Source  '),
    fg(colors.seeders)('S seeders'),
    fg(colors.muted)('  '),
    fg(colors.leechers)('L leechers'),
    fg(colors.muted)(layout === 'compact' ? '  Size' : '  Size  Age')
  ]);
}

function buildHeaderTitle(mode: TuiState['mode'], streamView: StreamViewModel | undefined): StyledText {
  const label = mode === 'search'
    ? 'SEARCH'
    : mode === 'output'
      ? 'OUTPUT'
      : streamView
        ? 'STREAM'
        : mode === 'error'
          ? 'ATTENTION'
          : 'RESULTS';
  const labelColor = streamView && mode !== 'search' && mode !== 'output'
    ? getStreamToneColor(streamView.tone)
    : mode === 'error'
      ? colors.error
      : colors.info;

  return new StyledText([
    fg(colors.text)(buildOpenTuiTitle()),
    fg(colors.muted)('  '),
    fg(labelColor)(label)
  ]);
}

function buildStreamTitle(view: StreamViewModel): StyledText {
  return new StyledText([
    fg(colors.text)('Stream  '),
    fg(getStreamToneColor(view.tone))(view.label)
  ]);
}

function getStreamToneColor(tone: StreamViewTone): string {
  if (tone === 'failed') {
    return colors.error;
  }

  if (tone === 'running') {
    return colors.seeders;
  }

  if (tone === 'stopped') {
    return colors.muted;
  }

  return colors.info;
}

function buildResultRow(result: TorrentResult, selected: boolean, layout: TuiState['layout'], locale: string): StyledText {
  const columns = formatResultMetaColumns(result, {locale});
  const titleWidth = layout === 'compact' ? 30 : 50;
  const providerWidth = layout === 'compact' ? 10 : 14;
  const age = layout === 'compact' ? '' : `  ${truncateTerminal(columns.age, 28)}`;

  return new StyledText([
    resultChunk(selected ? '> ' : '  ', selected ? '#ffffff' : colors.muted, selected),
    resultChunk(padTerminalEnd(truncateTerminal(result.title, titleWidth), titleWidth), selected ? '#ffffff' : colors.text, selected),
    resultChunk('  ', colors.muted, selected),
    resultChunk(padTerminalEnd(truncateTerminal(columns.provider, providerWidth), providerWidth), colors.muted, selected),
    resultChunk('  ', colors.muted, selected),
    resultChunk('S ', colors.seeders, selected),
    resultChunk(padTerminalEnd(columns.seeders, 4), colors.seeders, selected),
    resultChunk('  ', colors.muted, selected),
    resultChunk('L ', colors.leechers, selected),
    resultChunk(padTerminalEnd(columns.leechers, 4), colors.leechers, selected),
    resultChunk('  ', colors.muted, selected),
    resultChunk(padTerminalEnd(columns.size, 9), colors.size, selected),
    resultChunk(age, colors.age, selected)
  ]);
}

function resultChunk(text: string, color: string, selected: boolean): TextChunk {
  const chunk = fg(color)(text);
  return selected ? bg(colors.selectedBg)(chunk) : chunk;
}

function getVisibleResultStart(selectedIndex: number, resultCount: number, visibleCount: number): number {
  return getVisibleStart(selectedIndex, resultCount, visibleCount);
}

function getVisibleStart(selectedIndex: number, itemCount: number, visibleCount: number): number {
  if (itemCount <= visibleCount) {
    return 0;
  }

  return Math.min(Math.max(0, selectedIndex - visibleCount + 1), itemCount - visibleCount);
}

function getOutputVisibleStart(selectedIndex: number, itemCount: number, visibleCount: number): number {
  if (itemCount <= visibleCount) {
    return 0;
  }

  return Math.min(Math.max(0, selectedIndex - 1), itemCount - visibleCount);
}

function getOpenTuiLayout(width: number): TuiState['layout'] {
  return width < 110 ? 'compact' : 'full';
}

function getVisibleResultCount(terminalHeight: number, state: Pick<TuiState, 'layout' | 'mode' | 'results' | 'selectedIndex'>, hasStreamPanel = false): number {
  const hasSelection = Boolean(state.results[state.selectedIndex]);
  const reservedRows =
    5 +
    2 +
    (state.mode === 'search' ? 4 : 0) +
    (state.mode === 'output' ? 8 : 0) +
    (hasStreamPanel ? 7 : 0) +
    (state.layout === 'full' && hasSelection ? 5 : 0);
  const visibleSectionGaps =
    2 +
    (state.mode === 'search' ? 1 : 0) +
    (state.mode === 'output' ? 1 : 0) +
    (hasStreamPanel ? 1 : 0) +
    (state.layout === 'full' && hasSelection ? 1 : 0);
  const resultPanelChrome = 4;
  const availableRows = terminalHeight - reservedRows - visibleSectionGaps - resultPanelChrome;

  return Math.max(minVisibleResultCount, Math.min(maxVisibleResultCount, availableRows));
}


function isTorrentIdentifier(value: string): boolean {
  return value.startsWith('magnet:') || value.startsWith('http://') || value.startsWith('https://') || value.endsWith('.torrent');
}
