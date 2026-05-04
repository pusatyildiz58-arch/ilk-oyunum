// filepath: Engine/world/RouteGraph.js
/**
 * Route Graph System - Path finding and route management
 * Handles road networks, path finding, and travel calculations
 */

// ============================================================================
// ROUTE GRAPH MODELS
// ============================================================================

// Route Types
export const RouteType = {
  MAIN_ROAD: 'main_road',       // Paved/maintained road
  SECONDARY_ROAD: 'secondary_road', // Country road
  DIRT_PATH: 'dirt_path',       // Unpaved path
  FOREST_TRAIL: 'forest_trail', // Forest path
  MOUNTAIN_PASS: 'mountain_pass', // Mountain crossing
  RIVER_CROSSING: 'river_crossing', // Bridge or ford
  HIDDEN_SHORTCUT: 'hidden_shortcut', // Hidden path
  MILITARY_ROUTE: 'military_route', // Strategic military path
  TRADE_ROUTE: 'trade_route'    // Caravan trade route
};

// Route Edge
export class RouteEdge {
  constructor(data) {
    this.id = data.id;
    this.startId = data.startId;
    this.endId = data.endId;
    this.type = data.type;
    
    // Distance and time
    this.distance = data.distance; // in world units
    this.baseTravelTime = data.baseTravelTime || 0; // in game minutes
    
    // Route properties
    this.quality = data.quality || 50; // 0-100 road quality
    this.safety = data.safety || 50; // 0-100 safety rating
    this.visibility = data.visibility || 100; // 0-100
    
    // Terrain modifiers
    this.terrainPenalty = data.terrainPenalty || 1.0;
    this.weatherPenalty = data.weatherPenalty || 1.0;
    
    // Control
    this.controlledBy = data.controlledBy || 'neutral';
    this.tollCost = data.tollCost || 0;
    
    // Dynamic state
    this.blocked = data.blocked || false;
    this.blockedReason = data.blockedReason || '';
    this.dangerLevel = data.dangerLevel || 0;
  }
  
  // Calculate actual travel time
  getTravelTime(weather, timeOfDay, partySize, load) {
    if (this.blocked) return Infinity;
    
    let time = this.baseTravelTime;
    
    // Weather penalty
    if (weather === 'rain' || weather === 'heavy_rain') {
      time *= this.weatherPenalty * 1.3;
    } else if (weather === 'snow') {
      time *= this.weatherPenalty * 1.5;
    } else if (weather === 'fog') {
      time *= 1.1;
    }
    
    // Night penalty
    if (timeOfDay < 6 || timeOfDay > 20) {
      time *= 1.3;
    }
    
    // Party size penalty
    time *= 1 + (partySize - 1) * 0.05;
    
    // Load penalty
    time *= 1 + load * 0.1;
    
    // Terrain quality
    time *= 2 - (this.quality / 100);
    
    return time;
  }
  
  // Get encounter probability
  getEncounterChance(timeOfDay, weather) {
    let chance = this.dangerLevel;
    
    // Night increases
    if (timeOfDay < 6 || timeOfDay > 20) {
      chance += 15;
    }
    
    // Bad weather increases
    if (weather === 'fog' || weather === 'storm') {
      chance += 10;
    }
    
    return Math.min(100, chance);
  }
  
  serialize() {
    return {
      id: this.id,
      startId: this.startId,
      endId: this.endId,
      type: this.type,
      distance: this.distance,
      baseTravelTime: this.baseTravelTime,
      quality: this.quality,
      safety: this.safety,
      visibility: this.visibility,
      terrainPenalty: this.terrainPenalty,
      weatherPenalty: this.weatherPenalty,
      controlledBy: this.controlledBy,
      tollCost: this.tollCost,
      blocked: this.blocked,
      blockedReason: this.blockedReason,
      dangerLevel: this.dangerLevel
    };
  }
  
  static deserialize(data) {
    return new RouteEdge(data);
  }
}

// Route Node (junction points)
export class RouteNode {
  constructor(data) {
    this.id = data.id;
    this.x = data.x;
    this.z = data.z;
    this.type = data.type; // 'settlement', 'junction', 'pass', 'bridge', 'camp'
    
    // Connected routes
    this.connections = data.connections || []; // route IDs
    
    // Node properties
    this.name = data.name || '';
    this.shelter = data.shelter || false;
    this.water = data.water || false;
    this.safe = data.safe || false;
  }
  
  serialize() {
    return {
      id: this.id,
      x: this.x,
      z: this.z,
      type: this.type,
      connections: this.connections,
      name: this.name,
      shelter: this.shelter,
      water: this.water,
      safe: this.safe
    };
  }
}

// Route Graph
export class RouteGraph {
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }
  
  // Add node
  addNode(node) {
    this.nodes.set(node.id, node);
  }
  
  // Add edge
  addEdge(edge) {
    this.edges.set(edge.id, edge);
    
    // Update node connections
    const startNode = this.nodes.get(edge.startId);
    const endNode = this.nodes.get(edge.endId);
    if (startNode && !startNode.connections.includes(edge.id)) {
      startNode.connections.push(edge.id);
    }
    if (endNode && !endNode.connections.includes(edge.id)) {
      endNode.connections.push(edge.id);
    }
  }
  
  // Get node
  getNode(id) {
    return this.nodes.get(id);
  }
  
  // Get edge
  getEdge(id) {
    return this.edges.get(id);
  }
  
  // Get connected edges from node
  getEdgesFrom(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    
    return node.connections
      .map(id => this.edges.get(id))
      .filter(e => e !== undefined);
  }
  
  // Find path using A* algorithm
  findPath(startId, endId, options = {}) {
    const { 
      preferSafety = false, 
      preferSpeed = false,
      avoidDanger = false 
    } = options;
    
    const openSet = new Map();
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    const startNode = this.nodes.get(startId);
    const endNode = this.nodes.get(endId);
    
    if (!startNode || !endNode) return null;
    
    const startKey = startId;
    openSet.set(startKey, startNode);
    gScore.set(startKey, 0);
    fScore.set(startKey, this.heuristic(startNode, endNode));
    
    while (openSet.size > 0) {
      // Get node with lowest fScore
      let current = null;
      let lowestF = Infinity;
      for (const [id, node] of openSet) {
        const f = fScore.get(id) || Infinity;
        if (f < lowestF) {
          lowestF = f;
          current = id;
        }
      }
      
      if (current === endId) {
        return this.reconstructPath(cameFrom, current);
      }
      
      openSet.delete(current);
      closedSet.add(current);
      
      const currentNode = this.nodes.get(current);
      const edges = this.getEdgesFrom(current);
      
      for (const edge of edges) {
        if (closedSet.has(edge.endId)) continue;
        if (edge.blocked) continue;
        
        // Calculate g score
        let edgeWeight = edge.distance;
        
        if (preferSafety) {
          edgeWeight *= (2 - edge.safety / 100);
        }
        if (avoidDanger && edge.dangerLevel > 30) {
          edgeWeight *= 2;
        }
        
        const tentativeG = (gScore.get(current) || 0) + edgeWeight;
        
        if (!openSet.has(edge.endId)) {
          openSet.set(edge.endId, this.nodes.get(edge.endId));
        } else if (tentativeG >= (gScore.get(edge.endId) || Infinity)) {
          continue;
        }
        
        cameFrom.set(edge.endId, { from: current, edge: edge.id });
        gScore.set(edge.endId, tentativeG);
        fScore.set(edge.endId, tentativeG + this.heuristic(
          this.nodes.get(edge.endId), 
          endNode
        ));
      }
    }
    
    return null; // No path found
  }
  
  // Heuristic for A*
  heuristic(nodeA, nodeB) {
    return Math.sqrt(
      Math.pow(nodeA.x - nodeB.x, 2) + 
      Math.pow(nodeA.z - nodeB.z, 2)
    );
  }
  
  // Reconstruct path
  reconstructPath(cameFrom, current) {
    const path = [];
    let node = current;
    
    while (cameFrom.has(node)) {
      const { from, edge } = cameFrom.get(node);
      path.unshift({
        nodeId: node,
        edgeId: edge,
        edge: this.edges.get(edge)
      });
      node = from;
    }
    
    return path;
  }
  
  // Find fastest route
  findFastestRoute(startId, endId) {
    return this.findPath(startId, endId, { preferSpeed: true });
  }
  
  // Find safest route
  findSafestRoute(startId, endId) {
    return this.findPath(startId, endId, { preferSafety: true });
  }
  
  // Get all routes from settlement
  getRoutesFromSettlement(settlementId) {
    return Array.from(this.edges.values()).filter(
      e => e.startId === settlementId || e.endId === settlementId
    );
  }
  
  // Update route danger
  updateRouteDanger(routeId, dangerLevel) {
    const route = this.edges.get(routeId);
    if (route) {
      route.dangerLevel = Math.max(0, Math.min(100, dangerLevel));
    }
  }
  
  // Block/unblock route
  setRouteBlocked(routeId, blocked, reason = '') {
    const route = this.edges.get(routeId);
    if (route) {
      route.blocked = blocked;
      route.blockedReason = reason;
    }
  }
  
  // Serialize
  serialize() {
    return {
      nodes: Object.fromEntries(this.nodes),
      edges: Object.fromEntries(
        Array.from(this.edges.entries()).map(([k, v]) => [k, v.serialize()])
      )
    };
  }
  
  // Deserialize
  static deserialize(data) {
    const graph = new RouteGraph();
    
    if (data.nodes) {
      for (const [id, nData] of Object.entries(data.nodes)) {
        graph.nodes.set(id, new RouteNode(nData));
      }
    }
    
    if (data.edges) {
      for (const [id, eData] of Object.entries(data.edges)) {
        graph.edges.set(id, RouteEdge.deserialize(eData));
      }
    }
    
    return graph;
  }
}

export default RouteGraph;