// ui.js

export function updateUI(state) {
  if (!state) return;

  document.getElementById("hgold").textContent = Math.floor(state.gold);
  document.getElementById("hfood").textContent = Math.floor(state.food);
  document.getElementById("hleather").textContent = state.leather;
  document.getElementById("hiron").textContent = state.iron;
  document.getElementById("hmeat").textContent = state.meat;
  document.getElementById("hwood").textContent = state.wood;

  document.getElementById("hworkers").textContent = state.workers;
  document.getElementById("hsoldiers").textContent = state.soldiers;
  document.getElementById("harmor").textContent = state.armor;

  document.getElementById("hloyalty").textContent = state.loyalty;
  document.getElementById("hland").textContent = state.workers * 2;

  const RANKS = ['Yoksul Çiftçi','Köy Ağası','Sipahi','Subaşı','Komutan','Lord'];
  const RANK_REQ = [0,5,15,30,60,100];

  let rank = 0;
  for (let i = RANK_REQ.length - 1; i >= 0; i--) {
    if (state.soldiers >= RANK_REQ[i]) {
      rank = i;
      break;
    }
  }

  document.getElementById("rankname").textContent = RANKS[rank];
}

let notifTimer = null;

export function notify(msg) {
  const el = document.getElementById("notification");
  el.textContent = msg;
  el.style.opacity = 1;

  clearTimeout(notifTimer);
  notifTimer = setTimeout(() => {
    el.style.opacity = 0;
  }, 3000);
}