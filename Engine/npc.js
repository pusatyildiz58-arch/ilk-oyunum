// npc.js

export function createNPC(scene) {
  // 🧍 NPC gövde
  const geometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
  const material = new THREE.MeshStandardMaterial({ color: 0x5a3a1a });

  const npc = new THREE.Mesh(geometry, material);

  npc.castShadow = true;

  // 🌍 random spawn
  npc.position.x = Math.random() * 20 - 10;
  npc.position.z = Math.random() * 20 - 10;
  npc.position.y = 0.6;

  // 🧠 AI data
  npc.userData = {
    speed: 0.02 + Math.random() * 0.03,
    dir: Math.random() * Math.PI * 2,
    timer: Math.random() * 5
  };

  scene.add(npc);

  return npc;
}

// 🤖 NPC update (hareket ettirir)
export function updateNPC(npc) {
  if (!npc) return;

  npc.userData.timer -= 0.016;

  if (npc.userData.timer <= 0) {
    npc.userData.dir = Math.random() * Math.PI * 2;
    npc.userData.timer = 2 + Math.random() * 4;
  }

  npc.position.x += Math.cos(npc.userData.dir) * npc.userData.speed;
  npc.position.z += Math.sin(npc.userData.dir) * npc.userData.speed;
}