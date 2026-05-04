// filepath: main.js
/**
 * Toprak ve Kılıç - Main Entry Point
 * Bannerlord-style Medieval Simulation Engine
 */

import { Game } from './Engine/game.js';

// ============================================================================
// GAME INITIALIZATION
// ============================================================================

let game = null;

async function initGame() {
  try {
    // Create game instance
    game = new Game();
    
    // Initialize
    await game.init();
    
    // Start game loop
    game.start();
    
    // Hide loading screen
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    console.log('⚔️ Toprak ve Kılıç başladı!');
    
  } catch (error) {
    console.error('Game initialization failed:', error);
    // Show error on loading screen
    const loadingStatus = document.getElementById('loadingStatus');
    if (loadingStatus) {
      loadingStatus.textContent = 'Hata: ' + error.message;
      loadingStatus.style.color = '#ff6b6b';
    }
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

// Global functions for UI interaction
window.saveGame = function() {
  if (game) game.saveGame();
};

window.loadGame = function() {
  if (game) game.loadGame();
};

window.tryBattle = function() {
  if (game) game.tryBattle();
};

// Auto-save every 30 seconds
setInterval(() => {
  if (game) game.saveGame();
}, 30000);