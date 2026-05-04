// filepath: engine/components/AI.js
/**
 * AI Component - NPC behavior and decision data
 */

// ============================================================================
// AI COMPONENT
// ============================================================================

class AIComponent {
  constructor() {
    // Current state
    this.state = 'idle'; // idle, working, trading, traveling, fighting, resting
    
    // Behavior tree / Utility AI scores
    this.scores = {
      work: 0,
      rest: 0,
      trade: 0,
      explore: 0,
      fight: 0,
      flee: 0
    };
    
    // Needs (0-100)
    this.needs = {
      hunger: 20,
      energy: 30,
      gold: 50,
      social: 30
    };
    
    // Memory
    this.memory = {
      lastInteraction: null,
      lastTrade: null,
      lastDanger: null,
      reputation: {} // entityId -> reputation value
    };
    
    // Target
    this.targetEntity = null;
    this.targetPosition = null;
    
    // Schedule
    this.schedule = 'day'; // day, night
    
    // Personality traits
    this.personality = {
      aggression: 0.5, // 0-1
      greed: 0.5,
      sociability: 0.5,
      bravery: 0.5
    };
  }

  // Update needs
  updateNeeds(deltaTime) {
    // Hunger increases over time
    this.needs.hunger = Math.min(100, this.needs.hunger + deltaTime * 2);
    
    // Energy decreases with activity
    if (this.state === 'working' || this.state === 'traveling') {
      this.needs.energy = Math.max(0, this.needs.energy - deltaTime * 3);
    } else if (this.state === 'resting') {
      this.needs.energy = Math.min(100, this.needs.energy + deltaTime * 10);
    }
    
    // Gold need based on inventory
    this.needs.gold = Math.max(0, 100 - this.needs.gold);
  }

  // Calculate behavior scores based on needs and personality
  calculateScores() {
    // Work score based on gold need and hunger
    this.scores.work = (this.needs.gold / 100) * (1 - this.needs.hunger / 100);
    
    // Rest score based on energy
    this.scores.rest = (100 - this.needs.energy) / 100;
    
    // Trade score based on gold need
    this.scores.trade = (this.needs.gold / 100) * 0.8;
    
    // Explore score when other needs are low
    const totalNeed = (this.needs.hunger + this.needs.energy + this.needs.gold + this.needs.social) / 400;
    this.scores.explore = 1 - totalNeed;
    
    // Fight score based on aggression and danger memory
    if (this.memory.lastDanger) {
      this.scores.fight = this.personality.aggression;
      this.scores.flee = 1 - this.personality.bravery;
    }
  }

  // Get best action based on scores
  getBestAction() {
    this.calculateScores();
    
    let bestAction = 'idle';
    let bestScore = -Infinity;
    
    for (const [action, score] of Object.entries(this.scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }
    
    return bestAction;
  }

  // Set state
  setState(newState) {
    this.state = newState;
  }

  // Add reputation with entity
  addReputation(entityId, amount) {
    if (!this.memory.reputation[entityId]) {
      this.memory.reputation[entityId] = 50;
    }
    this.memory.reputation[entityId] = Math.max(0, Math.min(100, 
      this.memory.reputation[entityId] + amount));
  }

  // Get reputation with entity
  getReputation(entityId) {
    return this.memory.reputation[entityId] || 50;
  }

  // Record interaction
  recordInteraction(entityId, type) {
    this.memory.lastInteraction = {
      entityId,
      type,
      time: Date.now()
    };
  }

  // Serialize for saving
  serialize() {
    return {
      state: this.state,
      scores: { ...this.scores },
      needs: { ...this.needs },
      memory: {
        lastInteraction: this.memory.lastInteraction,
        lastTrade: this.memory.lastTrade,
        lastDanger: this.memory.lastDanger,
        reputation: { ...this.memory.reputation }
      },
      targetEntity: this.targetEntity,
      targetPosition: this.targetPosition,
      schedule: this.schedule,
      personality: { ...this.personality }
    };
  }

  // Deserialize from save
  static deserialize(data) {
    const ai = new AIComponent();
    ai.state = data.state || 'idle';
    ai.scores = data.scores || ai.scores;
    ai.needs = data.needs || ai.needs;
    ai.memory = data.memory || ai.memory;
    ai.targetEntity = data.targetEntity;
    ai.targetPosition = data.targetPosition;
    ai.schedule = data.schedule || 'day';
    ai.personality = data.personality || ai.personality;
    return ai;
  }
}

// Export
export { AIComponent };