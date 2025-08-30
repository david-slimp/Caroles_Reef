// @ts-nocheck
/**
 * Fish Card UI extracted from legacy code.
 * Exposes showFishCard() and refreshIfVisible() while keeping behavior identical.
 */
import { playSound, Sounds } from '../utils/audio';
import { isAdult } from '../entities/fish';
import { storageManager } from '../utils/localStorageManager';

type Deps = {
  fish: any[];
  tankFishIds: Set<string>;
  fishCardEl: HTMLElement;
  toast: (msg: string, isError?: boolean) => void;
};

export function createFishCardUI({ fish, tankFishIds, fishCardEl, toast }: Deps) {
  let selectedFish: any = null;

  function closeCard() {
    fishCardEl.style.display = 'none';
    if (selectedFish) selectedFish.selected = false;
    selectedFish = null;
  }

  function refreshFishCard() {
    if (!selectedFish || fishCardEl.style.display !== 'block') return;
    const f = selectedFish;
    const stillThere = fish.find((x) => x.id === f.id);
    if (!stillThere) return closeCard();

    // Helpers
    const byId = (sel: string) => fishCardEl.querySelector(sel) as HTMLElement;
    const favBtn = byId('#toggleFav');

    byId('#fc-name').textContent = f.name || 'Unnamed Fish';
    byId('#fc-sex').textContent = f.sex;

    const stage = f.dead ? 'Dead' : (isAdult(f) ? 'Adult' : 'Young');
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

    byId('#fc-parents').textContent =
      f.parents ? `Parents: ${f.parents.ma} × ${f.parents.pa}` : '— wild origin —';

    favBtn.textContent = f.favorite ? '★' : '☆';
    (favBtn as any).style.color = f.favorite ? '#ffd700' : '#888';
    favBtn.setAttribute('title', f.favorite ? 'Remove from favorites' : 'Add to favorites');
  }

  async function showFishCard(f: any) {
    selectedFish = f;
    // Clear selection ring
    fish.forEach((ff) => (ff.selected = false));
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

    save.onclick = async () => {
      const newName = input.value.trim();
      if (!newName) return;
      f.name = newName;
      toast('Fish renamed');

      if (f.originalId) {
        try {
          const { fishCollection } = await import('../ui/FishCollection');
          const savedFish = fishCollection.getSavedFish();
          const fishIndex = savedFish.findIndex((x: any) => x.id === f.originalId || x.id === f.id);
          if (fishIndex !== -1) {
            savedFish[fishIndex].name = newName;
            if (savedFish[fishIndex].fishData) {
              savedFish[fishIndex].fishData.name = newName;
            }
            const currentData = storageManager.getCurrentData();
            currentData.fishCollection = savedFish;
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

    close.onclick = () => closeCard();

    favBtn.onclick = (e) => {
      e.stopPropagation();
      f.favorite = !f.favorite;
      toast(f.favorite ? 'Added to favorites' : 'Removed from favorites');
      refreshFishCard();
    };

    saveToCollectionBtn.onclick = async (e) => {
      e.stopPropagation();
      try {
        const fishData: any = {
          id: f.id,
          name: f.name || `Fish ${fish.length + 1}`,
          species: f.species || 'unknown',
          colorHue: f.colorHue,
          patternType: f.patternType,
          finShape: f.finShape,
          eyeType: f.eyeType,
          size: f.size,
          maxSize: f.maxSize,
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
          toast('Fish saved to collection!');
          saveToCollectionBtn.textContent = 'Saved to Collection';
          (saveToCollectionBtn as any).style.backgroundColor = '#2e7d32';
          saveToCollectionBtn.disabled = true;
        } else {
          toast('Failed to save fish to collection', true);
        }
      } catch (err) {
        console.error('Error saving fish to collection:', err);
        toast('Error saving fish to collection', true);
      }
    };

    releaseBtn.onclick = () => {
      if (!selectedFish) return;
      playSound(Sounds.release, { fadeOutDuration: 1000 });
      const index = fish.findIndex((x) => x.id === selectedFish.id);
      if (index !== -1) {
        tankFishIds.delete(selectedFish.originalId || selectedFish.id);
        fish.splice(index, 1);
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
