// filepath: engine/components/CombatStats.js
/**
 * CombatStats Component - Combat-related data for entities
 */

// ============================================================================
// COMBAT STATS COMPONENT
// ============================================================================

class CombatStatsComponent {
  constructor() {
    // Combat stats
    this.health = 100;
    this.maxHealth = 100;
    this.armor = 0;
    
    // Attack stats
    this.damage = 10;
    this.attackSpeed = 1.0;
    this.range = 1.5;
    
    // Defense
    this.defense = 5;
    this.dodge = 0.1;
    
    // Combat state
    this.inCombat = false;
    this.combatTarget = null;
    this.lastAttackTime = 0;
    
    // Formation
    this.formation = 'line'; // line, charge, defend, skirmish
    this.formationPosition = { x: 0, z: 0 };
    
    // Morale
    this.morale = 100;
    this.maxMorale = 100;
    
    // Unit type
    this.unitType = 'infantry'; // infantry, cavalry, archer
  }

  // Take damage
  takeDamage(amount) {
    // Apply armor reduction
    const damageAfterArmor = Math.max(1, amount - this.armor);
    
    // Check dodge
    if (Math.random() < this.dodge) {
      return { damage: 0, blocked: true, dodged: true };
    }
    
    this.health = Math.max(0, this.health - damageAfterArmor);
    
    return {
      damage: damageAfterArmor,
      blocked: false,
      dodged: false,
      killed: this.health <= 0
    };
  }

  // Heal
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  // Add armor
  addArmor(amount) {
    this.armor += amount;
  }

  // Set formation
  setFormation(formation) {
    const validFormations = ['line', 'charge', 'defend', 'skirmish'];
    if (validFormations.includes(formation)) {
      this.formation = formation;
    }
  }

  // Get formation bonus
  getFormationBonus() {
    switch (this.formation) {
      case 'line':
        return { defense: 1.2, attack: 1.0 };
      case 'charge':
        return { defense: 0.8, attack: 1.5 };
      case 'defend':
        return { defense: 1.5, attack: 0.7 };
      case 'skirmish':
        return { defense: 0.9, attack: 1.1 };
      default:
        return { defense: 1.0, attack: 1.0 };
    }
  }

  // Can attack (cooldown check)
  canAttack() {
    const now = Date.now();
    const attackCooldown = 1000 / this.attackSpeed;
    return now - this.lastAttackTime >= attackCooldown;
  }

  // Perform attack
  attack(target) {
    if (!this.canAttack()) return null;
    
    this.lastAttackTime = Date.now();
    this.inCombat = true;
    this.combatTarget = target;
    
    return {
      damage: this.damage,
      target: target
    };
  }

  // Leave combat
  leaveCombat() {
    this.inCombat = false;
    this.combatTarget = null;
  }

  // Update morale
  updateMorale(amount) {
    this.morale = Math.max(0, Math.min(this.maxMorale, this.morale + amount));
  }

  // Check if unit is alive
  isAlive() {
    return this.health > 0;
  }

  // Check if unit is routing
  isRouting() {
    return this.morale < 30;
  }

  // Serialize for saving
  serialize() {
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      armor: this.armor,
      damage: this.damage,
      attackSpeed: this.attackSpeed,
      range: this.range,
      defense: this.defense,
      dodge: this.dodge,
      inCombat: this.inCombat,
      combatTarget: this.combatTarget,
      formation: this.formation,
      formationPosition: { ...this.formationPosition },
      morale: this.morale,
      maxMorale: this.maxMorale,
      unitType: this.unitType
    };
  }

  // Deserialize from save
  static deserialize(data) {
    const stats = new CombatStatsComponent();
    stats.health = data.health || 100;
    stats.maxHealth = data.maxHealth || 100;
    stats.armor = data.armor || 0;
    stats.damage = data.damage || 10;
    stats.attackSpeed = data.attackSpeed || 1.0;
    stats.range = data.range || 1.5;
    stats.defense = data.defense || 5;
    stats.dodge = data.dodge || 0.1;
    stats.inCombat = data.inCombat || false;
    stats.combatTarget = data.combatTarget;
    stats.formation = data.formation || 'line';
    stats.formationPosition = data.formationPosition || { x: 0, z: 0 };
    stats.morale = data.morale || 100;
    stats.maxMorale = data.maxMorale || 100;
    stats.unitType = data.unitType || 'infantry';
    return stats;
  }
}

// Export
export { CombatStatsComponent };