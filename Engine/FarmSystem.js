/**
 * Farm System - Land ownership, farm interactions, and production
 */

class FarmEntity extends Entity {
  constructor(id, position, size = 10) {
    super(id, 'farm', position);
    this.size = size;
    this.maxWorkers = Math.floor(size / 10);
    this.currentWorkers = [];
    this.owner = null;
    this.isForSale = true;
    this.price = size * 10; // Base price per unit size
    this.level = 1;
    this.expansionCost = size * 15;
    
    this.setupComponents();
    this.createFarmMesh();
  }
  
  setupComponents() {
    // Interaction component - what players can do with this farm
    this.addComponent('interaction', ComponentFactory.createInteraction(
      4.0, // Larger radius for farms
      'farm',
      ['work', 'buy', 'expand', 'hire_worker', 'manage']
    ));
    
    // Economy component - production, storage, costs
    this.addComponent('economy', ComponentFactory.createEconomy(
      { wheat: 0.1, vegetables: 0.05 }, // Base production per second
      { wheat: 100, vegetables: 50 }, // Storage capacity
      { worker_wage: 0.1, maintenance: 0.05 } // Costs per second
    ));
    
    // Visual component
    this.addComponent('visual', ComponentFactory.createVisual(
      null, // Will be set by createFarmMesh
      ['idle', 'working']
    ));
    
    // Behavior component
    this.addComponent('behavior', ComponentFactory.createBehavior(
      'farm',
      { morning: 'work', day: 'work', evening: 'idle', night: 'idle' }
    ));
    
    // Farm-specific component
    this.addComponent('farm', {
      size: this.size,
      maxWorkers: this.maxWorkers,
      currentWorkers: this.currentWorkers.length,
      fertility: 1.0,
      irrigation: 0.5,
      soilQuality: Math.random() * 0.3 + 0.7 // 0.7 to 1.0
    });
  }
  
  createFarmMesh() {
    // This would create the actual 3D mesh
    // For now, we'll create a placeholder
    const farmData = {
      type: 'farm',
      size: this.size,
      position: { ...this.position },
      level: this.level
    };
    
    // Emit event to create mesh
    const event = new CustomEvent('createFarmMesh', {
      detail: { farm: this, data: farmData }
    });
    document.dispatchEvent(event);
  }
  
  // Ownership methods
  setOwner(playerId) {
    this.owner = playerId;
    this.isForSale = false;
    
    const event = new CustomEvent('farmPurchased', {
      detail: { farmId: this.id, ownerId: playerId, price: this.price }
    });
    document.dispatchEvent(event);
  }
  
  sellToPlayer(playerId, price) {
    if (this.isForSale && !this.owner) {
      this.price = price;
      this.setOwner(playerId);
      return true;
    }
    return false;
  }
  
  // Worker management
  addWorker(worker) {
    if (this.currentWorkers.length < this.maxWorkers) {
      this.currentWorkers.push(worker);
      this.updateWorkerCount();
      
      // Update farm productivity
      this.updateProductivity();
      
      const event = new CustomEvent('workerAssignedToFarm', {
        detail: { farmId: this.id, workerId: worker.id }
      });
      document.dispatchEvent(event);
      
      return true;
    }
    return false;
  }
  
  removeWorker(workerId) {
    const index = this.currentWorkers.findIndex(w => w.id === workerId);
    if (index > -1) {
      const worker = this.currentWorkers.splice(index, 1)[0];
      this.updateWorkerCount();
      this.updateProductivity();
      
      const event = new CustomEvent('workerRemovedFromFarm', {
        detail: { farmId: this.id, workerId: workerId }
      });
      document.dispatchEvent(event);
      
      return worker;
    }
    return null;
  }
  
  updateWorkerCount() {
    const farm = this.getComponent('farm');
    if (farm) {
      farm.currentWorkers = this.currentWorkers.length;
    }
  }
  
  updateProductivity() {
    const economy = this.getComponent('economy');
    const farm = this.getComponent('farm');
    
    if (economy && farm) {
      const baseProduction = { wheat: 0.1, vegetables: 0.05 };
      const workerBonus = this.currentWorkers.length * 0.8;
      const fertilityBonus = farm.fertility;
      const soilBonus = farm.soilQuality;
      const levelBonus = this.level * 0.2;
      
      const totalBonus = 1 + workerBonus + fertilityBonus + soilBonus + levelBonus;
      
      economy.production = {};
      for (const [resource, baseAmount] of Object.entries(baseProduction)) {
        economy.production[resource] = baseAmount * totalBonus;
      }
    }
  }
  
  // Expansion methods
  canExpand() {
    return this.level < 5; // Max level 5
  }
  
  expand() {
    if (!this.canExpand()) return false;
    
    this.level++;
    this.size = Math.floor(this.size * 1.3);
    this.maxWorkers = Math.floor(this.size / 10);
    this.expansionCost = this.size * 15;
    
    // Update components
    const farm = this.getComponent('farm');
    if (farm) {
      farm.size = this.size;
      farm.maxWorkers = this.maxWorkers;
    }
    
    this.updateProductivity();
    this.createFarmMesh(); // Recreate mesh with new size
    
    const event = new CustomEvent('farmExpanded', {
      detail: { farmId: this.id, newLevel: this.level, newSize: this.size }
    });
    document.dispatchEvent(event);
    
    return true;
  }
  
  // Production methods
  addProduction(resources) {
    const economy = this.getComponent('economy');
    if (!economy) return;
    
    for (const [resource, amount] of Object.entries(resources)) {
      const storage = economy.storage[resource] || 0;
      const production = economy.production[resource] || 0;
      
      // Add to storage, but don't exceed capacity
      const maxStorage = this.getMaxStorage(resource);
      economy.storage[resource] = Math.min(storage + amount, maxStorage);
    }
  }
  
  getMaxStorage(resource) {
    const baseStorage = { wheat: 100, vegetables: 50 };
    const levelBonus = this.level * 50;
    const sizeBonus = this.size * 5;
    
    return (baseStorage[resource] || 50) + levelBonus + sizeBonus;
  }
  
  harvest() {
    const economy = this.getComponent('economy');
    if (!economy) return {};
    
    const harvested = { ...economy.storage };
    
    // Clear storage after harvest
    economy.storage = { wheat: 0, vegetables: 0 };
    
    const event = new CustomEvent('farmHarvested', {
      detail: { farmId: this.id, harvested }
    });
    document.dispatchEvent(event);
    
    return harvested;
  }
  
  // Interaction handlers
  handleInteraction(action, player) {
    switch (action) {
      case 'work':
        return this.handleWork(player);
      case 'buy':
        return this.handleBuy(player);
      case 'expand':
        return this.handleExpand(player);
      case 'hire_worker':
        return this.handleHireWorker(player);
      case 'manage':
        return this.handleManage(player);
      default:
        return false;
    }
  }
  
  handleWork(player) {
    if (this.owner === player.id || !this.owner) {
      // Player can work on this farm
      const event = new CustomEvent('playerWorkingOnFarm', {
        detail: { farmId: this.id, playerId: player.id }
      });
      document.dispatchEvent(event);
      return true;
    }
    return false;
  }
  
  handleBuy(player) {
    if (this.isForSale && player.gold >= this.price) {
      return this.sellToPlayer(player.id, this.price);
    }
    return false;
  }
  
  handleExpand(player) {
    if (this.owner === player.id && this.canExpand() && player.gold >= this.expansionCost) {
      return this.expand();
    }
    return false;
  }
  
  handleHireWorker(player) {
    if (this.owner === player.id) {
      const event = new CustomEvent('hireWorkerForFarm', {
        detail: { farmId: this.id, playerId: player.id }
      });
      document.dispatchEvent(event);
      return true;
    }
    return false;
  }
  
  handleManage(player) {
    if (this.owner === player.id) {
      const event = new CustomEvent('openFarmManagement', {
        detail: { farmId: this.id, playerId: player.id }
      });
      document.dispatchEvent(event);
      return true;
    }
    return false;
  }
  
  // Getters for UI
  getStatus() {
    const economy = this.getComponent('economy');
    const farm = this.getComponent('farm');
    
    return {
      owner: this.owner,
      isForSale: this.isForSale,
      price: this.price,
      level: this.level,
      size: this.size,
      maxWorkers: this.maxWorkers,
      currentWorkers: this.currentWorkers.length,
      production: economy?.production || {},
      storage: economy?.storage || {},
      canExpand: this.canExpand(),
      expansionCost: this.expansionCost,
      fertility: farm?.fertility || 1.0,
      soilQuality: farm?.soilQuality || 1.0
    };
  }
}

class FarmSystem {
  constructor() {
    this.farms = [];
    this.availableLand = [];
    this.baseFarmPrice = 100;
    this.landGenerationRadius = 200;
  }
  
  createFarm(position, size = 10) {
    const id = `farm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const farm = new FarmEntity(id, position, size);
    
    this.farms.push(farm);
    
    const event = new CustomEvent('farmCreated', {
      detail: { farm, position, size }
    });
    document.dispatchEvent(event);
    
    return farm;
  }
  
  generateAvailableLand() {
    // Generate random available land parcels
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * (this.landGenerationRadius - 50);
      
      const position = {
        x: Math.cos(angle) * distance,
        z: Math.sin(angle) * distance
      };
      
      const size = 8 + Math.random() * 12; // 8-20 units
      const price = this.baseFarmPrice * size;
      
      this.availableLand.push({
        id: `land_${i}`,
        position,
        size,
        price,
        fertility: Math.random() * 0.3 + 0.7,
        soilQuality: Math.random() * 0.4 + 0.6
      });
    }
  }
  
  purchaseLand(landId, playerId) {
    const landIndex = this.availableLand.findIndex(l => l.id === landId);
    if (landIndex === -1) return null;
    
    const land = this.availableLand[landIndex];
    const farm = this.createFarm(land.position, land.size);
    
    // Set farm properties from land
    const farmComponent = farm.getComponent('farm');
    if (farmComponent) {
      farmComponent.fertility = land.fertility;
      farmComponent.soilQuality = land.soilQuality;
    }
    
    farm.price = land.price;
    farm.setOwner(playerId);
    
    // Remove from available land
    this.availableLand.splice(landIndex, 1);
    
    return farm;
  }
  
  getFarmsByOwner(ownerId) {
    return this.farms.filter(farm => farm.owner === ownerId);
  }
  
  getFarmNearPosition(position, radius = 10) {
    return this.farms.find(farm => {
      const distance = Math.hypot(
        farm.position.x - position.x,
        farm.position.z - position.z
      );
      return distance <= radius;
    });
  }
  
  getAllFarms() {
    return this.farms;
  }
  
  getAvailableLand() {
    return this.availableLand;
  }
  
  updateAll(deltaTime) {
    // Update all farms
    for (const farm of this.farms) {
      farm.updateBehaviors(deltaTime);
    }
  }
  
  // Economy calculations
  getTotalProduction() {
    const total = {};
    
    for (const farm of this.farms) {
      const economy = farm.getComponent('economy');
      if (economy) {
        for (const [resource, rate] of Object.entries(economy.production || {})) {
          total[resource] = (total[resource] || 0) + rate;
        }
      }
    }
    
    return total;
  }
  
  getTotalStorage() {
    const total = {};
    
    for (const farm of this.farms) {
      const economy = farm.getComponent('economy');
      if (economy) {
        for (const [resource, amount] of Object.entries(economy.storage || {})) {
          total[resource] = (total[resource] || 0) + amount;
        }
      }
    }
    
    return total;
  }
  
  getSystemStats() {
    const owned = this.farms.filter(f => f.owner).length;
    const unowned = this.farms.filter(f => !f.owner).length;
    const totalWorkers = this.farms.reduce((sum, farm) => sum + farm.currentWorkers.length, 0);
    const maxWorkers = this.farms.reduce((sum, farm) => sum + farm.maxWorkers, 0);
    
    return {
      totalFarms: this.farms.length,
      ownedFarms: owned,
      unownedFarms: unowned,
      availableLand: this.availableLand.length,
      totalWorkers,
      maxWorkers,
      totalProduction: this.getTotalProduction(),
      totalStorage: this.getTotalStorage()
    };
  }
}

// Browser-compatible exports
window.FarmEntity = FarmEntity;
window.FarmSystem = FarmSystem;
