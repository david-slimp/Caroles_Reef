// /src/ui/FishCardActions.ts

import { saveFish, getSavedFish, removeSavedFish } from '../utils/fishStorage';
import { fishCollection } from './FishCollection';

export function addFishCardActions(fishCard: HTMLElement, fishData: any): void {
  // Create actions container if it doesn't exist
  let actionsDiv = fishCard.querySelector('.fish-actions') as HTMLElement;
  if (!actionsDiv) {
    actionsDiv = document.createElement('div');
    actionsDiv.className = 'fish-actions';
    fishCard.appendChild(actionsDiv);
  }
  
  // Check if fish is already saved
  const isSaved = checkIfFishIsSaved(fishData);
  
  // Create or update save button
  let saveBtn = fishCard.querySelector('.btn-save-fish') as HTMLButtonElement;
  if (!saveBtn) {
    saveBtn = document.createElement('button');
    saveBtn.className = `btn-save-fish ${isSaved ? 'saved' : ''}`;
    saveBtn.innerHTML = isSaved ? '✓ Saved' : 'Save to Collection';
    saveBtn.title = isSaved ? 'View in Collection' : 'Save this fish to your collection';
    
    saveBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (isSaved) {
        if (confirm('This fish is already in your collection. Remove it?')) {
          const removed = removeSavedFish(fishData.id);
          if (removed) {
            showToast('Fish removed from collection');
            saveBtn.textContent = 'Save to Collection';
            saveBtn.classList.remove('saved');
          }
        }
      } else {
        const saved = await saveFishToCollection(fishData);
        if (saved) {
          showToast('Fish saved to collection!');
          saveBtn.textContent = '✓ Saved';
          saveBtn.classList.add('saved');
        }
      }
    });
    
    actionsDiv.appendChild(saveBtn);
  }
  
  // Add View Collection button
  let viewCollectionBtn = fishCard.querySelector('.btn-view-collection') as HTMLButtonElement;
  if (!viewCollectionBtn) {
    viewCollectionBtn = document.createElement('button');
    viewCollectionBtn.className = 'btn-view-collection';
    viewCollectionBtn.textContent = 'View Collection';
    viewCollectionBtn.title = 'View your fish collection';
    
    viewCollectionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Import dynamically to avoid circular dependencies
      import('./FishCollection').then(({ fishCollection }) => {
        fishCollection.show();
      });
    });
    
    actionsDiv.appendChild(viewCollectionBtn);
  }
  
  // Add some basic styling
  if (!document.getElementById('fish-card-styles')) {
    const style = document.createElement('style');
    style.id = 'fish-card-styles';
    style.textContent = `
      .fish-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
      }
      
      .btn-save-fish, .btn-view-collection {
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 6px 12px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      }
      
      .btn-save-fish:hover, .btn-view-collection:hover {
        background-color: #3a7bc8;
      }
      
      .btn-save-fish.saved {
        background-color: #4caf50;
      }
      
      .btn-save-fish.saved:hover {
        background-color: #3d8b40;
      }
    `;
    document.head.appendChild(style);
  }
}

function checkIfFishIsSaved(fishData: any): boolean {
  if (!fishData?.id) return false;
  try {
    const savedFish = getSavedFish();
    return savedFish.some(f => f.fishData?.id === fishData.id);
  } catch (e) {
    console.error('Error checking if fish is saved:', e);
    return false;
  }
}

function prepareFishData(fishData: any): any {
  // Create a deep clone of the fish data to avoid reference issues
  const dataToSave = JSON.parse(JSON.stringify(fishData));
  
  // Only save essential properties to reduce storage size
  const essentialProps = [
    'id', 'name', 'species', 'generation', 'rarity', 'sex', 'age', 'size',
    'birthSize', 'maxSize', 'color', 'pattern', 'genes', 'traits',
    'birthDate', 'parents', 'favorite', 'discoveredAt'
  ];
  
  const filteredData: any = {};
  essentialProps.forEach(prop => {
    if (dataToSave[prop] !== undefined) {
      filteredData[prop] = dataToSave[prop];
    }
  });
  
  return filteredData;
}

function showToast(message: string, isError: boolean = false): void {
  // Create a simple toast notification
  {
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${isError ? 'error' : 'success'}`;
    toastEl.textContent = message;
    document.body.appendChild(toastEl);
    
    setTimeout(() => {
      toastEl.classList.add('show');
      setTimeout(() => {
        toastEl.remove();
      }, 3000);
    }, 100);
  }
}

// Add styles for fish card actions
const style = document.createElement('style');
style.textContent = `
  .fish-actions {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  
  .fish-actions button {
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    transition: all 0.2s;
    background-color: #4a90e2;
    color: white;
    flex: 1;
    white-space: nowrap;
  }
  
  .fish-actions button:hover {
    opacity: 0.9;
  }
  
  .btn-save-fish.saved {
    background-color: #2ecc71 !important;
  }
  
  
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    z-index: 2000;
    transition: transform 0.3s ease-in-out;
  }
  
  .toast.show {
    transform: translateX(-50%) translateY(0);
  }
  
  .toast.error {
    background: rgba(231, 76, 60, 0.9);
  }
`;

document.head.appendChild(style);
