// filepath: engine/components/Inventory.js
/**
 * Inventory Component - Item storage for entities
 */

// ============================================================================
// INVENTORY COMPONENT
// ============================================================================

class InventoryComponent {
  constructor(capacity = 20) {
    this.capacity = capacity;
    this.items = new Map(); // itemId -> { item, quantity }
    this.gold = 0;
    this.food = 0;
  }

  // Add item to inventory
  addItem(itemId, quantity = 1) {
    if (this.items.has(itemId)) {
      this.items.get(itemId).quantity += quantity;
    } else if (this.items.size < this.capacity) {
      this.items.set(itemId, { item: itemId, quantity });
    } else {
      return false; // Inventory full
    }
    return true;
  }

  // Remove item from inventory
  removeItem(itemId, quantity = 1) {
    if (!this.items.has(itemId)) return false;
    
    const slot = this.items.get(itemId);
    if (slot.quantity < quantity) return false;
    
    slot.quantity -= quantity;
    if (slot.quantity <= 0) {
      this.items.delete(itemId);
    }
    return true;
  }

  // Get item quantity
  getItemQuantity(itemId) {
    const slot = this.items.get(itemId);
    return slot ? slot.quantity : 0;
  }

  // Check if has item
  hasItem(itemId, quantity = 1) {
    return this.getItemQuantity(itemId) >= quantity;
  }

  // Get all items
  getAllItems() {
    return Array.from(this.items.values());
  }

  // Get total item count
  getItemCount() {
    let count = 0;
    for (const slot of this.items.values()) {
      count += slot.quantity;
    }
    return count;
  }

  // Get free slots
  getFreeSlots() {
    return this.capacity - this.items.size;
  }

  // Add gold
  addGold(amount) {
    this.gold += amount;
    return true;
  }

  // Remove gold
  removeGold(amount) {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  // Add food
  addFood(amount) {
    this.food += amount;
    return true;
  }

  // Remove food
  removeFood(amount) {
    if (this.food < amount) return false;
    this.food -= amount;
    return true;
  }

  // Serialize for saving
  serialize() {
    return {
      capacity: this.capacity,
      items: Array.from(this.items.entries()),
      gold: this.gold,
      food: this.food
    };
  }

  // Deserialize from save
  static deserialize(data) {
    const inv = new InventoryComponent(data.capacity);
    inv.items = new Map(data.items);
    inv.gold = data.gold;
    inv.food = data.food;
    return inv;
  }
}

// Export
export { InventoryComponent };