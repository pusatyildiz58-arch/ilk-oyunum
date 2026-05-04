// filepath: Engine/world/WorldSimulation.js
/**
 * World Simulation Layer - Dynamic world events and NPC activities
 * Handles caravan movements, patrol routes, dynamic events, and world state updates
 */

// ============================================================================
// SIMULATION MODELS
// ============================================================================

// Entity Types for Simulation
export const SimEntityType = {
  CARAVAN: 'caravan',
  PATROL: 'patrol',
  WANDERER: 'wanderer',
  MESSENGER: 'messenger',
  BANDIT: 'bandit'
};

// Caravan
export class SimCaravan {
  constructor(id, owner, startId, endId, route) {
    this.id = id;
    this.owner = owner;
    this.startId = startId;
    this.endId = endId;
    this.route = route;
    
    // Position
    this.currentX = 0;
    this.currentZ = 0;
    this.progress = 0;
    this.currentSegment = 0;
    
    // State
    this.state = 'traveling'; // traveling, camped, trading, attacked
    this.goods = 0;
    this.gold = 0;
    this.guards = 3;
    
    // Timing
    this.departureTime = Date.now();
    this.estimatedArrival = 0;
    this.lastUpdate = Date.now();
  }
  
  // Update position
  update(deltaTime) {
    if (this.state !== 'traveling') return;
    
    // Simple progress update
    this.progress += deltaTime * 0.001;
    
    if (this.progress >= 1) {
      this.progress = 0;
      this.currentSegment++;
      
      if (this.currentSegment >= this.route.length) {
        this.state = 'arrived';
      }
    }
  }
  
  // Get current position
  getPosition() {
    if (!this.route || this.route.length === 0) {
      return { x: this.currentX, z: this.currentZ };
    }
    
    const segment = this.route[this.currentSegment];
    if (!segment) return { x: this.currentX, z: this.currentZ };
    
    // Interpolate position
    const t = this.progress;
    return {
      x: segment.startX + (segment.endX - segment.startX) * t,
      z: segment.startZ + (segment.endZ - segment.startZ) * t
    };
  }
  
  serialize() {
    return {
      id: this.id,
      owner: this.owner,
      startId: this.startId,
      endId: this.endId,
      currentX: this.currentX,
      currentZ: this.currentZ,
      progress: this.progress,
      currentSegment: this.currentSegment,
      state: this.state,
      goods: this.goods,
      gold: this.gold,
      guards: this.guards
    };
  }
}

// Patrol
export class SimPatrol {
  constructor(id, faction, startId, route, behavior = 'patrol') {
    this.id = id;
    this.faction = faction;
    this.startId = startId;
    this.route = route;
    this.behavior = behavior;
    
    // Position
    this.currentX = 0;
    this.currentZ = 0;
    this.progress = 0;
    this.currentSegment = 0;
    this.direction = 1; // 1 = forward, -1 = backward
    
    // State
    this.state = 'patrolling';
    this.alertLevel = 0;
    this.target = null;
    
    // Combat
    this.size = 4;
    this.strength = 1;
  }
  
  // Update
  update(deltaTime) {
    if (this.state === 'idle') return;
    
    this.progress += deltaTime * 0.002;
    
    if (this.progress >= 1) {
      this.progress = 0;
      
      if (this.direction === 1) {
        this.currentSegment++;
        if (this.currentSegment >= this.route.length) {
          this.direction = -1;
          this.currentSegment = this.route.length - 2;
        }
      } else {
        this.currentSegment--;
        if (this.currentSegment < 0) {
          this.direction = 1;
          this.currentSegment = 1;
        }
      }
    }
  }
  
  // Get position
  getPosition() {
    if (!this.route || this.route.length === 0) {
      return { x: this.currentX, z: this.currentZ };
    }
    
    const segment = this.route[this.currentSegment];
    if (!segment) return { x: this.currentX, z: this.currentZ };
    
    const t = this.progress;
    return {
      x: segment.startX + (segment.endX - segment.startX) * t,
      z: segment.startZ + (segment.endZ - segment.startZ) * t
    };
  }
  
  serialize() {
    return {
      id: this.id,
      faction: this.faction,
      startId: this.startId,
      currentX: this.currentX,
      currentZ: this.currentZ,
      progress: this.progress,
      state: this.state,
      alertLevel: this.alertLevel,
      size: this.size
    };
  }
}

// Wandering NPC
export class SimWanderer {
  constructor(id, type, startSettlement, behavior) {
    this.id = id;
    this.type = type;
    this.startSettlement = startSettlement;
    this.behavior = behavior;
    
    // Position
    this.currentX = 0;
    this.currentZ = 0;
    this.targetSettlement = null;
    
    // State
    this.state = 'idle'; // idle, traveling, working, resting
    this.activityTimer = 0;
    this.activityDuration = 60000; // 1 minute
    
    // Data
    this.gold = 50;
    this.inventory = [];
  }
  
  // Update
  update(deltaTime) {
    this.activityTimer += deltaTime;
    
    if (this.activityTimer >= this.activityDuration) {
      this.activityTimer = 0;
      this.pickNewActivity();
    }
  }
  
  // Pick new activity
  pickNewActivity() {
    const activities = ['idle', 'traveling', 'working', 'resting'];
    this.state = activities[Math.floor(Math.random() * activities.length)];
    this.activityDuration = 30000 + Math.random() * 60000;
  }
  
  serialize() {
    return {
      id: this.id,
      type: this.type,
      currentX: this.currentX,
      currentZ: this.currentZ,
      state: this.state,
      gold: this.gold
    };
  }
}

// Dynamic Event
export class WorldEvent {
  constructor(type, data = {}) {
    this.id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.type = type;
    this.title = data.title || '';
    this.description = data.description || '';
    
    // Location
    this.x = data.x || 0;
    this.z = data.z || 0;
    this.affectsSettlements = data.affectsSettlements || [];
    
    // Timing
    this.startTime = data.startTime || Date.now();
    this.duration = data.duration || 300000; // 5 minutes
    this.endTime = this.startTime + this.duration;
    
    // Effects
    this.economyEffect = data.economyEffect || 0;
    this.safetyEffect = data.safetyEffect || 0;
    this.populationEffect = data.populationEffect || 0;
    
    // State
    this.active = true;
    this.resolved = false;
  }
  
  // Check if event is active
  isActive() {
    const now = Date.now();
    return this.active && now >= this.startTime && now < this.endTime;
  }
  
  // Resolve event
  resolve(outcome) {
    this.resolved = true;
    this.outcome = outcome;
  }
  
  serialize() {
    return {
      id: this.id,
      type: this.type,
      title: this.title,
      x: this.x,
      z: this.z,
      startTime: this.startTime,
      duration: this.duration,
      active: this.active,
      resolved: this.resolved
    };
  }
}

// Event Types
export const EventType = {
  FESTIVAL: 'festival',
  FAMINE: 'famine',
  PLAGUE: 'plague',
  WAR: 'war',
  BANDIT_RAID: 'bandit_raid',
  TRADE_FAIR: 'trade_fair',
  HARVEST_FESTIVAL: 'harvest_festival',
  RELIGIOUS_EVENT: 'religious_event',
  MARKET_DAY: 'market_day'
};

// ============================================================================
// SIMULATION MANAGER
// ============================================================================

export class WorldSimulation {
  constructor(worldState, routeGraph, terrainGrid) {
    this.worldState = worldState;
    this.routeGraph = routeGraph;
    this.terrainGrid = terrainGrid;
    
    // Simulation entities
    this.caravans = new Map();
    this.patrols = new Map();
    this.wanderers = new Map();
    
    // Events
    this.activeEvents = [];
    this.eventHistory = [];
    
    // Timing
    this.lastUpdate = Date.now();
    this.updateInterval = 1000; // 1 second
    this.eventTimer = 0;
    this.eventInterval = 60000; // 1 minute
    
    // Configuration
    this.maxCaravans = 10;
    this.maxPatrols = 20;
    this.maxWanderers = 30;
    
    // Initialize
    this.initializeSimulation();
  }
  
  // Initialize simulation entities
  initializeSimulation() {
    this.spawnInitialCaravans();
    this.spawnInitialPatrols();
    this.spawnInitialWanderers();
  }
  
  // Spawn initial caravans
  spawnInitialCaravans() {
    const settlements = this.worldState.settlements;
    
    for (let i = 0; i < 5; i++) {
      const startIdx = Math.floor(Math.random() * settlements.length);
      let endIdx = Math.floor(Math.random() * settlements.length);
      
      while (endIdx === startIdx) {
        endIdx = Math.floor(Math.random() * settlements.length);
      }
      
      const start = settlements[startIdx];
      const end = settlements[endIdx];
      
      // Find route
      const route = this.routeGraph.findPath(start.id, end.id);
      
      if (route && route.length > 0) {
        const caravan = new SimCaravan(
          `caravan_${i}`,
          `tüccar_${i}`,
          start.id,
          end.id,
          route
        );
        
        caravan.currentX = start.x;
        caravan.currentZ = start.z;
        
        this.caravans.set(caravan.id, caravan);
      }
    }
  }
  
  // Spawn initial patrols
  spawnInitialPatrols() {
    const settlements = this.worldState.settlements;
    
    for (let i = 0; i < 10; i++) {
      const settlement = settlements[Math.floor(Math.random() * settlements.length)];
      
      // Create patrol route around settlement
      const route = this.createPatrolRoute(settlement);
      
      const patrol = new SimPatrol(
        `patrol_${i}`,
        settlement.faction || 'neutral',
        settlement.id,
        route
      );
      
      patrol.currentX = settlement.x;
      patrol.currentZ = settlement.z;
      
      this.patrols.set(patrol.id, patrol);
    }
  }
  
  // Create patrol route
  createPatrolRoute(settlement) {
    const route = [];
    const radius = 20;
    
    // Create square patrol pattern
    const points = [
      { x: settlement.x - radius, z: settlement.z - radius },
      { x: settlement.x + radius, z: settlement.z - radius },
      { x: settlement.x + radius, z: settlement.z + radius },
      { x: settlement.x - radius, z: settlement.z + radius },
      { x: settlement.x - radius, z: settlement.z - radius }
    ];
    
    for (let i = 0; i < points.length - 1; i++) {
      route.push({
        startX: points[i].x,
        startZ: points[i].z,
        endX: points[i + 1].x,
        endZ: points[i + 1].z
      });
    }
    
    return route;
  }
  
  // Spawn initial wanderers
  spawnInitialWanderers() {
    const settlements = this.worldState.settlements;
    const wandererTypes = ['tüccar', 'zanaatkâr', 'seyyah', 'dilenci', 'rahip'];
    
    for (let i = 0; i < 15; i++) {
      const settlement = settlements[Math.floor(Math.random() * settlements.length)];
      const type = wandererTypes[Math.floor(Math.random() * wandererTypes.length)];
      
      const wanderer = new SimWanderer(
        `wanderer_${i}`,
        type,
        settlement.id
      );
      
      wanderer.currentX = settlement.x + (Math.random() - 0.5) * 10;
      wanderer.currentZ = settlement.z + (Math.random() - 0.5) * 10;
      
      this.wanderers.set(wanderer.id, wanderer);
    }
  }
  
  // Main update
  update(deltaTime) {
    const now = Date.now();
    const dt = now - this.lastUpdate;
    this.lastUpdate = now;
    
    // Update entities
    this.updateCaravans(dt);
    this.updatePatrols(dt);
    this.updateWanderers(dt);
    
    // Update events
    this.updateEvents(dt);
    
    // Check for new events
    this.eventTimer += dt;
    if (this.eventTimer >= this.eventInterval) {
      this.eventTimer = 0;
      this.checkForNewEvent();
    }
  }
  
  // Update caravans
  updateCaravans(deltaTime) {
    for (const caravan of this.caravans.values()) {
      caravan.update(deltaTime);
      
      // Check if arrived
      if (caravan.state === 'arrived') {
        // Despawn or respawn
        this.respawnCaravan(caravan);
      }
    }
  }
  
  // Respawn caravan
  respawnCaravan(caravan) {
    const settlements = this.worldState.settlements;
    
    const startIdx = Math.floor(Math.random() * settlements.length);
    let endIdx = Math.floor(Math.random() * settlements.length);
    
    while (endIdx === startIdx) {
      endIdx = Math.floor(Math.random() * settlements.length);
    }
    
    const start = settlements[startIdx];
    const end = settlements[endIdx];
    
    const route = this.routeGraph.findPath(start.id, end.id);
    
    if (route && route.length > 0) {
      caravan.startId = start.id;
      caravan.endId = end.id;
      caravan.route = route;
      caravan.currentX = start.x;
      caravan.currentZ = start.z;
      caravan.progress = 0;
      caravan.currentSegment = 0;
      caravan.state = 'traveling';
    }
  }
  
  // Update patrols
  updatePatrols(deltaTime) {
    for (const patrol of this.patrols.values()) {
      patrol.update(deltaTime);
    }
  }
  
  // Update wanderers
  updateWanderers(deltaTime) {
    for (const wanderer of this.wanderers.values()) {
      wanderer.update(deltaTime);
    }
  }
  
  // Update events
  updateEvents(deltaTime) {
    // Check for expired events
    const now = Date.now();
    
    for (const event of this.activeEvents) {
      if (now >= event.endTime && !event.resolved) {
        event.resolve({});
        this.eventHistory.push(event);
      }
    }
    
    // Remove expired events
    this.activeEvents = this.activeEvents.filter(e => e.isActive());
  }
  
  // Check for new event
  checkForNewEvent() {
    if (Math.random() > 0.1) return; // 10% chance per minute
    
    const eventTypes = [
      EventType.MARKET_DAY,
      EventType.FESTIVAL,
      EventType.TRADE_FAIR
    ];
    
    const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    
    // Pick random settlement
    const settlements = this.worldState.settlements;
    const settlement = settlements[Math.floor(Math.random() * settlements.length)];
    
    const event = new WorldEvent(type, {
      title: this.getEventTitle(type),
      x: settlement.x,
      z: settlement.z,
      affectsSettlements: [settlement.id],
      economyEffect: 0.2,
      safetyEffect: 0.1
    });
    
    this.activeEvents.push(event);
  }
  
  // Get event title
  getEventTitle(type) {
    const titles = {
      [EventType.FESTIVAL]: 'Festival',
      [EventType.FAMINE]: 'Kıtlık',
      [EventType.PLAGUE]: 'Veba',
      [EventType.WAR]: 'Savaş',
      [EventType.BANDIT_RAID]: 'Eşkıya Saldırısı',
      [EventType.TRADE_FAIR]: 'Ticaret Fuarı',
      [EventType.HARVEST_FESTIVAL]: 'Hasat Festivali',
      [EventType.RELIGIOUS_EVENT]: 'Dini Etkinlik',
      [EventType.MARKET_DAY]: 'Pazar Günü'
    };
    
    return titles[type] || 'Olay';
  }
  
  // Get entities near position
  getEntitiesNear(x, z, radius) {
    const entities = [];
    
    // Check caravans
    for (const caravan of this.caravans.values()) {
      const pos = caravan.getPosition();
      const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.z - z, 2));
      
      if (dist < radius) {
        entities.push({ type: SimEntityType.CARAVAN, entity: caravan, distance: dist });
      }
    }
    
    // Check patrols
    for (const patrol of this.patrols.values()) {
      const pos = patrol.getPosition();
      const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.z - z, 2));
      
      if (dist < radius) {
        entities.push({ type: SimEntityType.PATROL, entity: patrol, distance: dist });
      }
    }
    
    // Check wanderers
    for (const wanderer of this.wanderers.values()) {
      const dist = Math.sqrt(
        Math.pow(wanderer.currentX - x, 2) + 
        Math.pow(wanderer.currentZ - z, 2)
      );
      
      if (dist < radius) {
        entities.push({ type: SimEntityType.WANDERER, entity: wanderer, distance: dist });
      }
    }
    
    return entities.sort((a, b) => a.distance - b.distance);
  }
  
  // Get active events
  getActiveEvents() {
    return this.activeEvents;
  }
  
  // Get events at settlement
  getEventsAtSettlement(settlementId) {
    return this.activeEvents.filter(e => 
      e.affectsSettlements.includes(settlementId)
    );
  }
  
  // Serialize
  serialize() {
    return {
      caravans: Array.from(this.caravans.values()).map(c => c.serialize()),
      patrols: Array.from(this.patrols.values()).map(p => p.serialize()),
      wanderers: Array.from(this.wanderers.values()).map(w => w.serialize()),
      activeEvents: this.activeEvents.map(e => e.serialize()),
      eventHistory: this.eventHistory.slice(-20).map(e => e.serialize())
    };
  }
  
  // Deserialize
  static deserialize(data, worldState, routeGraph, terrainGrid) {
    const sim = new WorldSimulation(worldState, routeGraph, terrainGrid);
    
    if (data) {
      // Restore entities
      if (data.caravans) {
        sim.caravans.clear();
        for (const cData of data.caravans) {
          const caravan = new SimCaravan(
            cData.id, cData.owner, cData.startId, cData.endId, []
          );
          sim.caravans.set(caravan.id, caravan);
        }
      }
    }
    
    return sim;
  }
}

export default WorldSimulation;
export { SimEntityType, SimCaravan, SimPatrol, SimWanderer, WorldEvent, EventType };