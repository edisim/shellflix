import {describe, expect, it} from 'vitest';
import {buildEmptyResultsText, buildFooterContent, buildOpenTuiMeta, buildOpenTuiTitle, buildSearchHintContent, buildSearchInputContent} from '../source/core/tui-copy.js';

describe('OpenTUI copy', () => {
  it('keeps the header focused on product and runtime context', () => {
    const meta = buildOpenTuiMeta({
      provider: '1337x',
      output: 'IINA',
      subtitleEnabled: false,
      query: ''
    });

    expect(buildOpenTuiTitle()).toBe('Shellflix');
    expect(meta).toBe('Provider 1337x · Output IINA · Subtitles off');
    expect(meta).not.toContain('OpenTUI');
    expect(meta).not.toContain('full');
    expect(meta).not.toContain('SEARCH');
  });

  it('formats the active search field as an input instead of a status line', () => {
    expect(buildSearchInputContent('')).toBe('> ');
    expect(buildSearchInputContent('Sintel')).toBe('> Sintel_');
    expect(buildSearchHintContent()).toContain('Example: Sintel');
  });

  it('only shows shortcuts that are available in the current mode', () => {
    expect(buildFooterContent('search')).toBe('Type query · Enter search · Esc quit · Ctrl+C quit');
    expect(buildFooterContent('search')).not.toContain('provider');
    expect(buildFooterContent('search')).not.toContain('output');
    expect(buildFooterContent('idle')).toContain('p provider');
    expect(buildFooterContent('idle')).toContain('o output');
    expect(buildFooterContent('idle', 'compact')).toContain('\n');
    expect(buildFooterContent('output')).toBe('↑/↓ choose · Enter save · Esc quit · Ctrl+C quit');
    expect(buildFooterContent('streaming', 'full', true)).toContain('x stop stream');
    expect(buildFooterContent('streaming', 'full', true)).not.toContain('Enter start selected');
    expect(buildFooterContent('idle', 'full', true)).not.toContain('Enter stream');
    expect(buildFooterContent('idle', 'compact', true)).not.toContain('Enter stream');
    expect(buildFooterContent('streaming', 'full', false)).not.toContain('x stop stream');
    expect(buildFooterContent('streaming', 'full', false)).toContain('r restart');
    expect(buildFooterContent('search', 'compact', true)).toContain('Ctrl+X stop stream');
  });

  it('keeps empty-state text out of the header/status role', () => {
    expect(buildEmptyResultsText('search', 'Search mode.')).toBe('Type a query above, then press Enter.');
    expect(buildEmptyResultsText('idle', 'Searching 1337x...')).toBe('Waiting for provider response...');
    expect(buildEmptyResultsText('idle', 'No torrents found.')).toBe('No matching torrents. Try another query or provider.');
  });
});
