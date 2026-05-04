/**
 * Workers System - Visible workers that go to workplaces and produce resources
 */

class Worker {
  constructor(id, profession, workplace = null, home = null) {
    this.id = id;
    this.profession = profession; // 'farmer', 'blacksmith', 'guard', 'merchant'
    this.workplace = workplace;
    this.home = home;
    this.productivity = 1.0;
    this.currentTask = 'idle';
    this.workAnimation = null;
    this.workProgress = 0;
    this.dailyWage = this.getDailyWage();
    this.equipment = null;
    this.skillLevel = 1;
    this.experience = 0;
  }
  
  getDailyWage() {
    const wages = {
      farmer: 0.5,
      blacksmith: 1.2,
      guard: 0.8,
      merchant: 1.0,
      worker: 0.6
    };
    return wages[this.profession] || 0.5;
  }
  
  assignWorkplace(workplace) {
    this.workplace = workplace;
    this.currentTask = 'walking_to_work';
    return true;
  }
  
  assignHome(home) {
    this.home = home;
    return true;
  }
  
  update(deltaTime, dayPhase) {
    // Update based on time of day
    switch (dayPhase) {
      case 'night':
        this.handleNightTime(deltaTime);
        break;
      case 'morning':
        this.handleMorningTime(deltaTime);
        break;
      case 'work':
        this.handleWorkTime(deltaTime);
        break;
      case 'evening':
        this.handleEveningTime(deltaTime);
        break;
    }
    
    // Update experience
    if (this.currentTask === 'working') {
      this.experience += deltaTime * 0.1;
      if (this.experience >= this.skillLevel * 100) {
        this.levelUp();
      }
    }
  }
  
  handleNightTime(deltaTime) {
    this.currentTask = 'sleeping';
    // Workers go home and sleep
    if (this.home) {
      this.moveToPosition(this.home.x, this.home.z, deltaTime * 0.5);
    }
  }
  
  handleMorningTime(deltaTime) {
    if (this.currentTask === 'sleeping') {
      this.currentTask = 'walking_to_work';
    }
    
    if (this.currentTask === 'walking_to_work' && this.workplace) {
      this.moveToWorkplace(deltaTime);
    }
  }
  
  handleWorkTime(deltaTime) {
    if (this.workplace) {
      const distance = this.getDistanceToWorkplace();
      
      if (distance > 2.0) {
        this.currentTask = 'walking_to_work';
        this.moveToWorkplace(deltaTime);
      } else {
        this.currentTask = 'working';
        this.performWork(deltaTime);
      }
    }
  }
  
  handleEveningTime(deltaTime) {
    this.currentTask = 'walking_home';
    if (this.home) {
      this.moveToPosition(this.home.x, this.home.z, deltaTime);
    }
  }
  
  moveToWorkplace(deltaTime) {
    if (!this.workplace) return;
    
    const speed = 3.0; // Workers walk faster than NPCs
    const distance = this.getDistanceToWorkplace();
    
    if (distance > 2.0) {
      const direction = this.getDirectionToWorkplace();
      const moveDistance = Math.min(speed * deltaTime, distance);
      
      // Update position (this would be handled by the entity system)
      this.currentPosition = {
        x: this.currentPosition.x + direction.x * moveDistance,
        z: this.currentPosition.z + direction.z * moveDistance
      };
      
      this.playAnimation('walk');
    } else {
      this.currentTask = 'working';
      this.playAnimation('idle');
    }
  }
  
  moveToPosition(targetX, targetZ, deltaTime) {
    const speed = 2.5;
    const distance = Math.hypot(
      targetX - this.currentPosition.x,
      targetZ - this.currentPosition.z
    );
    
    if (distance > 0.5) {
      const direction = {
        x: (targetX - this.currentPosition.x) / distance,
        z: (targetZ - this.currentPosition.z) / distance
      };
      
      const moveDistance = Math.min(speed * deltaTime, distance);
      this.currentPosition = {
        x: this.currentPosition.x + direction.x * moveDistance,
        z: this.currentPosition.z + direction.z * moveDistance
      };
      
      this.playAnimation('walk');
    }
  }
  
  performWork(deltaTime) {
    this.workProgress += deltaTime * this.productivity;
    
    // Play work animation
    this.playAnimation('work');
    
    // Produce resources based on work progress
    if (this.workProgress >= 1.0) {
      this.workProgress = 0;
      this.produceResources();
    }
  }
  
  produceResources() {
    if (!this.workplace) return;
    
    const production = this.getProductionRate();
    const actualProduction = this.applySkillBonus(production);
    
    // Add production to workplace
    if (this.workplace.addProduction) {
      this.workplace.addProduction(actualProduction);
    }
    
    // Emit production event
    this.onProduction(actualProduction);
  }
  
  getProductionRate() {
    const rates = {
      farmer: { wheat: 2.0, vegetables: 1.0 },
      blacksmith: { tools: 0.5, weapons: 0.3 },
      guard: { security: 1.0 },
      merchant: { gold: 1.5 },
      worker: { production: 1.2 }
    };
    
    return rates[this.profession] || { production: 0.8 };
  }
  
  applySkillBonus(production) {
    const bonus = 1 + (this.skillLevel - 1) * 0.1; // 10% bonus per level
    const result = {};
    
    for (const [resource, amount] of Object.entries(production)) {
      result[resource] = amount * bonus * this.productivity;
    }
    
    return result;
  }
  
  levelUp() {
    this.skillLevel++;
    this.experience = 0;
    this.productivity += 0.05; // 5% productivity boost per level
    
    // Emit level up event
    this.onLevelUp();
  }
  
  playAnimation(animation) {
    this.workAnimation = animation;
    // This would trigger the actual animation in the rendering system
  }
  
  getDistanceToWorkplace() {
    if (!this.workplace || !this.currentPosition) return Infinity;
    
    return Math.hypot(
      this.workplace.x - this.currentPosition.x,
      this.workplace.z - this.currentPosition.z
    );
  }
  
  getDirectionToWorkplace() {
    if (!this.workplace || !this.currentPosition) return { x: 0, z: 1 };
    
    const distance = this.getDistanceToWorkplace();
    return {
      x: (this.workplace.x - this.currentPosition.x) / distance,
      z: (this.workplace.z - this.currentPosition.z) / distance
    };
  }
  
  onProduction(resources) {
    // Emit production event
    const event = new CustomEvent('workerProduction', {
      detail: { workerId: this.id, resources, profession: this.profession }
    });
    document.dispatchEvent(event);
  }
  
  onLevelUp() {
    // Emit level up event
    const event = new CustomEvent('workerLevelUp', {
      detail: { workerId: this.id, newLevel: this.skillLevel, profession: this.profession }
    });
    document.dispatchEvent(event);
  }
  
  // Getters for UI
  getStatus() {
    return {
      task: this.currentTask,
      productivity: this.productivity,
      skillLevel: this.skillLevel,
      experience: this.experience,
      dailyWage: this.dailyWage,
      workplace: this.workplace?.name || 'Unemployed',
      animation: this.workAnimation
    };
  }
}

class WorkersSystem {
  constructor() {
    this.workers = [];
    this.unemployedWorkers = [];
    this.totalWages = 0;
    this.totalProduction = {};
  }
  
  createWorker(profession, workplace = null, home = null) {
    const id = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const worker = new Worker(id, profession, workplace, home);
    
    // Set initial position
    worker.currentPosition = home ? { ...home } : { x: 0, z: 0 };
    
    this.workers.push(worker);
    
    if (!workplace) {
      this.unemployedWorkers.push(worker);
    }
    
    return worker;
  }
  
  hireWorker(workerId, workplace, home = null) {
    const worker = this.workers.find(w => w.id === workerId);
    if (!worker) return false;
    
    const success = worker.assignWorkplace(workplace);
    if (success) {
      if (home) {
        worker.assignHome(home);
      }
      
      // Remove from unemployed list
      const index = this.unemployedWorkers.indexOf(worker);
      if (index > -1) {
        this.unemployedWorkers.splice(index, 1);
      }
      
      // Add worker to workplace
      if (workplace.addWorker) {
        workplace.addWorker(worker);
      }
      
      return true;
    }
    
    return false;
  }
  
  fireWorker(workerId) {
    const worker = this.workers.find(w => w.id === workerId);
    if (!worker) return false;
    
    // Remove from workplace
    if (worker.workplace && worker.workplace.removeWorker) {
      worker.workplace.removeWorker(worker);
    }
    
    // Reset worker
    worker.workplace = null;
    worker.currentTask = 'idle';
    this.unemployedWorkers.push(worker);
    
    return true;
  }
  
  updateAll(deltaTime, dayPhase) {
    this.totalWages = 0;
    this.totalProduction = {};
    
    for (const worker of this.workers) {
      worker.update(deltaTime, dayPhase);
      
      // Calculate total wages (only for working hours)
      if (dayPhase === 'work' && worker.workplace) {
        this.totalWages += worker.dailyWage * deltaTime / 3600; // Convert to per-second rate
      }
    }
  }
  
  getWorkersByProfession(profession) {
    return this.workers.filter(w => w.profession === profession);
  }
  
  getUnemployedWorkers() {
    return this.unemployedWorkers;
  }
  
  getWorkersAtWorkplace(workplaceId) {
    return this.workers.filter(w => w.workplace && w.workplace.id === workplaceId);
  }
  
  getTotalProduction() {
    return this.totalProduction;
  }
  
  getTotalWages() {
    return this.totalWages;
  }
  
  getWorkerStats() {
    const stats = {
      total: this.workers.length,
      unemployed: this.unemployedWorkers.length,
      byProfession: {},
      averageSkillLevel: 0,
      totalWages: this.totalWages
    };
    
    // Count by profession
    for (const worker of this.workers) {
      stats.byProfession[worker.profession] = (stats.byProfession[worker.profession] || 0) + 1;
      stats.averageSkillLevel += worker.skillLevel;
    }
    
    if (this.workers.length > 0) {
      stats.averageSkillLevel /= this.workers.length;
    }
    
    return stats;
  }
  
  // Save/Load functionality
  saveState() {
    return {
      workers: this.workers.map(w => ({
        id: w.id,
        profession: w.profession,
        productivity: w.productivity,
        skillLevel: w.skillLevel,
        experience: w.experience,
        dailyWage: w.dailyWage,
        workplaceId: w.workplace?.id || null,
        homeId: w.home?.id || null
      }))
    };
  }
  
  loadState(data) {
    // Implementation for loading saved state
    // This would need to be connected to the entity system
  }
}

// Browser-compatible exports
window.Worker = Worker;
window.WorkersSystem = WorkersSystem;
