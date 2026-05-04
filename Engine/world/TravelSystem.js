// filepath: Engine/world/TravelSystem.js
/**
 * Travel System - Core travel mechanics and state machine
 * Handles travel modes, calculations, and interruptions
 */

// ============================================================================
// TRAVEL MODELS
// ============================================================================

// Travel Mode
export const TravelMode = {
  WALK: 'walk',           // Physical walking
  ACCELERATED: 'accelerated', // Time accelerated
  CAMP: 'camp',           // Camping
  INTERRUPTED: 'interrupted'  // Combat/event
};

// Travel State
export class TravelState {
  constructor() {
    this.mode = null;
    this.active = false;
    
    // Position
    this.currentX = 0;
    this.currentZ = 0;
    this.targetX = null;
    this.targetZ = null;
    
    // Route
    this.currentRoute = null;
    this.routeProgress = 0;
    this.routeIndex = 0;
    
    // Time tracking
    this.startTime = 0;
    this.elapsedTime = 0;
    this.estimatedArrival = 0;
    
    // Party state
    this.partySize = 1;
    this.loadWeight = 0;
    this.fatigue = 0;
    this.food = 0;
    
    // Risk tracking
    this.riskLevel = 0;
    this.encounterChance = 0;
    this.interruptionChance = 0;
    
    // Log
    this.travelLog = [];
  }
  
  // Start walking travel
  startWalk(x, z, targetX, targetZ, route) {
    this.mode = TravelMode.WALK;
    this.active = true;
    this.currentX = x;
    this.currentZ = z;
    this.targetX = targetX;
    this.targetZ = targetZ;
    this.currentRoute = route;
    this.routeProgress = 0;
    this.routeIndex = 0;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.addLog('Yürüyüş başladı');
  }
  
  // Start accelerated travel
  startAccelerated(x, z, targetX, targetZ, route, timeScale = 10) {
    this.mode = TravelMode.ACCELERATED;
    this.active = true;
    this.currentX = x;
    this.currentZ = z;
    this.targetX = targetX;
    this.targetZ = targetZ;
    this.currentRoute = route;
    this.routeProgress = 0;
    this.routeIndex = 0;
    this.startTime = Date.now();
    this.elapsedTime = 0;
    this.addLog(`Hızlandırılmış yolculuk başladı (${timeScale}x)`);
  }
  
  // Start camping
  startCamp(x, z) {
    this.mode = TravelMode.CAMP;
    this.active = true;
    this.currentX = x;
    this.currentZ = z;
    this.addLog('Kamp kuruldu');
  }
  
  // Interrupt travel
  interrupt(reason) {
    this.mode = TravelMode.INTERRUPTED;
    this.addLog(`Yolculuk kesintiye uğradı: ${reason}`);
  }
  
  // Resume travel
  resume() {
    if (this.mode === TravelMode.INTERRUPTED) {
      this.mode = TravelMode.WALK;
      this.addLog('Yolculuk devam ediyor');
    }
  }
  
  // End travel
  end() {
    this.active = false;
    this.mode = null;
    this.addLog('Yolculuk tamamlandı');
  }
  
  // Update position along route
  updatePosition(progress) {
    if (!this.currentRoute || this.currentRoute.length === 0) return;
    
    this.routeProgress = progress;
    
    // Calculate current position
    const totalSegments = this.currentRoute.length;
    const segmentProgress = progress * totalSegments;
    const segmentIndex = Math.floor(segmentProgress);
    const segmentFraction = segmentProgress - segmentIndex;
    
    if (segmentIndex < this.currentRoute.length) {
      const segment = this.currentRoute[segmentIndex];
      if (segment.edge) {
        const startNode = segment.edge.startId;
        const endNode = segment.edge.endId;
        
        // Interpolate position (simplified)
        this.currentX += (this.targetX - this.currentX) * 0.01;
        this.currentZ += (this.targetZ - this.currentZ) * 0.01;
      }
    }
  }
  
  // Add log entry
  addLog(message) {
    this.travelLog.push({
      time: Date.now(),
      message: message
    });
    
    // Keep last 50 entries
    if (this.travelLog.length > 50) {
      this.travelLog.shift();
    }
  }
  
  // Get travel statistics
  getStats() {
    return {
      mode: this.mode,
      active: this.active,
      elapsedTime: this.elapsedTime,
      progress: this.routeProgress,
      fatigue: this.fatigue,
      riskLevel: this.riskLevel,
      encounterChance: this.encounterChance
    };
  }
  
  // Serialize
  serialize() {
    return {
      mode: this.mode,
      active: this.active,
      currentX: this.currentX,
      currentZ: this.currentZ,
      targetX: this.targetX,
      targetZ: this.targetZ,
      routeProgress: this.routeProgress,
      routeIndex: this.routeIndex,
      startTime: this.startTime,
      elapsedTime: this.elapsedTime,
      partySize: this.partySize,
      loadWeight: this.loadWeight,
      fatigue: this.fatigue,
      food: this.food,
      riskLevel: this.riskLevel,
      encounterChance: this.encounterChance,
      travelLog: this.travelLog
    };
  }
  
  // Deserialize
  static deserialize(data) {
    const state = new TravelState();
    if (data) {
      state.mode = data.mode;
      state.active = data.active;
      state.currentX = data.currentX;
      state.currentZ = data.currentZ;
      state.targetX = data.targetX;
      state.targetZ = data.targetZ;
      state.routeProgress = data.routeProgress;
      state.routeIndex = data.routeIndex;
      state.startTime = data.startTime;
      state.elapsedTime = data.elapsedTime;
      state.partySize = data.partySize;
      state.loadWeight = data.loadWeight;
      state.fatigue = data.fatigue;
      state.food = data.food;
      state.riskLevel = data.riskLevel;
      state.encounterChance = data.encounterChance;
      state.travelLog = data.travelLog || [];
    }
    return state;
  }
}

// Travel Calculator
export class TravelCalculator {
  constructor(routeGraph, terrainGrid) {
    this.routeGraph = routeGraph;
    this.terrainGrid = terrainGrid;
  }
  
  // Calculate travel from settlement to settlement
  calculateTravel(startId, endId, options = {}) {
    const {
      weather = 'clear',
      timeOfDay = 12,
      partySize = 1,
      loadWeight = 0,
      preferSpeed = false,
      preferSafety = false
    } = options;
    
    // Find route
    const routeOptions = { preferSpeed, preferSafety };
    const path = this.routeGraph.findPath(startId, endId, routeOptions);
    
    if (!path || path.length === 0) {
      return null;
    }
    
    // Calculate total distance and time
    let totalDistance = 0;
    let totalTime = 0;
    let totalRisk = 0;
    let routeDetails = [];
    
    for (const segment of path) {
      const edge = segment.edge;
      if (!edge) continue;
      
      // Get terrain modifier
      const node = this.routeGraph.getNode(edge.endId);
      const terrainType = this.terrainGrid.getTerrainTypeAt(node.x, node.z);
      const terrainMod = this.terrainGrid.getTerrainModifiers(
        node.x, node.z, weather, timeOfDay
      );
      
      // Calculate segment time
      const segmentTime = edge.getTravelTime(weather, timeOfDay, partySize, loadWeight);
      const segmentRisk = edge.getEncounterChance(timeOfDay, weather);
      
      totalDistance += edge.distance;
      totalTime += segmentTime;
      totalRisk += segmentRisk;
      
      routeDetails.push({
        edge: edge,
        distance: edge.distance,
        time: segmentTime,
        risk: segmentRisk,
        terrain: terrainType
      });
    }
    
    // Apply party and load modifiers
    const partyMod = 1 + (partySize - 1) * 0.05;
    const loadMod = 1 + loadWeight * 0.1;
    totalTime *= partyMod * loadMod;
    
    return {
      startId,
      endId,
      path,
      routeDetails,
      totalDistance: Math.round(totalDistance),
      totalTime: Math.round(totalTime),
      avgRisk: Math.round(totalRisk / path.length),
      arrivalTime: Date.now() + totalTime * 60 * 1000 // in real ms
    };
  }
  
  // Calculate direct travel (no route)
  calculateDirectTravel(x1, z1, x2, z2, options = {}) {
    const {
      weather = 'clear',
      timeOfDay = 12,
      partySize = 1,
      loadWeight = 0
    } = options;
    
    const distance = Math.sqrt(
      Math.pow(x2 - x1, 2) + Math.pow(z2 - z1, 2)
    );
    
    // Base speed: 10 units per minute walking
    let speed = 10;
    
    // Get terrain at start
    const terrainType = this.terrainGrid.getTerrainTypeAt(x1, z1);
    const terrainMod = this.terrainGrid.getTerrainModifiers(x1, z1, weather, timeOfDay);
    
    speed *= terrainMod.speed;
    
    // Weather modifier
    if (weather === 'rain' || weather === 'heavy_rain') speed *= 0.8;
    if (weather === 'snow') speed *= 0.6;
    if (weather === 'fog') speed *= 0.9;
    
    // Night modifier
    if (timeOfDay < 6 || timeOfDay > 20) speed *= 0.7;
    
    // Party and load
    speed /= (1 + (partySize - 1) * 0.05);
    speed /= (1 + loadWeight * 0.1);
    
    const time = distance / speed;
    
    return {
      direct: true,
      startX: x1,
      startZ: z1,
      endX: x2,
      endZ: z2,
      distance: Math.round(distance),
      time: Math.round(time),
      arrivalTime: Date.now() + time * 60 * 1000
    };
  }
  
  // Get travel options for destination
  getTravelOptions(startId, endId) {
    const fastest = this.calculateTravel(startId, endId, { preferSpeed: true });
    const safest = this.calculateTravel(startId, endId, { preferSafety: true });
    const balanced = this.calculateTravel(startId, endId, {});
    
    return {
      fastest,
      safest,
      balanced
    };
  }
}

// Travel Manager - Coordinates travel system
export class TravelManager {
  constructor(worldState, routeGraph, terrainGrid) {
    this.worldState = worldState;
    this.routeGraph = routeGraph;
    this.terrainGrid = terrainGrid;
    this.calculator = new TravelCalculator(routeGraph, terrainGrid);
    
    this.currentTravel = new TravelState();
    this.timeScale = 1;
  }
  
  // Start travel to settlement
  travelToSettlement(targetId, options = {}) {
    const startSettlement = this.findNearestSettlement(
      options.startX || this.currentTravel.currentX,
      options.startZ || this.currentTravel.currentZ
    );
    
    if (!startSettlement) {
      return { error: 'Başlangıç noktası bulunamadı' };
    }
    
    const target = this.worldState.getSettlement(targetId);
    if (!target) {
      return { error: 'Hedef bulunamadı' };
    }
    
    // Calculate route
    const travel = this.calculator.calculateTravel(
      startSettlement.id,
      targetId,
      options
    );
    
    if (!travel) {
      return { error: 'Rota bulunamadı' };
    }
    
    // Start travel
    this.currentTravel.startWalk(
      startSettlement.x,
      startSettlement.z,
      target.x,
      target.z,
      travel.path
    );
    
    this.currentTravel.estimatedArrival = travel.arrivalTime;
    this.currentTravel.riskLevel = travel.avgRisk;
    this.currentTravel.encounterChance = travel.avgRisk * 0.5;
    
    return travel;
  }
  
  // Find nearest settlement
  findNearestSettlement(x, z) {
    const nearby = this.worldState.getNearbySettlements(x, z, 100);
    return nearby.length > 0 ? nearby[0].settlement : null;
  }
  
  // Update travel (called each frame)
  update(deltaTime, timeSystem) {
    if (!this.currentTravel.active) return;
    
    // Update elapsed time
    const scaledDelta = deltaTime * this.timeScale * timeSystem.timeScale;
    this.currentTravel.elapsedTime += scaledDelta;
    
    // Update position
    const progress = Math.min(1, this.currentTravel.elapsedTime / 1000);
    this.currentTravel.updatePosition(progress);
    
    // Check for arrival
    if (progress >= 1) {
      this.currentTravel.end();
      return { arrived: true };
    }
    
    // Check for encounter
    if (Math.random() * 100 < this.currentTravel.encounterChance * deltaTime) {
      this.currentTravel.interrupt('Karşılaşma!');
      return { encounter: true };
    }
    
    // Update fatigue
    this.currentTravel.fatigue += deltaTime * 0.5;
    
    return { 
      progress: progress,
      stats: this.currentTravel.getStats()
    };
  }
  
  // Set time scale
  setTimeScale(scale) {
    this.timeScale = Math.max(1, Math.min(50, scale));
  }
  
  // Get current state
  getState() {
    return this.currentTravel;
  }
  
  // Serialize
  serialize() {
    return {
      travel: this.currentTravel.serialize(),
      timeScale: this.timeScale
    };
  }
  
  // Deserialize
  static deserialize(data, worldState, routeGraph, terrainGrid) {
    const manager = new TravelManager(worldState, routeGraph, terrainGrid);
    
    if (data) {
      manager.currentTravel = TravelState.deserialize(data.travel);
      manager.timeScale = data.timeScale || 1;
    }
    
    return manager;
  }
}

export default TravelManager;
export { TravelMode, TravelState, TravelCalculator };