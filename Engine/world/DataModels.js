// Engine/World/DataModels.js - World + Travel Data Structures

/**
 * MapNode - Harita üzerinde bir nokta (yerleşim, kavşak, geçit vb)
 */
export class MapNode {
  constructor(id, type, position) {
    this.id = id;
    this.type = type; // 'settlement' | 'junction' | 'pass' | 'bridge' | 'camp' | 'landmark'
    this.position = { x: position.x, y: position.y || 0, z: position.z };
    this.region = null; // Region ID
    
    // Settlement specific
    this.settlementId = null;
    this.settlementType = null; // 'village' | 'town' | 'city' | 'castle' | 'hamlet'
    
    // Connections
    this.connections = []; // Edge IDs
    
    // Travel properties
    this.safety = 50; // 0-100
    this.visibility = 100; // 0-100 (fog, forest)
    
    // Control
    this.owner = null; // Faction/player ID
    this.contested = false;
    
    // State
    this.accessible = true;
    this.discoveredBy = new Set(); // Player IDs who discovered this
    
    // Services (if settlement)
    this.services = {
      inn: false,
      market: false,
      blacksmith: false,
      stable: false,
      healer: false,
    };
  }
  
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: this.position,
      region: this.region,
      settlementId: this.settlementId,
      settlementType: this.settlementType,
      connections: this.connections,
      safety: this.safety,
      visibility: this.visibility,
      owner: this.owner,
      contested: this.contested,
      accessible: this.accessible,
      discoveredBy: Array.from(this.discoveredBy),
      services: this.services,
    };
  }
}

/**
 * RouteEdge - İki node arası yol bağlantısı
 */
export class RouteEdge {
  constructor(id, fromNode, toNode, type) {
    this.id = id;
    this.from = fromNode; // Node ID
    this.to = toNode; // Node ID
    
    // Route type
    this.type = type; // 'main_road' | 'secondary_road' | 'dirt_path' | 'trail' | 'mountain_pass' | 'shortcut'
    
    // Distance (calculated from nodes)
    this.distance = 0; // meters
    this.baseTime = 0; // hours (at normal speed)
    
    // Terrain
    this.terrainDifficulty = 1.0; // 1.0 = normal, 2.0 = 2x slower
    this.roadQuality = 0.5; // 0-1 (0 = no road, 1 = paved)
    this.elevation = 0; // elevation gain/loss in meters
    
    // Safety
    this.safetyBase = 50; // 0-100
    this.banditPressure = 0; // 0-1 (accumulated danger)
    this.patrolled = false;
    this.lastPatrolTime = 0;
    
    // Conditions
    this.weatherSensitive = true; // snow/rain affects travel
    this.seasonalStability = 1.0; // 1.0 = stable, 0.5 = winter makes 50% harder
    this.maintenanceLevel = 1.0; // 0-1 (decays over time)
    
    // Tactical
    this.visibility = 0.8; // 0-1 (ambush risk, lower = more dangerous)
    this.chokepoint = false; // narrow pass, bridge, etc
    
    // State
    this.blocked = false;
    this.blockedReason = null;
    this.temporaryRiskModifier = 0; // +/- risk from events
    
    // Discovery
    this.hidden = false; // shortcut not yet discovered
    this.discoveredBy = new Set();
  }
  
  calculateDistance(nodeA, nodeB) {
    const dx = nodeB.position.x - nodeA.position.x;
    const dz = nodeB.position.z - nodeA.position.z;
    this.distance = Math.sqrt(dx * dx + dz * dz);
    this.baseTime = this.distance / 1000 / 5; // Assume 5 km/h base
  }
  
  getTravelTime(speed, weatherMod, terrainMod) {
    const totalDifficulty = this.terrainDifficulty * (1 / Math.max(0.1, this.roadQuality));
    const effectiveSpeed = speed * weatherMod * (1 / totalDifficulty) * terrainMod;
    return this.distance / (effectiveSpeed * 1000); // hours
  }
  
  getCurrentSafety(timeOfDay, weather) {
    let safety = this.safetyBase;
    
    // Night penalty
    if (timeOfDay > 0.75 || timeOfDay < 0.25) safety -= 20;
    
    // Weather penalty
    if (weather === 'fog' || weather === 'storm') safety -= 15;
    
    // Patrol bonus
    if (this.patrolled) safety += 20;
    
    // Bandit pressure
    safety -= this.banditPressure * 30;
    
    // Temporary events
    safety += this.temporaryRiskModifier;
    
    return Math.max(0, Math.min(100, safety));
  }
  
  serialize() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      type: this.type,
      distance: this.distance,
      baseTime: this.baseTime,
      terrainDifficulty: this.terrainDifficulty,
      roadQuality: this.roadQuality,
      elevation: this.elevation,
      safetyBase: this.safetyBase,
      banditPressure: this.banditPressure,
      patrolled: this.patrolled,
      lastPatrolTime: this.lastPatrolTime,
      weatherSensitive: this.weatherSensitive,
      seasonalStability: this.seasonalStability,
      maintenanceLevel: this.maintenanceLevel,
      visibility: this.visibility,
      chokepoint: this.chokepoint,
      blocked: this.blocked,
      blockedReason: this.blockedReason,
      temporaryRiskModifier: this.temporaryRiskModifier,
      hidden: this.hidden,
      discoveredBy: Array.from(this.discoveredBy),
    };
  }
}

/**
 * TerrainPatch - Arazi parçası
 */
export class TerrainPatch {
  constructor(id, center, radius, type) {
    this.id = id;
    this.center = { x: center.x, z: center.z };
    this.radius = radius;
    this.type = type; // 'forest' | 'dense_forest' | 'open_field' | 'hill' | 'mountain' | 'river' | 'swamp' | 'farmland' | 'ruin' | 'bandit_territory'
    
    // Movement
    this.speedModifier = 1.0; // 0.5 = half speed
    this.fatigueRate = 1.0; // 0-2
    
    // Visibility
    this.visibilityRange = 100; // meters
    this.coverValue = 0.5; // 0-1 (ambush potential)
    
    // Risk
    this.encounterChance = 0.1; // per hour
    this.encounterTypes = []; // ['bandit', 'wildlife', 'patrol']
    
    // Settlement suitability
    this.settlementSuitability = 0.5; // 0-1
    
    // Weather
    this.weatherExposure = 0.5; // 0-1
    this.floodRisk = 0; // 0-1
    
    this.initializeByType();
  }
  
  initializeByType() {
    const configs = {
      forest: { speed: 0.8, fatigue: 1.2, visibility: 50, cover: 0.7, encounter: 0.15, settlement: 0.3 },
      dense_forest: { speed: 0.5, fatigue: 1.5, visibility: 30, cover: 0.9, encounter: 0.25, settlement: 0.1 },
      open_field: { speed: 1.2, fatigue: 0.8, visibility: 200, cover: 0.1, encounter: 0.05, settlement: 0.8 },
      hill: { speed: 0.9, fatigue: 1.3, visibility: 150, cover: 0.4, encounter: 0.1, settlement: 0.4 },
      mountain: { speed: 0.6, fatigue: 1.8, visibility: 100, cover: 0.6, encounter: 0.2, settlement: 0.2 },
      river: { speed: 0.3, fatigue: 1.1, visibility: 80, cover: 0.5, encounter: 0.1, settlement: 0.7 },
      swamp: { speed: 0.4, fatigue: 1.9, visibility: 40, cover: 0.8, encounter: 0.3, settlement: 0.1 },
      farmland: { speed: 1.1, fatigue: 0.9, visibility: 120, cover: 0.2, encounter: 0.02, settlement: 0.9 },
      ruin: { speed: 0.7, fatigue: 1.0, visibility: 60, cover: 0.8, encounter: 0.4, settlement: 0.2 },
      bandit_territory: { speed: 0.9, fatigue: 1.1, visibility: 70, cover: 0.6, encounter: 0.6, settlement: 0.0 },
    };
    
    const config = configs[this.type] || configs.open_field;
    this.speedModifier = config.speed;
    this.fatigueRate = config.fatigue;
    this.visibilityRange = config.visibility;
    this.coverValue = config.cover;
    this.encounterChance = config.encounter;
    this.settlementSuitability = config.settlement;
  }
  
  containsPoint(x, z) {
    const dx = x - this.center.x;
    const dz = z - this.center.z;
    return Math.sqrt(dx * dx + dz * dz) <= this.radius;
  }
}

/**
 * Region - Bölge (birden fazla settlement içerir)
 */
export class Region {
  constructor(id, name, bounds) {
    this.id = id;
    this.name = name;
    this.bounds = { ...bounds }; // { minX, maxX, minZ, maxZ }
    
    // Geography
    this.terrainDominance = {}; // { forest: 0.6, field: 0.4 }
    this.elevationAvg = 0;
    
    // Control
    this.owner = null; // Faction ID
    this.contested = false;
    this.borderRegions = [];
    
    // Economy
    this.tradeActivity = 50; // 0-100
    this.prosperity = 50; // 0-100
    
    // Safety
    this.banditActivity = 20; // 0-100
    this.patrolCoverage = 50; // 0-100
    
    // Settlements
    this.settlements = [];
    this.totalPopulation = 0;
    
    // Weather
    this.currentWeather = 'clear';
    this.weatherTransitionTime = 0;
  }
  
  containsPoint(x, z) {
    return x >= this.bounds.minX && x <= this.bounds.maxX &&
           z >= this.bounds.minZ && z <= this.bounds.maxZ;
  }
  
  updateProsperity() {
    // Prosperity based on trade, safety, population
    const tradeFactor = this.tradeActivity / 100;
    const safetyFactor = (100 - this.banditActivity) / 100;
    this.prosperity = Math.round((tradeFactor + safetyFactor) * 50);
  }
}

/**
 * TravelState - Oyuncunun/NPC'nin yolculuk durumu
 */
export class TravelState {
  constructor(travelerEntityId) {
    this.active = false;
    this.traveler = travelerEntityId;
    
    // Route
    this.route = []; // Node IDs
    this.edges = []; // Edge IDs
    this.currentNodeIndex = 0;
    this.currentEdgeIndex = 0;
    this.progressAlongEdge = 0; // 0-1
    
    // Time
    this.startTime = 0;
    this.elapsedTime = 0;
    this.estimatedArrival = 0;
    this.pausedTime = 0;
    
    // Costs
    this.distanceTraveled = 0;
    this.fatigueGained = 0;
    this.foodConsumed = 0;
    
    // Speed
    this.baseSpeed = 5; // km/h
    this.currentSpeed = 5;
    this.speedModifiers = {}; // { weather: 0.8, terrain: 0.9, fatigue: 0.95 }
    
    // Risk
    this.currentRisk = 0; // 0-100
    this.encountersHad = [];
    this.nextEncounterCheck = 0;
    
    // Mode
    this.mode = 'walking'; // 'walking' | 'accelerated' | 'camping' | 'interrupted'
    this.canContinue = true;
    this.pauseReason = null;
    
    // Log
    this.log = [];
  }
  
  addLogEntry(message, type = 'info') {
    this.log.push({
      time: this.elapsedTime,
      message,
      type, // 'info' | 'danger' | 'discovery' | 'arrival'
    });
  }
  
  getCurrentNode() {
    return this.route[this.currentNodeIndex];
  }
  
  getCurrentEdge() {
    return this.edges[this.currentEdgeIndex];
  }
  
  isComplete() {
    return this.currentNodeIndex >= this.route.length - 1;
  }
  
  serialize() {
    return {
      active: this.active,
      traveler: this.traveler,
      route: this.route,
      edges: this.edges,
      currentNodeIndex: this.currentNodeIndex,
      currentEdgeIndex: this.currentEdgeIndex,
      progressAlongEdge: this.progressAlongEdge,
      startTime: this.startTime,
      elapsedTime: this.elapsedTime,
      estimatedArrival: this.estimatedArrival,
      pausedTime: this.pausedTime,
      distanceTraveled: this.distanceTraveled,
      fatigueGained: this.fatigueGained,
      foodConsumed: this.foodConsumed,
      baseSpeed: this.baseSpeed,
      currentSpeed: this.currentSpeed,
      speedModifiers: this.speedModifiers,
      currentRisk: this.currentRisk,
      encountersHad: this.encountersHad,
      mode: this.mode,
      canContinue: this.canContinue,
      pauseReason: this.pauseReason,
      log: this.log,
    };
  }
}

/**
 * WeatherState - Hava durumu
 */
export class WeatherState {
  constructor() {
    this.current = 'clear'; // 'clear' | 'cloudy' | 'rain' | 'heavy_rain' | 'fog' | 'storm' | 'snow' | 'wind'
    this.intensity = 0; // 0-1
    
    // Effects
    this.visibilityModifier = 1.0; // 0-1
    this.speedModifier = 1.0; // 0-1
    this.riskModifier = 1.0; // 0-2
    
    // Forecast
    this.duration = 0; // hours remaining
    this.nextWeather = 'clear';
    this.transitionTime = 0;
    
    // Regional variation
    this.regionalWeather = {}; // regionId -> weather type
    
    this.initializeEffects();
  }
  
  initializeEffects() {
    const effects = {
      clear: { vis: 1.0, speed: 1.0, risk: 1.0 },
      cloudy: { vis: 0.9, speed: 1.0, risk: 1.0 },
      rain: { vis: 0.7, speed: 0.85, risk: 1.1 },
      heavy_rain: { vis: 0.5, speed: 0.7, risk: 1.3 },
      fog: { vis: 0.4, speed: 0.9, risk: 1.4 },
      storm: { vis: 0.3, speed: 0.6, risk: 1.8 },
      snow: { vis: 0.6, speed: 0.7, risk: 1.2 },
      wind: { vis: 0.8, speed: 0.9, risk: 1.0 },
    };
    
    const e = effects[this.current] || effects.clear;
    this.visibilityModifier = e.vis;
    this.speedModifier = e.speed;
    this.riskModifier = e.risk;
  }
  
  changeWeather(newWeather, intensity = 0.5) {
    this.current = newWeather;
    this.intensity = intensity;
    this.initializeEffects();
  }
}

/**
 * RiskProfile - Risk hesaplaması
 */
export class RiskProfile {
  constructor() {
    this.baseRisk = 0; // 0-100
    
    // Factors
    this.terrainRisk = 0;
    this.weatherRisk = 0;
    this.timeRisk = 0; // night = higher
    this.routeRisk = 0;
    this.regionRisk = 0;
    this.partyRisk = 0; // small party = higher risk
    
    // Encounter
    this.encounterChancePerHour = 0;
    this.encounterSeverity = 0.5; // 0-1
    
    // Result
    this.totalRisk = 0;
    this.recommendedPartySize = 1;
  }
  
  calculate() {
    this.totalRisk = Math.min(100, 
      this.terrainRisk +
      this.weatherRisk +
      this.timeRisk +
      this.routeRisk +
      this.regionRisk -
      this.partyRisk
    );
    
    this.encounterChancePerHour = (this.totalRisk / 100) * 0.3; // Max 30% per hour
    this.recommendedPartySize = Math.ceil(this.totalRisk / 20);
    
    return this.totalRisk;
  }
}

/**
 * RoutePlan - Hesaplanmış rota planı
 */
export class RoutePlan {
  constructor(startNodeId, endNodeId) {
    this.start = startNodeId;
    this.end = endNodeId;
    
    this.routes = {
      fastest: null,
      safest: null,
      balanced: null,
    };
    
    this.recommended = 'balanced';
  }
  
  addRoute(type, nodes, edges, metrics) {
    this.routes[type] = {
      nodes, // Array of node IDs
      edges, // Array of edge IDs
      distance: metrics.distance,
      time: metrics.time, // hours
      risk: metrics.risk, // 0-100
      fatigue: metrics.fatigue,
      food: metrics.food,
      roadQuality: metrics.roadQuality, // avg 0-1
      safety: metrics.safety, // avg 0-100
    };
  }
  
  getRoute(type) {
    return this.routes[type];
  }
}