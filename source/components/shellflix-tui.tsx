import React from 'react';
import {Box, Text} from 'ink';
import {Badge, StatusMessage} from '@inkjs/ui';
import type {TuiState} from '../core/tui-state.js';
import type {TorrentResult} from '../core/types.js';

type Props = {
  state: TuiState;
};

export function ShellflixTui({state}: Props) {
  const selected = state.results[state.selectedIndex];

  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
        <Box justifyContent="space-between">
          <Box gap={1}>
            <Text bold>Shellflix</Text>
            <Badge color={state.mode === 'streaming' ? 'green' : 'cyan'}>{state.mode}</Badge>
          </Box>
          <Text color="gray">{state.provider} · {state.layout}</Text>
        </Box>

        <Box>
          <Text color="gray">Search: </Text>
          <Text>{state.query || 'press / to search legal torrents'}</Text>
        </Box>

        <StatusMessage variant={state.mode === 'error' ? 'error' : 'info'}>{state.status}</StatusMessage>
      </Box>

      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
        <Text bold>Results</Text>
        {state.results.length === 0 ? (
          <Text color="gray">No results yet. Try Sintel, public-domain torrents, or your own magnet link.</Text>
        ) : (
          state.results.slice(0, 10).map((result, index) => (
            <ResultRow key={`${result.provider ?? 'provider'}-${result.title}-${index}`} result={result} selected={index === state.selectedIndex} compact={state.layout === 'compact'} />
          ))
        )}
      </Box>

      {selected && state.layout === 'full' ? (
        <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
          <Text bold>Details</Text>
          <Text>{selected.title}</Text>
          <Text color="gray">Provider {selected.provider ?? 'unknown'} · Output {state.output} · Subtitles {state.subtitleEnabled ? 'on' : 'off'}</Text>
        </Box>
      ) : null}

      <Text color="gray">Enter stream · / search · p provider · s subtitles · o output · Esc quit</Text>
    </Box>
  );
}

function ResultRow({result, selected, compact}: {result: TorrentResult; selected: boolean; compact: boolean}) {
  const cursor = selected ? '›' : ' ';
  const meta = compact
    ? result.provider ?? ''
    : [result.provider, formatNumber(result.seeds), formatNumber(result.peers), result.size, result.time].filter(Boolean).join('  ');

  return (
    <Box>
      <Text color={selected ? 'cyan' : undefined}>{cursor} {truncate(result.title, compact ? 44 : 58)}</Text>
      <Box flexGrow={1} />
      <Text color="gray">{meta}</Text>
    </Box>
  );
}

function truncate(value: string, length: number): string {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length - 1)}…`;
}

function formatNumber(value: unknown): string {
  return typeof value === 'number' ? String(value) : '';
}
