# Feodal Dünya Oyun Tasarımı
## Mount & Blade II: Bannerlord Estetiğinde Ortaçağ Simülasyonu

---

## 🎯 Oyun Konusu Özeti

**"Feodal Dünya"** - Bannerlord hissi veren ama tamamen özgün bir feodal açık dünya simülasyonu. Oyuncu küçük bir köyün lordu olarak başlar, tarla ekonomisi yönetir, köylülerin yaşamını organize eder ve feodal dünyada hayatta kalmak için savaşır, ticaret yapar ve diplomasi yürütür.

**Temel Felsefe:**
- Yaşayan dünya: Her NPC gerçek bir amaca ve yaşama döngüsüne sahip
- Stratejik derinlik: Bannerlord tarzı büyük ölçekli savaş ve yönetim
- Ekonomik simülasyon: Gerçekçi arz-talep, üretim zinciri ve fiyat dinamikleri
- Oyuncu ajansı: Kararların dünyayı gerçekten etkilediği sandbox ortamı

---

## 🏗️ Ana Sistemler

### 1. **Dünya Sistemi (World System)**
- **Harita Yönetimi:** Prosedürel veya elle tasarlanmış feodal harita
- **Konum Sistemi:** Köyler, kasabalar, kaleler, tarlalar, yollar
- **Mesafe Sistemi:** Yürüme mesafeleri, seyahat süreleri
- **Coğrafi Özellikler:** Nehirler, ormanlar, dağlar, ovalar
- **İklim ve Mevsim:** Hava durumu, mevsim değişimleri

### 2. **Köy Yönetim Sistemi (Village Management)**
- **Nüfus Yönetimi:** Köylüler, doğumlar, ölümler, göçler
- **Bina Yönetimi:** Evler, depolar, atölyeler, savunma yapıları
- **Altyapı:** Yollar, su kanalları, tarlalar, değirmenler
- **Hizmetler:** Pazar, demirci, değirmenci, taverna
- **Savunma:** Muhafızlar, duvarlar, kuleler

### 3. **AI Davranış Sistemi (AI Behavior System)**
- **Rol Tabanlı AI:** Çiftçi, demirci, tüccar, muhafız, çocuk, yaşlı
- **Günlük Rutinler:** Sabah-öğlen-akşam döngüleri
- **Sosyal İlişkiler:** Aile, arkadaşlık, ticaret ilişkileri
- **Karar Sistemi:** İhtiyaçlara dayalı davranış seçimi
- **Grup Davranışı:** Köy topluluğu olarak hareket etme

### 4. **Ekonomi Sistemi (Economy System)**
- **Üretim Zinciri:** Tarım → İşleme → Ticaret
- **Arz-Talep Dinamiği:** Fiyatlar duruma göre değişir
- **Kaynak Yönetimi:** Gıda, malzeme, para, iş gücü
- **Ticaret Rotaları:** Köyler arası ticaret, karavanlar
- **Vergi ve Gelir:** Köy lordu gelirleri, harcamalar

### 5. **Savaş Sistemi (Combat System)**
- **Büyük Ölçekli Savaşlar:** Bannerlord tarzı ordular
- **Köy Savunması:** Baskınlar, kuşatmalar
- **Askeri Yönetim:** Muhafızlar, milisler, paralı askerler
- **Taktiksel Seçenekler:** Pusu, açık alan savaşı, savunma
- **Savaş Sonuçları:** Esirler, ganimet, moraller

### 6. **UI Sistemi (User Interface)**
- **Stratejik Harita:** Dünya haritası, köy durumu
- **Köy Yönetimi Paneli:** Nüfus, ekonomi, binalar
- **Karar Arayüzü:** Diplomasi, ticaret, savaş seçenekleri
- **Karakter Paneli:** Skill'ler, envanter, ilişkiler
- **Olay Bildirimleri:** Köy olayları, tehditler, fırsatlar

---

## 📊 Veri Modeli / Entity-Component Yapısı

### **Entity Hiyerarşisi**

```javascript
// Temel Entity
class Entity {
  id: string
  type: 'village' | 'character' | 'building' | 'field' | 'army'
  position: Vector3
  components: Map<string, Component>
}

// Component Yapısı
class Component {
  type: string
  data: any
}

// Ana Component'ler
- PositionComponent (x, y, z)
- HealthComponent (health, maxHealth)
- InventoryComponent (items, capacity)
- EconomyComponent (gold, resources)
- AIComponent (behavior, role, schedule)
- BuildingComponent (type, level, capacity)
- RelationshipComponent (relations, factions)
- SkillComponent (skills, experience)
```

### **Özel Entity Tipleri**

```javascript
// Köy Entity
class Village extends Entity {
  components: {
    position: PositionComponent,
    population: PopulationComponent,
    economy: EconomyComponent,
    buildings: BuildingsComponent,
    defense: DefenseComponent,
    diplomacy: DiplomacyComponent
  }
}

// Karakter Entity
class Character extends Entity {
  components: {
    position: PositionComponent,
    ai: AIComponent,
    health: HealthComponent,
    skills: SkillComponent,
    inventory: InventoryComponent,
    relationships: RelationshipComponent
  }
}

// Bina Entity
class Building extends Entity {
  components: {
    position: PositionComponent,
    building: BuildingComponent,
    economy: EconomyComponent,
    production: ProductionComponent
  }
}
```

---

## 🤖 AI Davranış Şeması

### **Rol Tabanlı AI Sistemi**

```javascript
// AI Roller ve Davranışları
const AIBehaviors = {
  farmer: {
    morning: 'goToField',
    day: 'workField',
    evening: 'returnHome',
    night: 'sleep',
    skills: ['farming', 'basicLabor'],
    needs: ['food', 'tools', 'shelter']
  },
  
  blacksmith: {
    morning: 'openForge',
    day: 'craftItems',
    evening: 'closeForge',
    night: 'sleep',
    skills: ['smithing', 'trading'],
    needs: ['iron', 'coal', 'tools']
  },
  
  guard: {
    morning: 'patrolVillage',
    day: 'guardPost',
    evening: 'guardPost',
    night: 'sleep',
    skills: ['combat', 'patrol'],
    needs: ['weapons', 'armor', 'pay']
  },
  
  merchant: {
    morning: 'prepareGoods',
    day: 'tradeInMarket',
    evening: 'countProfits',
    night: 'sleep',
    skills: ['trading', 'negotiation'],
    needs: ['goods', 'caravan', 'routes']
  }
}
```

### **Karar Ağacı Sistemi**

```javascript
// AI Karar Mantığı
class AIDecisionTree {
  evaluateNeeds(character) {
    // 1. Temel ihtiyaçları kontrol et (açlık, sağlık, güvenlik)
    // 2. Sosyal ihtiyaçları (ail, arkadaşlar, statü)
    // 3. Ekonomik ihtiyaçlar (para, malzeme, ticaret)
    // 4. Uzun vadeli hedefler (skill gelişimi, aile kurma)
  }
  
  selectAction(character, needs) {
    // İhtiyaçlara göre en uygun eylemi seç
    // Öncelik: hayatta kalma > sosyal > ekonomik > kişisel
  }
}
```

---

## 📋 Görev Akışı Sistemi

### **Oynanabilir Görev Tipleri**

```javascript
// Görev Kategorileri
const QuestTypes = {
  // Yönetim Görevleri
  management: {
    'buildHouse': 'Ev inşa et',
    'plantCrops': 'Tarla ek',
    'hireGuard': 'Muhafız işe al',
    'collectTaxes': 'Vergi topla'
  },
  
  // Savunma Görevleri
  defense: {
    'defendVillage': 'Köyü savun',
    'repelRaiders': 'Baskınçıları püskürt',
    'buildWalls': 'Sur inşa et',
    'trainMilitia': 'Milis eğit'
  },
  
  // Ticaret Görevleri
  trade: {
    'buyGoods': 'Mal al',
    'sellHarvest': 'Hasat sat',
    'establishRoute': 'Ticaret rotası kur',
    'negotiatePrice': 'Fiyat pazarlık et'
  },
  
  // Diplomasi Görevleri
  diplomacy: {
    'makeAlliance': 'İttifak kur',
    'declareWar': 'Savaş ilan et',
    'arrangeMarriage': 'Evlilik ayarla',
    'resolveConflict': 'Çatışma çöz'
  }
}
```

### **Dinamik Görev Üretimi**

```javascript
// Görev Üretim Sistemi
class QuestGenerator {
  generateQuests(village) {
    // Köy durumuna göre görevler üret
    // - Açlık varsa: tarla görevleri
    // - Tehdit varsa: savunma görevleri  
    // - Zenginlik varsa: ticaret görevleri
    // - İlişkiler zayıfsa: diplomasi görevleri
  }
}
```

---

## 🎮 İlk Oynanabilir Demo (Vertical Slice) Planı

### **Demo Kapsamı**

**Harita:**
- 1 köy (oyuncunun köyü)
- 3 tarla
- 1 değirmen
- 1 pazar alanı
- 1 komşu köy (düşman/neutral)
- Yollar ve orman alanları

**Karakterler:**
- Oyuncu (köy lordu)
- 3 çiftçi NPC
- 1 demirci NPC
- 1 muhafız NPC
- 1 tüccar NPC
- 5 köylü (çocuk/yaşlı)

**Sistemler:**
- Temel köy yönetimi
- Tarım ekonomisi
- AI davranışları
- Basit savaş sistemi
- UI arayüzleri

**Oynanabilir Senaryolar:**
1. **Günlük Yaşam:** Sabah tarla, öğlen üretim, akşam köy
2. **Ticaret:** Hasat sat, mal al, fiyat pazarlık et
3. **Savunma:** Baskın savunma, muhafız yönetimi
4. **Yönetim:** Ev inşa et, vergi topla, nüfus yönetimi

---

## 🔧 Teknik Görev Listesi

### **Phase 1: Temel Altyapı (2 Hafta)**
- [ ] Entity-Component sistemi kurulumu
- [ ] Temel dünya harita sistemi
- [ ] Karakter hareket ve animasyon
- [ ] Basit AI davranış sistemi
- [ ] Temel UI çerçevesi

### **Phase 2: Köy Sistemi (3 Hafta)**
- [ ] Köy entity sistemi
- [ ] Bina inşa etme sistemi
- [ ] Nüfus yönetimi
- [ ] Günlük rutin AI
- [ ] Köy yönetim UI

### **Phase 3: Ekonomi Sistemi (2 Hafta)**
- [ ] Tarım üretim sistemi
- [ ] Arz-talep fiyat sistemi
- [ ] Ticaret arayüzü
- [ ] Kaynak yönetimi
- [ ] Vergi ve gelir sistemi

### **Phase 4: Savaş Sistemi (2 Hafta)**
- [ ] Basit savaş mekanikleri
- [ ] Muhafız AI sistemi
- [ ] Baskın senaryoları
- [ ] Savunma yapıları
- [ ] Savaş UI

### **Phase 5: İçerik ve Polishing (2 Hafta)**
- [ ] Görev sistemi
- [ ] Diplomasi mekanikleri
- [ ] Skill sistemi
- [ ] Ses ve müzik
- [ ] Optimizasyon

### **Phase 6: Demo Test ve İyileştirme (1 Hafta)**
- [ ] Vertical slice test
- [ ] Bug fixing
- [ ] Performans optimizasyonu
- [ ] Kullanıcı geri bildirimleri
- [ ] Final polis

---

## 🎯 Başarı Metrikleri

**Teknik Hedefler:**
- 60 FPS performans
- Modüler kod yapısı
- Genişletilebilir sistemler
- Temiz documentation

**Oyun Hedefleri:**
- Bannerlord hissi veren stratejik derinlik
- Yaşayan dünya hissi
- Bağımlılık yaratıcı gameplay
- 30+ saat oynanabilirlik (demo için 2-3 saat)

**Kullanıcı Hedefleri:**
- Strateji oyunu sevenler
- Sandbox simülasyon hayranları
- Medieval/RPG oyuncuları
- Bannerlord benzeri oyun arayanlar

---

## 🚀 Sonraki Adımlar

Bu tasarım dokümanı, mevcut projenizin temelini alarak Bannerlord estetiğinde tamamen özgün bir feodal dünya oyunu oluşturmak için yol haritası sunar. Mevcut Three.js tabanlı altyapınızı kullanarak bu sistemleri adım adım implemente edebilirsiniz.

**İlk olarak Entity-Component sistemini kurarak başlayın, sonra köy yönetimi ve AI sistemlerini ekleyerek demo'yu oluşturun.**
