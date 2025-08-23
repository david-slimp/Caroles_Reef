(() => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
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

  // Controls
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

  // Decorations
  const decorSelect = { type: 'plant', size: 'm' };
  function decorRadius(size) {
    return size === 's' ? 30 : size === 'm' ? 50 : 80;
  }
  function placeDecor(x, y) {
    const r = decorRadius(decorSelect.size);
    decors.push({ id: uuid(), type: decorSelect.type, x, y, r, size: decorSelect.size });
    toast(`Placed ${decorSelect.type}`);
  }
  function nearDecorType(x, y, type, rad) {
    return decors.some(d => d.type === type && Math.hypot(d.x - x, d.y - y) <= (rad || d.r));
  }

  // Pellets
  function addPellet(x, y) {
    pellets.push({ id: uuid(), x, y, vy: 40 + rand(0, 30), r: 4 });
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

  // Fish factory
  function makeFish(opts = {}) {
    const id = uuid();
    const base = {
      id,
      name: '',
      x: rand(40, W - 40),
      y: rand(40, H - 40),
      vx: rand(-30, 30),
      vy: rand(-30, 30),
      dir: rand(0, Math.PI * 2),
      size: opts.size ?? randi(6, 14),
      age: 0, // seconds
      sex: chance(0.5) ? 'F' : 'M',
      speed: randi(2, 8),
      senseRadius: randi(80, 180),
      hungerDrive: randi(2, 8),
      rarityGene: randi(0, 9),
      colorHue: randi(0, 360),
      patternType: patterns[randi(0, patterns.length)],
      finShape: fins[randi(0, fins.length)],
      eyeType: eyes[randi(0, eyes.length)],
      parents: opts.parents || null,
      shiny: false,
      favorite: opts.initialFish || false, // Initial fish are favorites, babies are not
      state: 'wander',
      drag: false,
      _breedCd: 0,
    };
    base.shiny = maybeShiny(base.rarityGene);
    if (opts.override) {
      Object.assign(base, opts.override);
    }
    trackDiscovery(base);
    return base;
  }

  function breed(a, b) {
    const babies = [];
    for (let i = 0; i < 3; i++) {
      const speed = mutateNum(inheritNum(a.speed, b.speed));
      const senseRadius = mutateNum(inheritNum(a.senseRadius, b.senseRadius));
      const hungerDrive = mutateNum(inheritNum(a.hungerDrive, b.hungerDrive));
      const rarityGene = mutateNum(inheritNum(a.rarityGene, b.rarityGene));
      const colorHue = mutateHue(inheritNum(a.colorHue, b.colorHue));
      const patternType = inheritList(a.patternType, b.patternType);
      const finShape = inheritList(a.finShape, b.finShape);
      const eyeType = inheritList(a.eyeType, b.eyeType);
      const f = makeFish({
        size: 2,
        parents: { ma: a.id, pa: b.id },
        initialFish: false, // Baby fish are not favorites by default
        override: {
          speed,
          senseRadius,
          hungerDrive,
          rarityGene,
          colorHue,
          patternType,
          finShape,
          eyeType,
        },
      });
      if (nearDecorType((a.x + b.x) / 2, (a.y + b.y) / 2, 'coral', 90)) {
        if (chance(0.1)) f.shiny = true;
      }
      babies.push(f);
    }
    toast('New fry hatched! (+3)');
    generation++;
    return babies;
  }

  function trackDiscovery(f) {
    const key = `${f.patternType}-${f.finShape}`;
    if (!discovered.has(key)) discovered.add(key);
  }
  function isAdult(f) {
    return f.size >= 20;
  }
  function isYoung(f) {
    return f.age < 5 * 60;
  }

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

  function pickFish(x, y) {
    for (let i = fish.length - 1; i >= 0; i--) {
      const f = fish[i];
      if (Math.hypot(f.x - x, f.y - y) < Math.max(16, f.size)) {
        return f;
      }
    }
    return null;
  }

  // Fish AI
  function updateFish(f, dt) {
    f.age += dt;

    // Elderly: after 5 minutes of adulthood, rise and despawn (unless favorited)
    if (isAdult(f) && f.age > 5 * 60 + 5 * 60 && !f.favorite) {
      f.y -= 8 * dt * 60;
      if (f.y < -20) {
        removeFish(f.id);
      }
      return;
    }

    // Target selection: food vs mate
    let target = null;
    let bestFood = null,
      bestFoodDist = Infinity;
    const eff = f.senseRadius * (0.9 + 0.7 * (f.hungerDrive / 9));
    for (const p of pellets) {
      const d = Math.hypot(p.x - f.x, p.y - f.y);
      if (d < eff && d < bestFoodDist) {
        bestFood = p;
        bestFoodDist = d;
      }
    }
    let bestMate = null,
      bestMateDist = Infinity;
    if (isAdult(f)) {
      for (const m of fish) {
        if (m === f) continue;
        if (!isAdult(m)) continue;
        if (m.sex === f.sex) continue;
        const d = Math.hypot(m.x - f.x, m.y - f.y);
        if (d < f.senseRadius && d < bestMateDist) {
          bestMate = m;
          bestMateDist = d;
        }
      }
    }
    if (bestMate && (!bestFood || bestMateDist < bestFoodDist * 0.8 || Math.random() < 0.3)) {
      f.state = 'seekMate';
      target = bestMate;
    } else if (bestFood) {
      f.state = 'seekFood';
      target = bestFood;
    } else {
      f.state = 'wander';
    }

    // Decor influences
    let speedBoost = 1;
    if (nearDecorType(f.x, f.y, 'plant', 60)) speedBoost += 0.1; // braver
    if (nearDecorType(f.x, f.y, 'rock', 60) && !isAdult(f)) speedBoost -= 0.1; // hiding babies

    // Movement — horizontal bias
    // Increased base speed multiplier from 6 to 10 for more noticeable speed differences
    const baseSpeed = 20 + f.speed * 10; // px/sec (increased from *6)
    if (target) {
      const tx = target.x;
      const ty = target.y;
      const dx = tx - f.x;
      const dy = ty - f.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        // Increased target-seeking speed multiplier from 0.1 to 0.15
        const seekFactor = 0.15;
        f.vx += (dx / dist) * f.speed * seekFactor;
        f.vy += (dy / dist) * f.speed * seekFactor;
      }
      const ux = dx / dist;
      const uy = dy / dist;
      const uyBias = uy * 0.6;
      f.vx += ux * baseSpeed * 0.9 * dt * speedBoost;
      f.vy += uyBias * baseSpeed * 0.9 * dt * speedBoost;
    } else {
      // wander movement - increased from 0.04 to 0.06 for more noticeable speed differences
      const wanderFactor = 0.06;
      f.vx += Math.cos(f.dir) * f.speed * wanderFactor;
      f.vy += Math.sin(f.dir) * f.speed * wanderFactor;
    }

    // clamp velocity
    const vmax = baseSpeed * 0.8 * speedBoost;
    const v = Math.hypot(f.vx, f.vy);
    if (v > vmax) {
      f.vx *= vmax / v;
      f.vy *= vmax / v;
    }

    // integrate (damp vertical for calm swimming)
    f.vy *= 0.9;
    f.x += f.vx * dt;
    f.y += f.vy * dt;

    // bounds
    if (f.x < 10) {
      f.x = 10;
      f.vx = Math.abs(f.vx);
    }
    if (f.x > W - 10) {
      f.x = W - 10;
      f.vx = -Math.abs(f.vx);
    }
    if (f.y < 10) {
      f.y = 10;
      f.vy = Math.abs(f.vy);
    }
    if (f.y > H - 10) {
      f.y = H - 10;
      f.vy = -Math.abs(f.vy);
    }

    // facing
    f.dir = Math.atan2(f.vy, f.vx);

    // eat pellets => growth ONLY through eating
    for (let i = pellets.length - 1; i >= 0; i--) {
      const p = pellets[i];
      if (Math.hypot(p.x - f.x, p.y - f.y) < Math.max(12, f.size * 0.85)) {
        pellets.splice(i, 1);
        f.size += 2;
        f.size = Math.min(f.size, 120);
      }
    }

    // reduce breeding cooldown
    if (f._breedCd > 0) f._breedCd -= dt;
  }

  function removeFish(id) {
    const idx = fish.findIndex(f => f.id === id);
    if (idx >= 0) fish.splice(idx, 1);
  }

  // Collisions for breeding
  function handleBreeding(dt) {
    for (let i = 0; i < fish.length; i++) {
      const a = fish[i];
      if (!isAdult(a)) continue;
      for (let j = i + 1; j < fish.length; j++) {
        const b = fish[j];
        if (!isAdult(b)) continue;
        if (a.sex === b.sex) continue;
        if (a._breedCd > 0 || b._breedCd > 0) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < (a.size + b.size) * 0.55) {
          const babies = breed(a, b);
          for (const nb of babies) {
            if (fish.length < MAX_FISH_BASE) fish.push(nb);
          }
          a._breedCd = b._breedCd = 6; // seconds
        }
      }
    }
  }

  // Background gradient day-night
  function drawBackground() {
    let top, mid, bot;
    if (theme === 'day') {
      top = '#7ec8ff';
      mid = '#59a8e6';
      bot = '#2a6db6';
    } else if (theme === 'dusk') {
      top = '#6a6ad1';
      mid = '#4f66a8';
      bot = '#233c74';
    } else {
      top = '#0b1540';
      mid = '#0a1c4f';
      bot = '#0a2a66';
    }

    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, top);
    grd.addColorStop(0.5, mid);
    grd.addColorStop(1, bot);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  // Draw decorations
  function drawDecor() {
    decors.forEach(d => {
      ctx.save();
      ctx.translate(d.x, d.y);
      if (d.type === 'plant') {
        ctx.strokeStyle = 'rgba(80,255,120,0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-10 + i * 5, -d.r * 0.3, rand(-5, 5), -d.r);
        }
        ctx.stroke();
      } else if (d.type === 'coral') {
        ctx.fillStyle = 'rgba(255,120,180,0.8)';
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.arc(
            rand(-d.r * 0.5, d.r * 0.5),
            rand(-d.r * 0.4, d.r * 0.2),
            rand(6, 12),
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      } else if (d.type === 'rock') {
        ctx.fillStyle = 'rgba(60,60,70,0.9)';
        ctx.beginPath();
        ctx.ellipse(0, 0, d.r * 0.6, d.r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (d.type === 'chest') {
        ctx.fillStyle = 'rgba(170,120,40,0.95)';
        ctx.fillRect(-d.r * 0.4, -d.r * 0.2, d.r * 0.8, d.r * 0.4);
        ctx.fillStyle = 'rgba(240,200,60,0.9)';
        ctx.fillRect(-d.r * 0.4, -d.r * 0.22, d.r * 0.8, 4);
      }
      ctx.restore();
    });
  }

  // Draw fish (with name labels)
  function drawFish(f) {
    // Draw selection highlight if this fish is selected
    if (f.selected) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(f.x, f.y, Math.max(16, f.size) + 8, 0, Math.PI * 2);
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.dir);

    if (f.shiny) {
      ctx.shadowColor = `hsla(${f.colorHue}, 80%, 70%, 0.9)`;
      ctx.shadowBlur = 16;
    }

    const bodyLen = clamp(f.size * 2.2, 16, 140);
    const bodyHt = clamp(f.size * 1.2, 10, 80);

    const base = `hsl(${f.colorHue} 70% 55%)`;
    const darker = `hsl(${(f.colorHue + 330) % 360} 70% 35%)`;
    const lighter = `hsl(${f.colorHue} 80% 70%)`;

    // tail (fin shape)
    ctx.fillStyle = lighter;
    ctx.beginPath();
    const tailW =
      f.finShape === 'long'
        ? bodyHt * 0.9
        : f.finShape === 'fan'
          ? bodyHt * 1.1
          : f.finShape === 'pointy'
            ? bodyHt * 0.6
            : bodyHt * 0.8;
    const tailL =
      f.finShape === 'long'
        ? bodyLen * 0.45
        : f.finShape === 'fan'
          ? bodyLen * 0.35
          : f.finShape === 'pointy'
            ? bodyLen * 0.4
            : bodyLen * 0.3;
    ctx.moveTo(-bodyLen * 0.5, 0);
    ctx.quadraticCurveTo(-bodyLen * 0.5 - tailL * 0.5, -tailW * 0.2, -bodyLen * 0.5 - tailL, 0);
    ctx.quadraticCurveTo(-bodyLen * 0.5 - tailL * 0.5, tailW * 0.2, -bodyLen * 0.5, 0);
    ctx.fill();

    // body gradient
    const grd = ctx.createLinearGradient(-bodyLen * 0.5, 0, bodyLen * 0.5, 0);
    if (f.patternType === 'solid') {
      grd.addColorStop(0, base);
      grd.addColorStop(1, base);
    } else if (f.patternType === 'gradient') {
      grd.addColorStop(0, base);
      grd.addColorStop(1, lighter);
    } else if (f.patternType === 'stripes') {
      grd.addColorStop(0, base);
      grd.addColorStop(1, darker);
    } else if (f.patternType === 'spots') {
      grd.addColorStop(0, lighter);
      grd.addColorStop(1, base);
    }
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyLen * 0.5, bodyHt * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // overlay patterns
    if (f.patternType === 'stripes') {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      for (let x = -bodyLen * 0.4; x < bodyLen * 0.5; x += bodyLen * 0.15) {
        ctx.fillRect(x, -bodyHt * 0.5, bodyLen * 0.03, bodyHt);
      }
      ctx.globalAlpha = 1;
    }
    if (f.patternType === 'spots') {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#000';
      for (let s = 0; s < 6; s++) {
        ctx.beginPath();
        ctx.arc(
          rand(-bodyLen * 0.3, bodyLen * 0.3),
          rand(-bodyHt * 0.3, bodyHt * 0.3),
          rand(2, 4),
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // eye
    ctx.fillStyle = '#fff';
    const eyeX = bodyLen * 0.22;
    const eyeY = -bodyHt * 0.1;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, Math.max(2, bodyHt * 0.12), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(eyeX + 1, eyeY, Math.max(1, bodyHt * 0.06), 0, Math.PI * 2);
    ctx.fill();

    // mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(bodyLen * 0.5 - 2, 0, 2, 0.2, -0.2);
    ctx.stroke();

    // NAME LABEL (upright)
    if (f.name) {
      ctx.save();
      ctx.rotate(-f.dir); // un-rotate so text is upright
      const fontPx = Math.max(10, Math.floor(f.size * 0.45));
      ctx.font = `${fontPx}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      const w = ctx.measureText(f.name).width;
      const pad = 4;
      const y = -bodyHt * 0.8;
      const h = fontPx + 4;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-w / 2 - pad / 2, y - h + 2, w + pad, h);
      ctx.fillStyle = '#fff';
      ctx.fillText(f.name, 0, y);
      ctx.restore();
    }

    ctx.restore();
  }

  // Fish Card UI
  let selectedFish = null;
  function showFishCard(f) {
    selectedFish = f;
    // Update all fish to remove selection highlight
    fish.forEach(fish => (fish.selected = false));
    f.selected = true; // Mark this fish as selected

    fishCard.style.display = 'block';
    fishCard.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <button id="toggleFav" style="background:none; border:none; cursor:pointer; font-size:1.5em; color:${f.favorite ? '#ffd700' : '#888'}; padding:4px;" title="${f.favorite ? 'Remove from favorites' : 'Add to favorites'}">
          ${f.favorite ? '★' : '☆'}
        </button>
        <strong>${f.name || 'Unnamed Fish'}</strong>
        <span class="badge">${f.sex}</span>
        <span class="badge">${isAdult(f) ? 'Adult' : 'Young'}</span>
        ${f.shiny ? '<span class="badge">✨ Shiny</span>' : ''}
      </div>
      <div class="small">ID: ${f.id}</div>
      <div class="small">Age: ${(f.age / 60).toFixed(1)} min • Size: ${f.size.toFixed(0)} px</div>
      <div class="small">Traits: Speed ${f.speed}, Sense ${f.senseRadius}, Hunger ${f.hungerDrive}, Rarity ${f.rarityGene}</div>
      <div class="small">Look: Hue ${f.colorHue}, ${f.patternType}, fin ${f.finShape}, eye ${f.eyeType}</div>
      <div class="small">Parents: ${f.parents ? f.parents.ma + ' × ' + f.parents.pa : '— wild'}</div>
      <label class="small">Rename</label>
      <input type="text" id="renameFish" placeholder="Type a name…" value="${f.name || ''}" />
      <div style="display:flex; gap:6px; margin-top:6px;">
        <button id="saveName">Save</button>
        <button id="closeCard">Close</button>
      </div>
    `;
    const save = fishCard.querySelector('#saveName');
    const close = fishCard.querySelector('#closeCard');
    const input = fishCard.querySelector('#renameFish');
    const favBtn = fishCard.querySelector('#toggleFav');

    save.onclick = () => {
      f.name = input.value.trim();
      toast('Fish renamed');
      showFishCard(f);
    };
    close.onclick = () => {
      fishCard.style.display = 'none';
      if (selectedFish) selectedFish.selected = false;
      selectedFish = null;
    };
    favBtn.onclick = e => {
      e.stopPropagation();
      f.favorite = !f.favorite;
      showFishCard(f);
      toast(f.favorite ? 'Added to favorites' : 'Removed from favorites');
    };
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
  }

  function draw() {
    drawBackground();
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
})();
