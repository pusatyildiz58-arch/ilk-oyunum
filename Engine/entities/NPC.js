// filepath: engine/entities/NPC.js
/**
 * NPC Entity - Non-player characters with AI
 */

import { PositionComponent } from '../components/Position.js';
import { AIComponent } from '../components/AI.js';
import { EconomyComponent } from '../components/Economy.js';
import { CombatStatsComponent } from '../components/CombatStats.js';

// ============================================================================
// NPC ENTITY
// ============================================================================

class NPCEntity {
  constructor(world, type = 'villager') {
    this.world = world;
    this.type = type;
    this.entityId = world.createEntity('npc');
    
    // Add components
    this.position = new PositionComponent(0, 0, 0);
    this.ai = new AIComponent();
    this.economy = new EconomyComponent();
    this.combat = new CombatStatsComponent();
    
    // NPC-specific data
    this.name = this.generateName();
    this.age = 18 + Math.floor(Math.random() * 40);
    this.gender = Math.random() > 0.5 ? 'male' : 'female';
    
    // Mesh reference
    this.mesh = null;
    
    // Register components
    this.registerComponents();
  }

  registerComponents() {
    this.world.addComponent(this.entityId, 'position', this.position);
    this.world.addComponent(this.entityId, 'ai', this.ai);
    this.world.addComponent(this.entityId, 'economy', this.economy);
    this.world.addComponent(this.entityId, 'combat', this.combat);
  }

  // Generate random name
  generateName() {
    const maleNames = ['Ahmet', 'Mehmet', 'Ali', 'Veli', 'Hasan', ' Hüseyin', 'İbrahim', 'Mustafa', 'Osman', 'Ömer'];
    const femaleNames = ['Ayşe', 'Fatma', 'Emine', 'Hatice', 'Zeynep', 'Elif', 'Şerife', 'Nazlı', 'Gül', 'Seda'];
    const surnames = ['Kaya', 'Demir', 'Yılmaz', 'Çelik', 'Arslan', 'Kurt', 'Koç', 'Aktaş', 'Özdemir', 'Çetin'];
    
    const names = this.gender === 'male' ? maleNames : femaleNames;
    return `${names[Math.floor(Math.random() * names.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
  }

  // Initialize with mesh
  initWithMesh(mesh) {
    this.mesh = mesh;
    if (mesh) {
      mesh.userData.entityId = this.entityId;
    }
  }

  // Update position from mesh
  updateFromMesh() {
    if (this.mesh) {
      this.position.x = this.mesh.position.x;
      this.position.y = this.mesh.position.y;
      this.position.z = this.mesh.position.z;
    }
  }

  // AI Update - called every AI tick
  updateAI(deltaTime) {
    // Update AI needs
    this.ai.updateNeeds(deltaTime);
    
    // Get best action
    const action = this.ai.getBestAction();
    
    // Execute action based on best action
    switch (action) {
      case 'work':
        this.doWork(deltaTime);
        break;
      case 'rest':
        this.doRest(deltaTime);
        break;
      case 'trade':
        this.doTrade();
        break;
      case 'explore':
        this.doExplore(deltaTime);
        break;
      case 'fight':
        this.doFight();
        break;
      case 'flee':
        this.doFlee(deltaTime);
        break;
      default:
        this.doIdle(deltaTime);
    }
  }

  // Action implementations
  doWork(deltaTime) {
    this.ai.setState('working');
    
    // Produce based on assigned task
    const workers = this.economy.workers;
    if (workers.farming > 0) {
      this.economy.resources.food += workers.farming * deltaTime * 2;
    }
    if (workers.woodcutting > 0) {
      this.economy.resources.wood += workers.woodcutting * deltaTime * 1;
    }
    if (workers.mining > 0) {
      this.economy.resources.iron += workers.mining * deltaTime * 0.5;
    }
  }

  doRest(deltaTime) {
    this.ai.setState('resting');
    this.ai.needs.energy = Math.min(100, this.ai.needs.energy + deltaTime * 10);
  }

  doTrade() {
    this.ai.setState('trading');
    // Trading logic handled by EconomySystem
  }

  doExplore(deltaTime) {
    this.ai.setState('traveling');
    
    // Random movement
    if (Math.random() < 0.02) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5;
      this.position.velocityX = Math.cos(angle) * speed;
      this.position.velocityZ = Math.sin(angle) * speed;
    }
    
    this.position.applyVelocity(deltaTime);
  }

  doFight() {
    this.ai.setState('fighting');
    // Combat logic handled by CombatSystem
  }

  doFlee(deltaTime) {
    this.ai.setState('fleeing');
    
    // Move away from danger
    if (this.ai.memory.lastDanger) {
      const dangerPos = this.ai.memory.lastDanger.position;
      this.position.moveTowards({ x: this.position.x * 2 - dangerPos.x, y: 0, z: this.position.z * 2 - dangerPos.z }, 2);
    }
    
    this.position.applyVelocity(deltaTime);
  }

  doIdle(deltaTime) {
    this.ai.setState('idle');
    // Small random movement
    if (Math.random() < 0.01) {
      const angle = Math.random() * Math.PI * 2;
      this.position.velocityX = Math.cos(angle) * 0.1;
      this.position.velocityZ = Math.sin(angle) * 0.1;
    }
    
    this.position.applyVelocity(deltaTime);
  }

  // Set job assignment
  setJob(jobType, count) {
    this.economy.setWorkers(jobType, count);
  }

  // Get state for UI
  getState() {
    return {
      name: this.name,
      type: this.type,
      state: this.ai.state,
      gold: Math.floor(this.economy.resources.gold),
      food: Math.floor(this.economy.resources.food),
      health: this.combat.health
    };
  }

  // Serialize for saving
  serialize() {
    return {
      entityId: this.entityId,
      type: this.type,
      name: this.name,
      age: this.age,
      gender: this.gender,
      position: this.position.serialize(),
      ai: this.ai.serialize(),
      economy: this.economy.serialize(),
      combat: this.combat.serialize()
    };
  }

  // Deserialize from save
  static deserialize(world, data) {
    const npc = new NPCEntity(world, data.type);
    
    npc.name = data.name || npc.name;
    npc.age = data.age || npc.age;
    npc.gender = data.gender || npc.gender;
    
    // Restore components
    if (data.position) {
      npc.position = PositionComponent.deserialize(data.position);
      world.addComponent(npc.entityId, 'position', npc.position);
    }
    
    if (data.ai) {
      npc.ai = AIComponent.deserialize(data.ai);
      world.addComponent(npc.entityId, 'ai', npc.ai);
    }
    
    if (data.economy) {
      npc.economy = EconomyComponent.deserialize(data.economy);
      world.addComponent(npc.entityId, 'economy', npc.economy);
    }
    
    if (data.combat) {
      npc.combat = CombatStatsComponent.deserialize(data.combat);
      world.addComponent(npc.entityId, 'combat', npc.combat);
    }
    
    return npc;
  }
}

// Export
export { NPCEntity };