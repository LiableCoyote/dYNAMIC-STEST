# Social Democracy: The Spanish Republic

A **total conversion** of [*Social Democracy: An Alternate History*](https://github.com/originn0/dynamic_social_democracy) by Autumn Chen (and the *Dynamic Social Democracy* contributors), re-setting the game in the **Second Spanish Republic (1931–1936)**, on the eve of the Spanish Civil War. This is a standalone build, not a mod of the base game.

> **Status: work in progress.** The engine and build are set up; historical content is being converted. See the roadmap in [`docs/spanish_republic_conversion_design.md`](docs/spanish_republic_conversion_design.md) and per-area plans under [`docs/planning/`](docs/planning/).

## Building the game

Requires Node.js (built and tested on Node 20+).

```bash
npm install        # installs dendrynexus (from GitHub) + parliament-svg
npm run build      # compiles source/ -> out/game.json + out/html/core.js, and mirrors game.json into out/html/
npm run smoke      # build sanity + rename regression checks
npm run serve      # serves out/html at http://localhost:8080
```

`npm run build` is equivalent to `dendrynexus make-html --pretty` followed by copying `out/game.json` into `out/html/`. Generated files (`out/game.json`, `out/html/core.js`, `out/html/jquery-1.11.1.min.js`) are gitignored; the static shell (`out/html/index.html`, `game.js`, `game.css`, d3 libraries, `favicon.ico`) and assets (`out/html/img`, `out/html/music`) are committed.

## Included libraries

- [jquery v1.11.1](https://releases.jquery.com/)
- [d3.js v7](https://d3js.org)
- [d3-parliament](https://github.com/geoffreybr/d3-parliament)

## Credits & license

MIT-licensed. This conversion is a derivative work; original authorship and asset/music attributions are preserved in [`LICENSE`](LICENSE), [`credits_images.txt`](credits_images.txt), and [`credits_music.txt`](credits_music.txt).
