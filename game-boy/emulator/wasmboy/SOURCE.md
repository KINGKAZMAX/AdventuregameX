# WasmBoy 0.7.1 — vendored emulator source notice

The in-browser Game Boy emulator used by this app is WasmBoy 0.7.1,
vendored unmodified as a prebuilt ESM bundle at `src/vendor/wasmboy/wasmboy.esm.js`.

- Upstream project: https://github.com/torch2424/wasmBoy
- Version / tag: v0.7.1
- License: GPL-3.0-or-later (full text in `LICENSE` alongside this notice)
- Upstream source archive:
  https://github.com/torch2424/wasmboy/archive/refs/tags/v0.7.1.tar.gz
  — redistributed in this directory as `wasmboy-0.7.1-source.tar.gz`
  (upstream archive with the non-source `docs/` and `demo/` folders removed
  to keep the site payload small; all sources, tests and build configuration
  are included verbatim), satisfying GPL-3.0 §6 "corresponding source"
  for the vendored bundle.

## SHA-256

| File | SHA-256 |
| ---- | ------- |
| `src/vendor/wasmboy/wasmboy.esm.js` (vendored bundle) | `3052a7864e47384639c19ce073a194595726ebde5fe677a949e99092ab9851d9` |
| `wasmboy-0.7.1-source.tar.gz` (corresponding source) | `a1e803dcb43a6891bac2ea634718412995b679217d9acf42b7377e3cfc689679` |

No modifications were made to the upstream bundle or its sources.
