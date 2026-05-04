// Engine/Game.js - Main Game Engine

import { World } from './Core/ECS.js';
import { EventBus, GameEvents } from './Core/EventBus.js';
import { TimeSystem } from './Core/TimeSystem.js';

// Systems
import { MovementSystem } from './Systems/MovementSystem.js';
import { AISystem } from './Systems/AISystem.js';
import { EconomySystem } from './Systems/EconomySystem.js';
import { InteractionSystem } from './Systems/InteractionSystem.js';
import { WorkerSystem } from './Systems/WorkerSystem.js';

// Components
import { ComponentTypes } from './Components.js';
import * as Components from './Components.js';

// Rendering
import { SceneManager } from '../Render/SceneManager.js';
import { EntityRenderer } from '../Render/EntityRenderer.js';

// UI
import { UIManager } from '../UI/UIManager.js';

export class Game {
  constructor() {
    this.world = new World();
    this.eventBus = new EventBus();
    this.timeSystem = new TimeSystem(this.eventBus);
    
    this.sceneManager = null;
    this.entityRenderer = null;
    this.uiManager = null;
    
    this.playerId = null;
    this.running = false;
    this.lastFrameTime = 0;
    
    // Bind world to eventBus
    this.world.eventBus = this.eventBus;
  }

  async init() {
    console.log('Initializing game...');
    
    try {
      // 1. Init rendering
      await this.initRendering();
      
      // 2. Init systems
      this.initSystems();
      
      // 3. Init UI
      this.initUI();
      
      // 4. Create world
      await this.createWorld();
      
      // 5. Create player
      this.createPlayer();
      
      // 6. Init time system
      this.timeSystem.init();
      
      console.log('Game initialized successfully');
      
    } catch (error) {
      console.error('Game initialization failed:', error);
      throw error;
    }
  }

  async initRendering() {
    this.sceneManager = new SceneManager();
    this.sceneManager.init();
    
    this.entityRenderer = new EntityRenderer(this.sceneManager.scene, this.world);
  }

  initSystems() {
    // Add systems in priority order
    this.world.addSystem(new MovementSystem(this.world));
    this.world.addSystem(new AISystem(this.world));
    this.world.addSystem(new EconomySystem(this.world, this.eventBus));
    this.world.addSystem(new InteractionSystem(this.world, this.eventBus));
    this.world.addSystem(new WorkerSystem(this.world, this.eventBus));
  }

  initUI() {
    this.uiManager = new UIManager(this.world, this.eventBus);
    this.uiManager.init();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Player interaction
    document.addEventListener('keydown', (e) => {
      if (e.key === 'e' || e.key === 'E') {
        const interactionSystem = this.world.getSystem(InteractionSystem);
        if (interactionSystem && this.playerId) {
          interactionSystem.interact(this.playerId);
        }
      }
      
      if (e.key === 'Escape') {
        this.uiManager.closeAllPanels();
      }
    });

    // Update UI on economy tick
    this.eventBus.on(GameEvents.ECONOMY_TICK, () => {
      this.uiManager.updatePlayerStats(this.playerId);
    });

    // Update UI on resource production
    this.eventBus.on(GameEvents.RESOURCE_PRODUCED, (data) => {
      if (data.owner === this.playerId) {
        this.uiManager.updatePlayerStats(this.playerId);
      }
    });
  }

  async createWorld() {
    console.log('Creating world...');
    
    // Village data
    const villageData = [
      { x: 0, z: 0, name: 'Başköy', type: 'farming' },
      { x: 65, z: -25, name: 'Yeşilova', type: 'farming' },
      { x: -55, z: 42, name: 'Kuzluk', type: 'farming' },
      { x: 90, z: 32, name: 'Tuzpazarı', type: 'trade' },
      { x: -75, z: -32, name: 'Demircik', type: 'mining' },
      { x: 32, z: 78, name: 'Karlıköy', type: 'farming' },
    ];

    // Create villages
    for (const vData of villageData) {
      await this.createVillageEntities(vData);
    }

    // Create terrain
    this.createTerrain();
    
    // Create roads
    this.createRoads();
    
    // Create bandit camps
    this.createBanditCamps();
    
    // Create scattered trees
    this.createScatteredTrees();
  }

  async createVillageEntities(villageData) {
    const { x, z, name, type } = villageData;
    
    // Create village entity
    const villageId = this.world.createEntity('village');
    
    // Add components
    this.world.addComponent(villageId, ComponentTypes.POSITION, 
      Components.createPositionComponent(x, 0, z));
    
    this.world.addComponent(villageId, ComponentTypes.VILLAGE,
      Components.createVillageComponent(name, type));
    
    this.world.addComponent(villageId, ComponentTypes.ECONOMY,
      Components.createEconomyComponent(this.getVillageEconomy(type)));
    
    this.world.addComponent(villageId, ComponentTypes.INTERACTABLE,
      Components.createInteractableComponent('village', 6));
    
    // Set interactable properties
    const interactable = this.world.getComponent(villageId, ComponentTypes.INTERACTABLE);
    interactable.label = name;
    interactable.actions = ['trade', 'hire', 'talk'];
    
    // Create visual representation
    this.createVillageVisuals(x, z, name, type);
    
    // Create NPCs
    this.createVillageNPCs(x, z, villageId, 3);
  }

  getVillageEconomy(type) {
    const base = {};
    const goodsList = ['food', 'meat', 'leather', 'iron', 'wood', 'weapon', 'armor'];
    
    goodsList.forEach(good => {
      base[good] = { supply: 50, target: 50, production: 1, consumption: 0.5 };
    });
    
    // Type-specific production
    if (type === 'farming') {
      base.food = { supply: 120, target: 80, production: 5, consumption: 2 };
      base.meat = { supply: 60, target: 40, production: 2, consumption: 1 };
    } else if (type === 'trade') {
      base.leather = { supply: 80, target: 60, production: 4, consumption: 1 };
      base.wood = { supply: 70, target: 60, production: 3, consumption: 1 };
    } else if (type === 'mining') {
      base.iron = { supply: 150, target: 80, production: 8, consumption: 1 };
      base.weapon = { supply: 30, target: 25, production: 2, consumption: 0.3 };
    }
    
    return base;
  }

  createVillageVisuals(x, z, name, type) {
    // Create well
    this.entityRenderer.createWell(x, z);
    
    // Create market
    this.entityRenderer.createMarket(x + 7, z + 2);
    
    // Create farm
    this.entityRenderer.createFarm(x - 12, z - 10);
    
    // Create houses
    const houseCount = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < houseCount; i++) {
      const angle = (i / houseCount) * Math.PI * 2;
      const distance = 9 + Math.random() * 5;
      const hx = x + Math.cos(angle) * distance;
      const hz = z + Math.sin(angle) * distance;
      this.entityRenderer.createHouse(hx, hz, angle);
    }
    
    // Type-specific buildings
    if (type === 'mining' || type === 'trade') {
      this.entityRenderer.createBlacksmith(x + 16, z - 12);
    }
    
    // Trees around village
    const treeCount = 12;
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 14 + Math.random() * 12;
      const tx = x + Math.cos(angle) * distance;
      const tz = z + Math.sin(angle) * distance;
      this.entityRenderer.createTree(tx, tz, 0.6 + Math.random() * 0.5);
    }
  }

  createVillageNPCs(x, z, villageId, count) {
    for (let i = 0; i < count; i++) {
      const npcId = this.world.createEntity('npc');
      
      const offsetX = (Math.random() - 0.5) * 15;
      const offsetZ = (Math.random() - 0.5) * 15;
      
      this.world.addComponent(npcId, ComponentTypes.POSITION,
        Components.createPositionComponent(x + offsetX, 0, z + offsetZ));
      
      this.world.addComponent(npcId, ComponentTypes.MOVEMENT,
        Components.createMovementComponent(1.2));
      
      this.world.addComponent(npcId, ComponentTypes.AI,
        Components.createAIComponent('idle'));
      
      // Set AI home position
      const ai = this.world.getComponent(npcId, ComponentTypes.AI);
      ai.homePosition = { x, z };
      
      this.world.addComponent(npcId, ComponentTypes.RENDERABLE,
        Components.createRenderableComponent('npc', 0x8b5a14));
      
      // Create visual
      this.entityRenderer.createNPC(npcId);
    }
  }

  createTerrain() {
    this.entityRenderer.createTerrain();
  }

  createRoads() {
    const roads = [
      [0, 0, 65, -25],
      [0, 0, -55, 42],
      [65, -25, 90, 32],
      [-55, 42, 32, 78],
    ];
    
    roads.forEach(([x1, z1, x2, z2]) => {
      this.entityRenderer.createRoad(x1, z1, x2, z2);
    });
  }

  createBanditCamps() {
    const camps = [
      { x: 28, z: 18 },
      { x: -28, z: -16 },
      { x: 48, z: -48 },
      { x: -58, z: 22 },
    ];
    
    camps.forEach(({ x, z }) => {
      const campId = this.world.createEntity('bandit_camp');
      
      this.world.addComponent(campId, ComponentTypes.POSITION,
        Components.createPositionComponent(x, 0, z));
      
      this.world.addComponent(campId, ComponentTypes.INTERACTABLE,
        Components.createInteractableComponent('bandit', 8));
      
      const interactable = this.world.getComponent(campId, ComponentTypes.INTERACTABLE);
      const count = 3 + Math.floor(Math.random() * 5);
      interactable.label = 'Eşkıya Kampı';
      interactable.actions = ['raid'];
      interactable.metadata = { count };
      
      // Visual
      this.entityRenderer.createBanditCamp(x, z);
    });
  }

  createScatteredTrees() {
    const treeCount = 150;
    const villages = this.world.getEntitiesByType('village');
    
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * 280;
      const z = (Math.random() - 0.5) * 280;
      
      // Check distance from villages
      let tooClose = false;
      for (const vId of villages) {
        const vPos = this.world.getComponent(vId, ComponentTypes.POSITION);
        if (vPos) {
          const dx = x - vPos.x;
          const dz = z - vPos.z;
          if (dx * dx + dz * dz < 800) {
            tooClose = true;
            break;
          }
        }
      }
      
      if (!tooClose) {
        this.entityRenderer.createTree(x, z, 0.5 + Math.random() * 0.7);
      }
    }
  }

  createPlayer() {
    this.playerId = this.world.createEntity('player');
    
    // Add components
    this.world.addComponent(this.playerId, ComponentTypes.POSITION,
      Components.createPositionComponent(5, 0, 5));
    
    this.world.addComponent(this.playerId, ComponentTypes.MOVEMENT,
      Components.createMovementComponent(12));
    
    this.world.addComponent(this.playerId, ComponentTypes.INVENTORY,
      Components.createInventoryComponent(30));
    
    const inventory = this.world.getComponent(this.playerId, ComponentTypes.INVENTORY);
    inventory.gold = 80;
    inventory.items.food = 5;
    
    this.world.addComponent(this.playerId, ComponentTypes.PLAYER,
      Components.createPlayerComponent());
    
    this.world.addComponent(this.playerId, ComponentTypes.RENDERABLE,
      Components.createRenderableComponent('player', 0x3a5f8a));
    
    // Create visual
    this.entityRenderer.createPlayer(this.playerId);
    
    // Update UI
    this.uiManager.updatePlayerStats(this.playerId);
  }

  start() {
    this.running = true;
    this.lastFrameTime = performance.now();
    this.gameLoop(this.lastFrameTime);
  }

  gameLoop(currentTime) {
    if (!this.running) return;
    
    requestAnimationFrame((time) => this.gameLoop(time));
    
    const deltaTime = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = currentTime;
    
    // Update time
    this.timeSystem.update(currentTime);
    
    // Update world systems
    this.world.update(deltaTime);
    
    // Update rendering
    this.entityRenderer.update(deltaTime);
    this.sceneManager.render(this.playerId);
    
    // Update UI
    this.uiManager.update(deltaTime);
  }

  stop() {
    this.running = false;
  }

  // Save/Load
  saveGame() {
    console.log('Saving game...');
    // TODO: Implement save system
  }

  loadGame() {
    console.log('Loading game...');
    // TODO: Implement load system
  }

  // Battle helper
  tryBattle() {
    const playerPos = this.world.getComponent(this.playerId, ComponentTypes.POSITION);
    if (!playerPos) return;
    
    // Find nearby bandit camps
    const camps = this.world.getEntitiesByType('bandit_camp');
    
    for (const campId of camps) {
      const campPos = this.world.getComponent(campId, ComponentTypes.POSITION);
      const interactable = this.world.getComponent(campId, ComponentTypes.INTERACTABLE);
      
      if (campPos && interactable) {
        const dx = campPos.x - playerPos.x;
        const dz = campPos.z - playerPos.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist < 10) {
          this.uiManager.showBattlePanel(this.playerId, campId, interactable.metadata.count);
          return;
        }
      }
    }
    
    this.uiManager.showNotification('Yakında düşman yok!');
  }
}