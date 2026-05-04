// filepath: Engine/world/WorldData.js
/**
 * World Data Model - Core world representation
 * Handles settlements, regions, zones and world state
 */

// ============================================================================
// WORLD DATA MODELS
// ============================================================================

// Settlement Types
export const SettlementType = {
  VILLAGE: 'village',      // Tarım ve kaynak üretimi
  HAMLET: 'hamlet',        // Küçük seyrek yaşam noktaları
  TOWN: 'town',            // Ticaret düğümleri
  CASTLE: 'castle',        // Stratejik savunma noktası
  CITY: 'city'             // Ekonomik ve politik merkez
};

// Settlement Data Model
export class Settlement {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type;
    this.x = data.x;
    this.z = data.z;
    
    // Economy
    this.economy = data.economy || {};
    this.production = data.production || {};
    this.trade = data.trade || {};
    
    // Control
    this.faction = data.faction || 'neutral';
    this.loyalty = data.loyalty || 50;
    this.population = data.population || 50;
    
    // Connections
    this.connections = data.connections || [];
    this.routes = data.routes || [];
    
    // State
    this.active = true;
    this.discovered = false;
    this.lastVisit = 0;
  }
  
  // Get settlement tier based on type
  getTier() {
    switch(this.type) {
      case SettlementType.CITY: return 5;
      case SettlementType.TOWN: return 4;
      case SettlementType.CASTLE: return 3;
      case SettlementType.VILLAGE: return 2;
      case SettlementType.HAMLET: return 1;
      default: return 0;
    }
  }
  
  // Get production capacity
  getProductionCapacity() {
    const base = { food: 0, wood: 0, iron: 0, leather: 0, meat: 0 };
    switch(this.type) {
      case SettlementType.CITY:
        base.food = 50; base.wood = 30; base.iron = 20; base.leather = 15; base.meat = 20;
        break;
      case SettlementType.TOWN:
        base.food = 30; base.wood = 20; base.iron = 15; base.leather = 10; base.meat = 15;
        break;
      case SettlementType.CASTLE:
        base.food = 20; base.wood = 15; base.iron = 25; base.leather = 10; base.meat = 10;
        break;
      case SettlementType.VILLAGE:
        base.food = 40; base.wood = 20; base.iron = 5; base.leather = 10; base.meat = 15;
        break;
      case SettlementType.HAMLET:
        base.food = 15; base.wood = 10; base.iron = 2; base.leather = 5; base.meat = 8;
        break;
    }
    return base;
  }
  
  // Serialize for saving
  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      x: this.x,
      z: this.z,
      economy: this.economy,
      faction: this.faction,
      loyalty: this.loyalty,
      population: this.population,
      connections: this.connections,
      active: this.active,
      discovered: this.discovered,
      lastVisit: this.lastVisit
    };
  }
  
  // Deserialize from save
  static deserialize(data) {
    return new Settlement(data);
  }
}

// Region Data Model
export class Region {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.centerX = data.centerX;
    this.centerZ = data.centerZ;
    this.radius = data.radius || 30;
    
    // Terrain composition
    this.terrainTypes = data.terrainTypes || {};
    this.dangerLevel = data.dangerLevel || 0; // 0-100
    this.safetyLevel = data.safetyLevel || 50; // 0-100
    
    // Control
    this.controllingFaction = data.controllingFaction || 'neutral';
    this.contested = data.contested || false;
    
    // Settlements in region
    this.settlements = data.settlements || [];
    
    // Routes through region
    this.routes = data.routes || [];
  }
  
  // Get travel modifier based on danger
  getTravelModifier() {
    if (this.dangerLevel > 70) return { speed: 0.7, risk: 0.4 };
    if (this.dangerLevel > 40) return { speed: 0.85, risk: 0.2 };
    if (this.dangerLevel > 20) return { speed: 0.95, risk: 0.1 };
    return { speed: 1.0, risk: 0.05 };
  }
  
  serialize() {
    return {
      id: this.id,
      name: this.name,
      centerX: this.centerX,
      centerZ: this.centerZ,
      radius: this.radius,
      terrainTypes: this.terrainTypes,
      dangerLevel: this.dangerLevel,
      safetyLevel: this.safetyLevel,
      controllingFaction: this.controllingFaction,
      contested: this.contested,
      settlements: this.settlements,
      routes: this.routes
    };
  }
}

// World Zone - Strategic area classification
export class WorldZone {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.type = data.type; // 'safe', 'frontier', 'wild', 'bandit', 'war'
    this.bounds = data.bounds; // { minX, maxX, minZ, maxZ }
    
    // Zone properties
    this.baseDanger = data.baseDanger || 0;
    this.patrolFrequency = data.patrolFrequency || 0;
    this.encounterRate = data.encounterRate || 0;
    
    // Faction presence
    this.factionPresence = data.factionPresence || {};
    
    // Dynamic state
    this.currentThreat = data.currentThreat || 0;
    this.lastUpdate = data.lastUpdate || 0;
  }
  
  // Check if position is in zone
  contains(x, z) {
    return x >= this.bounds.minX && x <= this.bounds.maxX &&
           z >= this.bounds.minZ && z <= this.bounds.maxZ;
  }
  
  // Get effective danger considering time and events
  getEffectiveDanger(timeOfDay, weather) {
    let danger = this.baseDanger;
    
    // Night increases danger
    if (timeOfDay < 6 || timeOfDay > 20) {
      danger += 20;
    }
    
    // Bad weather increases danger
    if (weather === 'fog' || weather === 'storm') {
      danger += 15;
    }
    
    // Add dynamic threat
    danger += this.currentThreat;
    
    return Math.min(100, danger);
  }
  
  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      bounds: this.bounds,
      baseDanger: this.baseDanger,
      patrolFrequency: this.patrolFrequency,
      encounterRate: this.encounterRate,
      factionPresence: this.factionPresence,
      currentThreat: this.currentThreat,
      lastUpdate: this.lastUpdate
    };
  }
}

// World State - Main container
export class WorldState {
  constructor() {
    this.settlements = new Map();
    this.regions = new Map();
    this.zones = new Map();
    this.routes = new Map();
    
    // World dimensions
    this.worldSize = 500; // units
    this.gridSize = 10; // for terrain chunks
    
    // Discovery state
    this.discoveredAreas = new Set();
    this.exploredRegions = new Set();
    
    // Dynamic state
    this.activeEvents = [];
    this.tempDangerZones = [];
  }
  
  // Add settlement
  addSettlement(settlement) {
    this.settlements.set(settlement.id, settlement);
  }
  
  // Get settlement by ID
  getSettlement(id) {
    return this.settlements.get(id);
  }
  
  // Get settlement by position
  getSettlementAt(x, z, radius = 5) {
    for (const settlement of this.settlements.values()) {
      const dist = Math.sqrt(
        Math.pow(x - settlement.x, 2) + 
        Math.pow(z - settlement.z, 2)
      );
      if (dist <= radius) return settlement;
    }
    return null;
  }
  
  // Get nearby settlements
  getNearbySettlements(x, z, maxDistance = 50) {
    const nearby = [];
    for (const settlement of this.settlements.values()) {
      const dist = Math.sqrt(
        Math.pow(x - settlement.x, 2) + 
        Math.pow(z - settlement.z, 2)
      );
      if (dist <= maxDistance) {
        nearby.push({ settlement, distance: dist });
      }
    }
    return nearby.sort((a, b) => a.distance - b.distance);
  }
  
  // Add region
  addRegion(region) {
    this.regions.set(region.id, region);
  }
  
  // Get region at position
  getRegionAt(x, z) {
    for (const region of this.regions.values()) {
      const dist = Math.sqrt(
        Math.pow(x - region.centerX, 2) + 
        Math.pow(z - region.centerZ, 2)
      );
      if (dist <= region.radius) return region;
    }
    return null;
  }
  
  // Add zone
  addZone(zone) {
    this.zones.set(zone.id, zone);
  }
  
  // Get zone at position
  getZoneAt(x, z) {
    for (const zone of this.zones.values()) {
      if (zone.contains(x, z)) return zone;
    }
    return null;
  }
  
  // Add route
  addRoute(route) {
    this.routes.set(route.id, route);
  }
  
  // Get route by ID
  getRoute(id) {
    return this.routes.get(id);
  }
  
  // Find routes between settlements
  findRoutesBetween(startId, endId) {
    const routes = [];
    for (const route of this.routes.values()) {
      if (route.startId === startId && route.endId === endId) {
        routes.push(route);
      }
    }
    return routes;
  }
  
  // Discover area
  discoverArea(x, z, radius = 20) {
    const key = `${Math.floor(x / 10)}_${Math.floor(z / 10)}`;
    this.discoveredAreas.add(key);
    
    // Check for nearby settlements
    const nearby = this.getNearbySettlements(x, z, radius);
    for (const { settlement } of nearby) {
      settlement.discovered = true;
      settlement.lastVisit = Date.now();
    }
  }
  
  // Update dynamic danger
  updateDynamicDanger(zoneId, threatChange) {
    const zone = this.zones.get(zoneId);
    if (zone) {
      zone.currentThreat = Math.max(0, Math.min(100, 
        zone.currentThreat + threatChange
      ));
      zone.lastUpdate = Date.now();
    }
  }
  
  // Serialize entire world state
  serialize() {
    const data = {
      settlements: {},
      regions: {},
      zones: {},
      routes: {},
      discoveredAreas: Array.from(this.discoveredAreas),
      exploredRegions: Array.from(this.exploredRegions),
      activeEvents: this.activeEvents,
      tempDangerZones: this.tempDangerZones
    };
    
    for (const [id, settlement] of this.settlements) {
      data.settlements[id] = settlement.serialize();
    }
    for (const [id, region] of this.regions) {
      data.regions[id] = region.serialize();
    }
    for (const [id, zone] of this.zones) {
      data.zones[id] = zone.serialize();
    }
    for (const [id, route] of this.routes) {
      data.routes[id] = route.serialize();
    }
    
    return data;
  }
  
  // Deserialize world state
  static deserialize(data) {
    const world = new WorldState();
    
    if (data.settlements) {
      for (const [id, sData] of Object.entries(data.settlements)) {
        world.settlements.set(id, Settlement.deserialize(sData));
      }
    }
    if (data.regions) {
      for (const [id, rData] of Object.entries(data.regions)) {
        world.regions.set(id, new Region(rData));
      }
    }
    if (data.zones) {
      for (const [id, zData] of Object.entries(data.zones)) {
        world.zones.set(id, new WorldZone(zData));
      }
    }
    if (data.routes) {
      for (const [id, rData] of Object.entries(data.routes)) {
        world.routes.set(id, Route.deserialize(rData));
      }
    }
    
    if (data.discoveredAreas) {
      world.discoveredAreas = new Set(data.discoveredAreas);
    }
    if (data.exploredRegions) {
      world.exploredRegions = new Set(data.exploredRegions);
    }
    
    return world;
  }
}

export default WorldState;