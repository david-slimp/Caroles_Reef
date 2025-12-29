# New Inventory Modal (Advanced Collection View)

Status: Planning document for a full-screen inventory modal with filter presets, per-column filters, and column layout controls.

## Goals

- Replace the current View Collection panel with a full-screen modal.
- Display **all creature characteristics** (genes, visuals, demographics, flags).
- Provide advanced, per-column filtering with live updates.
- Allow column show/hide and reordering.
- Support saved filter/layout presets (default preset: "All").
- Keep interaction consistent with current sorting behavior.

## Non-Goals (for initial iteration)

- Full refactor away from legacy runtime.
- Cross-species filtering logic beyond fish (prepare hooks but do not re-architect).
- Complex AND/OR groups (explicitly out of scope; presets handle alternate views).

## Implementation Safety (Parallel UI)

- Short-term approach: duplicate the current View Collection implementation and build the new modal from the copy.
- Keep the existing "View Collection" button and behavior intact during development.
- Add a new topbar button (working title: "New Collection") that opens the new modal.
- Once the new modal is complete and validated, remove the old button and legacy panel code.

## Definitions

- **Modal**: Full-screen overlay that blocks interaction with the tank and other UI.
- **Preset**: Saved configuration of filter rules + column visibility + column order + sort.

## User Experience Overview

### Entry

- Add a new top bar button (working title: "New Collection") to open the new modal.
- Keep the existing "View Collection" button unchanged during parallel development.
- Modal covers full viewport; background interaction is disabled.
- Close actions: explicit close button (top-right) and `Esc`.

### Layout

```
┌────────────────────────────────────────────────────────────┐
│ Inventory Modal Header                                     │
│ [Preset ▼] [Save Preset] [Rename] [Delete]    [Close ✕]    │
├────────────────────────────────────────────────────────────┤
│ Filter Drawer (contextual)                                 │
│ (appears when clicking an "f" next to a column header)     │
├────────────────────────────────────────────────────────────┤
│ Column Controls Row                                        │
│ (optional: hide/unhide buttons per column)                 │
├────────────────────────────────────────────────────────────┤
│ Data Table (sortable, reorderable columns)                 │
└────────────────────────────────────────────────────────────┘
```

### Table Behavior

- Column headers clickable for sort (ascending/descending), same as current.
- Each column header has:
  - `f` filter button (opens filter panel for that column)
  - hide/unhide button (with tooltip label)
  - drag handle for column reordering

## Data Requirements

### Required Columns (initial full set)

- Identity: `name`, `id`, `species`, `originalId` (if present)
- Demographics: `sex`, `age`, `size`, `maxSize`
- Genes (0–9): `speed`, `senseGene`, `hungerDrive`, `constitution`, `rarityGene`
- Visuals: `colorHue` (with swatch), `patternType`, `finShape`, `eyeType`
- Flags: `favorite`, `shiny`, `dead` (if relevant), `state`
- Position: `x`, `y` (optional; could be hidden by default)
- Timing: `birthTime`, `lastSaved` (collection save)

Note: These map to current fish data + genes. Any missing values should be handled gracefully (display `—` or default).

### Default Column Visibility and Order

- All columns visible by default.
- Initial left-to-right order starts with `name`, `sex`, `age`, `size`, then gene traits, then visuals, then remaining fields.
- Horizontal scrolling is acceptable for the full-width table (bottom scrollbar).

### Preset Data Shape (proposal)

```
type InventoryPreset = {
  id: string;
  name: string;
  isDefault?: boolean; // "All"
  filters: Record<string, FilterRule>;
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  sort: { column: string; direction: 'asc' | 'desc' } | null;
};
```

## Filter System

### General Rules

- Default preset "All": no filters, all columns visible (or sensible defaults).
- Filters are **inclusive by default** (green means show).
- Toggling a value to red means **exclude** those items.
- Filters apply immediately (live update). If too heavy, add an "Apply" button.
- All filters are combined with **AND** (only items matching all active include/exclude rules are shown).

### Filter Types

1. **Text Search** (global or per-column)
   - Columns: `name`, `id`
   - Behavior: contains match, case-insensitive.

2. **Discrete Enum Filters**
   - Examples: `sex`, `patternType`, `finShape`, `eyeType`
   - UI: list of toggles (green = include, red = exclude)

3. **Numeric Range Filters**
   - Genes (0–9): grid toggle (0–9)
   - Age/Size: min/max sliders or number inputs

4. **Boolean Filters**
   - `favorite`, `shiny`
   - UI: include/exclude toggles or tri-state (any/only true/only false)

### Filter UI Examples

#### Sex Filter

- Buttons: `Male`, `Female`
- Both green = show all
- Toggle to red = exclude that sex

#### Gene Filter (0–9)

- UI as 2x5 or 5x2 grid
- Each number is a toggle
- Green = include, red = exclude

#### Pattern Filter

- List: `solid`, `gradient`, `spots`, `stripes`
- Same green/red toggle behavior

## Column Controls

- **Hide/Unhide** button on each header
  - Tooltip: column name
  - Hidden columns are still filterable via preset settings
- **Reorder** via drag handle on header
  - Save order into preset

## Preset Management

- Preset dropdown (top-left) with default "All"
- Save preset:
  - User enters name
  - Saved to GameState (new field: `inventoryPresets`)
- Default preset:
  - "All" cannot be deleted
  - Always available, resets filters/columns/sort
- Delete preset:
  - Removes the selected preset (except "All")

## Storage Integration

- Presets stored in GameState
- Saved via `gameState.updateState(...)` and persisted through `localStorageManager`
- Consider `inventoryPresets` and `selectedInventoryPresetId` fields
- Include presets in backup/restore JSON

## Migration / Legacy Considerations

- Current `FishCollection` is active but tied into legacy runtime.
- This feature can be built on the existing module without full refactor.
- New filtering logic should be isolated (helper functions) to ease future migrations.

## Implementation Plan (Phased)

### Phase 1: Modal Shell + Full-Screen Layout

- Convert View Collection to full-screen modal
- Add close button + Esc handling
- Ensure background interaction disabled

### Phase 2: Columns + Full Data Display

- Expand table columns to include all traits
- Keep sorting working on new columns
- Add hide/unhide controls per column

### Phase 3: Filters UI + Live Filtering

- Add `f` button per column
- Implement filter panels for:
  - Sex
  - Genes (0–9)
  - Pattern/fin/eye
  - Name/ID text search
- Apply filters live to table rows (no apply step by default)

### Phase 4: Preset Save/Load

- Add preset dropdown + default "All"
- Add save/rename/reset actions
- Persist presets in GameState

### Phase 5: Column Reordering

- Drag handles for headers
- Save order to preset

## Open Questions

- Any additional columns you want pinned to the far left beyond `name`, `sex`, `age`, `size`?

## Acceptance Checklist (from Issue #14)

- Filter by at least 3 traits simultaneously
- Filters can be cleared/reset
- Results update live without reload
