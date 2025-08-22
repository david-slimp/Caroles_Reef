// /src/ui/FishCollection.ts

import { getSavedFish, removeSavedFish, SavedFish } from '../utils/fishStorage';

const FISH_COLLECTION_ID = 'fishCollectionPanel';

class FishCollection {
  private panel: HTMLElement | null = null;
  private onSelectFish: ((fishData: any) => void) | null = null;
  private sortColumn: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  
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
  /**
   * Sort fish collection based on current sort column and direction
   */
  private sortFishCollection(fishList: SavedFish[]): SavedFish[] {
    if (!this.sortColumn) return fishList;

    console.log(`Sorting by ${this.sortColumn} (${this.sortDirection})`);
    
    // Debug: Log the first few fish with their properties
    console.log('Sample fish data:', fishList.slice(0, 3).map(f => ({
      name: f.name,
      fishData: {
        ...f.fishData,
        // Only include relevant properties to keep the log clean
        ...(this.sortColumn === 'speed' && { speed: f.fishData.speed }),
        ...(this.sortColumn === 'sense' && { senseRadius: f.fishData.senseRadius }),
        ...(this.sortColumn === 'hue' && { colorHue: f.fishData.colorHue })
      }
    })));
    
    const sorted = [...fishList].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      let isNumeric = false;

      // Handle different column types
      switch (this.sortColumn) {
        case 'name':
          valueA = a.name?.toLowerCase() || '';
          valueB = b.name?.toLowerCase() || '';
          break;
        case 'id':
          valueA = a.id;
          valueB = b.id;
          break;
        case 'age':
          valueA = Number(a.fishData.age || 0);
          valueB = Number(b.fishData.age || 0);
          isNumeric = true;
          break;
        case 'size':
          valueA = Number(a.fishData.size || 0);
          valueB = Number(b.fishData.size || 0);
          isNumeric = true;
          break;
        case 'speed':
          // Debug: Log the entire fish data structure for the first fish
          if (a.fishData) {
            console.log('Fish data structure for speed sort:', {
              name: a.name,
              fishData: a.fishData,
              speed: a.fishData.speed,
              speedType: typeof a.fishData.speed,
              allNumericProperties: Object.entries(a.fishData)
                .filter(([_, v]) => typeof v === 'number')
                .map(([k, v]) => `${k}: ${v} (${typeof v})`)
            });
          }
          
          // Try to get speed value from different possible locations
          const getSpeed = (fish: any): number => {
            // Check direct property
            if (typeof fish.fishData.speed === 'number') return fish.fishData.speed;
            
            // Check for other possible speed properties
            const possibleSpeedProps = ['movementSpeed', 'speedValue', 'baseSpeed', 'spd'];
            for (const prop of possibleSpeedProps) {
              if (typeof fish.fishData[prop] === 'number') return fish.fishData[prop];
            }
            
            // Default to 0 if no speed found
            return 0;
          };
          
          valueA = getSpeed(a);
          valueB = getSpeed(b);
          
          console.log(`Sorting speeds - ${a.name}: ${valueA}, ${b.name}: ${valueB}`);
          isNumeric = true;
          break;
        case 'sense':
          valueA = Number(a.fishData.senseRadius || 0);
          valueB = Number(b.fishData.senseRadius || 0);
          isNumeric = true;
          break;
        case 'hue':
          // Handle hue values (0-360)
          valueA = Number(a.fishData.colorHue || 0);
          valueB = Number(b.fishData.colorHue || 0);
          isNumeric = true;
          break;
        case 'fins':
          valueA = a.fishData.finShape?.toLowerCase() || '';
          valueB = b.fishData.finShape?.toLowerCase() || '';
          break;
        case 'pattern':
          valueA = a.fishData.patternType?.toLowerCase() || '';
          valueB = b.fishData.patternType?.toLowerCase() || '';
          break;
        default:
          return 0;
      }

      // Compare values
      let comparison = 0;
      if (isNumeric) {
        // For numeric comparisons, ensure we're comparing numbers
        comparison = valueA - valueB;
      } else {
        // For string comparisons
        if (valueA > valueB) comparison = 1;
        else if (valueA < valueB) comparison = -1;
      }

      // Apply sort direction
      const result = this.sortDirection === 'asc' ? comparison : -comparison;
      
      // Debug log
      if (this.sortColumn === 'speed') {
        console.log(`Comparing speed: ${a.fishData.speed} vs ${b.fishData.speed} = ${result}`);
      } else if (this.sortColumn === 'sense') {
        console.log(`Comparing sense: ${a.fishData.senseRadius} vs ${b.fishData.senseRadius} = ${result}`);
      } else if (this.sortColumn === 'hue') {
        console.log(`Comparing hue: ${a.fishData.colorHue} vs ${b.fishData.colorHue} = ${result}`);
      }
      
      return result;
    });
    
    // Debug log the sorted order
    if (this.sortColumn === 'speed') {
      console.log('Sorted speed values:', sorted.map(f => ({
        name: f.name,
        speed: f.fishData.speed,
        speedType: typeof f.fishData.speed,
        rawSpeed: f.fishData.speed
      })));
    } else if (this.sortColumn === 'sense') {
      console.log('Sorted order:', sorted.map(f => ({
        name: f.name,
        senseRadius: f.fishData.senseRadius,
        senseType: typeof f.fishData.senseRadius
      })));
    }
    
    return sorted;
  }

  /**
   * Handle column header click for sorting
   */
  private handleSort(column: string): void {
    console.log(`handleSort called for column: ${column}`);
    
    if (this.sortColumn === column) {
      // Toggle sort direction if clicking the same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    // Debug: Log the fish data structure for the first few fish
    const fishList = this.getSavedFish();
    console.log('Fish data structure sample:', fishList.slice(0, 3).map(fish => ({
      name: fish.name,
      fishData: {
        ...Object.entries(fish.fishData).reduce((acc, [key, value]) => {
          // Only include numeric or relevant properties to keep the log clean
          if (typeof value === 'number' || key === 'speed' || key === 'senseRadius' || key === 'colorHue') {
            acc[key] = value;
          }
          return acc;
        }, {} as Record<string, any>)
      }
    })));
    
    // Debug: Log the first few fish's values for the current column
    if (column === 'speed' || column === 'sense' || column === 'hue') {
      console.log(`First 5 fish ${column} values:`, fishList.slice(0, 5).map(f => {
        const value = column === 'sense' ? f.fishData.senseRadius :
                     column === 'hue' ? f.fishData.colorHue :
                     f.fishData.speed;
        return {
          name: f.name,
          [column]: value,
          type: typeof value,
          rawValue: value
        };
      }));
    }
    
    this.render();
  }

  private render(): void {
    if (!this.panel) return;
    
    const savedFish = this.getSavedFish();
    const sortedFish = this.sortFishCollection(savedFish);
    
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
          user-select: none;
        }
        
        .sortable {
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .sortable:hover {
          background-color: rgba(255, 255, 255, 0.1);
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
        
        .name.editable {
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 3px;
          transition: background-color 0.2s;
        }
        
        .name.editable:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .fish-name-input {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: inherit;
          font-size: inherit;
          outline: none;
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
              <th style="min-width: 120px;" class="sortable" data-column="name">
                Name ${this.sortColumn === 'name' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="min-width: 120px;" class="sortable" data-column="id">
                ID ${this.sortColumn === 'id' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 50px;" class="sortable" data-column="age">
                Age ${this.sortColumn === 'age' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 50px;" class="sortable" data-column="size">
                Size ${this.sortColumn === 'size' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 60px;" class="sortable" data-column="speed">
                Speed ${this.sortColumn === 'speed' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 60px;" class="sortable" data-column="sense">
                Sense ${this.sortColumn === 'sense' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 50px;" class="sortable" data-column="hue">
                Hue ${this.sortColumn === 'hue' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 40px;">Color</th>
              <th style="min-width: 80px;" class="sortable" data-column="fins">
                Fins ${this.sortColumn === 'fins' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="min-width: 80px;" class="sortable" data-column="pattern">
                Pattern ${this.sortColumn === 'pattern' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th style="width: 40px;">×</th>
            </tr>
          </thead>
          <tbody>
            ${sortedFish.length > 0 ? 
              sortedFish.map(fish => this.createFishCard(fish)).join('') : 
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
    
    // Add sort handlers to column headers
    this.panel?.querySelectorAll('.sortable').forEach(header => {
      header.addEventListener('click', (e) => {
        const column = (e.currentTarget as HTMLElement).getAttribute('data-column');
        if (column) {
          this.handleSort(column);
        }
      });
      
      // Add hover effect
      header.addEventListener('mouseenter', () => {
        (header as HTMLElement).style.cursor = 'pointer';
        (header as HTMLElement).style.textDecoration = 'underline';
      });
      
      header.addEventListener('mouseleave', () => {
        (header as HTMLElement).style.textDecoration = 'none';
      });
    });
    
    // Add event delegation for all interactive elements
    this.panel?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      // Handle delete button clicks
      const deleteBtn = target.closest('.btn-delete');
      if (deleteBtn) {
        e.preventDefault();
        e.stopPropagation();
        const fishId = deleteBtn.getAttribute('data-id');
        if (fishId) {
          if (confirm('Are you sure you want to remove this fish from your collection?')) {
            this.removeFish(fishId);
          }
        }
        return;
      }
      
      // Handle name clicks for editing
      const nameElement = target.closest('.name.editable') as HTMLElement;
      if (nameElement) {
        e.stopPropagation();
        const fishId = nameElement.getAttribute('data-fish-id');
        if (fishId) {
          this.startRenamingFish(fishId, nameElement);
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
          <div class="fish-name-cell" data-fish-id="${fish.id}">
            <span class="name editable" data-fish-id="${fish.id}" title="Click to rename">${fishName}</span>
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
   * Start renaming a fish
   */
  private startRenamingFish(fishId: string, nameElement: HTMLElement): void {
    const savedFish = this.getSavedFish();
    const fish = savedFish.find(f => f.id === fishId);
    if (!fish) return;
    
    const currentName = fish.name || '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'fish-name-input';
    input.style.width = `${Math.max(100, currentName.length * 8)}px`;
    
    // Replace the name with an input field
    nameElement.replaceWith(input);
    input.focus();
    
    // Select all text in the input
    input.select();
    
    // Handle input submission
    const handleSubmit = () => {
      const newName = input.value.trim();
      if (newName && newName !== currentName) {
        this.renameFish(fishId, newName);
      } else {
        // Revert to original name if empty or unchanged
        const span = document.createElement('span');
        span.className = 'name editable';
        span.setAttribute('data-fish-id', fishId);
        span.textContent = currentName;
        span.title = 'Click to rename';
        input.replaceWith(span);
      }
    };
    
    // Handle Enter key or blur
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        const span = document.createElement('span');
        span.className = 'name editable';
        span.setAttribute('data-fish-id', fishId);
        span.textContent = currentName;
        span.title = 'Click to rename';
        input.replaceWith(span);
      }
    });
    
    input.addEventListener('blur', handleSubmit);
  }
  
  /**
   * Rename a fish in the collection and update all references
   */
  private renameFish(fishId: string, newName: string): boolean {
    try {
      const savedFish = this.getSavedFish();
      const fishIndex = savedFish.findIndex(f => f.id === fishId);
      
      if (fishIndex === -1) return false;
      
      // Get the original fish data
      const fishData = savedFish[fishIndex];
      const originalId = fishData.fishData.originalId || fishData.fishData.id;
      
      // Update the fish name in the collection
      fishData.name = newName;
      fishData.fishData.name = newName;
      
      // Save back to localStorage
      localStorage.setItem('caroles_reef_saved_fish', JSON.stringify(savedFish));
      
      // Update the fish in the tank if it exists
      try {
        const env = (window as any).env;
        if (env && Array.isArray(env.fish)) {
          // Find the fish in the tank by originalId or id
          const tankFish = env.fish.find((f: any) => 
            f.originalId === originalId || f.id === originalId || f.id === fishId
          );
          
          if (tankFish) {
            // Update the fish name in the tank
            tankFish.name = newName;
            
            // If the fish card is open for this fish, update its name
            const fishCard = document.getElementById('fishCard');
            if (fishCard && fishCard.style.display === 'block') {
              const nameElement = fishCard.querySelector('#fc-name');
              if (nameElement) {
                nameElement.textContent = newName || 'Unnamed Fish';
              }
              
              // Also update the input field if it's currently being edited
              const inputElement = fishCard.querySelector('input[type="text"]') as HTMLInputElement;
              if (inputElement && inputElement.id === 'renameFish') {
                inputElement.value = newName;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error updating fish in tank:', error);
      }
      
      // Update the UI
      this.refreshCollection();
      
      // Show success message
      this.showNotification('Fish renamed successfully');
      
      return true;
    } catch (error) {
      console.error('Error renaming fish:', error);
      this.showNotification('Failed to rename fish', true);
      return false;
    }
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
