// src/entities/fish.ts
// @ts-nocheck
import { playSound, Sounds } from '../utils/audio';
import { storageManager } from '../utils/localStorageManager';

// Sound effect for new fish births and death
const YIPPIE_SOUND = 'yippie.ogg';
const DEATH_SOUND = 'dead.mp3';

type Env = {
  getSize: () => { W: number; H: number };
  ctx: CanvasRenderingContext2D;
  pellets: any[];
  decors: any[];
  fish: any[];
  discovered: Set<string>;
  toast: (msg: string) => void;
  incGeneration: () => void;
  maxFish: number;
};

let env: Env;

export function configureFish(e: Env) { env = e; }

/* ---------------- utils ---------------- */
const rand  = (a, b) => Math.random() * (b - a) + a;
const randi = (a, b) => Math.floor(rand(a, b));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const chance = p => Math.random() < p;
const uuid = (() => { let i = 0; return () => (++i).toString(36) + '-' + Date.now().toString(36); })();

// normal(μ, σ) via Box–Muller
function gaussian(mean=0, sd=1){
  let u=0,v=0;
  while(u===0) u=Math.random();
  while(v===0) v=Math.random();
  const z = Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);
  return mean + sd*z;
}

/* ---------------- state helpers ---------------- */
function isCorpse(f:any){ return !!f.dead; }

function estimateCorpseArea(f:any){
  const bodyLen = clamp(f.size*2.2, 16, 140);
  const bodyHt  = clamp(f.size*1.2, 10, 80);
  return Math.PI * (bodyLen * 0.5) * (bodyHt * 0.5);
}

function killFish(f:any){
  if (f.favorite || f.dead) return;
  f.dead = true;
  f.state = 'dead';
  f._mateId = null;
  f._ritualTimer = 0;
  f._canMate = false; // block mating forever
  f._bites = f._bites || [];
  f._corpseArea = estimateCorpseArea(f); // used for despawn when eaten
  f.vx = 0;
  f.vy = -20; // gentle float up (~half slow pellet speed)ffffff
  playSound(DEATH_SOUND, { volume: 0.5 });
}

/* ---------------- legacy-ish data ---------------- */
const patterns = ['solid','stripes','spots','gradient'];
const fins = ['pointy', 'round', 'fan', 'forked', 'lunate'];
const eyes     = ['round','sleepy','sparkly','winking'];

/* ---------------- genetics helpers ---------------- */
function inheritNum(a,b){ return Math.random()<0.5? a : b; }
function mutateNum(v, mutationChance = 0.05){ 
  if(chance(mutationChance)) return clamp(v + (chance(0.5)?1:-1), 0, 9); 
  return v; 
}
function inheritList(a,b){ return Math.random()<0.5? a : b; }
function mutateHue(h, mutationChance = 0.05){ 
  if(chance(mutationChance)) return (h + randi(-20,21) + 360) % 360; 
  return h; 
}
function maybeShiny(rarityGene){ return chance(0.02 + rarityGene*0.002); }

/* ---------------- new gene knobs ---------------- */
const BREED = {
  MIN_AGE_SEC: 4*60,  // must be at least 4 minutes old
  MIN_SIZE_FRAC: 0.5, // and at least 50% of max size
};

const LIFE = {
  RISE_SPEED: 20,     // corpse float up speed (px/s)
  OFF_Y: -20,         // despawn when above this
};

const SIZE_GENE = {
  BIRTH_MIN: 1,
  BIRTH_MAX: 60,
  MAX_MIN:  20,
  MAX_MAX:  120,
  MUT_P: 0.10,
  MUT_STEP: 2,
};

function sampleConstitution(){ return Math.round(clamp(gaussian(5,2), 0, 9)); }
function computeMaxAgeSeconds(constitution:number){ return 60 + constitution * 120 + rand(-30, 30); }

function mutateSizeGene(v:number, min:number, max:number){
  if (chance(SIZE_GENE.MUT_P)) {
    const delta = chance(0.5) ? SIZE_GENE.MUT_STEP : -SIZE_GENE.MUT_STEP;
    return clamp(v + delta, min, max);
  }
  return v;
}
function inheritBirthSize(a:number,b:number){ return mutateSizeGene(inheritNum(a,b), SIZE_GENE.BIRTH_MIN, SIZE_GENE.BIRTH_MAX); }
function inheritMaxSize(a:number,b:number){ return mutateSizeGene(inheritNum(a,b), SIZE_GENE.MAX_MIN, SIZE_GENE.MAX_MAX); }

/* ---------------- environment helpers ---------------- */
function nearDecorType(x,y,type,rad){
  return env.decors.some(d => d.type===type && Math.hypot(d.x-x, d.y-y) <= (rad || d.r));
}
function removeFish(id){
  const idx = env.fish.findIndex(f=>f.id===id);
  if(idx>=0) env.fish.splice(idx,1);
}

/* ---------------- corpse bites ---------------- */
const CORPSE = {
  BITE_RADIUS: 2.5,   // ~5px diameter
  BITE_GROWTH: 1,     // size gain per bite
};

/* ---------------- public API ---------------- */
export function makeFish(opts = {}){
  const { W, H } = env.getSize();
  const id = uuid();

  const birthSizeGene = 2;
  const maxSizeGene   = 30;
  const constitution  = sampleConstitution();

  const base:any = {
    id, name: '',
    _eatCd: 0,  // Eating cooldown timer (in seconds)
    x: rand(40, W-40), y: rand(40, H-40),
    vx: rand(-30,30), vy: rand(-30,30),
    dir: rand(0, Math.PI*2),

    birthSize: birthSizeGene,
    maxSize:   maxSizeGene,
    size: undefined, // set below

    birthTime: Math.floor(Date.now() / 1000),  // seconds since epoch 1970-01-01T00:00:00Z
    age: 0,
    sex: chance(0.5)? 'F':'M',

    constitution,
    speed: randi(2,8),
    senseGene: randi(0,9),
    hungerDrive: randi(2,8),
    rarityGene: randi(0,9),
    colorHue: randi(0,360),
    patternType: patterns[randi(0,patterns.length)],
    finShape: fins[randi(0,fins.length)],
    eyeType: eyes[randi(0,eyes.length)],

    parents: opts.parents || null,
    shiny: false,
    favorite: opts.initialFish || false,
    canMate: true, // All new fish can mate by default
    state: 'wander',
    drag: false,

    // Reproduction state
    _breedCd: 0,
    _mateId: null,
    _ritualTimer: 0,

    // Newborn slow-drift
    freezeFor: 0,
    _spawnY0: undefined, _spawnYOffset: undefined,
    _nbBirthX: undefined, _nbBirthY: undefined,
    _nbDirX: undefined,   _nbDirY: undefined,
    _nbPhase: undefined,

    // Lifespan
    _maxAge: undefined,
    _dieAfterRitual: false,

    // Corpse
    dead: false,
    _bites: undefined,
    _corpseArea: undefined,

    // Flee after bite
    _fleeFromX: undefined, _fleeFromY: undefined,
    _fleeDistLeft: 0,
  };

  base.size = (opts.size ?? base.birthSize);
  base.senseRadius = base.senseGene * 20;
  base.shiny = maybeShiny(base.rarityGene);
  if(opts.override) Object.assign(base, opts.override);

  if (base.birthSize > base.maxSize - 1) base.birthSize = Math.max(SIZE_GENE.BIRTH_MIN, Math.min(base.maxSize - 1, base.birthSize));
  if (base.size < base.birthSize) base.size = base.birthSize;

  base._maxAge = computeMaxAgeSeconds(typeof base.constitution === 'number' ? base.constitution : 5);

  trackDiscovery(base);
  return base;
}

/* ---------- spawn near mom's tail ---------- */
function tailSpawnPosition(mom){
  console.log(`FIXME: tailSpawnPosition mom:`, mom);
  const { W, H } = env.getSize();
  const bodyLen = clamp(mom.size * 2.2, 16, 140);
  const tailL = bodyLen*0.40;
  const localTailX = -bodyLen * 0.5 - tailL * 0.75;
  const cos = Math.cos(mom.dir), sin = Math.sin(mom.dir);
  let sx = mom.x + localTailX * cos;
  let sy = mom.y + localTailX * sin;
  sx = clamp(sx, 10, W - 10);
  sy = clamp(sy, 10, H - 10);
  return { x: sx, y: sy };
}

export function breed(a, b) {
   
  const mom = a.sex === 'F' ? a : b;
  const babies = [];
  const spawn = tailSpawnPosition(mom);

  // Calculate mutation chance based on parents' average rarity (0-9%)
  const mutationChance = (a.rarityGene + b.rarityGene) / 200; // Convert to 0-0.09 range
  
  for (let i = 0; i < 3; i++) {
    // inherit existing genes with rarity-based mutation chance
    const speed        = mutateNum(inheritNum(a.speed, b.speed), mutationChance);
    const senseGene    = mutateNum(inheritNum(a.senseGene ?? 5, b.senseGene ?? 5), mutationChance);
    const hungerDrive  = mutateNum(inheritNum(a.hungerDrive, b.hungerDrive), mutationChance);
    const rarityGene   = mutateNum(inheritNum(a.rarityGene, b.rarityGene), mutationChance);
    const colorHue     = mutateHue(inheritNum(a.colorHue, b.colorHue), mutationChance);
    const patternType  = inheritList(a.patternType, b.patternType);
    const finShape     = inheritList(a.finShape, b.finShape);
    const eyeType      = inheritList(a.eyeType, b.eyeType);

    // new heritable genes with rarity-based mutation chance
    const constitution = mutateNum(inheritNum(a.constitution ?? 5, b.constitution ?? 5), mutationChance);
    let birthSize      = inheritBirthSize(a.birthSize ?? 2, b.birthSize ?? 2);
    let maxSize        = inheritMaxSize(a.maxSize ?? 30, b.maxSize ?? 30);
    if (birthSize > maxSize - 1) birthSize = Math.max(SIZE_GENE.BIRTH_MIN, Math.min(maxSize - 1, birthSize));

    // direction fan
    const awayAngle = mom.dir + rand(-0.5, 0.5);
    const nbDirX = Math.cos(awayAngle);
    const nbDirY = Math.sin(awayAngle);
    const ySpread = (i - 1) * rand(6, 12);

    const f = makeFish({
      size: birthSize,
      parents: { ma: a.id, pa: b.id },
      initialFish: false,
      override: {
        speed, senseGene, hungerDrive, rarityGene,
        colorHue, patternType, finShape, eyeType,
        constitution, birthSize, maxSize,

        name: 'Unnamed',
        x: spawn.x, y: spawn.y,
        vx: 0, vy: 0,
        dir: awayAngle,
        freezeFor: 15,
        _spawnY0: spawn.y,
        _spawnYOffset: ySpread,
        _nbBirthX: spawn.x, _nbBirthY: spawn.y,
        _nbDirX: nbDirX, _nbDirY: nbDirY,
        _nbPhase: rand(0, Math.PI * 2),
      },
    });

    // If mom is near (within 90px) coral, give baby a chance to be shiny
    if (nearDecorType((a.x + b.x) / 2, (a.y + b.y) / 2, 'coral', 90)) {
      if (chance(0.1)) f.shiny = true;
    }
    console.log(`FIXME: About to babies.push(f):`, f);
    babies.push(f);
    
    // Play yippie sound for the first baby only, at half volume
    if (i === 0) {
      playSound(YIPPIE_SOUND, { volume: 0.5 });
    }
  }

  env.toast('New fry hatched! (+3)');
  env.incGeneration();
  return babies;
}

export function trackDiscovery(f){ const key = `${f.patternType}-${f.finShape}`; if(!env.discovered.has(key)) env.discovered.add(key); }

// Adult = ready to breed: age AND size thresholds
export function isAdult(f){ return f.age >= BREED.MIN_AGE_SEC && f.size >= f.maxSize * BREED.MIN_SIZE_FRAC; }
export function isYoung(f){ return f.age < BREED.MIN_AGE_SEC; }

export function pickFish(x,y){
  for(let i=env.fish.length-1;i>=0;i--){
    const f = env.fish[i];
    if(Math.hypot(f.x-x, f.y-y) < Math.max(16, f.size)) return f;
  }
  return null;
}

/* ---------------- update loop ---------------- */
/**
 * Updates a fish's properties and persists changes to local storage if needed
 * @param {Object} fish - The fish object to update
 * @param {Object} updates - Object containing properties to update
 * @param {boolean} [forceUpdate=false] - Whether to force an update even if values haven't changed
 */
interface FishUpdate {
  [key: string]: any;
  size?: number;
  health?: number;
  lastUpdated?: string;
}

/**
 * Updates a fish's properties and persists changes to local storage if needed
 * @param {Object} fish - The fish object to update
 * @param {FishUpdate} updates - Object containing properties to update
 * @param {boolean} [forceUpdate=false] - Whether to force an update even if values haven't changed
 */
async function updateFishProperties(
  fish: any, 
  updates: FishUpdate, 
  forceUpdate: boolean = false
): Promise<boolean> {
  if (!fish) return false;
  
  // Check if this is a size update that would be visible in the collection
  const isSizeUpdate = 'size' in updates && fish.size !== updates.size;
  
  // Apply updates to the fish
  Object.assign(fish, updates);
  
  // If this fish is from the collection, update it there too
  if (fish.originalId) {
    // Don't debounce if this is a size update or forced
    const now = Date.now();
    if (forceUpdate || isSizeUpdate || !fish._lastUpdateTime || now - (fish._lastUpdateTime as number) > 2000) {
      await updateFishInCollection(fish);
      fish._lastUpdateTime = now;
      
      // If this is a size update and the collection is open, refresh it
      if (isSizeUpdate || forceUpdate) {
        try {
          const { fishCollection } = await import('../ui/FishCollection');
          if (fishCollection.isVisible()) {
            // Small delay to ensure the collection has time to register the storage update
            // FIXME: setTimeout(() => fishCollection.refreshCollection(), 100);
          }
        } catch (error) {
          console.error('Error refreshing collection view:', error);
        }
      }
    }
  }
  
  return true;
}

// Function to update fish in the collection
async function updateFishInCollection(updatedFish) {
  if (!updatedFish.originalId) return; // Skip if not from collection
  
  try {
    // Dynamically import FishCollection to avoid circular dependencies
    const { fishCollection } = await import('../ui/FishCollection');
    
    // Get current saved fish
    const savedFish = fishCollection.getSavedFish();
    const fishIndex = savedFish.findIndex(fish => fish.id === updatedFish.originalId);
    
    if (fishIndex !== -1) {
      // Get current time for the update timestamp
      const now = new Date().toISOString();
      
      // Track if this is a size increase
      const isGrowing = updatedFish.size > (savedFish[fishIndex].fishData.size || 0);
      
      // Create updated fish data with all current properties
      const updatedData = {
        ...savedFish[fishIndex],
        lastUpdated: now,
        fishData: {
          ...savedFish[fishIndex].fishData, // Keep all existing data
          ...updatedFish,                   // Override with updated properties
          id: savedFish[fishIndex].fishData.id, // Preserve original ID
          originalId: savedFish[fishIndex].fishData.originalId, // Preserve originalId
          lastGrew: isGrowing ? now : (savedFish[fishIndex].fishData.lastGrew || now),
          lastUpdated: now
        }
      };
      
      // Check if there are actual changes
      const hasChanges = JSON.stringify(savedFish[fishIndex]) !== JSON.stringify(updatedData);
      
      if (hasChanges) {
        // Update the in-memory fish collection
        savedFish[fishIndex] = updatedData;
        
        // Update the in-memory data in storage manager without persisting
        const currentData = storageManager.getCurrentData();
        currentData.fishCollection = savedFish;
        
        // Force refresh the collection view if it's open
        if (fishCollection.isVisible()) {
          // FIXME: fishCollection.refreshCollection();
        }
      }
    }
  } catch (error) {
    console.error('Error updating fish in collection:', error);
  }
}

export async function updateFish(f, dt){
  const { W, H } = env.getSize();
  const pellets = env.pellets;
  
  // Update eating cooldown timer
  if (f._eatCd > 0) {
    f._eatCd = Math.max(0, f._eatCd - dt);
  }
  
  // Store previous size to detect changes
  const prevSize = f.size;

  if (f._maxAge == null) {
    await updateFishProperties(f, {
      _maxAge: computeMaxAgeSeconds(typeof f.constitution === 'number' ? f.constitution : 5)
    });
  }
  
  // Update age
  f.age += dt;
  
  // Check if fish stats have changed significantly and need to be saved
  if (f.originalId && (f.size !== prevSize || f.health <= 0)) {
    await updateFishProperties(f, {
      size: f.size,
      health: f.health,
      lastUpdated: new Date().toISOString()
    }, true);
  }

  /* ---- corpse float + despawn early return ---- */
  if (isCorpse(f)) {
    f.y += (-LIFE.RISE_SPEED) * dt;
    if ((f._corpseArea !== undefined && f._corpseArea <= 0) || f.y < LIFE.OFF_Y) {
      removeFish(f.id);
      return;
    }
    if (f._breedCd > 0) f._breedCd -= dt;
    return;
  }

  /* ---- movement tuning ---- */
  const SPEED = {
    BASE_OFFSET: 20,
    GENE_SCALE: 10,
    MULTIPLIERS: { wander: 1.00, seekFood: 1.30, seekMate: 1.15, ritual: 0.60, flee: 1.60 },
  };
  const SEEK = { BASE: 0.15, MATE: 0.17, FOOD: 0.20 };
  const TURN = {
    ALIGN:   { wander: 0.04, seekFood: 0.22, seekFoodTurbo: 0.38, seekMate: 0.14, ritual: 0.08, flee: 0.35 },
    UY_BIAS: { wander: 0.6,  seekFood: 0.85, seekFoodTurbo: 1.0,  seekMate: 0.7,  ritual: 0.5,  flee: 1.0 }
  };
  const TURBO = { FOOD_DIST: 15, FOOD_MULT: 2.5 };
  const EPS = 1e-3;
  const NEWBORN = {
    DRIFT_SLOW_FACTOR: 0.10,
    TARGET_AWAY_DISTANCE: 80,
    SEEK_FACTOR: 0.10,
    WOBBLE_FREQ: 3,
    WOBBLE_AMPLITUDE: 0.5,
    Y_EASE_DURATION: 0.6,
    VMAX_MULT: 0.8,
    DAMPING_Y: 0.95,
    BOUNDS_PAD: 10,
  };

  /* ---- newborn slow-drift ---- */
  if (f.freezeFor && f.age < f.freezeFor) {
    if (f.drag) { f.vx = 0; f.vy = 0; return; }

    const baseSpeed = 20 + f.speed * 10;
    const slow = NEWBORN.DRIFT_SLOW_FACTOR;

    if (typeof f._nbBirthX === 'number' && typeof f._nbDirX === 'number') {
      const targetX = f._nbBirthX + f._nbDirX * NEWBORN.TARGET_AWAY_DISTANCE;
      const targetY = f._nbBirthY + f._nbDirY * NEWBORN.TARGET_AWAY_DISTANCE;
      const dx = targetX - f.x, dy = targetY - f.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        f.vx += (dx / dist) * f.speed * NEWBORN.SEEK_FACTOR * slow;
        f.vy += (dy / dist) * f.speed * NEWBORN.SEEK_FACTOR * slow;
      }
      const px = -f._nbDirY, py = f._nbDirX;
      const wobble = Math.sin(f.age * NEWBORN.WOBBLE_FREQ + (f._nbPhase || 0)) * NEWBORN.WOBBLE_AMPLITUDE;
      f.vx += px * wobble; f.vy += py * wobble;
    }

    if (typeof f._spawnY0 === 'number' && typeof f._spawnYOffset === 'number') {
      const easeDur = Math.min(NEWBORN.Y_EASE_DURATION, f.freezeFor);
      const t = Math.min(f.age / easeDur, 1);
      const ease = 1 - Math.pow(1 - t, 2);
      f.y = clamp(f._spawnY0 + f._spawnYOffset * ease, NEWBORN.BOUNDS_PAD, H - NEWBORN.BOUNDS_PAD);
    }

    const vmax = (baseSpeed * NEWBORN.VMAX_MULT) * slow;
    const v = Math.hypot(f.vx, f.vy);
    if (v > vmax) { f.vx *= vmax / v; f.vy *= vmax / v; }

    f.vy *= NEWBORN.DAMPING_Y;
    f.x += f.vx * dt; f.y += f.vy * dt;

    if (f.x < NEWBORN.BOUNDS_PAD) { f.x = NEWBORN.BOUNDS_PAD; f.vx = Math.abs(f.vx); }
    if (f.x > W - NEWBORN.BOUNDS_PAD) { f.x = W - NEWBORN.BOUNDS_PAD; f.vx = -Math.abs(f.vx); }
    if (f.y < NEWBORN.BOUNDS_PAD) { f.y = NEWBORN.BOUNDS_PAD; f.vy = Math.abs(f.vy); }
    if (f.y > H - NEWBORN.BOUNDS_PAD) { f.y = H - NEWBORN.BOUNDS_PAD; f.vy = -Math.abs(f.vy); }

    f.dir = Math.atan2(f.vy, f.vx);
    if (f._breedCd > 0) f._breedCd -= dt;
    return;
  } else if (f.freezeFor && f.age >= f.freezeFor) {
    f.freezeFor = 0;
    if ('_spawnY0' in f) delete f._spawnY0;
    if ('_spawnYOffset' in f) delete f._spawnYOffset;
    if ('_nbBirthX' in f) { delete f._nbBirthX; delete f._nbBirthY; }
    if ('_nbDirX' in f)   { delete f._nbDirX;   delete f._nbDirY; }
    if ('_nbPhase' in f)  delete f._nbPhase;
  }

  /* ---- death trigger (now works for young & adult if not favorite) ---- */
  if (!f.favorite && !f.dead && f.age >= f._maxAge) {
    if (f._mateId && f._ritualTimer > 0) f._dieAfterRitual = true;
    else killFish(f);
  }

  /* -------------------- Target selection -------------------- */
  let target = null;

  // flee after bite
  if (f._fleeDistLeft > 0) {
    f.state = 'flee';
    const ax = f.x - (f._fleeFromX ?? f.x);
    const ay = f.y - (f._fleeFromY ?? f.y);
    const alen = Math.hypot(ax, ay) || 1;
    target = { x: f.x + (ax/alen)*200, y: f.y + (ay/alen)*200 };
  } else  // Handle ritual state and timer
  if (f._mateId && f.state === 'ritual') {
    const partner = env.fish.find(m => m.id === f._mateId);
    
    // Clean up if partner is gone, dead, or no longer paired with us
    if (!partner || partner.dead || partner._mateId !== f.id) {
      console.log(`Ritual aborted: partner invalid for fish ${f.id}`);
      f._mateId = null;
      f._ritualTimer = 0;
      f.state = 'wander';
    } 
    // Check if fish have been pulled too far apart
    else if (partner) {
      const distance = Math.hypot(partner.x - f.x, partner.y - f.y);
      const maxRitualDistance = Math.max(f.size, partner.size) * 3; // 3x size seems reasonable
      
      if (distance > maxRitualDistance) {
        console.log(`Ritual aborted: fish ${f.id} and ${partner.id} too far apart (${distance.toFixed(1)}px)`);
        // Reset both fish
        f._mateId = null;
        f._ritualTimer = 0;
        f.state = 'wander';
        
        partner._mateId = null;
        partner._ritualTimer = 0;
        partner.state = 'wander';
      }
      // Update ritual timer and state if still in ritual and close enough
      else if (f._ritualTimer > 0) {
        f._ritualTimer -= dt;
        f.state = 'ritual';
        target = partner;
        
        // Make fish face each other during ritual
        const dx = partner.x - f.x;
        const dy = partner.y - f.y;
        f.dir = Math.atan2(dy, dx);
        
        // Force completion if ritual takes too long (safety net)
        if (f._ritualTimer < -5) {  // 5 seconds grace period after timer hits 0
          console.log(`Forcing ritual completion for fish ${f.id} (took too long)`);
          f._ritualTimer = 0;
        }
      }
    }
  }

  if (!target) {
    // consider pellets and corpses as food - but only if not on eating cooldown
    let bestFood = null, bestFoodDist = Infinity;
    const senseRadius = f.senseGene * 20; // Convert gene to pixels (0-180)
    // const eff = f.senseGene * (0.9 + 0.7 * (f.hungerDrive/9));
    const eff = f._eatCd <= 0 ? f.senseGene * (f.hungerDrive * 2.1) + 5 : 0; // Set effective range to 0 if on cooldown
    for (const p of pellets) {
      const d = Math.hypot(p.x - f.x, p.y - f.y);
      if (d < eff && d < bestFoodDist) { bestFood = p; bestFoodDist = d; }
    }
    let bestCorpse = null, bestCorpseDist = Infinity;
    for (const c of env.fish) {
      if (c === f) continue;
      if (!c.dead) continue;
      if (c._corpseArea !== undefined && c._corpseArea <= 0) continue;
      const d = Math.hypot(c.x - f.x, c.y - f.y);
      if (d < eff && d < bestCorpseDist) { bestCorpse = c; bestCorpseDist = d; }
    }
    let foodTarget = null;
    if (bestFood && (!bestCorpse || bestFoodDist <= bestCorpseDist)) foodTarget = bestFood;
    else if (bestCorpse) foodTarget = bestCorpse;

    // mate desire (exclude dead, only adults, no cooldown, not already in ritual)
    let bestMate = null, bestMateDist = f.senseGene * 20;
    if (isAdult(f) && f._breedCd <= 0 && !f._mateId && f._eatCd <= 0) {
      for (const m of env.fish) {
        if (!f._canMate) continue;
        if (m===f) continue;
        if (!isAdult(m)) continue;
        if (m.sex===f.sex) continue;
        if (m._breedCd > 0) continue;
        if (m._mateId) continue;
        if (m.dead) continue;
        const d = Math.hypot(m.x-f.x, m.y-f.y);
        const senseRadius = f.senseGene * 20; // Convert gene to pixels (0-180)
        if (d < senseRadius && d < bestMateDist) { bestMate = m; bestMateDist = d; }
      }
    }

    if (f._eatCd <= 0) {
      if (bestMate && (!foodTarget || bestMateDist < (foodTarget===bestFood?bestFoodDist:bestCorpseDist) * 0.8 || Math.random() < 0.3)) {
        f.state = 'seekMate'; target = bestMate;
      } else if (foodTarget) {
        f.state = 'seekFood'; target = foodTarget;
      } else {
        f.state = 'wander';
      }
    } else {
      // If on eating cooldown, just wander
      f.state = 'wander';
    }
  }

  // decor influences
  let speedBoost = 1;
  if(nearDecorType(f.x,f.y,'plant',60)) speedBoost += 0.2;
  if(nearDecorType(f.x,f.y,'rock',60) && !isAdult(f)) speedBoost -= 0.2;

  // movement (state-aware + snappy turns near food)
  const stateMult =
    f.state === 'seekMate' ? SPEED.MULTIPLIERS.seekMate :
    f.state === 'seekFood' ? SPEED.MULTIPLIERS.seekFood :
    f.state === 'ritual'   ? SPEED.MULTIPLIERS.ritual   :
    f.state === 'flee'     ? SPEED.MULTIPLIERS.flee     :
                             SPEED.MULTIPLIERS.wander;

  let baseSpeed = (SPEED.BASE_OFFSET + f.speed * SPEED.GENE_SCALE) * stateMult;
  let speedForClamp = baseSpeed;

  if (target) {
    const dx = target.x - f.x;
    const dy = target.y - f.y;
    const d2 = dx*dx + dy*dy;

    if (d2 > EPS*EPS) {
      const dist = Math.sqrt(d2);
      const ux = dx / dist;
      const uy = dy / dist;

      let align = TURN.ALIGN.wander;
      let uyBias = TURN.UY_BIAS.wander;

      if (f.state === 'seekFood') {
        const turbo = dist <= TURBO.FOOD_DIST;
        if (turbo) { baseSpeed *= TURBO.FOOD_MULT; speedForClamp = baseSpeed; }
        align = turbo ? TURN.ALIGN.seekFoodTurbo : TURN.ALIGN.seekFood;
        uyBias = turbo ? TURN.UY_BIAS.seekFoodTurbo : TURN.UY_BIAS.seekFood;
      } else if (f.state === 'seekMate') {
        align = TURN.ALIGN.seekMate; uyBias = TURN.UY_BIAS.seekMate;
      } else if (f.state === 'ritual') {
        align = TURN.ALIGN.ritual;   uyBias = TURN.UY_BIAS.ritual;
      } else if (f.state === 'flee') {
        align = TURN.ALIGN.flee;     uyBias = TURN.UY_BIAS.flee;
        f._fleeDistLeft -= Math.max(0, baseSpeed) * dt;
        if (f._fleeDistLeft <= 0) { f._fleeDistLeft = 0; if (f.state==='flee') f.state = 'wander'; }
      }

      const seekFactor =
        f.state === 'seekMate' ? SEEK.MATE :
        f.state === 'seekFood' ? SEEK.FOOD : SEEK.BASE;

      f.vx += ux * f.speed * seekFactor;
      f.vy += uy * f.speed * seekFactor;

      f.vx += ux * baseSpeed * 0.9 * dt * speedBoost;
      f.vy += (uy * uyBias) * baseSpeed * 0.9 * dt * speedBoost;

      const desired = baseSpeed * 0.9 * speedBoost;
      const desVX = ux * desired;
      const desVY = uy * desired * uyBias;
      f.vx = f.vx * (1 - align) + desVX * align;
      f.vy = f.vy * (1 - align) + desVY * align;

      if (f.state === 'ritual') {
        const px = -uy, py = ux;
        const osc = Math.sin(f.age * 3 + (f.sex === 'F' ? 0 : Math.PI)) * 6;
        f.vx += px * osc * dt;
        f.vy += py * osc * dt;
      }
    }
  } else {
    const wanderFactor = 0.06;
    f.vx += Math.cos(f.dir) * f.speed * wanderFactor;
    f.vy += Math.sin(f.dir) * f.speed * wanderFactor;
  }

  const vmax = speedForClamp * 0.8 * speedBoost;
  const v = Math.hypot(f.vx, f.vy);
  if (v > vmax) { f.vx *= vmax / v; f.vy *= vmax / v; }
  if (!Number.isFinite(f.vx) || !Number.isFinite(f.vy)) { f.vx = 0; f.vy = 0; }

  const dampingY =
    f.state === 'seekFood' ? 0.98 :
    f.state === 'seekMate' ? 0.95 : 0.90;
  f.vy *= dampingY;
  f.x += f.vx * dt; f.y += f.vy * dt;

  // bounds
  if(f.x < 10){ f.x=10; f.vx = Math.abs(f.vx); }
  if(f.x > W-10){ f.x=W-10; f.vx = -Math.abs(f.vx); }
  if(f.y < 10){ f.y=10; f.vy = Math.abs(f.vy); }
  if(f.y > H-10){ f.y=H-10; f.vy = -Math.abs(f.vy); }

  f.dir = Math.atan2(f.vy, f.vx);

  // eat pellets (skip during ritual/flee)
  if (f.state !== 'ritual' && f.state !== 'flee' && f._eatCd <= 0) {
    for(let i=pellets.length-1;i>=0;i--){
      const p = pellets[i];
      if(Math.hypot(p.x-f.x,p.y-f.y) < Math.max(12,f.size*0.85)){
        const newSize = Math.min(f.size + 2, f.maxSize);
        if (newSize > f.size) {
          updateFishProperties(f, {
            size: newSize,
          });
        }
        
        // Set cooldown based on hungerDrive (10 - hungerDrive seconds)
        // Clamping hungerDrive between 0-9 to ensure cooldown is at least 1 second
        f._eatCd = Math.max(1, 10 - Math.min(9, Math.max(0, f.hungerDrive || 0)));
        
        pellets.splice(i,1);
      }
    }
  }

  // nibble corpses (skip during ritual/flee and if on cooldown)
  if (f.state !== 'ritual' && f.state !== 'flee' && f._eatCd <= 0) {
    for (const c of env.fish) {
      if (c === f) continue;
      if (!c.dead) continue;
      if (c._corpseArea !== undefined && c._corpseArea <= 0) continue;
      const dist = Math.hypot(c.x - f.x, c.y - f.y);
      if (dist < Math.max(12, f.size*0.85)) {
        // bite point toward eater
        const ux = (f.x - c.x) / (dist||1);
        const uy = (f.y - c.y) / (dist||1);
        const bodyLen = clamp(c.size*2.2, 16, 140);
        const biteOffset = Math.min(bodyLen*0.25, 20);
        const bx = c.x + ux * biteOffset;
        const by = c.y + uy * biteOffset;

        // world → corpse local
        const cos = Math.cos(c.dir), sin = Math.sin(c.dir);
        const dxw = bx - c.x, dyw = by - c.y;
        const lx =  cos*dxw + sin*dyw;
        const ly = -sin*dxw + cos*dyw;

        if (!c._bites) c._bites = [];
        c._bites.push({ x: lx, y: ly, r: CORPSE.BITE_RADIUS });

        // subtract eaten area
        const biteArea = Math.PI * CORPSE.BITE_RADIUS * CORPSE.BITE_RADIUS;
        if (c._corpseArea !== undefined) c._corpseArea -= biteArea;

        // eater grows a bit
        const newSize = Math.min(f.size + CORPSE.BITE_GROWTH, f.maxSize);
        if (newSize > f.size) {
          updateFishProperties(f, {
            size: newSize
          });
          
          // Set cooldown based on hungerDrive (10 - hungerDrive seconds)
          // Clamping hungerDrive between 0-9 to ensure cooldown is at least 1 second
          f._eatCd = Math.max(1, 10 - Math.min(9, Math.max(0, f.hungerDrive || 0)));
        }

        // flee away
        f._fleeFromX = c.x; f._fleeFromY = c.y;
        f._fleeDistLeft = (f.senseGene  * 20) / 2; // Convert gene to pixels
        break;
      }
    }
  }

  // Update cooldown and ritual timers
  if (f._breedCd > 0) {
    f._breedCd = Math.max(0, f._breedCd - dt);
  }
  
  // Update ritual timer if in ritual state
  if (f.state === 'ritual' && f._ritualTimer > 0) {
    f._ritualTimer = Math.max(0, f._ritualTimer - dt);
  }

  // Debug logging for breeding state (only log occasionally to reduce noise)
  if (f._mateId && Math.random() < 0.01) { // ~1% chance to log each frame
    const partner = env.fish.find(m => m.id === f._mateId);
    const distance = partner ? Math.hypot(partner.x - f.x, partner.y - f.y) : 0;
    console.log(`Fish ${f.id} (${f.sex}) state: ${f.state}, ` +
                `timer: ${f._ritualTimer?.toFixed(2)}, ` +
                `mate: ${f._mateId} (${partner ? 'valid' : 'invalid'}), ` +
                `distance: ${distance.toFixed(1)}px, ` +
                `partner state: ${partner?.state}, ` +
                `partner timer: ${partner?._ritualTimer?.toFixed(2)}`);
  }

  // ritual completion → spawn once + cooldown (then honor pending death)
  if (f.state === 'ritual' && f._mateId && f._ritualTimer <= 0) {
    const partner = env.fish.find(m => m.id === f._mateId);
    
    // Only proceed if we have a valid partner and they're still paired with us
    if (partner && partner._mateId === f.id) {
      // If this is the male, switch to evaluating the female
      if (f.sex === 'male') {
        return; // Let the female handle the breeding logic
      }
      
      console.log(`Attempting to breed fish ${f.id} (female) with ${partner.id} (male)`);
      // At this point we know f is female
      try {
        const babies = breed(f, partner);
        for(const nb of babies) { 
          env.fish.push(nb);
        }
        // Set cooldown for both parents
        // 60 second cooldown after successful breeding
        f._breedCd = 60;
        partner._breedCd = 60;
        
      } catch (e) {
        console.error('Error during breeding:', e);
      }
      
      // Clean up both fish states
      f._mateId = null; 
      f._ritualTimer = 0; 
      f.state = 'wander';
      
      if (partner) {
        partner._mateId = null; 
        partner._ritualTimer = 0; 
        partner.state = 'wander';
      }
      
      // Handle any pending deaths
      if (f._dieAfterRitual) killFish(f);
      if (partner?._dieAfterRitual) killFish(partner);
    } else {
      // Clean up if partner is no longer valid
      f._mateId = null; 
      f._ritualTimer = 0; 
      f.state = 'wander';
    }
  }
}

/* ---------------- start ritual (proximity) ---------------- */
export function handleBreeding(_dt){
  // Skip mating if tank is at or over capacity
  if (env.fish.length >= env.maxFish) return;

  for(let i=0;i<env.fish.length;i++){
    const a = env.fish[i];
    // Skip if fish can't mate, isn't an adult, is dead, or already in a ritual
    if (!a.canMate || !isAdult(a) || a.dead || a.state === 'ritual') continue;

    for(let j=i+1;j<env.fish.length;j++){
      const b = env.fish[j];
      // Skip if fish can't mate, isn't an adult, is dead, or already in a ritual
      if (!b.canMate || !isAdult(b) || b.dead || b.state === 'ritual') continue;
      if (a.sex === b.sex) continue;

      // Check breeding cooldown and existing mates
      if (a._breedCd > 0 || b._breedCd > 0) continue;
      if (a._mateId || b._mateId) continue;

      // Check distance between fish (using their sensing radius)
      const senseRadius = (a.senseGene + b.senseGene) * 15; // Average sensing radius
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      
      if (d < senseRadius * 0.8) { // Need to be within 80% of sensing range
        // Only start ritual if both fish are available
        if (!a._mateId && !b._mateId) {
          console.log(`Starting breeding ritual between ${a.id} and ${b.id}`);
          a._mateId = b.id; 
          b._mateId = a.id;
          a._ritualTimer = b._ritualTimer = 30; // 30 second ritual duration
          a.state = b.state = 'ritual';
          
          // Make fish face each other
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          a.dir = Math.atan2(dy, dx);
          b.dir = Math.atan2(-dy, -dx);
        }
      }
    }
  }
}

/* ---------------- rendering ---------------- */
function drawDeadFishWithHoles(ctx:CanvasRenderingContext2D, f:any){
  const bodyLen = clamp(f.size*2.2, 16, 140);
  const bodyHt  = clamp(f.size*1.2, 10, 80);

  const pad = 12;
  const ow = Math.ceil(bodyLen + pad*2);
  const oh = Math.ceil(bodyHt  + pad*2);

  const off = document.createElement('canvas');
  off.width = ow; off.height = oh;
  const octx = off.getContext('2d')!;

  octx.save();
  octx.translate(ow/2, oh/2);

  const lighter = `hsl(${f.colorHue} 80% 70%)`;
  const base    = `hsl(${f.colorHue} 70% 55%)`;
  const darker  = `hsl(${(f.colorHue+330)%360} 70% 35%)`;

  const tailW = f.finShape==='long'? bodyHt*0.9: f.finShape==='fan'? bodyHt*1.1: f.finShape==='pointy'? bodyHt*0.6: bodyHt*0.8;
  const tailL = f.finShape==='long'? bodyLen*0.45: f.finShape==='fan'? bodyLen*0.35: f.finShape==='pointy'? bodyLen*0.4: bodyLen*0.3;

  octx.fillStyle = lighter; octx.beginPath();
  octx.moveTo(-bodyLen*0.5,0);
  octx.quadraticCurveTo(-bodyLen*0.5-tailL*0.5, -tailW*0.2, -bodyLen*0.5-tailL, 0);
  octx.quadraticCurveTo(-bodyLen*0.5-tailL*0.5, tailW*0.2, -bodyLen*0.5, 0); octx.fill();

  const grd = octx.createLinearGradient(-bodyLen*0.5,0,bodyLen*0.5,0);
  if(f.patternType==='solid'){ grd.addColorStop(0, base); grd.addColorStop(1, base); }
  else if(f.patternType==='gradient'){ grd.addColorStop(0, base); grd.addColorStop(1, lighter); }
  else if(f.patternType==='stripes'){ grd.addColorStop(0, base); grd.addColorStop(1, darker); }
  else if(f.patternType==='spots'){ grd.addColorStop(0, lighter); grd.addColorStop(1, base); }
  octx.fillStyle = grd; octx.beginPath(); octx.ellipse(0,0, bodyLen*0.5, bodyHt*0.5, 0, 0, Math.PI*2); octx.fill();

  if(f.patternType==='stripes'){
    octx.globalAlpha = 0.25; octx.fillStyle = '#000';
    for(let x=-bodyLen*0.4; x<bodyLen*0.5; x+= bodyLen*0.15){ octx.fillRect(x,-bodyHt*0.5, bodyLen*0.03, bodyHt); }
    octx.globalAlpha = 1;
  }
  if(f.patternType==='spots'){
    octx.globalAlpha = 0.25; octx.fillStyle = '#000';
    for(let s=0;s<6;s++){ octx.beginPath(); octx.arc(rand(-bodyLen*0.3,bodyLen*0.3), rand(-bodyHt*0.3,bodyHt*0.3), rand(2,4),0,Math.PI*2); octx.fill(); }
    octx.globalAlpha = 1;
  }

  // punch holes for bites (transparent)
  if (Array.isArray(f._bites)) {
    octx.globalCompositeOperation = 'destination-out';
    for (const b of f._bites) {
      octx.beginPath();
      octx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      octx.fill();
    }
    octx.globalCompositeOperation = 'source-over';
  }

  octx.restore();

  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.rotate(f.dir);
  ctx.drawImage(off, -ow/2, -oh/2);
  ctx.restore();
}

export function drawFish(f:any){
  const ctx = env.ctx;

  // Draw green circle around selected fish
  if (f.selected) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(f.x, f.y, Math.max(16, f.size) + 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw sense radius
    if (!f.dead) {
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      const senseRadius = f.senseGene  * 20; // Convert gene to pixels (0-180)
      ctx.arc(f.x, f.y, senseRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw hunger radius
      const eff = f.senseGene * (f.hungerDrive * 2.1) + 5;
      ctx.setLineDash([8, 6]);
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(f.x, f.y, eff, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  if (f.dead) { drawDeadFishWithHoles(ctx, f); return; }

  ctx.save(); ctx.translate(f.x,f.y); ctx.rotate(f.dir);

  if(f.shiny){ ctx.shadowColor = `hsla(${f.colorHue}, 80%, 70%, 0.9)`; ctx.shadowBlur = 16; }

  const bodyLen = clamp(f.size*2.2, 16, 140);
  const bodyHt  = clamp(f.size*1.2, 10, 80);

  const base    = `hsl(${f.colorHue} 70% 55%)`;
  const darker  = `hsl(${(f.colorHue+330)%360} 70% 35%)`;
  const lighter = `hsl(${f.colorHue} 80% 70%)`;

  // tail (improved)
drawBetterTail(ctx, f.finShape, bodyLen, bodyHt, lighter, darker);

function drawBetterTail(
  ctx: CanvasRenderingContext2D,
  finShape: string,
  bodyLen: number,
  bodyHt: number,
  lighter: string,
  darker: string
) {
  // Start the tail slightly inside the body for a more natural look (0.45 instead of 0.5)
  const sx = -bodyLen * 0.45; // tail root (starts inside the body on -X side)

  ctx.fillStyle = lighter;
  ctx.strokeStyle = darker;
  ctx.lineWidth = Math.max(0.8, bodyHt * 0.015);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  switch (finShape) {
    case "pointy": {
      // Sleek, tapered diamond/leaf to a point
      const L = bodyLen * 0.42;
      const baseW = bodyHt * 0.4;  // 50% narrower at base (was 0.55, now 0.4 of body height)
      const tipW = Math.max(1.5, bodyHt * 0.06);
      const ex = sx - L;

      ctx.beginPath();
      ctx.moveTo(sx, -baseW * 0.5);
      ctx.bezierCurveTo(
        sx - L * 0.35, -baseW * 0.85,
        ex - L * 0.05, -tipW,
        ex, 0
      );
      ctx.bezierCurveTo(
        ex - L * 0.05, tipW,
        sx - L * 0.35, baseW * 0.85,
        sx, baseW * 0.5
      );
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }

    case "round": {
      // Big, rounded and elongated tail
      const L = bodyLen * 0.75;  // Increased length for a more elongated look
      const baseW = bodyHt * 0.75;
      const endW  = bodyHt * 1.15;  // Slightly wider at the end
      const ex = sx - L;

      ctx.beginPath();
      ctx.moveTo(sx, -baseW * 0.5);
      // More pronounced curve for a rounder shape
      ctx.bezierCurveTo(
        sx - L * 0.6, -endW * 0.95,  // More pronounced curve
        sx - L * 0.9, -endW * 0.7,   // Control point moved further out
        ex, 0
      );
      // Matching curve on the bottom
      ctx.bezierCurveTo(
        sx - L * 0.9, endW * 0.7,    // Control point moved further out
        sx - L * 0.6, endW * 0.95,   // More pronounced curve
        sx, baseW * 0.5
      );
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }

    case "fan": {
      // Wide, almost flat trailing edge with rounded corners
      const L = bodyLen * 0.48;
      const baseW = bodyHt * 0.5;
      const endW  = bodyHt * 1.75;
      const ex = sx - L;
      const r = Math.min(12, L * 0.16); // corner radius

      ctx.beginPath();
      ctx.moveTo(sx, -baseW * 0.5);
      ctx.lineTo(ex + r, -endW * 0.5);
      ctx.quadraticCurveTo(ex, -endW * 0.5, ex, -endW * 0.5 + r);
      ctx.lineTo(ex,  endW * 0.5 - r);
      ctx.quadraticCurveTo(ex, endW * 0.5, ex + r, endW * 0.5);
      ctx.lineTo(sx, baseW * 0.5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }

    case "forked": {
      // Straighter, K-like angles with a notch; slightly asymmetric (shark-ish)
      const L = bodyLen * 0.70;
      const baseW = bodyHt * 0.5;
      const lobeH = bodyHt * 1.15;
      const ex = sx - L;
      const notch = L * 0.45;      // 65% of tail length
      const nx = ex + notch;
      const top = -lobeH * 0.80;   // top lobe a bit longer
      const bot =  lobeH * 0.25;   // bottom lobe shorter

      ctx.beginPath();
      ctx.moveTo(sx, -baseW * 0.5);
      ctx.lineTo(ex, top);
      ctx.lineTo(nx, 0);
      ctx.lineTo(ex, bot);
      ctx.lineTo(sx,  baseW * 0.5);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    }

    case "lunate": {
      // Attach point where tail meets body
      const tailStartX = -bodyLen * 0.45;       // Match the inset used in other tails
      const sx = tailStartX;
      const peduncle = bodyHt * 0.36;           // base width (increased from 0.36 to 0.48 for thicker base)
      const L = bodyLen * 0.72;                 // tail length
    
      // Crescent geometry: outer/inner arc centers and radii
      const cxO = sx - L * 0.68;                // outer arc center (further left)
      const cxI = cxO + L * 0.18;               //  28 inner arc center (pulled toward body for deeper “bite”)
      const ROut = L * 0.80;                    // outer radius
      const RIn  = L * 0.30;                    // inner radius  0.54
      const phi  = Math.PI * 0.58;              // ~104° span; wider = more “C”
    
      // Wisp length (tip flourish)
      const wisp = Math.min(L * 0.52, 22);      // the second  
    
      // Base anchors
      const topBaseX = sx, topBaseY = -peduncle * 1.5;      // this  was 0.5
      const botBaseX = sx, botBaseY =  peduncle * 0.1;
    
      // Arc endpoints at ±phi (top = -phi, bottom = +phi)
      const pOutTopX = cxO + ROut * Math.cos(-phi);
      const pOutTopY =            ROut * Math.sin(-phi);
      const pOutBotX = cxO + ROut * Math.cos( phi);
      const pOutBotY =            ROut * Math.sin( phi);
    
      const pInBotX  = cxI + RIn  * Math.cos( phi);
      const pInBotY  =            RIn  * Math.sin( phi);
      const pInTopX  = cxI + RIn  * Math.cos(-phi);
      const pInTopY  =            RIn  * Math.sin(-phi);
    
      ctx.beginPath();
    
      // Ease from base top into the outer arc (no sharp corner)
      ctx.moveTo(topBaseX, topBaseY);
      ctx.quadraticCurveTo(
        sx - L * 0.18, -peduncle * 1.1,   // soft lead-in
        pOutTopX,      pOutTopY
      );
    
      // OUTER arc: top → bottom (clockwise)
      ctx.arc(cxO, 0, ROut, -phi, +phi, false);
    
      // Bottom wisp: overshoot then hook back to the inner rim
      ctx.quadraticCurveTo(
        pOutBotX - wisp, pOutBotY + wisp * 0.35,
        pInBotX,         pInBotY
      );
    
      // INNER arc: bottom → top (counter-clockwise)
      ctx.arc(cxI, 0, RIn, +phi, -phi, true);
    
      // Top wisp: small hook outward, then back to base top
      ctx.quadraticCurveTo(
        pInTopX - wisp, pInTopY - wisp * 0.35,
        topBaseX,       topBaseY
      );
    
      // Close along the body side to give the root some thickness
      ctx.lineTo(botBaseX, botBaseY);
    
      // Draw the outline
      ctx.strokeStyle = darker;
      ctx.lineWidth = Math.max(0.8, bodyHt * 0.015);
      ctx.stroke();
      
      // Fill the shape
      ctx.fill();
      ctx.closePath();
      break;
    }
  }
}

  
  // Main fish body continues here

  // body gradient
  const grd = ctx.createLinearGradient(-bodyLen*0.5,0,bodyLen*0.5,0);
  if(f.patternType==='solid'){ grd.addColorStop(0, base); grd.addColorStop(1, base); }
  else if(f.patternType==='gradient'){ grd.addColorStop(0, base); grd.addColorStop(1, lighter); }
  else if(f.patternType==='stripes'){ grd.addColorStop(0, base); grd.addColorStop(1, darker); }
  else if(f.patternType==='spots'){ grd.addColorStop(0, lighter); grd.addColorStop(1, base); }
  ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(0,0, bodyLen*0.5, bodyHt*0.5, 0, 0, Math.PI*2); ctx.fill();

  // overlays
  if(f.patternType==='stripes'){
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
    for(let x=-bodyLen*0.4; x<bodyLen*0.5; x+= bodyLen*0.15){ ctx.fillRect(x,-bodyHt*0.5, bodyLen*0.03, bodyHt); }
    ctx.globalAlpha = 1;
  }
  if(f.patternType==='spots'){
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
    for(let s=0;s<6;s++){ ctx.beginPath(); ctx.arc(rand(-bodyLen*0.3,bodyLen*0.3), rand(-bodyHt*0.3,bodyHt*0.3), rand(2,4),0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha = 1;
  }

  // eye
  ctx.fillStyle = '#fff'; const eyeX = bodyLen*0.22; const eyeY = -bodyHt*0.1;
  ctx.beginPath(); ctx.arc(eyeX, eyeY, Math.max(2, bodyHt*0.12), 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(eyeX+1, eyeY, Math.max(1, bodyHt*0.06), 0, Math.PI*2); ctx.fill();

  // mouth
  ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bodyLen*0.5-2, 0, 2, 0.2, -0.2); ctx.stroke();

  // name label
  if(f.name && f.name !== 'Unnamed'){
    ctx.save();
    ctx.rotate(-f.dir);
    const fontPx = Math.max(10, Math.floor(f.size*0.45));
    ctx.font = `${fontPx}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    const w = ctx.measureText(f.name).width;
    const pad = 4; const y = -bodyHt*0.8; const h = fontPx + 4;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-w/2 - pad/2, y - h + 2, w + pad, h);
    ctx.fillStyle = '#fff'; ctx.fillText(f.name, 0, y);
    ctx.restore();
  }

  ctx.restore();
}
