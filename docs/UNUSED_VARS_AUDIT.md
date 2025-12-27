# Unused Vars Audit

Status: Current lint-cleanup audit (update as code changes).

Scope: lint-reported unused variables and why they appear unused today.
Legacy files are listed for completeness but are planned to be ignored by ESLint.

## Active Files

- src/entities/fish.ts:5 `Sounds`
  - Why it exists: legacy sound enum import from `utils/audio`.
  - Current usage: only `playSound(...)` is used; `Sounds` is never referenced.
  - Status: removed.

- src/entities/fish.ts:12 `ctx`
  - Why it exists: configured in `configureFish` for drawing in early versions.
  - Current usage: draw functions accept a `ctx` parameter; module-level `ctx` is never read.
  - Status: removed.

- src/entities/fish.ts:15 `decors`
  - Why it exists: configured in `configureFish` for decor interactions.
  - Current usage: not referenced; decor proximity now uses `gameState.getState().tank.decorations`.
  - Status: removed.

- src/entities/fish.ts:17 `discovered`
  - Why it exists: configured in `configureFish` to track discovered combos.
  - Current usage: discovery tracking now uses a local `discovered` set derived from `gameState` inside `trackDiscovery`.
  - Status: removed.

- src/entities/fish.ts:18 `onIncGeneration`
  - Why it exists: configured in `configureFish` to increment generation externally.
  - Current usage: generation increments happen directly in `breed(...)` via `gameState.updateState`.
  - Status: removed.

- src/entities/fish.ts:19 `maxFish`
  - Why it exists: configured in `configureFish` for tank population caps.
  - Current usage: not referenced; cap checks use local constants in behavior code.
  - Status: removed.

- src/entities/fish.ts:824 `senseRadius`
  - Why it exists: leftover local variable from older food-targeting logic.
  - Current usage: computed but not used; actual food radius uses `eff`.
  - Status: removed.

## Legacy Files (ignored by ESLint; still here for reference)

- src/legacy/bubbles.ts:32 `W`, `H`
  - Why it exists: destructuring from `getSize()` left unused.
  - Current usage: values not referenced; could be removed without behavior change.

- src/legacy/inputHandlers.ts:44, 63 `e`
  - Why it exists: event parameter unused in handlers.
  - Current usage: mouse state uses outer `mouse`, not `e`.
  - Confidence: safe to drop parameter or rename to `_e`.

- src/legacy/runLegacyGame.ts:22 `playSound`, 23 `Sounds`, 29 `storageManager`, 94 `randi`, 96 `chance`, 113 `time`, 205 `togglePanel`
  - Why it exists: leftovers from earlier monolith wiring.
  - Current usage: no references in the modularized version.
  - Confidence: safe to remove when legacy is refactored or if we decide to clean it.
