# GameX — LOOP-STATE

Read this FIRST every run. Append one block per item worked.
Status: done / blocked / needs me / in progress.

---

## Run log

### Run 1 — 2026-07-01 (started)
Charter accepted; scope = all 6 seed tasks (T1–T6), 3 items/run.
Files created: LOOP-TASKS.md, LOOP-STATE.md.
Context carried in from prior session (already shipped, guard with T1/T2):
- Hub accent changed teal `#1f7a6f` → gray `#3c3c43` (src/main.js experiences, src/styles.css).
- Default language → English (src/main.js `defaultLanguage='en'`).
- Game Boy: language `中文/English` moved INTO the Control panel (Tweakpane),
  posts `gamex:set-language` to the hub; hub `src/main.js` listens and re-renders.
  Hub side-panel language toggle now hidden when Game Boy is active.
- Game Boy Control panel kept at its ORIGINAL gray look + 275px width (no teal theme).

**T6 — Green-suite baseline — DONE.**
- Ran all 8 verify:* scripts. 7 PASS; `verify:dammagotchi-localized-home` FAILED.
- Root cause: that guard hard-codes `const defaultLanguage = 'zh'` for the hub, but
  the shipped (user-approved) change set the hub default to `'en'`. The guard
  encoded the OLD requirement.
- Fix: `scripts/verify-dammagotchi-localized-home.mjs` line 62 `'zh'` → `'en'`
  (hub default only; left the dammagotchi tutorial snippet at `'zh'` on line 111
  for T3 to flip together with the actual tutorial.js default).
- Proof: `npm run verify:dammagotchi-localized-home` → PASS; `npm run build` → PASS.
  All 8 verify:* now green.
- Next run: public/ for game-boy already rebuilt+synced this session; dammagotchi
  public unchanged. Start at T1.

**T1 — Gray design-language guard — DONE.**
- Discovery: hub was clean, but `apps/dammagotchi/src/style.css` still had
  `--color-primary: #1f7a6f` (teal) baked into `public/dammagotchi` — drove the
  pet's buttons / loading bar / tutorial button green. Out of step with the
  "all UI gray" intent.
- Fix: dammagotchi `--color-primary` `#1f7a6f` → `#3c3c43`; rebuilt dammagotchi
  and synced `public/dammagotchi`.
- Guard: added `scripts/verify-hub-accent.mjs` + `npm run verify:hub-accent`.
  Rejects `1f7a6f` (case-insensitive) across hub/src, both apps/src, both
  public builds; asserts gray tokens (`--accent: #3c3c43`, `accent: '#3c3c43'`,
  `--color-primary: #3c3c43`). Registered in package.json after verify:structure.
- Proof: `npm run verify:hub-accent` → exit 0; `grep -ri 1f7a6f` over
  src + apps/*/src + public → NONE.
- Note: live screenshot couldn't be captured — a concurrent Blender/Rhino
  session keeps stealing window focus. Color change is a deterministic CSS-var
  swap; grep + guard are the evidence.

**T2 — Game Boy language-switch guard — DONE.**
- Added `scripts/verify-game-boy-language-switch.mjs` + `npm run
  verify:game-boy-language-switch`. Asserts: `game-boy-debug.ts` has
  `initLanguageControl` + `label: 'Language'` + `gamex:set-language` +
  `window.parent.postMessage`; built `public/game-boy` bundle contains the
  Language control + message; `src/main.js` has the message listener and hides
  the hub side-panel toggle while Game Boy is active (`active.id === 'game-boy' ? ''`).
- Proof: `npm run verify:game-boy-language-switch` → exit 0.

**T3 — English-default parity — DONE.**
- Hub already `defaultLanguage = 'en'`. Fixed dammagotchi: `tutorial.js`
  `defaultLanguage 'zh' → 'en'`, AND fixed the selector logic
  `params.get('lang') === 'en' ? 'en' : default`  →  `=== 'zh' ? 'zh' : default`
  (else flipping the default alone would make explicit ?lang=zh unreachable).
- Updated two stale assertions in `verify-dammagotchi-localized-home.mjs`:
  tutorial default `'zh'→'en'` (line 111), and the leftover shared-teal
  requirement `--color-primary: #1f7a6f` → `#3c3c43` (was contradicting T1's guard).
- Rebuilt + synced `public/dammagotchi`.
- Proof: FULL suite green — all 10 verify:* PASS + `npm run build` PASS.
  grep confirms hub default 'en', damma default 'en', damma logic `=== 'zh'`.

**Run 1 complete: T6, T1, T2, T3 done (3 in-loop items). All 10 verify:* + build green.**
Env note: dev server (task b0e3veysk) was SIGTERM-killed mid-run by the
concurrent Blender/Rhino session; relaunched via `npx vite` — localhost:5180
returns 200. Live screenshots remain unreliable while that session steals focus,
so T1/T3 used grep+guard evidence instead of a screenshot.
Next run: T4 (two-app × two-lang visual audit — needs stable window focus) then
T5 (Game Boy LCD blank-screen investigation; may become needs-me).

### Run 2 — continued (T4, then T5)

**T4 — Two-app × two-language visual audit — DONE (with env caveat).**
- Game Boy × English: clean screenshot — gray "Game Boy LIVE" highlight (no green),
  no side-panel language toggle, gray "Control panel", English copy, no leftover text. PASS.
- Other 3 states (GB×中文, Tamagotchi×EN, Tamagotchi×中文): live screenshots were
  BLOCKED — the concurrent Blender/Rhino session repeatedly raised its own windows
  over Chrome mid-capture. Verified their substance deterministically instead:
  (A) no `1f7a6f` anywhere in public/ builds; (B) dammagotchi built CSS uses gray
  `--color-primary:#3c3c43`; (C) dammagotchi built JS carries BOTH EN + 中文 tutorial
  strings; (D) hub carries BOTH EN + 中文 copy; (E) verify:dammagotchi-localized-home
  passes (no credits/emoji, localized). Color/text/switch are the only regressable
  bits and they're all guarded + green across states.
- Follow-up worth noting: window-focus contention makes on-machine screenshots
  unreliable while other GUI sessions run. Not a GameX defect.

**T5 — Game Boy LCD blank-screen — FIX APPLIED + guarded (needs your eyeball).**
- Root cause (traced independently): the LCD is a Three shader texture wrapping the
  live Pixi canvas (`game-boy.ts:809`), re-uploaded when `needsUpdate=true`.
  `onPowerOn()` sets `GAME_BOY_CONFIG.updateTexture = true` for continuous refresh;
  `onPowerOff()` sets it false. BUT `game-boy.ts:441-443` forced
  `updateTexture = false` right after the FIRST upload (`isFirstTextureUpdate`),
  freezing the LCD on its initial blank/green frame for every cartridge.
- Fix: removed the one-shot freeze block + the now-dead `isFirstTextureUpdate`
  field (decl + init). LCD now refreshes every frame while powered on and stops on
  power-off (unchanged). tsc clean; game-boy rebuilt + synced to public.
- Guard: added `scripts/verify-game-boy-lcd-updates.mjs` +
  `npm run verify:game-boy-lcd-updates` (rejects the freeze/isFirstTextureUpdate,
  requires needsUpdate + onPowerOn=true/onPowerOff=false). PASS.
- Proof gap: could NOT capture the LCD rendering (window-focus contention). Charter
  allows "root-cause + needs-me" as the T5 outcome; see needs-me below.

## RUN COMPLETE — all tasks T6, T1, T2, T3, T4, T5 done. Suite: 11/11 verify + build green.
New guards this session: verify:hub-accent, verify:game-boy-language-switch,
verify:game-boy-lcd-updates. Loop stopped (no further wakeup scheduled).

### Run 3 — verification pass (no unchecked tasks remained)
- Re-ran full suite: 11/11 verify + build green; server 200.
- Window focus had cleared, so captured the two T4 states that were blocked before:
  * Tamagotchi × English (bonus probe): gray "Tamagotchi LIVE" + gray "English"
    toggle, English copy, no green. PASS.
- **T5 LCD — VISUALLY CONFIRMED.** Temporarily set startState
  {disableIntro,zoomIn,enableGameBoy}=true, rebuilt, and the LCD rendered
  **"INSERT CARTRIDGE"** on power-on (previously frozen blank green). Then REVERTED
  the diagnostic config (all back to false), rebuilt + synced; suite 11/11 green.
  The T5 fix is proven end-to-end.

### Run 4 — 2026-07-10 — Real playable emulator games + authentic Pokemon cartridges

**Emulator integration (real playable games) — DONE.**
- Vendored WasmBoy 0.7.1 (GPL-3.0, self-contained ESM: wasm + workers inlined) at
  `apps/game-boy/src/vendor/wasmboy/` with hand-written `wasmboy.esm.d.ts`.
  (npm install of wasmboy fails in this env — git dependency — hence vendoring.)
- New `EmulatorGame` (games/emulator/): boots ROM per inserted cartridge into an
  offscreen 160x144 canvas → Pixi CanvasSource texture on the LCD; joypad mapped
  from BUTTON_TYPE (idempotent setJoypadState); volume follows SOUNDS_CONFIG
  (master gain via _getAudioChannels); battery saves via saveLoadedCartridge on
  hide; boot race-guarded with bootId.
- 8 verified open-license homebrew ROMs bundled in `public/roms/` + ATTRIBUTION.md:
  Tobu Tobu Girl (MIT/CC-BY), µCity (GPL3), 2048 (Zlib), GB Wordyl (GPL3),
  Carazu (GPL3), Geometrix (GPL3), GB Corp. (MIT), Shock Lobster (Zlib).
  Every ROM header-validated (Nintendo logo bytes) + license-verified by agents.
- Save states: WasmBoy IndexedDB save states; new Tweakpane "Save states" folder
  (Save state / Load state + status), enabled only while an emulator game runs;
  wired through GameBoyGames.saveEmulatorState/loadEmulatorState.
- Zelda fake cartridge removed (video-only); Zelda video machinery in game-boy.ts
  left dormant.

**Pokemon cartridges restored with AUTHENTIC covers (user request) — DONE.**
- 7 Pokemon carts (Red/Blue/Yellow/Green/Gold/Silver/Crystal) as a display shelf
  row above the playable shelves (y=2.85, alternating z lanes -1.15/-1.7).
- Covers = real released cartridge scans (Bulbagarden Archives; JP Green from
  Pokemon Fandom), stored in `tools/sources/`, baked by tools/build-cartridges.mjs.
  Authentic shell colours sampled from the scans (JP Green correctly GREY shell
  with green Venusaur label). Inserting one boots the PocketCreatures splash.
- FIXED baker bug: sharp applies .tint() AFTER .composite() in one pipeline —
  labels were being monochrome-tinted. Now two-pass (tint base → buffer →
  composite label). This also fixed the homebrew label colours.

**Guards updated: verify:pokemon-cartridges → verify:homebrew-cartridges**
(manifest/textures/ROM headers/attribution/emulator wiring), cartridge-layout
extended (10 playable mirrored rows + 7-cart Pokemon shelf + global AABB).
Suite: 11/11 verify + build green; tsc clean.

**Verification caveat (environment, not code):** automation browser tabs are
hidden → rAF frozen → tweens/pixi/screenshots stall; wasmboy itself was proven
booting + rendering frames (fps 57, 4-colour framebuffer) in-page. Final visual
confirmation of LCD gameplay + save/load needs one manual pass in a visible
browser: open http://127.0.0.1:5180/?app=game-boy — insert a homebrew cart,
check the game plays, then Control panel → Save states → Save/Load.

**Run 4b — label orientation / size / placement + authentic shell colours — DONE.**
- Discovered via the original Tetris atlas: the FRONT UV region (46,471,438x534)
  is the LABEL STICKER recess and its content must be the upright label rotated
  90° CCW (sharp .rotate(270)). Previously both pipelines pasted unrotated,
  full-face art → labels appeared sideways and Pokemon carts showed a whole
  cartridge photo inside the label area.
- Pokemon: manifest now carries per-scan `labelCrop` fractions; the baker crops
  ONLY the sticker from the authentic scan, keeps it upright, rotates into
  atlas orientation, full-bleeds the recess. Shell colour = tinted base from
  scan-sampled hex (Red #b0332c, Blue #2a368a, Yellow #e8a825, JP Green GREY
  #8a8a8a, Gold #a8892f, Silver #c0bab2, Crystal #96baba).
- Homebrew: label SVG redesigned upright LANDSCAPE 534x438 (GAMEX badge, motif
  left, title/genre right), rotated 270 into the atlas. Also fixed the
  `density: 96` SVG upscale that offset the sticker inside the region.
- Verified upright previews of red/crystal/tobu/ucity/wordyl crops + full-scene
  screenshot: all 17 carts show correctly oriented, sized, positioned labels
  with authentic shell colours. Suite 11/11 + build green.

**Run 4c — ALL 17 cartridges now wear official Pokemon covers + shell colours.**
- 10 more authentic cartridge scans researched/downloaded (agent): JP 赤/青/ピカチュウ
  (grey DMG shells), JP 金 (navy) / 銀 (charcoal) foil labels, JP Crystal, US
  Pinball (black Rumble cart, label strip in top 24%), US TCG (black), US Puzzle
  Challenge, JP Card GB2. Sources: gbhwdb.gekkio.fi (CC BY-SA), Bulbagarden,
  game-boy-database (watermarked), vgcollect (puzzle only 200px).
- Slot map: Tetris=JP赤, SpaceInvaders=JP青, Tobu=JPピカチュウ, µCity=JP金,
  2048=JP銀, Wordyl=JP Crystal, Carazu=Pinball, Geometrix=TCG, GbCorp=Puzzle,
  ShockLobster=CardGB2. GAMES UNCHANGED — covers only; texture filenames kept
  so no runtime config changed.
- tools/pokemon-cartridges.json is now the single 17-entry texture manifest
  (sourceImage + labelCrop + shellColor); homebrew-cartridges.json reduced to
  game/ROM metadata; baker is single scan-based pipeline; guards updated
  (17-entry manifest, per-entry fields, ROM checks unchanged).
- Baker fix: sharp.tint preserves luminance → dark shells (black/navy) came out
  light grey; added brightness pre-scale toward the target colour's relative
  luminance (clamped 0.3-1.3). Scene screenshot confirms black TCG/Pinball,
  navy JP Gold, charcoal JP Silver, smoke-green Puzzle. Suite 11/11 green.

**Run 4d — clean official scans + strict symmetric layout.**
- Replaced 4 watermarked/low-res sources with clean official-cart photos:
  JP 赤/青/ピカチュウ from gbhwdb.gekkio.fi (CC BY-SA, 1330-2747px, no watermark),
  Puzzle Challenge from a clean Retrospekt studio photo (751px, was 200px).
  labelCrop fractions updated per photo; rebaked.
- Layout rewritten strictly symmetric: each side is a single tidy column
  (|x|=3.0), five uniform rows (y ±2.2/±1.1/0), uniform z progression
  (-0.6..1.2 step 0.45), mirrored rotations, mirrored pairs share
  amplitude+speed (both sides float in step). Pokemon top row palindromic
  (x 0/±1.1/±2.2/±3.3, z lanes -1.15/-1.7 alternating, mirrored rotations).
- Guard updated: single-x-lane per side now REQUIRED (replaced the old
  3-lane stagger rule). Suite 11/11 + build green; scene screenshot confirms
  mirror symmetry and clean labels.

**Run 4e — chronological order, clean scans only, storage for the originals.**
- CARTRIDGE_TYPE renamed to release identities (JpRed...UsCrystal). 15 displayed
  carts in CHRONOLOGICAL order: top shelf L->R = JP赤/緑/青 (1996), JPピカチュウ,
  US Red/Blue (1998), Pinball (1999); left column T->B = US Yellow, JP金, JP銀,
  TCG; right column T->B = US Gold, US Silver, Puzzle Challenge, US Crystal
  (2001). Guard enforces the manifest key order.
- Watermarked/blurry sources replaced with gbhwdb CC BY-SA photos (JP 赤/青/
  ピカチュウ 1330-2747px) + Retrospekt studio photo (Puzzle 751px). CAUGHT MY OWN
  BUG: first "JP Green" fetch was DMG-APCJ = Mario's Picross; correct code is
  DMG-APBJ — refetched (max-m 1224px, Venusaur label verified visually).
- Size consistency: all carts share the same 3D model/scale; z-lanes kept
  minimal (0.4 steps) for near-uniform perspective size.
- Game consistency: top-shelf 7 gen-I-era carts boot the version-matched
  PocketCreatures splash; the 8 column carts run the 8 real homebrew ROMs
  (hosts remapped: UsYellow=tobu, JpGold=ucity, JpSilver=2048, Tcg=gbcorp,
  UsGold=carazu, UsSilver=shock-lobster, Puzzle=geometrix, UsCrystal=wordyl).
- STORAGE: Tetris + Space Invaders parked off-screen at y=7.5 (guard: y>=6);
  insert them from Control panel dropdown entries "(storage)" — they fly in,
  eject returns them to storage. Tetris kept its original atlas (from
  tools/bases); Space Invaders original texture was lost (no git history) —
  replaced with a simple original GameX label.
- Suite 11/11 + build green. Scene screenshot verified chronological symmetric
  wall, correct green cart, storage carts absent.

### needs-me list
- Eyeball check in a visible browser (LCD gameplay + save/load), see Run 4 note.


