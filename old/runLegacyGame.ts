// @ts-nocheck

import {
    configureFish, makeFish, updateFish, drawFish,
    breed, isAdult, isYoung, pickFish, handleBreeding, trackDiscovery
} from '../entities/fish';
import { playSound, Sounds, toggleMute, isMuted, playBackgroundMusic, pauseBackgroundMusic } from '../utils/audio';

import { configureDecor, decorSelect, decorRadius, placeDecor, nearDecorType } from '../entities/decor';
import { drawBackground } from '../render/background';
import { configureDecorRenderer, drawDecor } from '../render/decorRenderer';
import { THEMES } from '../config/themes';
import { Howl } from 'howler';
/**
 * This file contains the legacy game code from main.js
 * It's kept as-is with TypeScript checking disabled to ensure it continues to work
 * while we migrate components to TypeScript one by one.
 */

// The original game code will be moved here
// This allows us to gradually migrate functionality to TypeScript
// while keeping the game runnable at all times

export function runLegacyGame(canvasId: string = 'c') {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const DPR = Math.max(1, window.devicePixelRatio || 1);

  // UI elements
  const popEl = document.getElementById('pop');
  const genEl = document.getElementById('gen');
  const discEl = document.getElementById('disc');
  const toastEl = document.getElementById('toast');
  const fishCard = document.getElementById('fishCard');
  const pauseEl = document.getElementById('pause');
  const panelDecor = document.getElementById('panelDecor');
  const panelTheme = document.getElementById('panelTheme');
  const panelDex = document.getElementById('panelDex');
  const dexList = document.getElementById('dexList');
  const muteBtn = document.getElementById('btnMute');

  // Controls
  // Audio control buttons
  const muteSfxBtn = document.getElementById('btnMuteSfx');
  const muteMusicBtn = document.getElementById('btnMuteMusic');
  
  // Update mute button states
  const updateMuteButtons = () => {
    // Update SFX button
    const isSfxMuted = isMuted('sfx');
    muteSfxBtn.classList.toggle('muted', isSfxMuted);
    muteSfxBtn.title = isSfxMuted ? 'Unmute sound effects' : 'Mute sound effects';
    
    // Update music button
    const isMusicMuted = isMuted('music');
    muteMusicBtn.classList.toggle('muted', isMusicMuted);
    muteMusicBtn.title = isMusicMuted ? 'Unmute music' : 'Mute music';
  };
  
  // SFX mute toggle
  muteSfxBtn.onclick = () => {
    const isNowMuted = toggleMute('sfx');
    toast(isNowMuted ? 'Sound effects muted' : 'Sound effects unmuted');
    updateMuteButtons();
  };
  
  // Music mute toggle
  muteMusicBtn.onclick = () => {
    const isNowMuted = toggleMute('music');
    
    if (isNowMuted) {
      pauseBackgroundMusic();
      toast('Music muted');
    } else {
      playBackgroundMusic();
      toast('Music playing');
    }
    
    updateMuteButtons();
  };
  
  // Initialize mute buttons state
  updateMuteButtons();
  
  document.getElementById('btnFood').onclick = () => (mode = 'food');
  document.getElementById('btnDecor').onclick = () => togglePanel(panelDecor);
  document.getElementById('btnTheme').onclick = () => togglePanel(panelTheme);
  document.getElementById('btnDex').onclick = () => {
    refreshDex();
    togglePanel(panelDex);
  };
  document.getElementById('decorType').onchange = e => (decorSelect.type = e.target.value);
  document.getElementById('decorSize').onchange = e => (decorSelect.size = e.target.value);
  panelTheme.querySelectorAll('button[data-theme]').forEach(btn => {
    btn.onclick = () => setTheme(btn.dataset.theme);
  });
  const bubbleLevel = document.getElementById('bubbleLevel');
  bubbleLevel.oninput = () => (bubbles.targetDensity = parseFloat(bubbleLevel.value));
  const timeSpeed = document.getElementById('timeSpeed');
  timeSpeed.oninput = () => (timeScale = parseFloat(timeSpeed.value));

  function togglePanel(panel) {
    [panelDecor, panelTheme, panelDex].forEach(p => {
      if (p !== panel) p.style.display = 'none';
    });
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
    mode = panel === panelDecor ? 'decor' : mode;
  }

  let W = 0,
    H = 0;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Utilities
  const rand = (a, b) => Math.random() * (b - a) + a;
  const randi = (a, b) => Math.floor(rand(a, b));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const chance = p => Math.random() < p;
  const uuid = (() => {
    let i = 0;
    return () => (++i).toString(36) + '-' + Date.now().toString(36);
  })();

  // Game State
  let mode = 'food'; // 'food' | 'decor'
  let paused = false;
  pauseEl.onchange = () => (paused = pauseEl.checked);

  const patterns = ['solid', 'stripes', 'spots', 'gradient'];
  const fins = ['long', 'round', 'fan', 'pointy'];
  const eyes = ['round', 'sleepy', 'sparkly', 'winking'];

  const fish = [];
  const pellets = [];
  const decors = [];
  let generation = 1;
  let discovered = new Set();

  const MAX_FISH_BASE = 60;

  // Time & theme
  let time = 0; // seconds
  let timeScale = 1; // adjustable via UI
  let theme = 'day';
  function setTheme(t) {
    theme = t;
    toast(`Theme: ${t}`);
  }

  // Bubbles
  const bubbles = {
    pool: [],
    targetDensity: 0.6,
    update(dt) {
      if (this.pool.length < this.targetDensity * 120) {
        this.pool.push({ x: rand(0, W), y: rand(H * 0.6, H + 30), r: rand(1, 4), v: rand(20, 50) });
      }
      this.pool.forEach(b => {
        b.y -= b.v * dt;
        if (b.y < -10) {
          b.y = H + rand(0, 60);
          b.x = rand(0, W);
        }
      });
    },
    draw() {
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = '#ffffff';
      this.pool.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
  };

  // Pellets
  function addPellet(x, y) {
    pellets.push({ id: uuid(), x, y, vy: 20 + rand(0, 30), r: 4 });
  }

  // Genetics helpers
  function inheritNum(a, b) {
    return Math.random() < 0.5 ? a : b;
  }
  function mutateNum(v) {
    if (chance(0.05)) return clamp(v + (chance(0.5) ? 1 : -1), 0, 9);
    return v;
  }
  function inheritList(a, b) {
    return Math.random() < 0.5 ? a : b;
  }
  function mutateHue(h) {
    if (chance(0.05)) return (h + randi(-20, 21) + 360) % 360;
    return h;
  }
  function maybeShiny(rarityGene) {
    return chance(0.02 + rarityGene * 0.002);
  }

  configureFish({
    getSize: () => ({ W, H }),
    ctx,
    pellets,
    decors,
    fish,
    discovered,
    toast,                   // this is a function declaration, so it’s hoisted
    incGeneration: () => { generation++; },
    maxFish: MAX_FISH_BASE,
  });

  // Initial population - mark initial fish as favorites
  for (let i = 0; i < 10; i++) fish.push(makeFish({ initialFish: true }));

  // Input
  let mouse = { x: 0, y: 0, down: false };
  let dragging = null;
  let dragOffset = { x: 0, y: 0 };

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    if (dragging) {
      dragging.x = clamp(mouse.x - dragOffset.x, 10, W - 10);
      dragging.y = clamp(mouse.y - dragOffset.y, 10, H - 10);
    }
  });
  canvas.addEventListener('mousedown', e => {
    mouse.down = true;
    const f = pickFish(mouse.x, mouse.y);
    if (f) {
      dragging = f;
      dragging.drag = true;
      dragOffset.x = mouse.x - f.x;
      dragOffset.y = mouse.y - f.y;
    }
  });
  window.addEventListener('mouseup', () => {
    mouse.down = false;
    if (dragging) {
      dragging.drag = false;
      dragging = null;
    }
  });

  canvas.addEventListener('click', e => {
    const f = pickFish(mouse.x, mouse.y);
    if (f) {
      showFishCard(f);
    } else if (panelDecor.style.display === 'block') {
      placeDecor(mouse.x, mouse.y);
    }
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'f' || e.key === 'F') {
      mode = 'food';
      addPellet(mouse.x, mouse.y);
    }
  });

  // Fish Card UI
  let selectedFish = null;

  function showFishCard(f) {
    selectedFish = f;
  
    // Clear previous selection ring
    fish.forEach(ff => (ff.selected = false));
    f.selected = true;
  
    fishCard.style.display = 'block';
    fishCard.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <button id="toggleFav" style="background:none; border:none; cursor:pointer; font-size:1.5em; color:${
          f.favorite ? '#ffd700' : '#888'
        }; padding:4px;" title="${
          f.favorite ? 'Remove from favorites' : 'Add to favorites'
        }">${f.favorite ? '★' : '☆'}</button>
        <strong id="fc-name">${f.name || 'Unnamed Fish'}</strong>
        <span class="badge" id="fc-sex">${f.sex}</span>
        <span class="badge" id="fc-stage"></span>
        <span class="badge" id="fc-shiny" style="display:${f.shiny ? 'inline' : 'none'}">✨ Shiny</span>
      </div>
  
      <div class="small">ID: <span id="fc-id"></span></div>
      <div class="small">Age: <span id="fc-age"></span> • Size: <span id="fc-size"></span></div>
      <div class="small" id="fc-core-stats"></div>
      <div class="small" id="fc-appearance"></div>
      <div class="small" id="fc-parents"></div>
  
      <label class="small">Rename</label>
      <input type="text" id="renameFish" placeholder="Type a name…" value="${f.name || ''}" />
      <div style="display:flex; gap:6px; margin-top:6px;">
        <button id="saveName">Save</button>
        <button id="releaseFish" style="background-color: #ff4444; color: white;">Release</button>
        <button id="closeCard">Close</button>
      </div>
    `;
  
    // One-time handlers
    const save = fishCard.querySelector('#saveName');
    const close = fishCard.querySelector('#closeCard');
    const input = fishCard.querySelector('#renameFish');
    const favBtn = fishCard.querySelector('#toggleFav');
    const releaseBtn = fishCard.querySelector('#releaseFish');
  
  
    save.onclick = () => {
      f.name = input.value.trim();
      toast('Fish renamed');
      // no full rebuild; just live refresh
      refreshFishCard(); 
    };
  
    close.onclick = () => {
      fishCard.style.display = 'none';
      if (selectedFish) selectedFish.selected = false;
      selectedFish = null;
    };
  
    favBtn.onclick = e => {
      e.stopPropagation();
      f.favorite = !f.favorite;
      toast(f.favorite ? 'Added to favorites' : 'Removed from favorites');
      refreshFishCard(); // update star color/title instantly
    };

    // Release button handler
    releaseBtn.onclick = () => {
      // Play sound with 1000ms fade out at the end
      playSound(Sounds.release, { fadeOutDuration: 1000 });
      // Remove fish from the array
      const idx = fish.findIndex(fish => fish.id === f.id);
      if (idx >= 0) fish.splice(idx, 1);
      fishCard.style.display = 'none';
      selectedFish = null;
      toast('Fish has been released!');
    };

    // First fill
    refreshFishCard();
  }


  function refreshFishCard() {
    if (!selectedFish || fishCard.style.display !== 'block') return;
  
    const f = selectedFish;
  
    // If the fish got removed (eaten/despawned), auto-close the card
    const stillThere = fish.find(x => x.id === f.id);
    if (!stillThere) {
      fishCard.style.display = 'none';
      selectedFish = null;
      return;
    }
  
    // Basic refs
    const byId = (sel) => fishCard.querySelector(sel);
    const favBtn = byId('#toggleFav');
  
    // Top line
    byId('#fc-name').textContent = f.name || 'Unnamed Fish';
    byId('#fc-sex').textContent = f.sex;
  
    // Stage badge (Young/Adult/Dead)
    const stage = f.dead ? 'Dead' : (isAdult(f) ? 'Adult' : 'Young');
    byId('#fc-stage').textContent = stage;
  
    // Shiny badge visibility is static once spawned, but keep it in sync anyway
    const shinyEl = byId('#fc-shiny');
    shinyEl.style.display = f.shiny ? 'inline' : 'none';
  
    // Basic Info
    byId('#fc-id').textContent = f.id;
    byId('#fc-age').textContent = (f.age / 60).toFixed(1) + ' min';
    byId('#fc-size').textContent = `${f.size.toFixed(0)} (${f.birthSize ?? 2}-${f.maxSize ?? 30})`;
    
    // Core Stats
    byId('#fc-core-stats').textContent =
      `Speed: ${f.speed} | Sense: ${f.senseRadius} | Hunger: ${f.hungerDrive} | Rarity: ${f.rarityGene} | Con: ${f.constitution ?? 5}`;
      
    // Appearance
    byId('#fc-appearance').textContent =
      `Hue: ${f.colorHue} | Pattern: ${f.patternType} | Fin: ${f.finShape} | Eye: ${f.eyeType}`;
      
    // Parents
    byId('#fc-parents').textContent =
      f.parents ? `Parents: ${f.parents.ma} × ${f.parents.pa}` : '— wild origin —';
  
    // Favorite star
    favBtn.textContent = f.favorite ? '★' : '☆';
    favBtn.style.color = f.favorite ? '#ffd700' : '#888';
    favBtn.title = f.favorite ? 'Remove from favorites' : 'Add to favorites';
  }
  
  

  function refreshDex() {
    dexList.innerHTML = '';
    const arr = Array.from(discovered).sort();
    discEl.textContent = `Discovered: ${arr.length}`;
    if (arr.length === 0) {
      dexList.innerHTML = '<div class="notice">Discover new pattern/fin combos by breeding!</div>';
      return;
    }
    arr.forEach(k => {
      const [p, f] = k.split('-');
      const div = document.createElement('div');
      div.innerHTML = `<span class="badge">${p}</span> <span class="badge">${f}</span>`;
      dexList.appendChild(div);
    });
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.display = 'block';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(() => (toastEl.style.display = 'none'), 1500);
  }

  configureDecor({
    getSize: () => ({ W, H }),
    ctx,
    decors,
    toast,
    rand,               // reuse your local rand
  });
  configureDecorRenderer({
    ctx,
    getSize: () => ({ W, H }),
    decors,
    rand,
  });

  // Main loop
  let last = performance.now();
  let dtGlobal = 0;
  function loop(now) {
    const dt = ((now - last) / 1000) * timeScale;
    last = now;
    dtGlobal = dt;
    if (!paused) {
      time += dt;
      update(dt);
    }
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    // pellets fall
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i];
      p.y += p.vy * dt;
      if (p.y > H - 8) p.vy = 0;
      if (p.y > H + 20) pellets.splice(i, 1);
    }

    // fish
    for (const f of fish) {
      updateFish(f, dt);
    }

    // breeding
    handleBreeding(dt);

    // bubbles
    bubbles.update(dt);

    popEl.textContent = `Fish: ${fish.length}`;
    genEl.textContent = `Gen: ${generation}`;

    // ...after fish update, breeding, bubbles.update(dt), counters...
if (selectedFish && fishCard.style.display === 'block') {
  refreshFishCard();
}

  }

  function draw() {
    drawBackground(ctx, W, H, theme);
    drawDecor();

    // pellets
    ctx.fillStyle = 'rgba(255,200,80,0.95)';
    pellets.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    fish.forEach(f => drawFish(f));
    bubbles.draw();
  }

    // Kick off
    requestAnimationFrame(loop);
  }
  
