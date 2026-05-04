# Inventory ve Kervan Sistemi Analizi
## Eski Oyundan Eksik Özellikler

---

## 📦 **INVENTORY SİSTEMİ**

### **Eski Oyundaki State Yapısı**
```javascript
const state = {
  gold: 80,      // Altın
  food: 5,       // Tahıl
  leather: 0,    // Deri
  iron: 0,       // Demir
  meat: 0,       // Et
  wood: 0,       // Odun
  workers: 0,    // İşçiler
  soldiers: 0,   // Askerler
  armor: 0,      // Zırh
  loyalty: 50,   // Sadakat
  rank: 0,       // Rank
  land: 0,       // Toprak
  ownedVillages: [], // Sahip olunan köyler
  day: 1         // Gün
};
```

### **7 Farklı Mal Türü**
```javascript
const GOODS = {
  food: {name: 'Tahıl', icon: '🌾', base: 8},
  meat: {name: 'Et', icon: '🥩', base: 15},
  leather: {name: 'Deri', icon: '🐂', base: 20},
  iron: {name: 'Demir', icon: '⚒️', base: 30},
  wood: {name: 'Odun', icon: '🪵', base: 5},
  weapon: {name: 'Silah', icon: '⚔️', base: 80},
  armor: {name: 'Zırh', icon: '🛡️', base: 100}
};
```

### **Alım/Satım Sistemi**
```javascript
function buy(good, vId) {
  const v = villages.find(x => x.id == vId);
  const p = getPrice(v, good);
  if (state.gold < p || v.econ[good].supply < 1) {
    notify('❌ Yeterli altın yok veya stok tükendi!');
    return;
  }
  state.gold -= p;
  state[good] = (state[good] || 0) + 1;
  v.econ[good].supply -= 1;
  notify(`✅ ${GOODS[good].icon} ${GOODS[good].name} aldın (${p}🪙)`);
  updateUI();
  renderVillageMenu(v);
}

function sell(good, vId) {
  const v = villages.find(x => x.id == vId);
  if (!state[good] || state[good] <= 0) {
    notify('❌ Satacak mal yok!');
    return;
  }
  const p = getPrice(v, good);
  state.gold += p;
  state[good]--;
  v.econ[good].supply += 1;
  notify(`💰 ${GOODS[good].icon} ${GOODS[good].name} sattın (+${p}🪙)`);
  updateUI();
  renderVillageMenu(v);
}
```

---

## 🐪 **KERVAN SİSTEMİ**

### **Kervan Sisteminin İşleyişi**

#### **1. Yollar ve Ticaret Rotaları**
```javascript
const roads = [];
// Yollar köyleri birbirine bağlar
makeRoad(0, 0, 65, -25);    // Başköy → Yeşilova
makeRoad(0, 0, -55, 42);   // Başköy → Kuzluk
makeRoad(65, -25, 90, 32);  // Yeşilova → Tuzpazarı
// ... daha fazla yol
```

#### **2. Kervan Güvenliği**
- **Eşkıya tehditleri:** Yollardaki eşkıya kampları
- **Güvenli bölgeler:** Şehirler ve kaleler yakınları
- **Risk faktörleri:** Mesafe, eşkıya yoğunluğu, yol güvenliği

#### **3. Kervan Mal Taşımacılığı**
- **Otomatik ticaret:** Köyler arası mal akışı
- **Fiyat farklılıkları:** Uzak köylerde daha yüksek fiyatlar
- **Talep arzı:** Kervanlar eksik malları taşır

---

## 🔍 **YENİ OYUNDA EKSİK OLANLAR**

### **❌ Inventory Sistemi**
- **Mevcut durum:** Sadece gold ve basic stats
- **Eksik:** 7 mal türü, alım/satım, envanter yönetimi

### **❌ Kervan Sistemi**
- **Mevcut durum:** Hiç kervan sistemi yok
- **Eksik:** Ticaret yolları, otomatik ticaret, risk faktörleri

---

## 🚀 **UYGULAMA PLANI**

### **Phase 1: Inventory Sistemi (3 Gün)**

#### **1. State Genişletme**
```javascript
// Yeni oyun state'i
const gameState = {
  // Mevcut özellikler
  gold: 100,
  health: 100,
  level: 1,
  
  // Eski oyundan gelen özellikler
  inventory: {
    food: 5,
    meat: 0,
    leather: 0,
    iron: 0,
    wood: 0,
    weapon: 0,
    armor: 0
  },
  
  // Yeni özellikler
  maxInventory: 50,
  workers: 0,
  soldiers: 0,
  loyalty: 50,
  rank: 0,
  land: 0
};
```

#### **2. Inventory UI**
```javascript
function createInventoryUI() {
  const inventoryPanel = document.createElement('div');
  inventoryPanel.className = 'inventory-panel';
  inventoryPanel.innerHTML = `
    <h3>🎒 Envanter</h3>
    <div class="inventory-grid">
      <div class="inventory-item">
        <span class="item-icon">🌾</span>
        <span class="item-name">Tahıl</span>
        <span class="item-count" id="inv-food">5</span>
      </div>
      <!-- diğer mal türleri -->
    </div>
    <div class="inventory-stats">
      <div>Kapasite: <span id="inv-capacity">5/50</span></div>
      <div>Değer: <span id="inv-value">40🪙</span></div>
    </div>
  `;
}
```

#### **3. Alım/Satım Fonksiyonları**
```javascript
function buyGood(good, villageId, quantity = 1) {
  const village = villages.find(v => v.id === villageId);
  const price = calculatePrice(village, good, quantity);
  
  if (gameState.gold < price) {
    showNotification('❌ Yeterli altın yok!');
    return false;
  }
  
  if (getInventorySpace() < quantity) {
    showNotification('❌ Envanter dolu!');
    return false;
  }
  
  gameState.gold -= price;
  gameState.inventory[good] = (gameState.inventory[good] || 0) + quantity;
  village.economy[good].supply -= quantity;
  
  showNotification(`✅ ${quantity}x ${GOODS[good].name} satın alındı`);
  updateUI();
  return true;
}

function sellGood(good, villageId, quantity = 1) {
  const village = villages.find(v => v.id === villageId);
  
  if (!gameState.inventory[good] || gameState.inventory[good] < quantity) {
    showNotification('❌ Satacak mal yok!');
    return false;
  }
  
  const price = calculatePrice(village, good, quantity);
  
  gameState.gold += price;
  gameState.inventory[good] -= quantity;
  village.economy[good].supply += quantity;
  
  showNotification(`💰 ${quantity}x ${GOODS[good].name} satıldı (+${price}🪙)`);
  updateUI();
  return true;
}
```

### **Phase 2: Kervan Sistemi (4 Gün)**

#### **1. Ticaret Yolları**
```javascript
class TradeRoute {
  constructor(fromVillage, toVillage, distance, danger) {
    this.from = fromVillage;
    this.to = toVillage;
    this.distance = distance;
    this.danger = danger; // 0-100 arası risk
    this.caravans = [];
  }
  
  calculateRisk() {
    let risk = this.danger;
    
    // Eşkıya kampları riski artırır
    bandits.forEach(bandit => {
      const distToRoute = this.distanceToRoute(bandit.x, bandit.z);
      if (distToRoute < 20) {
        risk += bandit.count * 5;
      }
    });
    
    return Math.min(100, risk);
  }
}

// Ticaret yollarını oluştur
const tradeRoutes = [
  new TradeRoute(0, 1, 25, 15),  // Başköy → Yeşilova
  new TradeRoute(0, 2, 35, 25),  // Başköy → Kuzluk
  new TradeRoute(1, 3, 40, 30),  // Yeşilova → Tuzpazarı
  // ... daha fazla rota
];
```

#### **2. Kervan Sınıfı**
```javascript
class Caravan {
  constructor(route, goods) {
    this.route = route;
    this.goods = goods;
    this.position = 0; // 0-1 arası rota üzerindeki konum
    this.speed = 0.01; // saniyedeki ilerleme
    this.status = 'traveling'; // traveling, arrived, destroyed
    this.value = this.calculateValue();
  }
  
  calculateValue() {
    let value = 0;
    for (const [good, quantity] of Object.entries(this.goods)) {
      value += GOODS[good].base * quantity;
    }
    return value;
  }
  
  update(deltaTime) {
    if (this.status !== 'traveling') return;
    
    this.position += this.speed * deltaTime;
    
    if (this.position >= 1) {
      this.status = 'arrived';
      this.deliverGoods();
    } else {
      // Yol üzerinde risk kontrolü
      if (Math.random() < this.route.calculateRisk() / 1000) {
        this.status = 'destroyed';
        this.raidCaravan();
      }
    }
  }
  
  deliverGoods() {
    const toVillage = villages[this.route.to];
    for (const [good, quantity] of Object.entries(this.goods)) {
      toVillage.economy[good].supply += quantity;
    }
    showNotification(`🐪 Kervan ${villages[this.route.to].name}'a ulaştı!`);
  }
  
  raidCaravan() {
    showNotification(`⚔️ Kervan eşkıyalar tarafından basıldı! ${this.value}🪙 kayıp`);
    // Eşkıya kampına ganimet ekle
    const nearestBandit = this.findNearestBandit();
    if (nearestBandit) {
      nearestBandit.loot += Math.floor(this.value * 0.3);
    }
  }
}
```

#### **3. Otomatik Kervan Üretimi**
```javascript
class CaravanManager {
  constructor() {
    this.caravans = [];
    this.lastCaravanTime = 0;
    this.caravanInterval = 30; // 30 saniyede bir
  }
  
  update(deltaTime) {
    // Mevcut kervanları güncelle
    this.caravans.forEach(caravan => caravan.update(deltaTime));
    
    // Yok edilen kervanları temizle
    this.caravans = this.caravans.filter(c => c.status !== 'destroyed');
    
    // Yeni kervan oluştur
    this.lastCaravanTime += deltaTime;
    if (this.lastCaravanTime >= this.caravanInterval) {
      this.generateCaravan();
      this.lastCaravanTime = 0;
    }
  }
  
  generateCaravan() {
    // Rastgele bir rota seç
    const route = tradeRoutes[Math.floor(Math.random() * tradeRoutes.length)];
    
    // Köylerin ihtiyaçlarını analiz et
    const fromVillage = villages[route.from];
    const toVillage = villages[route.to];
    
    // Taşınacak malları belirle
    const goods = {};
    
    // Aşırı stok olan malları taşı
    for (const good in GOODS) {
      const surplus = fromVillage.economy[good].supply - fromVillage.economy[good].target;
      const deficit = toVillage.economy[good].target - toVillage.economy[good].supply;
      
      if (surplus > 0 && deficit > 0) {
        const quantity = Math.min(surplus * 0.3, deficit * 0.5, 10);
        if (quantity > 0) {
          goods[good] = Math.floor(quantity);
        }
      }
    }
    
    // Eğer taşınacak mal varsa kervan oluştur
    if (Object.keys(goods).length > 0) {
      const caravan = new Caravan(route, goods);
      this.caravans.push(caravan);
      
      showNotification(`🐪 Kervan yola çıktı: ${villages[route.from].name} → ${villages[route.to].name}`);
    }
  }
}
```

### **Phase 3: UI ve Entegrasyon (2 Gün)**

#### **1. Kervan UI**
```javascript
function createCaravanUI() {
  const caravanPanel = document.createElement('div');
  caravanPanel.className = 'caravan-panel';
  caravanPanel.innerHTML = `
    <h3>🐪 Kervanlar</h3>
    <div id="caravan-list" class="caravan-list">
      <!-- Kervanlar buraya listelenecek -->
    </div>
    <div class="caravan-stats">
      <div>Aktif Kervan: <span id="active-caravans">0</span></div>
      <div>Toplam Değer: <span id="total-value">0🪙</span></div>
    </div>
  `;
}

function updateCaravanUI() {
  const caravanList = document.getElementById('caravan-list');
  const activeCaravans = document.getElementById('active-caravans');
  const totalValue = document.getElementById('total-value');
  
  let html = '';
  let totalVal = 0;
  
  caravanManager.caravans.forEach(caravan => {
    const progress = Math.floor(caravan.position * 100);
    const fromName = villages[caravan.route.from].name;
    const toName = villages[caravan.route.to].name;
    
    html += `
      <div class="caravan-item ${caravan.status}">
        <div class="caravan-route">${fromName} → ${toName}</div>
        <div class="caravan-progress">${progress}%</div>
        <div class="caravan-status">${getStatusText(caravan.status)}</div>
      </div>
    `;
    
    totalVal += caravan.value;
  });
  
  caravanList.innerHTML = html;
  activeCaravans.textContent = caravanManager.caravans.length;
  totalValue.textContent = `${totalVal}🪙`;
}
```

#### **2. Ana Oyuna Entegrasyon**
```javascript
// game.js içinde
class Game {
  constructor() {
    // ... mevcut kodlar
    this.caravanManager = new CaravanManager();
    this.inventorySystem = new InventorySystem();
  }
  
  update(deltaTime) {
    // ... mevcut güncellemeler
    
    // Yeni sistemleri güncelle
    this.caravanManager.update(deltaTime);
    this.inventorySystem.updateUI();
    updateCaravanUI();
  }
}
```

---

## 🎯 **TEST SENARYOLARI**

### **1. Inventory Testi**
- Mal alıp satma
- Envanter kapasitesi
- Değer hesaplaması

### **2. Kervan Testi**
- Otomatik kervan üretimi
- Risk hesaplamaları
- Eşkıya baskınları

### **3. Ticaret Testi**
- Farklı köyler arası fiyat farkları
- Arz/talep dengesi
- Kervan teslimatları

---

## 📋 **ÖNCELİKLİ GÖREVLER**

1. ✅ **State genişletme** - 7 mal türü ekle
2. ✅ **Inventory UI** - Envanter arayüzü
3. ✅ **Alım/Satım sistemi** - Ticaret fonksiyonları
4. ✅ **Ticaret yolları** - Route sistemi
5. ✅ **Kervan sınıfı** - Otomatik ticaret
6. ✅ **Risk sistemi** - Eşkıya tehditleri
7. ✅ **UI entegrasyonu** - Kervan paneli

---

## 🚀 **HEDEF**

**Eski oyunun en iyi özelliklerini yeni oyuna entegre et:**

- **Zengin inventory sistemi** - 7 mal türü, alım/satım, kapasite
- **Canlı kervan sistemi** - Otomatik ticaret, riskler, kâr
- **Gerçekçi ekonomi** - Arz/talep, mesafe faktörleri
- **Stratejik derinlik** - Ticaret rotaları, risk yönetimi

**Sonuç:** Modern Sandbox RPG + Eski oyunun derinliği = Mükemmel Feodal Simülasyonu
