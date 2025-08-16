// /src/ui/FishCollection.ts

import { getSavedFish, removeSavedFish, SavedFish } from '../utils/fishStorage';

const FISH_COLLECTION_ID = 'fishCollectionPanel';

class FishCollection {
  private panel: HTMLElement | null = null;
  private onSelectFish: ((fishData: any) => void) | null = null;
  
  constructor() {
    this.initializeUI();
  }
  
  private initializeUI(): void {
    // Create the panel if it doesn't exist
    if (!document.getElementById(FISH_COLLECTION_ID)) {
      this.panel = document.createElement('div');
      this.panel.id = FISH_COLLECTION_ID;
      this.panel.className = 'panel';
      this.panel.style.display = 'none';
      
      // Add panel to the document
      const uiContainer = document.getElementById('ui') || document.body;
      uiContainer.appendChild(this.panel);
      
      // Initial render
      this.render();
      
      // Set up event listeners
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.panel?.style.display === 'block') {
          this.hide();
        }
      });
      
      // Close when clicking outside
      this.panel.addEventListener('click', (e) => {
        if (e.target === this.panel) {
          this.hide();
        }
      });
    }
  }
  
  public show(onSelectFish?: (fishData: any) => void): void {
    try {
      console.log('FishCollection.show() called');
      
      if (!this.panel) {
        console.log('Initializing panel...');
        this.initializeUI();
      }
      
      if (this.panel) {
        console.log('Panel found, showing...');
        this.onSelectFish = onSelectFish || null;
        this.render();
        this.panel.style.display = 'block';
        console.log('Panel should now be visible');
      } else {
        console.error('Failed to initialize panel');
      }
    } catch (error) {
      console.error('Error in FishCollection.show():', error);
    }
  }
  
  public hide(): void {
    this.panel!.style.display = 'none';
    this.onSelectFish = null;
  }
  
  /**
   * Check if the collection panel is currently visible
   */
  public isVisible(): boolean {
    return this.panel ? this.panel.style.display === 'block' : false;
  }
  
  /**
   * Render the collection panel
   */
  private render(): void {
    if (!this.panel) return;
    
    const savedFish = this.getSavedFish();
    
    this.panel.innerHTML = `
      <style>
        .fish-collection-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-top: 10px;
        }
        
        .fish-collection-table th {
          text-align: left;
          padding: 8px 12px;
          background: rgba(0,0,0,0.2);
          border-bottom: 2px solid rgba(255,255,255,0.1);
          font-weight: 600;
          color: #ccc;
          position: sticky;
          top: 0;
        }
        
        .fish-collection-table td {
          padding: 6px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          vertical-align: middle;
        }
        
        .fish-row:hover {
          background: rgba(255,255,255,0.05);
        }
        
        .fish-name {
          min-width: 150px;
        }
        
        .fish-name-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .fish-icon {
          display: inline-flex;
          opacity: 0.8;
        }
        
        .color-swatch {
          display: inline-block;
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.2);
          vertical-align: middle;
        }
        
        .indicators {
          margin-left: 4px;
          color: #ffcc00;
        }
        
        .btn-add, .btn-delete {
          background: none;
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-size: 14px;
          line-height: 1;
        }
        
        .btn-add:hover {
          background: rgba(100, 200, 100, 0.2);
          border-color: #6c6;
        }
        
        .btn-delete:hover {
          background: rgba(200, 100, 100, 0.2);
          border-color: #c66;
        }
        
        .fish-stats-row {
          display: flex;
          justify-content: space-between;
          margin-top: 8px;
        }
      </style>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>My Fish Collection</h3>
        <button id="closeCollection" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer;">&times;</button>
      </div>
      <style>
        .table-wrapper {
          max-height: 70vh;
          overflow: auto;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 4px;
        }
        
        .fish-collection-table {
          width: 100%;
          min-width: 1000px;
          table-layout: fixed;
        }
        
        .fish-collection-table th,
        .fish-collection-table td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .fish-actions {
          display: flex;
          gap: 4px;
          justify-content: flex-end;
        }
        
        .fish-id {
          font-family: monospace;
          max-width: 150px;
        }
      </style>
      <div class="table-wrapper">
        <table class="fish-collection-table">
          <thead>
            <tr>
              <th style="width: 40px;">+</th>
              <th style="min-width: 120px;">Name</th>
              <th style="min-width: 120px;">ID</th>
              <th style="width: 50px;">Age</th>
              <th style="width: 50px;">Size</th>
              <th style="width: 60px;">Speed</th>
              <th style="width: 60px;">Sense</th>
              <th style="width: 50px;">Hue</th>
              <th style="width: 40px;">Color</th>
              <th style="min-width: 80px;">Fins</th>
              <th style="min-width: 80px;">Pattern</th>
              <th style="width: 40px;">×</th>
            </tr>
          </thead>
          <tbody>
            ${savedFish.length > 0 ? 
              savedFish.map(fish => this.createFishCard(fish)).join('') : 
              `<tr><td colspan="11" class="no-fish">No fish in your collection yet. Select a fish and click "Save to Collection".</td></tr>`
            }
          </tbody>
        </table>
      </div>
      <div class="collection-actions">
        <button id="closeCollectionBtn">Close</button>
      </div>
    `;
    
    // Add event listeners
    document.getElementById('closeCollection')?.addEventListener('click', () => this.hide());
    document.getElementById('closeCollectionBtn')?.addEventListener('click', () => this.hide());
    
    // Use event delegation for delete buttons
    this.panel?.addEventListener('click', (e) => {
      const deleteBtn = (e.target as HTMLElement).closest('.btn-delete');
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const fishId = deleteBtn.getAttribute('data-id');
        if (fishId) {
          if (confirm('Are you sure you want to remove this fish from your collection?')) {
            this.removeFish(fishId);
          }
        }
      }
    });
    
    // Add event listeners for select buttons
    savedFish.forEach(fish => {
      const selectBtn = document.getElementById(`select-fish-${fish.id}`);
      if (selectBtn) {
        selectBtn.addEventListener('click', () => {
          if (this.onSelectFish) {
            this.onSelectFish(fish);
          }
          this.hide();
        });
      }
    });
  }
  
  private createFishCard(fish: SavedFish): string {
    const fishData = fish.fishData;
    const fishName = fish.name || 'Unnamed Fish';
    
    // Format stats
    const formatStat = (value: number) => value !== undefined ? Math.floor(value).toString() : 'N/A';
    
    // Create a tiny color swatch
    const colorSwatch = `<span class="color-swatch" style="background-color: hsl(${fishData.colorHue || 0}, 80%, 50%)" title="Hue ${fishData.colorHue || 0}°"></span>`;
    
    // Create favorite and shiny indicators
    const indicators = [
      fishData.favorite ? '★' : '',
      fishData.shiny ? '✨' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <tr class="fish-row" data-id="${fish.id}">
        <td class="fish-add">
          <button class="btn-add" id="select-fish-${fish.id}" title="Add to tank">+</button>
        </td>
        <td class="fish-name">
          <div class="fish-name-cell">
            <span class="name">${fishName}</span>
            ${indicators ? `<span class="indicators">${indicators}</span>` : ''}
          </div>
        </td>
        <td class="fish-id" title="${fish.id}">${fish.id}</td>
        <td class="fish-age">${Math.floor(fishData.age || 0)}</td>
        <td class="fish-size">${formatStat(fishData.size)}</td>
        <td class="fish-speed">${formatStat(fishData.speed)}</td>
        <td class="fish-sense">${formatStat(fishData.senseRadius)}</td>
        <td class="fish-hue">${fishData.colorHue || 0}°</td>
        <td class="fish-color">${colorSwatch}</td>
        <td class="fish-fins">${fishData.finShape || '—'}</td>
        <td class="fish-pattern">${fishData.patternType || '—'}</td>
        <td class="fish-actions">
          <button class="btn-delete" data-id="${fish.id}" title="Delete from collection">×</button>
        </td>
      </tr>
    `;
  }
  
  /**
   * Get all saved fish from local storage
   */
  public getSavedFish(): SavedFish[] {
    try {
      const saved = localStorage.getItem('caroles_reef_saved_fish');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading saved fish:', error);
      return [];
    }
  }
  
  private refreshCollection(): void {
    if (this.panel) {
      this.render();
    }
  }
  
  private removeFish(fishId: string): boolean {
    try {
      const savedFish = this.getSavedFish();
      const initialLength = savedFish.length;
      const updatedFish = savedFish.filter(fish => fish.id !== fishId);
      
      if (updatedFish.length < initialLength) {
        localStorage.setItem('caroles_reef_saved_fish', JSON.stringify(updatedFish));
        
        // Force a complete re-render of the collection
        this.render();
        
        // Show success notification
        this.showNotification('Fish removed from collection');
        
        // If no fish left, close the collection panel
        if (updatedFish.length === 0) {
          this.hide();
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing fish:', error);
      this.showNotification('Failed to remove fish', true);
      return false;
    }
  }
  
  private confirmDeleteFish(fishId: string): void {
    if (confirm('Are you sure you want to remove this fish from your collection?')) {
      this.removeFish(fishId);
    }
  }
  
  private confirmClearCollection(): void {
    if (confirm('Are you sure you want to clear your entire fish collection? This cannot be undone.')) {
      localStorage.removeItem('caroles_reef_saved_fish');
      this.refreshCollection();
      this.showNotification('Collection cleared');
    }
  }
  
  private showNotification(message: string, isError: boolean = false): void {
    // You can replace this with your existing notification system
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }, 100);
  }
  
  /**
   * Save a fish to the collection
   */
  public saveFish(fishData: any, name: string = ''): SavedFish | null {
    try {
      const savedFish = this.getSavedFish();
      
      // Generate a new ID if one doesn't exist
      const fishId = fishData.id || `fish_${Date.now()}`;
      
      // Check if this fish already exists in the collection (by ID or originalId)
      const existingIndex = savedFish.findIndex(fish => {
        // Match by ID
        if (fish.id === fishId) return true;
        
        // Match by originalId if present
        const fishOriginalId = fish.fishData?.originalId || fish.fishData?.id;
        const newFishOriginalId = fishData.originalId || fishData.id;
        
        return fishOriginalId && newFishOriginalId && fishOriginalId === newFishOriginalId;
      });

      // Create the fish data object
      const fishToSave = {
        ...fishData,
        id: fishId,
        name: name || fishData.name || `Fish ${savedFish.length + 1}`,
        saveDate: new Date().toISOString()
      };

      const savedFishItem: SavedFish = {
        id: fishId,
        name: fishToSave.name,
        saveDate: fishToSave.saveDate,
        fishData: fishToSave,
        species: fishToSave.species || 'unknown',
        rarity: fishToSave.rarityGene ? `Tier ${fishToSave.rarityGene}` : 'Common',
        generation: fishToSave.generation || 1
      };

      if (existingIndex >= 0) {
        // Update existing fish
        savedFish[existingIndex] = savedFishItem;
      } else {
        // Add new fish
        savedFish.push(savedFishItem);
      }
      
      // Save to localStorage
      localStorage.setItem('caroles_reef_saved_fish', JSON.stringify(savedFish));
      
      // Refresh the collection view if it's open
      this.refreshCollection();
      
      return savedFishItem;
    } catch (error) {
      console.error('Error saving fish to collection:', error);
      this.showNotification('Failed to save fish to collection', true);
      return null;
    }
  }

  /**
   * Spawn a fish from saved data into the tank
   */
  public spawnFishFromData(fishData: any): boolean {
    try {
      // Find the global fish array and other necessary variables
      // @ts-ignore - Accessing global variables from the game
      const fish = window.fish;
      if (!fish || !Array.isArray(fish)) {
        console.error('Could not find fish array');
        this.showNotification('Failed to add fish to tank', true);
        return false;
      }
      
      // Create a new fish based on the saved data
      const newFish = { ...fishData.fishData };
      return true;
      
    } catch (error) {
      console.error('Error spawning fish:', error);
      this.showNotification('Failed to add fish to tank', true);
      return false;
    }
  }
}

// Create and export a singleton instance
const fishCollection = new FishCollection();

// Make it globally available
if (typeof window !== 'undefined') {
  (window as any).fishCollection = fishCollection;
}

export { fishCollection };
