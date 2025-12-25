# TODO - Re-orient After Long Hiatus

## Storage / validation flow concerns (high priority)
- Confirm bio-inventory direction: is `fishCollection` evolving into `bioInventory`? If yes, define schema + validator now.
- DONE: `validateAndTransformGameData` now validates both legacy `fish` and `fishCollection`.
- DONE: Confirmed official storage key is `caroles_reef_save_data` (others are legacy).
- Decide on the intended single path: load -> validate -> in-memory state -> save -> validate -> storage.
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
- Confirm how `FishManager` (in-memory) relates to `gameState` (app state) and `storageManager` (persistence).
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
- Current branch: `fix/10-invalid-saved-fish-traits`.
- Working tree is dirty (multiple modified + deleted + untracked files); see `git status -sb` before doing any new work.
- Consider whether we should make a checkpoint commit soon (do not commit yet; decide after review).
- Check why `src/creatures/validation.ts` is deleted and `old/validation.ts` is untracked.
- Check coverage artifacts in repo (modified): `coverage/*` files probably should not be committed.

## Process Reminder
- After any code/doc changes, update `CHANGELOG.md` and `TODO.md`.
- DONE: Added `npm run deploy:prod` to run tests, build, and `scripts/deploy.sh`.

## Architecture direction (post-Issue #10)
- Decision: GameState is the single source of truth for runtime data; FishManager/globals are legacy adapters only.
