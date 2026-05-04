// filepath: Engine/world/WeatherSystem.js
/**
 * Weather System - Atmospheric conditions and effects
 * Handles weather types, transitions, and travel impacts
 */

// ============================================================================
// WEATHER MODELS
// ============================================================================

// Weather Types
export const WeatherType = {
  CLEAR: 'clear',
  CLOUDY: 'cloudy',
  RAIN: 'rain',
  HEAVY_RAIN: 'heavy_rain',
  FOG: 'fog',
  STORM: 'storm',
  SNOW: 'snow',
  WIND: 'wind'
};

// Weather Properties
export const WEATHER_PROPERTIES = {
  [WeatherType.CLEAR]: {
    name: 'Açık',
    visibility: 1.0,
    speedMod: 1.0,
    riskMod: 1.0,
    encounterMod: 1.0,
    travelFatigue: 1.0,
    color: 0x87ceeb,
    fogDensity: 0
  },
  [WeatherType.CLOUDY]: {
    name: 'Bulutlu',
    visibility: 0.85,
    speedMod: 0.95,
    riskMod: 1.1,
    encounterMod: 1.1,
    travelFatigue: 1.05,
    color: 0x708090,
    fogDensity: 0
  },
  [WeatherType.RAIN]: {
    name: 'Yağmur',
    visibility: 0.6,
    speedMod: 0.8,
    riskMod: 1.3,
    encounterMod: 1.2,
    travelFatigue: 1.2,
    color: 0x505860,
    fogDensity: 0.1
  },
  [WeatherType.HEAVY_RAIN]: {
    name: 'Şiddetli Yağmur',
    visibility: 0.4,
    speedMod: 0.6,
    riskMod: 1.5,
    encounterMod: 1.4,
    travelFatigue: 1.4,
    color: 0x404550,
    fogDensity: 0.2
  },
  [WeatherType.FOG]: {
    name: 'Sis',
    visibility: 0.25,
    speedMod: 0.7,
    riskMod: 1.8,
    encounterMod: 2.0,
    travelFatigue: 1.3,
    color: 0x909090,
    fogDensity: 0.5
  },
  [WeatherType.STORM]: {
    name: 'Fırtına',
    visibility: 0.3,
    speedMod: 0.4,
    riskMod: 2.0,
    encounterMod: 1.5,
    travelFatigue: 1.6,
    color: 0x303540,
    fogDensity: 0.3
  },
  [WeatherType.SNOW]: {
    name: 'Kar',
    visibility: 0.5,
    speedMod: 0.5,
    riskMod: 1.4,
    encounterMod: 1.1,
    travelFatigue: 1.5,
    color: 0xc0c8d0,
    fogDensity: 0.15
  },
  [WeatherType.WIND]: {
    name: 'Rüzgarlı',
    visibility: 0.9,
    speedMod: 0.85,
    riskMod: 1.2,
    encounterMod: 1.0,
    travelFatigue: 1.1,
    color: 0x8090a0,
    fogDensity: 0
  }
};

// Weather State
export class WeatherState {
  constructor() {
    this.current = WeatherType.CLEAR;
    this.transitioning = false;
    this.transitionProgress = 0;
    
    // Timing
    this.lastChange = Date.now();
    this.duration = 600000; // 10 minutes base
    this.nextChange = this.lastChange + this.duration;
    
    // Intensity (0-1 for transitions)
    this.intensity = 1.0;
    
    // Regional variations
    this.regionalWeather = new Map();
  }
  
  // Update weather (called each frame)
  update(deltaTime, gameTime) {
    const now = Date.now();
    
    // Check for weather change
    if (now >= this.nextChange && !this.transitioning) {
      this.startTransition();
    }
    
    // Handle transition
    if (this.transitioning) {
      this.transitionProgress += deltaTime * 0.5;
      
      if (this.transitionProgress >= 1) {
        this.completeTransition();
      }
    }
    
    // Update regional weather
    this.updateRegionalWeather(deltaTime);
  }
  
  // Start weather transition
  startTransition() {
    this.transitioning = true;
    this.transitionProgress = 0;
    
    // Pick new weather based on probabilities
    const newWeather = this.pickNextWeather();
    this.targetWeather = newWeather;
  }
  
  // Complete transition
  completeTransition() {
    this.current = this.targetWeather;
    this.transitioning = false;
    this.transitionProgress = 0;
    this.lastChange = Date.now();
    this.duration = this.getWeatherDuration(this.current);
    this.nextChange = this.lastChange + this.duration;
  }
  
  // Pick next weather
  pickNextWeather() {
    const rand = Math.random();
    const season = this.getSeason();
    
    // Season-based probabilities
    const probabilities = this.getSeasonProbabilities(season);
    
    let cumulative = 0;
    for (const [weather, prob] of Object.entries(probabilities)) {
      cumulative += prob;
      if (rand <= cumulative) {
        return weather;
      }
    }
    
    return WeatherType.CLEAR;
  }
  
  // Get season
  getSeason() {
    // Simplified - would integrate with TimeSystem
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
  
  // Get season probabilities
  getSeasonProbabilities(season) {
    const base = {
      [WeatherType.CLEAR]: 0.4,
      [WeatherType.CLOUDY]: 0.3,
      [WeatherType.RAIN]: 0.15,
      [WeatherType.HEAVY_RAIN]: 0.05,
      [WeatherType.FOG]: 0.05,
      [WeatherType.STORM]: 0.02,
      [WeatherType.SNOW]: 0.02,
      [WeatherType.WIND]: 0.01
    };
    
    const seasonal = {
      spring: { ...base, [WeatherType.RAIN]: 0.25, [WeatherType.CLOUDY]: 0.35 },
      summer: { ...base, [WeatherType.CLEAR]: 0.55, [WeatherType.RAIN]: 0.1 },
      autumn: { ...base, [WeatherType.RAIN]: 0.2, [WeatherType.FOG]: 0.1, [WeatherType.STORM]: 0.05 },
      winter: { ...base, [WeatherType.SNOW]: 0.2, [WeatherType.CLOUDY]: 0.25, [WeatherType.CLEAR]: 0.2 }
    };
    
    return seasonal[season] || base;
  }
  
  // Get weather duration
  getWeatherDuration(weather) {
    const base = {
      [WeatherType.CLEAR]: 600000,
      [WeatherType.CLOUDY]: 500000,
      [WeatherType.RAIN]: 300000,
      [WeatherType.HEAVY_RAIN]: 180000,
      [WeatherType.FOG]: 400000,
      [WeatherType.STORM]: 120000,
      [WeatherType.SNOW]: 250000,
      [WeatherType.WIND]: 350000
    };
    
    return base[weather] || 600000;
  }
  
  // Update regional weather
  updateRegionalWeather(deltaTime) {
    // Could add regional variations here
  }
  
  // Get current weather properties
  getProperties() {
    const props = WEATHER_PROPERTIES[this.current];
    
    if (this.transitioning && this.targetWeather) {
      const targetProps = WEATHER_PROPERTIES[this.targetWeather];
      const t = this.transitionProgress;
      
      // Interpolate properties
      return {
        name: props.name,
        visibility: props.visibility * (1 - t) + targetProps.visibility * t,
        speedMod: props.speedMod * (1 - t) + targetProps.speedMod * t,
        riskMod: props.riskMod * (1 - t) + targetProps.riskMod * t,
        encounterMod: props.encounterMod * (1 - t) + targetProps.encounterMod * t,
        travelFatigue: props.travelFatigue * (1 - t) + targetProps.travelFatigue * t,
        color: props.color,
        fogDensity: props.fogDensity * (1 - t) + targetProps.fogDensity * t
      };
    }
    
    return props;
  }
  
  // Get travel modifier
  getTravelModifier() {
    return this.getProperties();
  }
  
  // Force weather (for events/testing)
  forceWeather(weather) {
    this.current = weather;
    this.transitioning = false;
    this.lastChange = Date.now();
    this.duration = this.getWeatherDuration(weather);
    this.nextChange = this.lastChange + this.duration;
  }
  
  // Serialize
  serialize() {
    return {
      current: this.current,
      transitioning: this.transitioning,
      transitionProgress: this.transitionProgress,
      lastChange: this.lastChange,
      duration: this.duration,
      nextChange: this.nextChange,
      intensity: this.intensity
    };
  }
  
  // Deserialize
  static deserialize(data) {
    const state = new WeatherState();
    if (data) {
      state.current = data.current;
      state.transitioning = data.transitioning;
      state.transitionProgress = data.transitionProgress;
      state.lastChange = data.lastChange;
      state.duration = data.duration;
      state.nextChange = data.nextChange;
      state.intensity = data.intensity;
    }
    return state;
  }
}

export default WeatherState;
export { WeatherType, WEATHER_PROPERTIES };