/**
 * Sandbox RPG System - Main integration system
 * Combines Entity, Interaction, NPC, Workers, and Farm systems
 */

class SandboxRPGSystem {
  constructor() {
    this.entities = new Map(); // All entities in the world
    this.player = null;
    
    // Sub-systems
    this.interactionSystem = new InteractionSystem();
    this.npcSystem = new NPCSystem();
    this.workersSystem = new WorkersSystem();
    this.farmSystem = new FarmSystem();
    
    // World state
    this.worldTime = 0;
    this.dayPhase = 'morning';
    this.isInitialized = false;
    
    // Event listeners
    this.setupEventListeners();
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🎮 Initializing Sandbox RPG System...');
    
    // Create player entity
    this.createPlayer();
    
    // Generate initial world
    await this.generateWorld();
    
    // Setup interaction handlers
    this.setupInteractionHandlers();
    
    this.isInitialized = true;
    console.log('✅ Sandbox RPG System initialized!');
  }
  
  createPlayer() {
    this.player = new Entity('player', 'player', { x: 0, y: 0, z: 0 });
    
    // Add player components
    this.player
      .addComponent('interaction', ComponentFactory.createInteraction(
        3.0, 'player', ['talk', 'trade', 'hire']
      ))
      .addComponent('inventory', {
        gold: 100,
        items: {},
        capacity: 50
      })
      .addComponent('character', {
        level: 1,
        experience: 0,
        health: 100,
        maxHealth: 100
      });
    
    this.entities.set('player', this.player);
  }
  
  async generateWorld() {
    console.log('🌍 Generating world...');
    
    // Generate available land
    this.farmSystem.generateAvailableLand();
    
    // Create initial farms
    this.createInitialFarms();
    
    // Create initial NPCs
    this.createInitialNPCs();
    
    // Create initial workers
    this.createInitialWorkers();
    
    console.log('✅ World generation complete!');
  }
  
  createInitialFarms() {
    // Create some starter farms near the village
    const farmPositions = [
      { x: 25, z: 15, size: 12 },
      { x: -20, z: 18, size: 10 },
      { x: 15, z: -22, size: 15 },
      { x: -18, z: -25, size: 8 }
    ];
    
    for (const pos of farmPositions) {
      const farm = this.farmSystem.createFarm(pos, pos.size);
      this.entities.set(farm.id, farm);
    }
  }
  
  createInitialNPCs() {
    // Create NPCs with different roles
    const npcConfigs = [
      { role: 'farmer', position: { x: 10, z: 10 }, workplace: null, home: { x: 12, z: 8 } },
      { role: 'guard', position: { x: -5, z: 5 }, workplace: null, home: { x: -3, z: 3 } },
      { role: 'trader', position: { x: 0, z: 15 }, workplace: null, home: { x: 2, z: 12 } },
      { role: 'blacksmith', position: { x: -10, z: -5 }, workplace: null, home: { x: -8, z: -3 } },
      { role: 'merchant', position: { x: 8, z: -8 }, workplace: null, home: { x: 10, z: -10 } }
    ];
    
    for (const config of npcConfigs) {
      const npc = this.npcSystem.createNPC(
        `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        config.role,
        config.position,
        config.workplace,
        config.home
      );
      
      this.entities.set(npc.id, npc);
    }
  }
  
  createInitialWorkers() {
    // Create some unemployed workers
    const professions = ['farmer', 'worker', 'blacksmith'];
    
    for (let i = 0; i < 5; i++) {
      const profession = professions[Math.floor(Math.random() * professions.length)];
      const worker = this.workersSystem.createWorker(profession);
      
      // Create entity for worker
      const workerEntity = new Entity(worker.id, 'worker', { x: 0, z: 0 });
      workerEntity.addComponent('worker', worker);
      workerEntity.addComponent('interaction', ComponentFactory.createInteraction(
        2.0, 'worker', ['talk', 'hire']
      ));
      
      this.entities.set(worker.id, workerEntity);
    }
  }
  
  setupEventListeners() {
    // Entity interaction events
    document.addEventListener('entityInteraction', (event) => {
      this.handleEntityInteraction(event.detail.entity, event.detail.action);
    });
    
    // Worker events
    document.addEventListener('workerProduction', (event) => {
      this.handleWorkerProduction(event.detail);
    });
    
    // Farm events
    document.addEventListener('farmPurchased', (event) => {
      this.handleFarmPurchase(event.detail);
    });
    
    // UI events
    document.addEventListener('hireWorkerForFarm', (event) => {
      this.handleHireWorkerForFarm(event.detail);
    });
    
    document.addEventListener('openFarmManagement', (event) => {
      this.handleFarmManagement(event.detail);
    });
  }
  
  setupInteractionHandlers() {
    // This will be called when entities are interacted with
    console.log('🎯 Setting up interaction handlers...');
  }
  
  update(deltaTime) {
    if (!this.isInitialized) return;
    
    // Update world time
    this.updateWorldTime(deltaTime);
    
    // Update systems
    this.updateSystems(deltaTime);
    
    // Update interactions
    this.updateInteractions();
  }
  
  updateWorldTime(deltaTime) {
    this.worldTime += deltaTime;
    
    // Calculate day phase (24-hour cycle, 1 hour = 60 seconds)
    const dayProgress = (this.worldTime / 1440) % 1; // 1440 seconds = 24 minutes = full day
    const hour = Math.floor(dayProgress * 24);
    
    if (hour < 5 || hour >= 21) this.dayPhase = 'night';
    else if (hour < 8) this.dayPhase = 'morning';
    else if (hour < 17) this.dayPhase = 'work';
    else this.dayPhase = 'evening';
  }
  
  updateSystems(deltaTime) {
    // Update NPC behaviors
    this.npcSystem.updateAll(deltaTime, this.dayPhase);
    
    // Update workers
    this.workersSystem.updateAll(deltaTime, this.dayPhase);
    
    // Update farms
    this.farmSystem.updateAll(deltaTime);
    
    // Update all entities
    for (const entity of this.entities.values()) {
      if (entity.isActive && typeof entity.updateBehaviors === 'function') {
        entity.updateBehaviors(deltaTime);
      }
    }
  }
  
  updateInteractions() {
    if (!this.player) return;
    
    this.interactionSystem.update(
      this.player.position,
      Array.from(this.entities.values()),
      0.016 // Assume 60 FPS
    );
  }
  
  // Event handlers
  handleEntityInteraction(entity, action) {
    console.log(`🎮 Player interacting with ${entity.type}: ${action}`);
    
    switch (entity.type) {
      case 'farm':
        this.handleFarmInteraction(entity, action);
        break;
      case 'npc':
        this.handleNPCInteraction(entity, action);
        break;
      case 'worker':
        this.handleWorkerInteraction(entity, action);
        break;
      default:
        console.log(`Unknown entity type: ${entity.type}`);
    }
  }
  
  handleFarmInteraction(farm, action) {
    const success = farm.handleInteraction(action, this.player);
    
    if (success) {
      console.log(`✅ Farm interaction successful: ${action}`);
      
      // Update UI
      this.updateInteractionUI();
    } else {
      console.log(`❌ Farm interaction failed: ${action}`);
    }
  }
  
  handleNPCInteraction(npc, action) {
    const behavior = npc.getComponent('behavior');
    const role = behavior?.role || 'unknown';
    
    console.log(`💬 Talking to ${role}: ${action}`);
    
    switch (action) {
      case 'talk':
        this.startNPCDialogue(npc);
        break;
      case 'hire':
        this.hireNPC(npc);
        break;
      case 'trade':
        this.startNPCTrade(npc);
        break;
    }
  }
  
  handleWorkerInteraction(workerEntity, action) {
    const worker = workerEntity.getComponent('worker');
    
    switch (action) {
      case 'hire':
        this.hireWorker(worker);
        break;
      case 'talk':
        this.talkToWorker(worker);
        break;
    }
  }
  
  handleWorkerProduction(data) {
    console.log(`📈 Worker ${data.workerId} produced:`, data.resources);
    
    // Add to player inventory if they own the workplace
    const playerInventory = this.player.getComponent('inventory');
    if (playerInventory) {
      for (const [resource, amount] of Object.entries(data.resources)) {
        playerInventory.gold = (playerInventory.gold || 0) + amount * 0.1; // Convert to gold
      }
    }
  }
  
  handleFarmPurchase(data) {
    console.log(`🏡 Farm ${data.farmId} purchased by ${data.ownerId} for ${data.price} gold`);
    
    // Deduct gold from player
    const inventory = this.player.getComponent('inventory');
    if (inventory) {
      inventory.gold -= data.price;
    }
    
    this.updateUI();
  }
  
  handleHireWorkerForFarm(data) {
    console.log(`👷 Hiring worker for farm ${data.farmId}`);
    
    // Get unemployed workers
    const unemployed = this.workersSystem.getUnemployedWorkers();
    
    if (unemployed.length > 0) {
      const worker = unemployed[0];
      const farm = this.entities.get(data.farmId);
      
      if (farm && this.workersSystem.hireWorker(worker.id, farm)) {
        farm.addWorker(worker);
        console.log(`✅ Worker ${worker.id} hired for farm ${data.farmId}`);
      }
    } else {
      console.log('❌ No unemployed workers available');
    }
  }
  
  handleFarmManagement(data) {
    console.log(`🏡 Opening management for farm ${data.farmId}`);
    
    const farm = this.entities.get(data.farmId);
    if (farm) {
      this.showFarmManagementUI(farm);
    }
  }
  
  // UI Methods
  updateInteractionUI() {
    const interactions = this.interactionSystem.getInteractions();
    const ui = this.interactionSystem.generateInteractionUI(interactions);
    
    // Update UI element
    const interactionElement = document.getElementById('interaction-menu');
    if (interactionElement) {
      interactionElement.innerHTML = ui;
    }
  }
  
  updateUI() {
    this.updateInteractionUI();
    this.updatePlayerStats();
    this.updateEconomyPanel();
  }
  
  updatePlayerStats() {
    const inventory = this.player.getComponent('inventory');
    const character = this.player.getComponent('character');
    
    if (inventory && character) {
      const statsElement = document.getElementById('player-stats');
      if (statsElement) {
        statsElement.innerHTML = `
          <div>💰 Gold: ${inventory.gold}</div>
          <div>⭐ Level: ${character.level}</div>
          <div>❤️ Health: ${character.health}/${character.maxHealth}</div>
        `;
      }
    }
  }
  
  updateEconomyPanel() {
    const farmStats = this.farmSystem.getSystemStats();
    const workerStats = this.workersSystem.getWorkerStats();
    
    const economyElement = document.getElementById('economy-panel');
    if (economyElement) {
      economyElement.innerHTML = `
        <h3>📊 Economy</h3>
        <div>🏡 Farms: ${farmStats.ownedFarms}/${farmStats.totalFarms}</div>
        <div>👷 Workers: ${workerStats.total - workerStats.unemployed}/${workerStats.total}</div>
        <div>💵 Wages: ${workerStats.totalWages.toFixed(2)}/sec</div>
        <div>📈 Production:</div>
        ${Object.entries(farmStats.totalProduction).map(([res, rate]) => 
          `<div style="margin-left: 20px;">${res}: ${rate.toFixed(2)}/sec</div>`
        ).join('')}
      `;
    }
  }
  
  showFarmManagementUI(farm) {
    const status = farm.getStatus();
    
    const modal = document.getElementById('farm-management-modal');
    if (modal) {
      modal.innerHTML = `
        <div class="modal-content">
          <h2>🏡 Farm Management</h2>
          <div>Level: ${status.level}</div>
          <div>Size: ${status.size} units</div>
          <div>Workers: ${status.currentWorkers}/${status.maxWorkers}</div>
          <div>Storage:</div>
          ${Object.entries(status.storage).map(([res, amount]) => 
            `<div style="margin-left: 20px;">${res}: ${amount.toFixed(1)}</div>`
          ).join('')}
          <div>Production:</div>
          ${Object.entries(status.production).map(([res, rate]) => 
            `<div style="margin-left: 20px;">${res}: ${rate.toFixed(2)}/sec</div>`
          ).join('')}
          <div style="margin-top: 20px;">
            <button onclick="game.sandboxRPG.harvestFarm('${farm.id}')">🌾 Harvest</button>
            ${status.canExpand ? 
              `<button onclick="game.sandboxRPG.expandFarm('${farm.id}')">📏 Expand (${status.expansionCost}g)</button>` : 
              ''
            }
            <button onclick="game.sandboxRPG.hireWorkerForFarm('${farm.id}')">👷 Hire Worker</button>
            <button onclick="this.parentElement.parentElement.style.display='none'">Close</button>
          </div>
        </div>
      `;
      modal.style.display = 'block';
    }
  }
  
  // Public API methods
  harvestFarm(farmId) {
    const farm = this.entities.get(farmId);
    if (farm && farm.owner === this.player.id) {
      const harvested = farm.harvest();
      
      // Add to player inventory
      const inventory = this.player.getComponent('inventory');
      if (inventory) {
        for (const [resource, amount] of Object.entries(harvested)) {
          inventory.gold = (inventory.gold || 0) + amount * 0.5; // Sell resources for gold
        }
      }
      
      this.updateUI();
      console.log(`🌾 Harvested farm ${farmId}:`, harvested);
    }
  }
  
  expandFarm(farmId) {
    const farm = this.entities.get(farmId);
    if (farm && farm.owner === this.player.id) {
      const inventory = this.player.getComponent('inventory');
      const status = farm.getStatus();
      
      if (inventory && inventory.gold >= status.expansionCost) {
        if (farm.expand()) {
          inventory.gold -= status.expansionCost;
          this.updateUI();
          console.log(`📏 Expanded farm ${farmId} to level ${farm.level}`);
        }
      }
    }
  }
  
  // Getters for external systems
  getPlayer() {
    return this.player;
  }
  
  getEntities() {
    return Array.from(this.entities.values());
  }
  
  getInteractions() {
    return this.interactionSystem.getInteractions();
  }
  
  getDayPhase() {
    return this.dayPhase;
  }
  
  getSystemStats() {
    return {
      entities: this.entities.size,
      farms: this.farmSystem.getSystemStats(),
      workers: this.workersSystem.getWorkerStats(),
      dayPhase: this.dayPhase,
      worldTime: this.worldTime
    };
  }
}

// Browser-compatible exports
window.SandboxRPGSystem = SandboxRPGSystem;
