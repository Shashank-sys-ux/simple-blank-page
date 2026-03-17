import * as THREE from 'three';

let scene, camera, renderer, sunLight, ambLight, clouds, animals;

export function initWorld() {
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('world'), antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 30, 120);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 2.5, 10);

  // LIGHTING
  sunLight = new THREE.DirectionalLight(0xffffff, 1.6);
  sunLight.position.set(15, 25, 5);
  sunLight.castShadow = true;
  scene.add(sunLight);

  // SUN VISUAL
  const sunGeo = new THREE.BoxGeometry(8, 8, 0.5);
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xFFEA00 });
  const sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.set(40, 40, -80);
  sunMesh.rotation.y = -Math.PI / 4;
  sunMesh.rotation.x = Math.PI / 8;
  scene.add(sunMesh);

  ambLight = new THREE.AmbientLight(0x6688aa, 0.6);
  scene.add(ambLight);
  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x5D8A3C, 0.5);
  scene.add(hemiLight);

  // GROUND
  const groundGeo = new THREE.PlaneGeometry(300, 300, 1, 1);
  const groundMat = new THREE.MeshLambertMaterial({ color: 0x5D8A3C });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);

  // DIRT LAYER
  for (let x = -15; x <= 15; x += 2) {
    const b = makeBlock(0x8B6340, 2, 0.5, 300);
    b.position.set(x * 2, -0.3, -50);
    scene.add(b);
  }

  buildGrassBlocks();
  buildTrees();
  buildVillage();
  buildPaths();
  buildOres();
  clouds = buildClouds();
  animals = buildAnimals();

  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  });

  return { scene, camera, renderer, clouds, animals };
}

function makeBlock(color, w = 1, h = 1, d = 1) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshLambertMaterial({ color });
  return new THREE.Mesh(geo, mat);
}

function buildGrassBlocks() {
  const positions = [
    [-3,0,-5],[3,0,-5],[5,0,-8],[-6,0,-8],[8,0,-12],[-9,0,-12],
    [4,0,-18],[-4,0,-18],[6,0,-25],[-7,0,-25],[3,0,-32],[-3,0,-32],
    [8,0,-40],[-8,0,-40],[5,0,-48],[-5,0,-48],[2,0,-55],[-2,0,-55],
    [10,0,-62],[-10,0,-62],[0,0,-70],[7,0,-78],[-7,0,-78],
    [15,0,-10],[-15,0,-10],[18,0,-30],[-18,0,-30],[20,0,-50],[-20,0,-50],
    [16,0,-70],[-16,0,-70],[25,0,-20],[-25,0,-20],[22,0,-45],[-22,0,-45]
  ];
  positions.forEach(([x, y, z]) => {
    const b = makeBlock(0x5D8A3C, 1, 1, 1);
    b.position.set(x, y, z);
    b.castShadow = true; b.receiveShadow = true;
    scene.add(b);
    const top = makeBlock(0x7FC47F, 1, 0.12, 1);
    top.position.set(x, y + 0.56, z);
    scene.add(top);
  });
}

function addTree(x, z) {
  for (let i = 0; i < 4; i++) {
    const b = makeBlock(0x7E6348, 0.8, 1, 0.8);
    b.position.set(x, i + 0.5, z);
    b.castShadow = true;
    scene.add(b);
  }
  const leafPositions = [
    [0,5,0],[1,4,0],[-1,4,0],[0,4,1],[0,4,-1],
    [1,3,0],[-1,3,0],[0,3,1],[0,3,-1],[1,3,1],[-1,3,-1],[1,3,-1],[-1,3,1],
    [0,3,0],[0,6,0]
  ];
  leafPositions.forEach(([lx, ly, lz]) => {
    const leaf = makeBlock(0x3d6028, 0.85, 0.85, 0.85);
    leaf.position.set(x + lx, ly, z + lz);
    scene.add(leaf);
  });
}

function buildTrees() {
  const treeCoords = [
    [-8,-15],[8,-15],[-12,-25],[12,-25],[-6,-35],[10,-35],[-10,-45],[6,-45],
    [-8,-55],[8,-55],[-12,-65],[12,-65],[-7,-75],[7,-75],
    [-20,-10],[20,-10],[-25,-35],[25,-35],[-18,-55],[18,-55],
    [-30,-20],[30,-20],[-28,-50],[28,-50],[-15,-85],[15,-85],
    [0,-95],[-22,-70],[22,-70],[14,-5],[-14,-5]
  ];
  treeCoords.forEach(([x, z]) => addTree(x, z));
}

function addHouse(x, z) {
  const wall = makeBlock(0xC4A061, 5, 3, 5);
  wall.position.set(x, 1.5, z);
  wall.castShadow = true; wall.receiveShadow = true;
  scene.add(wall);
  const roof = makeBlock(0xCC2222, 5.5, 0.6, 5.5);
  roof.position.set(x, 3.3, z);
  scene.add(roof);
  const roof2 = makeBlock(0xAA1111, 4, 0.8, 4);
  roof2.position.set(x, 4, z);
  scene.add(roof2);
  const door = makeBlock(0x5C3A1A, 0.8, 1.8, 0.1);
  door.position.set(x, 0.9, z + 2.55);
  scene.add(door);
  const win = makeBlock(0x4a9fd4, 0.9, 0.9, 0.1);
  win.position.set(x + 1.2, 1.8, z + 2.55);
  scene.add(win);
  const win2 = makeBlock(0x4a9fd4, 0.9, 0.9, 0.1);
  win2.position.set(x - 1.2, 1.8, z + 2.55);
  scene.add(win2);
}

function addTower(x, z) {
  const wall = makeBlock(0x888888, 4, 8, 4);
  wall.position.set(x, 4, z);
  wall.castShadow = true; wall.receiveShadow = true;
  scene.add(wall);
  const roof = makeBlock(0x555555, 4.5, 1, 4.5);
  roof.position.set(x, 8.5, z);
  scene.add(roof);
  // crenellations
  for (let cx = -1.5; cx <= 1.5; cx += 1.5) {
    for (let cz = -1.5; cz <= 1.5; cz += 1.5) {
      if (Math.abs(cx) === 1.5 || Math.abs(cz) === 1.5) {
        const c = makeBlock(0x666666, 0.6, 0.8, 0.6);
        c.position.set(x + cx, 9.4, z + cz);
        scene.add(c);
      }
    }
  }
}

function addChurch(x, z) {
  // Main hall
  const hall = makeBlock(0xC4A061, 6, 4, 8);
  hall.position.set(x, 2, z);
  hall.castShadow = true;
  scene.add(hall);
  // Steeple
  const steeple = makeBlock(0x888888, 2, 6, 2);
  steeple.position.set(x, 5, z - 2);
  scene.add(steeple);
  const top = makeBlock(0x555555, 2.5, 0.5, 2.5);
  top.position.set(x, 8, z - 2);
  scene.add(top);
  // Big door
  const door = makeBlock(0x5C3A1A, 1.4, 2.5, 0.1);
  door.position.set(x, 1.25, z + 4.05);
  scene.add(door);
  // Roof
  const roof = makeBlock(0xCC2222, 6.5, 0.8, 8.5);
  roof.position.set(x, 4.4, z);
  scene.add(roof);
}

function addWell(x, z) {
  // Base
  const b1 = makeBlock(0x888888, 2.5, 1, 2.5);
  b1.position.set(x, 0.5, z);
  scene.add(b1);
  // Hollow center
  const water = makeBlock(0x2244CC, 1.5, 0.3, 1.5);
  water.position.set(x, 0.85, z);
  scene.add(water);
  // Posts
  for (let px of [-0.8, 0.8]) {
    const post = makeBlock(0x7E6348, 0.3, 2.5, 0.3);
    post.position.set(x + px, 2.25, z);
    scene.add(post);
  }
  // Cross bar
  const bar = makeBlock(0x7E6348, 2, 0.2, 0.2);
  bar.position.set(x, 3.5, z);
  scene.add(bar);
  // Roof
  const roof = makeBlock(0xCC2222, 2.5, 0.3, 2.5);
  roof.position.set(x, 3.7, z);
  scene.add(roof);
}

function addFence(x1, z1, x2, z2) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.sqrt(dx * dx + dz * dz);
  const steps = Math.floor(len / 1.5);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t;
    const pz = z1 + dz * t;
    const post = makeBlock(0x7E6348, 0.2, 1.2, 0.2);
    post.position.set(px, 0.6, pz);
    scene.add(post);
    if (i < steps) {
      const mx = px + dx / steps * 0.5;
      const mz = pz + dz / steps * 0.5;
      const rail = makeBlock(0x9E7E58, 1.2, 0.15, 0.15);
      rail.position.set(mx, 0.9, mz);
      scene.add(rail);
      const rail2 = makeBlock(0x9E7E58, 1.2, 0.15, 0.15);
      rail2.position.set(mx, 0.4, mz);
      scene.add(rail2);
    }
  }
}

function buildVillage() {
  const houseCoords = [
    [-10,-12],[10,-14],[-9,-28],[11,-30],[-10,-46],[10,-44],
    [-20,-18],[20,-22],[-22,-38],[22,-40],[-15,-58],[15,-58],
    [-30,-14],[30,-14],[-30,-34],[30,-34],[-28,-54],[28,-54],
    [-18,-72],[18,-72],[-10,-82],[10,-82],
    [-35,-25],[35,-25],[-35,-48],[35,-48],
    [0,-30],[0,-52],[0,-72]
  ];
  houseCoords.forEach(([x, z]) => addHouse(x, z));
  
  // Towers
  [[-20,-8],[20,-8],[0,-90],[-25,-60],[25,-60],[-35,-35],[35,-35],[0,-5]].forEach(([x, z]) => addTower(x, z));
  
  // Churches
  addChurch(-15, -48);
  addChurch(15, -68);
  
  // Wells
  addWell(0, -20);
  addWell(0, -60);
  addWell(-20, -40);
  
  // Fences along paths
  addFence(-3, 5, -3, -90);
  addFence(3, 5, 3, -90);

  // Store animal spawn data
  window._houseCoords = houseCoords;
}

function buildPaths() {
  for (let i = 0; i < 90; i++) {
    const b = makeBlock(0x888877, 1.2, 0.08, 1.2);
    b.position.set((Math.random() - 0.5) * 2, 0.06, -i * 1.1 + 5);
    scene.add(b);
  }
  // Side paths
  for (let j = 0; j < 6; j++) {
    const z = -10 - j * 14;
    for (let i = 0; i < 12; i++) {
      const b = makeBlock(0x888877, 1.2, 0.08, 1.2);
      b.position.set(2 + i * 1.3, 0.06, z + (Math.random() - 0.5) * 0.5);
      scene.add(b);
      const b2 = makeBlock(0x888877, 1.2, 0.08, 1.2);
      b2.position.set(-2 - i * 1.3, 0.06, z + (Math.random() - 0.5) * 0.5);
      scene.add(b2);
    }
  }
}

function buildOres() {
  const oreCoords = [
    [5,0,-10],[-5,0,-10],[6,1,-22],[-7,1,-28],[4,0,-38],[-6,1,-45],[5,0,-55],[-7,1,-65],
    [15,0,-20],[-15,0,-30],[18,1,-50],[-18,1,-60]
  ];
  oreCoords.forEach(([x, y, z]) => {
    const b = makeBlock(0x1a4a8b, 1, 1, 1);
    b.position.set(x, y, z);
    scene.add(b);
  });
}

function buildClouds() {
  const cloudArr = [];
  for (let i = 0; i < 18; i++) {
    const w = 6 + Math.random() * 8;
    const cg = new THREE.BoxGeometry(w, 0.8, 3 + Math.random() * 3);
    const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.88 });
    const cloud = new THREE.Mesh(cg, cm);
    cloud.position.set((Math.random() - 0.5) * 70, 15 + Math.random() * 6, -Math.random() * 100);
    scene.add(cloud);
    cloudArr.push({ mesh: cloud, speed: 0.004 + Math.random() * 0.006 });
  }
  return cloudArr;
}

function addAnimal(type, x, z, bounds) {
  const group = new THREE.Group();
  if (type === 'sheep') {
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const headMat = new THREE.MeshLambertMaterial({ color: 0xffccaa });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.2), mat);
    body.position.y = 0.5;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.6), headMat);
    head.position.set(0, 0.8, 0.7);
    group.add(body, head);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.2), headMat);
      leg.position.set(i % 2 === 0 ? -0.3 : 0.3, 0.2, i < 2 ? 0.4 : -0.4);
      group.add(leg);
    }
  } else if (type === 'pig') {
    const mat = new THREE.MeshLambertMaterial({ color: 0xF5A9BC });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.1), mat);
    body.position.y = 0.45;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), mat);
    head.position.set(0, 0.6, 0.6);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.1), new THREE.MeshLambertMaterial({ color: 0xE28A9D }));
    snout.position.set(0, 0.55, 0.86);
    group.add(body, head, snout);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), mat);
      leg.position.set(i % 2 === 0 ? -0.25 : 0.25, 0.15, i < 2 ? 0.4 : -0.4);
      group.add(leg);
    }
  } else if (type === 'cow') {
    const mat = new THREE.MeshLambertMaterial({ color: 0x5C3A21 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 1.4), mat);
    body.position.y = 0.6;
    const spot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.4, 0.5), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
    spot.position.y = 0.6;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), mat);
    head.position.set(0, 1.0, 0.8);
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.2), new THREE.MeshLambertMaterial({ color: 0xffaaaa }));
    snout.position.set(0, 0.85, 1.15);
    group.add(body, spot, head, snout);
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.25), mat);
      leg.position.set(i % 2 === 0 ? -0.35 : 0.35, 0.25, i < 2 ? 0.5 : -0.5);
      group.add(leg);
    }
  } else if (type === 'chicken') {
    const mat = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.5), mat);
    body.position.y = 0.35;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), mat);
    head.position.set(0, 0.6, 0.25);
    const beak = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.1), new THREE.MeshLambertMaterial({ color: 0xCC6600 }));
    beak.position.set(0, 0.55, 0.38);
    const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.04), new THREE.MeshLambertMaterial({ color: 0xCC2222 }));
    wattle.position.set(0, 0.5, 0.35);
    group.add(body, head, beak, wattle);
    for (let i = 0; i < 2; i++) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), new THREE.MeshLambertMaterial({ color: 0xCC6600 }));
      leg.position.set(i === 0 ? -0.1 : 0.1, 0.12, 0);
      group.add(leg);
    }
  }

  group.children.forEach(c => { c.castShadow = true; c.receiveShadow = true; });
  group.position.set(x, 0, z);
  const rot = Math.random() * Math.PI * 2;
  group.rotation.y = rot;
  scene.add(group);
  return { mesh: group, type, ty: rot, moveTimer: 0, walkCycle: Math.random() * 2, bounds };
}

function buildAnimals() {
  const animalArr = [];
  const houseCoords = window._houseCoords || [];

  // Sheep near houses
  houseCoords.forEach(([hx, hz]) => {
    if (Math.random() > 0.5) {
      animalArr.push(addAnimal('sheep', hx + (Math.random() - 0.5) * 6, hz + 5 + Math.random() * 4, { minX: hx - 6, maxX: hx + 6, minZ: hz + 1, maxZ: hz + 10 }));
    }
  });

  // Pigs
  for (let i = 0; i < 6; i++) animalArr.push(addAnimal('pig', (Math.random() - 0.5) * 40, -5 - Math.random() * 80));
  // Cows
  for (let i = 0; i < 5; i++) animalArr.push(addAnimal('cow', (Math.random() - 0.5) * 40, -10 - Math.random() * 70));
  // Chickens
  for (let i = 0; i < 8; i++) animalArr.push(addAnimal('chicken', (Math.random() - 0.5) * 40, -5 - Math.random() * 80));

  return animalArr;
}

export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getRenderer() { return renderer; }
export function getClouds() { return clouds; }
export function getAnimals() { return animals; }
