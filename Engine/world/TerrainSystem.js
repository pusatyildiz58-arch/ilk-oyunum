// filepath: Engine/world/TerrainSystem.js
/**
 * Terrain System - Ground types and travel modifiers
 * Handles terrain generation, classification, and travel effects
 */

// ============================================================================
// TERRAIN MODELS
// ============================================================================

// Terrain Types
export const TerrainType = {
  FOREST: 'forest',
  DENSE_FOREST: 'dense_forest',
  OPEN_FIELD: 'open_field',
  HILL: 'hill',
  MOUNTAIN: 'mountain',
  RIVER: 'river',
  SWAMP: 'swamp',
  ROAD: 'road',
  DIRT_PATH: 'dirt_path',
  BRIDGE: 'bridge',
  PASS: 'pass',
  FARMLAND: 'farmland',
  RUIN: 'ruin',
  BANDIT_TERRITORY: 'bandit_territory',
  SAFE_ZONE: 'safe_zone'
};

// Terrain Properties
export const TERRAIN_PROPERTIES = {
  [TerrainType.FOREST]: {
    name: 'Orman',
    speedMod: 0.8,
    visibilityMod: 0.6,
    riskMod: 1.2,
    encounterMod: 1.3,
    fatigueMod: 1.2,
    routePreference: 0.3,
    settlementSuitability: 0.2,
    weatherInteraction: { rain: -0.1, snow: -0.2 },
    tacticalValue: 0.7,
    color: 0x2d6830
  },
  [TerrainType.DENSE_FOREST]: {
    name: 'Sık Orman',
    speedMod: 0.5,
    visibilityMod: 0.3,
    riskMod: 1.5,
    encounterMod: 1.8,
    fatigueMod: 1.5,
    routePreference: 0.1,
    settlementSuitability: 0.05,
    weatherInteraction: { rain: -0.15, snow: -0.25 },
    tacticalValue: 0.9,
    color: 0x1f5a2a
  },
  [TerrainType.OPEN_FIELD]: {
    name: 'Açık Alan',
    speedMod: 1.0,
    visibilityMod: 1.0,
    riskMod: 0.8,
    encounterMod: 0.7,
    fatigueMod: 0.9,
    routePreference: 0.8,
    settlementSuitability: 0.8,
    weatherInteraction: { rain: 0, snow: -0.1 },
    tacticalValue: 0.3,
    color: 0x4a7a3e
  },
  [TerrainType.HILL]: {
    name: 'Tepe',
    speedMod: 0.7,
    visibilityMod: 1.2,
    riskMod: 0.9,
    encounterMod: 0.8,
    fatigueMod: 1.3,
    routePreference: 0.5,
    settlementSuitability: 0.4,
    weatherInteraction: { rain: -0.1, snow: -0.2 },
    tacticalValue: 0.6,
    color: 0x5a6a4a
  },
  [TerrainType.MOUNTAIN]: {
    name: 'Dağ',
    speedMod: 0.4,
    visibilityMod: 1.3,
    riskMod: 1.0,
    encounterMod: 0.5,
    fatigueMod: 1.8,
    routePreference: 0.2,
    settlementSuitability: 0.1,
    weatherInteraction: { rain: -0.3, snow: -0.4 },
    tacticalValue: 0.8,
    color: 0x6a6a5a
  },
  [TerrainType.RIVER]: {
    name: 'Nehir',
    speedMod: 0.2,
    visibilityMod: 0.8,
    riskMod: 1.2,
    encounterMod: 0.6,
    fatigueMod: 1.4,
    routePreference: 0,
    settlementSuitability: 0.5,
    weatherInteraction: { rain: 0.2, snow: 0 },
    tacticalValue: 0.4,
    color: 0x3a5a8a
  },
  [TerrainType.SWAMP]: {
    name: 'Bataklık',
    speedMod: 0.3,
    visibilityMod: 0.5,
    riskMod: 1.8,
    encounterMod: 1.5,
    fatigueMod: 1.6,
    routePreference: 0.05,
    settlementSuitability: 0.05,
    weatherInteraction: { rain: 0.3, snow: 0 },
    tacticalValue: 0.5,
    color: 0x3a4a3a
  },
  [TerrainType.ROAD]: {
    name: 'Ana Yol',
    speedMod: 1.2,
    visibilityMod: 1.0,
    riskMod: 0.5,
    encounterMod: 0.8,
    fatigueMod: 0.7,
    routePreference: 1.0,
    settlementSuitability: 0.9,
    weatherInteraction: { rain: -0.05, snow: -0.1 },
    tacticalValue: 0.2,
    color: 0x8b7355
  },
  [TerrainType.DIRT_PATH]: {
    name: 'Toprak Yol',
    speedMod: 0.9,
    visibilityMod: 0.9,
    riskMod: 0.7,
    encounterMod: 0.9,
    fatigueMod: 0.85,
    routePreference: 0.7,
    settlementSuitability: 0.7,
    weatherInteraction: { rain: -0.15, snow: -0.2 },
    tacticalValue: 0.3,
    color: 0x9b8365
  },
  [TerrainType.BRIDGE]: {
    name: 'Köprü',
    speedMod: 1.0,
    visibilityMod: 0.9,
    riskMod: 0.6,
    encounterMod: 0.7,
    fatigueMod: 0.8,
    routePreference: 0.9,
    settlementSuitability: 0.6,
    weatherInteraction: { rain: 0, snow: 0 },
    tacticalValue: 0.4,
    color: 0x707070
  },
  [TerrainType.PASS]: {
    name: 'Geçit',
    speedMod: 0.6,
    visibilityMod: 0.7,
    riskMod: 1.3,
    encounterMod: 1.0,
    fatigueMod: 1.4,
    routePreference: 0.4,
    settlementSuitability: 0.3,
    weatherInteraction: { rain: -0.2, snow: -0.35 },
    tacticalValue: 0.8,
    color: 0x5a5a5a
  },
  [TerrainType.FARMLAND]: {
    name: 'Tarla',
    speedMod: 0.85,
    visibilityMod: 0.9,
    riskMod: 0.6,
    encounterMod: 0.6,
    fatigueMod: 0.8,
    routePreference: 0.6,
    settlementSuitability: 0.9,
    weatherInteraction: { rain: 0.1, snow: -0.1 },
    tacticalValue: 0.2,
    color: 0x6b8f3a
  },
  [TerrainType.RUIN]: {
    name: 'Harabe',
    speedMod: 0.7,
    visibilityMod: 0.5,
    riskMod: 1.4,
    encounterMod: 1.6,
    fatigueMod: 1.1,
    routePreference: 0.2,
    settlementSuitability: 0.1,
    weatherInteraction: { rain: 0, snow: 0 },
    tacticalValue: 0.6,
    color: 0x5a504a
  },
  [TerrainType.BANDIT_TERRITORY]: {
    name: 'Eşkıya Bölgesi',
    speedMod: 0.6,
    visibilityMod: 0.4,
    riskMod: 2.0,
    encounterMod: 2.5,
    fatigueMod: 1.3,
    routePreference: 0.1,
    settlementSuitability: 0.0,
    weatherInteraction: { rain: 0.1, snow: 0 },
    tacticalValue: 0.5,
    color: 0x4a3020
  },
  [TerrainType.SAFE_ZONE]: {
    name: 'Güvenli Bölge',
    speedMod: 1.1,
    visibilityMod: 1.1,
    riskMod: 0.3,
    encounterMod: 0.3,
    fatigueMod: 0.8,
    routePreference: 0.9,
    settlementSuitability: 0.9,
    weatherInteraction: { rain: 0, snow: 0 },
    tacticalValue: 0.1,
    color: 0x3a6a3a
  }
};

// Terrain Patch - Grid cell
export class TerrainPatch {
  constructor(x, z, terrainType) {
    this.x = x;
    this.z = z;
    this.terrainType = terrainType;
    this.size = 10; // World units
    
    const props = TERRAIN_PROPERTIES[terrainType] || TERRAIN_PROPERTIES[TerrrainType.OPEN_FIELD];
    this.name = props.name;
    this.speedMod = props.speedMod;
    this.visibilityMod = props.visibilityMod;
    this.riskMod = props.riskMod;
    this.encounterMod = props.encounterMod;
    this.fatigueMod = props.fatigueMod;
    this.color = props.color;
  }
  
  // Get travel modifier for this patch
  getTravelModifier(weather, timeOfDay) {
    let mod = {
      speed: this.speedMod,
      visibility: this.visibilityMod,
      risk: this.riskMod,
      encounter: this.encounterMod,
      fatigue: this.fatigueMod
    };
    
    // Weather effects
    const props = TERRAIN_PROPERTIES[this.terrainType];
    if (props && props.weatherInteraction) {
      if (weather === 'rain' || weather === 'heavy_rain') {
        mod.speed += props.weatherInteraction.rain || 0;
      } else if (weather === 'snow') {
        mod.speed += props.weatherInteraction.snow || 0;
      }
    }
    
    // Night effects
    if (timeOfDay < 6 || timeOfDay > 20) {
      mod.visibility *= 0.6;
      mod.risk *= 1.2;
    }
    
    return mod;
  }
  
  // Get color for rendering
  getColor() {
    return this.color;
  }
  
  serialize() {
    return {
      x: this.x,
      z: this.z,
      terrainType: this.terrainType
    };
  }
}

// Terrain Grid
export class TerrainGrid {
  constructor(worldSize, gridSize = 10) {
    this.worldSize = worldSize;
    this.gridSize = gridSize;
    this.patches = new Map();
    
    this.generateTerrain();
  }
  
  // Generate terrain based on noise and rules
  generateTerrain() {
    const halfSize = this.worldSize / 2;
    const gridCount = Math.ceil(this.worldSize / this.gridSize);
    
    for (let gx = 0; gx < gridCount; gx++) {
      for (let gz = 0; gz < gridCount; gz++) {
        const worldX = -halfSize + gx * this.gridSize;
        const worldZ = -halfSize + gz * this.gridSize;
        
        const terrainType = this.determineTerrainType(worldX, worldZ);
        const patch = new TerrainPatch(worldX, worldZ, terrainType);
        
        const key = `${gx}_${gz}`;
        this.patches.set(key, patch);
      }
    }
  }
  
  // Determine terrain type at position
  determineTerrainType(x, z) {
    // Simple noise-based generation
    const noise1 = Math.sin(x * 0.02) * Math.cos(z * 0.02);
    const noise2 = Math.sin(x * 0.05 + z * 0.03);
    const noise3 = Math.cos(x * 0.01) * Math.sin(z * 0.015);
    
    const elevation = noise1 * 0.6 + noise2 * 0.3 + noise3 * 0.1;
    const moisture = noise2 * 0.5 + noise3 * 0.5;
    
    // River detection (diagonal band)
    const riverDist = Math.abs(x - z * 0.5);
    if (riverDist < 8) {
      return TerrainType.RIVER;
    }
    
    // Mountain peaks
    if (elevation > 0.7) {
      return TerrainType.MOUNTAIN;
    }
    
    // Hills
    if (elevation > 0.4) {
      return TerrainType.HILL;
    }
    
    // Dense forest in moist areas
    if (moisture > 0.3 && elevation > 0.1) {
      return Math.random() > 0.5 ? TerrainType.DENSE_FOREST : TerrainType.FOREST;
    }
    
    // Farmland near center (settlement area)
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter < 30 && Math.random() > 0.6) {
      return TerrainType.FARMLAND;
    }
    
    // Open fields
    if (moisture < 0.1) {
      return TerrainType.OPEN_FIELD;
    }
    
    // Regular forest
    return Math.random() > 0.3 ? TerrainType.FOREST : TerrainType.OPEN_FIELD;
  }
  
  // Get patch at position
  getPatchAt(x, z) {
    const halfSize = this.worldSize / 2;
    const gx = Math.floor((x + halfSize) / this.gridSize);
    const gz = Math.floor((z + halfSize) / this.gridSize);
    
    const key = `${gx}_${gz}`;
    return this.patches.get(key);
  }
  
  // Get terrain modifiers at position
  getTerrainModifiers(x, z, weather, timeOfDay) {
    const patch = this.getPatchAt(x, z);
    if (!patch) {
      return { speed: 1, visibility: 1, risk: 1, encounter: 1, fatigue: 1 };
    }
    return patch.getTravelModifier(weather, timeOfDay);
  }
  
  // Get terrain type at position
  getTerrainTypeAt(x, z) {
    const patch = this.getPatchAt(x, z);
    return patch ? patch.terrainType : TerrainType.OPEN_FIELD;
  }
  
  // Check if position is on road
  isOnRoad(x, z, roads) {
    for (const road of roads) {
      const dist = this.pointToLineDistance(
        x, z,
        road.x1, road.z1,
        road.x2, road.z2
      );
      if (dist < 3) return true;
    }
    return false;
  }
  
  // Point to line segment distance
  pointToLineDistance(px, pz, x1, z1, x2, z2) {
    const A = px - x1;
    const B = pz - z1;
    const C = x2 - x1;
    const D = z2 - z1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, zz;
    
    if (param < 0) {
      xx = x1;
      zz = z1;
    } else if (param > 1) {
      xx = x2;
      zz = z2;
    } else {
      xx = x1 + param * C;
      zz = z1 + param * D;
    }
    
    const dx = px - xx;
    const dz = pz - zz;
    
    return Math.sqrt(dx * dx + dz * dz);
  }
  
  // Serialize
  serialize() {
    const patches = {};
    for (const [key, patch] of this.patches) {
      patches[key] = patch.serialize();
    }
    return {
      worldSize: this.worldSize,
      gridSize: this.gridSize,
      patches: patches
    };
  }
  
  // Deserialize
  static deserialize(data) {
    const grid = new TerrainGrid(data.worldSize, data.gridSize);
    
    if (data.patches) {
      for (const [key, pData] of Object.entries(data.patches)) {
        const patch = new TerrainPatch(pData.x, pData.z, pData.terrainType);
        grid.patches.set(key, patch);
      }
    }
    
    return grid;
  }
}

export default TerrainGrid;
export { TERRAIN_PROPERTIES, TerrainType };