# Eski vs Yeni Oyun Karşılaştırması
## "Toprak ve Kılıç" Eski Sürümü

---

## 📊 **KARŞILAŞTIRMA TABLOSU**

| Özellik | Eski Oyun | Yeni Oyun | Durum |
|---------|-----------|-----------|-------|
| **Oyun Adı** | Toprak ve Kılıç | Sandbox RPG | ✅ Farklı |
| **UI Tasarımı** | Medieval Georgia serif | Modern UI | ✅ Geliştirilmiş |
| **Ekonomi Sistemi** | Arz/Talep dinamikleri | Sandbox RPG ekonomisi | ⚠️ **KAYIP** |
| **Dünya Boyutu** | 320x320, 8 köy, 2 şehir | Daha küçük alan | ❌ **KÜÇÜLMÜŞ** |
| **NPC Davranışları** | Gerçekçi yürüme, animasyon | Basit AI | ⚠️ **KAYIP** |
| **Etkileşim Sistemi** | Menü bazlı, detaylı | Basit etkileşim | ⚠️ **KAYIP** |
| **Savaş Sistemi** | Ordular, baskınlar | Savaş sistemi yok | ❌ **KALDIRILMIŞ** |
| **Gün/Gece Döngüsü** | Smooth geçişler | Döngü yok | ❌ **KALDIRILMIŞ** |
| **Minimap** | Gerçek zamanlı | Minimap mevcut | ✅ Korunmuş |
| **Rank/Sistem** | 6 rank, sadakat | Level sistemi | ⚠️ **FARKLI** |

---

## 🔍 **ESKİ OYUNUN GÜÇLÜ ÖZELLİKLERİ**

### ✅ **Gelişmiş Ekonomi Sistemi**
```javascript
// Arz/Talep dinamikleri
function getPrice(v, good) {
  const e = v.econ[good];
  const ratio = e.supply / Math.max(1, e.target);
  const f = Math.max(0.3, Math.min(4, 2.2 - ratio));
  return Math.max(1, Math.round(GOODS[good].base * f));
}

// 7 farklı mal türü
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

### ✅ **Gerçekçi NPC Davranışları**
```javascript
function updateNPCs(dt, gt) {
  npcs.forEach(n => {
    if(n.wait > 0) { n.wait -= dt; return; }
    const dx = n.tx - n.g.position.x, dz = n.tz - n.g.position.z, d = Math.hypot(dx, dz);
    if(d < .6) {
      n.wait = 2 + Math.random() * 5;
      const r = 8 + Math.random() * 16, a = Math.random() * Math.PI * 2;
      n.tx = n.hx + Math.cos(a) * r; n.tz = n.hz + Math.sin(a) * r;
    } else {
      n.g.position.x += dx/d * n.spd * dt;
      n.g.position.z += dz/d * n.spd * dt;
      n.g.rotation.y = Math.atan2(dx, dz);
      // Animasyonlar
      const sw = Math.sin(gt * 6 + n.ph) * .32;
      n.lL.rotation.x = sw; n.lR.rotation.x = -sw;
    }
  });
}
```

### ✅ **Detaylı Etkileşim Menüleri**
```javascript
function renderVillageMenu(v) {
  // Arz/Talep göstergeli pazar
  for(const g in GOODS) {
    const e = v.econ[g];
    const p = getPrice(v, g);
    const pct = Math.min(100, e.supply/e.target * 100);
    const col = pct > 65 ? '#5a3' : pct > 30 ? '#b84' : '#c44';
    // Görsel bar ile stok durumu
  }
  
  // İş seçenekleri
  <button onclick="workFarm()">💪 Tarlada çalış (+5 🌾)</button>
  <button onclick="hireWorker(${v.id})">👷 İşçi kirala (15 🪙)</button>
  <button onclick="recruitSoldier(${v.id})">🪖 Asker topla (25 🪙)</button>
  <button onclick="talkVillager(${v.id})">Köylüyle konuş</button>
}
```

### ✅ **Savaş ve Baskın Sistemi**
```javascript
function startBattle() {
  const pp = state.soldiers + Math.floor(state.armor * .5);
  const ep = currentEnemy;
  const win = Math.random() * (pp + 1) > Math.random() * (ep + 1);
  if(win) {
    const loot = 25 + Math.floor(Math.random() * 50);
    const loss = Math.max(0, Math.floor(currentEnemy * .2));
    state.gold += loot;
    state.soldiers = Math.max(0, state.soldiers - loss);
    state.loyalty = Math.min(100, state.loyalty + 5);
  }
}
```

### ✅ **Gün/Gece Döngüsü**
```javascript
function updateDayNight(dt) {
  dayTime = (dayTime + dt) % DAY;
  const t = dayTime / DAY;
  const sinT = Math.sin(t * Math.PI);
  const skyL = Math.max(.03, .05 + sinT * .32);
  scene3.background.setHSL(.57, .45, skyL);
  scene3.fog.color.setHSL(.57, .38, skyL * .9);
  ambLight.intensity = .15 + sinT * .65;
  sunLight.intensity = .05 + sinT * .9;
  const phase = t < .25 ? 'Şafak' : t < .5 ? 'Gündüz' : t < .75 ? 'İkindi' : 'Gece';
  const icon = t < .25 ? '🌅' : t < .5 ? '☀️' : t < .75 ? '🌆' : '🌙';
}
```

---

## 🎮 **ESKİ OYUNUN DÜNYASI**

### **Köy Tipleri ve Özellikleri**
```javascript
const VILLAGE_DATA = [
  {x: 0, z: 0, name: 'Başköy', type: 'farming'},
  {x: 65, z: -25, name: 'Yeşilova', type: 'farming'},
  {x: -55, z: 42, name: 'Kuzluk', type: 'farming'},
  {x: 90, z: 32, name: 'Tuzpazarı', type: 'trade'},
  {x: -75, z: -32, name: 'Demircik', type: 'mining'},
  {x: 32, z: 78, name: 'Karlıköy', type: 'farming'},
  {x: -32, z: -68, name: 'Sultanköy', type: 'trade'},
  {x: 55, z: -78, name: 'Gümüşlü', type: 'mining'}
];
```

### **Özel Ekonomi Özellikleri**
- **Farming köyleri:** Gıda üretimi, hayvancılık
- **Trade köyleri:** Ticaret, mal dağıtımı
- **Mining köyleri:** Demir, silah, zırh üretimi

### **Bina Çeşitliliği**
- Ev, çiftlik, pazar, demirci
- Kuyu, tarla, ahır
- Şehir duvarları, kuleler

---

## 🚀 **YENİ OYUNA EKLENECEK ÖZELLİKLER**

### 🔥 **ÖNCELİKLİ - 1. Sıra**

#### **1. Gelişmiş Ekonomi Sistemi**
- [ ] Arz/Talep dinamikleri
- [ ] 7 mal türü sistemi
- [ ] Fiyat değişimleri
- [ ] Stok göstergeli pazar

#### **2. Gerçekçi NPC Davranışları**
- [ ] Rastgele hedefler
- [ ] Yürüme animasyonları
- [ ] Bekleme süreleri
- [ ] Ev sahipliği

#### **3. Detaylı Etkileşim Menüleri**
- [ ] Arz/Talep göstergeli satın alma/satma
- [ ] İş seçenekleri (tarla çalışma, işçi kiralama)
- [ ] Köylü konuşmaları
- [ ] Görsel geri bildirimler

### 🔥 **ÖNCELİKLİ - 2. Sıra**

#### **4. Gün/Gece Döngüsü**
- [ ] Smooth gökyüzü renk geçişleri
- [ ] Işık şiddeti değişimleri
- [ ] Zaman göstergesi
- [ ] Phase göstergesi (Şafak, Gündüz, İkindi, Gece)

#### **5. Savaş ve Baskın Sistemi**
- [ ] Eşkıya kampları
- [ ] Ordu sistemi
- [ ] Baskın mekanikleri
- [ ] Ganimet ve kayıp sistemi

#### **6. Rank ve Sadakat Sistemi**
- [ ] 6 rank seviyesi
- [ ] Sadakat puanı
- [ ] Kral hizmetleri
- [ ] Toprak sahipliği

---

## 🛠️ **TEKNİK UYGULAMA PLANI**

### **Phase 1: Ekonomi Sistemi (1 Hafta)**
```javascript
// 1. GOODS objesini oluştur
const GOODS = {
  food: {name: 'Tahıl', icon: '🌾', base: 8},
  meat: {name: 'Et', icon: '🥩', base: 15},
  // ... diğer mallar
};

// 2. Arz/Talep fonksiyonları
function getPrice(village, good) { /* ... */ }
function econTick(village, dt) { /* ... */ }

// 3. Pazar menüsü
function renderMarketMenu(village) { /* ... */ }
```

### **Phase 2: NPC Davranışları (1 Hafta)**
```javascript
// 1. NPC hareket sistemi
function updateNPCs(dt, gameTime) {
  npcs.forEach(npc => {
    // Rastgele hedef belirleme
    // Yürüme animasyonları
    // Bekleme süreleri
  });
}

// 2. NPC oluşturma
function createNPC(x, z, villageId) {
  // NPC mesh ve animasyonlar
}
```

### **Phase 3: Etkileşim Menüleri (1 Hafta)**
```javascript
// 1. Gelişmiş köy menüsü
function renderVillageMenu(village) {
  // Arz/Talep göstergeleri
  // İş seçenekleri
  // Köylü konuşmaları
}

// 2. Satın alma/satma sistemi
function buyGood(good, villageId) { /* ... */ }
function sellGood(good, villageId) { /* ... */ }
```

### **Phase 4: Gün/Gece Döngüsü (3 Gün)**
```javascript
// 1. Zaman sistemi
let dayTime = 0;
const DAY_DURATION = 200; // saniye

function updateDayNight(dt) {
  // Gökyüzü renkleri
  // Işık şiddeti
  // Zaman göstergesi
}
```

### **Phase 5: Savaş Sistemi (1 Hafta)**
```javascript
// 1. Eşkıya kampları
function createBanditCamp(x, z) { /* ... */ }

// 2. Savaş mekanikleri
function startBattle(enemyCount) { /* ... */ }

// 3. Baskın sistemi
function raidBanditCamp(camp) { /* ... */ }
```

---

## 📋 **TEST VE İYİLEŞTİRME**

### **Test Senaryoları**
1. **Ekonomi Testi:** Fiyat değişimleri, stok sistemleri
2. **NPC Testi:** Hareket davranışları, animasyonlar
3. **Etkileşim Testi:** Menü açma, işlem yapma
4. **Gün/Gece Testi:** Smooth geçişler, ışık değişimleri
5. **Savaş Testi:** Baskın mekanikleri, sonuçları

### **Performans Optimizasyonu**
- NPC update'leri optimize et
- Ekonomi tick'leri ayarla
- Render performansını kontrol et

---

## 🎯 **HEDEF**

Eski oyunun en iyi özelliklerini yeni oyuna entegre ederek:
- **Daha zengin ekonomi sistemi**
- **Gerçekçi dünya hissi**
- **Gelişmiş etkileşimler**
- **Stratejik derinlik**

**Sonuç:** Modern UI + Eski oyunun derinliği = Mükemmel Feodal Simülasyonu
