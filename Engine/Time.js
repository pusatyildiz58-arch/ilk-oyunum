// filepath: engine/Time.js
/**
 * Time System - Multi-tick simulation timing
 * Handles different tick rates for various game systems
 */

// ============================================================================
// TIME SYSTEM
// ============================================================================

class TimeSystem {
  constructor() {
    // Game time
    this.gameTime = 0; // in game seconds
    this.dayLength = 600; // 10 minutes real time = 1 game day
    this.seasonLength = 30; // 30 game days per season
    
    // Tick rates (ticks per second)
    this.tickRates = {
      PLAYER: 60,      // 60 TPS - Player + Combat
      AI: 10,          // 10 TPS - NPC AI
      ECONOMY: 1,      // 1 TPS - Economy simulation
      WORLD: 0.2,      // 0.2 TPS - World/faction simulation
      RENDER: 60       // 60 TPS - Rendering (synced with RAF)
    };
    
    // Accumulated time for each tick type
    this.accumulators = {
      PLAYER: 0,
      AI: 0,
      ECONOMY: 0,
      WORLD: 0
    };
    
    // Last frame time
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    
    // Time control
    this.paused = false;
    this.timeScale = 1;
    
    // Day/Season tracking
    this.day = 1;
    this.season = 0; // 0 = Spring, 1 = Summer, 2 = Autumn, 3 = Winter
    this.year = 1;
    
    // Season names
    this.seasonNames = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];
    
    // Weather
    this.weather = 'clear';
    this.weatherTimer = 0;
  }

  // Initialize with current time
  init() {
    this.lastFrameTime = performance.now();
  }

  // Update called every frame
  update(currentTime) {
    if (this.paused) {
      this.lastFrameTime = currentTime;
      return;
    }

    // Calculate delta time in seconds
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Scale delta time
    const scaledDelta = this.deltaTime * this.timeScale;

    // Update game time
    this.gameTime += scaledDelta;

    // Update accumulators for each tick type
    for (const tickType in this.tickRates) {
      if (tickType === 'RENDER') continue;
      this.accumulators[tickType] += scaledDelta;
    }

    // Update day/season
    this.updateCalendar(scaledDelta);

    // Update weather
    this.updateWeather(scaledDelta);
  }

  // Check if a tick should fire for a given type
  shouldTick(tickType) {
    const rate = this.tickRates[tickType];
    const accumulator = this.accumulators[tickType];
    return accumulator >= 1 / rate;
  }

  // Consume tick time for a given type
  consumeTick(tickType) {
    const rate = this.tickRates[tickType];
    this.accumulators[tickType] -= 1 / rate;
  }

  // Get time until next tick for a type
  timeUntilTick(tickType) {
    const rate = this.tickRates[tickType];
    const accumulator = this.accumulators[tickType];
    return (1 / rate) - accumulator;
  }

  // Update calendar (day/season/year)
  updateCalendar(delta) {
    const gameDaysElapsed = delta / this.dayLength;
    
    if (gameDaysElapsed > 0) {
      this.day += gameDaysElapsed;
      
      // Check for season change
      if (this.day >= this.seasonLength) {
        this.day -= this.seasonLength;
        this.season = (this.season + 1) % 4;
        
        // Check for year change
        if (this.season === 0) {
          this.year++;
        }
      }
    }
  }

  // Update weather
  updateWeather(delta) {
    this.weatherTimer -= delta;
    
    if (this.weatherTimer <= 0) {
      // Random weather change
      const weatherTypes = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
      const weights = [0.4, 0.25, 0.2, 0.1, 0.05];
      
      const rand = Math.random();
      let cumulative = 0;
      
      for (let i = 0; i < weatherTypes.length; i++) {
        cumulative += weights[i];
        if (rand <= cumulative) {
          this.weather = weatherTypes[i];
          break;
        }
      }
      
      // Next weather change in 30-120 seconds game time
      this.weatherTimer = 30 + Math.random() * 90;
    }
  }

  // Get formatted time string
  getTimeString() {
    const hour = Math.floor((this.gameTime % this.dayLength) / (this.dayLength / 24));
    const minute = Math.floor(((this.gameTime % this.dayLength) % (this.dayLength / 24)) / (this.dayLength / 1440));
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  // Get day time description
  getDayPhase() {
    const hour = Math.floor((this.gameTime % this.dayLength) / (this.dayLength / 24));
    
    if (hour >= 6 && hour < 12) return 'Sabah';
    if (hour >= 12 && hour < 17) return 'Öğle';
    if (hour >= 17 && hour < 21) return 'Akşam';
    return 'Gece';
  }

  // Get full date string
  getDateString() {
    return `${this.seasonNames[this.season]} ${Math.floor(this.day)} - Yıl ${this.year}`;
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

  // Get simulation state for saving
  getState() {
    return {
      gameTime: this.gameTime,
      day: this.day,
      season: this.season,
      year: this.year,
      weather: this.weather,
      paused: this.paused,
      timeScale: this.timeScale
    };
  }

  // Load simulation state
  loadState(state) {
    this.gameTime = state.gameTime || 0;
    this.day = state.day || 1;
    this.season = state.season || 0;
    this.year = state.year || 1;
    this.weather = state.weather || 'clear';
    this.paused = state.paused || false;
    this.timeScale = state.timeScale || 1;
  }
}

// Export
export { TimeSystem };