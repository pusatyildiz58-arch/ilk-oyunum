/**
 * Interaction System - Proximity-based interactions
 * Replaces global menu system with location-based interactions
 */

class InteractionSystem {
  constructor() {
    this.playerRadius = 3.0;
    this.activeInteractions = [];
    this.lastCheckPosition = { x: 0, z: 0 };
    this.checkCooldown = 0;
  }
  
  update(playerPosition, entities, deltaTime) {
    // Cooldown to prevent constant checking
    this.checkCooldown -= deltaTime;
    if (this.checkCooldown > 0) return;
    this.checkCooldown = 0.1; // Check every 100ms
    
    // Only update if player moved significantly
    const movedDistance = Math.hypot(
      playerPosition.x - this.lastCheckPosition.x,
      playerPosition.z - this.lastCheckPosition.z
    );
    
    if (movedDistance < 0.5) return; // Only check if moved at least 0.5 units
    
    this.lastCheckPosition = { ...playerPosition };
    
    // Find nearby entities
    this.activeInteractions = entities.filter(entity => {
      if (!entity.isActive) return false;
      
      const distance = Math.hypot(
        entity.position.x - playerPosition.x,
        entity.position.z - playerPosition.z
      );
      
      return entity.canInteract(distance);
    });
  }
  
  getInteractions() {
    return this.activeInteractions.map(entity => {
      const interaction = entity.getComponent('interaction');
      const distance = this.calculateDistance(entity);
      
      return {
        entity: entity,
        actions: interaction?.actions || [],
        type: interaction?.type || 'unknown',
        distance: distance,
        position: { ...entity.position }
      };
    }).sort((a, b) => a.distance - b.distance); // Sort by distance
  }
  
  getClosestInteraction() {
    const interactions = this.getInteractions();
    return interactions.length > 0 ? interactions[0] : null;
  }
  
  executeInteraction(entity, action) {
    const interaction = entity.getComponent('interaction');
    if (!interaction || !interaction.actions.includes(action)) {
      return false;
    }
    
    // Emit interaction event
    this.onInteraction(entity, action);
    return true;
  }
  
  onInteraction(entity, action) {
    console.log(`Interaction: ${action} with ${entity.type} (${entity.id})`);
    
    // Emit custom event for other systems to handle
    const event = new CustomEvent('entityInteraction', {
      detail: { entity, action }
    });
    document.dispatchEvent(event);
  }
  
  calculateDistance(entity) {
    // This would use the actual player position
    // For now, return a placeholder
    return Math.hypot(entity.position.x, entity.position.z);
  }
  
  // UI Helper Methods
  generateInteractionUI(interactions) {
    if (interactions.length === 0) return '';
    
    let html = '<div class="interaction-menu">';
    
    for (const interaction of interactions) {
      html += `
        <div class="interaction-item" data-entity-id="${interaction.entity.id}">
          <div class="interaction-title">${this.getEntityDisplayName(interaction)}</div>
          <div class="interaction-actions">
      `;
      
      for (const action of interaction.actions) {
        html += `
          <button class="interaction-btn" data-action="${action}">
            ${this.getActionDisplayName(action)}
          </button>
        `;
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    html += '</div>';
    return html;
  }
  
  getEntityDisplayName(interaction) {
    const entity = interaction.entity;
    const behavior = entity.getComponent('behavior');
    
    switch (entity.type) {
      case 'npc':
        return behavior?.role || 'NPC';
      case 'farm':
        return 'Farm';
      case 'building':
        return behavior?.buildingType || 'Building';
      case 'worker':
        return behavior?.profession || 'Worker';
      default:
        return entity.type.charAt(0).toUpperCase() + entity.type.slice(1);
    }
  }
  
  getActionDisplayName(action) {
    const actionNames = {
      'talk': '💬 Talk',
      'hire': '👥 Hire',
      'trade': '💰 Trade',
      'work': '🔨 Work',
      'buy': '🛒 Buy',
      'sell': '💵 Sell',
      'expand': '📏 Expand',
      'craft': '⚒️ Craft',
      'repair': '🔧 Repair',
      'enter': '🚪 Enter',
      'attack': '⚔️ Attack',
      'defend': '🛡️ Defend'
    };
    
    return actionNames[action] || action.charAt(0).toUpperCase() + action.slice(1);
  }
}

// Browser-compatible exports
window.InteractionSystem = InteractionSystem;
