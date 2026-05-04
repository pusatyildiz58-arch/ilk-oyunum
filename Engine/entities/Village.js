// filepath: engine/entities/Village.js
/**
 * Village Entity - Settlements with economy
 */

import { PositionComponent } from '../components/Position.js';
import { EconomyComponent } from '../components/Economy.js';

// ============================================================================
// VILLAGE ENTITY
// ============================================================================

class VillageEntity {
  constructor(world, name, x, z) {
    this.world = world;
    this.entityId = world.createEntity('village');
    
    // Add components
    this.position = new PositionComponent(x, 0, z);
    this.economy = new EconomyComponent();
    
    // Village-specific data
    this.name = name;
    this.population = 50 + Math.floor(Math.random() * 100);
    this.type = 'village'; // village, town, city
    
    // Buildings
    this.buildings = {
      houses: 5 + Math.floor(Math.random() * 10),
      farms: 2 + Math.floor(Math.random() * 5),
      market: Math.random() > 0.5,
      blacksmith: Math.random() > 0.7,
      well: true
    };
    
    // Economy - supply/demand
    this.supply = {};
    this.demand = {};
    this.prices = {};
    this.initEconomy();
    
    // Relations
    this.faction = 'neutral';
    this.loyalty = 50;
    
    // Mesh reference
    this.mesh = null;
    
    // Register components
    this.registerComponents();
  }

  registerComponents() {
    this.world.addComponent(this.entityId, 'position', this.position);
    this.world.addComponent(this.entityId, 'economy', this.economy);
  }

  // Initialize village economy
  initEconomy() {
    // Base prices
    const basePrices = {
      food: 5,
      wood: 10,
      iron: 25,
      leather: 15,
      meat: 8
    };
    
    // Initialize supply/demand
    for (const [item, price] of Object.entries(basePrices)) {
      this.supply[item] = 20 + Math.floor(Math.random() * 50);
      this.demand[item] = 10 + Math.floor(Math.random() * 30);
      this.prices[item] = price;
    }
    
    // Workers
    this.economy.workers.farming = Math.floor(this.population * 0.3);
    this.economy.workers.woodcutting = Math.floor(this.population * 0.15);
    this.economy.workers.hunting = Math.floor(this.population * 0.1);
  }

  // Initialize with mesh
  initWithMesh(mesh) {
    this.mesh = mesh;
    if (mesh) {
      mesh.userData.entityId = this.entityId;
    }
  }

  // Get price for item
  getPrice(item) {
    const basePrice = this.prices[item] || 10;
    const supplyFactor = this.supply[item] || 50;
    const demandFactor = this.demand[item] || 30;
    
    // Price based on supply/demand
    const ratio = demandFactor / Math.max(1, supplyFactor);
    return Math.floor(basePrice * (0.5 + ratio));
  }

  // Buy from village
  buy(item, quantity, buyerGold) {
    const price = this.getPrice(item);
    const totalCost = price * quantity;
    
    if (this.supply[item] >= quantity && buyerGold >= totalCost) {
      this.supply[item] -= quantity;
      this.demand[item] = Math.min(100, this.demand[item] + quantity * 2);
      
      // Update price
      this.updatePrice(item);
      
      return { success: true, totalCost, price };
    }
    
    return { success: false };
  }

  // Sell to village
  sell(item, quantity, sellerGold) {
    const price = this.getPrice(item);
    const totalValue = price * quantity;
    
    if (this.demand[item] >= quantity) {
      this.demand[item] -= quantity;
      this.supply[item] = Math.min(100, this.supply[item] + quantity);
      
      // Update price
      this.updatePrice(item);
      
      return { success: true, totalValue, price };
    }
    
    return { success: false };
  }

  // Update price based on supply/demand
  updatePrice(item) {
    const basePrice = this.prices[item] || 10;
    const ratio = this.demand[item] / Math.max(1, this.supply[item]);
    this.prices[item] = Math.floor(basePrice * (0.5 + ratio * 0.5));
  }

  // Process economy tick
  processTick() {
    // Production
    this.economy.resources.food += this.economy.workers.farming * 2;
    this.economy.resources.wood += this.economy.workers.woodcutting * 1;
    this.economy.resources.meat += this.economy.workers.hunting * 1;
    this.economy.resources.leather += this.economy.workers.hunting * 0.3;
    
    // Consumption
    const consumption = Math.floor(this.population * 0.3);
    this.economy.resources.food -= consumption;
    
    // Update supply based on production
    for (const resource of Object.keys(this.supply)) {
      const amount = this.economy.resources[resource] || 0;
      this.supply[resource] = Math.min(100, Math.floor(amount / 2));
    }
  }

  // Get trade info for UI
  getTradeInfo() {
    return {
      name: this.name,
      type: this.type,
      population: this.population,
      prices: { ...this.prices },
      supply: { ...this.supply },
      demand: { ...this.demand },
      loyalty: this.loyalty
    };
  }

  // Serialize for saving
  serialize() {
    return {
      entityId: this.entityId,
      name: this.name,
      type: this.type,
      population: this.population,
      buildings: { ...this.buildings },
      supply: { ...this.supply },
      demand: { ...this.demand },
      prices: { ...this.prices },
      faction: this.faction,
      loyalty: this.loyalty,
      position: this.position.serialize(),
      economy: this.economy.serialize()
    };
  }

  // Deserialize from save
  static deserialize(world, data) {
    const village = new VillageEntity(world, data.name, data.position?.x || 0, data.position?.z || 0);
    
    village.type = data.type || village.type;
    village.population = data.population || village.population;
    village.buildings = data.buildings || village.buildings;
    village.supply = data.supply || village.supply;
    village.demand = data.demand || village.demand;
    village.prices = data.prices || village.prices;
    village.faction = data.faction || 'neutral';
    village.loyalty = data.loyalty || 50;
    
    // Restore position
    if (data.position) {
      village.position = PositionComponent.deserialize(data.position);
      world.addComponent(village.entityId, 'position', village.position);
    }
    
    // Restore economy
    if (data.economy) {
      village.economy = EconomyComponent.deserialize(data.economy);
      world.addComponent(village.entityId, 'economy', village.economy);
    }
    
    return village;
  }
}

// Export
export { VillageEntity };