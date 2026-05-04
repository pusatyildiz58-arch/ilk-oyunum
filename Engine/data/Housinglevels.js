// Engine/data/housingLevels.js

export const HOUSING_LEVELS = {
  1: {
    level: 1,
    name: "Kerpiç Ev",
    families: 1,
    maxPeople: 2,
    hasGarden: false,
    incomePerPerson: 2,
    baseHouseIncome: -6,
    taxRate: 0.00,
  },
  2: {
    level: 2,
    name: "Kerpiç Ev",
    families: 1,
    maxPeople: 5,
    hasGarden: true,
    incomePerPerson: 3,
    baseHouseIncome: -2,
    taxRate: 0.02,
  },
  3: {
    level: 3,
    name: "Ahşap Ev",
    families: 1,
    maxPeople: 7,
    hasGarden: true,
    incomePerPerson: 4,
    baseHouseIncome: 0,
    taxRate: 0.04,
  },
  4: {
    level: 4,
    name: "Ahşap Ev",
    families: 2,
    maxPeople: 10,
    hasGarden: false,
    incomePerPerson: 5,
    baseHouseIncome: 3,
    taxRate: 0.06,
  },
  5: {
    level: 5,
    name: "Taş Ev",
    families: 2,
    maxPeople: 16,
    hasGarden: true,
    incomePerPerson: 6,
    baseHouseIncome: 5,
    taxRate: 0.08,
  },
  6: {
    level: 6,
    name: "Taş Ev",
    families: 3,
    maxPeople: 24,
    hasGarden: true,
    incomePerPerson: 7,
    baseHouseIncome: 8,
    taxRate: 0.10,
  },
  7: {
    level: 7,
    name: "Lüks Ev",
    families: 3,
    maxPeople: 30,
    hasGarden: true,
    incomePerPerson: 9,
    baseHouseIncome: 12,
    taxRate: 0.12,
  },
  8: {
    level: 8,
    name: "Konak",
    families: 4,
    maxPeople: 40,
    hasGarden: true,
    incomePerPerson: 11,
    baseHouseIncome: 17,
    taxRate: 0.15,
  },
  9: {
    level: 9,
    name: "Malikane",
    families: 5,
    maxPeople: 55,
    hasGarden: true,
    incomePerPerson: 13,
    baseHouseIncome: 23,
    taxRate: 0.18,
  },
  10: {
    level: 10,
    name: "Sarayvari Yapı",
    families: 6,
    maxPeople: 70,
    hasGarden: true,
    incomePerPerson: 16,
    baseHouseIncome: 30,
    taxRate: 0.22,
  },
};

export function getHousingLevel(level) {
  return HOUSING_LEVELS[level] ?? HOUSING_LEVELS[1];
}

export function createHouse(level, families = []) {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `house_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    level,
    families: families.map((f) =>
      typeof f === "number" ? { members: f, activityMultiplier: 1 } : f
    ),
  };
}

export function createDefaultVillageHousing(population = 30) {
  const houses = [];
  let remaining = Math.max(0, population);

  while (remaining > 0) {
    const level = Math.min(10, Math.max(1, 1 + Math.floor(Math.random() * 4)));
    const def = getHousingLevel(level);
    const families = [];
    const familyCount = def.families;

    for (let i = 0; i < familyCount && remaining > 0; i++) {
      const maxForFamily = Math.min(8, Math.max(1, Math.ceil(remaining / (familyCount - i))));
      const members = Math.max(1, Math.min(maxForFamily, 1 + Math.floor(Math.random() * maxForFamily)));
      families.push(members);
      remaining -= members;
    }

    houses.push(createHouse(level, families));

    if (houses.length > 24) break;
  }

  return houses;
}