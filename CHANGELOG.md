# Changelog

## [0.1.8] - 2026-01-02
### Added
- Added a reusable eye renderer module for species-agnostic eye drawing
### Changed
- Eye rendering now supports distinct `eyeType` visuals (sleepy, sparkly flash accents, winking animation)
- Sparkly eyes now flash briefly instead of staying visible between flashes
- Fish rendering now flips horizontally on leftward movement and clamps visual pitch to ±65°
### Fixed
- Fish no longer render upside down when swimming left

## [0.1.7] - 2025-12-31
### Changed
- Bumped app version to 0.1.7
- Strengthened decor affinity behavior to bias wander modes, target distance, and darting
- Rock avoidance now loiters briefly and steers away to reduce jitter
- Rock avoidance throttled to reduce CPU load and keep movement speed stable
- Rock avoidance now uses a rock index and periodic checks to reduce per-frame work
- Reduced decor collision radii and adjusted plant rendering baseline
- Rock blocking radius now matches rock ellipse width (18/30/48)
- Added decor radius debug toggle with persistent setting
- Selected decor now renders above others by moving it to the end of the array
- Pause checkbox now polled each frame to avoid missed toggle events
- Tank fish updates now throttle collection writes when the collection panel is closed
### Added
- Fish now bounce/deflect off rocks with a brief slow-down and vertical nudge on collision
- Added varied wander behaviors (loiter, slow, cruise, dart, top-bottom) for more natural fish movement
- Added a selected-fish tooltip showing current state and wander mode
- Added decor affinity gene (defAffGene/defAffType) to influence wandering preferences
### Fixed
- Persisted placed decor in localStorage and backup/restore flows
- Persisted pause toggle state in localStorage and backup/restore flows
- Allowed decor items to be moved (drag) or removed (shift-click/right-click) after placement
- Restored FishCard selection on click after drag handling changes
- Restoring without keeping tank fish now clears the tank and seeds new fish when needed
- Restore dialog now includes options to restore tank fish and tank layout separately
- Restore now uses fishInTank IDs to rebuild the tank when tankFish is empty
- Restore now prefers tank snapshot positions when available to keep live X/Y accurate
- Restore now merges tankFish snapshots with fishInTank to rebuild the live tank without duplicates
- Backup restore now skips duplicate fish IDs in collection or tank and warns in console

## [0.1.6] - 2025-12-28
### Added
- Introduced a full-screen New Collection modal alongside the existing View Collection panel
- Expanded the inventory table to show all known traits, genes, and metadata with horizontal scrolling
- Added per-column filter controls with live filtering and active column highlighting
- Added inventory filter presets with save/rename/delete, default "All" preset, and GameState/localStorage persistence
- Added column hide/unhide controls and drag-to-reorder column headers (persisted in presets)
- Included inventory preset data in backup/restore flow
### Changed
- Merged Hue/Color into a single Hue column that shows the hue value plus the color swatch
- Moved Favorite/Shiny indicators into their own columns (no longer shown next to the name)
- Switched timestamp columns to show `YYYYMMDD` and `HH:MM:SS` on separate lines
- Renamed saved collection timestamp to `lastSaved` and displayed it as "Last Saved"
- Updated column header layout (f/M/H row above label) and kept column widths fixed
- Table width now shrinks/grows with visible columns instead of stretching
- Preset dropdown styling now matches the dark theme and shows "Custom" when filters differ
- New Collection spawn uses saved X/Y when available, clamped to the current viewport (center fallback)
- Number-range filters use numeric input mode with Min auto-focus on open
### Fixed
- Removed legacy `rarity`/Rarity Tag from UI, storage, and validation (kept `rarityGene`)
- Preserved X/Y when saving fish to the collection
- Prevented filter input caret from jumping to the start on each keystroke
- Ensured sticky header has an opaque background to avoid row overlap bleed-through

## [0.1.5] - 2025-12-27
### Fixed
- Removed `coverage/` from git tracking and added it to `.gitignore`
- Removed unused `old/` directory from the repo
- Removed legacy snapshot `src/legacy/runLegacyGame.ts.0829_2040`
- Fixed lint blockers: removed `require()` usage in TS, scoped switch case declarations, removed unused import, replaced `@ts-ignore` with `@ts-expect-error`
- Removed dynamic import of `localStorageManager` in `GameState` to avoid mixed import mode warning
- Moved Breeding HUD to the top-right under the menu bar
- Breeding HUD now toggles from a FishCard button instead of opening automatically
- ESLint now ignores `src/legacy/**` during cleanup
- Added unused variable audit notes
- Removed unused variables from `src/entities/fish.ts`
- Background config uses `unknown` for extra keys instead of `any`
- Tightened `FishManager` fish data typing and added a FishManager test
- Tightened fish storage typing and added a fishStorage test
- Creature type index signatures now use `unknown` instead of `any`
- GameState fishCollection typing tightened and new GameState test added
- Tightened spawn-to-tank bio data typing to avoid `any`
- Tightened localStorageManager fish data and serialization typing to avoid `any`
- Replaced remaining explicit `any` usage in FishCollection, fish entity logic, BackupManager, validator, and tests
- Updated ActiveFiles core/audio/legacy entries and persistence overview to match current code and plans
- Updated ActiveFiles entities/rendering/creatures/UI/config/utilities sections for current active files
- Added missing active legacy/state files to ActiveFiles list
- Marked spawn-to-tank UI control as planned (not wired yet) in ActiveFiles
- Added legacy methods/functions inventory to docs
- Marked legacy methods/functions as used/internal in docs/LegMethFunc.txt
- Removed unused stubs `src/audio/bus.ts` and `src/creatures/registry.ts`
- Labeled docs with current vs planned status and updated doc notes (Architecture, Development, Tooling, UsageMap, FileStructure, design notes)
- Verified `npm test` and `npm run build` after cleanup changes
- Added bioInventory naming plan to planning docs
- Confirmed bioInventory direction and persistence path in TODO
- Added TODOs for duplication cleanup (collection CRUD, validation, UI storage fallbacks, e2e key)
- Updated e2e fish collection tests to use `caroles_reef_save_data`
- Added backup export/restore tests to validate fish data normalization and defaults
- Made topbar opaque and aligned to the top; constrained fish movement below the menu bar
- Mating target selection now respects opposite sex and drops stale mate targets
- Load saved fish from localStorage on startup; only seed 10 fish when no saved data exists
- Restore only live tank fish on reload (collection stays in storage)
- Fish movement bounds now refresh when the window is resized
- Collection view now includes fish sex
- Persist live tank snapshot (including non-collection fish) and flush on exit/reload
- Bumped app version to 0.1.5
- Added changelog formatter to enforce heading spacing rules
- Removed deprecated husky bootstrap lines from .husky/pre-commit

## [0.1.4] - 2025-12-25
### Fixed
- Centralized fish collection persistence through `GameState.save()` and `localStorageManager`
- Removed direct localStorage access from `FishCollection` in active code path
- Added validation for `fishCollection` entries and normalized top-level trait fields (senseGene, finShape, patternType, eyeType, colorHue)
- Clamped senseGene to 1-9 and removed legacy senseRadius after validation
- **Notification System**
  - Fixed issue requiring multiple confirmation clicks when deleting fish from the collection view
  - Resolved duplicate notification messages when renaming fish by pressing Enter
  - Replaced `showNotification` method with direct `toast` function calls for more reliable notifications
  - Improved notification consistency and error handling throughout the FishCollection class - other places in the codebase will still need to be updated to use toast
- Added inline notes clarifying persistence path in FishCollection updates
- Removed legacy migration checklist file `check.txt`
- Clarified Issue #10 scope and captured GameState source-of-truth decision in TODO
- Added throttled GameState save interval and routed collection updates through GameState
- Updated fishStorage helpers to update GameState instead of mutating storage clones
- Updated legacy FishCard name save to update GameState instead of mutating storage clones
- Removed archived FishCollection variants (`.old`, `.0829_*`, `-tooMuchWorkDoneBroken`)
- Documented full scan results for GameState/FishManager/globals/localStorage usage
- Removed duplicate “Save to Collection” toasts by relying on FishCollection feedback
- Ensured fish spawned from collection carry `originalId` so renames sync to collection
- Updated default collection name to `NEW` and allowed FishCard renames to sync without `originalId`
- Allowed FishCard rename input to save on Enter
- Fixed spawn-from-collection to add fish to tank via `addFishToTank`
- Preserved saved fish IDs when spawning from collection
- Normalized fish data on save/spawn so senseGene is consistent across UI
- Ensured backup/restore normalizes senseRadius to senseGene (tests added)
- Preserved gene-style stats/appearance when restoring legacy fish without genes and applied senseRadius < 10 conversion (tests added)
- Prevented spawning duplicate fish from collection and synced tank/FishCard names when collection renames occur
- Synced release actions with GameState tank tracking to avoid stale in-tank IDs
- Spawn duplicate check now uses live tank fish list to avoid stale “already in tank” messages after reload
- Dead fish now remove from the live tank list when they float off-screen
- Re-enabled pellet detection and eating so fish respond to feed key
- Mating logic now scans live tank fish and respects canMate so fish seek partners again
- Ritual partner lookup now uses live tank fish, avoiding a static target from saved data
- Added a Breeding HUD showing live mating stats for the selected fish
- Mating/ritual logic now uses the local tank fish array instead of window globals
- Breeding HUD now shows tank capacity gate and time-to-adult when not adult
- Fixed duplicate tankFish declaration in mate-seeking logic
- Clarified runtime source-of-truth: GameState in RAM, localStorage on startup, Backup/Restore for offline import/export
- Audited in-memory clone paths; no remaining updates that skip persistence
- Re-checked invalid trait normalization (senseRadius -> senseGene, finShape) across load/save/backup paths
- Centralized UI version display via `GAME_CONFIG`
- UI version now sourced from `package.json` via Vite define
- Bumped app version to 0.1.4
- Added `deploy:prod` script to run tests, build, and `scripts/deploy.sh`
- Documented GameState as the single runtime source of truth for Issue #10

## [0.1.3] - 2025-08-24
### Added
- Added new issue templates
- Added auto-assignment and labeling for issues/PRs
### Fixed
- Resolved multiple confirmation clicks when removing fish from the collection view (#9)
- Updated semantic-release configuration to handle versioning correctly
- Updated sed command for semantic-release to handle single quotes
- Updated sed command to be cross-platform compatible
### Changed
- Bumped project version to 0.1.3
- CI: made lint/typecheck/test non-blocking and split linting from tests
- CI: updated actions/upload-artifact to v4
- Build: added @semantic-release/exec dev dependency

## [0.1.2] - 2025-08-23
### Fixed
- Fish tails "finShape" was not drawn in a noticeable difference, so we updated the valid finShapes to be ['pointy', 'round', 'fan', 'forked', 'lunate'] (deprecating 'long') and tweaked the look of each
- **Fish Validation**
  - Fixed invalid fin shapes (like 'long') being set to 'fan' by default
  - Added automatic validation when adding fish from collection
  - Ensured corrected fin shapes are saved back to localStorage

## [0.1.1] - 2025-08-22
### Changed
- **Project Structure**
  - Moved `style.css` to `src/styles/` for better organization
  - Relocated deployment scripts to `scripts/` directory
  - Updated file references to maintain functionality
  - Cleaned up root directory by removing unnecessary files and moving some to proper subdirs
  - Updated `.gitignore` to properly handle moved files
  - Added the new background music (track 02) - from suno.ai

## [0.1.0] - 2025-08-22
### Added
- **Creature Validation System**
  - Added trait range validation for all creature attributes
  - Automatic correction of out-of-range values when loading from storage
  - Per-species trait range definitions (e.g., size, speedGene, senseGene)
  - Persistent storage of corrected values to prevent repeated corrections
  - Support for default values when traits are missing
- Enhanced fish collection table with sortable columns
  - Added sorting functionality for Name, ID, Age, Size, Speed, Sense, Hue, Fins, and Pattern columns
  - Visual indicators (↑↓) show current sort column and direction
  - Clicking the same column toggles between ascending and descending order
### Fixed
- **Data Integrity**
  - Fixed potential data corruption by validating all creature attributes on load
  - Ensured all numeric traits stay within defined ranges
  - Added automatic correction of invalid position and size values
  - Improved error handling for malformed creature data
- Fixed speed column sorting in fish collection
  - Improved handling of numeric values for consistent sorting
  - Added debug logging for troubleshooting sorting issues
  - Ensured proper type conversion for all sortable fields
  - Added fallback mechanisms for missing or invalid data
- Had to make some changes to deploy.sh as we moved sensitive data to .env and then deploy.sh started to complain about noEmitOnError.. should be working now.
### Changed
- Commented out two lines in src/entities/fish.ts that call fishCollection.refreshCollection() because (for now) we do not want entire View Collection window to redraw and reposition at the top of the list when a fish is added to the tank. These two lines have FIXME, and will eventually need to get fixed so that the VCw does get dynamically updated when fish info changes and the VCw is open
- "Caroles_Reef" had been planned as 3D, and this 2D version was to do a quick-start to show the basic potential of the game. Since then I've decided this 2D version will be the main focus, and PERHAPS a 3D version may come later... but at this point I want the "Caroles_Reef" name and ID to point to the 2D version locally and on GitHub, and we will have a Caroles_Reef-3D if that ever comes about. So I've changed the GitHub repo for this project to https://github.com/david-slimp/Caroles_Reef.git

## [0.0.8] - 2025-08-15
### Fixed
- Fixed release button in FishCard to properly remove selected fish from the tank
  - Now correctly identifies and removes the selected fish instead of checking health
  - Properly cleans up fish tracking in tankFishIds
  - Ensures the fish card is properly closed after release
- Updated deployment script to skip strict type checking during builds
  - Added `--noEmitOnError false` flag to Vite build command
  - Increased Node.js memory limit to prevent OOM errors
  - Added comments for better maintainability

## [0.0.7] - 2025-08-15
### Fixed
- Fixed animation loop to prevent multiple concurrent frames
- Resolved background image flickering during rendering
- Improved canvas rendering performance
- Fixed potential memory leaks in the animation system
- Ensured proper cleanup of resources when switching views
### Changed
- Updated version number in the UI to 0.0.7
- Optimized draw cycle for smoother animations
- Improved error handling in the render pipeline

## [0.0.6] - 2025-08-13
### Added
- Background music system with separate volume control
  - Auto-play after user interaction
  - Smooth fade in/out transitions
  - Persistent mute state across sessions
- Enhanced audio controls in the UI
  - Separate volume sliders for music and sound effects
  - Visual feedback for mute states
  - Improved audio control styling
- Added background music track to enhance gameplay atmosphere
### Changed
- Refactored audio system for better maintainability
  - Separated music and sound effect channels
  - Improved error handling and logging
  - Better resource management
- Updated build configuration for proper asset handling
  - Fixed public directory structure
  - Improved production build settings
  - Better handling of static assets
### Fixed
- Fixed audio loading in production builds
- Resolved issues with audio playback on mobile devices
- Addressed potential memory leaks in audio management

## [0.0.5] - 2025-08-12
### Added
- Sound effects system with volume control
  - Joyful "YIPPIE!" sound when new fish are born
  - water-plnk sound when fish are released
- Mute button in the toolbar
- Volume control for sound effects
- Smooth fade-out effects for audio
- Added Class_Family_Species_Variety.txt file (CFSV) for upcoming creature classifications
### Changed
- Updated FishCard UI with new Release button
- Improved UI layering and z-index handling
- Enhanced toast notifications with better styling
- Updated audio system to support muting and volume control

## [0.0.4] - 2025-08-12
### Added
- New visual themes: 'sunset', 'super-night', 'mermaid-glow'
- Enhanced fish breeding mechanics:
  - Mating rituals with visual feedback
  - Newborn fish behavior with gentle drifting
  - Visual improvements for breeding pairs
- Debug visualizations for fish sensing radius and food attraction
- TypeScript type definitions and interfaces
### Changed
- Started migration of codebase from JavaScript to TypeScript
- Refactored code into modular structure under `src/` directory
- Slowed down food pellet falling speed (40-70px/s → 20-50px/s)
- Increased fish speed and turn speed during food seeking
- Improved fish movement and pathfinding:
  - State-based movement behaviors
  - Smoother turning and acceleration
  - Better obstacle avoidance
- Enhanced fish selection visual feedback
### Technical Improvements
- Implemented environment-based dependency injection
- Separated concerns (rendering, game logic, state management)
- Added proper TypeScript types and interfaces
- Improved code organization and maintainability

## [0.0.3] - 2025-08-11
### Added
- Split single HTML file into modular structure (index.html, style.css, main.js)
- Set up development tooling:
  - TypeScript configuration
  - Vite build system
  - Vitest for testing
  - ESLint and Prettier for code quality
  - Husky for git hooks
  - GitHub Actions CI/CD workflow
- Added TypeScript support and basic project scaffolding
- Set up documentation structure
- Set up scaffolding for TS migration under src/ dir
### Changed
- Updated project structure to be more modular and maintainable
- Improved development workflow with better tooling
- Prepared codebase for TypeScript migration

## [0.0.2] - 2025-08-11
### Added
- Documentation for decor effects in code comments
- Favorite Fish feature with star toggle
- Visual selection indicator (green circle) for selected fish
- Improved star button visibility and interaction in fish card
### Changed
- Increased fish speed gene multipliers for more noticeable speed differences
  - Base speed multiplier increased from 6x to 10x
  - Target-seeking speed multiplier increased from 0.1 to 0.15
  - Wandering speed multiplier increased from 0.04 to 0.06
- Removed age restriction on fish dragging - all fish can now be moved regardless of age
- Modified click behavior - left click no longer drops food pellets (only 'F' key does this now)
- Improved code readability in drag handling
- Updated the README.md for players
### Fixed
- Fish can now be dragged at any age, not just when young
- Removed redundant food pellet drop on click

## [0.0.1] - 2025-08-10
### Initial Release
### Added
- Default .gitignore
- LICENSE.txt - AGPL3
- Default README.md
- Caroles_Reef-2D.html - from chatGPT-5 one-shot prompt
### Changed
- CHANGELOG.md
### Fixed
### Known Issues
- Need to create PRD.md, MVP.md and dev_notes.txt
