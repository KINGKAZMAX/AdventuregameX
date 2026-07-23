# GameX — LOOP-TASKS

One unchecked box = one task. Finish fully, prove with evidence, then check it.
Order is intentional (baseline → guards → parity → audit → known bug).
See the loop charter for HOW TO WORK / HOW TO CHECK conventions.

Full acceptance gate (the project's green-suite):

```
npm run build \
  && node scripts/prepare-apps.mjs public \
  && npm run verify:structure \
  && npm run verify:cartridge-layout \
  && npm run verify:hub-preview-frame \
  && npm run verify:game-boy-render-scale \
  && npm run verify:pokemon-cartridges \
  && npm run verify:game-boy-pixi-runtime \
  && npm run verify:game-boy-no-intro-text \
  && npm run verify:dammagotchi-localized-home
```

## Tasks

- [x] **T6 — Green-suite baseline.** Run the full acceptance gate above as-is.
      Record which checks pass/fail in LOOP-STATE.md. Fix only trivial/obvious
      breakage now; log anything bigger as its own follow-up. Confirm `public/`
      is in sync with the latest `apps/*` builds.
      *Proof:* the full gate command exits 0 (or a precise pass/fail table).

- [x] **T1 — Gray design-language guard.** Add `scripts/verify-hub-accent.mjs`
      + `npm run verify:hub-accent` (follow the existing `verify-*.mjs` pattern).
      It must FAIL if the old teal/green accent `#1f7a6f` (or any obvious green)
      appears in hub `src/` or `public/`, and must confirm `--accent` is in the
      gray family. Then run it.
      *Proof:* `npm run verify:hub-accent` exits 0; grep for `1f7a6f` in src/public is empty.

- [x] **T2 — Game Boy language-switch guard.** Add a guard (own verify script or
      extend an existing one) asserting: built `public/game-boy/**` contains the
      `Language` blade + `gamex:set-language` postMessage, AND `src/main.js`
      listens for `gamex:set-language`. Prevents regression of "language lives in
      the Game Boy Control panel."
      *Proof:* the new/extended `npm run verify:*` exits 0.

- [x] **T3 — English-default parity.** Confirm a fresh load with NO `?lang` is
      English everywhere: hub `defaultLanguage === 'en'` AND dammagotchi's own
      default (`apps/dammagotchi/src/experience/tutorial.js`) is English. Fix the
      dammagotchi default if it still defaults to Chinese. Keep EN/中文 parity.
      *Proof:* code shows both defaults = en; visual audit of a no-`?lang` load
      shows English on hub and inside dammagotchi.

- [x] **T4 — Two-app × two-language visual audit.** On localhost:5180 audit all
      four states: {Game Boy, Tamagotchi} × {English, 中文}. Confirm: gray accent
      (no green), Control panel gray with working language switch, no leftover
      intro/credits/copyright/emoji text. Log any defect found as a new task.
      *Proof:* a screenshot per state, each described against the checklist.

- [x] **T5 — Game Boy LCD blank-screen quirk.** progress.md notes the Game Boy
      LCD renders blank in local dev (battery powers on, screen stays green, game
      art does not draw — affects Tetris and the cartridges). Investigate root
      cause. If the fix is mechanical, fix + add a guard. If it needs asset
      replacement or a large refactor, log as NEEDS ME with findings.
      *Proof:* LCD renders a game on insert (screenshot), or a written root-cause
      + needs-me decision.
