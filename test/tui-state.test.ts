import {describe, expect, it} from 'vitest';
import {canStreamSelectedResult, createInitialTuiState, reduceTuiState, shouldQuitFromInput} from '../source/core/tui-state.js';

describe('tui state', () => {
  it('moves selection and enters search mode with keyboard actions', () => {
    const state = createInitialTuiState({
      query: 'Sintel',
      results: [
        {title: 'One', provider: '1337x'},
        {title: 'Two', provider: '1337x'}
      ]
    });

    const moved = reduceTuiState(state, {type: 'moveSelection', direction: 1});
    expect(moved.selectedIndex).toBe(1);

    const searching = reduceTuiState(moved, {type: 'keyboard', key: '/'});
    expect(searching.mode).toBe('search');
  });

  it('uses compact layout below the width threshold', () => {
    const state = createInitialTuiState({query: '', terminalWidth: 72});

    expect(state.layout).toBe('compact');
  });

  it('handles primary keyboard modes and clamps selection', () => {
    const state = createInitialTuiState({
      results: [
        {title: 'One'},
        {title: 'Two'}
      ]
    });

    expect(reduceTuiState(state, {type: 'moveSelection', direction: -1}).selectedIndex).toBe(0);
    expect(reduceTuiState({...state, selectedIndex: 1}, {type: 'moveSelection', direction: 1}).selectedIndex).toBe(1);
    expect(reduceTuiState(state, {type: 'keyboard', key: 'p'}).mode).toBe('provider');
    expect(reduceTuiState(state, {type: 'keyboard', key: 's'}).subtitleEnabled).toBe(true);
    expect(reduceTuiState({...state, subtitleEnabled: true}, {type: 'keyboard', key: 's'}).subtitleEnabled).toBe(false);
    expect(reduceTuiState(state, {type: 'keyboard', key: 'o'}).mode).toBe('output');
    expect(reduceTuiState(state, {type: 'keyboard', key: 'return'}).mode).toBe('streaming');
    expect(reduceTuiState(state, {type: 'keyboard', key: 'escape'}).status).toBe('Cancelled');
    expect(reduceTuiState(state, {type: 'keyboard', key: 'x'})).toBe(state);
  });

  it('updates results and status through reducer actions', () => {
    const state = createInitialTuiState({selectedIndex: 3});
    const withResults = reduceTuiState(state, {type: 'setResults', results: [{title: 'Only'}]});

    expect(withResults.selectedIndex).toBe(0);
    expect(withResults.results).toHaveLength(1);
    expect(reduceTuiState(withResults, {type: 'setStatus', status: 'Done'}).status).toBe('Done');
  });

  it('only allows streaming when the selected result is searchable', () => {
    expect(canStreamSelectedResult(createInitialTuiState({results: []}))).toBe(false);
    expect(canStreamSelectedResult(createInitialTuiState({results: [{title: 'No results returned'}]}))).toBe(false);
    expect(canStreamSelectedResult(createInitialTuiState({results: [{title: 'Sintel 1080p'}]}))).toBe(true);
  });

  it('recognizes escape and ctrl+c as quit input', () => {
    expect(shouldQuitFromInput('', {escape: true})).toBe(true);
    expect(shouldQuitFromInput('c', {ctrl: true})).toBe(true);
    expect(shouldQuitFromInput('\u0003', {})).toBe(true);
    expect(shouldQuitFromInput('c', {})).toBe(false);
  });
});
