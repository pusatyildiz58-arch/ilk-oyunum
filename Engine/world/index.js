// filepath: Engine/world\index.js
/**
 * World Module Index
 * Exports all world system modules
 */

// World Data
export { WorldState, Settlement, SettlementType, Region, WorldZone } from './WorldData.js';

// Route Graph
export { RouteGraph, RouteEdge, RouteNode, RoadType } from './RouteGraph.js';

// Terrain System
export { TerrainGrid, TerrainType, TERRAIN_PROPERTIES } from './TerrainSystem.js';

// Travel System
export { TravelManager, TravelState, TravelCalculator, TravelMode } from './TravelSystem.js';

// Weather System
export { WeatherState, WeatherType, WEATHER_PROPERTIES } from './WeatherSystem.js';

// Encounter System
export { EncounterManager, EncounterType, ZoneDanger, SafetyLevel } from './EncounterSystem.js';

// World Simulation
export { WorldSimulation, SimEntityType, EventType, SimCaravan, SimPatrol, SimWanderer, WorldEvent } from './WorldSimulation.js';

// World Manager
export { WorldManager } from './WorldManager.js';

// Default export
export default {
  WorldManager,
  WorldState,
  RouteGraph,
  TerrainGrid,
  TravelManager,
  WeatherState,
  EncounterManager,
  WorldSimulation
};