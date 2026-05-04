// config.js - Toprak ve Kılıç Oyun Konfigürasyonu

export const CONFIG = {
  // Dünya ayarları
  WORLD: {
    SIZE: 500,                    // Dünya boyutu (500x500)
    VILLAGE_COUNT: 12,            // Köy sayısı
    CITY_COUNT: 3,                // Şehir sayısı
    BANDIT_CAMP_COUNT: 15,        // Eşkıya kampı
    TREE_COUNT: 500,              // Ağaç sayısı
    ROCK_COUNT: 200,              // Kaya sayısı
  },

  // Oyuncu başlangıç değerleri
  PLAYER: {
    START_GOLD: 80,
    START_FOOD: 5,
    START_POSITION: { x: 0, y: 0, z: 0 },
    MOVEMENT_SPEED: 12,
    INTERACTION_RADIUS: 6,
    INVENTORY_SIZE: 30,
  },

  // Ekonomi sistemi
  ECONOMY: {
    TICK_RATE: 1,                 // Ekonomi tick/saniye
    WORKER_COST: 15,              // İşçi kiralama maliyeti
    WORKER_UPKEEP: 3,             // İşçi günlük gideri
    SOLDIER_COST: 25,             // Asker maliyeti
    SOLDIER_UPKEEP: 5,            // Asker günlük gideri
    
    // Ürün base fiyatları
    PRICES: {
      food: 8,
      meat: 15,
      leather: 20,
      iron: 30,
      wood: 5,
      weapon: 80,
      armor: 100,
    },
    
    // Arz-talep faktörleri
    SUPPLY_DEMAND: {
      MIN_FACTOR: 0.3,           // Min fiyat çarpanı
      MAX_FACTOR: 4.0,           // Max fiyat çarpanı
      DECAY_RATE: 0.95,          // Fiyat dengeleme hızı
    },
  },

  // Köy tipleri ve üretim oranları
  VILLAGE_TYPES: {
    farming: {
      name: 'Tarım Köyü',
      icon: '🌾',
      production: {
        food: { base: 120, rate: 5, consumption: 2 },
        meat: { base: 60, rate: 2, consumption: 1 },
        leather: { base: 30, rate: 1.5, consumption: 0.5 },
        wood: { base: 20, rate: 0.5, consumption: 0.4 },
      },
    },
    trade: {
      name: 'Ticaret Köyü',
      icon: '🏪',
      production: {
        food: { base: 50, rate: 1, consumption: 3 },
        leather: { base: 80, rate: 4, consumption: 1 },
        wood: { base: 70, rate: 3, consumption: 1 },
        weapon: { base: 20, rate: 1, consumption: 0.2 },
      },
    },
    mining: {
      name: 'Maden Köyü',
      icon: '⛏️',
      production: {
        iron: { base: 150, rate: 8, consumption: 1 },
        food: { base: 20, rate: 0.8, consumption: 4 },
        weapon: { base: 30, rate: 2, consumption: 0.3 },
        armor: { base: 15, rate: 1, consumption: 0.1 },
      },
    },
  },

  // NPC AI ayarları
  AI: {
    TICK_RATE: 10,                // AI tick/saniye
    DECISION_INTERVAL: 2,         // Karar verme sıklığı (saniye)
    WANDER_RADIUS: 15,            // Dolaşma yarıçapı
    WORK_RADIUS: 3,               // Çalışma mesafesi
    
    // Davranış skorları
    BEHAVIOR_WEIGHTS: {
      work: 0.6,
      rest: 0.3,
      trade: 0.4,
      explore: 0.2,
    },
    
    // İhtiyaçlar
    NEEDS: {
      hunger_rate: 2,             // Açlık artış hızı
      energy_rate: 3,             // Enerji azalma hızı
      rest_rate: 10,              // Dinlenme iyileşme hızı
    },
  },

  // Savaş sistemi
  COMBAT: {
    TICK_RATE: 60,                // Combat tick/saniye (real-time)
    
    // Birlik tipleri
    UNIT_TYPES: {
      peasant: {
        name: 'Köylü',
        icon: '🪓',
        health: 50,
        damage: 8,
        armor: 0,
        speed: 1.0,
        cost: 10,
      },
      infantry: {
        name: 'Piyade',
        icon: '⚔️',
        health: 100,
        damage: 15,
        armor: 5,
        speed: 0.9,
        cost: 25,
      },
      archer: {
        name: 'Okçu',
        icon: '🏹',
        health: 70,
        damage: 20,
        armor: 2,
        speed: 1.1,
        cost: 30,
      },
      cavalry: {
        name: 'Süvari',
        icon: '🐴',
        health: 120,
        damage: 25,
        armor: 8,
        speed: 1.5,
        cost: 60,
      },
    },
    
    // Formasyon bonusları
    FORMATIONS: {
      line: { defense: 1.2, attack: 1.0, speed: 1.0 },
      charge: { defense: 0.8, attack: 1.5, speed: 1.5 },
      defend: { defense: 1.5, attack: 0.7, speed: 0.5 },
      skirmish: { defense: 0.9, attack: 1.1, speed: 1.2 },
    },
  },

  // İşçi sistemi
  WORKERS: {
    TYPES: {
      farmer: {
        name: 'Çiftçi',
        icon: '🌾',
        production: { food: 2, meat: 0.5 },
        workplace: 'farm',
      },
      woodcutter: {
        name: 'Oduncu',
        icon: '🪵',
        production: { wood: 1.5 },
        workplace: 'forest',
      },
      miner: {
        name: 'Madenci',
        icon: '⛏️',
        production: { iron: 1 },
        workplace: 'mine',
      },
      hunter: {
        name: 'Avcı',
        icon: '🏹',
        production: { meat: 1, leather: 0.3 },
        workplace: 'hunting_ground',
      },
    },
    
    // İşçi animasyon
    ANIMATION: {
      WORK_CYCLE: 3,              // Çalışma döngüsü (saniye)
      IDLE_RADIUS: 2,             // Boşta dolaşma
      MOVE_SPEED: 2,              // Hareket hızı
    },
  },

  // Mülk sistemi (Tarlalar, binalar)
  PROPERTIES: {
    farm: {
      name: 'Tarla',
      icon: '🌾',
      cost: 100,
      max_workers: 5,
      size: { width: 12, depth: 12 },
      production_multiplier: 1.5,
    },
    mine: {
      name: 'Maden',
      icon: '⛏️',
      cost: 300,
      max_workers: 3,
      size: { width: 8, depth: 8 },
      production_multiplier: 2.0,
    },
    blacksmith: {
      name: 'Demirci',
      icon: '⚒️',
      cost: 250,
      max_workers: 2,
      size: { width: 6, depth: 6 },
      can_craft: ['weapon', 'armor'],
    },
    tannery: {
      name: 'Tabakhane',
      icon: '🐂',
      cost: 200,
      max_workers: 2,
      size: { width: 6, depth: 6 },
      can_craft: ['leather'],
    },
  },

  // Rütbe sistemi
  RANKS: [
    { name: 'Yoksul Çiftçi', soldiers: 0, land: 0 },
    { name: 'Köy Ağası', soldiers: 5, land: 10 },
    { name: 'Sipahi', soldiers: 15, land: 30 },
    { name: 'Subaşı', soldiers: 30, land: 60 },
    { name: 'Komutan', soldiers: 60, land: 120 },
    { name: 'Lord', soldiers: 100, land: 200 },
    { name: 'Kral', soldiers: 200, land: 500 },
  ],

  // Zaman sistemi
  TIME: {
    DAY_LENGTH: 200,              // Gün uzunluğu (saniye)
    SEASON_LENGTH: 30,            // Mevsim uzunluğu (gün)
    YEAR_LENGTH: 120,             // Yıl uzunluğu (gün)
    
    SEASONS: ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'],
    
    // Mevsim bonusları
    SEASON_EFFECTS: {
      0: { food_production: 1.2, trade_bonus: 1.1 },  // İlkbahar
      1: { food_production: 1.5, movement_speed: 1.1 }, // Yaz
      2: { food_production: 1.0, trade_bonus: 1.2 },  // Sonbahar
      3: { food_production: 0.6, movement_speed: 0.9 }, // Kış
    },
  },

  // Render ayarları
  RENDER: {
    SHADOW_MAP_SIZE: 2048,
    FOG_NEAR: 80,
    FOG_FAR: 250,
    CAMERA_FOV: 55,
    CAMERA_DISTANCE: 16,
    CAMERA_HEIGHT: 14,
  },

  // Debug
  DEBUG: {
    SHOW_ENTITY_BOUNDS: false,
    SHOW_INTERACTION_RADIUS: false,
    LOG_AI_DECISIONS: false,
    LOG_ECONOMY_TICKS: false,
    SHOW_FPS: true,
  },
};

// Kolaylık fonksiyonları
export function getVillageType(type) {
  return CONFIG.VILLAGE_TYPES[type] || CONFIG.VILLAGE_TYPES.farming;
}

export function getUnitStats(type) {
  return CONFIG.COMBAT.UNIT_TYPES[type] || CONFIG.COMBAT.UNIT_TYPES.peasant;
}

export function getWorkerType(type) {
  return CONFIG.WORKERS.TYPES[type] || CONFIG.WORKERS.TYPES.farmer;
}

export function getPropertyType(type) {
  return CONFIG.PROPERTIES[type];
}

export function getRankByStats(soldiers, land) {
  for (let i = CONFIG.RANKS.length - 1; i >= 0; i--) {
    const rank = CONFIG.RANKS[i];
    if (soldiers >= rank.soldiers || land >= rank.land) {
      return { index: i, ...rank };
    }
  }
  return { index: 0, ...CONFIG.RANKS[0] };
}