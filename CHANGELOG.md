# Changelog

## 2.0.0-next.0

- Rebuilt the CLI around Pastel, Ink, React, and Zod.
- Added a keyboard-first terminal UI with search status, provider state, result table, and detail pane.
- Added Clack fallback prompts for non-interactive terminals.
- Split config, search, subtitle, WebTorrent, argument parsing, and TUI state into testable modules.
- Added Vitest coverage for v1 regression fixes and v2 TUI state/rendering.
- Kept WebTorrent execution on the bundled helper without runtime `npx`.

## 1.11.6

- Restored npm README metadata.

## 1.11.5

- Fixed upstream CLIFlix issues around Linux shebang, path expansion, subtitle writes, URL encoding, search timeouts, and search recovery.

## 1.11.4

- Published the installable `shellflix` fork with a patched WebTorrent helper.
