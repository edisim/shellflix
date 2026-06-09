import React from 'react';
import {describe, expect, it} from 'vitest';
import {render} from 'ink-testing-library';
import {ShellflixTui} from '../source/components/shellflix-tui.js';
import {createInitialTuiState} from '../source/core/tui-state.js';

describe('ShellflixTui', () => {
  it('renders a nonblank industrial search surface', () => {
    const state = createInitialTuiState({
      query: 'Sintel',
      status: 'Searching 1337x...',
      mode: 'idle',
      results: [{title: 'Sintel 1080p', provider: '1337x', seeds: 120, peers: 4, size: '1.2 GB'}]
    });

    const {lastFrame} = render(<ShellflixTui state={state} />);

    expect(lastFrame()).toContain('Shellflix');
    expect(lastFrame()).toContain('Sintel');
    expect(lastFrame()).toContain('1337x');
    expect(lastFrame()).toContain('Enter stream');
  });

  it('renders compact empty state without a details pane', () => {
    const state = createInitialTuiState({
      query: '',
      mode: 'search',
      terminalWidth: 60,
      results: []
    });

    const {lastFrame} = render(<ShellflixTui state={state} />);

    expect(lastFrame()).toContain('Search query');
    expect(lastFrame()).toContain('Type a query above');
    expect(lastFrame()).toContain('Enter search');
    expect(lastFrame()).not.toContain('provider');
    expect(lastFrame()).not.toContain('Details');
  });
});
