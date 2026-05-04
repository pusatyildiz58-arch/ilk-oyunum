// filepath: Engine/world/EncounterSystem.js
/**
 * Encounter System - Risk, events, and random encounters during travel
 * Handles bandit attacks, merchant meetings, discoveries, and travel events
 */

// ============================================================================
// ENCOUNTER MODELS
// ============================================================================

// Encounter Types
export const EncounterType = {
  BANDIT_ATTACK: 'bandit_attack',
  MERCHANT_CARAVAN: 'merchant_caravan',
  WANDERING_NPC: 'wandering_npc',
  DISCOVERY: 'discovery',
  WEATHER_EVENT: 'weather_event',
  ROAD_EVENT: 'road_event',
  PATROL: 'patrol',
  REFUGEE: 'refugee',
  PILGRIM: 'pilgrim',
  NONE: 'none'
};

// Safety Level
export const SafetyLevel = {
  VERY_SAFE: 0.1,
  SAFE: 0.3,
  NORMAL: 0.5,
  DANGEROUS: 0.7,
  VERY_DANGEROUS: 0.9
};

// Encounter Definition
export class Encounter {
  constructor(type, data = {}) {
    this.type = type;
    this.id = data.id || `${type}_${Date.now()}`;
    this.title = data.title || '';
    this.description = data.description || '';
    
    // Timing
    this.triggerTime = data.triggerTime || 0;
    this.duration = data.duration || 0;
    
    // Position
    this.x = data.x || 0;
    this.z = data.z || 0;
    
    // Combat data
    this.enemyCount = data.enemyCount || 0;
    this.enemyStrength = data.enemyStrength || 1;
    this.loot = data.loot || null;
    
    // NPC data
    this.npcData = data.npcData || null;
    this.dialogue = data.dialogue || [];
    this.trade = data.trade || false;
    
    // Rewards
    this.reputation = data.reputation || 0;
    this.gold = data.gold || 0;
    this.items = data.items || [];
    this.information = data.information || null;
    
    // State
    this.resolved = false;
    this.resolution = null;
  }
  
  // Resolve encounter
  resolve(outcome) {
    this.resolved = true;
    this.resolution = outcome;
  }
  
  // Get reward based on resolution
  getReward() {
    if (!this.resolved) return null;
    
    return {
      gold: this.resolution.gold || 0,
      reputation: this.resolution.reputation || 0,
      items: this.resolution.items || [],
      information: this.resolution.information || null
    };
  }
  
  serialize() {
    return {
      type: this.type,
      id: this.id,
      title: this.title,
      description: this.description,
      x: this.x,
      z: this.z,
      enemyCount: this.enemyCount,
      enemyStrength: this.enemyStrength,
      resolved: this.resolved,
      resolution: this.resolution
    };
  }
}

// Zone Danger Assessment
export class ZoneDanger {
  constructor(zoneId, baseDanger, modifiers = {}) {
    this.zoneId = zoneId;
    this.baseDanger = baseDanger;
    
    // Modifiers
    this.timeMod = modifiers.timeMod || 1.0;
    this.weatherMod = modifiers.weatherMod || 1.0;
    this.seasonMod = modifiers.seasonMod || 1.0;
    this.eventMod = modifiers.eventMod || 1.0;
    this.playerMod = modifiers.playerMod || 1.0;
    
    // Calculated
    this.currentDanger = this.calculateDanger();
  }
  
  calculateDanger() {
    return this.baseDanger * 
           this.timeMod * 
           this.weatherMod * 
           this.seasonMod * 
           this.eventMod * 
           this.playerMod;
  }
  
  // Update modifiers
  updateTimeMod(hour) {
    // Night is more dangerous
    if (hour < 6 || hour > 20) {
      this.timeMod = 1.5;
    } else if (hour < 8 || hour > 18) {
      this.timeMod = 1.2;
    } else {
      this.timeMod = 1.0;
    }
    this.currentDanger = this.calculateDanger();
  }
  
  updateWeatherMod(weather) {
    if (weather === 'fog' || weather === 'storm') {
      this.weatherMod = 1.5;
    } else if (weather === 'rain' || weather === 'heavy_rain') {
      this.weatherMod = 1.3;
    } else {
      this.weatherMod = 1.0;
    }
    this.currentDanger = this.calculateDanger();
  }
  
  getDangerLevel() {
    if (this.currentDanger < 0.2) return 'very_safe';
    if (this.currentDanger < 0.4) return 'safe';
    if (this.currentDanger < 0.6) return 'normal';
    if (this.currentDanger < 0.8) return 'dangerous';
    return 'very_dangerous';
  }
}

// Encounter Generator
export class EncounterGenerator {
  constructor(worldState, terrainGrid) {
    this.worldState = worldState;
    this.terrainGrid = terrainGrid;
    
    // Templates
    this.templates = this.initializeTemplates();
  }
  
  // Initialize encounter templates
  initializeTemplates() {
    return {
      [EncounterType.BANDIT_ATTACK]: [
        { title: 'Eşkıya Saldırısı', description: 'Yolda eşkıyalar saldırıyor!', minEnemies: 2, maxEnemies: 5 },
        { title: ' pusu', description: 'Dar yoldan geçerken pusuya düştünüz!', minEnemies: 3, maxEnemies: 6 },
        { title: 'Gece Pususu', description: 'Gece kamp kurarken saldırıya uğradınız!', minEnemies: 4, maxEnemies: 8 }
      ],
      [EncounterType.MERCHANT_CARAVAN]: [
        { title: 'Tüccar Kervanı', description: 'Yolda bir tüccar kervanı ile karşılaştınız.', trade: true },
        { title: 'Zengin Tüccar', description: 'Bol mallı bir tüccar kervanı.', trade: true, gold: 500 },
        { title: 'Küçük Tüccar', description: 'Basit mallar satan bir seyyar satıcı.', trade: true, gold: 100 }
      ],
      [EncounterType.WANDERING_NPC]: [
        { title: 'Seyyah', description: 'Yolda bir seyyah ile karşılaştınız.', information: true },
        { title: 'Dilenci', description: 'Yoksul bir dilenci yalvarıyor.', gold: 10, reputation: 1 },
        { title: 'Rahip', description: 'Yoldan geçen bir rahip.', information: true, reputation: 1 }
      ],
      [EncounterType.DISCOVERY]: [
        { title: 'Antik Kalıntı', description: 'Yol kenarında antik kalıntılar buldunuz.', items: ['antika'] },
        { title: 'Vahşi At', description: 'Yabani bir at sürüsü gördünüz.', items: ['at'] },
        { title: 'Şifalı Bitki', description: 'Nadir bir şifalı bitki buldunuz.', items: ['şifalı_ot'] }
      ],
      [EncounterType.PATROL]: [
        { title: 'Kraliyet Muhafızı', description: 'Kraliyet askerleri devriye geçiyor.', reputation: 2 },
        { title: 'Feodal Süvari', description: 'Bir feodal lordun süvarileri.', reputation: 1 },
        { title: 'Belediye Muhafızı', description: 'Şehir muhafızları devriye.', reputation: 1 }
      ],
      [EncounterType.REFUGEE]: [
        { title: 'Mülteci Ailesi', description: 'Savaştan kaçan bir aile.', gold: 20, reputation: 2 },
        { title: 'Kaçak Köylü', description: 'Köyünden kaçan bir köylü.', information: true }
      ],
      [EncounterType.PILGRIM]: [
        { title: 'Hacı', description: 'Kutsal yere giden hacılar.', reputation: 1 },
        { title: 'Dilenci Rahip', description: 'Sadaka isteyen bir rahip.', gold: 5, reputation: 1 }
      ]
    };
  }
  
  // Calculate encounter chance
  calculateEncounterChance(x, z, timeOfDay, weather, zoneDanger) {
    // Base chance from terrain
    const terrainType = this.terrainGrid.getTerrainTypeAt(x, z);
    const terrainMod = this.terrainGrid.getTerrainModifiers(x, z, weather, timeOfDay);
    
    let baseChance = 0.05; // 5% base
    
    // Terrain modifier
    baseChance *= terrainMod.encounter;
    
    // Zone danger
    baseChance *= zoneDanger;
    
    // Time of day
    if (timeOfDay < 6 || timeOfDay > 20) {
      baseChance *= 2.0;
    } else if (timeOfDay < 8 || timeOfDay > 18) {
      baseChance *= 1.5;
    }
    
    // Weather
    if (weather === 'fog') baseChance *= 1.5;
    if (weather === 'storm') baseChance *= 0.5; // Bad weather reduces travel
    
    return Math.min(0.5, baseChance); // Max 50% chance
  }
  
  // Generate random encounter
  generateEncounter(x, z, timeOfDay, weather, zoneDanger) {
    const chance = this.calculateEncounterChance(x, z, timeOfDay, weather, zoneDanger);
    
    if (Math.random() > chance) {
      return null;
    }
    
    // Determine encounter type based on zone danger
    const encounterType = this.determineEncounterType(zoneDanger);
    const templates = this.templates[encounterType];
    
    if (!templates || templates.length === 0) {
      return null;
    }
    
    // Pick random template
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    // Create encounter
    const data = {
      ...template,
      x: x + (Math.random() - 0.5) * 10,
      z: z + (Math.random() - 0.5) * 10,
      triggerTime: Date.now()
    };
    
    // Add enemy variation
    if (encounterType === EncounterType.BANDIT_ATTACK) {
      data.enemyCount = template.minEnemies + 
        Math.floor(Math.random() * (template.maxEnemies - template.minEnemies + 1));
      data.enemyStrength = 0.5 + Math.random() * 1.0;
    }
    
    return new Encounter(encounterType, data);
  }
  
  // Determine encounter type based on danger
  determineEncounterType(zoneDanger) {
    const rand = Math.random();
    
    if (zoneDanger > 0.7) {
      // High danger - mostly bandits
      if (rand < 0.6) return EncounterType.BANDIT_ATTACK;
      if (rand < 0.8) return EncounterType.REFUGEE;
      return EncounterType.WANDERING_NPC;
    } else if (zoneDanger > 0.4) {
      // Medium danger
      if (rand < 0.3) return EncounterType.BANDIT_ATTACK;
      if (rand < 0.5) return EncounterType.MERCHANT_CARAVAN;
      if (rand < 0.7) return EncounterType.WANDERING_NPC;
      return EncounterType.DISCOVERY;
    } else {
      // Low danger - peaceful encounters
      if (rand < 0.3) return EncounterType.MERCHANT_CARAVAN;
      if (rand < 0.5) return EncounterType.PATROL;
      if (rand < 0.7) return EncounterType.PILGRIM;
      if (rand < 0.85) return EncounterType.WANDERING_NPC;
      return EncounterType.DISCOVERY;
    }
  }
  
  // Get safety assessment for route
  assessRouteSafety(route, timeOfDay, weather) {
    let totalDanger = 0;
    let segmentCount = 0;
    
    for (const segment of route) {
      if (segment.edge) {
        const node = segment.node;
        const terrainType = this.terrainGrid.getTerrainTypeAt(node.x, node.z);
        const terrainMod = this.terrainGrid.getTerrainModifiers(node.x, node.z, weather, timeOfDay);
        
        // Base danger from terrain
        let segmentDanger = 0.3;
        if (terrainType === 'bandit_territory') segmentDanger = 0.9;
        else if (terrainType === 'dense_forest') segmentDanger = 0.6;
        else if (terrainType === 'forest') segmentDanger = 0.5;
        else if (terrainType === 'mountain') segmentDanger = 0.4;
        else if (terrainType === 'swamp') segmentDanger = 0.7;
        else if (terrainType === 'ruin') segmentDanger = 0.6;
        
        segmentDanger *= terrainMod.risk;
        totalDanger += segmentDanger;
        segmentCount++;
      }
    }
    
    return segmentCount > 0 ? totalDanger / segmentCount : 0.5;
  }
}

// Encounter Manager
export class EncounterManager {
  constructor(worldState, terrainGrid) {
    this.worldState = worldState;
    this.terrainGrid = terrainGrid;
    this.generator = new EncounterGenerator(worldState, terrainGrid);
    
    this.activeEncounters = [];
    this.encounterHistory = [];
    this.zoneDangers = new Map();
    
    this.initializeZoneDangers();
  }
  
  // Initialize zone dangers
  initializeZoneDangers() {
    // Create danger zones for settlements
    const settlements = this.worldState.settlements;
    
    for (const settlement of settlements) {
      const baseDanger = this.getSettlementDanger(settlement);
      this.zoneDangers.set(settlement.id, new ZoneDanger(settlement.id, baseDanger));
    }
  }
  
  // Get settlement danger level
  getSettlementDanger(settlement) {
    switch (settlement.type) {
      case 'CITY': return 0.3;
      case 'CASTLE': return 0.4;
      case 'TOWN': return 0.35;
      case 'VILLAGE': return 0.5;
      case 'HAMLET': return 0.6;
      default: return 0.5;
    }
  }
  
  // Update zone dangers
  updateZones(timeOfDay, weather) {
    for (const [zoneId, danger] of this.zoneDangers) {
      danger.updateTimeMod(timeOfDay);
      danger.updateWeatherMod(weather);
    }
  }
  
  // Check for new encounters
  checkForEncounter(x, z, timeOfDay, weather) {
    // Find nearest zone
    const zone = this.findNearestZone(x, z);
    const zoneDanger = zone ? this.zoneDangers.get(zone.id)?.currentDanger || 0.5 : 0.5;
    
    return this.generator.generateEncounter(x, z, timeOfDay, weather, zoneDanger);
  }
  
  // Find nearest zone
  findNearestZone(x, z) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const settlement of this.worldState.settlements) {
      const dist = Math.sqrt(
        Math.pow(settlement.x - x, 2) + 
        Math.pow(settlement.z - z, 2)
      );
      
      if (dist < minDist) {
        minDist = dist;
        nearest = settlement;
      }
    }
    
    return nearest;
  }
  
  // Add encounter
  addEncounter(encounter) {
    this.activeEncounters.push(encounter);
  }
  
  // Resolve encounter
  resolveEncounter(encounterId, outcome) {
    const encounter = this.activeEncounters.find(e => e.id === encounterId);
    
    if (encounter) {
      encounter.resolve(outcome);
      this.encounterHistory.push(encounter);
      
      // Remove from active
      this.activeEncounters = this.activeEncounters.filter(e => e.id !== encounterId);
      
      return encounter.getReward();
    }
    
    return null;
  }
  
  // Get active encounters
  getActiveEncounters() {
    return this.activeEncounters;
  }
  
  // Get encounter history
  getHistory() {
    return this.encounterHistory;
  }
  
  // Get zone danger
  getZoneDanger(zoneId) {
    return this.zoneDangers.get(zoneId)?.currentDanger || 0.5;
  }
  
  // Serialize
  serialize() {
    return {
      activeEncounters: this.activeEncounters.map(e => e.serialize()),
      encounterHistory: this.encounterHistory.slice(-20).map(e => e.serialize()),
      zoneDangers: Array.from(this.zoneDangers.entries()).map(([id, danger]) => ({
        zoneId: id,
        baseDanger: danger.baseDanger,
        currentDanger: danger.currentDanger
      }))
    };
  }
  
  // Deserialize
  static deserialize(data, worldState, terrainGrid) {
    const manager = new EncounterManager(worldState, terrainGrid);
    
    if (data) {
      // Restore zone dangers
      if (data.zoneDangers) {
        for (const zd of data.zoneDangers) {
          manager.zoneDangers.set(zd.zoneId, new ZoneDanger(zd.zoneId, zd.baseDanger));
        }
      }
    }
    
    return manager;
  }
}

export default EncounterManager;
export { EncounterType, SafetyLevel, Encounter, ZoneDanger };