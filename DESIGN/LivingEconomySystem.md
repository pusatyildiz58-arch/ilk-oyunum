# Yaşayan Köy Bazlı Ekonomi Sistemi Tasarımı

## 📋 Sistem Genel Bakışı

Bu sistem, her köyün bağımsız ekonomik birim gibi davrandığı, arz-talep dengesine dayalı dinamik fiyatlandırma ile gerçek zamanlı çalışan modüler bir ekonomi altyapısı sunar.

---

## 🏗️ 1. Teknik Mimari

### **Sistem Katmanları**
```
┌─────────────────────────────────────────┐
│              UI Layer                   │
│  (Market Panels, Trade UI, Notifications) │
├─────────────────────────────────────────┤
│            Economy Manager              │
│  (Price Calculator, Trade Validator)     │
├─────────────────────────────────────────┤
│          Village Economy               │
│  (Stock Management, Production, Demand)  │
├─────────────────────────────────────────┤
│           Player Economy               │
│  (Inventory, Wealth, Investments)        │
├─────────────────────────────────────────┤
│            Event System                 │
│  (AI Updates, Weather, Wars, Caravans) │
└─────────────────────────────────────────┘
```

### **Core Sınıflar**
```javascript
class EconomyManager {
  constructor() {
    this.villages = new Map(); // villageId -> VillageEconomy
    this.playerEconomy = new PlayerEconomy();
    this.priceCalculator = new PriceCalculator();
    this.eventBus = new EventBus();
  }
}

class VillageEconomy {
  constructor(villageId, villageType) {
    this.id = villageId;
    this.type = villageType; // 'farming', 'trading', 'mining'
    this.treasury = new Treasury();
    this.stock = new StockManager();
    this.production = new ProductionManager();
    this.demand = new DemandManager();
    this.development = new DevelopmentManager();
  }
}
```

---

## 📊 2. Veri Modeli

### **Köy Ekonomisi Veri Yapısı**
```javascript
const villageEconomySchema = {
  // Temel Bilgiler
  id: "village_001",
  name: "Ekinli",
  type: "farming", // farming, trading, mining, mixed
  
  // Kasa ve Finans
  treasury: {
    gold: 1000,
    income: 0,
    expenses: 0,
    lastTaxCollection: 0,
    tradeBalance: 0
  },
  
  // Stok Yönetimi
  stock: {
    wheat: { current: 500, capacity: 1000, quality: 1.0 },
    flour: { current: 200, capacity: 500, quality: 0.9 },
    wood: { current: 300, capacity: 800, quality: 1.0 },
    stone: { current: 150, capacity: 600, quality: 1.0 },
    iron: { current: 50, capacity: 300, quality: 0.8 },
    cloth: { current: 100, capacity: 400, quality: 1.1 },
    meat: { current: 80, capacity: 200, quality: 1.0 },
    animalFeed: { current: 200, capacity: 500, quality: 1.0 },
    tools: { current: 30, capacity: 100, quality: 0.9 }
  },
  
  // Üretim Sistemi
  production: {
    capacity: 1.0, // 0.1 - 2.0 arası
    efficiency: 0.8, // 0.0 - 1.0 arası
    workers: 25,
    maxWorkers: 50,
    outputRates: {
      wheat: 2.5, // per hour
      flour: 1.2,
      wood: 1.8,
      tools: 0.3
    }
  },
  
  // Talep Yönetimi
  demand: {
    internal: {
      wheat: { base: 100, current: 120, elasticity: 0.8 },
      flour: { base: 80, current: 95, elasticity: 0.9 },
      meat: { base: 60, current: 70, elasticity: 1.2 }
    },
    external: {
      wheat: { base: 50, current: 30, elasticity: 0.7 },
      tools: { base: 20, current: 25, elasticity: 0.6 }
    }
  },
  
  // Gelişim Seviyesi
  development: {
    level: 3, // 1-10 arası
    population: 150,
    maxPopulation: 300,
    happiness: 0.7, // 0.0 - 1.0
    security: 0.8, // 0.0 - 1.0
    infrastructure: 0.6, // 0.0 - 1.0
    specialization: "farming" // primary economic focus
  },
  
  // Fiyat Yapısı
  prices: {
    wheat: { base: 8, current: 12, trend: 0.1 },
    flour: { base: 12, current: 18, trend: -0.05 },
    iron: { base: 30, current: 45, trend: 0.2 }
  }
};
```

### **Oyuncu Ekonomisi Veri Yapısı**
```javascript
const playerEconomySchema = {
  // Finansal Durum
  wealth: {
    gold: 500,
    silver: 200,
    assets: 1500, // property value
    debts: 100,
    income: 25, // per hour
    expenses: 15 // per hour
  },
  
  // Envanter ve Depo
  inventory: {
    personal: {
      wheat: 20,
      tools: 5,
      weapons: 2
    },
    storage: {
      wheat: 100,
      flour: 50,
      wood: 80
    },
    maxCapacity: 500
  },
  
  // Tarım Varlıkları
  farmland: {
    plots: 3,
    totalPlots: 10,
    cropYield: 1.2, // multiplier
    lastHarvest: Date.now()
  },
  
  // Ticaret ve Yatırımlar
  trading: {
    caravanCapacity: 100,
    activeRoutes: 2,
    tradeReputation: 0.8,
    lastProfit: 150
  },
  
  // Vergi ve Gelirler
  taxes: {
    landTax: 5, // per month
    tradeTax: 0.1, // 10% of trade profits
    incomeTax: 0.05 // 5% of income
  }
};
```

---

## 🧮 3. Fiyat Hesaplama Formülleri

### **Arz-Talep Fiyat Formülü**
```javascript
function calculatePrice(basePrice, stock, demand, externalFactors = {}) {
  // 1. Stok/Talep Oranı
  const stockDemandRatio = stock.current / (demand.internal.current + demand.external.current);
  
  // 2. Temel Fiyat Ayarlaması
  let priceMultiplier = 1.0;
  
  // Stok azsa fiyat yüksel
  if (stockDemandRatio < 0.5) {
    priceMultiplier += (0.5 - stockDemandRatio) * 2;
  }
  // Stok çoksa fiyat düşer
  else if (stockDemandRatio > 1.5) {
    priceMultiplier -= (stockDemandRatio - 1.5) * 0.5;
  }
  
  // 3. Kalite Etkisi
  priceMultiplier *= stock.quality;
  
  // 4. Dış Faktörler
  if (externalFactors.war) priceMultiplier *= 1.3;
  if (externalFactors.drought) priceMultiplier *= 1.5;
  if (externalFactors.goodHarvest) priceMultiplier *= 0.8;
  if (externalFactors.lowSecurity) priceMultiplier *= 1.2;
  
  // 5. Talep Esnekliği
  const elasticity = demand.internal.elasticity;
  const demandPressure = (demand.internal.current - demand.internal.base) / demand.internal.base;
  priceMultiplier *= (1 + demandPressure * elasticity * 0.1);
  
  // 6. Son Fiyat
  return Math.round(basePrice * priceMultiplier);
}
```

### **Üretim Kapasitesi Formülü**
```javascript
function calculateProductionCapacity(village) {
  const baseCapacity = village.production.capacity;
  
  // Gelişim Seviyesi Etkisi
  const developmentBonus = village.development.level * 0.1;
  
  // Nüfus Etkisi
  const populationFactor = village.development.population / village.development.maxPopulation;
  
  // Mutluluk Etkisi
  const happinessFactor = village.development.happiness;
  
  // Altyapı Etkisi
  const infrastructureFactor = village.development.infrastructure;
  
  // İşçi Sayısı Etkisi
  const workerFactor = village.production.workers / village.production.maxWorkers;
  
  // Uzmanlaşma Bonusu
  let specializationBonus = 1.0;
  if (village.type === 'farming') specializationBonus = 1.3;
  if (village.type === 'trading') specializationBonus = 1.2;
  if (village.type === 'mining') specializationBonus = 1.25;
  
  return baseCapacity * 
         (1 + developmentBonus) * 
         populationFactor * 
         happinessFactor * 
         infrastructureFactor * 
         workerFactor * 
         specializationBonus;
}
```

### **Talep Hesaplama Formülü**
```javascript
function calculateDemand(village, goodType) {
  const baseDemand = village.demand.internal[goodType].base;
  
  // Nüfus Artışı
  const populationMultiplier = village.development.population / 100;
  
  // Zenginlik Etkisi
  const wealthMultiplier = village.treasury.gold / 1000;
  
  // Mevsimsel Etkiler
  const seasonalMultiplier = getSeasonalMultiplier(goodType);
  
  // Güvenlik Etkisi
  if (goodType === 'weapons' || goodType === 'tools') {
    const securityMultiplier = 2 - village.development.security;
    return baseDemand * populationMultiplier * wealthMultiplier * seasonalMultiplier * securityMultiplier;
  }
  
  return baseDemand * populationMultiplier * wealthMultiplier * seasonalMultiplier;
}
```

---

## 🔄 4. Arz-Talep İşleyişi

### **Gerçek Zamanlı Ekonomi Döngüsü**
```javascript
class EconomyEngine {
  constructor() {
    this.updateInterval = 5000; // 5 saniyede bir
    this.lastUpdate = Date.now();
  }
  
  update(deltaTime) {
    // 1. Üretim Güncelleme
    this.updateProduction();
    
    // 2. Talep Hesaplama
    this.updateDemand();
    
    // 3. Fiyat Güncelleme
    this.updatePrices();
    
    // 4. Ticaret İşlemleri
    this.processTrades();
    
    // 5. Gelişim Güncelleme
    this.updateDevelopment();
    
    // 6. Event Tetikleme
    this.triggerEconomyEvents();
  }
  
  updateProduction() {
    for (const [villageId, village] of this.villages) {
      const capacity = calculateProductionCapacity(village);
      
      for (const [good, rate] of Object.entries(village.production.outputRates)) {
        const actualProduction = rate * capacity * (deltaTime / 3600000); // saat bazında
        village.stock[good].current = Math.min(
          village.stock[good].current + actualProduction,
          village.stock[good].capacity
        );
      }
    }
  }
  
  updatePrices() {
    for (const [villageId, village] of this.villages) {
      for (const good of Object.keys(village.prices)) {
        const stock = village.stock[good];
        const demand = village.demand.internal[good];
        const externalFactors = this.getExternalFactors(villageId);
        
        const newPrice = calculatePrice(
          village.prices[good].base,
          stock,
          demand,
          externalFactors
        );
        
        // Fiyat Trend'i Güncelle
        village.prices[good].trend = (newPrice - village.prices[good].current) / village.prices[good].current;
        village.prices[good].current = newPrice;
      }
    }
  }
}
```

### **Ticaret Doğrulama Sistemi**
```javascript
class TradeValidator {
  static validatePurchase(villageId, goodType, quantity, buyerEconomy) {
    const village = economyManager.villages.get(villageId);
    
    // 1. Köyde Stok Var mı?
    if (village.stock[goodType].current < quantity) {
      return { success: false, reason: "Köyde yeterli stok yok" };
    }
    
    // 2. Alıcının Parası Var mı?
    const totalPrice = village.prices[goodType].current * quantity;
    if (buyerEconomy.wealth.gold < totalPrice) {
      return { success: false, reason: "Yeterli altınınız yok" };
    }
    
    // 3. Alıcının Kapasitesi Var mı?
    const totalItems = Object.values(buyerEconomy.inventory.personal).reduce((a, b) => a + b, 0);
    if (totalItems + quantity > buyerEconomy.inventory.maxCapacity) {
      return { success: false, reason: "Envanter kapasiteniz dolu" };
    }
    
    return { success: true, price: totalPrice };
  }
  
  static validateSale(villageId, goodType, quantity, sellerEconomy) {
    const village = economyManager.villages.get(villageId);
    
    // 1. Satıcının Malı Var mı?
    if (sellerEconomy.inventory.personal[goodType] < quantity) {
      return { success: false, reason: "Satacak malınız yok" };
    }
    
    // 2. Köyün Parası Var mı?
    const totalPrice = village.prices[goodType].current * quantity;
    if (village.treasury.gold < totalPrice) {
      return { success: false, reason: "Köyün kasası boş" };
    }
    
    // 3. Köyün Kapasitesi Var mı?
    if (village.stock[goodType].current + quantity > village.stock[goodType].capacity) {
      return { success: false, reason: "Köyün deposu dolu" };
    }
    
    return { success: true, price: totalPrice };
  }
}
```

---

## 📈 5. Köy Gelişimi ve Ekonomi Bağlantısı

### **Gelişim Sistemi**
```javascript
class DevelopmentManager {
  updateDevelopment(village) {
    // 1. Ekonomik Güç Hesaplama
    const economicPower = this.calculateEconomicPower(village);
    
    // 2. Gelişim Seviyesi Güncelleme
    if (economicPower > village.development.level * 100) {
      village.development.level = Math.min(10, village.development.level + 0.1);
    }
    
    // 3. Nüfus Artışı/Azalışı
    this.updatePopulation(village);
    
    // 4. Mutluluk Güncelleme
    this.updateHappiness(village);
    
    // 5. Altyapı Gelişimi
    this.updateInfrastructure(village);
  }
  
  calculateEconomicPower(village) {
    const treasuryStrength = village.treasury.gold / 100;
    const productionStrength = Object.values(village.production.outputRates).reduce((a, b) => a + b, 0);
    const tradeStrength = village.treasury.tradeBalance / 50;
    
    return treasuryStrength + productionStrength + tradeStrength;
  }
  
  updatePopulation(village) {
    const growthRate = village.development.happiness * 0.01; // %1'e kadar
    const targetPopulation = village.development.maxPopulation * (0.5 + village.development.level * 0.05);
    
    if (village.development.population < targetPopulation) {
      village.development.population += growthRate;
    }
  }
  
  canExpandProduction(village) {
    return village.development.level >= 3 && 
           village.treasury.gold > 500 && 
           village.development.population > village.production.maxWorkers * 0.8;
  }
}
```

### **Uzmanlaşma Sistemi**
```javascript
class SpecializationManager {
  static determineSpecialization(village) {
    const production = village.production.outputRates;
    const stock = village.stock;
    
    // Tarım Uzmanlaşması
    if (production.wheat > 2 && stock.wheat.current > stock.iron.current * 3) {
      return "farming";
    }
    
    // Madencilik Uzmanlaşması
    if (production.iron > 0.5 && stock.iron.current > stock.wheat.current * 2) {
      return "mining";
    }
    
    // Ticaret Uzmanlaşması
    if (village.treasury.tradeBalance > 100 && village.development.infrastructure > 0.7) {
      return "trading";
    }
    
    return "mixed";
  }
  
  static applySpecializationBonus(village) {
    const specialization = this.determineSpecialization(village);
    village.development.specialization = specialization;
    
    switch (specialization) {
      case "farming":
        village.production.outputRates.wheat *= 1.3;
        village.production.outputRates.flour *= 1.2;
        break;
      case "mining":
        village.production.outputRates.iron *= 1.4;
        village.production.outputRates.stone *= 1.2;
        break;
      case "trading":
        village.treasury.income *= 1.2;
        village.development.infrastructure *= 1.1;
        break;
    }
  }
}
```

---

## 🎮 6. Oyuncu ve Köy Ekonomisi Ayrımı

### **Oyuncu Ekonomi Yöneticisi**
```javascript
class PlayerEconomyManager {
  constructor() {
    this.wealth = { gold: 500, silver: 200 };
    this.inventory = new PlayerInventory();
    this.farmland = new FarmlandManager();
    this.trading = new TradingManager();
  }
  
  // Köye Yatırım Yapma
  investInVillage(villageId, amount, type) {
    const village = economyManager.villages.get(villageId);
    
    switch (type) {
      case "production":
        village.production.capacity += amount * 0.001;
        break;
      case "infrastructure":
        village.development.infrastructure += amount * 0.0001;
        break;
      case "security":
        village.development.security += amount * 0.0001;
        break;
    }
    
    this.wealth.gold -= amount;
    this.addInvestment(villageId, amount, type);
  }
  
  // Tarım Geliri
  collectFarmIncome() {
    const income = this.farmland.calculateYield();
    this.wealth.gold += income.value;
    this.inventory.storage.wheat += income.wheat;
    return income;
  }
  
  // Vergi Ödeme
  payTaxes() {
    const landTax = this.farmland.plots * 5;
    const incomeTax = this.wealth.income * 0.05;
    const totalTax = landTax + incomeTax;
    
    this.wealth.gold -= totalTax;
    return totalTax;
  }
}
```

### **Köy-Oyuncu Ticareti**
```javascript
class VillagePlayerTrade {
  static playerBuyFromVillage(villageId, goodType, quantity) {
    const village = economyManager.villages.get(villageId);
    const player = economyManager.playerEconomy;
    
    // Ticaret Doğrulama
    const validation = TradeValidator.validatePurchase(villageId, goodType, quantity, player);
    if (!validation.success) {
      return validation;
    }
    
    // İşlemi Gerçekleştir
    village.stock[goodType].current -= quantity;
    village.treasury.gold += validation.price;
    village.treasury.income += validation.price;
    
    player.inventory.personal[goodType] = (player.inventory.personal[goodType] || 0) + quantity;
    player.wealth.gold -= validation.price;
    
    // Event Tetikle
    economyManager.eventBus.emit('trade:player_buy', {
      villageId,
      goodType,
      quantity,
      price: validation.price
    });
    
    return { success: true, price: validation.price };
  }
  
  static playerSellToVillage(villageId, goodType, quantity) {
    const village = economyManager.villages.get(villageId);
    const player = economyManager.playerEconomy;
    
    // Ticaret Doğrulama
    const validation = TradeValidator.validateSale(villageId, goodType, quantity, player);
    if (!validation.success) {
      return validation;
    }
    
    // İşlemi Gerçekleştir
    village.stock[goodType].current += quantity;
    village.treasury.gold -= validation.price;
    village.treasury.expenses += validation.price;
    
    player.inventory.personal[goodType] -= quantity;
    player.wealth.gold += validation.price;
    
    // Event Tetikle
    economyManager.eventBus.emit('trade:player_sell', {
      villageId,
      goodType,
      quantity,
      price: validation.price
    });
    
    return { success: true, price: validation.price };
  }
}
```

---

## 🏗️ 7. Unity/C# Sınıf Yapısı

### **VillageEconomy.cs**
```csharp
[System.Serializable]
public class VillageEconomy
{
    [Header("Basic Info")]
    public string villageId;
    public string villageName;
    public VillageType villageType;
    
    [Header("Treasury")]
    public Treasury treasury;
    
    [Header("Stock Management")]
    public StockManager stock;
    
    [Header("Production")]
    public ProductionManager production;
    
    [Header("Demand")]
    public DemandManager demand;
    
    [Header("Development")]
    public DevelopmentManager development;
    
    [Header("Prices")]
    public PriceManager prices;
    
    public void Initialize(string id, VillageType type)
    {
        villageId = id;
        villageType = type;
        treasury = new Treasury(1000);
        stock = new StockManager();
        production = new ProductionManager(type);
        demand = new DemandManager();
        development = new DevelopmentManager();
        prices = new PriceManager();
    }
    
    public void UpdateEconomy(float deltaTime)
    {
        production.UpdateProduction(this, deltaTime);
        demand.UpdateDemand(this);
        prices.UpdatePrices(this);
        development.UpdateDevelopment(this);
    }
}
```

### **EconomyManager.cs**
```csharp
public class EconomyManager : MonoBehaviour
{
    [Header("Economy Settings")]
    public float updateInterval = 5f;
    public bool enableRealTimeUpdates = true;
    
    [Header("Villages")]
    public List<VillageEconomy> villages;
    
    [Header("Player Economy")]
    public PlayerEconomy playerEconomy;
    
    private Dictionary<string, VillageEconomy> villageDict;
    private EconomyEngine economyEngine;
    private EventBus eventBus;
    
    void Start()
    {
        InitializeEconomy();
        StartEconomyEngine();
    }
    
    void InitializeEconomy()
    {
        villageDict = new Dictionary<string, VillageEconomy>();
        economyEngine = new EconomyEngine();
        eventBus = new EventBus();
        
        foreach (var village in villages)
        {
            villageDict[village.villageId] = village;
            village.Initialize(village.villageId, village.villageType);
        }
        
        playerEconomy = new PlayerEconomy();
    }
    
    void StartEconomyEngine()
    {
        if (enableRealTimeUpdates)
        {
            InvokeRepeating(nameof(UpdateAllEconomies), 0f, updateInterval);
        }
    }
    
    void UpdateAllEconomies()
    {
        float deltaTime = updateInterval;
        
        foreach (var village in villages)
        {
            village.UpdateEconomy(deltaTime);
        }
        
        playerEconomy.UpdateEconomy(deltaTime);
        economyEngine.ProcessGlobalEvents();
    }
    
    public TradeResult PlayerBuyFromVillage(string villageId, string goodType, int quantity)
    {
        return VillagePlayerTrade.PlayerBuyFromVillage(villageId, goodType, quantity, playerEconomy);
    }
    
    public TradeResult PlayerSellToVillage(string villageId, string goodType, int quantity)
    {
        return VillagePlayerTrade.PlayerSellToVillage(villageId, goodType, quantity, playerEconomy);
    }
}
```

### **PriceCalculator.cs**
```csharp
public static class PriceCalculator
{
    public static float CalculatePrice(float basePrice, StockData stock, DemandData demand, ExternalFactors factors)
    {
        // Stok/Talep Oranı
        float stockDemandRatio = stock.current / (demand.internal.current + demand.external.current);
        
        // Temel Fiyat Ayarlaması
        float priceMultiplier = 1f;
        
        if (stockDemandRatio < 0.5f)
        {
            priceMultiplier += (0.5f - stockDemandRatio) * 2f;
        }
        else if (stockDemandRatio > 1.5f)
        {
            priceMultiplier -= (stockDemandRatio - 1.5f) * 0.5f;
        }
        
        // Kalite Etkisi
        priceMultiplier *= stock.quality;
        
        // Dış Faktörler
        if (factors.isWar) priceMultiplier *= 1.3f;
        if (factors.isDrought) priceMultiplier *= 1.5f;
        if (factors.isGoodHarvest) priceMultiplier *= 0.8f;
        if (factors.lowSecurity) priceMultiplier *= 1.2f;
        
        // Talep Esnekliği
        float elasticity = demand.internal.elasticity;
        float demandPressure = (demand.internal.current - demand.internal.base) / demand.internal.base;
        priceMultiplier *= (1 + demandPressure * elasticity * 0.1f);
        
        return Mathf.Round(basePrice * priceMultiplier);
    }
}
```

---

## 🔗 8. Modül Entegrasyonları

### **AI Sistemi Entegrasyonu**
```javascript
// AI kararlarını ekonomiye bağla
class AIEconomyIntegration {
  static updateAIBehavior(village) {
    // Ekonomik Duruma Göre AI Davranışı
    if (village.treasury.gold < 200) {
      // Fakir köy - daha agresif ticaret
      village.aiBehavior.tradingAggression = 0.8;
      village.aiBehavior.productionFocus = "high_value";
    }
    
    if (village.development.happiness < 0.3) {
      // Mutusuz köy - üretim düşer
      village.production.efficiency *= 0.7;
    }
    
    if (village.development.security < 0.4) {
      // Güvensiz köy - ticaret azalır
      village.demand.external *= 0.6;
    }
  }
}
```

### **Tarım Sistemi Entegrasyonu**
```javascript
// Tarım verimini ekonomiye bağla
class FarmingEconomyIntegration {
  static updateFarmProduction(village, season, weather) {
    const seasonMultiplier = this.getSeasonMultiplier(season);
    const weatherMultiplier = this.getWeatherMultiplier(weather);
    
    village.production.efficiency *= seasonMultiplier * weatherMultiplier;
    
    // Hasat sonuçlarını stoka ekle
    if (season === 'harvest') {
      const harvest = this.calculateHarvest(village);
      village.stock.wheat.current += harvest.wheat;
      village.stock.flour.current += harvest.flour;
    }
  }
}
```

### **Ticaret Sistemi Entegrasyonu**
```javascript
// Kervanları ekonomiye bağla
class TradeEconomyIntegration {
  static processCaravanTrade(caravan) {
    const fromVillage = economyManager.villages.get(caravan.fromVillage);
    const toVillage = economyManager.villages.get(caravan.toVillage);
    
    // Malları taşı
    for (const [good, quantity] of Object.entries(caravan.goods)) {
      fromVillage.stock[good].current -= quantity;
      toVillage.stock[good].current += quantity;
      
      // Fiyatları etkile
      toVillage.prices[good].current *= 0.9; // Arz artığı için fiyat düşer
    }
    
    // Kervan geliri
    const profit = this.calculateCaravanProfit(caravan);
    fromVillage.treasury.gold += profit;
  }
}
```

### **UI Sistemi Entegrasyonu**
```javascript
// UI'ı gerçek zamanlı ekonomi verilerine bağla
class EconomyUIIntegration {
  static updateMarketUI(villageId) {
    const village = economyManager.villages.get(villageId);
    const marketUI = document.getElementById('village-market');
    
    // Fiyatları güncelle
    for (const good of Object.keys(village.prices)) {
      const priceElement = document.getElementById(`price-${good}`);
      if (priceElement) {
        priceElement.textContent = `${village.prices[good].current}🪙`;
        
        // Trend göstergesi
        const trendElement = document.getElementById(`trend-${good}`);
        if (trendElement) {
          trendElement.textContent = village.prices[good].trend > 0 ? '📈' : '📉';
          trendElement.style.color = village.prices[good].trend > 0 ? 'green' : 'red';
        }
      }
    }
    
    // Stok bilgilerini güncelle
    for (const good of Object.keys(village.stock)) {
      const stockElement = document.getElementById(`stock-${good}`);
      if (stockElement) {
        const stockPercent = (village.stock[good].current / village.stock[good].capacity) * 100;
        stockElement.textContent = `${village.stock[good].current}/${village.stock[good].capacity}`;
        stockElement.style.width = `${stockPercent}%`;
      }
    }
  }
}
```

---

## 💾 9. Save/Load Sistemi

### **Ekonomi Verisi Kaydetme**
```javascript
class EconomySaveSystem {
  static saveEconomyData() {
    const saveData = {
      villages: {},
      playerEconomy: economyManager.playerEconomy.getSaveData(),
      globalFactors: this.getGlobalFactors(),
      lastUpdate: Date.now()
    };
    
    // Köy verilerini kaydet
    for (const [villageId, village] of economyManager.villages) {
      saveData.villages[villageId] = {
        treasury: village.treasury,
        stock: village.stock,
        production: village.production,
        demand: village.demand,
        development: village.development,
        prices: village.prices
      };
    }
    
    localStorage.setItem('economy_save', JSON.stringify(saveData));
  }
  
  static loadEconomyData() {
    const saveData = JSON.parse(localStorage.getItem('economy_save'));
    
    if (!saveData) return false;
    
    // Köy verilerini yükle
    for (const [villageId, data] of Object.entries(saveData.villages)) {
      const village = economyManager.villages.get(villageId);
      if (village) {
        Object.assign(village.treasury, data.treasury);
        Object.assign(village.stock, data.stock);
        Object.assign(village.production, data.production);
        Object.assign(village.demand, data.demand);
        Object.assign(village.development, data.development);
        Object.assign(village.prices, data.prices);
      }
    }
    
    // Oyuncu verilerini yükle
    economyManager.playerEconomy.loadSaveData(saveData.playerEconomy);
    
    return true;
  }
}
```

---

## 🎯 10. Performans ve Optimizasyon

### **Verimli Güncelleme Sistemi**
```javascript
class OptimizedEconomyEngine {
  constructor() {
    this.updateQueue = new Set();
    this.batchSize = 10;
    this.updateInterval = 1000; // 1 saniye
  }
  
  scheduleUpdate(villageId) {
    this.updateQueue.add(villageId);
  }
  
  processBatch() {
    const batch = Array.from(this.updateQueue).slice(0, this.batchSize);
    
    for (const villageId of batch) {
      const village = economyManager.villages.get(villageId);
      if (village) {
        village.UpdateEconomy(this.updateInterval / 1000);
        this.updateQueue.delete(villageId);
      }
    }
  }
}
```

### **Event-Driven Güncellemeler**
```javascript
// Sadece değişen verileri güncelle
class EventDrivenEconomy {
  constructor() {
    this.eventBus = new EventBus();
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Stok değişimini dinle
    this.eventBus.on('stock:changed', (data) => {
      this.schedulePriceUpdate(data.villageId, data.goodType);
    });
    
    // Talep değişimini dinle
    this.eventBus.on('demand:changed', (data) => {
      this.schedulePriceUpdate(data.villageId, data.goodType);
    });
    
    // Ticaret işlemlerini dinle
    this.eventBus.on('trade:completed', (data) => {
      this.updateBothVillages(data.fromVillage, data.toVillage);
    });
  }
}
```

---

## 📈 11. Test ve Debug Sistemi

### **Ekonomi Test Aracı**
```javascript
class EconomyDebugger {
  static simulateScenario(scenario) {
    switch (scenario) {
      case "drought":
        this.simulateDrought();
        break;
      case "war":
        this.simulateWar();
        break;
      case "good_harvest":
        this.simulateGoodHarvest();
        break;
      case "trade_boom":
        this.simulateTradeBoom();
        break;
    }
  }
  
  static simulateDrought() {
    for (const village of economyManager.villages) {
      village.production.efficiency *= 0.5;
      village.stock.wheat.current *= 0.7;
      village.prices.wheat.current *= 1.5;
    }
  }
  
  static generateEconomyReport() {
    const report = {
      timestamp: Date.now(),
      villages: {},
      summary: {
        totalWealth: 0,
        totalProduction: 0,
        averageHappiness: 0,
        tradeVolume: 0
      }
    };
    
    for (const [villageId, village] of economyManager.villages) {
      report.villages[villageId] = {
        treasury: village.treasury.gold,
        production: village.production.capacity,
        happiness: village.development.happiness,
        security: village.development.security
      };
      
      report.summary.totalWealth += village.treasury.gold;
      report.summary.totalProduction += village.production.capacity;
      report.summary.averageHappiness += village.development.happiness;
    }
    
    report.summary.averageHappiness /= economyManager.villages.size;
    
    return report;
  }
}
```

---

## 🚀 12. Uygulama Öncelikleri

### **Phase 1: Core Sistem (2 Hafta)**
1. ✅ Veri modeli oluşturma
2. ✅ Temel fiyat hesaplama
3. ✅ Köy-oyuncu ticareti
4. ✅ UI entegrasyonu

### **Phase 2: Gelişmiş Özellikler (3 Hafta)**
1. ⏳ Arz-talep dinamikleri
2. ⏳ Gelişim sistemi
3. ⏳ Uzmanlaşma mekanikleri
4. ⏳ Event-driven güncellemeler

### **Phase 3: Optimizasyon (1 Hafta)**
1. ⏳ Performans optimizasyonu
2. ⏳ Save/Load sistemi
3. ⏳ Debug araçları
4. ⏳ Test senaryoları

---

## 📝 Sonuç

Bu sistem, gerçek zamanlı çalışan, modüler ve genişletilebilir bir köy bazlı ekonomi altyapısı sunar. Her köyün kendi ekonomik kararlarını alabildiği, oyuncunun ise bu ekonomilere müdahale edebildiği yaşayan bir dünya yaratır.

**Temel Avantajlar:**
- 🔄 **Gerçek Zamanlı** - 5 saniyede bir güncellenir
- 🏗️ **Modüler** - Her sistem bağımsız çalışır
- 📊 **Veri Odaklı** - Tüm kararlar veriye dayalı
- 🎮 **Oyuncu Etkileşimi** - Oyuncu ekonomiyi yönetebilir
- 🧪 **Test Edilebilir** - Debug ve test araçları dahil

Bu sistem oyununuza gerçekçi ve sürükleyici bir ekonomik derinlik katacaktır.
