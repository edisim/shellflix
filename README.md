# Shellflix

Shellflix is a maintained CLIFlix fork with a modern terminal UI for finding and streaming legal torrents.

[npm package](https://www.npmjs.com/package/shellflix) | [GitHub fork](https://github.com/edisim/shellflix)

> **Legal use only.** Shellflix is a torrent client wrapper. Use it only with torrents you are allowed to access, such as your own torrents, public-domain material, or Creative Commons releases like Sintel.

## Status

- `master` tracks the stable `1.11.x` compatibility line.
- `next` contains the v2 rewrite. It is now OpenTUI-first for interactive terminals, with the Node/Pastel/Ink path kept as fallback while OpenTUI's Node renderer support matures.
- v2 is published only as `shellflix@next` until package install, streaming, and TUI smoke checks are complete.

## Install

Stable:

```shell
npm install -g shellflix
```

Next preview:

```shell
npm install -g shellflix@next
```

## Usage

Open the interactive TUI:

```shell
shellflix
```

Search and stream the first useful result:

```shell
shellflix Sintel
```

Stream a legal magnet URI or torrent URL directly:

```shell
shellflix "magnet:?xt=urn:btih:..."
```

Forward options to the bundled WebTorrent CLI after `--`:

```shell
shellflix Sintel -- --vlc --port 1234
shellflix -- --iina --pip
```

## TUI Controls

- `/` search again
- `p` cycle provider
- `s` toggle subtitles
- `o` choose output mode
- `Enter` stream selected result
- `Esc` or `Ctrl+C` quit immediately

The interface is keyboard-first, keeps stable columns for scanning, and shows provider/timeout state instead of silently hanging.

## OpenTUI Runtime

Shellflix v2 prefers OpenTUI when you run it in an interactive terminal and `bun` is available on `PATH`.

OpenTUI currently renders through its native Zig core. In Shellflix, the npm-installed `shellflix` binary remains a Node entrypoint and trampolines into the Bun/OpenTUI renderer only when that is safe. If Bun is not available, or if you pass `--help`/`--version`, Shellflix keeps using the Node-compatible fallback path.

Force the fallback renderer:

```shell
SHELLFLIX_RENDERER=ink shellflix
```

## What v2 Fixes

The v2 rewrite keeps the v1 repair work as requirements:

- fixed global npm install path
- Linux-compatible shebang
- `~` and `$HOME` expansion in `~/.shellflix.json`
- subtitle URL encoding
- subtitle filename sanitizing
- subtitle directory creation before write
- provider timeout and fallback
- `Search again` recovery path
- no runtime `npx`

## Configuration

Shellflix reads `~/.shellflix.json`.

```json5
{
  downloads: {
    path: "~/Downloads",
    save: true
  },
  outputs: {
    available: ["VLC", "IINA", "mpv"],
    favorites: ["VLC"]
  },
  torrents: {
    limit: 30,
    timeout: 30000,
    providers: {
      active: "1337x"
    }
  },
  webtorrent: {
    options: ["--keep-seeding"]
  }
}
```

## Development

```shell
npm install --min-release-age=0
npm test
npm run build
npm run smoke
npm pack --dry-run
```

## Known v2 Next Work

- Replace the legacy WebTorrent helper dependency or harden it further.
- Expand OpenTUI tests around live keyboard flows.
- Add subtitles selection inside the OpenTUI surface.
- Track OpenTUI's native Node renderer support so the Bun trampoline can eventually disappear.
- Publish preview releases under the `next` npm tag only.

## License

MIT © Fabio Spampinato and Shellflix contributors
