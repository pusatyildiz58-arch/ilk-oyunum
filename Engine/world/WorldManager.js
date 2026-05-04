// filepath: Engine/world/WorldManager.js
/**
 * World Manager - Main coordinator for all world systems
 * Integrates WorldData, RouteGraph, Terrain, Travel, Weather, Encounter, and Simulation
 */

// ============================================================================
// WORLD MANAGER
// ============================================================================

import { WorldState, Settlement, SettlementType, Region, WorldZone } from './WorldData.js';
import { RouteGraph, RouteEdge, RouteNode, RoadType } from './RouteGraph.js';
import { TerrainGrid, TerrainType, TERRAIN_PROPERTIES } from './TerrainSystem.js';
import { TravelManager, TravelState, TravelCalculator, TravelMode } from './TravelSystem.js';
import { WeatherState, WeatherType, WEATHER_PROPERTIES } from './WeatherSystem.js';
import { EncounterManager, EncounterType, ZoneDanger } from './EncounterSystem.js';
import { WorldSimulation, SimEntityType, EventType } from './WorldSimulation.js';

export class WorldManager {
  constructor(game) {
    this.game = game;
    
    // Core systems
    this.worldState = null;
    this.routeGraph = null;
    this.terrainGrid = null;
    this.travelManager = null;
    this.weatherState = null;
    this.encounterManager = null;
    this.simulation = null;
    
    // Configuration
    this.config = {
      worldSize: 200,
      gridSize: 10,
      settlementCount: 15,
      roadDensity: 0.3
    };
    
    // State
    this.initialized = false;
    this.paused = false;
  }
  
  // Initialize world
  async initialize() {
    console.log('🌍 World Manager: Initializing...');
    
    // Create terrain grid
    this.terrainGrid = new TerrainGrid(this.config.worldSize, this.config.gridSize);
    console.log('  ✓ Terrain Grid created');
    
    // Create world state with settlements
    this.worldState = new WorldState(this.config.worldSize);
    this.createSettlements();
    console.log('  ✓ World State created with settlements');
    
    // Create route graph
    this.routeGraph = new RouteGraph(this.worldState);
    this.createRoads();
    console.log('  ✓ Route Graph created');
    
    // Create travel manager
    this.travelManager = new TravelManager(
      this.worldState, 
      this.routeGraph, 
      this.terrainGrid
    );
    console.log('  ✓ Travel Manager created');
    
    // Create weather state
    this.weatherState = new WeatherState();
    console.log('  ✓ Weather State created');
    
    // Create encounter manager
    this.encounterManager = new EncounterManager(
      this.worldState, 
      this.terrainGrid
    );
    console.log('  ✓ Encounter Manager created');
    
    // Create world simulation
    this.simulation = new WorldSimulation(
      this.worldState, 
      this.routeGraph, 
      this.terrainGrid
    );
    console.log('  ✓ World Simulation created');
    
    this.initialized = true;
    console.log('🌍 World Manager: Initialization complete!');
    
    return this;
  }
  
  // Create settlements
  createSettlements() {
    const settlements = [
      // Major cities
      { name: 'İstanbul', type: 'CITY', x: 0, z: 0, faction: 'empire' },
      { name: 'Bursa', type: 'TOWN', x: -40, z: 20, faction: 'empire' },
      { name: 'Edirne', type: 'TOWN', x: 40, z: -20, faction: 'empire' },
      
      // Villages
      { name: 'Köprübaşı', type: 'VILLAGE', x: -30, z: -30, faction: 'neutral' },
      { name: 'Dağköy', type: 'VILLAGE', x: 30, z: 30, faction: 'neutral' },
      { name: 'Ova', type: 'VILLAGE', x: -20, z: 40, faction: 'neutral' },
      { name: 'Sınır', type: 'VILLAGE', x: 50, z: 0, faction: 'border' },
      { name: 'Yeşilvadi', type: 'VILLAGE', x: -50, z: -10, faction: 'neutral' },
      { name: 'Kale', type: 'CASTLE', x: 20, z: -40, faction: 'empire' },
      { name: 'Liman', type: 'TOWN', x: -10, z: -50, faction: 'empire' },
      
      // Hamlets
      { name: 'Çiftlik', type: 'HAMLET', x: 10, z: 50, faction: 'neutral' },
      { name: 'Mezra', type: 'HAMLET', x: -35, z: 10, faction: 'neutral' },
      { name: 'Tepe', type: 'HAMLET', x: 45, z: 25, faction: 'neutral' },
      { name: 'Bağ', type: 'HAMLET', x: -15, z: -15, faction: 'neutral' },
      { name: 'Kervansaray', type: 'HAMLET', x: 25, z: 15, faction: 'neutral' }
    ];
    
    for (const s of settlements) {
      const settlement = new Settlement(s.name, s.type, s.x, s.z, s.faction);
      this.worldState.addSettlement(settlement);
    }
  }
  
  // Create roads between settlements
  createRoads() {
    const settlements = this.worldState.settlements;
    
    // Connect nearby settlements
    for (let i = 0; i < settlements.length; i++) {
      for (let j = i + 1; j < settlements.length; j++) {
        const a = settlements[i];
        const b = settlements[j];
        
        const dist = Math.sqrt(
          Math.pow(b.x - a.x, 2) + 
          Math.pow(b.z - a.z, 2)
        );
        
        // Connect if within range
        if (dist < 60) {
          const roadType = dist < 30 ? RoadType.MAIN_ROAD : RoadType.SECONDARY_ROAD;
          
          this.routeGraph.addRoad(
            a.id, 
            b.id, 
            dist, 
            roadType
          );
        }
      }
    }
  }
  
  // Main update loop
  update(deltaTime, timeSystem) {
    if (!this.initialized || this.paused) return;
    
    // Get current game time
    const gameTime = timeSystem?.getTime() || { hour: 12, day: 1 };
    
    // Update weather
    this.weatherState.update(deltaTime, gameTime);
    
    // Update encounter zones
    this.encounterManager.updateZones(gameTime.hour, this.getCurrentWeather());
    
    // Update travel
    if (this.travelManager.currentTravel.active) {
      this.travelManager.update(deltaTime, timeSystem);
    }
    
    // Update simulation
    this.simulation.update(deltaTime);
  }
  
  // Get current weather
  getCurrentWeather() {
    return this.weatherState.current;
  }
  
  // Get travel options to settlement
  getTravelOptions(targetSettlementId) {
    // Find nearest settlement to player
    const playerPos = this.getPlayerPosition();
    const nearestSettlement = this.travelManager.findNearestSettlement(
      playerPos.x, 
      playerPos.z
    );
    
    if (!nearestSettlement) return null;
    
    return this.travelManager.calculator.getTravelOptions(
      nearestSettlement.id, 
      targetSettlementId
    );
  }
  
  // Start travel to settlement
  travelTo(targetSettlementId, options = {}) {
    const playerPos = this.getPlayerPosition();
    
    return this.travelManager.travelToSettlement(targetSettlementId, {
      ...options,
      startX: playerPos.x,
      startZ: playerPos.z
    });
  }
  
  // Get player position (from game state)
  getPlayerPosition() {
    if (this.game && this.game.state) {
      return { x: this.game.state.x || 0, z: this.game.state.z || 0 };
    }
    return { x: 0, z: 0 };
  }
  
  // Get nearby settlements
  getNearbySettlements(x, z, radius = 50) {
    return this.worldState.getNearbySettlements(x, z, radius);
  }
  
  // Get settlement by ID
  getSettlement(id) {
    return this.worldState.getSettlement(id);
  }
  
  // Get all settlements
  getAllSettlements() {
    return this.worldState.settlements;
  }
  
  // Get terrain at position
  getTerrainAt(x, z) {
    return this.terrainGrid.getTerrainTypeAt(x, z);
  }
  
  // Get terrain modifiers at position
  getTerrainModifiers(x, z) {
    const weather = this.getCurrentWeather();
    const hour = this.game?.timeSystem?.hour || 12;
    return this.terrainGrid.getTerrainModifiers(x, z, weather, hour);
  }
  
  // Check for encounter
  checkForEncounter() {
    const playerPos = this.getPlayerPosition();
    const hour = this.game?.timeSystem?.hour || 12;
    const weather = this.getCurrentWeather();
    
    return this.encounterManager.checkForEncounter(
      playerPos.x, 
      playerPos.z, 
      hour, 
      weather
    );
  }
  
  // Get active events
  getActiveEvents() {
    return this.simulation.getActiveEvents();
  }
  
  // Get entities near player
  getNearbyEntities(radius = 30) {
    const playerPos = this.getPlayerPosition();
    return this.simulation.getEntitiesNear(playerPos.x, playerPos.z, radius);
  }
  
  // Get travel state
  getTravelState() {
    return this.travelManager.getState();
  }
  
  // Get weather state
  getWeatherState() {
    return this.weatherState.getProperties();
  }
  
  // Force weather (for testing/events)
  forceWeather(weatherType) {
    this.weatherState.forceWeather(weatherType);
  }
  
  // Pause world updates
  pause() {
    this.paused = true;
  }
  
  // Resume world updates
  resume() {
    this.paused = false;
  }
  
  // Serialize for save
  serialize() {
    return {
      worldState: this.worldState.serialize(),
      routeGraph: this.routeGraph.serialize(),
      terrainGrid: this.terrainGrid.serialize(),
      travel: this.travelManager.serialize(),
      weather: this.weatherState.serialize(),
      encounter: this.encounterManager.serialize(),
      simulation: this.simulation.serialize()
    };
  }
  
  // Deserialize from save
  static deserialize(data, game) {
    const manager = new WorldManager(game);
    
    if (data) {
      manager.worldState = WorldState.deserialize(data.worldState);
      manager.routeGraph = RouteGraph.deserialize(data.routeGraph, manager.worldState);
      manager.terrainGrid = TerrainGrid.deserialize(data.terrainGrid);
      manager.travelManager = TravelManager.deserialize(
        data.travel, 
        manager.worldState, 
        manager.routeGraph, 
        manager.terrainGrid
      );
      manager.weatherState = WeatherState.deserialize(data.weather);
      manager.encounterManager = EncounterManager.deserialize(
        data.encounter, 
        manager.worldState, 
        manager.terrainGrid
      );
      manager.simulation = WorldSimulation.deserialize(
        data.simulation, 
        manager.worldState, 
        manager.routeGraph, 
        manager.terrainGrid
      );
    }
    
    manager.initialized = true;
    return manager;
  }
}

// Export for use
export default WorldManager;
export { SettlementType, RoadType, WeatherType, EncounterType, EventType };