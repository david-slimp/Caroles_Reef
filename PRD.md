# Product Requirements Document (PRD)
## Carole's Reef - A 3D Virtual Aquarium Experience

## Project Overview
**GitHub Repository:** [https://github.com/david-slimp/Caroles_Reef](https://github.com/david-slimp/Caroles_Reef)

### Vision Statement
Create a calming, immersive 3D aquarium experience where users can enjoy a virtual reef ecosystem, interact with fish, and discover the beauty of underwater life through a relaxing and engaging interface.

## Core Features

### 1. 3D Virtual Aquarium
- Interactive 3D environment with realistic water effects
- Dynamic lighting that simulates day/night cycles
- Multiple camera angles and zoom levels

### 2. Fish and Marine Life
- Various species of fish with unique behaviors and animations
- Fish genetics system for breeding and trait inheritance
- Interactive behaviors (feeding, following, etc.)

### 3. Customization
- Tank decorations and themes
- Fish naming and tracking
- Environmental controls (lighting, water flow, etc.)

### 4. User Experience
- Intuitive controls and UI
- Calming ambient sounds and music
- Educational information about marine life

## Technical Specifications
- **Engine:** Three.js
- **Language:** TypeScript
- **Build Tool:** Vite
- **Version Control:** Git (GitHub)

## Development Phases
1. **Phase 1 (MVP):** Basic 3D environment with simple fish movement
2. **Phase 2:** Advanced fish behaviors and interactions
3. **Phase 3:** Breeding and genetics system
4. **Phase 4:** Enhanced customization and user experience

## Success Metrics
- Smooth performance (60 FPS on target devices)
- Positive user feedback on relaxation and engagement
- Growing community of users and contributors

## License
This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

---
*Last Updated: 2025-08-09*
# Carole’s Reef (Immersive 3D Saltwater Tank game))

> Calm, uplifting, and endlessly tinkerable: an immersive 3D reef where players gently interact with fish, breed for traits, and enjoy light companionship from occasional speech bubbles. Designed to be *simple first*, expandable later, and easy for older players to read and navigate.

---

## 0) Document Summary

* **Project**: Carole’s Reef (immersive 3D)  (starting with a very simple but generally complete ideas/concepts for MVP version 0.1.0)
* **Audience**: All ages; special care for older players (readability, simplicity, calm pace)
* **Platform**: Desktop web (Chrome/Edge/Firefox, recent versions)
* **Tech**: TypeScript, Three.js (3D), HTML/CSS UI, Howler.js (SFX), Vite (build/dev)
* **Persistence**: LocalStorage (manual Save via hamburger; auto-load on start)
* **Design Pillars**: Relaxation • Exploration • Discovery • Attachment • Simplicity • Expandability (data-driven content)
* **Notable Features**: Data-driven species & ornaments, occasional speech bubbles, autonomous breeding, “favorite” fish, whirlpool “trash” ornament, simple camera controls, clean UI with “Advanced” toggles

---

## 1) Goals & Non‑Goals

### 1.1 Goals

* Deliver an immersive 3D aquarium with a navigable camera (orbit/pan/zoom).
* Simple, low-pressure loop: watch, feed, move, breed, name, favorite, save.
* Data-driven content: **drop-in** JSON configs to add species/animals and ornaments without code changes.
* Fish AI in full 3D volume: steering, avoidance, sensing, hunger patrol, mating.
* Occasional uplifting speech bubbles (sparse; trait-driven).
* Accessibility for older players (large fonts, high-contrast mode, gentle motion).
* A VERY basic MVP (goal: v0.1.0) is the current main goal with small, manageable sprints to get there.

### 1.2 Non‑Goals (MVP)

* No multiplayer, trading, cloud saves.
* No complex environment simulation (temp, water chemistry).
* No disease or fish death systems.
* No heavy pathfinding or navmeshes (steering only).
* No monetization systems.

---

## 2) Player Experience & Core Loop

### 2.1 Experience Pillars

* **Relaxation**: soothing visuals and audio; nothing urgent.
* **Discovery**: genetic traits & phenotypes; babies inherit new combos.
* **Attachment**: naming, favoriting, occasional messages.
* **Simplicity**: minimal UI by default; “Advanced” toggles reveal more.

### 2.2 Core Loop

1. **Observe & Explore**: orbit/pan/zoom around the 3D tank.
2. **Interact**: click a fish, read its stat card, rename, star favorite; drag fish or ornaments.
3. **Care**: press **F** to drop food; hungry fish forage along the seabed.
4. **Discover**: fish breed autonomously; babies inherit traits with small mutation.
5. **Curate**: add random fish (UI button), remove via whirlpool, save tank, return later.

---

## 3) World & Camera

### 3.1 Tank Space

* **Bounds**: 3D rectangular volume, e.g., **Width 12m × Depth 7m × Height 5m** (tunable).
* **Floor**: sandy mesh with light normal map & subtle parallax caustics.
* **Back/Side Walls**: faint gradient & vignette; non-reflective (avoid visual clutter).
* **Center-Bottom Whirlpool**: small, animated ornament (see §10.4).

### 3.2 Camera Controls (MVP)

* **Orbit**: Left-drag to rotate around focal point (tank center by default).
* **Pan**: Right-drag (or middle-drag).
* **Zoom**: Mouse wheel (eased).
* **Focus Fish**: Double-click fish → gently zoom and re-center (accessibility).
* **Motion Safety**: Cap angular velocity; no snap pans; mild easing to reduce dizziness.

---

## 4) Controls & Input

* **Left Click**: Select fish or ornament (fish priority > ornaments).
* **Click-Hold & Drag**: Move selected fish (free placement) or drag ornaments (floor raycast snap).
* **F**: Drop one food pellet along mouse ray; if no surface hit, drop \~2.5m in front of camera.
* **Esc**: Deselect fish / close panels.
* **UI: Add Fish** (top-left): spawn one random adult animal in front of camera; says “Hi”.
* **UI: Hamburger** (bottom-right): Save, High Contrast toggle, Volume.

---

## 5) Entities & Data Model

> **Key principle**: almost nothing hardcoded. Species/animals and ornaments are loaded from **config files**.

### 5.1 Identifiers & Types

* **UUID** strings for instance IDs.
* **Species**: loaded from `/assets/species/*.json`.
* **Ornaments**: loaded from `/assets/ornaments/*.json`.

### 5.2 Fish / Animal (3D)

```ts
type UUID = string;
type Sex = "Male" | "Female";
type FishState = "IdleCruise" | "SeekFood" | "Eat" | "SeekMate" | "Mate" | "Dragged" | "ExitSeeking";

interface Vec3 { x:number; y:number; z:number }

interface Traits { // 0..9 unless noted
  metabolism: number; sense: number; speedPreferred: number; speedMax: number;
  prolific: number; schooling: number; talkativeness: number; happiness: number;
  spirituality: number; philosophy: number; explore: number;
  depthPreference?: number; // optional per-animal override 0..1 (bottom..top)
}

interface Phenotype {
  color: { r:number; g:number; b:number };
  pattern: "none"|"bars"|"spots"|"blaze";
  patternColor: { r:number; g:number; b:number };
  dorsalFin: "short"|"tall"|"swept";
  tailFin: "rounded"|"forked"|"lyrate";
  maxSizeMeters: number;       // used for scale and spacing
  bodyShape: "round"|"oval0"|"oval1"|"oval2";
  eyeSize: "small"|"medium"|"large";
  whiskers: boolean;
}

interface Fish {
  id: UUID;
  speciesId: string;           // e.g. "clownfish"
  sex: Sex;
  name: string;                // up to 20 ASCII keyboard chars
  favorite: boolean;

  // Time
  bornAt: number;              // epoch ms
  ageMinutes: number;          // computed each tick

  // Transform/Vel
  pos: Vec3;
  vel: Vec3;                   // m/s
  facing: Vec3;                // unit forward (for orientation)
  state: FishState;
  shyFactor: number;           // babies start at 1.0, decay to 0 over 2 min

  // Needs
  hunger: number;              // 0..100
  storedFood: number;          // abstract calories

  // Breeding
  nextBreedWindowStart: number;
  breedWindowActiveUntil: number;
  targetMateId?: UUID | null;
  isMating: boolean;
  mateSince?: number;

  // Speech
  nextSpeakAt: number;
  lastSaid?: string;

  // Lineage
  motherId?: UUID | null;
  fatherId?: UUID | null;

  // Traits & phenotype
  traits: Traits;
  phenotype: Phenotype;
}
```

### 5.3 Food Pellet

```ts
interface FoodPellet {
  id: UUID;
  pos: Vec3;
  vel: Vec3;                  // gravity-driven
  sizeMeters: number;         // small variance
  nutrition: number;          // calories (10..15 typical)
  onFloor: boolean;
}
```

### 5.4 Ornaments (includes Whirlpool)

```ts
interface Ornament {
  id: UUID;
  typeId: string;             // from ornament registry
  pos: Vec3;
  rotY: number;
  scale: number;
  movable: boolean;
  collisionRadius: number;    // meters
  avoidanceRadius: number;    // for fish steering
  behavior?: "whirlpool";     // MVP only behavior
}
```

### 5.5 Save Data (LocalStorage)

```ts
interface TankSettings { highContrast: boolean; audioVolume: number }

interface SaveDataV1 {
  version: 1;
  createdAt: number;
  updatedAt: number;
  fish: Fish[];
  ornaments: Ornament[];
  pellets: FoodPellet[];      // optional to persist
  settings: TankSettings;
}
```

---

## 6) Data-Driven Content (Registries)

### 6.1 Species/Animal Config (JSON)

* Location: `/assets/species/*.json`
* One JSON + one `.glb` (or `.gltf`) model (swim loop animation preferred).
* **Schema (MVP)**:

```json
{
  "id": "clownfish",
  "displayName": "Clownfish",
  "model": "clownfish.glb",
  "scale": 0.08,
  "sexRatio": 0.5,
  "baseTraits": {
    "metabolism": 5, "sense": 5, "speedPreferred": 5, "speedMax": 5,
    "prolific": 5, "schooling": 6, "talkativeness": 3,
    "happiness": 7, "joyfulness": 6, "spirituality": 0,
    "philosophy": 0, "explore": 4
  },
  "depthPreference": { "min": 0.4, "max": 0.8 },  // 0=bottom,1=surface
  "phenotypeDefaults": {
    "pattern": "bars", "dorsalFin": "short", "tailFin": "rounded",
    "maxSizeMeters": 0.26, "bodyShape": "oval1", "eyeSize": "medium",
    "whiskers": false
  },
  "colorRanges": {
    "base": { "r":[180,255], "g":[90,160], "b":[0,60] },
    "pattern": { "r":[200,255], "g":[200,255], "b":[200,255] }
  }
}
```

* **Adding a new animal** (e.g., seahorse, eel, starfish, shrimp, mermaid):

  * Drop JSON + model in directory → restart → registry loads automatically.
  * Non-fish “animals” still use the **Fish** structure for MVP; locomotion flags can vary by species later (e.g., hovering, crawling).

### 6.2 Ornament Config (JSON)

* Location: `/assets/ornaments/*.json`
* JSON + `.glb` (or simple primitive).
* **Schema (MVP)**:

```json
{
  "id": "coral_branch",
  "displayName": "Coral Branch",
  "model": "coral_branch.glb",
  "scale": 1.0,
  "movable": true,
  "collisionRadius": 0.4,
  "avoidanceRadius": 0.6,
  "behavior": null
}
```

* **Whirlpool** example:

```json
{
  "id": "whirlpool",
  "displayName": "Whirlpool",
  "model": "whirlpool.glb",
  "scale": 0.9,
  "movable": false,
  "collisionRadius": 0.6,
  "avoidanceRadius": 1.2,
  "behavior": "whirlpool"
}
```

### 6.3 Registry Loader

* On boot: scan species & ornaments folders → build registries.
* Validate JSON (basic schema); log & skip invalid entries.
* Dev mode: hot-reload on file change (optional).

---

## 7) Systems (3D)

### 7.1 Selection & Dragging

* **Select**: raycast to animals first, ornaments second; highlight selected (soft glow).
* **Drag fish**: attach to mouse ray at current depth (clamp to tank bounds). On release, AI resumes.
* **Drag ornaments**: raycast to floor plane; snap and clamp within bounds.

### 7.2 Movement & Steering (3D)

* **States**: see FishState enum.
* **IdleCruise**:

  * Maintain **preferred speed** with slight noise.
  * Wander steering (Perlin/random) with gentle yaw/pitch adjustments.
  * Keep within **species depth band** (`depthPreference.min/max`) or trait override.
* **Avoidance**:

  * Steering away from ornaments (use `avoidanceRadius`) and whirlpool.
  * Light inter-animal separation (min distance based on size).
* **Schooling (light)**:

  * If trait ≥6: cohesion/align towards nearby conspecifics within \~2m radius.
* **Bounds**:

  * If nearing tank walls/floor/ceiling, steer gently back inside.

### 7.3 Speed

* **Preferred**:

  * Species base mapped by `traits.speedPreferred` (e.g., clownfish 0.25–0.5 m/s).
* **Max**:

  * Mapped by `traits.speedMax` (e.g., clownfish 0.6–1.2 m/s).
* **Hunger override**:

  * If `hunger ≥ 85`, use **max speed**.

### 7.4 Sensing (Sphere)

* **Sense radius** = map(traits.sense, 0..9 → **1.0..3.5m**).
* Ray/line-of-sight not required for MVP; distance check only.

### 7.5 Hunger & Food

* **Pellets**:

  * Gravity \~9.8 m/s² scaled for feel; slight lateral drift.
  * Settle on floor; persist until eaten.
* **Hunger**:

  * Increases slowly over time (e.g., +0.05 / sec).
  * StoredFood reduces hunger using **metabolism**:

    * convert per sec = map(metabolism 0..9 → 0.05..0.25)
    * `storedFood -= convert*dt`
    * `hunger = max(0, hunger - convert*4*dt)`
* **Foraging (hungry)**:

  * If `hunger ≥ 60`: search pellets.
  * If `hunger ≥ 85`: patrol near floor across the entire seabed at max speed until food found.
  * Bite radius \~0.15 m; eat whole pellet; add `nutrition` to storedFood.

### 7.6 Breeding & Genetics

* **Age to breed**: 5 real-time minutes.
* **Windows**: 10s windows; interval `(10 - prolific) × 2` minutes (0 = never).
* **Mate search**: within sense radius; opposite sex; both in window.
* **Mating**: both swim **at max speed**; overlap for 5s; spawn **1–5** babies at location.
* **Babies**:

  * Size \~2 cm; `shyFactor` = 1 → decays to 0 over 2 minutes; during shy, cap speed to ≤40% preferred.
  * Sex 50/50.
* **Inheritance**:

  * Continuous 0..9 traits = average of parents ± up to 5% of the 0..9 range (±0..0.45), clamped.
  * Categorical (pattern/fins/body/eye/whiskers): 45% mother, 45% father, 10% random mutation.
  * Color (RGB) = channel-wise average + jitter (±8), clamped 0..255.
  * Max size meters = average ±5% jitter, clamped to species bounds.

### 7.7 Personality & Speech Bubbles

* **Talkativeness** maps to mean interval μ (minutes):

  * 0 → 20m, 5 → 7.5m, 9 → 1.5m
* Schedule `nextSpeakAt` using random interval (exponential or uniform 0.5μ..1.5μ).
* **Global bubble cooldown**: max one new bubble every **5s** across the tank.
* **MVP content**:

  * On spawn (via Add Fish): **“Hi”** (1.2–1.8s).
  * Ambient (rare): **“cool tank”** (1.5–2.0s).
* Future categories (weights scaffolded; disabled in MVP): “happy”, “fun fish”, “pick me”, “hungry” (hunger>70), joyful/spiritual/philosophical snippets.

### 7.8 Aging & Exit

* Real-time minutes.
* If `age ≥ 360` and **not favorite**:

  * Switch to `ExitSeeking`: path toward **whirlpool** and despawn upon entry.
* **Favorites** ignore exit rule.

### 7.9 Whirlpool Behavior

* At center-bottom.
* **Avoidance**: normal fish avoid within `avoidanceRadius` except during ExitSeeking (or when dragged).
* **Deletion**: any dragged animal or ornament dropped into the **collisionRadius** despawns (confirm dialog if favorite).
* Visual: subtle spiral water effect, small footprint; soft whoosh SFX on delete.

---

## 8) UI / UX

### 8.1 Layout

* **Top-left**: “Add Fish” button.
* **Lower-left**: **Stat Card** (visible only when a fish is selected).
* **Above Fish**: Name tag + favorite star (if set); occasional speech bubbles.
* **Bottom-right**: **Hamburger** (Save, High Contrast, Volume).
* **Toasts**: unobtrusive bottom-center messages (e.g., “Tank saved”).
* **First-time hints**: small guide: “Left-drag to orbit • F to drop food • Click a fish for stats”.

### 8.2 Stat Card (simple by default)

* **Header**: species icon, editable **Name** (20 chars), Favorite star toggle.
* **Vitals**: Age (mm\:ss), Sex, Parents (names or “—”).
* **Needs**: Hunger bar (0..100), Stored Food bar.
* **Traits**: Compact **sliders** (0–9 ticks) for: metabolism, sense, speedPreferred, speedMax, prolific, schooling, talkativeness, happiness, joyfulness, spirituality, philosophy, explore.

  * **Advanced toggle**: show exact numeric values (e.g., “7.2”) and depth preference.
* **Physical**: icon chips (body shape, dorsal/tail fin) + swatches (base color/pattern color).

  * **Advanced**: RGB fields, max size meters, whiskers flag.
* **Close (X)** button.

### 8.3 Accessibility

* Large fonts (base 18px; panel 18–20px).
* High-contrast mode (thicker outlines, darker text stroke).
* Gentle animations; no rapid flashing.
* Focus Fish (double-click) for quick navigation.
* Optional tooltip hints on hover (can be disabled later).

---

## 9) Audio

* **SFX**: food drop, mating success (subtle shimmer), save confirm.
* **Volume**: 0..1; default 0.5.
* **No looping ambient** in MVP (option to add ocean hum later).

---

## 10) Content & Initial Balancing

### 10.1 MVP Animals (via configs)

* **Clownfish**, **Boxfish**, **Tang**

  * Distinguish by body shape, patterns, size range, speed profiles.
  * All with a basic swim loop (simple skeletal/morph or procedural fin sway).

### 10.2 MVP Ornaments

* **Coral Branch**, **Coral Boulder**, **Coral Fan** (movable).
* **Whirlpool** (center-bottom, not movable).

### 10.3 Global Caps

* **Max animals**: 60 (show toast “Tank is full” when reached).
* **Max pellets**: 120 (delete oldest floor pellets beyond cap).

### 10.4 Whirlpool Specs

* Position: `(0, floor + 0.1m, 0)` tank center.
* `collisionRadius`: \~0.6 m; `avoidanceRadius`: \~1.2 m.
* Visual: small spiral particles, subtle distortion; SFX on delete.

---

## 11) Persistence

* **Save**: Hamburger → Save → write `SaveDataV1` to LocalStorage key `carolesreef.save.v1`.
* **Auto-load**: On startup, if save exists and `version===1`, load; otherwise seed defaults.
* **Favorites** persist, protecting against age-based exit.

---

## 12) Technical Architecture (TypeScript)

> Small-file-first, modular, and data-driven. Keep files ≤200 LoC; split when needed.

### 12.1 Directory Layout

```
src/
  app/               # bootstrapping, DI, config
  engine/            # loop, time, renderer, camera, raycasts
  content/           # registries + JSON loaders (species, ornaments)
  game/
    model/           # interfaces (fish, traits, phenotype, ornaments, save)
    systems/         # ai, movement, hunger, breeding, genetics, speech, food, exit
    ui/              # stat card, hud, name tags, bubbles overlay
  platform/          # storage, audio
  assets/            # .glb/.json (loaded at runtime)
  styles/
```

### 12.2 Key Modules

* **Renderer3D**: Three.js scene/camera/lights; add/update/remove meshes.
* **Camera**: orbit/pan/zoom, focus fish, easing limits.
* **Raycaster**: project mouse to 3D for selection/drag/food placement.
* **Content Registries**:

  * `SpeciesRegistry` (load & validate JSON; expose base trait/phenotype ranges & models).
  * `OrnamentRegistry` (load & validate JSON; expose behaviors like whirlpool).
* **Systems** (pure-ish):

  * `movement`, `hunger`, `food`, `breeding`, `genetics`, `speech`, `exit`, `selection`.
* **UI**:

  * `statCard`, `hud`, `nameTag`, `speechBubbles` (2D overlay canvas or DOM).
* **Storage**: load/save adapters.

### 12.3 Update Order (per frame)

1. Input (raycasts, clicks, drags).
2. Food pellets (physics/gravity/floor settle).
3. Hunger & storedFood processing.
4. Breeding windows update/activation.
5. AI state selection (seek food/mate/exit, or idle).
6. Steering & movement integration; bounds & avoidance.
7. Mating overlap checks; spawn babies.
8. Speech scheduler; respect global cooldown; emit bubbles.
9. Whirlpool deletion & age-based exits.
10. Renderer sync (positions, rotations, visibility).
11. UI sync (stat card values; name tag anchors).

---

## 13) Algorithms & Tunables

* **Sense radius**: `lerp(1.0, 3.5, sense/9)`.
* **Talk interval mean μ (min)**: `lerp(20, 1.5, talkativeness/9)`.
* **Preferred speed**: species range mapped by `speedPreferred` with ±10% jitter.
* **Max speed**: species range mapped by `speedMax`.
* **Breeding**:

  * Interval minutes: `(10 - prolific) * 2` (0 → never).
  * Window: 10s; requires both animals in-window & opposite sex & within sense range.
* **Mating overlap**: distance threshold = `min(sizeA, sizeB) * 0.6`; sustain 5s → spawn 1–5 babies.
* **Babies shy**: cap speed ≤0.4× preferred; linear decay to normal over 120s.
* **Hunger patrol**: if `hunger ≥ 85`, aim near floor (y ≈ floor+0.1–0.3m) and sweep across seabed.

---

## 14) Art & Asset Guidelines

* **Scale**: 1 unit = 1 meter.
* **Poly budget** (per animal): 1–4k tris (MVP); aim low for 60 animals.
* **Textures**: 512–1024 px albedo; keep count low; prefer baked color masks for tinting.
* **Animation**: simple swim loop (1–2 clips) or shader-based fin sway; minimal bones.
* **Ornaments**: static meshes except whirlpool (particle/vertex animation).
* **Color/Readability**: avoid low-contrast combos; use subtle outline or rim-light for silhouettes.

---

## 15) Audio Guidelines

* Short, soft SFX: -12 to -9 dBFS peaks; no harsh highs.
* Respect volume setting; allow mute.
* No voice lines in MVP.

---

## 16) Accessibility

* Base font 18px; panel labels 18–20px.
* High-contrast mode toggle (UI + text strokes + bubble outlines).
* Gentle camera easing; avoid quick snaps.
* Option: reduce bubble frequency (future).
* Double-click to focus fish to reduce manual camera work.

---

## 17) QA Acceptance Criteria (MVP)

1. **Camera**: orbit/pan/zoom works smoothly; double-click focuses fish.
2. **Selection**: clicking a fish opens stat card; highlight ring visible.
3. **Drag**: fish and movable ornaments can be dragged; release resumes AI.
4. **Food**: **F** drops pellet along mouse ray; pellets fall and rest on floor.
5. **Hunger**: hungry fish seek pellets; at `≥85`, patrol seabed at max speed.
6. **Breeding**: adults (≥5m) enter 10s windows on correct intervals; eligible pairs meet, overlap 5s, spawn 1–5 babies; babies start shy and normalize in 2m.
7. **Speech**: newly added animal says “Hi”; occasional “cool tank”; global 5s cooldown enforced.
8. **Whirlpool**: at center-bottom; non-exiting fish avoid; old non-favorites path to it and despawn upon entry; dragging any entity into it deletes (confirm for favorites).
9. **Favorites**: favorite fish ignore age exit; star appears next to name.
10. **Save/Load**: Save writes LocalStorage; reload restores animals, ornaments, including favorites and names.
11. **Caps**: enforce max animals and pellets; show “Tank is full” when blocked.

---

## 18) Risks & Mitigations

* **Too chatty**: global 5s cooldown + long mean intervals from talkativeness.
* **Performance**: low-poly meshes, pooled objects, simple steering (no navmesh), cap entities.
* **UI overload**: default minimal; “Advanced” reveals details.
* **Motion sickness**: gentle camera easing, capped speeds, no sudden jumps.

---

## 19) Roadmap Beyond MVP (not in this build)

* Additional animals (seahorse, eel, shrimp, mermaid, starfish) via configs.
* Behavior flags per species (hovering, crawling, clinging).
* Mood system tying happiness/joyfulness to colors/behaviors.
* Scripture/philosophy message packs with configurable filters.
* Photo mode; shareable snapshots.
* Tank presets, lighting themes, day/night cycle.
* Cloud saves; fish trading.
* Achievements; trait collection album.

---

## 20) Implementation Checklist

* [ ] Vite + TS + ESLint + Prettier scaffold
* [ ] Three.js scene, lights, tank bounds, floor & backdrop
* [ ] Camera controls (orbit/pan/zoom, focus fish)
* [ ] Content registries + JSON loaders (species, ornaments) with validation
* [ ] Models & types (animal, traits, phenotype, ornament, food, save)
* [ ] Ornaments: spawn coral x3 and whirlpool at center-bottom
* [ ] Selection & dragging (raycast, floor snapping)
* [ ] Food pellets (3D gravity, drift, floor settle); F key input
* [ ] Hunger & storedFood processing
* [ ] Steering & movement (wander, avoidance, bounds, schooling light)
* [ ] Breeding windows, seeking, overlap, baby spawn, shy decay
* [ ] Speech scheduler (“Hi”, “cool tank”, global cooldown)
* [ ] Stat card UI with sliders + Advanced toggle; name edit + favorite toggle
* [ ] Name tags & speech bubbles overlay
* [ ] Whirlpool behavior (avoidance, deletion, exit seeking)
* [ ] Save/Load to LocalStorage; auto-load on boot
* [ ] Caps & toasts; accessibility pass; QA vs criteria

---

## 21) Open Assumptions (OK to revise later)

* Animated `.glb` for animals (simple swim); if unavailable, fallback to shader sway.
* Sense radius ignores occlusion (no line-of-sight).
* Babies share parents’ speciesId (no hybrid species in MVP).
* Depth preference per species; optional per-fish override.

---

## 22) Example JSONs

### 22.1 Tang (species)

```json
{
  "id": "tang",
  "displayName": "Tang",
  "model": "tang.glb",
  "scale": 0.1,
  "sexRatio": 0.5,
  "baseTraits": {
    "metabolism": 6, "sense": 6, "speedPreferred": 6, "speedMax": 7,
    "prolific": 5, "schooling": 5, "talkativeness": 2,
    "happiness": 6, "joyfulness": 5, "spirituality": 0,
    "philosophy": 0, "explore": 6
  },
  "depthPreference": { "min": 0.35, "max": 0.75 },
  "phenotypeDefaults": {
    "pattern": "blaze", "dorsalFin": "tall", "tailFin": "forked",
    "maxSizeMeters": 0.34, "bodyShape": "oval2", "eyeSize": "medium", "whiskers": false
  },
  "colorRanges": {
    "base": { "r":[40,80], "g":[90,180], "b":[180,255] },
    "pattern": { "r":[220,255], "g":[220,255], "b":[220,255] }
  }
}
```

### 22.2 Whirlpool (ornament)

```json
{
  "id": "whirlpool",
  "displayName": "Whirlpool",
  "model": "whirlpool.glb",
  "scale": 0.9,
  "movable": false,
  "collisionRadius": 0.6,
  "avoidanceRadius": 1.2,
  "behavior": "whirlpool"
}
```

---

## 23) Test Plan (high level)

* **Unit**: trait mapping, talk interval scheduling, breeding intervals, mutation clamps.
* **Integration**: AI state transitions; mating overlap timer; shy decay; whirlpool deletion.
* **E2E**: start → add fish (says “Hi”) → select & rename → drop food (fish eats) → save → reload → state restored.
* **Performance**: 60 animals cruising at ≥50–60 FPS on midrange desktop (1080p).

---

That’s the complete, implementation-ready PRD for the immersive 3D MVP of **Carole’s Reef**. If you’d like, I can now generate the **starter repo files** (Vite + TS), the **registry loaders**, and a **tiny scene** that spawns the whirlpool, three coral pieces, and a single clownfish model placeholder so your team can `npm run dev` and immediately orbit around the tank.
