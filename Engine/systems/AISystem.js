// filepath: engine/systems/AISystem.js
/**
 * AI System - NPC behavior and decision making
 * Uses Utility AI for autonomous decision making
 */

import { System } from '../ECS.js';

// ============================================================================
// AI SYSTEM
// ============================================================================

class AISystem extends System {
  constructor(world, eventBus) {
    super(world, 10); // Priority 10, runs at 10 TPS
    this.eventBus = eventBus;
    
    // Behavior configurations
    this.behaviorConfig = {
      villager: {
        workThreshold: 0.3,
        restThreshold: 0.3,
        tradeThreshold: 0.4,
        exploreChance: 0.1
      },
      merchant: {
        workThreshold: 0.2,
        restThreshold: 0.2,
        tradeThreshold: 0.7,
        exploreChance: 0.3
      },
      guard: {
        workThreshold: 0.4,
        restThreshold: 0.2,
        tradeThreshold: 0.1,
        exploreChance: 0.2
      },
      bandit: {
        workThreshold: 0.1,
        restThreshold: 0.2,
        tradeThreshold: 0.1,
        exploreChance: 0.4
      }
    };
  }

  update(deltaTime) {
    // Get all NPCs
    const npcEntities = this.world.getEntitiesWithComponent('ai');
    
    for (const entityId of npcEntities) {
      const ai = this.world.getComponent(entityId, 'ai');
      const position = this.world.getComponent(entityId, 'position');
      const economy = this.world.getComponent(entityId, 'economy');
      
      if (!ai || !position) continue;
      
      // Update needs
      this.updateNeeds(ai, economy, deltaTime);
      
      // Calculate behavior scores
      this.calculateBehaviorScores(ai, economy);
      
      // Execute best behavior
      this.executeBehavior(entityId, ai, position, deltaTime);
    }
  }

  // Update NPC needs
  updateNeeds(ai, economy, deltaTime) {
    // Hunger increases over time
    ai.needs.hunger = Math.min(100, ai.needs.hunger + deltaTime * 2);
    
    // Energy decreases with activity
    if (ai.state === 'working' || ai.state === 'traveling') {
      ai.needs.energy = Math.max(0, ai.needs.energy - deltaTime * 3);
    } else if (ai.state === 'resting') {
      ai.needs.energy = Math.min(100, ai.needs.energy + deltaTime * 10);
    }
    
    // Gold need based on economy
    if (economy) {
      ai.needs.gold = Math.max(0, 100 - economy.resources.gold);
    }
  }

  // Calculate behavior scores using Utility AI
  calculateBehaviorScores(ai, economy) {
    // Work score - based on gold need and low hunger
    const workPotential = economy ? economy.getTotalWorkers() / 10 : 0.5;
    ai.scores.work = (ai.needs.gold / 100) * (1 - ai.needs.hunger / 100) * workPotential;
    
    // Rest score - based on low energy
    ai.scores.rest = (100 - ai.needs.energy) / 100;
    
    // Trade score - based on gold need and available resources
    if (economy && economy.resources.gold < 50) {
      ai.scores.trade = 0.6;
    } else {
      ai.scores.trade = 0.2;
    }
    
    // Explore score - when other needs are low
    const totalNeed = (ai.needs.hunger + ai.needs.energy + ai.needs.gold + ai.needs.social) / 400;
    ai.scores.explore = Math.max(0, 1 - totalNeed) * 0.3;
    
    // Fight score - based on aggression and danger
    if (ai.memory.lastDanger) {
      ai.scores.fight = ai.personality.aggression;
      ai.scores.flee = 1 - ai.personality.bravery;
    } else {
      ai.scores.fight = 0;
      ai.scores.flee = 0;
    }
  }

  // Execute the best behavior
  executeBehavior(entityId, ai, position, deltaTime) {
    // Find best action
    let bestAction = 'idle';
    let bestScore = -Infinity;
    
    for (const [action, score] of Object.entries(ai.scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestAction = action;
      }
    }
    
    // Execute based on best action
    switch (bestAction) {
      case 'work':
        this.executeWork(entityId, ai, position, deltaTime);
        break;
      case 'rest':
        this.executeRest(entityId, ai, deltaTime);
        break;
      case 'trade':
        this.executeTrade(entityId, ai);
        break;
      case 'explore':
        this.executeExplore(entityId, ai, position, deltaTime);
        break;
      case 'fight':
        this.executeFight(entityId, ai);
        break;
      case 'flee':
        this.executeFlee(entityId, ai, position, deltaTime);
        break;
      default:
        this.executeIdle(entityId, ai, position, deltaTime);
    }
    
    // Emit AI decision event
    this.eventBus.emit('npc:ai:decision', {
      entityId,
      action: ai.state,
      scores: ai.scores
    });
  }

  // Behavior executors
  executeWork(entityId, ai, position, deltaTime) {
    ai.setState('working');
    
    const economy = this.world.getComponent(entityId, 'economy');
    if (economy) {
      // Produce resources based on workers
      economy.resources.food += economy.workers.farming * deltaTime * 2;
      economy.resources.wood += economy.workers.woodcutting * deltaTime * 1;
    }
  }

  executeRest(entityId, ai, deltaTime) {
    ai.setState('resting');
    ai.needs.energy = Math.min(100, ai.needs.energy + deltaTime * 10);
  }

  executeTrade(entityId, ai) {
    ai.setState('trading');
    // Trading handled by EconomySystem
  }

  executeExplore(entityId, ai, position, deltaTime) {
    ai.setState('traveling');
    
    // Random wandering
    if (Math.random() < 0.02) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5;
      position.velocityX = Math.cos(angle) * speed;
      position.velocityZ = Math.sin(angle) * speed;
    }
    
    // Apply velocity
    position.x += position.velocityX * deltaTime;
    position.z += position.velocityZ * deltaTime;
    
    // Keep in bounds
    position.x = Math.max(-100, Math.min(100, position.x));
    position.z = Math.max(-100, Math.min(100, position.z));
  }

  executeFight(entityId, ai) {
    ai.setState('fighting');
    // Combat handled by CombatSystem
  }

  executeFlee(entityId, ai, position, deltaTime) {
    ai.setState('fleeing');
    
    // Move away from danger
    if (ai.memory.lastDanger) {
      const danger = ai.memory.lastDanger;
      const dx = position.x - danger.x;
      const dz = position.z - danger.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist > 0.1) {
        position.velocityX = (dx / dist) * 2;
        position.velocityZ = (dz / dist) * 2;
      }
    }
    
    position.x += position.velocityX * deltaTime;
    position.z += position.velocityZ * deltaTime;
  }

  executeIdle(entityId, ai, position, deltaTime) {
    ai.setState('idle');
    
    // Small random movement
    if (Math.random() < 0.01) {
      const angle = Math.random() * Math.PI * 2;
      position.velocityX = Math.cos(angle) * 0.1;
      position.velocityZ = Math.sin(angle) * 0.1;
    }
    
    position.x += position.velocityX * deltaTime;
    position.z += position.velocityZ * deltaTime;
  }

  // Record danger for NPC
  recordDanger(entityId, x, z) {
    const ai = this.world.getComponent(entityId, 'ai');
    if (ai) {
      ai.memory.lastDanger = { x, z, time: Date.now() };
    }
  }

  // Record interaction
  recordInteraction(entityId, targetId, type) {
    const ai = this.world.getComponent(entityId, 'ai');
    if (ai) {
      ai.recordInteraction(targetId, type);
    }
  }
}

// Export
export { AISystem };