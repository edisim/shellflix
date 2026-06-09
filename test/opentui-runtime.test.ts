import {describe, expect, it} from 'vitest';
import {shouldLaunchOpenTui} from '../source/core/opentui-runtime.js';

const tty = {isTTY: true};
const pipe = {isTTY: false};

describe('OpenTUI runtime selection', () => {
  it('uses OpenTUI for interactive terminal sessions', () => {
    expect(shouldLaunchOpenTui(['Sintel'], {}, tty, tty)).toBe(true);
  });

  it('keeps help, version, non-TTY, and explicit Ink paths on the Node renderer', () => {
    expect(shouldLaunchOpenTui(['--help'], {}, tty, tty)).toBe(false);
    expect(shouldLaunchOpenTui(['Sintel'], {}, pipe, tty)).toBe(false);
    expect(shouldLaunchOpenTui(['Sintel'], {SHELLFLIX_RENDERER: 'ink'}, tty, tty)).toBe(false);
    expect(shouldLaunchOpenTui(['Sintel'], {SHELLFLIX_DISABLE_OPENTUI: '1'}, tty, tty)).toBe(false);
  });
});
