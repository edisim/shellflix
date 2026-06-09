import type {TorrentResult} from './types.js';
import {isSearchableTorrentResult} from './search.js';

export type TuiMode = 'idle' | 'search' | 'provider' | 'subtitles' | 'output' | 'streaming' | 'error';
export type TuiLayout = 'full' | 'compact';
export type ExitIntent = 'escape' | 'ctrl+c';

export type TuiState = {
  query: string;
  provider: string;
  status: string;
  mode: TuiMode;
  layout: TuiLayout;
  selectedIndex: number;
  results: TorrentResult[];
  subtitleEnabled: boolean;
  output: string;
};

export type TuiAction =
  | {type: 'moveSelection'; direction: 1 | -1}
  | {type: 'setOutput'; output: string}
  | {type: 'keyboard'; key: string}
  | {type: 'setResults'; results: TorrentResult[]}
  | {type: 'setStatus'; status: string};

type KeyboardInput = {
  ctrl?: boolean;
  escape?: boolean;
};

type InitialStateInput = Partial<Omit<TuiState, 'layout'>> & {
  terminalWidth?: number;
};

export function createInitialTuiState(input: InitialStateInput = {}): TuiState {
  return {
    query: input.query ?? '',
    provider: input.provider ?? '1337x',
    status: input.status ?? 'Ready',
    mode: input.mode ?? 'idle',
    layout: (input.terminalWidth ?? 100) < 80 ? 'compact' : 'full',
    selectedIndex: input.selectedIndex ?? 0,
    results: input.results ?? [],
    subtitleEnabled: input.subtitleEnabled ?? false,
    output: input.output ?? 'VLC'
  };
}

export function reduceTuiState(state: TuiState, action: TuiAction): TuiState {
  switch (action.type) {
    case 'moveSelection': {
      const maxIndex = Math.max(0, state.results.length - 1);
      const selectedIndex = Math.min(maxIndex, Math.max(0, state.selectedIndex + action.direction));
      return {...state, selectedIndex};
    }

    case 'setOutput':
      return {...state, output: action.output, mode: 'idle', status: `Output set to ${action.output}.`};

    case 'keyboard':
      return reduceKeyboard(state, action.key);

    case 'setResults':
      return {...state, results: action.results, selectedIndex: 0};

    case 'setStatus':
      return {...state, status: action.status};
  }
}

export function canStreamSelectedResult(state: TuiState): boolean {
  return isSearchableTorrentResult(state.results[state.selectedIndex]);
}

export function getExitIntent(input: string, key: KeyboardInput): ExitIntent | null {
  if (key.escape) {
    return 'escape';
  }

  if ((key.ctrl && input.toLowerCase() === 'c') || input === '\u0003') {
    return 'ctrl+c';
  }

  return null;
}

function reduceKeyboard(state: TuiState, key: string): TuiState {
  if (key === '/') {
    return {...state, mode: 'search', status: 'Enter a new search query'};
  }

  if (key === 'p') {
    return {...state, mode: 'provider', status: 'Choose a provider'};
  }

  if (key === 's') {
    return {...state, mode: 'subtitles', subtitleEnabled: !state.subtitleEnabled, status: state.subtitleEnabled ? 'Subtitles disabled' : 'Subtitles enabled'};
  }

  if (key === 'o') {
    return {...state, mode: 'output', status: 'Choose output app'};
  }

  if (key === 'escape') {
    return {...state, mode: 'search', status: 'Search mode. Press Esc again to quit.'};
  }

  if (key === 'return') {
    if (!canStreamSelectedResult(state)) {
      return {...state, mode: 'idle', status: 'No streamable result selected. Press Esc to search again.'};
    }

    return {...state, mode: 'streaming', status: 'Starting stream'};
  }

  return state;
}
