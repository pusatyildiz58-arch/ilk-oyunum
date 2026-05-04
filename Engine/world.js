export function createWorld(scene) {

  const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);

  const pos = groundGeo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);

    const height =
      Math.sin(x * 0.05) * 1.5 +
      Math.cos(y * 0.05) * 1.5 +
      Math.sin((x + y) * 0.02) * 2;

    pos.setZ(i, height);
  }

  groundGeo.computeVertexNormals();

  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshLambertMaterial({ color: 0x3d5f2f })
  );

  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  scene.add(ground);

  spawnForest(scene);
  spawnMountains(scene);
  spawnFields(scene);
  spawnRoad(scene);
}

// 🌲 FOREST
function spawnForest(scene) {
  for (let i = 0; i < 120; i++) {
    const x = Math.random() * 180 - 90;
    const z = Math.random() * 180 - 90;

    if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;

    const tree = new THREE.Mesh(
      new THREE.ConeGeometry(1, 4, 6),
      new THREE.MeshLambertMaterial({ color: 0x1f5a2a })
    );

    tree.position.set(x, 2, z);
    scene.add(tree);
  }
}

// 🪨 MOUNTAIN
function spawnMountains(scene) {
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * 160 - 80;
    const z = Math.random() * 160 - 80;

    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2 + Math.random() * 3),
      new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
    );

    rock.position.set(x, 1, z);
    scene.add(rock);
  }
}

// 🌾 FIELDS (TEK FONKSİYON!)
function spawnFields(scene) {
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * 60 - 30;
    const z = Math.random() * 60 - 30;

    const field = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.1, 2),
      new THREE.MeshLambertMaterial({ color: 0x6b8f3a })
    );

    field.position.set(x, 0.05, z);
    scene.add(field);
  }
}

// 🛣️ ROAD
function spawnRoad(scene) {
  const path = [
    { x: -80, z: 0 },
    { x: -40, z: 10 },
    { x: 0, z: 0 },
    { x: 40, z: -10 },
    { x: 80, z: 0 }
  ];

  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];

    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.sqrt(dx * dx + dz * dz);

    const road = new THREE.Mesh(
      new THREE.BoxGeometry(len, 0.05, 3),
      new THREE.MeshLambertMaterial({ color: 0x8b6b3a })
    );

    road.position.set((a.x + b.x) / 2, 0.02, (a.z + b.z) / 2);
    road.rotation.y = Math.atan2(dx, dz);

    scene.add(road);
  }
}