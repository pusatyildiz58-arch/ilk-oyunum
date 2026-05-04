/**
 * NPC System - Real NPC Logic with Roles and Behaviors
 */

class NPCBehavior {
  constructor(role, workplace = null, home = null) {
    this.role = role; // 'farmer', 'guard', 'trader', 'worker', 'merchant', 'blacksmith'
    this.workplace = workplace;
    this.home = home;
    this.currentTask = 'idle';
    this.targetPosition = null;
    this.workProgress = 0;
    this.schedule = this.generateSchedule();
    this.path = [];
    this.currentPathIndex = 0;
  }
  
  generateSchedule() {
    const schedules = {
      farmer: {
        night: { task: 'sleep', location: 'home' },
        morning: { task: 'go_to_farm', location: 'workplace' },
        work: { task: 'work_farm', location: 'workplace' },
        evening: { task: 'go_home', location: 'home' }
      },
      guard: {
        night: { task: 'guard_post', location: 'patrol' },
        morning: { task: 'patrol_village', location: 'patrol' },
        work: { task: 'guard_post', location: 'guard_post' },
        evening: { task: 'patrol_village', location: 'patrol' }
      },
      trader: {
        night: { task: 'sleep', location: 'home' },
        morning: { task: 'go_to_market', location: 'market' },
        work: { task: 'trade', location: 'market' },
        evening: { task: 'go_home', location: 'home' }
      },
      worker: {
        night: { task: 'sleep', location: 'home' },
        morning: { task: 'go_to_work', location: 'workplace' },
        work: { task: 'work', location: 'workplace' },
        evening: { task: 'go_home', location: 'home' }
      },
      merchant: {
        night: { task: 'sleep', location: 'home' },
        morning: { task: 'setup_shop', location: 'shop' },
        work: { task: 'sell_goods', location: 'shop' },
        evening: { task: 'close_shop', location: 'home' }
      },
      blacksmith: {
        night: { task: 'sleep', location: 'home' },
        morning: { task: 'go_to_forge', location: 'forge' },
        work: { task: 'craft', location: 'forge' },
        evening: { task: 'go_home', location: 'home' }
      }
    };
    
    return schedules[this.role] || schedules.worker;
  }
  
  update(npc, deltaTime, dayPhase) {
    const phaseSchedule = this.schedule[dayPhase];
    if (!phaseSchedule) return;
    
    // Update current task based on schedule
    if (this.currentTask !== phaseSchedule.task) {
      this.currentTask = phaseSchedule.task;
      this.workProgress = 0;
      this.setTargetLocation(npc, phaseSchedule.location);
    }
    
    // Execute current task
    this.executeTask(npc, deltaTime);
  }
  
  setTargetLocation(npc, locationType) {
    let targetPos = npc.position;
    
    switch (locationType) {
      case 'home':
        if (this.home) {
          targetPos = { x: this.home.x, z: this.home.z };
        }
        break;
      case 'workplace':
        if (this.workplace) {
          targetPos = { x: this.workplace.x, z: this.workplace.z };
        }
        break;
      case 'market':
        targetPos = { x: 0, z: 10 }; // Village center
        break;
      case 'patrol':
        targetPos = this.getPatrolPoint(npc);
        break;
      case 'guard_post':
        targetPos = this.getGuardPost(npc);
        break;
      case 'shop':
        targetPos = this.getShopLocation(npc);
        break;
      case 'forge':
        targetPos = this.getForgeLocation(npc);
        break;
    }
    
    this.targetPosition = targetPos;
    this.path = []; // Reset path when target changes
  }
  
  executeTask(npc, deltaTime) {
    switch (this.currentTask) {
      case 'go_to_farm':
      case 'go_to_work':
      case 'go_to_market':
      case 'go_to_forge':
      case 'go_to_shop':
      case 'go_home':
        this.walkToTarget(npc, deltaTime);
        break;
        
      case 'work_farm':
      case 'work':
      case 'craft':
        this.performWork(npc, deltaTime);
        break;
        
      case 'trade':
      case 'sell_goods':
        this.performTrade(npc, deltaTime);
        break;
        
      case 'patrol_village':
        this.patrol(npc, deltaTime);
        break;
        
      case 'guard_post':
        this.guard(npc, deltaTime);
        break;
        
      case 'setup_shop':
      case 'close_shop':
        this.setupWorkplace(npc, deltaTime);
        break;
        
      case 'sleep':
        this.sleep(npc, deltaTime);
        break;
        
      default:
        this.idle(npc, deltaTime);
    }
  }
  
  walkToTarget(npc, deltaTime) {
    if (!this.targetPosition) return;
    
    const speed = 2.0; // Units per second
    const distance = Math.hypot(
      this.targetPosition.x - npc.position.x,
      this.targetPosition.z - npc.position.z
    );
    
    if (distance > 0.5) {
      // Move towards target
      const direction = {
        x: (this.targetPosition.x - npc.position.x) / distance,
        z: (this.targetPosition.z - npc.position.z) / distance
      };
      
      const moveDistance = Math.min(speed * deltaTime, distance);
      // Use direct position assignment instead of setPosition
      npc.position.x += direction.x * moveDistance;
      npc.position.z += direction.z * moveDistance;
      
      // Update mesh position if exists
      if (npc.mesh) {
        npc.mesh.position.set(npc.position.x, npc.position.y, npc.position.z);
      }
      
      // Update rotation to face movement direction
      npc.rotation = Math.atan2(direction.x, direction.z);
      if (npc.mesh) {
        npc.mesh.rotation.y = npc.rotation;
      }
      
      // Play walking animation
      this.playAnimation(npc, 'walk');
    } else {
      // Reached target
      this.playAnimation(npc, 'idle');
    }
  }
  
  performWork(npc, deltaTime) {
    this.workProgress += deltaTime;
    
    // Play work animation
    this.playAnimation(npc, 'work');
    
    // Produce resources based on work progress
    if (this.workplace && this.workProgress >= 1.0) {
      this.workProgress = 0;
      this.produceResources(npc);
    }
  }
  
  produceResources(npc) {
    if (!this.workplace) return;
    
    const production = this.getProductionRate();
    const economy = this.workplace.getComponent('economy');
    
    if (economy) {
      for (const [resource, amount] of Object.entries(production)) {
        economy.storage[resource] = (economy.storage[resource] || 0) + amount;
      }
    }
  }
  
  getProductionRate() {
    const rates = {
      farmer: { wheat: 1.0, vegetables: 0.5 },
      worker: { production: 0.8 },
      blacksmith: { tools: 0.3, weapons: 0.2 },
      merchant: { gold: 0.5 }
    };
    
    return rates[this.role] || { production: 0.5 };
  }
  
  patrol(npc, deltaTime) {
    // Simple patrol behavior - walk in a circle around village
    const time = Date.now() / 1000;
    const radius = 20;
    const centerX = 0;
    const centerZ = 0;
    
    const targetX = centerX + Math.cos(time * 0.2) * radius;
    const targetZ = centerZ + Math.sin(time * 0.2) * radius;
    
    this.targetPosition = { x: targetX, z: targetZ };
    this.walkToTarget(npc, deltaTime);
  }
  
  guard(npc, deltaTime) {
    // Stand guard at post
    this.playAnimation(npc, 'idle');
    
    // Occasionally look around
    if (Math.random() < 0.01) {
      npc.rotation = Math.random() * Math.PI * 2;
      if (npc.mesh) {
        npc.mesh.rotation.y = npc.rotation;
      }
    }
  }
  
  performTrade(npc, deltaTime) {
    this.playAnimation(npc, 'talk');
    
    // Simulate trading
    if (Math.random() < 0.02) {
      // Complete a trade
      this.workProgress += deltaTime;
    }
  }
  
  setupWorkplace(npc, deltaTime) {
    this.playAnimation(npc, 'work');
    this.workProgress += deltaTime;
  }
  
  sleep(npc, deltaTime) {
    this.playAnimation(npc, 'sleep');
    
    // NPCs don't move while sleeping
    if (this.home) {
      // Stay near home - use direct position assignment
      npc.position.x = this.home.x + (Math.random() - 0.5) * 2;
      npc.position.z = this.home.z + (Math.random() - 0.5) * 2;
      
      // Update mesh position if exists
      if (npc.mesh) {
        npc.mesh.position.set(npc.position.x, npc.position.y, npc.position.z);
      }
    }
  }
  
  idle(npc, deltaTime) {
    this.playAnimation(npc, 'idle');
    
    // Random idle movement
    if (Math.random() < 0.01) {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomDistance = Math.random() * 2;
      
      this.targetPosition = {
        x: npc.position.x + Math.cos(randomAngle) * randomDistance,
        z: npc.position.z + Math.sin(randomAngle) * randomDistance
      };
    }
    
    if (this.targetPosition) {
      this.walkToTarget(npc, deltaTime * 0.3); // Slower when idle
    }
  }
  
  playAnimation(npc, animation) {
    const visual = npc.components ? npc.components.get('visual') : null;
    if (visual && visual.currentAnimation !== animation) {
      visual.currentAnimation = animation;
      // Here you would trigger the actual animation
      console.log(`${npc.id} playing ${animation} animation`);
    }
  }
  
  // Helper methods for specific locations
  getPatrolPoint(npc) {
    const points = [
      { x: 20, z: 20 },
      { x: -20, z: 20 },
      { x: -20, z: -20 },
      { x: 20, z: -20 }
    ];
    return points[Math.floor(Math.random() * points.length)];
  }
  
  getGuardPost(npc) {
    return { x: 15, z: 0 }; // Fixed guard post
  }
  
  getShopLocation(npc) {
    return { x: 8, z: 7 }; // Market area
  }
  
  getForgeLocation(npc) {
    return { x: -8, z: -7 }; // Blacksmith area
  }
}

class NPCSystem {
  constructor() {
    this.npcs = [];
    this.roles = ['farmer', 'guard', 'trader', 'worker', 'merchant', 'blacksmith'];
  }
  
  createNPC(id, role, position, workplace = null, home = null) {
    const behavior = new NPCBehavior(role, workplace, home);
    const npc = {
      id: id,
      type: 'npc',
      position: { ...position },
      rotation: 0,
      components: new Map(),
      behaviors: [behavior],
      interactionRadius: 2.0,
      isActive: true
    };
    
    // Add components
    npc.components.set('behavior', behavior);
    npc.components.set('interaction', {
      radius: 2.0,
      type: 'npc',
      actions: this.getNPCActions(role)
    });
    
    npc.components.set('visual', {
      mesh: null, // Will be set by rendering system
      animations: ['idle', 'walk', 'work', 'talk', 'sleep'],
      currentAnimation: 'idle'
    });
    
    this.npcs.push(npc);
    return npc;
  }
  
  getNPCActions(role) {
    const actions = {
      farmer: ['talk', 'hire'],
      guard: ['talk', 'hire'],
      trader: ['talk', 'trade'],
      worker: ['talk', 'hire'],
      merchant: ['talk', 'trade'],
      blacksmith: ['talk', 'craft', 'trade']
    };
    
    return actions[role] || ['talk'];
  }
  
  updateAll(deltaTime, dayPhase) {
    for (const npc of this.npcs) {
      if (!npc.isActive) continue;
      
      // Update behaviors
      for (const behavior of npc.behaviors) {
        behavior.update(npc, deltaTime, dayPhase);
      }
    }
  }
  
  getNPCsByRole(role) {
    return this.npcs.filter(npc => {
      const behavior = npc.components ? npc.components.get('behavior') : null;
      return behavior && behavior.role === role;
    });
  }
  
  assignWorkplace(npcId, workplace) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (npc) {
      const behavior = npc.components ? npc.components.get('behavior') : null;
      if (behavior) {
        behavior.workplace = workplace;
        return true;
      }
    }
    return false;
  }
  
  assignHome(npcId, home) {
    const npc = this.npcs.find(n => n.id === npcId);
    if (npc) {
      const behavior = npc.components ? npc.components.get('behavior') : null;
      if (behavior) {
        behavior.home = home;
        return true;
      }
    }
    return false;
  }
}

// Browser-compatible exports
window.NPCBehavior = NPCBehavior;
window.NPCSystem = NPCSystem;
