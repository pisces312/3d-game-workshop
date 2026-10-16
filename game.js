import * as THREE from 'three';

const CONFIG = {
  blockWidth: 4.8,
  blockDepth: 4.8,
  blockHeight: 1.15,
  moveRange: 7.2,
  moveSpeed: 1.65,
  gravity: 28,
  minimumOverlap: 0.42,
  cameraDistance: 17,
};

const sceneRoot = document.querySelector('#scene');
const scoreElement = document.querySelector('#score');
const bestElement = document.querySelector('#best');
const statusText = document.querySelector('#status-text');
const startPanel = document.querySelector('#start-panel');
const gameOverPanel = document.querySelector('#game-over-panel');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const finalScore = document.querySelector('#final-score');
const finalBest = document.querySelector('#final-best');

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
sceneRoot.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0b1024, 0.014);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
camera.position.set(12, 10, CONFIG.cameraDistance);

const ambientLight = new THREE.HemisphereLight(0x99a8ff, 0x142242, 2.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xb5fff0, 4.2);
keyLight.position.set(-7, 17, 9);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -14;
keyLight.shadow.camera.right = 14;
keyLight.shadow.camera.top = 24;
keyLight.shadow.camera.bottom = -8;
scene.add(keyLight);

const rimLight = new THREE.PointLight(0x8278ff, 50, 30, 2);
rimLight.position.set(8, 7, -5);
scene.add(rimLight);

const world = new THREE.Group();
scene.add(world);

const materials = [
  new THREE.MeshStandardMaterial({ color: 0x72f3cb, roughness: 0.27, metalness: 0.15 }),
  new THREE.MeshStandardMaterial({ color: 0x8b83ff, roughness: 0.24, metalness: 0.18 }),
  new THREE.MeshStandardMaterial({ color: 0xffc778, roughness: 0.3, metalness: 0.12 }),
  new THREE.MeshStandardMaterial({ color: 0xff7f9b, roughness: 0.29, metalness: 0.13 }),
  new THREE.MeshStandardMaterial({ color: 0x65b8ff, roughness: 0.24, metalness: 0.2 }),
];
const topMaterials = [
  new THREE.MeshBasicMaterial({ color: 0xc1ffec, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  new THREE.MeshBasicMaterial({ color: 0xd1ceff, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
  new THREE.MeshBasicMaterial({ color: 0xffe2ad, transparent: true, opacity: 0.45, side: THREE.DoubleSide }),
  new THREE.MeshBasicMaterial({ color: 0xffc8d5, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
  new THREE.MeshBasicMaterial({ color: 0xc0e4ff, transparent: true, opacity: 0.42, side: THREE.DoubleSide }),
];
const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 });

const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x202b50, roughness: 0.65, metalness: 0.28 });
const base = new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.8, 0.7, 64), baseMaterial);
base.position.y = -0.45;
base.receiveShadow = true;
world.add(base);

const baseRing = new THREE.Mesh(
  new THREE.TorusGeometry(6.75, 0.035, 8, 96),
  new THREE.MeshBasicMaterial({ color: 0x81f7d1, transparent: true, opacity: 0.66 }),
);
baseRing.rotation.x = Math.PI / 2;
baseRing.position.y = -0.06;
world.add(baseRing);

const grid = new THREE.GridHelper(40, 40, 0x364269, 0x1a2343);
grid.position.y = -0.81;
grid.material.transparent = true;
grid.material.opacity = 0.35;
world.add(grid);

const stars = createStars();
scene.add(stars);

let state = 'ready';
let stack = [];
let activeBlock = null;
let dropVelocity = 0;
let targetCenterY = CONFIG.blockHeight / 2;
let score = 0;
let best = Number.parseInt(localStorage.getItem('gravity-stack-best') || '0', 10);
let cameraLookY = 3;
let cameraTargetY = 3;
let lastTime = performance.now();

bestElement.textContent = best;

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < 260; i += 1) {
    const radius = 16 + Math.random() * 22;
    const angle = Math.random() * Math.PI * 2;
    positions.push(
      Math.cos(angle) * radius,
      Math.random() * 30 + 1,
      Math.sin(angle) * radius - 3,
    );
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0x9eaeff, size: 0.055, transparent: true, opacity: 0.72 });
  return new THREE.Points(geometry, material);
}

function makeBlock(width, depth, index) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials[index % materials.length]);
  body.scale.set(width, CONFIG.blockHeight, depth);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const top = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), topMaterials[index % topMaterials.length]);
  top.rotation.x = -Math.PI / 2;
  top.position.y = CONFIG.blockHeight / 2 + 0.006;
  top.scale.set(width, depth, 1);
  group.add(top);

  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), edgeMaterial);
  edges.scale.set(width, CONFIG.blockHeight, depth);
  group.add(edges);

  group.userData.body = body;
  group.userData.top = top;
  group.userData.edges = edges;
  return group;
}

function updateBlockSize(block, width, depth) {
  block.width = width;
  block.depth = depth;
  block.mesh.userData.body.scale.set(width, CONFIG.blockHeight, depth);
  block.mesh.userData.top.scale.set(width, depth, 1);
  block.mesh.userData.edges.scale.set(width, CONFIG.blockHeight, depth);
}

function spawnBlock() {
  const index = stack.length;
  const axis = index % 2 === 0 ? 'x' : 'z';
  const mesh = makeBlock(CONFIG.blockWidth, CONFIG.blockDepth, index);
  const nextY = stack.length ? stack[stack.length - 1].mesh.position.y + CONFIG.blockHeight : CONFIG.blockHeight / 2;
  const spawnY = nextY + 7.6;
  const phase = index % 2 === 0 ? 0 : Math.PI / 2;
  activeBlock = {
    mesh,
    width: CONFIG.blockWidth,
    depth: CONFIG.blockDepth,
    axis,
    phase,
    speed: CONFIG.moveSpeed + Math.min(index * 0.025, 0.8),
    spawnY,
    targetY: nextY,
  };
  mesh.position.set(axis === 'x' ? Math.sin(phase) * CONFIG.moveRange : 0, spawnY, axis === 'z' ? Math.sin(phase) * CONFIG.moveRange : 0);
  world.add(mesh);
  targetCenterY = nextY;
  statusText.textContent = axis === 'x' ? '左右移动中 · 找准时机放下' : '前后移动中 · 找准时机放下';
}

function startGame() {
  stack.forEach((block) => world.remove(block.mesh));
  if (activeBlock) world.remove(activeBlock.mesh);
  stack = [];
  activeBlock = null;
  score = 0;
  dropVelocity = 0;
  state = 'playing';
  scoreElement.textContent = '0';
  startPanel.classList.add('is-hidden');
  gameOverPanel.classList.add('is-hidden');
  spawnBlock();
}

function dropBlock() {
  if (state === 'ready' || state === 'over') {
    startGame();
    return;
  }
  if (state !== 'playing' || !activeBlock) return;
  state = 'dropping';
  dropVelocity = 0;
  statusText.textContent = '重力已启动 · 稳住这一层';
}

function settleBlock() {
  const current = activeBlock;
  const previous = stack[stack.length - 1];
  current.mesh.position.y = targetCenterY;

  if (previous) {
    const xOverlap = getOverlap(current.mesh.position.x, current.width, previous.mesh.position.x, previous.width);
    const zOverlap = getOverlap(current.mesh.position.z, current.depth, previous.mesh.position.z, previous.depth);
    if (xOverlap.size < CONFIG.minimumOverlap || zOverlap.size < CONFIG.minimumOverlap) {
      finishGame();
      return;
    }
    current.mesh.position.x = xOverlap.center;
    current.mesh.position.z = zOverlap.center;
    updateBlockSize(current, xOverlap.size, zOverlap.size);
  }

  stack.push(current);
  score = stack.length;
  scoreElement.textContent = score;
  if (score > best) {
    best = score;
    bestElement.textContent = best;
    localStorage.setItem('gravity-stack-best', String(best));
  }
  cameraTargetY = Math.max(3, current.mesh.position.y * 0.56);
  state = 'playing';
  activeBlock = null;
  statusText.textContent = score > 0 ? '漂亮！下一层会更快' : '第一层落稳了';
  window.setTimeout(() => {
    if (state === 'playing') spawnBlock();
  }, 180);
}

function getOverlap(aCenter, aSize, bCenter, bSize) {
  const start = Math.max(aCenter - aSize / 2, bCenter - bSize / 2);
  const end = Math.min(aCenter + aSize / 2, bCenter + bSize / 2);
  return { size: end - start, center: (start + end) / 2 };
}

function finishGame() {
  state = 'over';
  statusText.textContent = '方块错开了 · 重力赢得这一回合';
  finalScore.textContent = score;
  finalBest.textContent = best;
  gameOverPanel.classList.remove('is-hidden');
  activeBlock.mesh.rotation.z = 0.22;
}

function updateBlock(delta) {
  if (!activeBlock) return;
  if (state === 'playing') {
    const movement = Math.sin(performance.now() * 0.001 * activeBlock.speed + activeBlock.phase) * CONFIG.moveRange;
    if (activeBlock.axis === 'x') activeBlock.mesh.position.x = movement;
    else activeBlock.mesh.position.z = movement;
  } else if (state === 'dropping') {
    dropVelocity += CONFIG.gravity * delta;
    activeBlock.mesh.position.y -= dropVelocity * delta;
    if (activeBlock.mesh.position.y <= targetCenterY) settleBlock();
  }
}

function updateCamera(delta) {
  const top = stack.length ? stack[stack.length - 1].mesh.position.y : 0;
  const desiredLook = Math.max(3, top * 0.57);
  cameraLookY = THREE.MathUtils.damp(cameraLookY, desiredLook, 3.4, delta);
  const desiredCameraY = 9.5 + Math.max(0, top - 5) * 0.84;
  cameraTargetY = THREE.MathUtils.damp(cameraTargetY, desiredCameraY, 2.2, delta);
  camera.position.y = cameraTargetY;
  camera.position.x = THREE.MathUtils.damp(camera.position.x, 11.7, 2.4, delta);
  camera.position.z = THREE.MathUtils.damp(camera.position.z, CONFIG.cameraDistance, 2.4, delta);
  camera.lookAt(0, cameraLookY, 0);
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.04);
  lastTime = now;
  updateBlock(delta);
  updateCamera(delta);
  stars.rotation.y += delta * 0.008;
  baseRing.rotation.z += delta * 0.12;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
renderer.domElement.addEventListener('pointerdown', dropBlock);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    dropBlock();
  }
});
window.addEventListener('resize', handleResize);

requestAnimationFrame(animate);
