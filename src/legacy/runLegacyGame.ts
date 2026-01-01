// @ts-nocheck
/**
 * Entry point orchestrator for the legacy game.
 * The goal is to keep behavior identical while splitting logic into modules.
 */

import { fishManager } from '../creatures/FishManager';
import {
  bringDecorToFront,
  configureDecor,
  decorRadius,
  decorSelect,
  placeDecor,
  pickDecor,
  removeDecor,
} from '../entities/decor';
import {
  configureFish,
  makeFish,
  updateFish,
  drawFish,
  handleBreeding,
  pickFish,
  markDecorDirty,
} from '../entities/fish';
import { drawBackground } from '../render/background';
import { configureDecorRenderer, drawDecor } from '../render/decorRenderer';
import { gameState } from '../state/GameState';
import { backupManagerUI } from '../ui/BackupManagerUI';
import {
  playSound,
  Sounds,
  toggleMute,
  isMuted,
  playBackgroundMusic,
  pauseBackgroundMusic,
} from '../utils/audio';
import gameDataValidator from '../utils/gameDataValidator';

import { createBubbles } from './bubbles';
import { createFishCardUI } from './fishCardUI';
import { attachInputHandlers } from './inputHandlers';
import { addPellet, updatePellets, drawPellets as _drawPellets } from './pellets';
import { createRenderer } from './renderer';
import { setupUIControls } from './uiControls';

export async function runLegacyGame(canvasId: string = 'c') {
  // Initialize FishManager and global GameState as before
  await fishManager.initialize();
  (window as any).gameState = gameState;

  // Pre-import and expose fishCollection for debugging (same as before)
  const { fishCollection } = await import('../ui/FishCollection');
  (window as any).fishCollection = fishCollection;

  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  const DPR = Math.max(1, (window as any).devicePixelRatio || 1);

  // === UI Elements (same IDs as before) ===
  const popEl = document.getElementById('pop') as HTMLElement;
  const genEl = document.getElementById('gen') as HTMLElement;
  const discEl = document.getElementById('disc') as HTMLElement;
  const toastEl = document.getElementById('toast') as HTMLElement;
  const fishCard = document.getElementById('fishCard') as HTMLElement;
  const pauseEl = document.getElementById('pause') as HTMLInputElement;
  const panelDecor = document.getElementById('panelDecor') as HTMLElement;
  const panelTheme = document.getElementById('panelTheme') as HTMLElement;
  const panelDex = document.getElementById('panelDex') as HTMLElement;
  const dexList = document.getElementById('dexList') as HTMLElement;
  const muteSfxBtn = document.getElementById('btnMuteSfx') as HTMLElement;
  const muteMusicBtn = document.getElementById('btnMuteMusic') as HTMLElement;
  const btnFood = document.getElementById('btnFood') as HTMLElement;
  const btnDecor = document.getElementById('btnDecor') as HTMLElement;
  const btnTheme = document.getElementById('btnTheme') as HTMLElement;
  const btnDex = document.getElementById('btnDex') as HTMLElement;
  const btnCollection = document.getElementById('btnCollection') as HTMLElement;
  const btnNewCollection = document.getElementById('btnNewCollection') as HTMLElement;
  const bubbleLevel = document.getElementById('bubbleLevel') as HTMLInputElement;
  const timeSpeed = document.getElementById('timeSpeed') as HTMLInputElement;
  const decorType = document.getElementById('decorType') as HTMLSelectElement;
  const decorSize = document.getElementById('decorSize') as HTMLSelectElement;
  const debugDecorRadius = document.getElementById('debugDecorRadius') as HTMLInputElement;
  const topbarEl = document.querySelector('.topbar') as HTMLElement | null;

  // Backup manager UI mount
  backupManagerUI.mount(document.querySelector('.topbar') as HTMLElement);

  // === Canvas size / DPR ===
  let W = 0,
    H = 0;
  let topInset = 0;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    topInset = topbarEl ? topbarEl.offsetHeight : 0;
  }
  window.addEventListener('resize', resize);
  resize();

  // === Utilities (kept identical) ===
  const rand = (a: number, b: number) => Math.random() * (b - a) + a;
  const randi = (a: number, b: number) => Math.floor(rand(a, b));
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  const chance = (p: number) => Math.random() < p;
  const uuid = (() => {
    let i = 0;
    return () => (++i).toString(36) + '-' + Date.now().toString(36);
  })();
  const randomId = () => `decor-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const applyDecorFromState = () => {
    const savedDecor = gameState.getState().tank?.decorations;
    decors.length = 0;
    if (!Array.isArray(savedDecor)) {
      markDecorDirty();
      return;
    }
    savedDecor.forEach(d => {
      const size = d.size === 's' || d.size === 'm' || d.size === 'l' ? d.size : 'm';
      decors.push({
        id: d.id || randomId(),
        type: d.type || 'plant',
        x: typeof d.x === 'number' ? d.x : 0,
        y: typeof d.y === 'number' ? d.y : 0,
        size,
        r: typeof d.r === 'number' ? d.r : decorRadius(size),
      });
    });
    markDecorDirty();
  };

  const syncDecorToState = () => {
    const currentState = gameState.getState();
    gameState.updateState({
      tank: {
        ...currentState.tank,
        decorations: decors.map(d => ({
          id: d.id,
          type: d.type,
          x: d.x,
          y: d.y,
          r: d.r,
          size: d.size,
        })),
      },
    });
    markDecorDirty();
  };

  // === Game State (same semantics) ===
  const fish: any[] = [];
  const pellets: any[] = [];
  const decors: any[] = [];
  let generation = 1;
  const discovered = new Set<string>();
  const tankFishIds = new Set<string>();

  const MAX_FISH_BASE = 60;

  // Time & theme
  let time = 0;
  const timeScaleRef = { value: 1 };
  const themeRef = { value: 'day' };
  function setTheme(t: string) {
    themeRef.value = t;
    toast(`Theme: ${t}`);
  }

  // Mode & paused
  const modeRef = { value: 'food' }; // 'food' | 'decor'
  const pausedRef = { value: false };

  const syncPauseToggle = () => {
    const isPaused = !!gameState.getState().settings?.paused;
    pauseEl.checked = isPaused;
    pausedRef.value = isPaused;
  };

  // === Toast ===
  function toast(msg: string, isError = false) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    if (isError) toastEl.style.background = 'rgba(255,64,64,0.9)';
    clearTimeout((toastEl as any)._t);
    (toastEl as any)._t = setTimeout(() => {
      toastEl.style.display = 'none';
      toastEl.style.background = '';
    }, 1500);
  }

  // === Bubbles module ===
  const bubbles = createBubbles(() => ({ W, H }), ctx);

  // === Configure systems that rely on legacy globals ===
  applyDecorFromState();

  configureFish({
    getSize: () => ({ W, H }),
    ctx,
    pellets,
    decors,
    fish,
    discovered,
    toast,
    incGeneration: () => {
      generation++;
    },
    maxFish: MAX_FISH_BASE,
    topInset,
  });

  configureDecor({
    getSize: () => ({ W, H }),
    ctx,
    decors,
    toast,
    rand,
  });

  configureDecorRenderer({
    ctx,
    getSize: () => ({ W, H }),
    decors,
    rand,
    showDebugRadius: () => !!gameState.getState().settings?.debugDecorRadius,
  });

  const syncDebugDecorToggle = () => {
    if (!debugDecorRadius) return;
    debugDecorRadius.checked = !!gameState.getState().settings?.debugDecorRadius;
  };

  syncPauseToggle();
  syncDebugDecorToggle();

  debugDecorRadius?.addEventListener('change', () => {
    const currentState = gameState.getState();
    gameState.updateState({
      settings: {
        ...currentState.settings,
        debugDecorRadius: debugDecorRadius.checked,
      },
    });
  });

  window.addEventListener('backupRestored', event => {
    const detail = (event as CustomEvent).detail as {
      preserveTankFish?: boolean;
      tankFish?: Array<Record<string, unknown>>;
      seedIfEmpty?: boolean;
      restoreTankFish?: boolean;
      restoreTankLayout?: boolean;
    };
    if (!detail) {
      return;
    }

    if (detail.restoreTankLayout) {
      applyDecorFromState();
      syncDebugDecorToggle();
    }

    syncPauseToggle();

    if (detail.preserveTankFish === false) {
      fish.length = 0;
      tankFishIds.clear();
    } else if (detail.preserveTankFish === true) {
      fish.forEach(existingFish => {
        if (existingFish?.id) {
          tankFishIds.add(existingFish.id);
        }
        if (existingFish?.originalId) {
          tankFishIds.add(existingFish.originalId);
        }
      });
    }

    if (detail.preserveTankFish === false) {
      fish.length = 0;
      tankFishIds.clear();
    } else if (detail.preserveTankFish === true) {
      fish.forEach(existingFish => {
        if (existingFish?.id) {
          tankFishIds.add(existingFish.id);
        }
        if (existingFish?.originalId) {
          tankFishIds.add(existingFish.originalId);
        }
      });
    }

    if (detail.restoreTankFish) {
      const state = gameState.getState();
      const tankSnapshotById = new Map<string, Record<string, unknown>>();
      const snapshotEntries = Array.isArray(detail.tankFish) ? detail.tankFish : [];

      snapshotEntries.forEach(entry => {
        const entryId =
          (entry as { id?: string; originalId?: string }).id ||
          (entry as { originalId?: string }).originalId;
        if (entryId) {
          tankSnapshotById.set(entryId, entry);
        }
        const originalId = (entry as { originalId?: string }).originalId;
        if (originalId) {
          tankSnapshotById.set(originalId, entry);
        }
      });

      const tankIds = new Set<string>([
        ...(state.fishInTank || []),
        ...(state.fishInTankOriginalIds || []),
      ]);
      const tankFromCollection = Array.isArray(state.fishCollection)
        ? state.fishCollection.filter(entry => {
            const entryId = entry.id || entry.fishData?.id;
            return entryId && tankIds.has(entryId);
          })
        : [];

      const timestamp = Math.floor(Date.now() / 1000);
      let spawnedCount = 0;

      const spawnFromSnapshot = (entry: Record<string, unknown>) => {
        const normalized = gameDataValidator.validateAndTransformFish(entry, timestamp);
        if (!normalized) return;
        const entryId =
          (entry as { id?: string; originalId?: string }).id ||
          (entry as { originalId?: string }).originalId ||
          normalized.id;
        if (entryId && tankFishIds.has(entryId)) {
          console.warn(`[Restore] Skipping duplicate tank fish id "${entryId}"`);
          return;
        }
        const safeX =
          typeof normalized.x === 'number' ? clamp(normalized.x, 40, W - 40) : rand(40, W - 40);
        const minY = Math.max(40, topInset + 10);
        const safeY =
          typeof normalized.y === 'number' ? clamp(normalized.y, minY, H - 40) : rand(minY, H - 40);
        const override = {
          ...normalized,
          x: safeX,
          y: safeY,
          _mateId: null,
          _breedCd: 0,
          _ritualTimer: 0,
          state: 'wander',
        };
        const newFish = makeFish({ override });
        const originalId = (entry as { originalId?: string }).originalId || newFish.id;
        newFish.originalId = originalId;
        fish.push(newFish);
        spawnedCount++;
        tankFishIds.add(originalId);
        if (newFish.id) {
          tankFishIds.add(newFish.id);
        }
      };

      const spawnFromCollection = (entry: any) => {
        const fishData = entry.fishData || entry;
        const normalized = gameDataValidator.validateAndTransformFish(fishData, timestamp);
        if (!normalized) return;
        const entryId = entry.id || fishData?.id || normalized.id;
        if (entryId && tankFishIds.has(entryId)) {
          console.warn(`[Restore] Skipping duplicate tank fish id "${entryId}"`);
          return;
        }
        const snapshot = entryId ? tankSnapshotById.get(entryId) : undefined;
        const safeX =
          typeof snapshot?.x === 'number'
            ? clamp(snapshot.x as number, 40, W - 40)
            : typeof normalized.x === 'number'
              ? clamp(normalized.x, 40, W - 40)
              : rand(40, W - 40);
        const minY = Math.max(40, topInset + 10);
        const safeY =
          typeof snapshot?.y === 'number'
            ? clamp(snapshot.y as number, minY, H - 40)
            : typeof normalized.y === 'number'
              ? clamp(normalized.y, minY, H - 40)
              : rand(minY, H - 40);
        const vx =
          typeof snapshot?.vx === 'number'
            ? (snapshot.vx as number)
            : typeof normalized.vx === 'number'
              ? normalized.vx
              : undefined;
        const vy =
          typeof snapshot?.vy === 'number'
            ? (snapshot.vy as number)
            : typeof normalized.vy === 'number'
              ? normalized.vy
              : undefined;
        const dir =
          typeof snapshot?.dir === 'number'
            ? (snapshot.dir as number)
            : typeof normalized.dir === 'number'
              ? normalized.dir
              : undefined;
        const override = {
          ...normalized,
          id: entry.id || normalized.id,
          name: entry.name || normalized.name,
          x: safeX,
          y: safeY,
          ...(typeof vx === 'number' ? { vx } : {}),
          ...(typeof vy === 'number' ? { vy } : {}),
          ...(typeof dir === 'number' ? { dir } : {}),
          _mateId: null,
          _breedCd: 0,
          _ritualTimer: 0,
          state: 'wander',
        };
        const newFish = makeFish({ override });
        newFish.originalId =
          entry.id ||
          (snapshot as { originalId?: string } | undefined)?.originalId ||
          normalized.id;
        fish.push(newFish);
        spawnedCount++;
        if (newFish.originalId) {
          tankFishIds.add(newFish.originalId);
        }
        if (newFish.id) {
          tankFishIds.add(newFish.id);
        }
      };

      snapshotEntries.forEach(entry => spawnFromSnapshot(entry));
      tankFromCollection.forEach(entry => spawnFromCollection(entry));

      if (spawnedCount === 0 && detail.seedIfEmpty) {
        for (let i = 0; i < 10; i++) {
          const newFish = makeFish({ initialFish: true });
          fish.push(newFish);
          tankFishIds.add(newFish.id);
        }
      }
    } else if (detail.seedIfEmpty) {
      for (let i = 0; i < 10; i++) {
        const newFish = makeFish({ initialFish: true });
        fish.push(newFish);
        tankFishIds.add(newFish.id);
      }
    }
  });

  gameState.setTankSnapshotProvider(() => fish.map(f => JSON.parse(JSON.stringify(f))));

  const flushTankSave = () => {
    try {
      void gameState.save();
    } catch (error) {
      console.error('[GameState] Failed to flush save on exit:', error);
    }
  };
  window.addEventListener('beforeunload', flushTankSave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushTankSave();
    }
  });

  // === Initial population ===
  const currentState = gameState.getState();
  const savedCollection = currentState.fishCollection || [];
  const savedTankFish = Array.isArray(currentState.tankFish) ? currentState.tankFish : [];
  const tankIds = new Set<string>([
    ...(currentState.fishInTank || []),
    ...(currentState.fishInTankOriginalIds || []),
  ]);
  if (savedTankFish.length > 0) {
    const timestamp = Math.floor(Date.now() / 1000);
    for (const entry of savedTankFish) {
      const normalized = gameDataValidator.validateAndTransformFish(entry, timestamp);
      if (!normalized) continue;
      const safeX =
        typeof normalized.x === 'number' ? clamp(normalized.x, 40, W - 40) : rand(40, W - 40);
      const minY = Math.max(40, topInset + 10);
      const safeY =
        typeof normalized.y === 'number' ? clamp(normalized.y, minY, H - 40) : rand(minY, H - 40);
      const override = {
        ...normalized,
        x: safeX,
        y: safeY,
        _mateId: null,
        _breedCd: 0,
        _ritualTimer: 0,
        state: 'wander',
      };
      const newFish = makeFish({ override });
      const originalId = (entry as { originalId?: string }).originalId || newFish.id;
      newFish.originalId = originalId;
      fish.push(newFish);
    }
  } else if (savedCollection.length > 0) {
    const timestamp = Math.floor(Date.now() / 1000);
    for (const entry of savedCollection) {
      const entryId = entry.id || entry.fishData?.id;
      if (tankIds.size > 0 && entryId && !tankIds.has(entryId)) {
        continue;
      }
      const fishData = entry.fishData || entry;
      const normalized = gameDataValidator.validateAndTransformFish(fishData, timestamp);
      if (!normalized) continue;
      const safeX =
        typeof normalized.x === 'number' ? clamp(normalized.x, 40, W - 40) : rand(40, W - 40);
      const minY = Math.max(40, topInset + 10);
      const safeY =
        typeof normalized.y === 'number' ? clamp(normalized.y, minY, H - 40) : rand(minY, H - 40);
      const override = {
        ...normalized,
        id: entry.id || normalized.id,
        name: entry.name || normalized.name,
        x: safeX,
        y: safeY,
        _mateId: null,
        _breedCd: 0,
        _ritualTimer: 0,
        state: 'wander',
      };
      const newFish = makeFish({ override });
      newFish.originalId = entry.id || normalized.id;
      fish.push(newFish);
    }
  } else {
    for (let i = 0; i < 10; i++) fish.push(makeFish({ initialFish: true }));
  }

  // === Fish Card UI ===
  const fishCardUI = createFishCardUI({
    fish,
    tankFishIds,
    fishCardEl: fishCard,
    toast,
  });

  // === UI Controls (panels, audio, sliders, theme) ===
  const ui = {
    panelDecor,
    panelTheme,
    panelDex,
    dexList,
    discEl,
    popEl,
    genEl,
    toastEl,
    pauseEl,
    btnFood,
    btnDecor,
    btnTheme,
    btnDex,
    btnCollection,
    btnNewCollection,
    muteSfxBtn,
    muteMusicBtn,
    bubbleLevel,
    timeSpeed,
    decorType,
    decorSize,
  };
  const { togglePanel } = setupUIControls(ui, {
    isMuted,
    toggleMute,
    playBackgroundMusic,
    pauseBackgroundMusic,
    toast,
    bubbles,
    modeRef,
    pausedRef,
    setTheme,
    refreshDex: () => refreshDex(),
    decorSelect,
    fish,
    onPauseChange: isPaused => {
      const currentState = gameState.getState();
      gameState.updateState({
        settings: {
          ...currentState.settings,
          paused: isPaused,
        },
      });
    },
  });

  // Reflect timeSpeed slider -> timeScale
  ui.timeSpeed.oninput = () => (timeScaleRef.value = parseFloat(ui.timeSpeed.value));

  // === Input handlers (drag/click/food key) ===
  attachInputHandlers({
    canvas,
    getSize: () => ({ W, H }),
    clamp,
    topInset,
    pickFish,
    pickDecor,
    removeDecor,
    bringDecorToFront,
    placeDecor,
    showFishCard: fishCardUI.showFishCard,
    addPellet: (x: number, y: number) => addPellet(pellets, x, y, rand, uuid),
    modeRef,
    panelDecorEl: panelDecor,
    onDecorChanged: syncDecorToState,
  });

  // === Dex UI ===
  function refreshDex() {
    dexList.innerHTML = '';
    const arr = Array.from(discovered).sort();
    discEl.textContent = `Discovered: ${arr.length}`;
    if (arr.length === 0) {
      dexList.innerHTML = '<div class="notice">Discover new pattern/fin combos by breeding!</div>';
      return;
    }
    arr.forEach(k => {
      const [p, f] = (k as string).split('-');
      const div = document.createElement('div');
      div.innerHTML = `<span class="badge">${p}</span> <span class="badge">${f}</span>`;
      dexList.appendChild(div);
    });
  }

  // === Renderer ===
  const renderer = createRenderer({
    ctx,
    getSize: () => ({ W, H }),
    themeRef,
    drawBackground,
    drawDecor,
    drawPellets: ctx2 => _drawPellets(ctx2, pellets),
    drawFish,
    fish,
    bubbles,
  });

  // === Main loop (kept identical) ===
  let last = performance.now();
  async function loop(now: number) {
    const dt = ((now - last) / 1000) * timeScaleRef.value;
    last = now;
    pausedRef.value = pauseEl.checked;
    if (!pausedRef.value) {
      time += dt;
      // update
      updatePellets(pellets, dt, H);
      fish.forEach(f => updateFish(f, dt));
      handleBreeding(dt);
      bubbles.update(dt);
      popEl.textContent = `Fish: ${fish.length}`;
      genEl.textContent = `Gen: ${generation}`;
      fishCardUI.refreshIfVisible();
    }
    await renderer.draw();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
