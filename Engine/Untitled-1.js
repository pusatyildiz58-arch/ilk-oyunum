// Engine/World/Systems - Architecture Overview

/**
 * WORLD + TRAVEL SYSTEM ARCHITECTURE
 * 
 * Bu sistem 7 ana katmandan oluşur:
 * 
 * 1. WorldGraph - Harita node/edge graph'ı
 * 2. TravelSystem - Yolculuk yönetimi
 * 3. RouteCalculator - Rota hesaplama (Dijkstra/A*)
 * 4. WeatherSystem - Hava durumu simülasyonu
 * 5. WorldSimulation - Dünya simülasyonu (NPC, caravan, patrol)
 * 6. EncounterSystem - Yol üstü olaylar
 * 7. RegionManager - Bölge yönetimi ve LOD
 */

// ============================================================================
// 1. WorldGraph - Harita node/edge yönetimi
// ============================================================================

import { MapNode, RouteEdge, TerrainPatch, Region } from './DataModels.js';

export class WorldGraph {
  constructor() {
    this.nodes = new Map(); // nodeId -> MapNode
    this.edges = new Map(); // edgeId -> RouteEdge
    this.regions = new Map(); // regionId -> Region
    this.terrainPatches = []; // TerrainPatch array
    
    // Adjacency list for pathfinding
    this.adjacency = new Map(); // nodeId -> [edgeId, edgeId, ...]
    
    // Spatial index (for fast queries)
    this.nodeGrid = new Map(); // "x,z" -> nodeIds
    this.gridSize = 50; // 50m cells
  }
  
  // ---- Node operations ----
  addNode(node) {
    this.nodes.set(node.id, node);
    this.adjacency.set(node.id, []);
    this.addToGrid(node);
  }
  
  getNode(nodeId) {
    return this.nodes.get(nodeId);
  }
  
  getNodesInRadius(x, z, radius) {
    const results = [];
    const cellRadius = Math.ceil(radius / this.gridSize);
    const centerX = Math.floor(x / this.gridSize);
    const centerZ = Math.floor(z / this.gridSize);
    
    for (let gx = centerX - cellRadius; gx <= centerX + cellRadius; gx++) {
      for (let gz = centerZ - cellRadius; gz <= centerZ + cellRadius; gz++) {
        const key = `${gx},${gz}`;
        const nodeIds = this.nodeGrid.get(key);
        if (nodeIds) {
          for (const nodeId of nodeIds) {
            const node = this.nodes.get(nodeId);
            const dx = node.position.x - x;
            const dz = node.position.z - z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= radius) results.push(node);
          }
        }
      }
    }
    return results;
  }
  
  // ---- Edge operations ----
  addEdge(edge) {
    this.edges.set(edge.id, edge);
    
    // Add to adjacency
    if (!this.adjacency.has(edge.from)) this.adjacency.set(edge.from, []);
    if (!this.adjacency.has(edge.to)) this.adjacency.set(edge.to, []);
    
    this.adjacency.get(edge.from).push(edge.id);
    this.adjacency.get(edge.to).push(edge.id); // Bidirectional
  }
  
  getEdge(edgeId) {
    return this.edges.get(edgeId);
  }
  
  getEdgesBetween(nodeA, nodeB) {
    const edgesFromA = this.adjacency.get(nodeA) || [];
    return edgesFromA.filter(edgeId => {
      const edge = this.edges.get(edgeId);
      return (edge.from === nodeA && edge.to === nodeB) || 
             (edge.from === nodeB && edge.to === nodeA);
    }).map(id => this.edges.get(id));
  }
  
  getConnectedEdges(nodeId) {
    return (this.adjacency.get(nodeId) || []).map(id => this.edges.get(id));
  }
  
  // ---- Terrain operations ----
  addTerrainPatch(patch) {
    this.terrainPatches.push(patch);
  }
  
  getTerrainAt(x, z) {
    for (const patch of this.terrainPatches) {
      if (patch.containsPoint(x, z)) return patch;
    }
    return null; // Default terrain
  }
  
  // ---- Region operations ----
  addRegion(region) {
    this.regions.set(region.id, region);
  }
  
  getRegionAt(x, z) {
    for (const region of this.regions.values()) {
      if (region.containsPoint(x, z)) return region;
    }
    return null;
  }
  
  // ---- Spatial grid ----
  addToGrid(node) {
    const gx = Math.floor(node.position.x / this.gridSize);
    const gz = Math.floor(node.position.z / this.gridSize);
    const key = `${gx},${gz}`;
    
    if (!this.nodeGrid.has(key)) this.nodeGrid.set(key, []);
    this.nodeGrid.get(key).push(node.id);
  }
  
  // ---- Serialization ----
  serialize() {
    return {
      nodes: Array.from(this.nodes.values()).map(n => n.serialize()),
      edges: Array.from(this.edges.values()).map(e => e.serialize()),
      regions: Array.from(this.regions.values()).map(r => ({
        id: r.id, name: r.name, bounds: r.bounds, owner: r.owner,
        banditActivity: r.banditActivity, tradeActivity: r.tradeActivity
      })),
      terrainPatches: this.terrainPatches.map(p => ({
        id: p.id, center: p.center, radius: p.radius, type: p.type
      })),
    };
  }
}

// ============================================================================
// 2. RouteCalculator - Pathfinding
// ============================================================================

import { RoutePlan } from './DataModels.js';

export class RouteCalculator {
  constructor(worldGraph) {
    this.graph = worldGraph;
  }
  
  /**
   * Calculate multiple routes between two nodes
   */
  calculateRoutes(startNodeId, endNodeId, options = {}) {
    const plan = new RoutePlan(startNodeId, endNodeId);
    
    // Fastest route (prioritize speed)
    const fastest = this.findPath(startNodeId, endNodeId, {
      optimize: 'time',
      allowDangerous: true,
      ...options
    });
    if (fastest) plan.addRoute('fastest', fastest.nodes, fastest.edges, fastest.metrics);
    
    // Safest route (prioritize safety)
    const safest = this.findPath(startNodeId, endNodeId, {
      optimize: 'safety',
      allowDangerous: false,
      ...options
    });
    if (safest) plan.addRoute('safest', safest.nodes, safest.edges, safest.metrics);
    
    // Balanced route
    const balanced = this.findPath(startNodeId, endNodeId, {
      optimize: 'balanced',
      allowDangerous: false,
      ...options
    });
    if (balanced) plan.addRoute('balanced', balanced.nodes, balanced.edges, balanced.metrics);
    
    return plan;
  }
  
  /**
   * A* / Dijkstra pathfinding
   */
  findPath(startId, goalId, options) {
    const { optimize = 'balanced', allowDangerous = false, timeOfDay = 0.5, weather = 'clear' } = options;
    
    const openSet = new Set([startId]);
    const cameFrom = new Map();
    const gScore = new Map(); // Cost from start
    const fScore = new Map(); // Estimated total cost
    
    gScore.set(startId, 0);
    fScore.set(startId, this.heuristic(startId, goalId));
    
    while (openSet.size > 0) {
      // Get node with lowest fScore
      let current = null;
      let lowestF = Infinity;
      for (const nodeId of openSet) {
        const f = fScore.get(nodeId) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = nodeId;
        }
      }
      
      if (current === goalId) {
        return this.reconstructPath(cameFrom, current, gScore, optimize, timeOfDay, weather);
      }
      
      openSet.delete(current);
      
      // Check neighbors
      const edges = this.graph.getConnectedEdges(current);
      for (const edge of edges) {
        const neighbor = edge.from === current ? edge.to : edge.from;
        
        // Skip if blocked or too dangerous
        if (edge.blocked) continue;
        if (!allowDangerous && edge.getCurrentSafety(timeOfDay, weather) < 30) continue;
        
        const tentativeG = (gScore.get(current) || Infinity) + this.edgeCost(edge, optimize, timeOfDay, weather);
        
        if (tentativeG < (gScore.get(neighbor) || Infinity)) {
          cameFrom.set(neighbor, { node: current, edge: edge.id });
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + this.heuristic(neighbor, goalId));
          openSet.add(neighbor);
        }
      }
    }
    
    return null; // No path found
  }
  
  edgeCost(edge, optimize, timeOfDay, weather) {
    const weatherMod = weather === 'storm' ? 0.6 : weather === 'rain' ? 0.8 : 1.0;
    
    if (optimize === 'time') {
      return edge.getTravelTime(5, weatherMod, 1.0);
    } else if (optimize === 'safety') {
      const safety = edge.getCurrentSafety(timeOfDay, weather);
      return edge.distance / Math.max(0.1, safety / 100);
    } else { // balanced
      const time = edge.getTravelTime(5, weatherMod, 1.0);
      const safety = edge.getCurrentSafety(timeOfDay, weather);
      const safetyPenalty = (100 - safety) / 100;
      return time * (1 + safetyPenalty);
    }
  }
  
  heuristic(nodeA, nodeB) {
    const a = this.graph.getNode(nodeA);
    const b = this.graph.getNode(nodeB);
    if (!a || !b) return Infinity;
    
    const dx = b.position.x - a.position.x;
    const dz = b.position.z - a.position.z;
    return Math.sqrt(dx * dx + dz * dz) / 5000; // Estimate hours at 5 km/h
  }
  
  reconstructPath(cameFrom, current, gScore, optimize, timeOfDay, weather) {
    const nodes = [current];
    const edges = [];
    
    while (cameFrom.has(current)) {
      const prev = cameFrom.get(current);
      nodes.unshift(prev.node);
      edges.unshift(prev.edge);
      current = prev.node;
    }
    
    // Calculate metrics
    let totalDistance = 0;
    let totalTime = 0;
    let totalRisk = 0;
    let roadQualitySum = 0;
    let safetySum = 0;
    
    for (const edgeId of edges) {
      const edge = this.graph.getEdge(edgeId);
      totalDistance += edge.distance;
      totalTime += edge.getTravelTime(5, 1.0, 1.0);
      totalRisk += 100 - edge.getCurrentSafety(timeOfDay, 'clear');
      roadQualitySum += edge.roadQuality;
      safetySum += edge.getCurrentSafety(timeOfDay, 'clear');
    }
    
    return {
      nodes,
      edges,
      metrics: {
        distance: totalDistance,
        time: totalTime,
        risk: totalRisk / edges.length,
        roadQuality: roadQualitySum / edges.length,
        safety: safetySum / edges.length,
        fatigue: totalTime * 10, // Simplified
        food: totalTime * 0.5, // Simplified
      }
    };
  }
}

// ============================================================================
// 3. System Integration Points
// ============================================================================

/**
 * TravelSystem - Manages active travels
 * - Updates TravelState each tick
 * - Handles interruptions
 * - Triggers encounters
 * - Manages camping
 * 
 * File: Engine/Systems/TravelSystem.js
 */

/**
 * WeatherSystem - Simulates weather
 * - Regional weather variation
 * - Weather transitions
 * - Seasonal effects
 * - Travel impact
 * 
 * File: Engine/Systems/WeatherSystem.js
 */

/**
 * WorldSimulationSystem - Background world updates
 * - NPC caravan movement
 * - Patrol routes
 * - Bandit pressure
 * - Trade activity
 * - Road maintenance decay
 * 
 * File: Engine/Systems/WorldSimulationSystem.js
 */

/**
 * EncounterSystem - Random encounters
 * - Weighted by terrain, route, time, weather
 * - Encounter resolution
 * - Dialogue trees
 * - Combat triggers
 * 
 * File: Engine/Systems/EncounterSystem.js
 */

/**
 * RegionManager - LOD and performance
 * - Active region = full simulation
 * - Near region = medium simulation
 * - Far region = low/passive simulation
 * - Chunk loading/unloading
 * 
 * File: Engine/World/RegionManager.js
 */