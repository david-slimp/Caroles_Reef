// @ts-nocheck
/**
 * Fish Card UI extracted from legacy code.
 * Exposes showFishCard() and refreshIfVisible() while keeping behavior identical.
 */
import { isAdult } from '../entities/fish';
import { gameState } from '../state/GameState';
import { playSound, Sounds } from '../utils/audio';

type Deps = {
  fish: any[];
  tankFishIds: Set<string>;
  fishCardEl: HTMLElement;
  toast: (msg: string, isError?: boolean) => void;
};

export function createFishCardUI({ fish, tankFishIds, fishCardEl, toast }: Deps) {
  let selectedFish: any = null;
  const breedingHud = ensureBreedingHud();
  let showBreedingHud = false;

  function closeCard() {
    fishCardEl.style.display = 'none';
    breedingHud.style.display = 'none';
    showBreedingHud = false;
    if (selectedFish) selectedFish.selected = false;
    selectedFish = null;
  }

  function refreshFishCard() {
    if (!selectedFish || fishCardEl.style.display !== 'block') return;
    const f = selectedFish;
    const stillThere = fish.find(x => x.id === f.id);
    if (!stillThere) return closeCard();

    // Helpers
    const byId = (sel: string) => fishCardEl.querySelector(sel) as HTMLElement;
    const favBtn = byId('#toggleFav');

    byId('#fc-name').textContent = f.name || 'Unnamed Fish';
    byId('#fc-sex').textContent = f.sex;

    const stage = f.dead ? 'Dead' : isAdult(f) ? 'Adult' : 'Young';
    byId('#fc-stage').textContent = stage;

    const shinyEl = byId('#fc-shiny');
    shinyEl.style.display = f.shiny ? 'inline' : 'none';

    byId('#fc-id').textContent = f.id;
    byId('#fc-age').textContent = (f.age / 60).toFixed(1) + ' min';
    byId('#fc-size').textContent = `${f.size.toFixed(0)} (${f.birthSize ?? 2}-${f.maxSize ?? 30})`;

    byId('#fc-core-stats').textContent =
      `Speed: ${f.speed} | Sense: ${f.senseGene} | Hunger: ${f.hungerDrive} | Rarity: ${f.rarityGene} | Con: ${f.constitution ?? 5}`;

    byId('#fc-appearance').textContent =
      `Hue: ${f.colorHue} | Pattern: ${f.patternType} | Fin: ${f.finShape} | Eye: ${f.eyeType}`;

    byId('#fc-parents').textContent = f.parents
      ? `Parents: ${f.parents.ma} × ${f.parents.pa}`
      : '— wild origin —';

    favBtn.textContent = f.favorite ? '★' : '☆';
    (favBtn as any).style.color = f.favorite ? '#ffd700' : '#888';
    favBtn.setAttribute('title', f.favorite ? 'Remove from favorites' : 'Add to favorites');

    if (showBreedingHud) {
      updateBreedingHud(f, fish);
    }
  }

  async function showFishCard(f: any) {
    selectedFish = f;
    // Clear selection ring
    fish.forEach(ff => (ff.selected = false));
    f.selected = true;

    fishCardEl.style.display = 'block';
    fishCardEl.innerHTML = `
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
        <button id="toggleBreedingHud" style="margin-left:auto; background:#1f3a4d; border:1px solid #2a4a6a; color:#cfe9ff; border-radius:6px; padding:2px 8px; cursor:pointer; font-size:11px;">Breeding</button>
      </div>

      <div class="small">ID: <span id="fc-id"></span></div>
      <div class="small">Age: <span id="fc-age"></span> • Size: <span id="fc-size"></span></div>
      <div class="small" id="fc-core-stats"></div>
      <div class="small" id="fc-appearance"></div>
      <div class="small" id="fc-parents"></div>

      <label class="small">Rename</label>
      <input type="text" id="renameFish" placeholder="Type a name…" value="${f.name || ''}" />
      <div style="display:flex; flex-direction: column; gap: 6px; margin-top: 12px;">
        <div style="display: flex; gap: 6px;">
          <button id="saveName" style="flex: 1;">Save Name</button>
          <button id="releaseFish" style="background-color: #ff4444; color: white;">Release</button>
          <button id="closeCard">Close</button>
        </div>
        <button id="saveToCollection" style="background-color: #4CAF50; color: white; padding: 8px 0;">
          Save to Collection
        </button>
      </div>
    `;

    const save = fishCardEl.querySelector('#saveName') as HTMLButtonElement;
    const close = fishCardEl.querySelector('#closeCard') as HTMLButtonElement;
    const input = fishCardEl.querySelector('#renameFish') as HTMLInputElement;
    const favBtn = fishCardEl.querySelector('#toggleFav') as HTMLButtonElement;
    const releaseBtn = fishCardEl.querySelector('#releaseFish') as HTMLButtonElement;
    const saveToCollectionBtn = fishCardEl.querySelector('#saveToCollection') as HTMLButtonElement;
    const breedingBtn = fishCardEl.querySelector('#toggleBreedingHud') as HTMLButtonElement;

    save.onclick = async () => {
      const newName = input.value.trim();
      if (!newName) return;
      f.name = newName;
      toast('Fish renamed');

      if (f.originalId || f.id) {
        try {
          const { fishCollection } = await import('../ui/FishCollection');
          const savedFish = fishCollection.getSavedFish();
          const fishIndex = savedFish.findIndex((x: any) => x.id === f.originalId || x.id === f.id);
          if (fishIndex !== -1) {
            savedFish[fishIndex].name = newName;
            if (savedFish[fishIndex].fishData) {
              savedFish[fishIndex].fishData.name = newName;
            }
            gameState.updateState({ fishCollection: savedFish });
            if (fishCollection.isVisible()) {
              fishCollection.refreshCollection();
            }
          }
        } catch (err) {
          console.error('Error updating fish name in collection:', err);
        }
      }
      refreshFishCard();
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save.click();
      }
    });

    close.onclick = () => closeCard();

    breedingBtn.onclick = () => {
      showBreedingHud = !showBreedingHud;
      if (showBreedingHud) {
        updateBreedingHud(f, fish);
      } else {
        breedingHud.style.display = 'none';
      }
    };

    favBtn.onclick = e => {
      e.stopPropagation();
      f.favorite = !f.favorite;
      toast(f.favorite ? 'Added to favorites' : 'Removed from favorites');
      refreshFishCard();
    };

    saveToCollectionBtn.onclick = async e => {
      e.stopPropagation();
      try {
        const fishData: any = {
          id: f.id,
          name: f.name || 'NEW',
          species: f.species || 'unknown',
          colorHue: f.colorHue,
          patternType: f.patternType,
          finShape: f.finShape,
          eyeType: f.eyeType,
          size: f.size,
          maxSize: f.maxSize,
          x: f.x,
          y: f.y,
          age: f.age,
          sex: f.sex,
          speed: f.speed,
          senseGene: f.senseGene,
          hungerDrive: f.hungerDrive,
          energy: f.energy,
          health: f.health,
          rarityGene: f.rarityGene,
          constitution: f.constitution,
          generation: f.generation,
          shiny: f.shiny,
          parents: f.parents ? { ...f.parents } : undefined,
          favorite: f.favorite,
          ...(f.color && { color: f.color }),
          ...(f.pattern && { pattern: f.pattern }),
          ...(f.eyeColor && { eyeColor: f.eyeColor }),
          ...(f.finColor && { finColor: f.finColor }),
        };

        const { fishCollection } = await import('../ui/FishCollection');
        const saved = fishCollection.saveFish(fishData);
        if (saved) {
          f.originalId = saved.id || f.originalId || f.id;
          saveToCollectionBtn.textContent = 'Saved to Collection';
          (saveToCollectionBtn as any).style.backgroundColor = '#2e7d32';
          saveToCollectionBtn.disabled = true;
        }
      } catch (err) {
        console.error('Error saving fish to collection:', err);
      }
    };

    releaseBtn.onclick = () => {
      if (!selectedFish) return;
      playSound(Sounds.release, { fadeOutDuration: 1000 });
      const index = fish.findIndex(x => x.id === selectedFish.id);
      if (index !== -1) {
        tankFishIds.delete(selectedFish.originalId || selectedFish.id);
        fish.splice(index, 1);
        const currentState = gameState.getState();
        const fishInTank = [...(currentState.fishInTank || [])];
        const fishInTankOriginalIds = [...(currentState.fishInTankOriginalIds || [])];
        const fishIndex = fishInTank.findIndex(fishId => fishId === selectedFish.id);
        if (fishIndex >= 0) {
          fishInTank.splice(fishIndex, 1);
        }
        const originalId = selectedFish.originalId;
        if (originalId) {
          const originalIndex = fishInTankOriginalIds.findIndex(savedId => savedId === originalId);
          if (originalIndex >= 0) {
            fishInTankOriginalIds.splice(originalIndex, 1);
          }
        }
        gameState.updateState({ fishInTank, fishInTankOriginalIds });
      }
      closeCard();
      toast('Fish has been released!');
    };

    refreshFishCard();
  }

  function refreshIfVisible() {
    if (selectedFish && fishCardEl.style.display === 'block') refreshFishCard();
  }

  return { showFishCard, refreshIfVisible, close: closeCard };
}

function ensureBreedingHud(): HTMLElement {
  let hud = document.getElementById('breedingHud');
  if (hud) return hud;

  hud = document.createElement('div');
  hud.id = 'breedingHud';
  hud.style.display = 'none';
  document.body.appendChild(hud);
  return hud;
}

function updateBreedingHud(f: any, tankFish: any[]): void {
  const hud = document.getElementById('breedingHud');
  if (!hud) return;

  const mate = f._mateId ? tankFish.find((m: any) => m.id === f._mateId) : null;
  const mateDistance = mate ? Math.hypot(mate.x - f.x, mate.y - f.y) : null;
  const senseRadius = typeof f.senseGene === 'number' ? f.senseGene * 20 : 0;
  const hungerRadius =
    typeof f.senseGene === 'number' ? f.senseGene * ((f.hungerDrive || 0) * 2.1) + 5 : 0;
  const adultAgeSec = 4 * 60;
  const adultSize = (f.maxSize || 30) * 0.5;
  const isAdult =
    typeof f.age === 'number' && typeof f.size === 'number'
      ? f.age >= adultAgeSec && f.size >= adultSize
      : false;
  const ageRemaining = typeof f.age === 'number' ? Math.max(0, adultAgeSec - f.age) : null;
  const sizeRemaining = typeof f.size === 'number' ? Math.max(0, adultSize - f.size) : null;
  const maxFish = 60;
  const canSeekMate = tankFish.length < maxFish;

  hud.innerHTML = `
    <div class="breeding-hud-title">Breeding HUD</div>
    <div class="breeding-hud-line"><strong>ID:</strong> ${f.id}</div>
    <div class="breeding-hud-line"><strong>Sex:</strong> ${f.sex || '—'} | <strong>Adult:</strong> ${isAdult ? 'yes' : 'no'}</div>
    ${isAdult ? '' : `<div class="breeding-hud-line"><strong>Adult in:</strong> ${formatSeconds(ageRemaining)} | <strong>Size:</strong> ${formatNumber(sizeRemaining)}</div>`}
    <div class="breeding-hud-line"><strong>State:</strong> ${f.state || '—'}</div>
    <div class="breeding-hud-line"><strong>canMate:</strong> ${f.canMate === false ? 'no' : 'yes'}</div>
    <div class="breeding-hud-line"><strong>Tank:</strong> ${tankFish.length}/${maxFish} | <strong>Seek Mate:</strong> ${canSeekMate ? 'yes' : 'no'}</div>
    <div class="breeding-hud-line"><strong>_breedCd:</strong> ${formatNumber(f._breedCd)}</div>
    <div class="breeding-hud-line"><strong>_eatCd:</strong> ${formatNumber(f._eatCd)}</div>
    <div class="breeding-hud-line"><strong>_mateId:</strong> ${f._mateId || '—'}</div>
    <div class="breeding-hud-line"><strong>_ritualTimer:</strong> ${formatNumber(f._ritualTimer)}</div>
    <div class="breeding-hud-line"><strong>senseGene:</strong> ${formatNumber(f.senseGene)}</div>
    <div class="breeding-hud-line"><strong>senseRadius:</strong> ${formatNumber(senseRadius)}</div>
    <div class="breeding-hud-line"><strong>hungerRadius:</strong> ${formatNumber(hungerRadius)}</div>
    <div class="breeding-hud-line"><strong>mateDistance:</strong> ${mateDistance != null ? formatNumber(mateDistance) : '—'}</div>
  `;

  hud.style.display = 'block';
}

function formatNumber(value: any): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '—';
}

function formatSeconds(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}m ${seconds}s`;
}
