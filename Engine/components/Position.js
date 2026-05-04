// filepath: engine/components/Position.js
/**
 * Position Component - Spatial data for entities
 */

// ============================================================================
// POSITION COMPONENT
// ============================================================================

class PositionComponent {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.rotation = 0; // Y-axis rotation in radians
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
  }

  // Get position as vector
  getPosition() {
    return { x: this.x, y: this.y, z: this.z };
  }

  // Set position
  setPosition(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  // Get distance to another position
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    const dz = this.z - other.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  // Get 2D distance (ignoring Y)
  distanceTo2D(other) {
    const dx = this.x - other.x;
    const dz = this.z - other.z;
    return Math.sqrt(dx * dx + dz * dz);
  }

  // Move towards target
  moveTowards(target, speed) {
    const dx = target.x - this.x;
    const dz = target.z - this.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    
    if (dist > 0.01) {
      this.velocityX = (dx / dist) * speed;
      this.velocityZ = (dz / dist) * speed;
      this.rotation = Math.atan2(dx, dz);
    } else {
      this.velocityX = 0;
      this.velocityZ = 0;
    }
  }

  // Apply velocity
  applyVelocity(deltaTime) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.z += this.velocityZ * deltaTime;
  }

  // Stop movement
  stop() {
    this.velocityX = 0;
    this.velocityY = 0;
    this.velocityZ = 0;
  }

  // Serialize for saving
  serialize() {
    return {
      x: this.x,
      y: this.y,
      z: this.z,
      rotation: this.rotation,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      velocityZ: this.velocityZ
    };
  }

  // Deserialize from save
  static deserialize(data) {
    const pos = new PositionComponent(data.x, data.y, data.z);
    pos.rotation = data.rotation || 0;
    pos.velocityX = data.velocityX || 0;
    pos.velocityY = data.velocityY || 0;
    pos.velocityZ = data.velocityZ || 0;
    return pos;
  }
}

// Export
export { PositionComponent };