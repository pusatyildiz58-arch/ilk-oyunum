// Engine/Systems/TravelSystem.js - Travel State Machine & Management

import { System } from '../Core/ECS.js';
import { TravelState, RiskProfile } from '../World/DataModels.js';
import { GameEvents } from '../Core/EventBus.js';
import { ComponentTypes } from '../Components.js';

export class TravelSystem extends System {
  constructor(world, eventBus, worldGraph, weatherSystem, timeSystem) {
    super(world, 30); // Priority 30
    this.eventBus = eventBus;
    this.worldGraph = worldGraph;
    this.weatherSystem = weatherSystem;
    this.timeSystem = timeSystem;
    
    // Active travels
    this.activeTravels = new Map(); // entityId -> TravelState
    
    // Config
    this.baseSpeed = 5; // km/h walking
    this.fatigueThreshold = 80; // Force rest at 80% fatigue
    this.foodPerHour = 0.5;
    this.encounterCheckInterval = 0.5; // hours
    
    // State machine states
    this.STATES = {
      IDLE: 'idle',
      WALKING: 'walking',
      ACCELERATED: 'accelerated',
      CAMPING: 'camping',
      INTERRUPTED: 'interrupted',
      COMPLETED: 'completed',
    };
  }

  update(deltaTime) {
    // Update all active travels
    for (const [entityId, travelState] of this.activeTravels) {
      if (!travelState.active) continue;
      
      this.updateTravel(entityId, travelState, deltaTime);
    }
  }

  // ============================================================================
  // TRAVEL LIFECYCLE
  // ============================================================================

  /**
   * Start a new travel
   */
  startTravel(entityId, route, edges, mode = 'walking') {
    if (!route || route.length < 2) {
      console.error('Invalid route for travel');
      return null;
    }

    const travelState = new TravelState(entityId);
    travelState.active = true;
    travelState.route = route;
    travelState.edges = edges;
    travelState.mode = mode;
    travelState.startTime = this.timeSystem.gameTime;
    
    // Calculate initial speed
    this.updateTravelSpeed(travelState);
    
    // Calculate estimated arrival
    let totalTime = 0;
    for (const edgeId of edges) {
      const edge = this.worldGraph.getEdge(edgeId);
      if (edge) {
        totalTime += edge.getTravelTime(travelState.currentSpeed, 1.0, 1.0);
      }
    }
    travelState.estimatedArrival = travelState.startTime + totalTime;
    
    // Add log entry
    const startNode = this.worldGraph.getNode(route[0]);
    const endNode = this.worldGraph.getNode(route[route.length - 1]);
    travelState.addLogEntry(
      `Yolculuk başladı: ${startNode?.settlementId || 'Konum'} → ${endNode?.settlementId || 'Hedef'}`,
      'info'
    );
    
    // Store and emit
    this.activeTravels.set(entityId, travelState);
    
    this.eventBus.emit('travel:started', {
      entity: entityId,
      mode,
      route,
      estimatedTime: totalTime,
    });
    
    return travelState;
  }

  /**
   * Update a single travel
   */
  updateTravel(entityId, travelState, deltaTime) {
    // State machine
    switch (travelState.mode) {
      case this.STATES.WALKING:
        this.updateWalkingTravel(entityId, travelState, deltaTime);
        break;
      
      case this.STATES.ACCELERATED:
        this.updateAcceleratedTravel(entityId, travelState, deltaTime);
        break;
      
      case this.STATES.CAMPING:
        this.updateCamping(entityId, travelState, deltaTime);
        break;
      
      case this.STATES.INTERRUPTED:
        // Wait for player action
        break;
      
      case this.STATES.COMPLETED:
        this.completeTravel(entityId, travelState);
        break;
    }
  }

  /**
   * Walking mode - player physically walks
   */
  updateWalkingTravel(entityId, travelState, deltaTime) {
    const pos = this.world.getComponent(entityId, ComponentTypes.POSITION);
    const mov = this.world.getComponent(entityId, ComponentTypes.MOVEMENT);
    
    if (!pos || !mov) return;
    
    // Get current edge
    const currentEdge = this.worldGraph.getEdge(travelState.getCurrentEdge());
    if (!currentEdge) {
      this.abortTravel(entityId, 'Edge not found');
      return;
    }
    
    // Get start and end nodes
    const currentNode = this.worldGraph.getNode(travelState.getCurrentNode());
    const nextNode = this.worldGraph.getNode(travelState.route[travelState.currentNodeIndex + 1]);
    
    if (!currentNode || !nextNode) {
      this.abortTravel(entityId, 'Invalid nodes');
      return;
    }
    
    // Calculate target position along edge
    const startPos = currentNode.position;
    const endPos = nextNode.position;
    
    const targetX = startPos.x + (endPos.x - startPos.x) * travelState.progressAlongEdge;
    const targetZ = startPos.z + (endPos.z - startPos.z) * travelState.progressAlongEdge;
    
    // Move towards target
    const dx = targetX - pos.x;
    const dz = targetZ - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0.5) {
      // Still moving
      const moveSpeed = travelState.currentSpeed * (1000 / 3600); // km/h to m/s
      mov.velocity.x = (dx / dist) * moveSpeed;
      mov.velocity.z = (dz / dist) * moveSpeed;
      mov.moving = true;
    } else {
      // Reached waypoint, advance edge progress
      travelState.progressAlongEdge += deltaTime * travelState.currentSpeed / currentEdge.distance;
      
      if (travelState.progressAlongEdge >= 1.0) {
        // Reached next node
        this.advanceToNextNode(entityId, travelState);
      }
    }
    
    // Update travel state
    this.updateTravelState(entityId, travelState, deltaTime);
  }

  /**
   * Accelerated mode - time fast forwards
   */
  updateAcceleratedTravel(entityId, travelState, deltaTime) {
    const scaledDelta = deltaTime * 10; // 10x time scale during travel
    
    // Get current edge
    const currentEdge = this.worldGraph.getEdge(travelState.getCurrentEdge());
    if (!currentEdge) {
      this.abortTravel(entityId, 'Edge not found');
      return;
    }
    
    // Progress along edge
    const edgeTime = currentEdge.getTravelTime(
      travelState.currentSpeed,
      this.getWeatherModifier(),
      this.getTerrainModifier(currentEdge)
    );
    
    const progressDelta = scaledDelta / edgeTime;
    travelState.progressAlongEdge += progressDelta;
    
    if (travelState.progressAlongEdge >= 1.0) {
      this.advanceToNextNode(entityId, travelState);
    }
    
    // Update travel state
    this.updateTravelState(entityId, travelState, scaledDelta);
    
    // Update player position visually
    this.updatePositionAlongRoute(entityId, travelState);
  }

  /**
   * Camping mode - rest and recover
   */
  updateCamping(entityId, travelState, deltaTime) {
    const inventory = this.world.getComponent(entityId, ComponentTypes.INVENTORY);
    if (!inventory) return;
    
    // Recover fatigue
    travelState.fatigueGained = Math.max(0, travelState.fatigueGained - deltaTime * 20);
    
    // Consume food
    if (inventory.items.food > 0) {
      inventory.items.food -= deltaTime * 0.1;
      
      if (inventory.items.food <= 0) {
        inventory.items.food = 0;
        travelState.addLogEntry('Yiyecek bitti! Kamp tehlikeli hale geldi.', 'danger');
      }
    }
    
    // Camp duration
    travelState.pausedTime += deltaTime;
    
    // If fatigue recovered, can continue
    if (travelState.fatigueGained < 20) {
      travelState.canContinue = true;
      this.eventBus.emit('travel:camp_ready', { entity: entityId });
    }
  }

  /**
   * Update common travel state
   */
  updateTravelState(entityId, travelState, deltaTime) {
    travelState.elapsedTime += deltaTime;
    
    // Update speed modifiers
    this.updateTravelSpeed(travelState);
    
    // Gain fatigue
    const currentEdge = this.worldGraph.getEdge(travelState.getCurrentEdge());
    const terrain = currentEdge ? this.getTerrainModifier(currentEdge) : 1.0;
    travelState.fatigueGained += deltaTime * terrain * 5;
    
    // Consume food
    const inventory = this.world.getComponent(entityId, ComponentTypes.INVENTORY);
    if (inventory && inventory.items.food > 0) {
      const foodCost = deltaTime * this.foodPerHour;
      inventory.items.food = Math.max(0, inventory.items.food - foodCost);
      travelState.foodConsumed += foodCost;
      
      if (inventory.items.food <= 0) {
        this.interruptTravel(entityId, travelState, 'Yiyecek bitti!', 'food_shortage');
      }
    }
    
    // Check fatigue threshold
    if (travelState.fatigueGained >= this.fatigueThreshold) {
      this.interruptTravel(entityId, travelState, 'Çok yoruldun. Dinlenme gerekiyor.', 'fatigue');
    }
    
    // Check for encounters
    travelState.nextEncounterCheck -= deltaTime;
    if (travelState.nextEncounterCheck <= 0) {
      this.checkForEncounter(entityId, travelState);
      travelState.nextEncounterCheck = this.encounterCheckInterval;
    }
    
    // Update distance
    const speed = travelState.currentSpeed * (1000 / 3600); // to m/s
    travelState.distanceTraveled += speed * deltaTime;
    
    // Update risk
    this.updateTravelRisk(travelState);
  }

  /**
   * Advance to next node in route
   */
  advanceToNextNode(entityId, travelState) {
    travelState.currentNodeIndex++;
    travelState.currentEdgeIndex++;
    travelState.progressAlongEdge = 0;
    
    if (travelState.currentNodeIndex >= travelState.route.length - 1) {
      // Reached destination
      travelState.mode = this.STATES.COMPLETED;
      return;
    }
    
    const node = this.worldGraph.getNode(travelState.route[travelState.currentNodeIndex]);
    if (node) {
      travelState.addLogEntry(`${node.settlementId || 'Noktaya'} ulaşıldı`, 'info');
      
      // Mark as discovered
      if (!node.discoveredBy.has(entityId)) {
        node.discoveredBy.add(entityId);
        this.eventBus.emit('discovery:node', { entity: entityId, node: node.id });
      }
    }
  }

  /**
   * Update position along route (for accelerated travel)
   */
  updatePositionAlongRoute(entityId, travelState) {
    const pos = this.world.getComponent(entityId, ComponentTypes.POSITION);
    if (!pos) return;
    
    const currentNode = this.worldGraph.getNode(travelState.getCurrentNode());
    const nextNode = this.worldGraph.getNode(travelState.route[travelState.currentNodeIndex + 1]);
    
    if (currentNode && nextNode) {
      const t = travelState.progressAlongEdge;
      pos.x = currentNode.position.x + (nextNode.position.x - currentNode.position.x) * t;
      pos.z = currentNode.position.z + (nextNode.position.z - currentNode.position.z) * t;
    }
  }

  /**
   * Update travel speed based on conditions
   */
  updateTravelSpeed(travelState) {
    const weatherMod = this.getWeatherModifier();
    const timeMod = this.getTimeModifier();
    
    const currentEdge = this.worldGraph.getEdge(travelState.getCurrentEdge());
    const terrainMod = currentEdge ? this.getTerrainModifier(currentEdge) : 1.0;
    
    const fatigueMod = Math.max(0.5, 1 - (travelState.fatigueGained / 100) * 0.5);
    
    travelState.speedModifiers = {
      weather: weatherMod,
      time: timeMod,
      terrain: terrainMod,
      fatigue: fatigueMod,
    };
    
    travelState.currentSpeed = travelState.baseSpeed * weatherMod * timeMod * terrainMod * fatigueMod;
  }

  /**
   * Update travel risk
   */
  updateTravelRisk(travelState) {
    const riskProfile = new RiskProfile();
    
    const currentEdge = this.worldGraph.getEdge(travelState.getCurrentEdge());
    if (currentEdge) {
      riskProfile.routeRisk = 100 - currentEdge.getCurrentSafety(
        this.timeSystem.timeOfDay,
        this.weatherSystem.current
      );
    }
    
    riskProfile.weatherRisk = this.weatherSystem.riskModifier * 20;
    riskProfile.timeRisk = this.timeSystem.timeOfDay < 0.25 || this.timeSystem.timeOfDay > 0.75 ? 30 : 0;
    
    travelState.currentRisk = riskProfile.calculate();
  }

  // ============================================================================
  // INTERRUPTIONS & STATE CHANGES
  // ============================================================================

  /**
   * Interrupt travel
   */
  interruptTravel(entityId, travelState, reason, type) {
    travelState.mode = this.STATES.INTERRUPTED;
    travelState.canContinue = false;
    travelState.pauseReason = type;
    
    travelState.addLogEntry(reason, 'danger');
    
    this.eventBus.emit('travel:interrupted', {
      entity: entityId,
      reason,
      type,
    });
  }

  /**
   * Resume travel
   */
  resumeTravel(entityId) {
    const travelState = this.activeTravels.get(entityId);
    if (!travelState || !travelState.canContinue) return false;
    
    travelState.mode = this.STATES.WALKING;
    travelState.pauseReason = null;
    
    this.eventBus.emit('travel:resumed', { entity: entityId });
    return true;
  }

  /**
   * Start camping
   */
  startCamping(entityId) {
    const travelState = this.activeTravels.get(entityId);
    if (!travelState) return false;
    
    travelState.mode = this.STATES.CAMPING;
    travelState.pausedTime = 0;
    travelState.addLogEntry('Kamp kuruldu. Dinlenme başladı.', 'info');
    
    this.eventBus.emit('travel:camping', { entity: entityId });
    return true;
  }

  /**
   * Complete travel
   */
  completeTravel(entityId, travelState) {
    const destination = this.worldGraph.getNode(travelState.route[travelState.route.length - 1]);
    
    travelState.active = false;
    travelState.addLogEntry('Hedefe varıldı!', 'arrival');
    
    this.eventBus.emit('travel:completed', {
      entity: entityId,
      destination: destination?.id,
      timeElapsed: travelState.elapsedTime,
      distanceTraveled: travelState.distanceTraveled,
    });
    
    this.activeTravels.delete(entityId);
  }

  /**
   * Abort travel
   */
  abortTravel(entityId, reason) {
    const travelState = this.activeTravels.get(entityId);
    if (!travelState) return;
    
    travelState.active = false;
    travelState.addLogEntry(`Yolculuk iptal edildi: ${reason}`, 'danger');
    
    this.eventBus.emit('travel:aborted', { entity: entityId, reason });
    
    this.activeTravels.delete(entityId);
  }

  // ============================================================================
  // ENCOUNTERS
  // ============================================================================

  /**
   * Check for random encounter
   */
  checkForEncounter(entityId, travelState) {
    const currentEdge = this.worldGraph.getEdge(travelState.getCurrentEdge());
    if (!currentEdge) return;
    
    const encounterChance = (travelState.currentRisk / 100) * 0.1; // Max 10% per check
    
    if (Math.random() < encounterChance) {
      this.triggerEncounter(entityId, travelState, currentEdge);
    }
  }

  /**
   * Trigger an encounter
   */
  triggerEncounter(entityId, travelState, edge) {
    const encounterTypes = ['bandit', 'traveler', 'wildlife', 'merchant'];
    const type = encounterTypes[Math.floor(Math.random() * encounterTypes.length)];
    
    this.interruptTravel(entityId, travelState, `Karşılaşma: ${type}!`, 'encounter');
    
    this.eventBus.emit('encounter:triggered', {
      entity: entityId,
      type,
      edge: edge.id,
      risk: travelState.currentRisk,
    });
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  getWeatherModifier() {
    return this.weatherSystem?.speedModifier || 1.0;
  }

  getTimeModifier() {
    const tod = this.timeSystem.timeOfDay;
    return (tod > 0.25 && tod < 0.75) ? 1.0 : 0.8; // Night = slower
  }

  getTerrainModifier(edge) {
    return edge.terrainDifficulty || 1.0;
  }

  getTravelState(entityId) {
    return this.activeTravels.get(entityId);
  }
}