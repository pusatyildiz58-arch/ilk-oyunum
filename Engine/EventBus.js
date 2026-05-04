// Engine/Core/EventBus.js - Pub/Sub Event System

export class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventQueue = [];
  }

  on(eventName, callback, context = null) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    
    this.listeners.get(eventName).push({ callback, context });
    
    return () => this.off(eventName, callback);
  }

  once(eventName, callback, context = null) {
    const wrapper = (data) => {
      callback.call(context, data);
      this.off(eventName, wrapper);
    };
    return this.on(eventName, wrapper, context);
  }

  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;
    
    const listeners = this.listeners.get(eventName);
    const index = listeners.findIndex(l => l.callback === callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  emit(eventName, data = {}) {
    if (!this.listeners.has(eventName)) return;
    
    const listeners = this.listeners.get(eventName);
    for (const listener of listeners) {
      try {
        if (listener.context) {
          listener.callback.call(listener.context, data);
        } else {
          listener.callback(data);
        }
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    }
  }

  queue(eventName, data = {}) {
    this.eventQueue.push({ eventName, data });
  }

  processQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      this.emit(event.eventName, event.data);
    }
  }

  clear() {
    this.listeners.clear();
    this.eventQueue = [];
  }
}

// Event Types
export const GameEvents = {
  // Player
  PLAYER_MOVE: 'player:move',
  PLAYER_INTERACT: 'player:interact',
  PLAYER_BUY_LAND: 'player:buy_land',
  
  // NPC
  NPC_SPAWN: 'npc:spawn',
  NPC_HIRED: 'npc:hired',
  NPC_ASSIGNED: 'npc:assigned',
  
  // Economy
  ECONOMY_TICK: 'economy:tick',
  RESOURCE_PRODUCED: 'resource:produced',
  ITEM_BOUGHT: 'item:bought',
  ITEM_SOLD: 'item:sold',
  
  // Combat
  BATTLE_START: 'battle:start',
  BATTLE_END: 'battle:end',
  UNIT_DIED: 'unit:died',
  
  // World
  TIME_TICK: 'time:tick',
  DAY_PASSED: 'day:passed',
  SEASON_CHANGED: 'season:changed',
  
  // UI
  UI_NOTIFY: 'ui:notify',
  UI_UPDATE: 'ui:update',
};

// ============================================================================

// Engine/Core/TimeSystem.js - Zaman Yönetimi

import { CONFIG } from '../../config.js';

export class TimeSystem {
  constructor(eventBus) {
    this.eventBus = eventBus;
    
    // Game time
    this.gameTime = 0;
    this.realTime = 0;
    this.paused = false;
    this.timeScale = 1;
    
    // Calendar
    this.day = 1;
    this.season = 0; // 0-3
    this.year = 1;
    
    // Day/Night cycle
    this.dayLength = CONFIG.TIME.DAY_LENGTH;
    this.timeOfDay = 0; // 0-1 (0 = midnight, 0.5 = noon)
    
    // Tick accumulators
    this.accumulators = {
      economy: 0,
      ai: 0,
      world: 0,
    };
    
    // Last frame
    this.lastFrameTime = 0;
  }

  init() {
    this.lastFrameTime = performance.now();
  }

  update(currentTime) {
    if (this.paused) {
      this.lastFrameTime = currentTime;
      return 0;
    }

    const deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;
    
    const scaledDelta = deltaTime * this.timeScale;
    
    this.gameTime += scaledDelta;
    this.realTime += deltaTime;
    
    // Update time of day
    this.updateTimeOfDay(scaledDelta);
    
    // Update calendar
    this.updateCalendar(scaledDelta);
    
    // Emit tick event
    this.eventBus.emit(GameEvents.TIME_TICK, {
      deltaTime: scaledDelta,
      gameTime: this.gameTime,
      timeOfDay: this.timeOfDay,
    });
    
    return scaledDelta;
  }

  updateTimeOfDay(delta) {
    this.timeOfDay += delta / this.dayLength;
    
    if (this.timeOfDay >= 1) {
      this.timeOfDay -= 1;
      this.day++;
      
      this.eventBus.emit(GameEvents.DAY_PASSED, {
        day: this.day,
        season: this.season,
        year: this.year,
      });
      
      // Check season change
      if (this.day % CONFIG.TIME.SEASON_LENGTH === 0) {
        this.season = (this.season + 1) % 4;
        
        this.eventBus.emit(GameEvents.SEASON_CHANGED, {
          season: this.season,
          seasonName: CONFIG.TIME.SEASONS[this.season],
        });
        
        // Check year change
        if (this.season === 0) {
          this.year++;
        }
      }
    }
  }

  updateCalendar(delta) {
    // Already handled in updateTimeOfDay
  }

  // Get current time of day (0-24)
  getHour() {
    return Math.floor(this.timeOfDay * 24);
  }

  // Get day phase
  getDayPhase() {
    const hour = this.getHour();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  }

  // Get day phase icon
  getDayPhaseIcon() {
    const phase = this.getDayPhase();
    const icons = {
      morning: '🌅',
      afternoon: '☀️',
      evening: '🌆',
      night: '🌙',
    };
    return icons[phase];
  }

  // Get season effects
  getSeasonEffects() {
    return CONFIG.TIME.SEASON_EFFECTS[this.season] || {};
  }

  // Get light intensity (for rendering)
  getLightIntensity() {
    // Peak at noon (0.5), minimum at midnight (0)
    const t = this.timeOfDay;
    const sinT = Math.sin(t * Math.PI);
    return 0.2 + sinT * 0.8;
  }

  // Get sun position (for rendering)
  getSunPosition() {
    const t = this.timeOfDay;
    const angle = t * Math.PI * 2;
    return {
      x: Math.cos(angle) * 120,
      y: Math.abs(Math.sin(angle)) * 150,
      z: 60,
    };
  }

  // Pause/Resume
  pause() {
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastFrameTime = performance.now();
  }

  // Set time scale
  setTimeScale(scale) {
    this.timeScale = Math.max(0, Math.min(10, scale));
  }

  // Get formatted time string
  getTimeString() {
    const hour = this.getHour();
    const minute = Math.floor((this.timeOfDay * 24 - hour) * 60);
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // Get date string
  getDateString() {
    const seasonName = CONFIG.TIME.SEASONS[this.season];
    return `${seasonName} ${this.day} - Yıl ${this.year}`;
  }

  // Save state
  serialize() {
    return {
      gameTime: this.gameTime,
      day: this.day,
      season: this.season,
      year: this.year,
      timeOfDay: this.timeOfDay,
    };
  }

  // Load state
  deserialize(data) {
    this.gameTime = data.gameTime || 0;
    this.day = data.day || 1;
    this.season = data.season || 0;
    this.year = data.year || 1;
    this.timeOfDay = data.timeOfDay || 0;
  }
}