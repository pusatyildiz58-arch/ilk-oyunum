// filepath: engine/components/Economy.js
/**
 * Economy Component - Resource and trade data for entities
 */

// ============================================================================
// ECONOMY COMPONENT
// ============================================================================

class EconomyComponent {
  constructor() {
    // Resources
    this.resources = {
      gold: 50,
      food: 20,
      wood: 0,
      iron: 0,
      leather: 0,
      meat: 0
    };
    
    // Production rates (per tick)
    this.production = {
      food: 0,
      wood: 0,
      iron: 0,
      leather: 0,
      meat: 0
    };
    
    // Consumption rates (per tick)
    this.consumption = {
      food: 0,
      wood: 0
    };
    
    // Workers assigned to different tasks
    this.workers = {
      farming: 0,
      woodcutting: 0,
      mining: 0,
      hunting: 0,
      trading: 0
    };
    
    // Trade data
    this.tradeHistory = [];
    this.lastTradeTime = 0;
    
    // Economic stats
    this.income = 0;
    this.expenses = 0;
  }

  // Add resource
  addResource(resourceId, amount) {
    if (this.resources[resourceId] !== undefined) {
      this.resources[resourceId] += amount;
      return true;
    }
    return false;
  }

  // Remove resource
  removeResource(resourceId, amount) {
    if (this.resources[resourceId] === undefined) return false;
    if (this.resources[resourceId] < amount) return false;
    
    this.resources[resourceId] -= amount;
    return true;
  }

  // Get resource amount
  getResource(resourceId) {
    return this.resources[resourceId] || 0;
  }

  // Set worker count for a task
  setWorkers(task, count) {
    if (this.workers[task] !== undefined) {
      this.workers[task] = Math.max(0, count);
    }
  }

  // Get worker count for a task
  getWorkers(task) {
    return this.workers[task] || 0;
  }

  // Get total workers
  getTotalWorkers() {
    let total = 0;
    for (const count of Object.values(this.workers)) {
      total += count;
    }
    return total;
  }

  // Process production and consumption
  processTick() {
    // Production
    this.resources.food += this.workers.farming * 2;
    this.resources.wood += this.workers.woodcutting * 1;
    this.resources.iron += this.workers.mining * 0.5;
    this.resources.meat += this.workers.hunting * 1;
    this.resources.leather += this.workers.hunting * 0.3;
    
    // Consumption
    const totalWorkers = this.getTotalWorkers();
    this.resources.food -= totalWorkers * 0.5;
    
    // Calculate income/expenses
    this.income = this.workers.trading * 2;
    this.expenses = totalWorkers * 1;
  }

  // Record trade
  recordTrade(item, quantity, price, isBuy) {
    this.tradeHistory.push({
      item,
      quantity,
      price,
      isBuy,
      time: Date.now()
    });
    
    this.lastTradeTime = Date.now();
    
    // Keep only last 100 trades
    if (this.tradeHistory.length > 100) {
      this.tradeHistory.shift();
    }
  }

  // Get trade history for an item
  getTradeHistory(item, count = 10) {
    return this.tradeHistory
      .filter(t => t.item === item)
      .slice(-count);
  }

  // Get average price for an item
  getAveragePrice(item) {
    const history = this.getTradeHistory(item, 20);
    if (history.length === 0) return null;
    
    const total = history.reduce((sum, t) => sum + t.price, 0);
    return total / history.length;
  }

  // Serialize for saving
  serialize() {
    return {
      resources: { ...this.resources },
      production: { ...this.production },
      consumption: { ...this.consumption },
      workers: { ...this.workers },
      tradeHistory: this.tradeHistory.slice(-50),
      lastTradeTime: this.lastTradeTime,
      income: this.income,
      expenses: this.expenses
    };
  }

  // Deserialize from save
  static deserialize(data) {
    const eco = new EconomyComponent();
    eco.resources = data.resources || eco.resources;
    eco.production = data.production || eco.production;
    eco.consumption = data.consumption || eco.consumption;
    eco.workers = data.workers || eco.workers;
    eco.tradeHistory = data.tradeHistory || [];
    eco.lastTradeTime = data.lastTradeTime || 0;
    eco.income = data.income || 0;
    eco.expenses = data.expenses || 0;
    return eco;
  }
}

// Export
export { EconomyComponent };