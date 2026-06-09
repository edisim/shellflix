import React from 'react';
import {Box, Text} from 'ink';
import {StatusMessage} from '@inkjs/ui';
import {formatResultMetaColumns} from '../core/result-format.js';
import {resolveSystemLocale} from '../core/system-locale.js';
import {truncateTerminal} from '../core/terminal-width.js';
import {buildEmptyResultsText, buildFooterContent, buildOpenTuiMeta, buildOpenTuiTitle, buildSearchHintContent, buildSearchInputContent} from '../core/tui-copy.js';
import type {TuiState} from '../core/tui-state.js';
import type {TorrentResult} from '../core/types.js';

type Props = {
  state: TuiState;
  locale?: string;
};

export function ShellflixTui({state, locale = resolveSystemLocale()}: Props) {
  const selected = state.results[state.selectedIndex];

  return (
    <Box flexDirection="column" gap={1}>
      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
        <Text bold>{buildOpenTuiTitle()}</Text>
        <Text color="gray">{buildOpenTuiMeta(state)}</Text>
        <StatusMessage variant={state.mode === 'error' ? 'error' : 'info'}>{state.status}</StatusMessage>
      </Box>

      {state.mode === 'search' ? (
        <Box borderStyle="single" borderColor="cyan" flexDirection="column" paddingX={1}>
          <Text color="gray">Search query</Text>
          <Text>{buildSearchInputContent(state.query)}</Text>
          {state.query.trim() ? null : <Text color="gray">{buildSearchHintContent()}</Text>}
        </Box>
      ) : null}

      <Box borderStyle="single" borderColor="gray" flexDirection="column" paddingX={1}>
        <Text bold>Results</Text>
        {state.results.length === 0 ? (
          <Text color="gray">{buildEmptyResultsText(state.mode, state.status)}</Text>
        ) : (
          state.results.slice(0, 10).map((result, index) => (
            <ResultRow key={`${result.provider ?? 'provider'}-${result.title}-${index}`} result={result} selected={index === state.selectedIndex} compact={state.layout === 'compact'} locale={locale} />
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

      <Text color="gray">{buildFooterContent(state.mode, state.layout)}</Text>
    </Box>
  );
}

function ResultRow({result, selected, compact, locale}: {result: TorrentResult; selected: boolean; compact: boolean; locale: string}) {
  const cursor = selected ? '›' : ' ';
  const columns = formatResultMetaColumns(result, {locale});
  const meta = compact
    ? columns.provider
    : [
        columns.provider,
        `S ${columns.seeders}`,
        `L ${columns.leechers}`,
        columns.size,
        columns.age
      ].filter(Boolean).join('  ');

  return (
    <Box>
      <Text color={selected ? 'cyan' : undefined}>{cursor} {truncateTerminal(result.title, compact ? 44 : 58)}</Text>
      <Box flexGrow={1} />
      <Text color="gray">{meta}</Text>
    </Box>
  );
}
