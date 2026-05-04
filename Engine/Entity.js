/**
 * Entity System - Core Entity Class
 * Everything in the game world is an entity
 */

class Entity {
  constructor(id, type, position = { x: 0, y: 0, z: 0 }) {
    this.id = id;
    this.type = type; // 'player', 'npc', 'farm', 'building', 'worker', 'item'
    this.position = { ...position };
    this.rotation = 0;
    this.components = new Map();
    this.behaviors = [];
    this.interactionRadius = 2.0;
    this.isActive = true;
    this.mesh = null;
  }
  
  // Component System
  addComponent(name, component) {
    this.components.set(name, component);
    return this;
  }
  
  getComponent(name) {
    return this.components.get(name);
  }
  
  hasComponent(name) {
    return this.components.has(name);
  }
  
  removeComponent(name) {
    return this.components.delete(name);
  }
  
  // Position & Movement
  setPosition(x, y, z) {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
    if (this.mesh) {
      this.mesh.position.set(x, y, z);
    }
  }
  
  setRotation(rotation) {
    this.rotation = rotation;
    if (this.mesh) {
      this.mesh.rotation.y = rotation;
    }
  }
  
  // Behavior System
  addBehavior(behavior) {
    this.behaviors.push(behavior);
    return this;
  }
  
  updateBehaviors(deltaTime) {
    for (const behavior of this.behaviors) {
      if (behavior.update) {
        behavior.update(this, deltaTime);
      }
    }
  }
  
  // Interaction System
  getInteractionActions() {
    const interaction = this.getComponent('interaction');
    return interaction?.actions || [];
  }
  
  canInteract(distance) {
    return distance <= (this.interactionRadius + 3.0); // 3.0 = player interaction radius
  }
  
  // Utility
  destroy() {
    this.isActive = false;
    if (this.mesh) {
      this.mesh.parent?.remove(this.mesh);
    }
  }
}

// Component Factory
class ComponentFactory {
  static createPosition(x, y, z) {
    return { x, y, z };
  }
  
  static createInteraction(radius, type, actions) {
    return {
      radius,
      type,
      actions: actions || []
    };
  }
  
  static createEconomy(production = {}, storage = {}, costs = {}) {
    return {
      production: { ...production },
      storage: { ...storage },
      costs: { ...costs },
      balance: 0
    };
  }
  
  static createVisual(mesh, animations = []) {
    return {
      mesh,
      animations,
      currentAnimation: 'idle'
    };
  }
  
  static createBehavior(role, schedule = {}) {
    return {
      role,
      schedule: { ...schedule },
      currentTask: 'idle',
      workProgress: 0
    };
  }
}

// Browser-compatible exports
window.Entity = Entity;
window.ComponentFactory = ComponentFactory;
