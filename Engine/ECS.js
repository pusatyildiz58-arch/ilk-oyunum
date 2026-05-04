// Engine/Core/ECS.js - Entity Component System

/**
 * Entity Manager - Tüm entity'leri yönetir
 */
export class EntityManager {
  constructor() {
    this.entities = new Map();
    this.components = new Map();
    this.nextEntityId = 1;
    this.entityTypes = new Map(); // entityId -> type
  }

  createEntity(type = 'generic') {
    const id = this.nextEntityId++;
    this.entities.set(id, { id, type, active: true });
    this.components.set(id, new Map());
    this.entityTypes.set(id, type);
    return id;
  }

  destroyEntity(entityId) {
    this.entities.delete(entityId);
    this.components.delete(entityId);
    this.entityTypes.delete(entityId);
  }

  hasEntity(entityId) {
    return this.entities.has(entityId);
  }

  getEntity(entityId) {
    return this.entities.get(entityId);
  }

  getEntityType(entityId) {
    return this.entityTypes.get(entityId);
  }

  getAllEntities() {
    return Array.from(this.entities.keys());
  }

  getEntitiesByType(type) {
    const result = [];
    for (const [id, entityType] of this.entityTypes.entries()) {
      if (entityType === type) {
        result.push(id);
      }
    }
    return result;
  }

  // Component operations
  addComponent(entityId, componentName, componentData) {
    if (!this.entities.has(entityId)) {
      console.error(`Entity ${entityId} does not exist`);
      return false;
    }
    
    const entityComponents = this.components.get(entityId);
    entityComponents.set(componentName, componentData);
    return true;
  }

  removeComponent(entityId, componentName) {
    if (!this.entities.has(entityId)) return false;
    
    const entityComponents = this.components.get(entityId);
    return entityComponents.delete(componentName);
  }

  getComponent(entityId, componentName) {
    const entityComponents = this.components.get(entityId);
    if (!entityComponents) return null;
    return entityComponents.get(componentName);
  }

  hasComponent(entityId, componentName) {
    const entityComponents = this.components.get(entityId);
    if (!entityComponents) return false;
    return entityComponents.has(componentName);
  }

  // Query entities by component
  getEntitiesWithComponent(componentName) {
    const result = [];
    for (const [entityId, entityComponents] of this.components) {
      if (entityComponents.has(componentName)) {
        result.push(entityId);
      }
    }
    return result;
  }

  // Query entities by multiple components
  getEntitiesWithComponents(componentNames) {
    const result = [];
    for (const [entityId, entityComponents] of this.components) {
      const hasAll = componentNames.every(name => entityComponents.has(name));
      if (hasAll) {
        result.push(entityId);
      }
    }
    return result;
  }

  // Get all components of an entity
  getAllComponents(entityId) {
    return this.components.get(entityId);
  }
}

/**
 * System Base Class - Tüm sistemler bundan türer
 */
export class System {
  constructor(world, priority = 0) {
    this.world = world;
    this.priority = priority;
    this.active = true;
    this.accumulator = 0;
    this.tickRate = 60; // Default 60 TPS
  }

  update(deltaTime) {
    // Override in subclasses
  }

  fixedUpdate(deltaTime) {
    // Override for fixed timestep updates
  }

  onEntityAdded(entityId) {
    // Override in subclasses
  }

  onEntityRemoved(entityId) {
    // Override in subclasses
  }

  enable() {
    this.active = true;
  }

  disable() {
    this.active = false;
  }

  shouldTick(deltaTime) {
    this.accumulator += deltaTime;
    const tickInterval = 1 / this.tickRate;
    
    if (this.accumulator >= tickInterval) {
      this.accumulator -= tickInterval;
      return true;
    }
    return false;
  }
}

/**
 * System Manager - Tüm sistemleri yönetir
 */
export class SystemManager {
  constructor(world) {
    this.world = world;
    this.systems = [];
  }

  addSystem(system) {
    this.systems.push(system);
    this.systems.sort((a, b) => a.priority - b.priority);
  }

  removeSystem(systemClass) {
    const index = this.systems.findIndex(s => s instanceof systemClass);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
  }

  getSystem(systemClass) {
    return this.systems.find(s => s instanceof systemClass);
  }

  update(deltaTime) {
    for (const system of this.systems) {
      if (system.active) {
        system.update(deltaTime);
      }
    }
  }

  onEntityAdded(entityId) {
    for (const system of this.systems) {
      system.onEntityAdded(entityId);
    }
  }

  onEntityRemoved(entityId) {
    for (const system of this.systems) {
      system.onEntityRemoved(entityId);
    }
  }
}

/**
 * World - Ana ECS Container
 */
export class World {
  constructor() {
    this.entityManager = new EntityManager();
    this.systemManager = new SystemManager(this);
    this.eventBus = null; // Will be set later
  }

  // Entity operations
  createEntity(type) {
    const entityId = this.entityManager.createEntity(type);
    this.systemManager.onEntityAdded(entityId);
    return entityId;
  }

  destroyEntity(entityId) {
    this.systemManager.onEntityRemoved(entityId);
    this.entityManager.destroyEntity(entityId);
  }

  // Component operations
  addComponent(entityId, componentName, componentData) {
    return this.entityManager.addComponent(entityId, componentName, componentData);
  }

  removeComponent(entityId, componentName) {
    return this.entityManager.removeComponent(entityId, componentName);
  }

  getComponent(entityId, componentName) {
    return this.entityManager.getComponent(entityId, componentName);
  }

  hasComponent(entityId, componentName) {
    return this.entityManager.hasComponent(entityId, componentName);
  }

  getAllComponents(entityId) {
    return this.entityManager.getAllComponents(entityId);
  }

  // Query operations
  getEntitiesWithComponent(componentName) {
    return this.entityManager.getEntitiesWithComponent(componentName);
  }

  getEntitiesWithComponents(componentNames) {
    return this.entityManager.getEntitiesWithComponents(componentNames);
  }

  getEntitiesByType(type) {
    return this.entityManager.getEntitiesByType(type);
  }

  getEntityType(entityId) {
    return this.entityManager.getEntityType(entityId);
  }

  // System operations
  addSystem(system) {
    this.systemManager.addSystem(system);
  }

  getSystem(systemClass) {
    return this.systemManager.getSystem(systemClass);
  }

  // Update
  update(deltaTime) {
    this.systemManager.update(deltaTime);
  }
}