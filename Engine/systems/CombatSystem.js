// filepath: engine/systems/CombatSystem.js
/**
 * Combat System - Bannerlord-style unit combat
 * Handles formations, morale, and battle resolution
 */

import { System } from '../ECS.js';

// ============================================================================
// COMBAT SYSTEM
// ============================================================================

class CombatSystem extends System {
  constructor(world, eventBus) {
    super(world, 5); // Priority 5, runs at 60 TPS
    this.eventBus = eventBus;
    
    // Active battles
    this.battles = new Map();
    
    // Formation definitions
    this.formations = {
      line: {
        name: 'Hat',
        defenseBonus: 1.2,
        attackBonus: 1.0,
        speed: 1.0,
        description: 'Savunma odaklı, sıkı düzen'
      },
      charge: {
        name: 'Hücum',
        defenseBonus: 0.8,
        attackBonus: 1.5,
        speed: 1.5,
        description: 'Saldırı odaklı, hızlı koşu'
      },
      defend: {
        name: 'Savunma',
        defenseBonus: 1.5,
        attackBonus: 0.7,
        speed: 0.5,
        description: 'Maksimum savunma, yavaş hareket'
      },
      skirmish: {
        name: 'Akın',
        defenseBonus: 0.9,
        attackBonus: 1.1,
        speed: 1.2,
        description: 'Dağınık düzen, çevik hareket'
      }
    };
  }

  update(deltaTime) {
    // Process all active battles
    for (const [battleId, battle] of this.battles) {
      this.processBattle(battle, deltaTime);
    }
  }

  // Create new battle
  createBattle(attackerId, defenderId) {
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const battle = {
      id: battleId,
      attacker: attackerId,
      defender: defenderId,
      attackerUnits: this.getUnits(attackerId),
      defenderUnits: this.getUnits(defenderId),
      terrain: 'plain',
      state: 'preparing', // preparing, active, resolving
      rounds: 0,
      startTime: Date.now()
    };
    
    this.battles.set(battleId, battle);
    
    this.eventBus.emit('battle:start', {
      battleId,
      attacker: attackerId,
      defender: defenderId
    });
    
    return battleId;
  }

  // Get units for an army
  getUnits(armyId) {
    const units = [];
    const combatEntities = this.world.getEntitiesWithComponent('combat');
    
    for (const entityId of combatEntities) {
      const combat = this.world.getComponent(entityId, 'combat');
      const position = this.world.getComponent(entityId, 'position');
      
      if (combat && position) {
        units.push({
          entityId,
          combat,
          position,
          formationOffset: { x: 0, z: 0 }
        });
      }
    }
    
    return units;
  }

  // Process battle round
  processBattle(battle, deltaTime) {
    if (battle.state !== 'active') return;
    
    battle.rounds++;
    
    // Process each unit's attack
    for (const attacker of battle.attackerUnits) {
      if (!attacker.combat.isAlive() || attacker.combat.isRouting()) continue;
      
      // Find target
      const target = this.findNearestEnemy(attacker, battle.defenderUnits);
      if (!target) continue;
      
      // Check range and attack
      const dist = this.getDistance(attacker.position, target.position);
      if (dist <= attacker.combat.range) {
        this.processUnitAttack(attacker, target, battle);
      } else {
        // Move towards enemy
        this.moveUnitTowards(attacker, target, deltaTime);
      }
    }
    
    // Process defender attacks
    for (const defender of battle.defenderUnits) {
      if (!defender.combat.isAlive() || defender.combat.isRouting()) continue;
      
      const target = this.findNearestEnemy(defender, battle.attackerUnits);
      if (!target) continue;
      
      const dist = this.getDistance(defender.position, target.position);
      if (dist <= defender.combat.range) {
        this.processUnitAttack(defender, target, battle);
      } else {
        this.moveUnitTowards(defender, target, deltaTime);
      }
    }
    
    // Check for battle end
    this.checkBattleEnd(battle);
  }

  // Process unit attack
  processUnitAttack(attacker, target, battle) {
    if (!attacker.combat.canAttack()) return;
    
    // Get formation bonus
    const formationBonus = attacker.combat.getFormationBonus();
    
    // Calculate damage
    let damage = attacker.combat.damage * formationBonus.attackBonus;
    
    // Apply target defense
    damage = damage * (1 - target.combat.defense / 100);
    
    // Apply damage
    const result = target.combat.takeDamage(damage);
    
    // Update morale
    if (result.dodged) {
      target.combat.updateMorale(5);
    } else if (result.damage > 0) {
      target.combat.updateMorale(-result.damage * 0.5);
    }
    
    // Record attack
    attacker.combat.attack(target.entityId);
    
    this.eventBus.emit('unit:damaged', {
      attacker: attacker.entityId,
      target: target.entityId,
      damage: result.damage,
      killed: result.killed
    });
  }

  // Find nearest enemy
  findNearestEnemy(unit, enemies) {
    let nearest = null;
    let nearestDist = Infinity;
    
    for (const enemy of enemies) {
      if (!enemy.combat.isAlive() || enemy.combat.isRouting()) continue;
      
      const dist = this.getDistance(unit.position, enemy.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }
    
    return nearest;
  }

  // Get distance between positions
  getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // Move unit towards target
  moveUnitTowards(unit, target, deltaTime) {
    const dx = target.position.x - unit.position.x;
    const dz = target.position.z - unit.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0.1) {
      const speed = unit.combat.attackSpeed * deltaTime;
      unit.position.x += (dx / dist) * speed;
      unit.position.z += (dz / dist) * speed;
    }
  }

  // Check for battle end
  checkBattleEnd(battle) {
    const attackerAlive = battle.attackerUnits.filter(u => u.combat.isAlive() && !u.combat.isRouting()).length;
    const defenderAlive = battle.defenderUnits.filter(u => u.combat.isAlive() && !u.combat.isRouting()).length;
    
    if (attackerAlive === 0 || defenderAlive === 0 || battle.rounds > 100) {
      battle.state = 'resolving';
      
      const result = {
        winner: attackerAlive > defenderAlive ? battle.attacker : battle.defender,
        attackerRemaining: attackerAlive,
        defenderRemaining: defenderAlive,
        rounds: battle.rounds
      };
      
      this.eventBus.emit('battle:end', result);
      
      // Clean up after delay
      setTimeout(() => {
        this.battles.delete(battle.id);
      }, 5000);
    }
  }

  // Set formation for army
  setFormation(armyId, formationType) {
    const units = this.getUnits(armyId);
    
    for (const unit of units) {
      unit.combat.setFormation(formationType);
    }
    
    this.eventBus.emit('formation:change', {
      army: armyId,
      formation: formationType
    });
  }

  // Auto-resolve battle (for AI vs AI)
  autoResolve(attackerId, defenderId) {
    const attackerUnits = this.getUnits(attackerId);
    const defenderUnits = this.getUnits(defenderId);
    
    let attackerPower = 0;
    let defenderPower = 0;
    
    for (const unit of attackerUnits) {
      if (unit.combat.isAlive()) {
        attackerPower += unit.combat.damage * (unit.combat.health / unit.combat.maxHealth);
      }
    }
    
    for (const unit of defenderUnits) {
      if (unit.combat.isAlive()) {
        defenderPower += unit.combat.damage * (unit.combat.health / unit.combat.maxHealth);
      }
    }
    
    // Add randomness
    attackerPower *= 0.8 + Math.random() * 0.4;
    defenderPower *= 0.8 + Math.random() * 0.4;
    
    return {
      winner: attackerPower > defenderPower ? attackerId : defenderId,
      attackerPower,
      defenderPower
    };
  }

  // Get battle info
  getBattleInfo(battleId) {
    const battle = this.battles.get(battleId);
    if (!battle) return null;
    
    return {
      id: battle.id,
      state: battle.state,
      rounds: battle.rounds,
      attackerUnits: battle.attackerUnits.filter(u => u.combat.isAlive()).length,
      defenderUnits: battle.defenderUnits.filter(u => u.combat.isAlive()).length
    };
  }
}

// Export
export { CombatSystem };