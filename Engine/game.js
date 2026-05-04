// filepath: Engine/Game.js
/**
 * Toprak ve Kılıç - Main Game Engine
 * Bannerlord-style Medieval Simulation Engine
 * 
 * This module integrates with the existing index.html structure
 * while providing ECS-based architecture
 */

import { World, EntityManager, SystemManager, System } from './ECS.js';
import { EventBus, GameEvents } from './EventBus.js';
import { TimeSystem } from './Time.js';
import { createDefaultVillageHousing } from './data/Housinglevels.js';
import { PositionComponent } from './components/Position.js';
import { InventoryComponent } from './components/Inventory.js';
import { EconomyComponent } from './components/Economy.js';
import { CombatStatsComponent } from './components/CombatStats.js';
import { AIComponent } from './components/AI.js';
import { AISystem } from './systems/AISystem.js';
import { EconomySystem } from './systems/EconomySystem.js';
import { CombatSystem } from './systems/CombatSystem.js';

// Sandbox RPG System - Will be loaded via script tags

// ============================================================================
// GAME ENGINE CLASS
// ============================================================================

// Main Game class (exported for main.js)
class Game {
  constructor() {
    // ECS World
    this.world = null;
    this.eventBus = null;
    this.timeSystem = null;
    
    // Systems
    this.aiSystem = null;
    this.economySystem = null;
    this.combatSystem = null;
    
    // Sandbox RPG System
    this.sandboxRPG = null;
    
    // Player reference
    this.playerEntity = null;
    
    // Game state (mirrors existing state for compatibility)
    this.state = window.state || {
      gold: 80, food: 5, leather: 0, iron: 0, meat: 0, wood: 0,
      workers: 0, soldiers: 0, armor: 0, loyalty: 50, rank: 0, land: 0,
      ownedVillages: [], day: 1
    };
    
    // Configuration
    this.config = {
      worldSize: 200,
      villageCount: 8,
      npcCount: 20,
      banditCount: 5
    };
    
    // Running state
    this.running = false;
    this.lastTime = 0;
  }

  // Initialize the engine
  async init() {
    console.log('⚔️ Engine initializing...');
    
    // Create ECS world
    this.world = new World();
    this.eventBus = new EventBus();
    this.timeSystem = new TimeSystem();
    this.timeSystem.init();
    
    // Add systems
    this.aiSystem = new AISystem(this.world, this.eventBus);
    this.economySystem = new EconomySystem(this.world, this.eventBus);
    this.combatSystem = new CombatSystem(this.world, this.eventBus);
    
    // Initialize Sandbox RPG System (will be available after script loading)
    // Check if SandboxRPGSystem is available, if not, create placeholder
    if (window.SandboxRPGSystem) {
      this.sandboxRPG = new window.SandboxRPGSystem();
      await this.sandboxRPG.initialize();
      console.log('✅ Sandbox RPG System initialized in game engine');
    } else {
      console.warn('SandboxRPGSystem not available during init, will retry later');
      // Create a placeholder that will be replaced later
      this.sandboxRPG = null;
      
      // Set up a retry mechanism
      let retryCount = 0;
      const maxRetries = 5;
      
      const tryInitSandbox = async () => {
        if (window.SandboxRPGSystem && !this.sandboxRPG) {
          this.sandboxRPG = new window.SandboxRPGSystem();
          await this.sandboxRPG.initialize();
          console.log('✅ Sandbox RPG System initialized on retry');
          return true;
        }
        return false;
      };
      
      const retryInit = async () => {
        retryCount++;
        if (retryCount <= maxRetries) {
          const success = await tryInitSandbox();
          if (!success) {
            setTimeout(retryInit, 1000);
          }
        } else {
          console.warn('Failed to initialize Sandbox RPG System after retries');
        }
      };
      
      setTimeout(retryInit, 2000);
    }
    
    this.world.addSystem(this.aiSystem);
    this.world.addSystem(this.economySystem);
    this.world.addSystem(this.combatSystem);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Player entity creation handled by makePlayer() in index.html
    
    // Create NPC entities
    this.createNPCEntities();
    
    // Create village entities
    this.createVillageEntities();
    
    // Build 3D world
    this.build3DWorld();
    
    console.log('✅ Engine ready!');
    
    return this;
  }

  // Create player entity in ECS
  createPlayerEntity() {
    const entityId = this.world.createEntity('player');
    
    // Add position component
    const position = new PositionComponent(0, 0, 0);
    this.world.addComponent(entityId, 'position', position);
    
    // Add inventory component
    const inventory = new InventoryComponent(30);
    this.world.addComponent(entityId, 'inventory', inventory);
    
    // Add economy component
    const economy = new EconomyComponent();
    economy.resources.gold = this.state.gold;
    economy.resources.food = this.state.food;
    this.world.addComponent(entityId, 'economy', economy);
    
    // Add combat stats
    const combat = new CombatStatsComponent();
    this.world.addComponent(entityId, 'combat', combat);
    
    this.playerEntity = entityId;
    
    console.log('🎮 Player entity created:', entityId);
  }

  // Create NPC entities
  createNPCEntities() {
    for (let i = 0; i < this.config.npcCount; i++) {
      const x = Math.random() * 40 - 20;
      const z = Math.random() * 40 - 20;
      
      const entityId = this.world.createEntity('npc');
      
      // Position
      const position = new PositionComponent(x, 0.6, z);
      this.world.addComponent(entityId, 'position', position);
      
      // AI
      const ai = new AIComponent();
      this.world.addComponent(entityId, 'ai', ai);
      
      // Economy
      const economy = new EconomyComponent();
      economy.resources.gold = 10 + Math.floor(Math.random() * 40);
      economy.resources.food = 10 + Math.floor(Math.random() * 20);
      this.world.addComponent(entityId, 'economy', economy);
      
      // Combat
      const combat = new CombatStatsComponent();
      combat.health = 50 + Math.floor(Math.random() * 50);
      combat.maxHealth = combat.health;
      this.world.addComponent(entityId, 'combat', combat);
    }
    
    console.log('👥 NPC entities created:', this.config.npcCount);
  }

  // Create village entities
  createVillageEntities() {
    const villageNames = ['Başköy', 'Kuzeyköy', 'Güneyköy', 'Doğanköy', 'Batıkent', 'Dağköy', 'Ova köy', 'Denizköy'];
    
    for (let i = 0; i < this.config.villageCount; i++) {
      const angle = (i / this.config.villageCount) * Math.PI * 2;
      const distance = 30 + Math.random() * 40;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      const entityId = this.world.createEntity('village');
      
      // Position
      const position = new PositionComponent(x, 0, z);
      this.world.addComponent(entityId, 'position', position);
      
      // Economy
      const economy = new EconomyComponent();
      economy.resources.gold = 100 + Math.floor(Math.random() * 200);
      economy.resources.food = 50 + Math.floor(Math.random() * 100);
      this.world.addComponent(entityId, 'economy', economy);
      
      const population = 50 + Math.floor(Math.random() * 100);

      // Store village-specific data
      this.world.entityManager.entities.get(entityId).village = {
        name: villageNames[i] || `Köy ${i + 1}`,
        population,
        type: 'village',
        supply: {},
        demand: {},
        prices: {},

        // 👇 BURASI YENİ SİSTEM
        houses: createDefaultVillageHousing(population),

        // 👇 EKONOMİ VERİLERİ
        treasury: 0,
        householdNetIncome: 0,
        householdGrossIncome: 0,
        overcrowdingPenalty: 0,
        housingSummary: null
      };
      // Initialize supply/demand
      const v = this.world.entityManager.entities.get(entityId).village;
      const basePrices = { food: 5, wood: 10, iron: 25, leather: 15, meat: 8 };
      for (const [item, price] of Object.entries(basePrices)) {
        v.supply[item] = 20 + Math.floor(Math.random() * 50);
        v.demand[item] = 10 + Math.floor(Math.random() * 30);
        v.prices[item] = price;
      }
    }
    
    console.log('🏘️ Village entities created:', this.config.villageCount);
  }
  
  // Setup event listeners
  setupEventListeners() {
    // Economy tick
    this.eventBus.on('economy:tick', () => {
      this.updateEconomy();
    });
    
    // Item bought
    this.eventBus.on('item:bought', (data) => {
      this.showNotification(`${data.item} satın alındı: ${data.totalCost} altın`);
    });
    
    // Item sold
    this.eventBus.on('item:sold', (data) => {
      this.showNotification(`${data.item} satıldı: ${data.totalValue} altın`);
    });
    
    // Battle events
    this.eventBus.on('battle:start', (data) => {
      this.showNotification('⚔️ Savaş başladı!');
    });
    
    this.eventBus.on('battle:end', (data) => {
      this.showNotification(data.winner === this.playerEntity ? '🎉 Savaşı kazandınız!' : '💀 Savaşı kaybettiniz!');
    });
  }

  // Update economy (called every second)
  updateEconomy() {
    // Sync ECS economy with game state
    const playerEconomy = this.world.getComponent(this.playerEntity, 'economy');
    if (playerEconomy) {
      this.state.gold = Math.floor(playerEconomy.resources.gold);
      this.state.food = Math.floor(playerEconomy.resources.food);
    }
    
    // Update UI
    if (typeof updateUI === 'function') {
      updateUI(this.state);
    }
  }

  // Show notification
  showNotification(message) {
    if (typeof notify === 'function') {
      notify(message);
    } else {
      const el = document.getElementById('notification');
      if (el) {
        el.textContent = message;
        el.style.opacity = 1;
        setTimeout(() => { el.style.opacity = 0; }, 3000);
      }
    }
  }

  // Start the game
  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.gameLoop();
    console.log('🚀 Game started!');
  }

  // Main game loop
  gameLoop() {
    if (!this.running) return;
    
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    // Update time system
    this.timeSystem.update(currentTime);
    
    // Process different tick rates
    if (this.timeSystem.shouldTick('PLAYER')) {
      this.updatePlayer(deltaTime);
      this.timeSystem.consumeTick('PLAYER');
    }
    
    if (this.timeSystem.shouldTick('AI')) {
      this.world.update(deltaTime);
      this.timeSystem.consumeTick('AI');
    }
    
    if (this.timeSystem.shouldTick('ECONOMY')) {
      this.economySystem.processEconomyTick();
      this.timeSystem.consumeTick('ECONOMY');
    }
    
    if (this.timeSystem.shouldTick('WORLD')) {
      // Update Sandbox RPG System
      if (this.sandboxRPG) {
        this.sandboxRPG.update(deltaTime);
      }
      this.timeSystem.consumeTick('WORLD');
    }
    
    // Process queued events
    this.eventBus.processQueue();
    
    requestAnimationFrame(() => this.gameLoop());
  }

  // Build 3D world using existing Three.js setup
  build3DWorld() {
    console.log('🏗️ Building 3D world...');
    
    // Check if Three.js is available and world building functions exist
    if (typeof window.buildWorld === 'function') {
      window.buildWorld();
      console.log('✅ 3D world built successfully');
    } else if (typeof window.buildTerrain === 'function') {
      // Fallback: build basic terrain
      window.buildTerrain();
      console.log('✅ Basic terrain built');
    } else {
      console.warn('⚠️ No 3D world building functions found');
    }
  }

  // Update player
  updatePlayer(deltaTime) {
    // Player update handled by existing index.html code
    // This is for ECS-specific updates if needed
  }

  // Save game
  saveGame() {
    const saveData = {
      state: this.state,
      player: this.playerEntity ? this.world.getComponent(this.playerEntity, 'economy')?.serialize() : null,
      time: this.timeSystem.getState()
    };
    
    localStorage.setItem('toprakVeKilic', JSON.stringify(saveData));
    this.showNotification('💾 Oyun kaydedildi!');
  }

  // Load game
  loadGame() {
    const data = localStorage.getItem('toprakVeKilic');
    if (!data) return;
    
    try {
      const saveData = JSON.parse(data);
      if (saveData.state) {
        this.state = { ...this.state, ...saveData.state };
      }
      if (saveData.time) {
        this.timeSystem.loadState(saveData.time);
      }
      this.showNotification('📥 Oyun yüklendi!');
    } catch (e) {
      console.error('Save load error:', e);
    }
  }

  // Try battle
  tryBattle() {
    const battlePanel = document.getElementById('battlePanel');
    if (battlePanel) {
      battlePanel.style.display = 'block';
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { Game };

// Create global instance
window.game = null;

// Initialize when DOM is ready
async function initEngine() {
  if (!window.game) {
    window.game = new Game();
    await window.game.init();
    window.game.start();
  }
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEngine);
} else {
  initEngine();
}