import {describe, expect, it} from 'vitest';
import {displayWidth, padTerminalEnd, truncateTerminal} from '../source/core/terminal-width.js';

describe('terminal width helpers', () => {
  it('counts emoji and wide glyphs as terminal cells instead of string length', () => {
    expect(displayWidth('YG⭐')).toBe(4);
    expect('YG⭐'.length).toBe(3);
  });

  it('truncates without exceeding the requested display width', () => {
    const value = truncateTerminal('Project.Hail.Mary.2026.2160p.WEBrip.h265.Dual.YG⭐', 30);

    expect(displayWidth(value)).toBeLessThanOrEqual(30);
    expect(value.endsWith('…')).toBe(true);
  });

  it('pads based on display width', () => {
    expect(displayWidth(padTerminalEnd('YG⭐', 6))).toBe(6);
  });
});
