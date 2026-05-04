const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth/window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Zemin
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(200,200),
  new THREE.MeshBasicMaterial({color:0x2c2c2c})
);
ground.rotation.x = -Math.PI/2;
scene.add(ground);

// Köy (test objesi)
const village = new THREE.Mesh(
  new THREE.BoxGeometry(3,3,3),
  new THREE.MeshBasicMaterial({color:0x55aa55})
);
village.position.set(5,1.5,0);
scene.add(village);

// oyuncu
const player = new THREE.Mesh(
  new THREE.SphereGeometry(1,16,16),
  new THREE.MeshBasicMaterial({color:0xffcc00})
);
player.position.y = 1;
scene.add(player);

camera.position.set(0,10,10);
camera.lookAt(0,0,0);