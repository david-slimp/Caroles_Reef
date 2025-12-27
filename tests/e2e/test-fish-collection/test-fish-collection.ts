/**
 * Test script for Fish Collection functionality
 * Run this in the browser console after the game has loaded
 */

// Wait for the game to be fully loaded
type FishCollectionApi = {
  saveFish: (fishData: Record<string, unknown>) => unknown;
  show: () => void;
};

const waitForGame = setInterval(() => {
  if ((window as { fishCollection?: FishCollectionApi }).fishCollection) {
    clearInterval(waitForGame);
    runTests();
  }
}, 100);

function runTests() {
  const fishCollection = (window as { fishCollection?: FishCollectionApi }).fishCollection;
  if (!fishCollection) {
    console.log('FishCollection not available');
    return;
  }

  // Test 1: Check if fishCollection is available
  console.log('=== Fish Collection Tests ===');
  console.log('1. fishCollection available:', !!fishCollection);

  // Test 2: Add a test fish
  const testFish = {
    id: 'test-' + Date.now(),
    name: 'Test Fish ' + Math.floor(Math.random() * 1000),
    species: 'Testus fishius',
    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 2 + 0.5,
    health: 100,
    energy: 100,
    age: 0,
    generation: 1,
    rarityGene: Math.floor(Math.random() * 5) + 1,
    genes: {
      pattern: 'stripes',
      finSize: 'medium',
      bodyShape: 'normal',
    },
  };

  const savedFish = fishCollection.saveFish(testFish);
  console.log('2. Saved test fish:', savedFish ? '✅' : '❌', savedFish);

  // Test 3: Show the collection
  fishCollection.show();
  console.log('3. Collection panel should be visible');

  // Test 4: Verify the fish was saved
  const savedData = JSON.parse(localStorage.getItem('caroles_reef_save_data') || '{}');
  const savedFishes = Array.isArray(savedData.fishCollection) ? savedData.fishCollection : [];
  const fishFound = savedFishes.some(
    (f: Record<string, unknown> & { id?: string }) => f.id === testFish.id
  );
  console.log('4. Fish found in storage:', fishFound ? '✅' : '❌');

  console.log('=== Tests Complete ===');
  console.log(
    'Check the game window to see if the collection panel is visible with the test fish.'
  );
  console.log('You can also use the test-fish-collection.html page to test the collection UI.');
}

// Export for TypeScript
export {};
