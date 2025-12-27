// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';

import { gameState } from '../src/state/GameState';
import { backupManager } from '../src/utils/BackupManager';
import { DEFAULT_SAVE_DATA } from '../src/utils/gameDataValidator';
import { GameSaveData, storageManager } from '../src/utils/localStorageManager';

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
        eyeType: 'round',
      },
    };
  });
}

describe('saveLoad', () => {
  it('restores backup into gameState fish collection', async () => {
    localStorage.clear();
    const initialData: GameSaveData = {
      ...DEFAULT_SAVE_DATA,
      fishCollection: makeFishCollection(10),
    };

    storageManager.save(initialData);
    gameState.load(storageManager.load());

    const backupData = {
      version: '1.0.0',
      gameState: {
        ...initialData,
        fishCollection: undefined,
      },
      fishCollection: makeFishCollection(6),
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
        senseRadius: 100,
      },
    };
    const seededData: GameSaveData = {
      ...DEFAULT_SAVE_DATA,
      fishCollection: [fishWithLegacySense],
    };
    gameState.load(seededData);

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
        eyeType: 'winking',
      },
    };

    const backupData = {
      version: '1.0.0',
      gameState: {
        ...DEFAULT_SAVE_DATA,
        fishCollection: undefined,
      },
      fishCollection: [legacyFish],
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

  it('exports backup with normalized fish data and no legacy senseRadius', () => {
    localStorage.clear();
    const fishData = {
      id: 'fish-export-1',
      name: 'Exportable',
      species: 'default',
      speed: 7,
      senseRadius: 4,
      hungerDrive: 3,
      rarityGene: 6,
      constitution: 4,
      colorHue: 210,
      patternType: 'stripes',
      finShape: 'pointy',
      eyeType: 'winking',
    };
    const seededData: GameSaveData = {
      ...DEFAULT_SAVE_DATA,
      fishCollection: [
        {
          id: 'fish-export-1',
          name: 'Exportable',
          timestamp: Date.now(),
          fishData,
        },
      ],
    };

    gameState.load(seededData);
    const backupJson = backupManager.createBackup();
    const backup = JSON.parse(backupJson);
    const savedFish = backup.fishCollection[0];
    const savedFishData = savedFish.fishData;

    expect(savedFish.id).toBe('fish-export-1');
    expect(savedFishData.senseGene).toBe(4);
    expect('senseRadius' in savedFishData).toBe(false);
    expect(savedFishData.speed).toBe(7);
    expect(savedFishData.hungerDrive).toBe(3);
    expect(savedFishData.rarityGene).toBe(6);
    expect(savedFishData.constitution).toBe(4);
    expect(savedFishData.colorHue).toBe(210);
    expect(savedFishData.patternType).toBe('stripes');
    expect(savedFishData.finShape).toBe('pointy');
    expect(savedFishData.eyeType).toBe('winking');
  });

  it('restores corrupted fish data with defaults and valid ranges', async () => {
    localStorage.clear();
    const corruptedFish = {
      id: 'fish-corrupt-1',
      name: '',
      species: 123,
      speed: -5,
      senseGene: 999,
      senseRadius: 100,
      hungerDrive: -1,
      rarityGene: 99,
      constitution: -3,
      colorHue: 'bad',
      patternType: 'invalid',
      finShape: 'invalid',
      eyeType: 'invalid',
    };

    const backupData = {
      version: '1.0.0',
      gameState: {
        ...DEFAULT_SAVE_DATA,
        fishCollection: undefined,
      },
      fishCollection: [
        {
          id: 'fish-corrupt-1',
          timestamp: Date.now(),
          fishData: corruptedFish,
        },
      ],
    };

    const result = await backupManager.restoreBackup(JSON.stringify(backupData), true);
    expect(result).toBe(true);
    const restoredFishData = gameState.getState().fishCollection[0].fishData;

    expect(restoredFishData.id).toBe('fish-corrupt-1');
    expect(restoredFishData.name).toBe('Unnamed');
    expect(restoredFishData.species).toBe('default');
    expect(restoredFishData.senseGene).toBeGreaterThanOrEqual(1);
    expect(restoredFishData.senseGene).toBeLessThanOrEqual(9);
    expect(restoredFishData.speed).toBeGreaterThanOrEqual(0);
    expect(restoredFishData.speed).toBeLessThanOrEqual(9);
    expect(restoredFishData.hungerDrive).toBeGreaterThanOrEqual(0);
    expect(restoredFishData.hungerDrive).toBeLessThanOrEqual(9);
    expect(restoredFishData.rarityGene).toBeGreaterThanOrEqual(0);
    expect(restoredFishData.rarityGene).toBeLessThanOrEqual(9);
    expect(restoredFishData.constitution).toBeGreaterThanOrEqual(0);
    expect(restoredFishData.constitution).toBeLessThanOrEqual(9);
    expect(['solid', 'stripes', 'spots', 'gradient']).toContain(restoredFishData.patternType);
    expect(['pointy', 'round', 'fan', 'forked', 'lunate']).toContain(restoredFishData.finShape);
    expect(['round', 'sleepy', 'sparkly', 'winking']).toContain(restoredFishData.eyeType);
    expect('senseRadius' in restoredFishData).toBe(false);
  });
});
