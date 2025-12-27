# TODO - Re-orient After Long Hiatus

## Cleanup / lint / formatting initiative (step-by-step)

- DONE: Baseline status recorded (`git status -sb`).
- DONE: Inventory lint/format issues: run `npm run lint` and capture active vs legacy file failures.
- DONE: Decide scope: which legacy paths get excluded vs fixed (update ESLint ignores if needed).
- DONE: Align lint-staged: ensure only active files get auto-fixed on commit.
- DONE: Fix active-file lint errors, then re-run `npm run lint`.
- TODO (duplication): Consolidate fish collection CRUD across `fishStorage`, `FishCollection`, and legacy FishCard paths.
- TODO (duplication): Centralize validation so fish data is normalized in one place per flow (storage, backup, UI).
- TODO (duplication): Remove direct `storageManager.save()` calls from UI fallbacks once GameState path is unified.
- DONE: Update e2e fish collection tests to use `caroles_reef_save_data` key (retire `caroles_reef_saved_fish`).
- DONE: Added tests for backup export normalization and corrupted restore defaults.
- DONE: Adjusted topbar positioning/opacity and constrained fish movement below it.
- DONE: Mate seeking only targets opposite sex and clears stale mate targets.
- DONE: Load saved fish on startup; only seed 10 fish when no saved data exists.
- DONE: Reload restores only fish that were in the live tank.
- DONE: Fish movement bounds now refresh on window resize.
- DONE: Collection table now shows fish sex.
- DONE: Persist live tank snapshot (including non-collection fish) and flush on exit/reload.
- DONE: Bumped app version to 0.1.5.
- DONE: Added changelog formatter to enforce heading spacing rules.
- DONE: Removed unused `old/` directory from the repo.
- DONE: Removed legacy snapshot `src/legacy/runLegacyGame.ts.0829_2040`.
- DONE: Fixed easy lint errors (removed `require()` usage, scoped switch case, removed unused import, replaced `@ts-ignore`).
- DONE: `GameState` now uses static `storageManager` import to avoid mixed dynamic/static warning.
- DONE: Moved Breeding HUD to top-right under the menu bar.
- DONE: Breeding HUD now toggles from a FishCard button instead of opening automatically.
- DONE: ESLint now ignores `src/legacy/**` during cleanup.
- DONE: Added `docs/UNUSED_VARS_AUDIT.md` with unused-variable analysis.
- DONE: Removed unused variables from `src/entities/fish.ts`.
- DONE: `BackgroundConfig` now uses `unknown` for extra keys instead of `any`.
- DONE: Tightened `FishManager` fish data typing and added a FishManager test.
- DONE: Tightened fish storage typing and added a fishStorage test.
- DONE: Creature type index signatures now use `unknown` instead of `any`.
- DONE: GameState fishCollection typing tightened and added a GameState test.
- DONE: Tightened spawn-to-tank bio data typing to avoid `any`.
- DONE: Tightened localStorageManager fish data and serialization typing to avoid `any`.
- DONE: Removed remaining explicit `any` usage across FishCollection, fish entity logic, BackupManager, validator, and tests.
- DONE: Updated ActiveFiles overview + core/audio/legacy entries for current code paths.
- DONE: Updated ActiveFiles entities/rendering/creatures/UI/config/utilities entries for current code paths.
- DONE: Added missing active legacy/state files to ActiveFiles list.
- DONE: Marked spawn-to-tank UI control as planned in ActiveFiles.
- DONE: Added legacy methods/functions inventory (`docs/LegMethFunc.txt`).
- DONE: Marked legacy methods/functions as used/internal in `docs/LegMethFunc.txt`.
- DONE: Removed unused stubs `src/audio/bus.ts` and `src/creatures/registry.ts`.
- DONE: Sweep dead files/unused code in active paths; remove or archive with notes.
- DONE: Docs alignment: update or tag docs as legacy/plan/current to match code reality.
- DONE: Documented planned `bioInventory` naming in planning docs.
- DONE: Repo hygiene: ignore and remove tracked generated artifacts (`coverage/`).
- DONE: Verify: run `npm test` and `npm run build`.
- Record: update `CHANGELOG.md` and `TODO.md` with cleanup results.

## Storage / validation flow concerns (high priority)

- DONE: Confirmed `fishCollection` will evolve into `bioInventory` (schema/validator work deferred).
- Define `bioInventory` schema + validator and plan the migration from `fishCollection`.
- DONE: `validateAndTransformGameData` now validates both legacy `fish` and `fishCollection`.
- DONE: Confirmed official storage key is `caroles_reef_save_data` (others are legacy).
- DONE: Single persistence path confirmed: load -> validate -> in-memory state -> save -> validate -> storage.
- DONE: GameState is runtime source of truth; localStorage is only source on startup/restore; Backup/Restore is offline import/export.

## Backup / restore flow concerns

- `BackupManager` builds backup from `gameState` plus `FishManager` bio inventory; verify the expected shape and versioning.
- Restore merges `backup.gameState` into top-level save data (shape mismatch risk); verify intended structure.
- Restore updates globals (`window.fishCollection`, `window.fish`) and repopulates `FishManager` (extra side effects).
- DONE: GameState is the runtime source of truth; FishManager/globals are legacy adapters only.
- Clarify separation between regular localStorage saves vs manual file-based backup/restore (two distinct persistence paths).

## Collection UI / gameplay flow

- Collection add/remove/rename now persist through GameState/LocalStorageManager; confirm any remaining code paths.
- Spawning from collection adds to in-tank globals without validation or save; confirm desired behavior.
- Confirm which code path should be the sole entry point for save/load of collection.

## Fish -> Bio migration (naming, data model, validator)

- Inventory / collection is still “fish” in most code paths; start tracking where to rename to “bio”.
- Validator converts legacy fields (e.g., `senseRadius` -> `senseGene`) but only in fish validation. Confirm all new data uses the new fields on save.
- Decide on new storage schema for bio inventory and update validators accordingly.
- Identify APIs and UI text that still say “fish” but should be “bio”.

## Code organization / migration risks

- There may be duplicated or obsolete methods not called anymore; add a sweep pass for dead code.
- DONE: Confirmed: FishManager is legacy in-memory adapter; GameState is runtime truth; storageManager handles persistence.
- Validate that the new modular structure is actually used in runtime; list any modules not yet wired in.

## LocalStorage access inventory (current usage)

- Central manager: `src/utils/localStorageManager.ts` (key `caroles_reef_save_data`).
- Legacy and backup paths also touch collection state via globals; ensure these do not bypass validation.
- Several historical/alt files also call localStorage (`src/ui/FishCollection.ts.old`, `src/ui/FishCollection.ts-tooMuchWorkDoneBroken`, `src/ui/FishCollection.ts.0829_*`); confirm if these are dead code.

## Full scan results (GameState / FishManager / globals / localStorage)

- GameState usage: `src/ui/FishCollection.ts`, `src/utils/BackupManager.ts`, `src/utils/fishStorage.ts`, `src/entities/fish.ts`, `src/legacy/runLegacyGame.ts`, `src/legacy/fishCardUI.ts`, `src/main.ts`.
- FishManager usage: `src/legacy/runLegacyGame.ts` (init) and `src/utils/BackupManager.ts` (backup/restore sync).
- Globals: `window.gameState` set in `src/legacy/runLegacyGame.ts`; `window.fishCollection` set in `src/ui/FishCollection.ts`; `window.fish` and `window.fishCollection` touched in `src/utils/BackupManager.ts`; `window.fishCollection` used in `src/ui/controls/spawnToTank.ts`.
- Direct localStorage access remains only in `src/utils/localStorageManager.ts`.

## Docs inventory (may be outdated; review and tag)

- `docs/ActiveFiles.txt`
- `docs/ARCHITECTURE.md`
- `docs/Class_Family_Species_Variety.txt`
- `docs/DEVELOPMENT.md`
- `docs/FileStructure.txt`
- `docs/fish_ages.txt`
- `docs/TOOLING.md`
- `docs/UsageMap.html`
- Decide which docs are authoritative vs legacy; annotate after review.
- `docs/ActiveFiles.txt` appears out of sync with the current repo (lists files not present and claims persistence model that conflicts with current code).

## Branch / repo status snapshot

- Current branch: `chore/lint-format`.
- Working tree should stay clean while we scope lint/cleanup work.
- DONE: `coverage/` removed from git tracking and ignored going forward.

## Process Reminder

- After any code/doc changes, update `CHANGELOG.md` and `TODO.md`.
- DONE: Added `npm run deploy:prod` to run tests, build, and `scripts/deploy.sh`.

## Architecture direction (post-Issue #10)

- Decision: GameState is the single source of truth for runtime data; FishManager/globals are legacy adapters only.
