# GameX

A single web app that hosts two interactive retro toys behind one hub:

- **Game Boy** — a tactile 3D Game Boy you can rotate and zoom, with a wreath of
  collectible cartridges and **real, playable open-source homebrew games** running
  in-browser (with save states).
- **Tamagotchi (dammagotchi)** — a living virtual pet with feeding, care, colour
  themes, a pixel UI and sound.

The hub embeds each experience in an iframe, switches between them, remembers your
language (English / 中文), and plays an original cozy chiptune with an on/off toggle.

> **Note on trademarks & artwork.** GameX is a personal, non-commercial project. The
> cartridge shells reproduce photographs of real, released Pokémon cartridges purely
> for display — *Pokémon*, *Game Boy* and *Nintendo* are trademarks of their
> respective owners and this project is not affiliated with or endorsed by them. The
> games that actually **run** are all open-licensed homebrew titles (see below).

---

## Features

### Game Boy experience
- **Interactive 3D handheld** (Three.js) — drag to rotate, scroll to zoom.
- **15 official Pokémon cartridge shells** arranged on one symmetric **horseshoe
  wreath** in chronological release order (JP Red → … → Crystal). Real per-release
  shell colours and label art, baked from high-resolution cartridge scans.
- **Long-press any cartridge** to open a bilingual info card describing the
  open-source game it runs (title, author, licence and a "view source" link) or the
  real release it represents.
- **8 real, playable homebrew games** emulated in-browser via
  [WasmBoy](https://github.com/torch2424/wasmBoy): Tobu Tobu Girl, µCity, 2048,
  GB Wordyl, Carazu, Geometrix, GB Corp. and Shock Lobster.
- **Save states & battery saves** persist across reloads.
- Two original built-in mini-games (Tetris, Space Invaders) kept in "storage".

### Tamagotchi experience
- Virtual-pet device with feeding, care, colour themes, a pixel UI and sound.

### Hub
- One-click switch between experiences; collapsible switcher that stays out of the way.
- **Bilingual** English / 中文, propagated to the child apps.
- **Original chiptune BGM** synthesized live with the Web Audio API (a warm,
  Game-Boy-style pulse-wave loop — *not* a copyrighted track) with a persistent
  on/off toggle.

---

## Getting started

```bash
# 1. install the hub's dependencies
npm install

# 2. run the dev server (auto-installs + builds the child apps, then serves the hub)
npm run dev
# → http://localhost:5180/

# 3. production build (hub + both child apps, synced into /public and /dist)
npm run build
npm run preview
```

`scripts/prepare-apps.mjs` installs and builds `apps/game-boy` and
`apps/dammagotchi`, then copies their `dist/` output into the hub's `public/`
folder, so you never have to build the children by hand.

### Verification suite

Deterministic guards protect the layout, assets and UI invariants:

```bash
npm run verify:structure
npm run verify:cartridge-layout        # horseshoe wreath: symmetry, spacing, no overlap
npm run verify:homebrew-cartridges     # ROM headers + open licences
npm run verify:game-boy-lcd-updates
npm run verify:dammagotchi-localized-home
# …and more — see package.json "scripts"
```

---

## Project structure

```
GameX/
├── index.html                 # hub entry (Vite)
├── package.json               # hub deps + all npm scripts
├── vite.config.js
├── src/                       # hub source
│   ├── main.js                #   app switcher, iframe host, language
│   ├── styles.css             #   hub UI (collapsible switcher)
│   └── bgm.js                 #   original chiptune BGM + toggle button
├── scripts/                   # build & verify tooling
│   ├── prepare-apps.mjs       #   install + build child apps → /public
│   ├── build-all.mjs
│   └── verify-*.mjs           #   deterministic guards
├── apps/
│   ├── game-boy/              # 3D Game Boy (Three.js + Pixi.js + WasmBoy)
│   │   ├── src/               #   scene, cartridges, emulator, games
│   │   ├── public/            #   runtime assets (models, textures, audio, video, fonts)
│   │   │   └── roms/          #   bundled homebrew ROMs + ATTRIBUTION.md
│   │   └── tools/             #   cartridge texture pipeline + source data
│   │       ├── build-cartridges.mjs      #   bakes label art onto cartridge atlases
│   │       ├── pokemon-cartridges.json   #   the 15 releases (order, colours, crops)
│   │       ├── homebrew-cartridges.json  #   ROM → cartridge mapping
│   │       ├── sources/                  #   high-res cartridge scans (backup data)
│   │       └── bases/                    #   baked UV atlases
│   └── dammagotchi/           # virtual pet (AGPL-3.0)
├── docs/
│   ├── dev-notes/             # progress log + iteration history
│   └── reference/             # concept art, posters (kept as backup/reference)
└── (generated — git-ignored)  node_modules/, dist/, public/
```

### Data & backups (kept on purpose)

Regenerable build output (`dist/`, the hub's `public/`, `node_modules/`) is
git-ignored, but all **source and backup data is committed** so the project is fully
reproducible:

- `apps/game-boy/tools/sources/` — the original high-res cartridge scans the label
  textures are baked from. Re-run `node apps/game-boy/tools/build-cartridges.mjs`
  (needs `sharp`) to regenerate `apps/game-boy/public/textures/`.
- `apps/game-boy/public/roms/` — the bundled homebrew ROMs.
- `apps/dammagotchi/assets.zip` + `screens/` — the pet app's original asset backup and demo captures.
- `docs/reference/` — posters and concept renders.

---
