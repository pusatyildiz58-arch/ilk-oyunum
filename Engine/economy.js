let gameData = {
  gold: 50,
  food: 20,
  workers: 0,
  workerCost: 10,
  lastUpdate: Date.now()
};

// 💾 SAVE
function saveGame() {
  localStorage.setItem("gameData", JSON.stringify(gameData));
}

// 📥 LOAD
function loadGame() {
  const data = localStorage.getItem("gameData");
  if (data) {
    gameData = JSON.parse(data);
  }
}

// ⏱️ TICK
function tickEconomy() {
  const now = Date.now();
  const delta = (now - gameData.lastUpdate) / 1000;

  gameData.food += gameData.workers * 2 * delta;
  gameData.gold += gameData.workers * 1 * delta;

  gameData.lastUpdate = now;

  updateUI(
    Math.floor(gameData.gold),
    Math.floor(gameData.food),
    gameData.workers
  );

  saveGame();
}

// 👷 WORKER AL
function buyWorker() {
  if (gameData.food >= gameData.workerCost) {
    gameData.food -= gameData.workerCost;
    gameData.workers++;

    // 📈 scaling cost
    gameData.workerCost = Math.floor(gameData.workerCost * 1.4);

    saveGame();
  } else {
    alert("Yemek yetmez gardaccım 😄");
  }
}

// 🪙 MANUEL GELİR
function gatherGold() {
  gameData.gold += 5;
  saveGame();
}

// 🚀 INIT
function initEconomy() {
  loadGame();

  setInterval(() => {
    tickEconomy();
  }, 1000);
}

export {
  initEconomy,
  buyWorker,
  gatherGold,
  gameData
};