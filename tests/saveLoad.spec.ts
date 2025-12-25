// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { DEFAULT_SAVE_DATA } from '../src/utils/gameDataValidator';
import { storageManager } from '../src/utils/localStorageManager';
import { backupManager } from '../src/utils/BackupManager';
import { gameState } from '../src/state/GameState';

function makeFishCollection(count: number) {
  return Array.from({ length: count }, (_, idx) => {
    const id = `fish-${idx + 1}`;
    return {
      id,
      name: `Fish ${idx + 1}`,
      timestamp: Date.now(),
      fishData: {
        id,
        name: `Fish ${idx + 1}`,
        species: 'default',
        senseGene: 5,
        speed: 5,
        hungerDrive: 5,
        rarityGene: 5,
        constitution: 5,
        colorHue: 120,
        patternType: 'solid',
        finShape: 'fan',
        eyeType: 'round'
      }
    };
  });
}

describe('saveLoad', () => {
  it('restores backup into gameState fish collection', async () => {
    localStorage.clear();
    const initialData = {
      ...DEFAULT_SAVE_DATA,
      fishCollection: makeFishCollection(10)
    };

    storageManager.save(initialData as any);
    gameState.load(storageManager.load());

    const backupData = {
      version: '1.0.0',
      gameState: {
        ...initialData,
        fishCollection: undefined
      },
      fishCollection: makeFishCollection(6)
    };

    const result = await backupManager.restoreBackup(JSON.stringify(backupData), true);
    expect(result).toBe(true);
    expect(gameState.getState().fishCollection.length).toBe(6);
  });

  it('normalizes senseRadius on backup and restore', async () => {
    localStorage.clear();
    const fishWithLegacySense = {
      id: 'fish-legacy-1',
      name: 'Legacy Sense',
      timestamp: Date.now(),
      fishData: {
        id: 'fish-legacy-1',
        name: 'Legacy Sense',
        species: 'default',
        senseRadius: 100
      }
    };
    gameState.load({
      ...DEFAULT_SAVE_DATA,
      fishCollection: [fishWithLegacySense]
    } as any);

    const backupJson = backupManager.createBackup();
    const backup = JSON.parse(backupJson);
    const savedFishData = backup.fishCollection[0].fishData;
    expect(savedFishData.senseGene).toBe(5);
    expect('senseRadius' in savedFishData).toBe(false);

    const result = await backupManager.restoreBackup(backupJson, true);
    expect(result).toBe(true);
    const restoredFishData = gameState.getState().fishCollection[0].fishData;
    expect(restoredFishData.senseGene).toBe(5);
    expect('senseRadius' in restoredFishData).toBe(false);
  });

  it('preserves gene-style stats and appearance when restoring legacy fish data', async () => {
    localStorage.clear();
    const legacyFish = {
      id: 'fish-legacy-appearance',
      name: 'Legacy Appearance',
      timestamp: Date.now(),
      fishData: {
        id: 'fish-legacy-appearance',
        name: 'Legacy Appearance',
        species: 'unknown',
        speed: 7,
        senseRadius: 4,
        colorHue: 275,
        patternType: 'stripes',
        finShape: 'pointy',
        eyeType: 'winking'
      }
    };

    const backupData = {
      version: '1.0.0',
      gameState: {
        ...DEFAULT_SAVE_DATA,
        fishCollection: undefined
      },
      fishCollection: [legacyFish]
    };

    const result = await backupManager.restoreBackup(JSON.stringify(backupData), true);
    expect(result).toBe(true);
    const restoredFishData = gameState.getState().fishCollection[0].fishData;
    expect(restoredFishData.senseGene).toBe(4);
    expect(restoredFishData.speed).toBe(7);
    expect(restoredFishData.colorHue).toBe(275);
    expect(restoredFishData.patternType).toBe('stripes');
    expect(restoredFishData.finShape).toBe('pointy');
    expect(restoredFishData.eyeType).toBe('winking');
    expect('senseRadius' in restoredFishData).toBe(false);
  });
});
