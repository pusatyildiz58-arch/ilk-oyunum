
// filepath: Engine/systems/EconomySystem.js
/**
 * Economy System - Village economy and trade simulation
 * Handles supply/demand, pricing, housing economy, and production
 */

import { System } from '../ECS.js';
import { getHousingLevel } from '../data/housingLevels.js';

function round2(value) {
  return Math.round(value * 100) / 100;
}

function normalizeFamily(family) {
  if (typeof family === 'number') {
    return {
      members: family,
      activityMultiplier: 1,
    };
  }

  return {
    members: family?.members ?? family?.people ?? 0,
    activityMultiplier: family?.activityMultiplier ?? 1,
  };
}

class EconomySystem extends System {
  constructor(world, eventBus) {
    super(world, 20); // Priority 20
    this.eventBus = eventBus;

    this.items = {
      food: { basePrice: 5, name: 'Yemek', category: 'food' },
      wood: { basePrice: 10, name: 'Odun', category: 'material' },
      iron: { basePrice: 25, name: 'Demir', category: 'material' },
      leather: { basePrice: 15, name: 'Deri', category: 'material' },
      meat: { basePrice: 8, name: 'Et', category: 'food' },
      armor: { basePrice: 50, name: 'Zırh', category: 'equipment' },
      weapon: { basePrice: 30, name: 'Kılıç', category: 'equipment' },
    };

    this.tradeRoutes = [];
    this.caravans = [];
  }

  update(deltaTime) {
    // Tick bazlı ekonomi akışı processEconomyTick içinde
  }

  processEconomyTick() {
    const villageEntities = this.world.getEntitiesWithComponent('village');

    for (const entityId of villageEntities) {
      this.processVillageEconomy(entityId);
    }

    this.processCaravans();

    if (this.eventBus) {
      this.eventBus.emit('economy:tick', {});
    }
  }

  calculateHouseEconomy(house) {
    const def = getHousingLevel(house.level);
    const families = (house.families ?? []).map(normalizeFamily);

    const currentPopulation = families.reduce((sum, family) => sum + family.members, 0);
    const maxPopulation = def.maxPeople;
    const overcrowding = Math.max(0, currentPopulation - maxPopulation);

    const grossIncome = families.reduce((sum, family) => {
      const familyIncome =
        (family.members * def.incomePerPerson + def.baseHouseIncome) *
        family.activityMultiplier;

      return sum + familyIncome;
    }, 0);

    const taxableIncome = Math.max(0, grossIncome);
    const tax = taxableIncome * def.taxRate;
    const overcrowdingPenalty = overcrowding * 2;
    const netHouseIncome = grossIncome - tax - overcrowdingPenalty;

    return {
      houseId: house.id ?? null,
      level: def.level,
      name: def.name,
      familiesCount: families.length,
      currentPopulation,
      maxPopulation,
      grossIncome: round2(grossIncome),
      tax: round2(tax),
      overcrowdingPenalty: round2(overcrowdingPenalty),
      netHouseIncome: round2(netHouseIncome),
      hasGarden: def.hasGarden,
    };
  }

  calculateVillageHousingEconomy(houses = []) {
    const houseResults = houses.map((house) => this.calculateHouseEconomy(house));

    const totalPopulation = houseResults.reduce((sum, h) => sum + h.currentPopulation, 0);
    const totalCapacity = houseResults.reduce((sum, h) => sum + h.maxPopulation, 0);
    const totalGrossHouseIncome = houseResults.reduce((sum, h) => sum + h.grossIncome, 0);
    const totalTax = houseResults.reduce((sum, h) => sum + h.tax, 0);
    const totalOvercrowdingPenalty = houseResults.reduce((sum, h) => sum + h.overcrowdingPenalty, 0);
    const totalNetHouseIncome = houseResults.reduce((sum, h) => sum + h.netHouseIncome, 0);

    return {
      houses: houseResults,
      totalPopulation,
      totalCapacity,
      totalGrossHouseIncome: round2(totalGrossHouseIncome),
      totalTax: round2(totalTax),
      totalOvercrowdingPenalty: round2(totalOvercrowdingPenalty),
      totalNetHouseIncome: round2(totalNetHouseIncome),
    };
  }

  processVillageEconomy(entityId) {
    const economy = this.world.getComponent(entityId, 'economy');
    const village = this.world.getComponent(entityId, 'village');

    if (!economy || !village) return;

    economy.resources = economy.resources ?? {};
    economy.workers = economy.workers ?? {};

    economy.resources.food = economy.resources.food ?? 0;
    economy.resources.wood = economy.resources.wood ?? 0;
    economy.resources.iron = economy.resources.iron ?? 0;
    economy.resources.meat = economy.resources.meat ?? 0;
    economy.resources.leather = economy.resources.leather ?? 0;
    economy.resources.gold = economy.resources.gold ?? 0;

    economy.workers.farming = economy.workers.farming ?? 0;
    economy.workers.woodcutting = economy.workers.woodcutting ?? 0;
    economy.workers.mining = economy.workers.mining ?? 0;
    economy.workers.hunting = economy.workers.hunting ?? 0;
    economy.workers.trading = economy.workers.trading ?? 0;

    // Klasik üretim
    economy.resources.food += economy.workers.farming * 2;
    economy.resources.wood += economy.workers.woodcutting * 1;
    economy.resources.iron += economy.workers.mining * 0.5;
    economy.resources.meat += economy.workers.hunting * 1;
    economy.resources.leather += economy.workers.hunting * 0.3;

    // Hane/ev ekonomisi
    village.houses = village.houses ?? [];
    const housingSummary = this.calculateVillageHousingEconomy(village.houses);

    village.housingSummary = housingSummary;
    village.population = Math.max(village.population ?? 0, housingSummary.totalPopulation);
    village.treasury = (village.treasury ?? 0) + housingSummary.totalTax;
    village.householdNetIncome = housingSummary.totalNetHouseIncome;
    village.householdGrossIncome = housingSummary.totalGrossHouseIncome;
    village.overcrowdingPenalty = housingSummary.totalOvercrowdingPenalty;

    // Vergi köy kasasına girsin
    economy.resources.gold += housingSummary.totalTax;

    // Açlık/iş gücü tüketimi
    const consumption = Math.floor(village.population * 0.3);
    economy.resources.food -= consumption;

    // Negatif kaynak olmasın
    for (const resource of Object.keys(economy.resources)) {
      economy.resources[resource] = Math.max(0, economy.resources[resource]);
    }

    // Ticaret fiyat sistemi
    this.updateVillagePrices(entityId);

    // Ekonomi özeti
    economy.income = (economy.workers.trading * 2) + housingSummary.totalTax;
    economy.expenses = Math.floor(village.population * 0.3) + housingSummary.totalOvercrowdingPenalty;
  }

  updateVillagePrices(entityId) {
    const village = this.world.getComponent(entityId, 'village');
    if (!village) return;

    village.supply = village.supply ?? {};
    village.demand = village.demand ?? {};
    village.prices = village.prices ?? {};

    for (const item of Object.keys(village.supply)) {
      const basePrice = this.items[item]?.basePrice || 10;
      const supply = village.supply[item] || 50;
      const demand = village.demand[item] || 30;

      const ratio = demand / Math.max(1, supply);
      village.prices[item] = Math.floor(basePrice * (0.5 + ratio * 0.5));
    }
  }

  processCaravans() {
    for (const caravan of this.caravans) {
      caravan.progress += 0.01;

      if (caravan.progress >= 1) {
        this.processCaravanTrade(caravan);
        caravan.progress = 0;

        const temp = caravan.from;
        caravan.from = caravan.to;
        caravan.to = temp;
      }
    }
  }

  processCaravanTrade(caravan) {
    const fromVillage = this.getVillageById(caravan.from);
    const toVillage = this.getVillageById(caravan.to);

    if (!fromVillage || !toVillage) return;

    fromVillage.prices = fromVillage.prices ?? {};
    fromVillage.supply = fromVillage.supply ?? {};
    toVillage.demand = toVillage.demand ?? {};

    for (const item of Object.keys(fromVillage.prices)) {
      const buyPrice = fromVillage.prices[item];
      const sellPrice = toVillage.prices[item];

      if (sellPrice > buyPrice * 1.2) {
        const quantity = Math.min(10, fromVillage.supply[item] || 0);

        if (quantity > 0) {
          fromVillage.supply[item] -= quantity;
          toVillage.demand[item] = Math.max(0, (toVillage.demand[item] || 0) - quantity);

          if (this.eventBus) {
            this.eventBus.emit('village:trade', {
              from: fromVillage.name,
              to: toVillage.name,
              item,
              quantity,
              price: sellPrice,
            });
          }
        }
      }
    }
  }

  getVillageById(entityId) {
    return this.world.getComponent(entityId, 'village');
  }

  createTradeRoute(villageId1, villageId2) {
    this.tradeRoutes.push({ from: villageId1, to: villageId2 });

    this.caravans.push({
      from: villageId1,
      to: villageId2,
      progress: 0,
      goods: {},
    });
  }

  buyItem(villageEntityId, item, quantity, buyerGold) {
    const village = this.world.getComponent(villageEntityId, 'village');
    const economy = this.world.getComponent(villageEntityId, 'economy');

    if (!village || !economy) return { success: false };

    village.supply = village.supply ?? {};
    village.demand = village.demand ?? {};
    village.prices = village.prices ?? {};

    const price = village.prices[item];
    const totalCost = price * quantity;

    if ((village.supply[item] || 0) >= quantity && buyerGold >= totalCost) {
      village.supply[item] -= quantity;
      village.demand[item] = Math.min(100, (village.demand[item] || 0) + quantity * 2);
      economy.resources.gold = (economy.resources.gold || 0) + totalCost;

      if (typeof economy.recordTrade === 'function') {
        economy.recordTrade(item, quantity, price, true);
      }

      if (this.eventBus) {
        this.eventBus.emit('item:bought', {
          village: village.name,
          item,
          quantity,
          price,
          totalCost,
        });
      }

      return { success: true, totalCost, price };
    }

    return { success: false };
  }

  sellItem(villageEntityId, item, quantity, sellerGold) {
    const village = this.world.getComponent(villageEntityId, 'village');
    const economy = this.world.getComponent(villageEntityId, 'economy');

    if (!village || !economy) return { success: false };

    village.supply = village.supply ?? {};
    village.demand = village.demand ?? {};
    village.prices = village.prices ?? {};

    const price = village.prices[item];
    const totalValue = price * quantity;

    if ((village.demand[item] || 0) >= quantity) {
      village.demand[item] -= quantity;
      village.supply[item] = Math.min(100, (village.supply[item] || 0) + quantity);
      economy.resources.gold = (economy.resources.gold || 0) - totalValue;

      if (typeof economy.recordTrade === 'function') {
        economy.recordTrade(item, quantity, price, false);
      }

      if (this.eventBus) {
        this.eventBus.emit('item:sold', {
          village: village.name,
          item,
          quantity,
          price,
          totalValue,
        });
      }

      return { success: true, totalValue, price };
    }

    return { success: false };
  }

  getVillageTradeInfo(villageEntityId) {
    const village = this.world.getComponent(villageEntityId, 'village');
    const economy = this.world.getComponent(villageEntityId, 'economy');

    if (!village) return null;

    return {
      name: village.name,
      type: village.type,
      population: village.population,
      prices: { ...(village.prices ?? {}) },
      supply: { ...(village.supply ?? {}) },
      demand: { ...(village.demand ?? {}) },
      gold: economy?.resources?.gold || 0,
      treasury: village.treasury || 0,
      householdNetIncome: village.householdNetIncome || 0,
    };
  }
}

export { EconomySystem };