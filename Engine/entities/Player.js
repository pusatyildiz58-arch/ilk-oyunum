// filepath: engine/entities/Player.js
/**
 * Player Entity - Main player character
 */

import { PositionComponent } from '../components/Position.js';
import { InventoryComponent } from '../components/Inventory.js';
import { EconomyComponent } from '../components/Economy.js';
import { CombatStatsComponent } from '../components/CombatStats.js';

// ============================================================================
// PLAYER ENTITY
// ============================================================================

class PlayerEntity {
  constructor(world) {
    this.world = world;
    this.entityId = world.createEntity('player');
    
    // Add components
    this.position = new PositionComponent(0, 0, 0);
    this.inventory = new InventoryComponent(30);
    this.economy = new EconomyComponent();
    this.combat = new CombatStatsComponent();
    
    // Player-specific stats
    this.name = 'Oyuncu';
    this.title = 'Yoksul Çiftçi';
    this.rank = 0;
    
    // Progression
    this.influence = 0;
    this.reputation = {}; // factionId -> reputation
    this.territories = [];
    
    // Player mesh reference (for rendering)
    this.mesh = null;
    
    // Register components with ECS
    this.registerComponents();
  }

  registerComponents() {
    this.world.addComponent(this.entityId, 'position', this.position);
    this.world.addComponent(this.entityId, 'inventory', this.inventory);
    this.world.addComponent(this.entityId, 'economy', this.economy);
    this.world.addComponent(this.entityId, 'combat', this.combat);
  }

  // Initialize with mesh
  initWithMesh(mesh) {
    this.mesh = mesh;
    if (mesh) {
      mesh.userData.entityId = this.entityId;
    }
  }

  // Update position from mesh
  updateFromMesh() {
    if (this.mesh) {
      this.position.x = this.mesh.position.x;
      this.position.y = this.mesh.position.y;
      this.position.z = this.mesh.position.z;
    }
  }

  // Move player
  move(direction, speed) {
    switch (direction) {
      case 'forward':
        this.position.z -= speed;
        break;
      case 'backward':
        this.position.z += speed;
        break;
      case 'left':
        this.position.x -= speed;
        break;
      case 'right':
        this.position.x += speed;
        break;
    }
    
    // Update mesh if exists
    if (this.mesh) {
      this.mesh.position.x = this.position.x;
      this.mesh.position.z = this.position.z;
    }
  }

  // Get gold
  getGold() {
    return this.economy.resources.gold;
  }

  // Add gold
  addGold(amount) {
    this.economy.resources.gold += amount;
  }

  // Spend gold
  spendGold(amount) {
    if (this.economy.resources.gold >= amount) {
      this.economy.resources.gold -= amount;
      return true;
    }
    return false;
  }

  // Get food
  getFood() {
    return this.economy.resources.food;
  }

  // Add food
  addFood(amount) {
    this.economy.resources.food += amount;
  }

  // Spend food
  spendFood(amount) {
    if (this.economy.resources.food >= amount) {
      this.economy.resources.food -= amount;
      return true;
    }
    return false;
  }

  // Update rank based on soldiers
  updateRank() {
    const soldiers = this.combat.workers?.soldiers || 0;
    const RANK_REQ = [0, 5, 15, 30, 60, 100];
    const RANKS = ['Yoksul Çiftçi', 'Köy Ağası', 'Sipahi', 'Subaşı', 'Komutan', 'Lord'];
    
    for (let i = RANK_REQ.length - 1; i >= 0; i--) {
      if (soldiers >= RANK_REQ[i]) {
        this.rank = i;
        this.title = RANKS[i];
        break;
      }
    }
  }

  // Get state for UI
  getState() {
    return {
      gold: Math.floor(this.economy.resources.gold),
      food: Math.floor(this.economy.resources.food),
      wood: this.economy.resources.wood,
      iron: this.economy.resources.iron,
      leather: this.economy.resources.leather,
      meat: this.economy.resources.meat,
      health: this.combat.health,
      maxHealth: this.combat.maxHealth,
      title: this.title,
      rank: this.rank
    };
  }

  // Serialize for saving
  serialize() {
    return {
      entityId: this.entityId,
      name: this.name,
      title: this.title,
      rank: this.rank,
      influence: this.influence,
      reputation: { ...this.reputation },
      territories: [...this.territories],
      position: this.position.serialize(),
      inventory: this.inventory.serialize(),
      economy: this.economy.serialize(),
      combat: this.combat.serialize()
    };
  }

  // Deserialize from save
  static deserialize(world, data) {
    const player = new PlayerEntity(world);
    
    player.name = data.name || player.name;
    player.title = data.title || player.title;
    player.rank = data.rank || 0;
    player.influence = data.influence || 0;
    player.reputation = data.reputation || {};
    player.territories = data.territories || [];
    
    // Restore components
    if (data.position) {
      player.position = PositionComponent.deserialize(data.position);
      world.addComponent(player.entityId, 'position', player.position);
    }
    
    if (data.inventory) {
      player.inventory = InventoryComponent.deserialize(data.inventory);
      world.addComponent(player.entityId, 'inventory', player.inventory);
    }
    
    if (data.economy) {
      player.economy = EconomyComponent.deserialize(data.economy);
      world.addComponent(player.entityId, 'economy', player.economy);
    }
    
    if (data.combat) {
      player.combat = CombatStatsComponent.deserialize(data.combat);
      world.addComponent(player.entityId, 'combat', player.combat);
    }
    
    return player;
  }
}

// Export
export { PlayerEntity };