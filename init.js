// init.js - Game initialization with world systems integration
import { initRendering, startGame, buildWorld, makePlayer, updateUI, drawMinimap, getScene, loop, state, village } from './game.js';

// Initialize world managers (can be expanded later for world system integration)
function initializeGame() {
  console.log('🎮 Initializing Game...');
  
  // Set up rendering
  initRendering();
  console.log('✅ Rendering initialized');
  
  // Start the game
  startGame();
  console.log('✅ Game started');
  
  // TODO: World system integration points
  // The following can be added as the world systems are integrated:
  // - Import { WorldManager } from './Engine/world/WorldManager.js';
  // - Initialize weather system effects
  // - Set up travel system interactions
  // - Add encounter system to NPC interactions
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame);
} else {
  initializeGame();
}
