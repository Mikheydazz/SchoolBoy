import * as THREE from 'three';

// =====================================================
//  СЦЕНА, КАМЕРА, РЕНДЕРЕР
// =====================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87b0d0);
scene.fog = new THREE.Fog(0x87b0d0, 40, 120);

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// =====================================================
//  СВЕТ
// =====================================================
const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 0.9);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff0c0, 1.4);
sun.position.set(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -60;
sun.shadow.camera.right = 60;
sun.shadow.camera.top = 60;
sun.shadow.camera.bottom = -60;
sun.shadow.camera.far = 150;
scene.add(sun);
scene.add(sun.target);

// =====================================================
//  ЗЕМЛЯ
// =====================================================
const MAP = 200;

const groundMat = new THREE.MeshLambertMaterial({ color: 0x5f8a5c });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP, MAP), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(MAP, 40, 0x6e9b6a, 0x6e9b6a);
grid.position.y = 0.02;
grid.material.opacity = 0.35;
grid.material.transparent = true;
scene.add(grid);

// Деревья
for (let i = 0; i < 60; i++) {
  const x = (Math.random() - 0.5) * (MAP - 10);
  const z = (Math.random() - 0.5) * (MAP - 10);
  const h = 2 + Math.random() * 3;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 1.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x6b4a2a })
  );
  trunk.position.set(x, 0.6, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(1.2, h, 7),
    new THREE.MeshLambertMaterial({ color: 0x3f6b3a })
  );
  crown.position.set(x, 1.2 + h / 2, z);
  crown.castShadow = true;
  scene.add(crown);
}

// =====================================================
//  ДОМА
// =====================================================
const houses = [];

function makeHouse(x, z, w, d, h, roofColor) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf0e0c0 });
  const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
  walls.position.y = h / 2;
  walls.castShadow = true;
  walls.receiveShadow = true;
  group.add(walls);

  const roofMat = new THREE.MeshLambertMaterial({ color: roofColor });
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(Math.max(w, d) * 0.78, h * 0.7, 4),
    roofMat
  );
  roof.position.y = h + h * 0.35;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  group.add(roof);

  const doorMat = new THREE.MeshLambertMaterial({ color: 0x5a3a1a });
  const door = new THREE.Mesh(new THREE.BoxGeometry(w * 0.22, h * 0.55, 0.08), doorMat);
  door.position.set(0, h * 0.275, d / 2 + 0.04);
  group.add(door);

  const winMat = new THREE.MeshLambertMaterial({ color: 0x8fc6e8, emissive: 0x223344 });
  const winL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.16, h * 0.2, 0.08), winMat);
  winL.position.set(-w * 0.28, h * 0.65, d / 2 + 0.04);
  group.add(winL);
  const winR = winL.clone();
  winR.position.x = w * 0.28;
  group.add(winR);

  const pipeMat = new THREE.MeshLambertMaterial({ color: 0x8a3a2a });
  const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.4, h * 0.5, 0.4), pipeMat);
  pipe.position.set(w * 0.3, h + h * 0.5, -d * 0.2);
  pipe.castShadow = true;
  group.add(pipe);

  scene.add(group);

  const padding = 0.8;
  houses.push({
    x, z, w, d,
    minX: x - w / 2 - padding,
    maxX: x + w / 2 + padding,
    minZ: z - d / 2 - padding,
    maxZ: z + d / 2 + padding,
    group,
  });
}

function buildHouses() {
  const zMin = 25, zMax = 85;
  const colors = [0xa03a2a, 0x7a3a8a, 0x2a6a8a, 0x8a6a2a, 0x5a3a2a, 0x3a6a3a, 0x8a3a4a];
  const count = 7;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = -MAP / 2 + 15 + t * (MAP - 30);
    const z = zMin + Math.random() * (zMax - zMin);
    const w = 6 + Math.random() * 3;
    const d = 6 + Math.random() * 3;
    const h = 4 + Math.random() * 2;
    makeHouse(x, z, w, d, h, colors[i % colors.length]);
  }

  makeHouse(-MAP / 2 + 45, 15, 7, 7, 5, 0xa03a2a);
  makeHouse(MAP / 2 - 45, 15, 7, 7, 5, 0x2a6a8a);
  makeHouse(0, 10, 8, 7, 5.5, 0x7a3a8a);
}
buildHouses();

// =====================================================
//  ГЕРОЙ
// =====================================================
const heroGroup = new THREE.Group();
scene.add(heroGroup);

const skinMat     = new THREE.MeshLambertMaterial({ color: 0xf5d6a8 });
const shirtMat    = new THREE.MeshLambertMaterial({ color: 0x4a6ea8 });
const pantsMat    = new THREE.MeshLambertMaterial({ color: 0x3a3a5a });
const shoeMat     = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
const hairMat     = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
const backpackMat = new THREE.MeshLambertMaterial({ color: 0xb57c4a });
const tieMat      = new THREE.MeshLambertMaterial({ color: 0xa02020 });
const eyeMat      = new THREE.MeshBasicMaterial({ color: 0xffffff });
const pupilMat    = new THREE.MeshBasicMaterial({ color: 0x1a0a0a });

const torso = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 16), shirtMat);
torso.position.y = 1.5;
torso.scale.set(1.1, 1.15, 0.85);
torso.castShadow = true;
heroGroup.add(torso);

const belly = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), shirtMat);
belly.position.set(0, 1.05, 0.35);
belly.scale.set(1.0, 0.9, 0.9);
belly.castShadow = true;
heroGroup.add(belly);

const tie = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 4), tieMat);
tie.position.set(0, 1.55, 0.95);
tie.rotation.x = Math.PI;
heroGroup.add(tie);

const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), skinMat);
head.position.y = 2.85;
head.castShadow = true;
heroGroup.add(head);

const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), skinMat);
cheekL.position.set(-0.35, 2.75, 0.5);
heroGroup.add(cheekL);
const cheekR = cheekL.clone();
cheekR.position.x = 0.35;
heroGroup.add(cheekR);

const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), eyeMat);
eyeL.position.set(-0.2, 2.95, 0.52);
heroGroup.add(eyeL);
const eyeR = eyeL.clone();
eyeR.position.x = 0.2;
heroGroup.add(eyeR);

const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), pupilMat);
pupilL.position.set(-0.2, 2.95, 0.62);
heroGroup.add(pupilL);
const pupilR = pupilL.clone();
pupilR.position.x = 0.2;
heroGroup.add(pupilR);

const mouth = new THREE.Mesh(
  new THREE.TorusGeometry(0.12, 0.035, 6, 12, Math.PI),
  pupilMat
);
mouth.position.set(0, 2.65, 0.55);
mouth.rotation.z = Math.PI;
heroGroup.add(mouth);

// =====================================================
//  ВИЗУАЛЬНЫЕ ЭЛЕМЕНТЫ КРАСАВЦА (появляются при бафе молота)
// =====================================================

// Волевой подбородок
const chin = new THREE.Mesh(
  new THREE.BoxGeometry(0.75, 0.3, 0.55),
  skinMat
);
chin.position.set(0, 2.4, 0.35);
chin.visible = false;
chin.castShadow = true;
heroGroup.add(chin);

// Крутые очки
const sunglasses = new THREE.Group();
const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.05), glassMat);
lensL.position.set(-0.22, 2.9, 0.6);
sunglasses.add(lensL);
const lensR = lensL.clone();
lensR.position.x = 0.22;
sunglasses.add(lensR);
const glassBridge = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.05), glassMat);
glassBridge.position.set(0, 2.9, 0.6);
sunglasses.add(glassBridge);
const glassArmL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.5), glassMat);
glassArmL.position.set(-0.4, 2.9, 0.35);
sunglasses.add(glassArmL);
const glassArmR = glassArmL.clone();
glassArmR.position.x = 0.4;
sunglasses.add(glassArmR);
sunglasses.visible = false;
heroGroup.add(sunglasses);

const hair = new THREE.Mesh(
  new THREE.SphereGeometry(0.64, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
  hairMat
);
hair.position.y = 2.9;
heroGroup.add(hair);

const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.5), backpackMat);
backpack.position.set(0, 1.6, -1.05);
backpack.castShadow = true;
heroGroup.add(backpack);

const backpackTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.35), backpackMat);
backpackTop.position.set(0, 2.15, -1.0);
heroGroup.add(backpackTop);

function makeArm(side) {
  const arm = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 6, 12), shirtMat);
  upper.position.y = -0.35;
  upper.castShadow = true;
  arm.add(upper);

  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), skinMat);
  hand.position.y = -0.9;
  hand.castShadow = true;
  arm.add(hand);

  arm.position.set(side * 1.15, 2.0, 0);
  arm.rotation.z = side * 0.15;
  return arm;
}
const armL = makeArm(-1);
const armR = makeArm(1);
heroGroup.add(armL, armR);

function makeLeg(side) {
  const leg = new THREE.Group();
  const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 12), pantsMat);
  thigh.position.y = -0.4;
  thigh.castShadow = true;
  leg.add(thigh);

  const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.65), shoeMat);
  shoe.position.set(0, -0.85, 0.12);
  shoe.castShadow = true;
  leg.add(shoe);

  leg.position.set(side * 0.42, 0.85, 0);
  return leg;
}
const legL = makeLeg(-1);
const legR = makeLeg(1);
heroGroup.add(legL, legR);

// =====================================================
//  ИНДИКАТОР РАДИУСА АТАКИ
// =====================================================
const attackRingGeo = new THREE.RingGeometry(1, 1.06, 48);
const attackRingMat = new THREE.MeshBasicMaterial({
  color: 0xfff5a0, transparent: true, opacity: 0.35,
  side: THREE.DoubleSide, depthWrite: false,
});
const attackRing = new THREE.Mesh(attackRingGeo, attackRingMat);
attackRing.rotation.x = -Math.PI / 2;
attackRing.position.y = 0.05;
scene.add(attackRing);

const attackDiscGeo = new THREE.CircleGeometry(1, 48);
const attackDiscMat = new THREE.MeshBasicMaterial({
  color: 0xfff5a0, transparent: true, opacity: 0.08,
  side: THREE.DoubleSide, depthWrite: false,
});
const attackDisc = new THREE.Mesh(attackDiscGeo, attackDiscMat);
attackDisc.rotation.x = -Math.PI / 2;
attackDisc.position.y = 0.04;
scene.add(attackDisc);

const attackArcGeo = new THREE.CircleGeometry(1, 32, -1.15, 2.3);
const attackArcMat = new THREE.MeshBasicMaterial({
  color: 0xffe066, transparent: true, opacity: 0,
  side: THREE.DoubleSide, depthWrite: false,
});
const attackArc = new THREE.Mesh(attackArcGeo, attackArcMat);
attackArc.rotation.x = -Math.PI / 2;
attackArc.position.y = 0.06;
scene.add(attackArc);

// =====================================================
//  ПРЫЖОК
// =====================================================
const JUMP_DURATION = 0.55;
const JUMP_COOLDOWN = 2000;
const JUMP_HEIGHT   = 3.0;
const JUMP_SAFE_HEIGHT = 0.8;

// =====================================================
//  ПРИОРИТЕТНЫЕ ОБЛАСТИ
// =====================================================
const ZONE_RADIUS = 5;
const RESCUE_ZONE_LIFETIME = 60;

const zones = [];
let nextRescueLevel = 4;

// =====================================================
//  СТАТУИ — сломанный объект даёт 10 XP-орбов
// =====================================================
const STATUE_INTERVAL  = 60000;   // мс между появлениями
const STATUE_HP        = 500;     // суммарный урон для разрушения
const STATUE_RADIUS    = 1.3;     // радиус коллизии для попадания
const STATUE_XP_ORBS   = 10;      // сколько шариков выпадает
const STATUE_ORB_VALUE = 8;       // опыт за каждый шарик

const statues = [];
let lastStatueSpawn = 0;

// =====================================================
//  БОСС
// =====================================================
const BOSS_TIMER = 90;
const BOSS_INTERVAL = 180;
const BOSS_FIRE_INTERVAL = 1.2;
const BOSS_PROJ_SPEED = 12;
const BOSS_PROJ_DAMAGE = 25;
const BOSS_CONTACT_RADIUS = 4.5;

const boss = {
  active: false,
  type: 'chemistry',
  mesh: null,
  aura: null,
  x: 0, z: 0,
  hp: 0, maxHp: 0,
  r: 3.5,
  speed: 2.8,
  contactDamage: 100,
  timeLeft: 0,
  attackTimer: 0,
};
const bossProjectiles = [];
let bossTimer = 0;
let nextBossType = 'biology';   // ← сначала Биология, потом Химия, и так далее

// =====================================================
//  СОБАКИ (спавнит Биология)
// =====================================================
let dogSpawnTimer = 0;
const DOG_SPAWN_INTERVAL = 3.0;   // секунд между волнами
const DOG_SPAWN_COUNT = 2;        // собак за волну
const MAX_DOGS = 12;              // максимум одновременно
const DOG_SPEED = 5.5;
const DOG_RADIUS = 0.7;
const DOG_HP_BASE = 25;
const DOG_DAMAGE_BASE = 14;
const DOG_RETURN_DAMAGE_PER_LEVEL = 15;   // урон боссу от отброшенной собаки

// =====================================================
//  УДАР В ПРЫЖКЕ
// =====================================================
const JUMP_ATTACK_MULT = 2.0;              // ×2 урона от обычного удара
const JUMP_ATTACK_RADIUS_BONUS = 2.0;      // +2 юнита к радиусу (не множитель!)

// =====================================================
//  УЧИТЕЛЯ — константы
// =====================================================
const TEACHER_HP_MULT    = 3.0;   // в 3 раза сильнее (HP)
const TEACHER_DMG_MULT   = 3.0;   // в 3 раза сильнее (урон)
const TEACHER_SPEED_MULT = 1.5;   // в 1.5 раза быстрее
const TEACHER_RADIUS     = 1.0;   // крупнее учебника
const TEACHER_XP_MULT    = 3.0;   // больше опыта за убийство

// Вероятность спавна учителя вместо учебника в зависимости от уровня
function getTeacherProbability(lvl) {
  if (lvl < 7)  return 0;      // до 7 уровня — только учебники
  if (lvl < 11) return 0.20;   // 7–10 уровни: 20% учителей
  if (lvl < 16) return 0.30;   // 11–15 уровни: 30%
  return 0.40;                 // 16+: 40%
}

// =====================================================
//  СОСТОЯНИЕ ИГРЫ
// =====================================================
const stats = {
  maxHp: 100,
  speed: 8,
  damage: 8,
  radius: 3.0,
  cooldown: 700,
  regen: 0,
  magnet: 2.5,
};

let hp = stats.maxHp;
let score = 0;
let level = 1;
let xp = 0;
let xpNext = 30;
let gameActive = true;
let paused = false;
let levelUpQueue = 0;
let kills = 0;
let nextWeaponLevel = 5;
let weaponChoiceQueue = 0;

const hero = {
  x: 0, z: 0,
  attackTimer: 0,
  attackAngle: 0,
  walkPhase: 0,
  isJumping: false,
  jumpTimer: 0,
  jumpCooldown: 0,
  height: 0,
};

const enemies = [];
const particles = [];
const xpOrbs = [];

// =====================================================
//  ОРУЖИЕ
// =====================================================
const WEAPONS = [
  {
    id: 'pen',
    name: 'Ручка',
    ico: '🖊️',
    desc: 'Пронзающий удар по линии. С каждым уровнем — больше урона и быстрее атака.',
    color: 0x3a5fd0,
    maxLevel: 5,
    lineLength: [13, 15, 18, 21, 24],
    damage:     [55, 95, 145, 205, 280],
    cooldown:   [500, 420, 350, 280, 220],
  },
  {
    id: 'bag',
    name: 'Мешок для обуви',
    ico: '👝',
    desc: 'Крутится вокруг Грифони. Бьёт только тех, кого реально задел. С каждым уровнем — быстрее, шире орбита и крупнее мешок.',
    color: 0x8a5a2a,
    maxLevel: 5,
    orbitRadius: [3.5, 4.0, 4.5, 5.0, 5.5],
    dotDamage:   [55, 85, 120, 165, 220],
    rotateSpeed: [2.8, 3.1, 3.4, 3.7, 4.0],
    hitRadius:   [0.9, 1.1, 1.3, 1.5, 1.8],
  },
  {
    id: 'ruler',
    name: 'Линейка',
    ico: '📏',
    desc: 'Рубящий удар широким сектором. С каждым уровнем — больше радиус, шире замах и быстрее.',
    color: 0xd9a02a,
    maxLevel: 5,
    slashRadius: [7.0, 8.2, 9.5, 11.0, 13.0],
    damage:      [50, 80, 120, 170, 235],
    cooldown:    [550, 480, 420, 360, 300],
    slashAngle:  [0.95, 1.05, 1.15, 1.25, 1.4],
  },
  {
    id: 'slingshot',
    name: 'Рогатка',
    ico: '🎯',
    desc: 'Стреляет далеко в одного врага. С каждым уровнем — значительно быстрее снаряд.',
    color: 0x5a8a3a,
    maxLevel: 5,
    projectileSpeed: [45, 62, 82, 108, 145],
    damage:   [70, 105, 155, 220, 310],
    cooldown: [800, 720, 640, 560, 480],
    range: 32,
  },
  {
    id: 'hammer',
    name: 'Молот',
    ico: '🔨',
    desc: 'Раз в 10 сек делает героя красивым. Каждое срабатывание чуть усиливает баф. Со 2 ур. — двойной Shift даёт удар молотом по площади.',
    color: 0x8a6a3a,
    maxLevel: 5,
    // Авто-баф — одинаковый на всех уровнях
    autoCooldown: 10000,
    baseDuration: 4,
    baseSpeedMult: 1.3,
    baseJumpMult: 1.3,
    // Рост от стаков (каждое срабатывание)
    stackDurationBonus: 0.2,
    stackMultBonus: 0.02,
    maxDuration: 8,
    maxMult: 2.2,
    // Активная способность (открывается на 2 ур.)
    // Индексы: [ур.1, ур.2, ур.3, ур.4, ур.5]
    // Ур.1 не используется (слам ещё не открыт), но нужен для правильного смещения
    slamCooldown:   [0,   6000, 5000, 4000, 3000],
    slamDamageMult: [0,   7.0,  9.0,  12.0, 15.0],
    slamRadius:     [0,   7.0,  8.0,  9.0,  10.0],
  },
];

// =====================================================
//  ПЛОСКИЕ БОНУСЫ УРОНА ОРУЖИЯ (накапливаются от карточек)
// =====================================================
// Каждое поле — сколько урона добавляется к базовому.
// Значения подобраны под частоту атаки оружия:
//   pen       — 500мс, урон за удар     → +12
//   bag       — dps (урон в секунду)    → +8
//   ruler     — 550мс, AoE сектор       → +10
//   slingshot — 800мс, 1 цель, далеко   → +18
const weaponDamageFlat = {
  pen: 0,
  bag: 0,
  ruler: 0,
  slingshot: 0,
};

const equippedWeapons = {};

const weaponTimers = {
  pen: 0,
  bag: 0,
  ruler: 0,
  slingshot: 0,
  hammer: 0,
};

// =====================================================
//  СОСТОЯНИЕ ПРЕВРАЩЕНИЯ (от молота)
// =====================================================
let heroTransformTimer = 0;
let heroTransformSpeedMult = 1.3;
let heroTransformJumpMult = 1.3;
let hammerSwingTimer = 0;

// Стаки авто-бафа — каждое срабатывание молота усиливает следующий баф
let hammerStacks = 0;

// Активная способность — удар молотом (со 2 уровня)
let lastShiftTime = 0;
let hammerSlamCooldown = 0;
const hammerSlamState = {
  active: false,
  timer: 0,
  duration: 0.7,
  damage: 0,
  radius: 0,
  landed: false,
};

let bagAngle = 0;
const projectiles = [];
const weaponMeshes = {};
let bagMesh = null;

function weaponLevel(id) {
  return equippedWeapons[id] ? equippedWeapons[id].level : 0;
}

function weaponStat(id, statKey, fallbackLevel) {
  const w = WEAPONS.find(x => x.id === id);
  if (!w) return 0;
  const lvl = fallbackLevel !== undefined ? fallbackLevel : weaponLevel(id);
  const arr = w[statKey];
  if (!arr) return 0;
  let value = arr[Math.max(0, Math.min(arr.length - 1, lvl - 1))] || 0;

  if (statKey === 'damage' || statKey === 'dotDamage') {
    // Плоский бонус от карточек — прибавляется к базовому урону оружия
    const flatBonus = weaponDamageFlat[id] || 0;
    value += flatBonus;
    // И только потом масштабируется по уровню персонажа
    const scale = 1 + (level - 1) * 0.08;
    value *= scale;
  }
  return value;
}

function giveWeapon(id) {
  if (equippedWeapons[id]) {
    equippedWeapons[id].level = Math.min(
      WEAPONS.find(w => w.id === id).maxLevel,
      equippedWeapons[id].level + 1
    );
  } else {
    equippedWeapons[id] = { level: 1 };
  }
  updateWeaponHud();
  rebuildWeaponMeshes();
}

function rebuildWeaponMeshes() {
  for (const k in weaponMeshes) {
    heroGroup.remove(weaponMeshes[k]);
    delete weaponMeshes[k];
  }
  if (bagMesh) {
    scene.remove(bagMesh);
    bagMesh = null;
  }

  if (equippedWeapons.pen) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8),
      new THREE.MeshLambertMaterial({ color: 0x2a4ac0 })
    );
    body.rotation.z = Math.PI / 2;
    body.position.set(0, 0, 0.8);
    g.add(body);
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.25, 8),
      new THREE.MeshLambertMaterial({ color: 0xffffff })
    );
    cap.rotation.z = Math.PI / 2;
    cap.position.set(0, 0, 1.6);
    g.add(cap);
    g.position.set(1.1, 1.6, 0.2);
    heroGroup.add(g);
    weaponMeshes.pen = g;
  }

  if (equippedWeapons.ruler) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.06, 0.35),
      new THREE.MeshLambertMaterial({ color: 0xe0b040 })
    );
    body.position.set(0, 0, 0.9);
    g.add(body);
    for (let i = 0; i < 6; i++) {
      const tick = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.07, 0.12),
        new THREE.MeshBasicMaterial({ color: 0x3a2a1a })
      );
      tick.position.set(0, 0.005, 0.4 + i * 0.28);
      g.add(tick);
    }
    g.position.set(1.1, 1.6, 0.2);
    heroGroup.add(g);
    weaponMeshes.ruler = g;
  }

  if (equippedWeapons.slingshot) {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8),
      new THREE.MeshLambertMaterial({ color: 0x6b4a2a })
    );
    handle.position.y = -0.35;
    g.add(handle);
    const forkL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6),
      new THREE.MeshLambertMaterial({ color: 0x6b4a2a })
    );
    forkL.position.set(-0.12, 0.15, 0);
    forkL.rotation.z = 0.35;
    g.add(forkL);
    const forkR = forkL.clone();
    forkR.position.x = 0.12;
    forkR.rotation.z = -0.35;
    g.add(forkR);
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.03, 0.03),
      new THREE.MeshBasicMaterial({ color: 0x8a2a2a })
    );
    band.position.set(0, 0.32, 0);
    g.add(band);
    g.position.set(-1.1, 1.8, 0.2);
    g.rotation.x = -0.4;
    heroGroup.add(g);
    weaponMeshes.slingshot = g;
  }

  if (equippedWeapons.bag) {
    const g = new THREE.Group();
    const bag = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 14, 10),
      new THREE.MeshLambertMaterial({ color: 0x8a5a2a })
    );
    bag.scale.set(0.9, 1.1, 0.9);
    bag.castShadow = true;
    g.add(bag);

    const knot = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0x5a3a1a })
    );
    knot.position.y = 0.75;
    g.add(knot);

    const lace1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6),
      new THREE.MeshLambertMaterial({ color: 0xf0e0c0 })
    );
    lace1.position.set(-0.15, 1.0, 0);
    lace1.rotation.z = 0.3;
    g.add(lace1);

    const lace2 = lace1.clone();
    lace2.position.x = 0.15;
    lace2.rotation.z = -0.3;
    g.add(lace2);

    scene.add(g);
    bagMesh = g;
  }
    if (equippedWeapons.hammer) {
    const g = new THREE.Group();
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.9, 8),
      new THREE.MeshLambertMaterial({ color: 0x8a5a2a })
    );
    handle.position.y = -0.35;
    g.add(handle);

    const headBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.38, 0.38),
      new THREE.MeshLambertMaterial({ color: 0x555566 })
    );
    headBlock.position.y = 0.2;
    headBlock.castShadow = true;
    g.add(headBlock);

    // Оковка
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.06, 0.4),
      new THREE.MeshLambertMaterial({ color: 0x888899 })
    );
    band.position.y = 0.05;
    g.add(band);

    g.position.set(-1.2, 1.7, 0.3);
    g.rotation.z = 0.4;
    heroGroup.add(g);
    weaponMeshes.hammer = g;
  }
}

// =====================================================
//  ПРЕВРАЩЕНИЕ ГЕРОЯ (баф молота)
// =====================================================
function applyHeroTransform() {
  // Скрываем пухлое
  belly.visible = false;
  cheekL.visible = false;
  cheekR.visible = false;
  mouth.visible = true;    // оставляем (может быть, улыбка)

  // Меняем пропорции торса: тоньше и выше
  torso.scale.set(0.95, 1.3, 0.7);

  // Показываем волевой подбородок и очки
  chin.visible = true;
  sunglasses.visible = true;
}

function revertHeroTransform() {
  belly.visible = true;
  cheekL.visible = true;
  cheekR.visible = true;
  torso.scale.set(1.1, 1.15, 0.85);
  torso.position.y = 1.5;
  chin.visible = false;
  sunglasses.visible = false;
}

let _lastWeaponHudText = '';
function updateWeaponHud() {
  const info = document.getElementById('weaponInfo');
  const list = [];
  for (const w of WEAPONS) {
    if (equippedWeapons[w.id]) {
      let txt = `${w.ico}${equippedWeapons[w.id].level}`;
      if (w.id === 'hammer' && equippedWeapons.hammer.level >= 2) {
        if (hammerSlamCooldown > 0) {
          txt += ` (${(hammerSlamCooldown / 1000).toFixed(1)}с)`;
        } else {
          txt += ' ⚡';
        }
      }
      list.push(txt);
    }
  }
  const newText = list.length ? list.join(' ') : '—';
  if (newText !== _lastWeaponHudText) {
    info.textContent = newText;
    _lastWeaponHudText = newText;
  }
}

function useWeapons(dt) {
  // РУЧКА
  if (equippedWeapons.pen) {
    weaponTimers.pen -= dt * 1000;
    if (weaponTimers.pen <= 0) {
      const cd = weaponStat('pen', 'cooldown');
      weaponTimers.pen = cd;

      const dmg = weaponStat('pen', 'damage');
      const len = weaponStat('pen', 'lineLength');
      const angle = hero.attackAngle;

      let hitAny = false;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.dying) continue;
        const dx = e.x - hero.x;
        const dz = e.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist > len) continue;
        let diff = Math.abs(Math.atan2(dz, dx) - angle);
        diff = Math.min(diff, Math.PI * 2 - diff);
        if (diff > 0.35) continue;

        e.hp -= dmg;
        hitAny = true;
        if (e.hp <= 0) killEnemy(e, i);
      }
      // Проверка попадания в босса
      if (boss.active) {
        const dx = boss.x - hero.x;
        const dz = boss.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist < len + boss.r) {
          let diff = Math.abs(Math.atan2(dz, dx) - angle);
          diff = Math.min(diff, Math.PI * 2 - diff);
          if (diff < 0.5) {
            damageBoss(dmg);
            hitAny = true;
          }
        }
      }
      // Проверка попадания по статуям
      for (let i = statues.length - 1; i >= 0; i--) {
        const s = statues[i];
        const dx = s.x - hero.x;
        const dz = s.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist > len + s.r) continue;
        let diff = Math.abs(Math.atan2(dz, dx) - angle);
        diff = Math.min(diff, Math.PI * 2 - diff);
        if (diff < 0.5) {
          damageStatue(s, i, dmg);
          hitAny = true;
        }
      }
      if (hitAny) spawnPenEffect(hero.x, hero.z, angle, len);
    }
  }

  // ЛИНЕЙКА
  if (equippedWeapons.ruler) {
    weaponTimers.ruler -= dt * 1000;
    if (weaponTimers.ruler <= 0) {
      const cd = weaponStat('ruler', 'cooldown');
      weaponTimers.ruler = cd;

      const dmg = weaponStat('ruler', 'damage');
      const r = weaponStat('ruler', 'slashRadius');
      const halfAngle = weaponStat('ruler', 'slashAngle');
      const angle = hero.attackAngle;

      let hitSomething = false;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.dying) continue;
        const dx = e.x - hero.x;
        const dz = e.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist > r + e.r) continue;
        let diff = Math.abs(Math.atan2(dz, dx) - angle);
        diff = Math.min(diff, Math.PI * 2 - diff);
        if (diff > halfAngle) continue;

        e.hp -= dmg;
        hitSomething = true;
        if (e.hp <= 0) killEnemy(e, i);
      }
            // Проверка попадания в босса
      if (boss.active) {
        const dx = boss.x - hero.x;
        const dz = boss.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist < r + boss.r) {
          let diff = Math.abs(Math.atan2(dz, dx) - angle);
          diff = Math.min(diff, Math.PI * 2 - diff);
          if (diff < halfAngle + 0.15) {
            damageBoss(dmg);
            hitSomething = true;
          }
        }
      }
      // Проверка попадания по статуям
      for (let i = statues.length - 1; i >= 0; i--) {
        const s = statues[i];
        const dx = s.x - hero.x;
        const dz = s.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist > r + s.r) continue;
        let diff = Math.abs(Math.atan2(dz, dx) - angle);
        diff = Math.min(diff, Math.PI * 2 - diff);
        if (diff < halfAngle + 0.15) {
          damageStatue(s, i, dmg);
          hitSomething = true;
        }
      }
      if (hitSomething) spawnSlashEffect(hero.x, hero.z, angle, r, halfAngle);
    }
  }

  // РОГАТКА
  if (equippedWeapons.slingshot) {
    weaponTimers.slingshot -= dt * 1000;
    if (weaponTimers.slingshot <= 0) {
      const cd = weaponStat('slingshot', 'cooldown');
      const range = WEAPONS.find(w => w.id === 'slingshot').range;

      let target = null, nd = Infinity;
      for (const e of enemies) {
        if (e.dying) continue;
        const d = Math.hypot(e.x - hero.x, e.z - hero.z);
        if (d < nd) { nd = d; target = e; }
      }
      // Босс имеет приоритет если он ближе
      if (boss.active) {
        const bd = Math.hypot(boss.x - hero.x, boss.z - hero.z);
        if (bd < nd) { nd = bd; target = 'boss'; }
      }

      if (target && nd < range + (target === 'boss' ? boss.r : 0)) {
        weaponTimers.slingshot = cd;
        const tx = target === 'boss' ? boss.x : target.x;
        const tz = target === 'boss' ? boss.z : target.z;
        const angle = Math.atan2(tz - hero.z, tx - hero.x);
        const dmg = weaponStat('slingshot', 'damage');
        const speed = weaponStat('slingshot', 'projectileSpeed');

        const proj = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 8, 6),
          new THREE.MeshBasicMaterial({ color: 0x8a5a2a })
        );
        proj.position.set(hero.x, 1.5 + hero.height, hero.z);
        proj.userData = {
          vx: Math.cos(angle) * speed,
          vz: Math.sin(angle) * speed,
          damage: dmg,
          life: 1.5,
        };
        scene.add(proj);
        projectiles.push(proj);
      }
    }
  }

    // =====================================================
  //  МОЛОТ — раз в N секунд бьёт героя и делает его красивым
  // =====================================================
    if (equippedWeapons.hammer) {
    // Авто-баф не срабатывает, пока идёт активный удар
    if (!hammerSlamState.active) {
      weaponTimers.hammer -= dt * 1000;
      if (weaponTimers.hammer <= 0) {
        const def = WEAPONS.find(w => w.id === 'hammer');
        weaponTimers.hammer = def.autoCooldown;

        // Каждое срабатывание — +1 стак, усиливающий баф
        hammerStacks++;
        const dur = Math.min(def.maxDuration,
          def.baseDuration + hammerStacks * def.stackDurationBonus);
        const sMul = Math.min(def.maxMult,
          def.baseSpeedMult + hammerStacks * def.stackMultBonus);
        const jMul = Math.min(def.maxMult,
          def.baseJumpMult + hammerStacks * def.stackMultBonus);

        heroTransformTimer = dur;
        heroTransformSpeedMult = sMul;
        heroTransformJumpMult = jMul;
        hammerSwingTimer = 0.4;

        applyHeroTransform();
        spawnHammerHitEffect(hero.x, hero.z);
      }
    }

    // Анимация взмаха
    if (hammerSwingTimer > 0) {
      hammerSwingTimer -= dt;
      if (weaponMeshes.hammer) {
        const t = Math.max(0, hammerSwingTimer / 0.4);
        // 0.4 рад → -1.4 рад, резкий удар вниз
        weaponMeshes.hammer.rotation.z = 0.4 - (1 - t) * 1.8;
      }
    } else if (weaponMeshes.hammer) {
      weaponMeshes.hammer.rotation.z = 0.4;
    }
  }

  // Обновление таймера превращения
  if (heroTransformTimer > 0) {
    heroTransformTimer -= dt;
    if (heroTransformTimer <= 0) {
      heroTransformTimer = 0;
      revertHeroTransform();
    }
  }

    // МЕШОК — вращается вокруг, наносит урон только при касании
  if (equippedWeapons.bag && bagMesh) {
    const r = weaponStat('bag', 'orbitRadius');
    const rotSpeed = weaponStat('bag', 'rotateSpeed');
    const dps = weaponStat('bag', 'dotDamage');
    const hitR = weaponStat('bag', 'hitRadius');

    bagAngle += dt * rotSpeed;
    const bx = hero.x + Math.cos(bagAngle) * r;
    const bz = hero.z + Math.sin(bagAngle) * r;
    bagMesh.position.set(bx, 1.4 + hero.height, bz);
    bagMesh.rotation.y += dt * 4;
    bagMesh.rotation.x = Math.sin(bagAngle * 2) * 0.3;

    // Визуальный размер мешка растёт вместе с hitRadius
    const visualScale = 0.9 + (hitR - 0.9) * 0.55;
    bagMesh.scale.setScalar(visualScale);

    // Урон — только тем, до кого мешок действительно дотянулся
    // (проверка от координат мешка, а не от координат героя)
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dying || e.flyingToBoss) continue;

      const dx = e.x - bx;
      const dz = e.z - bz;
      const d = Math.hypot(dx, dz);

      if (d < hitR + e.r) {
        e.hp -= dps * dt;
        if (e.hp <= 0) killEnemy(e, i);
      }
    }

    // Мешок бьёт босса — только при касании
    if (boss.active) {
      const dx = boss.x - bx;
      const dz = boss.z - bz;
      const d = Math.hypot(dx, dz);
      if (d < hitR + boss.r) {
        damageBoss(dps * dt);
      }
    }

    // Мешок бьёт статуи — только при касании
    for (let i = statues.length - 1; i >= 0; i--) {
      const s = statues[i];
      const dx = s.x - bx;
      const dz = s.z - bz;
      const d = Math.hypot(dx, dz);
      if (d < hitR + s.r) {
        damageStatue(s, i, dps * dt);
      }
    }
  }
  }


  // Снаряды рогатки
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const ud = p.userData;
    ud.life -= dt;
    p.position.x += ud.vx * dt;
    p.position.z += ud.vz * dt;

    let hit = false;
    // Проверка врагов
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (e.dying) continue;
      const d = Math.hypot(e.x - p.position.x, e.z - p.position.z);
      if (d < e.r + 0.3) {
        e.hp -= ud.damage;
        if (e.hp <= 0) killEnemy(e, j);
        hit = true;
        break;
      }
    }
        // Проверка босса
    if (!hit && boss.active) {
      const d = Math.hypot(boss.x - p.position.x, boss.z - p.position.z);
      if (d < boss.r + 0.5) {
        damageBoss(ud.damage);
        hit = true;
      }
    }
    // Проверка статуй
    if (!hit) {
      for (let k = statues.length - 1; k >= 0; k--) {
        const s = statues[k];
        const d = Math.hypot(s.x - p.position.x, s.z - p.position.z);
        if (d < s.r + 0.3) {
          damageStatue(s, k, ud.damage);
          hit = true;
          break;
        }
      }
    }

    if (hit || ud.life <= 0 ||
        p.position.x < -MAP / 2 || p.position.x > MAP / 2 ||
        p.position.z < -MAP / 2 || p.position.z > MAP / 2) {
      scene.remove(p);
      projectiles.splice(i, 1);
    }
  }

  if (hero.attackTimer > 0) {
    const t = Math.max(0, hero.attackTimer / 0.18);
    if (weaponMeshes.pen) weaponMeshes.pen.rotation.y = -1.4 * t;
    if (weaponMeshes.ruler) weaponMeshes.ruler.rotation.y = -1.4 * t;
  } else {
    if (weaponMeshes.pen) weaponMeshes.pen.rotation.y *= 0.8;
    if (weaponMeshes.ruler) weaponMeshes.ruler.rotation.y *= 0.8;
  }

function killEnemy(e, idx) {
  if (e.dying) return;
  e.dying = true;
  e.dyingTimer = 0.25;
  if (e.isDog) score += 5;
  else if (e.isTeacher) score += 100;
  else score += 10;
  kills++;
  spawnXPOrb(e.x, e.z, e.xpValue);
  burst(e.x, e.z, e.isDog ? 0x8a5a2a : (e.isTeacher ? 0x333333 : e.type.color));
}

function spawnPenEffect(x, z, angle, len) {
  const geo = new THREE.PlaneGeometry(len, 0.4);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x88aaff, transparent: true, opacity: 0.85,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x + Math.cos(angle) * len / 2, 0.6, z + Math.sin(angle) * len / 2);
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = -angle;
  scene.add(m);

  const start = performance.now();
  function fade() {
    const t = (performance.now() - start) / 250;
    if (t >= 1) { scene.remove(m); return; }
    mat.opacity = 0.85 * (1 - t);
    requestAnimationFrame(fade);
  }
  fade();
}

function spawnSlashEffect(x, z, angle, r, halfAngle) {
  const geo = new THREE.CircleGeometry(r, 32, angle - halfAngle, halfAngle * 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffd966, transparent: true, opacity: 0.65,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, 0.5, z);
  m.rotation.x = -Math.PI / 2;
  scene.add(m);

  const start = performance.now();
  function fade() {
    const t = (performance.now() - start) / 300;
    if (t >= 1) { scene.remove(m); return; }
    mat.opacity = 0.65 * (1 - t);
    m.rotation.z += 0.05;
    requestAnimationFrame(fade);
  }
  fade();
}

// =====================================================
//  БОСС — СОЗДАНИЕ МЕША
// =====================================================
function makeBossCoverTexture() {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 480;
  const g = c.getContext('2d');

  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#8a1ac8');
  grad.addColorStop(1, '#2a0a4a');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  g.strokeStyle = '#c840ff';
  g.lineWidth = 16;
  g.strokeRect(10, 10, c.width - 20, c.height - 20);

  g.fillStyle = '#c840ff';
  g.fillRect(28, 28, c.width - 56, 80);

  g.fillStyle = '#ffffff';
  g.font = 'bold 42px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('УЧЕБНИК', c.width / 2, 68);

  g.fillStyle = '#ff88ff';
  g.font = 'bold 96px Arial';
  g.fillText('ХИМИЯ', c.width / 2, 200);

  g.fillStyle = '#ffd0ff';
  g.font = 'bold 26px Arial';
  g.fillText('10-11 КЛАСС', c.width / 2, 255);

  // Фляга
  g.beginPath();
  g.arc(c.width / 2, 355, 58, 0, Math.PI * 2);
  g.fillStyle = '#88ff44';
  g.fill();
  g.strokeStyle = '#2a0a4a';
  g.lineWidth = 6;
  g.stroke();

  // Пузырьки
  g.fillStyle = '#ffffff';
  g.beginPath(); g.arc(c.width / 2 - 18, 340, 7, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(c.width / 2 + 14, 365, 6, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(c.width / 2 - 4, 380, 5, 0, Math.PI * 2); g.fill();

  g.fillStyle = '#c840ff';
  g.fillRect(28, c.height - 80, c.width - 56, 52);

  g.fillStyle = '#ffffff';
  g.font = 'bold 26px Arial';
  g.fillText('ШКОЛА №1', c.width / 2, c.height - 54);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeBiologyCoverTexture() {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 480;
  const g = c.getContext('2d');

  const grad = g.createLinearGradient(0, 0, 0, c.height);
  grad.addColorStop(0, '#2a8a3a');
  grad.addColorStop(1, '#0a3a1a');
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);

  g.strokeStyle = '#66ff88';
  g.lineWidth = 16;
  g.strokeRect(10, 10, c.width - 20, c.height - 20);

  g.fillStyle = '#66ff88';
  g.fillRect(28, 28, c.width - 56, 80);

  g.fillStyle = '#ffffff';
  g.font = 'bold 42px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('УЧЕБНИК', c.width / 2, 68);

  g.fillStyle = '#c0ffd0';
  g.font = 'bold 74px Arial';
  g.fillText('БИОЛОГИЯ', c.width / 2, 200);

  g.fillStyle = '#aaffbb';
  g.font = 'bold 26px Arial';
  g.fillText('10-11 КЛАСС', c.width / 2, 255);

  // Спираль ДНК
  const cx = c.width / 2;
  const top = 300;
  const height = 140;
  const amplitude = 50;
  const turns = 3;

  g.lineWidth = 6;
  for (let strand = 0; strand < 2; strand++) {
    g.strokeStyle = strand === 0 ? '#88ffaa' : '#66ffcc';
    g.beginPath();
    for (let t = 0; t <= 1; t += 0.02) {
      const y = top + t * height;
      const phase = t * turns * Math.PI * 2 + strand * Math.PI;
      const x = cx + Math.sin(phase) * amplitude;
      if (t === 0) g.moveTo(x, y); else g.lineTo(x, y);
    }
    g.stroke();
  }

  g.strokeStyle = '#ffffff';
  g.lineWidth = 3;
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const y = top + t * height;
    const phase = t * turns * Math.PI * 2;
    const x1 = cx + Math.sin(phase) * amplitude;
    const x2 = cx + Math.sin(phase + Math.PI) * amplitude;
    g.beginPath();
    g.moveTo(x1, y);
    g.lineTo(x2, y);
    g.stroke();
  }

  g.fillStyle = '#66ff88';
  g.fillRect(28, c.height - 80, c.width - 56, 52);

  g.fillStyle = '#ffffff';
  g.font = 'bold 26px Arial';
  g.fillText('ШКОЛА №1', c.width / 2, c.height - 54);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function makeBossMesh(coverTexture, backColor, spineColor, eyeColor) {
  const group = new THREE.Group();
  const W = 4.5, H = 5.5, D = 1.2;

  const pagesMat = new THREE.MeshLambertMaterial({ color: 0xe0e8c0 });
  const pages = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, H * 0.96, D * 0.9), pagesMat);
  pages.castShadow = true;
  group.add(pages);

  const coverMat = new THREE.MeshLambertMaterial({ map: coverTexture });
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(W, H), coverMat);
  cover.position.z = D / 2 + 0.001;
  cover.castShadow = true;
  group.add(cover);

  const backMat = new THREE.MeshLambertMaterial({ color: backColor });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), backMat);
  back.position.z = -D / 2 - 0.001;
  back.rotation.y = Math.PI;
  group.add(back);

  const spineMat = new THREE.MeshLambertMaterial({ color: spineColor });
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.35, H, D * 0.95), spineMat);
  spine.position.x = -W / 2;
  spine.castShadow = true;
  group.add(spine);

  const eyeM = new THREE.MeshBasicMaterial({ color: eyeColor });
  const pupilM = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const el = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 10), eyeM);
  el.position.set(-1.05, 1.0, D / 2 + 0.05);
  group.add(el);
  const er = el.clone();
  er.position.x = 1.05;
  group.add(er);

  const pl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), pupilM);
  pl.position.set(-1.05, 1.0, D / 2 + 0.4);
  group.add(pl);
  const pr = pl.clone();
  pr.position.x = 1.05;
  group.add(pr);

  const browMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.1), browMat);
  browL.position.set(-1.05, 1.65, D / 2 + 0.05);
  browL.rotation.z = 0.4;
  group.add(browL);
  const browR = browL.clone();
  browR.position.x = 1.05;
  browR.rotation.z = -0.4;
  group.add(browR);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.14, 6, 12, Math.PI),
    browMat
  );

  mouth.position.set(0, -1.2, D / 2 + 0.05);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  for (let i = 0; i < 5; i++) {
    const tooth = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.22, 0.09),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    tooth.position.set(-0.44 + i * 0.22, -1.0, D / 2 + 0.1);
    group.add(tooth);
  }

  return group;
}

// =====================================================
//  МЕШ СОБАКИ
// =====================================================
function makeDogMesh() {
  const g = new THREE.Group();
  const furMat     = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
  const darkFurMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
  const eyeWMat    = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const eyeBMat    = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const tongueMat  = new THREE.MeshBasicMaterial({ color: 0xff5577 });

  // Тело — вдоль Z (голова смотрит в -Z — направление "вперёд")
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.7, 6, 10), furMat);
  body.rotation.x = Math.PI / 2;
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);

  // Голова на -Z
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), furMat);
  head.position.set(0, 0.75, -0.6);
  head.castShadow = true;
  g.add(head);

  // Морда
  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.35), darkFurMat);
  snout.position.set(0, 0.65, -0.85);
  g.add(snout);

  // Нос
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), eyeBMat);
  nose.position.set(0, 0.7, -1.02);
  g.add(nose);

  // Глаза
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeWMat);
  eyeL.position.set(0.15, 0.85, -0.75);
  g.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = -0.15;
  g.add(eyeR);

  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeBMat);
  pupilL.position.set(0.15, 0.85, -0.80);
  g.add(pupilL);
  const pupilR = pupilL.clone();
  pupilR.position.x = -0.15;
  g.add(pupilR);

  // Уши
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 6), darkFurMat);
  earL.position.set(0.18, 1.0, -0.45);
  earL.rotation.x = -0.3;
  g.add(earL);
  const earR = earL.clone();
  earR.position.x = -0.18;
  g.add(earR);

  // Хвост
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 6), furMat);
  tail.position.set(0, 0.7, 0.65);
  tail.rotation.x = -0.6;
  g.add(tail);

  // Лапы
  const legPositions = [
    [0.2, 0.15, -0.35], [-0.2, 0.15, -0.35],
    [0.2, 0.15, 0.35],  [-0.2, 0.15, 0.35],
  ];
  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 6), darkFurMat);
    leg.position.set(x, y, z);
    g.add(leg);
  }

  // Язык
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.15), tongueMat);
  tongue.position.set(0, 0.55, -1.0);
  g.add(tongue);

  return g;
}

function makeBossAura() {
  const group = new THREE.Group();

  const ringGeo = new THREE.RingGeometry(4.2, 5.0, 40);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff40ff, transparent: true, opacity: 0.55,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  group.add(ring);

  // Лучи
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const ray = new THREE.Mesh(
      new THREE.PlaneGeometry(1.4, 0.3),
      new THREE.MeshBasicMaterial({
        color: 0xff80ff, transparent: true, opacity: 0.5,
        side: THREE.DoubleSide, depthWrite: false,
      })
    );
    ray.rotation.x = -Math.PI / 2;
    ray.rotation.z = a;
    ray.position.set(Math.cos(a) * 3.5, 0.11, Math.sin(a) * 3.5);
    group.add(ray);
  }

  return group;
}

// =====================================================
//  БОСС — ЛОГИКА
// =====================================================
function spawnBoss() {
  if (boss.active) return;

  const type = nextBossType;
  boss.type = type;

  const angle = Math.random() * Math.PI * 2;
  const dist = 32;
  const x = hero.x + Math.cos(angle) * dist;
  const z = hero.z + Math.sin(angle) * dist;

  let mesh, backColor, spineColor, eyeColor, title, maxHp, speed, contactDamage;

  if (type === 'biology') {
    mesh = makeBossMesh(makeBiologyCoverTexture(), 0x1a5a2a, 0x0a3a1a, 0xff66cc);
    title = '🌿 БОСС: БИОЛОГИЯ 🌿';
    maxHp = 4500 + level * 220;
    speed = 2.5;
    contactDamage = 70 + level * 2.5;
  } else {
    mesh = makeBossMesh(makeBossCoverTexture(), 0x6b1a8a, 0x4a0a6a, 0xff3030);
    title = '💀 БОСС: ХИМИЯ 💀';
    maxHp = 5000 + level * 250;
    speed = 2.8;
    contactDamage = 80 + level * 3;
  }

  mesh.position.set(x, 2.6, z);
  scene.add(mesh);

  const aura = makeBossAura();
  aura.position.set(x, 0, z);
  // Аура бирюзовая для Биологии
  if (type === 'biology') {
    aura.children.forEach(c => {
      if (c.material) c.material.color.setHex(0x66ff88);
    });
  }
  scene.add(aura);

  boss.active = true;
  boss.mesh = mesh;
  boss.aura = aura;
  boss.x = x;
  boss.z = z;
  boss.hp = maxHp;
  boss.maxHp = maxHp;
  boss.r = 3.5;
  boss.speed = speed;
  boss.contactDamage = contactDamage;
  boss.timeLeft = BOSS_TIMER;
  boss.attackTimer = 1.5;

  // Обновляем заголовок HUD
  const titleEl = document.querySelector('.bossTitle');
  if (titleEl) titleEl.textContent = title;

  dogSpawnTimer = 0;

  document.getElementById('bossHud').classList.add('active');
  updateBossHud();
}

function damageBoss(amount) {
  if (!boss.active) return;
  boss.hp -= amount;
  updateBossHud();
  if (boss.hp <= 0) killBoss();
}

function killBoss() {
  if (!boss.active) return;

  score += 1000;
  kills += 1;

  // Взрыв
  for (let i = 0; i < 8; i++) {
    burst(boss.x + (Math.random() - 0.5) * 5, boss.z + (Math.random() - 0.5) * 5, 0xff40ff);
  }

  // Много XP-орбов по кругу
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2;
    const d = 2 + Math.random() * 6;
    spawnXPOrb(boss.x + Math.cos(a) * d, boss.z + Math.sin(a) * d, 20);
  }

  scene.remove(boss.mesh);
  scene.remove(boss.aura);
  boss.active = false;
  boss.mesh = null;
  boss.aura = null;

  bossProjectiles.forEach(p => scene.remove(p));
  bossProjectiles.length = 0;

    // Следующий босс — противоположный
  nextBossType = (nextBossType === 'biology') ? 'chemistry' : 'biology';

  // Все собаки исчезают
  for (let i = enemies.length - 1; i >= 0; i--) {
    if (enemies[i].isDog) {
      scene.remove(enemies[i].mesh);
      enemies.splice(i, 1);
    }
  }

  document.getElementById('bossHud').classList.remove('active');
  updateHud();
}

function updateBossHud() {
  const bar = document.getElementById('bossHpBar');
  const text = document.getElementById('bossHpText');
  const timeEl = document.getElementById('bossTime');
  const hud = document.getElementById('bossHud');

  bar.style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%';
  text.textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${boss.maxHp}`;

  const t = Math.max(0, boss.timeLeft);
  const min = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  timeEl.textContent = `${min}:${sec.toString().padStart(2, '0')}`;

  if (t <= 15) hud.classList.add('danger');
  else hud.classList.remove('danger');
}

function updateBoss(dt) {
  if (!boss.active) return;

  boss.timeLeft -= dt;
  updateBossHud();

  if (boss.timeLeft <= 0) {
    hp = 0;
    gameActive = false;
    updateHud();
    document.getElementById('bossHud').classList.remove('active');
    const bossName = boss.type === 'biology' ? 'Биология' : 'Химия';
    showGameOver(`${bossName} победила — вы не успели её убить за 1:30`);
    return;
  }

  const dx = hero.x - boss.x;
  const dz = hero.z - boss.z;
  const d = Math.hypot(dx, dz) || 1;

  if (d > 5.5) {
    boss.x += (dx / d) * boss.speed * dt;
    boss.z += (dz / d) * boss.speed * dt;
  }

  const bob = Math.sin(performance.now() * 0.003) * 0.35;
  boss.mesh.position.set(boss.x, 2.6 + bob, boss.z);
  boss.mesh.lookAt(hero.x, 2.6 + bob, hero.z);

  boss.aura.position.set(boss.x, 0, boss.z);
  boss.aura.rotation.y += dt * 1.4;

  // === Атаки зависят от типа ===
  if (boss.type === 'biology') {
    // Биология: реже стреляет, но спавнит собак
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
      boss.attackTimer = 1.8;
      // Один зелёный шар
      const a = Math.atan2(dz, dx);
      const proj = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0x88ff44 })
      );
      proj.position.set(boss.x, 2.0 + bob, boss.z);
      proj.userData = {
        vx: Math.cos(a) * BOSS_PROJ_SPEED,
        vz: Math.sin(a) * BOSS_PROJ_SPEED,
        life: 3.5,
      };
      scene.add(proj);
      bossProjectiles.push(proj);
    }

    // Спавн собак
    dogSpawnTimer += dt;
    if (dogSpawnTimer >= DOG_SPAWN_INTERVAL) {
      dogSpawnTimer = 0;
      const currentDogs = enemies.filter(e => e.isDog).length;
      const toSpawn = Math.min(DOG_SPAWN_COUNT, MAX_DOGS - currentDogs);
      for (let i = 0; i < toSpawn; i++) spawnDog();
    }
  } else {
    // Химия: тройной веер снарядов
    boss.attackTimer -= dt;
    if (boss.attackTimer <= 0) {
      boss.attackTimer = BOSS_FIRE_INTERVAL;
      const baseAngle = Math.atan2(dz, dx);
      for (let i = -1; i <= 1; i++) {
        const a = baseAngle + i * 0.32;
        const proj = new THREE.Mesh(
          new THREE.SphereGeometry(0.35, 10, 8),
          new THREE.MeshBasicMaterial({ color: 0x88ff44 })
        );
        proj.position.set(boss.x, 2.0 + bob, boss.z);
        proj.userData = {
          vx: Math.cos(a) * BOSS_PROJ_SPEED,
          vz: Math.sin(a) * BOSS_PROJ_SPEED,
          life: 3.5,
        };
        scene.add(proj);
        bossProjectiles.push(proj);
      }
    }
  }

  // Контактный урон
  if (d < BOSS_CONTACT_RADIUS && hero.height < JUMP_SAFE_HEIGHT) {
    hp -= boss.contactDamage * dt;
    if (hp <= 0 && gameActive) {
      hp = 0;
      gameActive = false;
      document.getElementById('bossHud').classList.remove('active');
      showGameOver();
    }
    updateHud();
  }
}

// =====================================================
//  СПАВН СОБАКИ
// =====================================================
function spawnDog() {
  if (!boss.active) return;

  const angle = Math.random() * Math.PI * 2;
  const dist = boss.r + 1.5 + Math.random() * 1.5;
  const x = boss.x + Math.cos(angle) * dist;
  const z = boss.z + Math.sin(angle) * dist;

  const mesh = makeDogMesh();
  mesh.position.set(x, 0, z);
  scene.add(mesh);

  const maxHp = DOG_HP_BASE + level * 4;

  enemies.push({
    mesh, x, z,
    type: { name: 'СОБАКА', color: 0x6b4a2a, r: DOG_RADIUS },
    isDog: true,
    isTeacher: false,
    hp: maxHp, maxHp,
    speed: DOG_SPEED + Math.random() * 0.5,
    damage: DOG_DAMAGE_BASE + level * 1.2,
    r: DOG_RADIUS,
    xpValue: 6,
    dying: false,
    dyingTimer: 0,
    kbX: 0, kbZ: 0,
    wobble: Math.random() * Math.PI * 2,
    flyingToBoss: false,
    flyVx: 0, flyVz: 0,
  });
}

function updateBossProjectiles(dt) {
  for (let i = bossProjectiles.length - 1; i >= 0; i--) {
    const p = bossProjectiles[i];
    p.userData.life -= dt;
    p.position.x += p.userData.vx * dt;
    p.position.z += p.userData.vz * dt;
    p.rotation.x += dt * 4;
    p.rotation.y += dt * 6;

    const dx = hero.x - p.position.x;
    const dz = hero.z - p.position.z;
    const d = Math.hypot(dx, dz);

    if (d < 1.1 && hero.height < JUMP_SAFE_HEIGHT) {
      hp -= BOSS_PROJ_DAMAGE;
      burst(p.position.x, p.position.z, 0x88ff44);
      if (hp <= 0 && gameActive) {
        hp = 0;
        gameActive = false;
        document.getElementById('bossHud').classList.remove('active');
        showGameOver();
      }
      updateHud();
      scene.remove(p);
      bossProjectiles.splice(i, 1);
      continue;
    }

    if (p.userData.life <= 0 ||
        Math.abs(p.position.x) > MAP / 2 ||
        Math.abs(p.position.z) > MAP / 2) {
      scene.remove(p);
      bossProjectiles.splice(i, 1);
    }
  }
}

// =====================================================
//  XP-ОРБЫ
// =====================================================
const xpOrbGeo = new THREE.SphereGeometry(1, 10, 8);
const xpOrbHaloGeo = new THREE.SphereGeometry(1, 8, 6);

function spawnXPOrb(x, z, value) {
  const size = 0.18 + Math.min(0.22, value * 0.012);

  const mesh = new THREE.Mesh(
    xpOrbGeo,
    new THREE.MeshBasicMaterial({ color: 0x4fc3f7 })
  );
  mesh.scale.setScalar(size);
  mesh.position.set(x, 1.0, z);

  const halo = new THREE.Mesh(
    xpOrbHaloGeo,
    new THREE.MeshBasicMaterial({
      color: 0x88ddff,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    })
  );
  halo.scale.setScalar(size * 2.4);
  mesh.add(halo);

  const core = new THREE.Mesh(
    xpOrbHaloGeo,
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  core.scale.setScalar(0.35);
  mesh.add(core);

  scene.add(mesh);

  xpOrbs.push({
    mesh,
    halo,
    x, z,
    value,
    size,
    bobPhase: Math.random() * Math.PI * 2,
  });
}

function updateXpOrbs(dt) {
  for (let i = xpOrbs.length - 1; i >= 0; i--) {
    const orb = xpOrbs[i];
    const dx = hero.x - orb.x;
    const dz = hero.z - orb.z;
    const d = Math.hypot(dx, dz) || 0.0001;

    if (d < stats.magnet) {
      const pull = 14 + (stats.magnet - d) * 3;
      orb.x += (dx / d) * pull * dt;
      orb.z += (dz / d) * pull * dt;
    }

    if (d < 0.9) {
      addXP(orb.value);
      burst(orb.x, orb.z, 0x4fc3f7);
      scene.remove(orb.mesh);
      xpOrbs.splice(i, 1);
      continue;
    }

    orb.bobPhase += dt * 3.5;
    const bob = Math.sin(orb.bobPhase) * 0.18;
    orb.mesh.position.set(orb.x, 1.0 + bob, orb.z);
    orb.mesh.rotation.y += dt * 2;
    const haloPulse = 1 + Math.sin(orb.bobPhase * 1.6) * 0.18;
    orb.halo.scale.setScalar(orb.size * 2.4 * haloPulse);
  }
}

// =====================================================
//  ЗОНЫ
// =====================================================
function findFreeSpot(radius) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const x = (Math.random() - 0.5) * (MAP - 40);
    const z = (Math.random() - 0.5) * (MAP - 40);
    if (!isInsideHouse(x, z, radius + 2)) return { x, z };
  }
  return { x: 0, z: -60 };
}

function makeZoneMesh(color, radius) {
  const group = new THREE.Group();

  const ringGeo = new THREE.RingGeometry(radius - 0.4, radius, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.9,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.06;
  group.add(ring);

  const discGeo = new THREE.CircleGeometry(radius, 48);
  const discMat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.12,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.05;
  group.add(disc);

  const beamGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 0.95, 12, 24, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.13,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 6;
  group.add(beam);

  scene.add(group);

  return { group, ring, ringMat, discMat, beamMat };
}

function spawnBuffZone() {
  const pos = findFreeSpot(ZONE_RADIUS);
  const { group, ring, ringMat, discMat, beamMat } = makeZoneMesh(0x4fc3f7, ZONE_RADIUS);
  group.position.set(pos.x, 0, pos.z);

  zones.push({
    type: 'buff',
    x: pos.x, z: pos.z,
    radius: ZONE_RADIUS,
    timeLeft: BUFF_ZONE_LIFETIME,
    group, ring, ringMat, discMat, beamMat,
    buffAccum: 0,
  });

  burst(pos.x, pos.z, 0x88ddff);
}

function spawnRescueZone() {
  if (zones.some(z => z.type === 'rescue')) return;
  // Не спавним во время боя с боссом
  if (boss.active) return;

  const pos = findFreeSpot(ZONE_RADIUS);
  const { group, ring, ringMat, discMat, beamMat } = makeZoneMesh(0xff3333, ZONE_RADIUS);
  group.position.set(pos.x, 0, pos.z);

  zones.push({
    type: 'rescue',
    x: pos.x, z: pos.z,
    radius: ZONE_RADIUS,
    timeLeft: RESCUE_ZONE_LIFETIME,
    group, ring, ringMat, discMat, beamMat,
    insideSafe: false,
  });

  burst(pos.x, pos.z, 0xff5555);
}

function updateZones(dt) {
  const now = performance.now();

  // Бафф-зоны больше не спавнятся — вместо них статуи

  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    z.timeLeft -= dt;

    const pulse = 1 + Math.sin(now * 0.005) * 0.04;
    z.ring.scale.set(pulse, pulse, 1);

    const dx = hero.x - z.x;
    const dz = hero.z - z.z;
    const inside = Math.hypot(dx, dz) < z.radius;

    if (z.type === 'buff') {
      if (inside) {
        z.ringMat.color.setHex(0x88ff88);
        z.discMat.color.setHex(0x88ff88);
        z.beamMat.color.setHex(0x88ff88);
        z.buffAccum += dt;
        while (z.buffAccum >= 0.5) {
          z.buffAccum -= 0.5;
          stats.maxHp += 1;
          hp = Math.min(stats.maxHp, hp + 1);
          stats.damage += 0.3;
          stats.speed += 0.01;
          stats.radius += 0.0075;
          stats.cooldown = Math.max(250, stats.cooldown - 0.5);
          stats.magnet += 0.04;
          updateHud();
        }
      } else {
        z.ringMat.color.setHex(0x4fc3f7);
        z.discMat.color.setHex(0x4fc3f7);
        z.beamMat.color.setHex(0x4fc3f7);
        z.buffAccum = 0;
      }
    } else if (z.type === 'rescue') {
      z.insideSafe = inside;
      if (inside) {
        z.ringMat.color.setHex(0x44ff44);
        z.discMat.color.setHex(0x44ff44);
        z.beamMat.color.setHex(0x44ff44);
      } else {
        z.ringMat.color.setHex(0xff3333);
        z.discMat.color.setHex(0xff3333);
        z.beamMat.color.setHex(0xff3333);
      }
    }

    if (z.timeLeft <= 0) {
      if (z.type === 'rescue' && !z.insideSafe && gameActive) {
        gameActive = false;
        hp = 0;
        updateHud();
        showGameOver('Вы не успели в зону спасения');
      }
      scene.remove(z.group);
      zones.splice(i, 1);
    }
  }
}

function updateZoneHUD() {
  const el = document.getElementById('zoneAlert');
  const rescue = zones.find(z => z.type === 'rescue');
  if (rescue && gameActive) {
    el.textContent = rescue.insideSafe
      ? `✓ БЕЗОПАСНО: ${Math.ceil(rescue.timeLeft)}с`
      : `⚠ СПАСЕНИЕ: ${Math.ceil(rescue.timeLeft)}с — беги в зону!`;
    el.style.display = 'block';
    el.className = rescue.insideSafe ? 'safe' : 'danger';
  } else {
    el.style.display = 'none';
  }
}

// =====================================================
//  ВВОД
// =====================================================
const keys = {
  w: 0, a: 0, s: 0, d: 0,
  up: 0, left: 0, down: 0, right: 0,
  space: 0, shift: 0,
};

addEventListener('keydown', e => {
  const c = e.code;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
       'ShiftLeft', 'ShiftRight'].includes(c)) {
    e.preventDefault();
  }
  if (c === 'KeyW') keys.w = 1;
  if (c === 'KeyA') keys.a = 1;
  if (c === 'KeyS') keys.s = 1;
  if (c === 'KeyD') keys.d = 1;
  if (c === 'ArrowUp') keys.up = 1;
  if (c === 'ArrowLeft') keys.left = 1;
  if (c === 'ArrowDown') keys.down = 1;
  if (c === 'ArrowRight') keys.right = 1;
  if (c === 'ShiftLeft' || c === 'ShiftRight') {
    const now = performance.now();
    // Двойной Shift → удар молотом (если открыт)
    if (now - lastShiftTime < 300 && weaponLevel('hammer') >= 2 &&
        hammerSlamCooldown <= 0 && !hammerSlamState.active) {
      triggerHammerSlam();
      lastShiftTime = 0;
    } else {
      keys.shift = 1;
      lastShiftTime = now;
    }
  }
  if (c === 'Space') {
    keys.space = 1;
    if (gameActive && !paused) doAttack();
  }
});

addEventListener('keyup', e => {
  const c = e.code;
  if (c === 'KeyW') keys.w = 0;
  if (c === 'KeyA') keys.a = 0;
  if (c === 'KeyS') keys.s = 0;
  if (c === 'KeyD') keys.d = 0;
  if (c === 'ArrowUp') keys.up = 0;
  if (c === 'ArrowLeft') keys.left = 0;
  if (c === 'ArrowDown') keys.down = 0;
  if (c === 'ArrowRight') keys.right = 0;
  if (c === 'ShiftLeft' || c === 'ShiftRight') keys.shift = 0;
  if (c === 'Space') keys.space = 0;
});

addEventListener('blur', () => {
  for (const k in keys) keys[k] = 0;
});

// =====================================================
//  HUD
// =====================================================
const hpBar = document.getElementById('hpBar');
const xpBar = document.getElementById('xpBar');
const lvlEl = document.getElementById('lvl');
const scoreEl = document.getElementById('score');

const gameoverEl = document.getElementById('gameover');
const gameoverSubtitleEl = document.getElementById('gameoverSubtitle');
const finalLevelEl = document.getElementById('finalLevel');
const finalScoreEl = document.getElementById('finalScore');
const finalKillsEl = document.getElementById('finalKills');

function updateHud() {
  hpBar.style.width = Math.max(0, hp / stats.maxHp * 100) + '%';
  xpBar.style.width = Math.min(100, xp / xpNext * 100) + '%';
  lvlEl.textContent = level;
  scoreEl.textContent = score;
}

function showGameOver(message) {
  gameoverEl.classList.add('active');
  finalLevelEl.textContent = level;
  finalScoreEl.textContent = score;
  finalKillsEl.textContent = kills;
  gameoverSubtitleEl.textContent = message || 'Грифоню завалили учебниками...';
}

// =====================================================
//  УЧЕБНИКИ-ВРАГИ
// =====================================================
function makeBookCoverTexture(title, bgColor, accentColor) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 320;
  const g = c.getContext('2d');

  g.fillStyle = bgColor;
  g.fillRect(0, 0, c.width, c.height);

  g.strokeStyle = accentColor;
  g.lineWidth = 12;
  g.strokeRect(6, 6, c.width - 12, c.height - 12);

  g.fillStyle = accentColor;
  g.fillRect(18, 18, c.width - 36, 60);

  g.fillStyle = bgColor === '#ffffff' ? '#000' : '#ffffff';
  g.font = 'bold 30px Arial';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('УЧЕБНИК', c.width / 2, 48);

  g.fillStyle = accentColor;
  g.font = 'bold 52px Arial';
  const words = title.split(' ');
  if (words.length > 1 && title.length > 8) {
    g.fillText(words[0], c.width / 2, 160);
    g.font = 'bold 44px Arial';
    g.fillText(words.slice(1).join(' '), c.width / 2, 215);
  } else {
    g.fillText(title, c.width / 2, 190);
  }

  g.beginPath();
  g.arc(c.width / 2, 260, 34, 0, Math.PI * 2);
  g.fillStyle = accentColor;
  g.fill();
  g.fillStyle = bgColor;
  g.font = 'bold 38px Arial';
  g.fillText(title.charAt(0).toUpperCase(), c.width / 2, 262);

  g.fillStyle = accentColor;
  g.fillRect(18, c.height - 60, c.width - 36, 42);

  g.fillStyle = bgColor;
  g.font = 'bold 20px Arial';
  g.fillText('ШКОЛА №1', c.width / 2, c.height - 38);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const BOOK_TYPES = [
  { name: 'РУССКИЙ',   color: 0xc42b2b, bgHex: '#c42b2b', spineColor: 0x8a1a1a, r: 0.75, xpBonus: 0 },
  { name: 'АЛГЕБРА',   color: 0x2b5fc4, bgHex: '#2b5fc4', spineColor: 0x1a3d8a, r: 0.78, xpBonus: 1 },
  { name: 'ФИЗИКА',    color: 0x2ba55c, bgHex: '#2ba55c', spineColor: 0x1a6e3a, r: 0.80, xpBonus: 2 },
  { name: 'ГЕОГРАФИЯ', color: 0xd99a2b, bgHex: '#d99a2b', spineColor: 0x8a5a1a, r: 0.82, xpBonus: 3 },
];

const coverTextureCache = {};
function getCoverTexture(type) {
  if (!coverTextureCache[type.name]) {
    coverTextureCache[type.name] = makeBookCoverTexture(type.name, type.bgHex, '#ffffff');
  }
  return coverTextureCache[type.name];
}

function makeBookMesh(type) {
  const group = new THREE.Group();

  const W = 1.4, H = 1.8, D = 0.4;

  const pagesMat = new THREE.MeshLambertMaterial({ color: 0xf5efd8 });
  const pages = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, H * 0.96, D * 0.9), pagesMat);
  pages.castShadow = true;
  group.add(pages);

  const coverMat = new THREE.MeshLambertMaterial({ map: getCoverTexture(type) });
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(W, H), coverMat);
  cover.position.z = D / 2 + 0.001;
  cover.castShadow = true;
  group.add(cover);

  const backMat = new THREE.MeshLambertMaterial({ color: type.color });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), backMat);
  back.position.z = -D / 2 - 0.001;
  back.rotation.y = Math.PI;
  group.add(back);

  const spineMat = new THREE.MeshLambertMaterial({ color: type.spineColor });
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, D * 0.95), spineMat);
  spine.position.x = -W / 2;
  spine.castShadow = true;
  group.add(spine);

  for (let i = 0; i < 3; i++) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.05, D * 0.96),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    stripe.position.set(-W / 2, -H * 0.3 + i * 0.4, 0);
    group.add(stripe);
  }

  const edgeMat = new THREE.MeshLambertMaterial({ color: 0xe8e0c0 });
  const topEdge = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, 0.04, D * 0.9), edgeMat);
  topEdge.position.y = H * 0.48;
  group.add(topEdge);
  const botEdge = topEdge.clone();
  botEdge.position.y = -H * 0.48;
  group.add(botEdge);

  const eyeM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilM = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const el = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), eyeM);
  el.position.set(-0.3, H * 0.15, D / 2 + 0.02);
  group.add(el);
  const er = el.clone();
  er.position.x = 0.3;
  group.add(er);

  const pl = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), pupilM);
  pl.position.set(-0.3, H * 0.15, D / 2 + 0.1);
  group.add(pl);
  const pr = pl.clone();
  pr.position.x = 0.3;
  group.add(pr);

  const mouthM = new THREE.MeshBasicMaterial({ color: 0x1a0a0a });
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.03, 6, 10, Math.PI),
    mouthM
  );
  mouth.position.set(0, H * 0.02, D / 2 + 0.02);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  group.userData.pupilL = pl;
  group.userData.pupilR = pr;

  return group;
}

// =====================================================
//  МЕШ СТАТУИ
// =====================================================
function makeStatueMesh() {
  const group = new THREE.Group();

  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x9a9aad });
  const darkMat  = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
  const glowMat  = new THREE.MeshBasicMaterial({ color: 0x66ddff });

  // Пьедестал
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 1.9), darkMat);
  base.position.y = 0.3;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.15, 2.1), stoneMat);
  baseTrim.position.y = 0.68;
  baseTrim.castShadow = true;
  group.add(baseTrim);

  // Тело — сужающийся столб
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.75, 2.2, 8), stoneMat);
  body.position.y = 1.85;
  body.castShadow = true;
  group.add(body);

  // Плечи
  const shoulderL = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.6), stoneMat);
  shoulderL.position.set(-0.75, 2.75, 0);
  shoulderL.castShadow = true;
  group.add(shoulderL);
  const shoulderR = shoulderL.clone();
  shoulderR.position.x = 0.75;
  group.add(shoulderR);

  // Руки
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 4, 8), stoneMat);
  armL.position.set(-0.75, 2.15, 0);
  armL.castShadow = true;
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.75;
  group.add(armR);

  // Голова
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 12), stoneMat);
  head.position.y = 3.4;
  head.castShadow = true;
  group.add(head);

  // Корона / тиара — узнаваемый силуэт
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.4, 6), darkMat);
  crown.position.y = 3.85;
  crown.castShadow = true;
  group.add(crown);

  // Светящиеся глаза
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), glowMat);
  eyeL.position.set(-0.18, 3.42, 0.45);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.18;
  group.add(eyeR);

  // Светящаяся полоса на груди
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.05), glowMat);
  chest.position.set(0, 2.3, 0.62);
  group.add(chest);

  return group;
}

function makeStatueHpBar() {
  const group = new THREE.Group();

  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.18),
    new THREE.MeshBasicMaterial({
      color: 0x1a1a2a, transparent: true, opacity: 0.85,
      depthWrite: false, side: THREE.DoubleSide,
    })
  );
  group.add(bg);

  const fg = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 0.18),
    new THREE.MeshBasicMaterial({
      color: 0x66ddff, depthWrite: false, side: THREE.DoubleSide,
    })
  );
  fg.position.z = 0.01;
  group.add(fg);

  group.userData.fg = fg;
  return group;
}

function updateStatueHpBar(s) {
  const ratio = Math.max(0, s.hp / s.maxHp);
  s.hpBar.userData.fg.scale.x = ratio;
  // Смещаем влево, чтобы уменьшалось от правого края
  s.hpBar.userData.fg.position.x = -(1 - ratio) * 0.8;

  // Меняем цвет по мере разрушения
  const mat = s.hpBar.userData.fg.material;
  if (ratio > 0.6) mat.color.setHex(0x66ddff);
  else if (ratio > 0.3) mat.color.setHex(0xffdd44);
  else mat.color.setHex(0xff5544);
}

// =====================================================
//  СТАТУИ — логика
// =====================================================
function spawnStatue() {
  const pos = findFreeSpot(STATUE_RADIUS + 1);

  const mesh = makeStatueMesh();
  mesh.position.set(pos.x, 0, pos.z);
  scene.add(mesh);

  const hpBar = makeStatueHpBar();
  hpBar.position.set(pos.x, 4.6, pos.z);
  scene.add(hpBar);

  statues.push({
    x: pos.x, z: pos.z,
    r: STATUE_RADIUS,
    hp: STATUE_HP,
    maxHp: STATUE_HP,
    mesh,
    hpBar,
    bobPhase: Math.random() * Math.PI * 2,
  });

  // Синяя вспышка при появлении
  burst(pos.x, pos.z, 0x66ddff);
}

function damageStatue(s, idx, amount) {
  s.hp -= amount;
  if (s.hp <= 0) {
    breakStatue(s, idx);
  } else {
    updateStatueHpBar(s);
  }
}

function breakStatue(s, idx) {
  // 10 XP-орбов разлетаются вокруг
  for (let i = 0; i < STATUE_XP_ORBS; i++) {
    const a = (i / STATUE_XP_ORBS) * Math.PI * 2 + Math.random() * 0.4;
    const d = 1.5 + Math.random() * 3;
    spawnXPOrb(s.x + Math.cos(a) * d, s.z + Math.sin(a) * d, STATUE_ORB_VALUE);
  }

  // Каменные осколки + синяя вспышка
  burst(s.x, s.z, 0x9a9aad);
  burst(s.x, s.z, 0x66ddff);

  scene.remove(s.mesh);
  scene.remove(s.hpBar);
  statues.splice(idx, 1);
}

// =====================================================
//  МЕШ УЧИТЕЛЯ — высокий строгий взрослый
// =====================================================
function makeTeacherMesh() {
  const group = new THREE.Group();

  const suitMat  = new THREE.MeshLambertMaterial({ color: 0x2a2a3a });
  const skinMat  = new THREE.MeshLambertMaterial({ color: 0xf0d0b0 });
  const hairMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const shoeMat  = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
  const eyeMat   = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const browMat  = new THREE.MeshBasicMaterial({ color: 0x000000 });

  // Торс — удлинённый
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.1, 6, 12), suitMat);
  torso.position.y = 1.6;
  torso.castShadow = true;
  group.add(torso);

  // Голова
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 10), skinMat);
  head.position.y = 2.75;
  head.castShadow = true;
  group.add(head);

  // Волосы — «полусфера» сверху
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    hairMat
  );
  hair.position.y = 2.82;
  group.add(hair);

  // Пучок на затылке
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), hairMat);
  bun.position.set(0, 2.95, -0.32);
  group.add(bun);

  // Очки — два кольца + перемычка
  const glassL = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 12), glassMat);
  glassL.position.set(-0.18, 2.78, 0.4);
  group.add(glassL);
  const glassR = glassL.clone();
  glassR.position.x = 0.18;
  group.add(glassR);
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.025), glassMat);
  bridge.position.set(0, 2.78, 0.42);
  group.add(bridge);

  // Глаза
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), eyeMat);
  eyeL.position.set(-0.18, 2.78, 0.42);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.18;
  group.add(eyeR);

  // Зрачки — направление вперёд, поворачиваются в апдейте
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), pupilMat);
  pupilL.position.set(-0.18, 2.78, 0.48);
  group.add(pupilL);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.18;
  group.add(pupilR);

  // Сердитые брови
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.03), browMat);
  browL.position.set(-0.18, 2.92, 0.4);
  browL.rotation.z = 0.3;
  group.add(browL);
  const browR = browL.clone();
  browR.position.x = 0.18;
  browR.rotation.z = -0.3;
  group.add(browR);

  // Злой рот
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.025, 6, 10, Math.PI),
    browMat
  );
  mouth.position.set(0, 2.58, 0.4);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  // Руки
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), suitMat);
  armL.position.set(-0.62, 1.9, 0);
  armL.rotation.z = 0.15;
  armL.castShadow = true;
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.62;
  armR.rotation.z = -0.15;
  group.add(armR);

  // Указка в правой руке
  const pointerMat = new THREE.MeshLambertMaterial({ color: 0xb57c4a });
  const pointer = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.4, 6), pointerMat);
  pointer.position.set(0.75, 1.4, 0.25);
  pointer.rotation.z = -0.35;
  pointer.castShadow = true;
  group.add(pointer);

  // Ноги
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.6, 4, 8), suitMat);
  legL.position.set(-0.18, 0.55, 0);
  legL.castShadow = true;
  group.add(legL);
  const legR = legL.clone();
  legR.position.x = 0.18;
  group.add(legR);

  // Туфли
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.42), shoeMat);
  shoeL.position.set(-0.18, 0.08, 0.08);
  group.add(shoeL);
  const shoeR = shoeL.clone();
  shoeR.position.x = 0.18;
  group.add(shoeR);

  group.userData.pupilL = pupilL;
  group.userData.pupilR = pupilR;

  return group;
}

function spawnEnemy() {
  const tier = Math.min(1 + Math.floor(level / 3), 5);

  // Определяем, будет ли это учитель
  const isTeacher = Math.random() < getTeacherProbability(level);

  // Точка спавна общая для всех
  let x, z, attempts = 0;
  do {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 10;
    x = hero.x + Math.cos(angle) * dist;
    z = hero.z + Math.sin(angle) * dist;
    attempts++;
  } while (attempts < 10 && isInsideHouse(x, z, 1.5));

  // ============================================================
  //  УЧИТЕЛЬ
  // ============================================================
  if (isTeacher) {
    const mesh = makeTeacherMesh();
    mesh.position.set(x, 0, z);
    scene.add(mesh);

    // Базовые характеристики учебника, умноженные на коэффициенты учителя
    const baseHp     = 12 + tier * 12;
    const baseDamage = 22 + tier * 6;
    const baseSpeed  = 2.2 + tier * 0.3;
    const baseXp     = (4 + tier * 2) + 3; // +3 как средний xpBonus

    const maxHp = Math.round(baseHp * TEACHER_HP_MULT);

    enemies.push({
      mesh, x, z,
      type: { name: 'УЧИТЕЛЬ', color: 0x000000, r: TEACHER_RADIUS },
      isTeacher: true,
      hp: maxHp, maxHp,
      speed: baseSpeed * TEACHER_SPEED_MULT,
      damage: Math.round(baseDamage * TEACHER_DMG_MULT),
      r: TEACHER_RADIUS,
      xpValue: Math.round(baseXp * TEACHER_XP_MULT),
      dying: false,
      dyingTimer: 0,
      kbX: 0, kbZ: 0,
      wobble: Math.random() * Math.PI * 2,
    });
    return;
  }

  // ============================================================
  //  УЧЕБНИК (как раньше)
  // ============================================================
  const roll = Math.random();
  let typeIndex = 0;
  if (level < 3) {
    typeIndex = roll < 0.6 ? 0 : 1;
  } else if (level < 6) {
    typeIndex = roll < 0.4 ? 0 : roll < 0.75 ? 1 : 2;
  } else {
    typeIndex = Math.floor(Math.random() * 4);
  }
  const type = BOOK_TYPES[typeIndex];

  const mesh = makeBookMesh(type);
  mesh.position.set(x, 0.9, z);
  scene.add(mesh);

  const maxHp = 12 + tier * 12;
  enemies.push({
    mesh, x, z,
    type,
    isTeacher: false,
    hp: maxHp, maxHp,
    speed: 2.2 + tier * 0.3,
    damage: 22 + tier * 6,
    r: type.r,
    xpValue: (4 + tier * 2) + type.xpBonus,
    dying: false,
    dyingTimer: 0,
    kbX: 0, kbZ: 0,
    wobble: Math.random() * Math.PI * 2,
  });
}

// =====================================================
//  КОЛЛИЗИИ С ДОМАМИ
// =====================================================
function isInsideHouse(x, z, radius = 0) {
  for (const h of houses) {
    if (x + radius > h.minX && x - radius < h.maxX &&
        z + radius > h.minZ && z - radius < h.maxZ) {
      return true;
    }
  }
  return false;
}

function resolveHouseCollision(px, pz, r) {
  for (const h of houses) {
    const cx = Math.max(h.minX, Math.min(px, h.maxX));
    const cz = Math.max(h.minZ, Math.min(pz, h.maxZ));
    const dx = px - cx;
    const dz = pz - cz;
    const d2 = dx * dx + dz * dz;

    if (d2 < r * r) {
      const d = Math.sqrt(d2) || 0.0001;
      const push = (r - d);
      px += (dx / d) * push;
      pz += (dz / d) * push;
    }
  }
  return { x: px, z: pz };
}

// =====================================================
//  УДАР РЮКЗАКОМ
// =====================================================
let lastAttack = 0;

function doAttack() {
  const now = performance.now();
  if (now - lastAttack < stats.cooldown) return;
  lastAttack = now;

  // ============================================================
  //  УДАР В ПРЫЖКЕ — AoE slam
  // ============================================================
    if (hero.isJumping && hero.height > 0.3) {
    hero.attackTimer = 0.3;
    const radius = stats.radius + JUMP_ATTACK_RADIUS_BONUS;

    // Урон зависит от высоты прыжка в момент удара:
    // у земли → ×1 (как обычный удар), в верхней точке → ×JUMP_ATTACK_MULT
    const maxHeight = JUMP_HEIGHT * (heroTransformTimer > 0 ? heroTransformJumpMult : 1);
    const heightRatio = Math.min(1, hero.height / maxHeight);
    const damage = stats.damage * (1 + heightRatio * (JUMP_ATTACK_MULT - 1));

    // Направление — на ближайшего
    let nearest = null, nd = Infinity;
    for (const e of enemies) {
      if (e.dying) continue;
      const d = Math.hypot(e.x - hero.x, e.z - hero.z);
      if (d < nd) { nd = d; nearest = e; }
    }
    if (boss.active) {
      const bd = Math.hypot(boss.x - hero.x, boss.z - hero.z);
      if (bd < nd) { nd = bd; nearest = { x: boss.x, z: boss.z }; }
    }
    if (nearest) hero.attackAngle = Math.atan2(nearest.z - hero.z, nearest.x - hero.x);

    // Урон всем врагам в радиусе 360°
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dying || e.flyingToBoss) continue;
      const dx = e.x - hero.x;
      const dz = e.z - hero.z;
      const dist = Math.hypot(dx, dz);
      if (dist > radius + e.r) continue;

      // ОСОБЫЙ СЛУЧАЙ: собака летит в босса
      if (e.isDog && boss.active) {
        e.flyingToBoss = true;
        e.hp = Infinity; // пока летит — неуязвим
        const bdx = boss.x - e.x;
        const bdz = boss.z - e.z;
        const bd = Math.hypot(bdx, bdz) || 1;
        e.flyVx = (bdx / bd) * 40;
        e.flyVz = (bdz / bd) * 40;
        burst(e.x, e.z, 0xffaa44);
        continue;
      }

      e.hp -= damage;
      if (e.hp <= 0) killEnemy(e, i);
    }

    // Босс
    if (boss.active) {
      const dx = boss.x - hero.x;
      const dz = boss.z - hero.z;
      if (Math.hypot(dx, dz) < radius + boss.r) damageBoss(damage);
    }

    // Статуи
    for (let i = statues.length - 1; i >= 0; i--) {
      const s = statues[i];
      const dx = s.x - hero.x;
      const dz = s.z - hero.z;
      if (Math.hypot(dx, dz) < radius + s.r) damageStatue(s, i, damage);
    }

    spawnJumpAttackEffect(hero.x, hero.z, radius);
    return;
  }

  // ============================================================
  //  ОБЫЧНЫЙ УДАР (как раньше)
  // ============================================================
  hero.attackTimer = 0.18;

  let nearest = null, nd = Infinity;
  for (const e of enemies) {
    if (e.dying || e.flyingToBoss) continue;
    const d = Math.hypot(e.x - hero.x, e.z - hero.z);
    if (d < nd) { nd = d; nearest = e; }
  }
  if (boss.active) {
    const bd = Math.hypot(boss.x - hero.x, boss.z - hero.z);
    if (bd < nd) { nd = bd; nearest = { x: boss.x, z: boss.z }; }
  }
  if (nearest) {
    hero.attackAngle = Math.atan2(nearest.z - hero.z, nearest.x - hero.x);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dying || e.flyingToBoss) continue;

    const dx = e.x - hero.x;
    const dz = e.z - hero.z;
    const dist = Math.hypot(dx, dz);
    if (dist > stats.radius + e.r) continue;

    let diff = Math.abs(Math.atan2(dz, dx) - hero.attackAngle);
    diff = Math.min(diff, Math.PI * 2 - diff);
    if (diff > 1.15) continue;

    e.hp -= stats.damage;
    const kb = 12;
    e.kbX = Math.cos(Math.atan2(dz, dx)) * kb;
    e.kbZ = Math.sin(Math.atan2(dz, dx)) * kb;

    if (e.hp <= 0) killEnemy(e, i);
  }

  if (boss.active) {
    const dx = boss.x - hero.x;
    const dz = boss.z - hero.z;
    const dist = Math.hypot(dx, dz);
    if (dist < stats.radius + boss.r) {
      let diff = Math.abs(Math.atan2(dz, dx) - hero.attackAngle);
      diff = Math.min(diff, Math.PI * 2 - diff);
      if (diff <= 1.15) damageBoss(stats.damage);
    }
  }

  for (let i = statues.length - 1; i >= 0; i--) {
    const s = statues[i];
    const dx = s.x - hero.x;
    const dz = s.z - hero.z;
    const dist = Math.hypot(dx, dz);
    if (dist > stats.radius + s.r) continue;
    let diff = Math.abs(Math.atan2(dz, dx) - hero.attackAngle);
    diff = Math.min(diff, Math.PI * 2 - diff);
    if (diff <= 1.15) damageStatue(s, i, stats.damage);
  }
}

// =====================================================
//  ВИЗУАЛЬНЫЙ ЭФФЕКТ УДАРА В ПРЫЖКЕ
// =====================================================
function spawnJumpAttackEffect(x, z, r) {
  const geo = new THREE.RingGeometry(r * 0.6, r, 40);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffff88, transparent: true, opacity: 0.9,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.12, z);
  scene.add(ring);

  const start = performance.now();
  function anim() {
    const t = (performance.now() - start) / 400;
    if (t >= 1) { scene.remove(ring); return; }
    const scale = 1 + t * 0.6;
    ring.scale.set(scale, scale, 1);
    mat.opacity = 0.9 * (1 - t);
    requestAnimationFrame(anim);
  }
  anim();

  // Дополнительный вертикальный столб света
  const beamGeo = new THREE.CylinderGeometry(r * 0.5, r * 0.8, 6, 20, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xffffaa, transparent: true, opacity: 0.5,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(x, 3, z);
  scene.add(beam);

  const start2 = performance.now();
  function animBeam() {
    const t = (performance.now() - start2) / 350;
    if (t >= 1) { scene.remove(beam); return; }
    beam.scale.x = beam.scale.z = 1 + t * 1.2;
    beamMat.opacity = 0.5 * (1 - t);
    requestAnimationFrame(animBeam);
  }
  animBeam();
}

function spawnHammerHitEffect(x, z) {
  // Золотое кольцо вокруг героя
  const ringGeo = new THREE.RingGeometry(0.5, 0.9, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd966, transparent: true, opacity: 0.9,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.15, z);
  scene.add(ring);

  const start = performance.now();
  function anim() {
    const t = (performance.now() - start) / 500;
    if (t >= 1) { scene.remove(ring); return; }
    const s = 1 + t * 4;
    ring.scale.set(s, s, 1);
    ringMat.opacity = 0.9 * (1 - t);
    requestAnimationFrame(anim);
  }
  anim();

  // Искры
  burst(x, z, 0xffd966);
  burst(x, z, 0xffee88);
}

// =====================================================
//  УДАР МОЛОТОМ — активная способность (двойной Shift)
// =====================================================
function triggerHammerSlam() {
  const lvl = weaponLevel('hammer');
  if (lvl < 2) return;
  if (hammerSlamCooldown > 0) return;
  if (hammerSlamState.active) return;
  if (!gameActive || paused) return;

  const def = WEAPONS.find(w => w.id === 'hammer');
  hammerSlamState.active = true;
  hammerSlamState.timer = 0;
  hammerSlamState.duration = 0.7;
  hammerSlamState.damage = stats.damage * def.slamDamageMult[lvl - 1];
  hammerSlamState.radius = def.slamRadius[lvl - 1];
  hammerSlamState.landed = false;

  // Отменяем текущий прыжок — герой "перепрыгивает" в молот
  hero.isJumping = false;
  hero.height = 0;
  keys.shift = 0;

  // Подсказка игроку — золотая вспышка
  burst(hero.x, hero.z, 0xffd966);
}

function updateHammerSlam(dt) {
  // Откат способности
  if (hammerSlamCooldown > 0) {
    hammerSlamCooldown -= dt * 1000;
    if (hammerSlamCooldown < 0) hammerSlamCooldown = 0;
  }

  if (!hammerSlamState.active) return;

  hammerSlamState.timer += dt;
  const t = hammerSlamState.timer / hammerSlamState.duration;

  if (t < 0.5) {
    // Подъём
    const phase = t / 0.5;
    hero.height = Math.sin(phase * Math.PI / 2) * 6.5;
    // Вращение героя вокруг оси
    heroGroup.rotation.y += dt * 20;
  } else {
    // Падение
    const phase = (t - 0.5) / 0.5;
    hero.height = Math.cos(phase * Math.PI / 2) * 6.5;
    heroGroup.rotation.y += dt * 20;
  }

  // Анимация рук с молотом — поднимаем над головой
  if (weaponMeshes.hammer) {
    const lift = t < 0.5 ? -t * 4 : -2 + (t - 0.5) * 8;
    weaponMeshes.hammer.position.set(-0.2, 2.5 + Math.abs(lift) * 0.5, 0.3);
    weaponMeshes.hammer.rotation.z = 0.4 + lift;
  }

  if (!hammerSlamState.landed && t >= 1) {
    hammerSlamState.landed = true;
    const r = hammerSlamState.radius;
    const dmg = hammerSlamState.damage;

    // AoE урон
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dying || e.flyingToBoss) continue;
      const d = Math.hypot(e.x - hero.x, e.z - hero.z);
      if (d < r + e.r) {
        // Собак не убиваем — отправляем в босса
        if (e.isDog && boss.active) {
          e.flyingToBoss = true;
          e.hp = Infinity;
          const bdx = boss.x - e.x;
          const bdz = boss.z - e.z;
          const bd = Math.hypot(bdx, bdz) || 1;
          e.flyVx = (bdx / bd) * 40;
          e.flyVz = (bdz / bd) * 40;
          continue;
        }
        e.hp -= dmg;
        if (e.hp <= 0) killEnemy(e, i);
      }
    }

    // Босс
    if (boss.active && Math.hypot(boss.x - hero.x, boss.z - hero.z) < r + boss.r) {
      damageBoss(dmg);
    }

    // Статуи
    for (let i = statues.length - 1; i >= 0; i--) {
      const s = statues[i];
      if (Math.hypot(s.x - hero.x, s.z - hero.z) < r + s.r) {
        damageStatue(s, i, dmg);
      }
    }

    spawnHammerSlamEffect(hero.x, hero.z, r);

    // Откат способности
    const def = WEAPONS.find(w => w.id === 'hammer');
    hammerSlamCooldown = def.slamCooldown[weaponLevel('hammer') - 1];

    hammerSlamState.active = false;
    hero.height = 0;
    heroGroup.rotation.y = hero.attackAngle + Math.PI;
  }
}

function spawnHammerSlamEffect(x, z, r) {
  // Расширяющееся золотое кольцо
  const ringGeo = new THREE.RingGeometry(r * 0.3, r, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffd966, transparent: true, opacity: 1,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.15, z);
  scene.add(ring);

  const start = performance.now();
  function animRing() {
    const t = (performance.now() - start) / 500;
    if (t >= 1) { scene.remove(ring); return; }
    const s = 1 + t * 0.5;
    ring.scale.set(s, s, 1);
    ringMat.opacity = (1 - t);
    requestAnimationFrame(animRing);
  }
  animRing();

  // Ударная волна — расширяющееся плоское кольцо
  const shockGeo = new THREE.RingGeometry(r * 0.9, r * 1.05, 40);
  const shockMat = new THREE.MeshBasicMaterial({
    color: 0xffee88, transparent: true, opacity: 0.9,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const shock = new THREE.Mesh(shockGeo, shockMat);
  shock.rotation.x = -Math.PI / 2;
  shock.position.set(x, 0.1, z);
  scene.add(shock);

  const start2 = performance.now();
  function animShock() {
    const t = (performance.now() - start2) / 400;
    if (t >= 1) { scene.remove(shock); return; }
    const s = 1 + t * 1.8;
    shock.scale.set(s, s, 1);
    shockMat.opacity = 0.9 * (1 - t);
    requestAnimationFrame(animShock);
  }
  animShock();

  // Взрыв частиц
  for (let i = 0; i < 3; i++) burst(x, z, 0xffd966);
  burst(x, z, 0xfff5aa);

  // Тряска экрана
  cameraShake(0.25);
}

// Тряска камеры
let cameraShakeAmount = 0;
function cameraShake(amount) {
  cameraShakeAmount = Math.max(cameraShakeAmount, amount);
}

// =====================================================
//  ОПЫТ И УРОВНИ
// =====================================================
function addXP(v) {
  xp += v;
  while (xp >= xpNext) {
    xp -= xpNext;
    level++;
    xpNext = Math.floor(xpNext * 1.35 + 10);
    hp = Math.min(stats.maxHp, hp + stats.maxHp * 0.2);
    levelUpQueue++;

    if (level >= nextWeaponLevel) {
      nextWeaponLevel += 5;
      weaponChoiceQueue++;
    }

    if (level >= nextRescueLevel) {
      nextRescueLevel += 4;
      spawnRescueZone();
    }

  }
  updateHud();

  if (weaponChoiceQueue > 0 && !paused) {
    openWeaponChoice();
  } else if (levelUpQueue > 0 && !paused) {
    openLevelUp();
  }
}

// =====================================================
//  ПРОКАЧКА
// =====================================================
const UPGRADES = [
  { ico: '💪', name: 'Толще', desc: '+30 макс. HP и +30 HP',
    apply: () => { stats.maxHp += 30; hp = Math.min(stats.maxHp, hp + 30); } },
  { ico: '👟', name: 'Быстрые ноги', desc: '+1.5 к скорости',
    apply: () => { stats.speed += 1.5; } },
  { ico: '🎒', name: 'Тяжёлый рюкзак', desc: '+6 к урону удара рюкзаком',
    apply: () => { stats.damage += 6; } },
  { ico: '🌀', name: 'Широкий замах', desc: '+0.6 к радиусу удара',
    apply: () => { stats.radius += 0.6; } },
  { ico: '⚡', name: 'Скорость удара', desc: '-100 мс перезарядки удара',
    apply: () => { stats.cooldown = Math.max(250, stats.cooldown - 100); } },
  { ico: '🍔', name: 'Перекус', desc: '+1.5 HP/сек регенерации',
    apply: () => { stats.regen += 1.5; } },
  { ico: '🧲', name: 'Магнит', desc: '+2.5 к радиусу сбора опыта',
    apply: () => { stats.magnet += 2.5; } },
  { ico: '🛡️', name: 'Плотный пиджак', desc: '+20 макс. HP',
    apply: () => { stats.maxHp += 20; } },
  { ico: '📚', name: 'Закалённый', desc: '+10 к урону рюкзака, -80 мс перезарядки',
    apply: () => { stats.damage += 10; stats.cooldown = Math.max(250, stats.cooldown - 80); } },
  { ico: '🦘', name: 'Прыгучий', desc: '-400 мс откат прыжка',
    apply: () => { jumpCooldownBonus += 400; } },
  // ─── Карточки усиления оружия (появляются только если оружие взято) ───
  { ico: '🖊️', name: 'Острая ручка',
    desc: '+12 к урону ручки',
    condition: () => !!equippedWeapons.pen,
    apply: () => { weaponDamageFlat.pen += 12; } },

  { ico: '👝', name: 'Тяжёлый мешок',
    desc: '+8 к урону в секунду у мешка',
    condition: () => !!equippedWeapons.bag,
    apply: () => { weaponDamageFlat.bag += 8; } },

  { ico: '📏', name: 'Стальная линейка',
    desc: '+10 к урону линейки',
    condition: () => !!equippedWeapons.ruler,
    apply: () => { weaponDamageFlat.ruler += 10; } },

  { ico: '🎯', name: 'Тугая резинка',
    desc: '+18 к урону рогатки',
    condition: () => !!equippedWeapons.slingshot,
    apply: () => { weaponDamageFlat.slingshot += 18; } },
];

let jumpCooldownBonus = 0;

const overlay = document.getElementById('levelup');
const cardsEl = document.getElementById('cards');

function openLevelUp() {
  paused = true;
  overlay.classList.add('active');
  // Оставляем только карточки, у которых нет condition или condition === true
  const pool = UPGRADES.filter(u => !u.condition || u.condition());
  cardsEl.innerHTML = '';

  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const u = pool.splice(idx, 1)[0];
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="ico">${u.ico}</div>
      <div class="name">${u.name}</div>
      <div class="desc">${u.desc}</div>
    `;
    card.onclick = () => {
      u.apply();
      updateHud();
      overlay.classList.remove('active');
      paused = false;
      levelUpQueue--;
      if (weaponChoiceQueue > 0) {
        setTimeout(openWeaponChoice, 60);
      } else if (levelUpQueue > 0) {
        setTimeout(openLevelUp, 60);
      }
    };
    cardsEl.appendChild(card);
  }
}

// =====================================================
//  ВЫБОР ОРУЖИЯ
// =====================================================
const weaponOverlay = document.getElementById('weaponchoice');
const weaponCardsEl = document.getElementById('weaponCards');
const skipBtn = document.getElementById('skipWeapon');

function openWeaponChoice() {
  paused = true;
  weaponOverlay.classList.add('active');
  weaponCardsEl.innerHTML = '';

  for (const w of WEAPONS) {
    const owned = !!equippedWeapons[w.id];
    const lvl = owned ? equippedWeapons[w.id].level : 0;
    const maxed = lvl >= w.maxLevel;

    const card = document.createElement('div');
    card.className = 'weapon-card' + (owned ? ' owned' : '');

    let levelLabel;
    if (maxed) levelLabel = '★ МАКСИМУМ';
    else if (owned) levelLabel = `Уровень ${lvl} → ${lvl + 1}`;
    else levelLabel = 'НОВОЕ ОРУЖИЕ';

    const upgradeBadge = maxed ? '' : `<div class="wupgrade">${owned ? 'УЛУЧШИТЬ' : 'ВЗЯТЬ'}</div>`;

    card.innerHTML = `
      <div class="wico">${w.ico}</div>
      <div class="wname">${w.name}</div>
      <div class="wlevel">${levelLabel}</div>
      <div class="wdesc">${w.desc}</div>
      ${upgradeBadge}
    `;

    if (maxed) {
      card.style.opacity = '0.55';
      card.style.cursor = 'not-allowed';
      card.onclick = null;
    } else {
      card.onclick = () => {
        giveWeapon(w.id);
        weaponOverlay.classList.remove('active');
        paused = false;
        weaponChoiceQueue--;
        if (weaponChoiceQueue > 0) {
          setTimeout(openWeaponChoice, 60);
        } else if (levelUpQueue > 0) {
          setTimeout(openLevelUp, 60);
        }
      };
    }

    weaponCardsEl.appendChild(card);
  }
}

skipBtn.onclick = () => {
  weaponOverlay.classList.remove('active');
  paused = false;
  weaponChoiceQueue--;
  if (weaponChoiceQueue > 0) {
    setTimeout(openWeaponChoice, 60);
  } else if (levelUpQueue > 0) {
    setTimeout(openLevelUp, 60);
  }
};

// =====================================================
//  ЧАСТИЦЫ
// =====================================================
const particleGeo = new THREE.SphereGeometry(0.12, 6, 6);

function burst(x, z, color) {
  for (let i = 0; i < 10; i++) {
    const mat = new THREE.MeshBasicMaterial({ color });
    const p = new THREE.Mesh(particleGeo, mat);
    p.position.set(x, 1, z);

    const a = Math.random() * Math.PI * 2;
    const sp = 3 + Math.random() * 4;
    p.userData = { vx: Math.cos(a) * sp, vz: Math.sin(a) * sp, life: 0.6 };
    scene.add(p);
    particles.push(p);
  }
}

// =====================================================
//  ИНДИКАТОР РАДИУСА АТАКИ
// =====================================================
function updateAttackIndicator() {
  const r = stats.radius;

  attackRing.position.x = hero.x;
  attackRing.position.z = hero.z;
  attackRing.scale.set(r, r, r);

  attackDisc.position.x = hero.x;
  attackDisc.position.z = hero.z;
  attackDisc.scale.set(r * 0.98, r * 0.98, r * 0.98);

  const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.02;
  attackRing.scale.set(r * pulse, r * pulse, r * pulse);

  attackArc.position.x = hero.x;
  attackArc.position.z = hero.z;

  if (hero.attackTimer > 0) {
    const t = hero.attackTimer / 0.18;
    attackArc.scale.set(r, r, r);
    attackArc.rotation.z = -hero.attackAngle + Math.PI / 2;
    attackArcMat.opacity = t * 0.55;
  } else {
    attackArcMat.opacity = 0;
  }

  if (hero.attackTimer > 0) {
    attackRingMat.opacity = 0.7;
    attackRingMat.color.setHex(0xffe066);
  } else {
    attackRingMat.opacity = 0.3;
    attackRingMat.color.setHex(0xfff5a0);
  }
}

// =====================================================
//  ПРЫЖОК
// =====================================================
function updateJump(dt) {
  if (hero.jumpCooldown > 0) {
    hero.jumpCooldown -= dt * 1000;
    if (hero.jumpCooldown < 0) hero.jumpCooldown = 0;
  }

  if (keys.shift && !hero.isJumping && hero.jumpCooldown <= 0 &&
      gameActive && !paused && !hammerSlamState.active) {
    hero.isJumping = true;
    hero.jumpTimer = JUMP_DURATION;
    hero.jumpCooldown = Math.max(600, JUMP_COOLDOWN - jumpCooldownBonus);
    keys.shift = 0;
  }

    if (hero.isJumping) {
    hero.jumpTimer -= dt;
    const progress = 1 - (hero.jumpTimer / JUMP_DURATION);
    const jumpMul = heroTransformTimer > 0 ? heroTransformJumpMult : 1;
    hero.height = Math.sin(progress * Math.PI) * JUMP_HEIGHT * jumpMul;

    if (hero.jumpTimer <= 0) {
      hero.isJumping = false;
      hero.height = 0;
    }
  } else if (!hammerSlamState.active) {
    hero.height = 0;
  }
}

// =====================================================
//  КАМЕРА
// =====================================================
function updateCamera() {
  const camDist = 22;
  const camHeight = 18;

  const targetX = hero.x;
  const targetZ = hero.z + camDist;

  camera.position.x += (targetX - camera.position.x) * 0.08;
  camera.position.z += (targetZ - camera.position.z) * 0.08;
  camera.position.y = camHeight;

  // Тряска камеры
  if (cameraShakeAmount > 0) {
    camera.position.x += (Math.random() - 0.5) * cameraShakeAmount * 2;
    camera.position.y += (Math.random() - 0.5) * cameraShakeAmount * 2;
    camera.position.z += (Math.random() - 0.5) * cameraShakeAmount * 2;
    cameraShakeAmount *= 0.85;
    if (cameraShakeAmount < 0.01) cameraShakeAmount = 0;
  }

  camera.lookAt(hero.x, 1.5 + hero.height * 0.4, hero.z);

  sun.position.set(hero.x + 30, 50, hero.z + 20);
  sun.target.position.set(hero.x, 0, hero.z);
  sun.target.updateMatrixWorld();
}

// =====================================================
//  МИНИКАРТА
// =====================================================
const minimapCanvas = document.getElementById('minimap');
const mmCtx = minimapCanvas.getContext('2d');
const MM_SIZE = 220;

function worldToMinimap(wx, wz) {
  const mx = ((wx + MAP / 2) / MAP) * MM_SIZE;
  const mz = ((wz + MAP / 2) / MAP) * MM_SIZE;
  return { x: mx, y: mz };
}

function drawMinimap() {
  mmCtx.fillStyle = '#3a5738';
  mmCtx.fillRect(0, 0, MM_SIZE, MM_SIZE);

  mmCtx.strokeStyle = 'rgba(120, 170, 120, 0.18)';
  mmCtx.lineWidth = 1;
  const gridStep = MM_SIZE / 10;
  for (let i = 1; i < 10; i++) {
    mmCtx.beginPath();
    mmCtx.moveTo(i * gridStep, 0);
    mmCtx.lineTo(i * gridStep, MM_SIZE);
    mmCtx.stroke();
    mmCtx.beginPath();
    mmCtx.moveTo(0, i * gridStep);
    mmCtx.lineTo(MM_SIZE, i * gridStep);
    mmCtx.stroke();
  }

  for (const h of houses) {
    const a = worldToMinimap(h.minX, h.minZ);
    const b = worldToMinimap(h.maxX, h.maxZ);
    mmCtx.fillStyle = 'rgba(180, 130, 90, 0.9)';
    mmCtx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    mmCtx.strokeStyle = '#7a3a2a';
    mmCtx.lineWidth = 2;
    mmCtx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  }

  for (const orb of xpOrbs) {
    const p = worldToMinimap(orb.x, orb.z);
    mmCtx.beginPath();
    mmCtx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
    mmCtx.fillStyle = '#4fc3f7';
    mmCtx.fill();
  }

    // СТАТУИ — сине-белые ромбы
  for (const s of statues) {
    const p = worldToMinimap(s.x, s.z);
    mmCtx.save();
    mmCtx.translate(p.x, p.y);
    mmCtx.rotate(Math.PI / 4);
    mmCtx.fillStyle = 'rgba(102, 221, 255, 0.85)';
    mmCtx.fillRect(-4, -4, 8, 8);
    mmCtx.strokeStyle = '#ffffff';
    mmCtx.lineWidth = 1.5;
    mmCtx.strokeRect(-4, -4, 8, 8);
    mmCtx.restore();
  }

  for (const z of zones) {
    const p = worldToMinimap(z.x, z.z);
    const mmR = Math.max(4, z.radius / MAP * MM_SIZE);
    mmCtx.beginPath();
    mmCtx.arc(p.x, p.y, mmR, 0, Math.PI * 2);
    if (z.type === 'buff') {
      mmCtx.fillStyle = 'rgba(79, 195, 247, 0.35)';
      mmCtx.strokeStyle = '#4fc3f7';
    } else {
      if (z.insideSafe) {
        mmCtx.fillStyle = 'rgba(68, 255, 68, 0.35)';
        mmCtx.strokeStyle = '#44ff44';
      } else {
        mmCtx.fillStyle = 'rgba(255, 51, 51, 0.35)';
        mmCtx.strokeStyle = '#ff3333';
      }
    }
    mmCtx.fill();
    mmCtx.lineWidth = 2.5;
    mmCtx.stroke();

    mmCtx.fillStyle = '#ffffff';
    mmCtx.font = 'bold 11px Arial';
    mmCtx.textAlign = 'center';
    mmCtx.textBaseline = 'middle';
    mmCtx.fillText(Math.ceil(z.timeLeft), p.x, p.y);
  }

  // БОСС на миникарте — большой фиолетовый круг
  if (boss.active) {
    const p = worldToMinimap(boss.x, boss.z);
    mmCtx.beginPath();
    mmCtx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    mmCtx.fillStyle = '#ff40ff';
    mmCtx.fill();
    mmCtx.strokeStyle = '#ffffff';
    mmCtx.lineWidth = 2;
    mmCtx.stroke();
    // Пульсирующее кольцо вокруг босса
    const pulse = 8 + Math.sin(performance.now() * 0.008) * 2;
    mmCtx.beginPath();
    mmCtx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
    mmCtx.strokeStyle = 'rgba(255, 64, 255, 0.7)';
    mmCtx.lineWidth = 2;
    mmCtx.stroke();
  }

  // Снаряды босса
  for (const p of bossProjectiles) {
    const mp = worldToMinimap(p.position.x, p.position.z);
    mmCtx.beginPath();
    mmCtx.arc(mp.x, mp.y, 2.5, 0, Math.PI * 2);
    mmCtx.fillStyle = '#88ff44';
    mmCtx.fill();
  }

    for (const e of enemies) {
    if (e.dying) continue;
    const p = worldToMinimap(e.x, e.z);
    mmCtx.beginPath();
    if (e.isTeacher) {
      // Учителя — крупнее, чёрные с белым контуром
      mmCtx.arc(p.x, p.y, 3.6, 0, Math.PI * 2);
      mmCtx.fillStyle = '#000000';
      mmCtx.fill();
      mmCtx.strokeStyle = '#ffffff';
      mmCtx.lineWidth = 1.8;
      mmCtx.stroke();
    } else {
      mmCtx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
      mmCtx.fillStyle = '#' + e.type.color.toString(16).padStart(6, '0');
      mmCtx.fill();
      mmCtx.strokeStyle = 'rgba(0,0,0,0.6)';
      mmCtx.lineWidth = 1;
      mmCtx.stroke();
    }
  }

  for (const p of projectiles) {
    const mp = worldToMinimap(p.position.x, p.position.z);
    mmCtx.beginPath();
    mmCtx.arc(mp.x, mp.y, 2, 0, Math.PI * 2);
    mmCtx.fillStyle = '#c8ff80';
    mmCtx.fill();
  }

  const hp2 = worldToMinimap(hero.x, hero.z);
  mmCtx.beginPath();
  mmCtx.arc(hp2.x, hp2.y, 4, 0, Math.PI * 2);
  mmCtx.fillStyle = '#ffd966';
  mmCtx.fill();
  mmCtx.strokeStyle = '#ffffff';
  mmCtx.lineWidth = 1.5;
  mmCtx.stroke();

  if (equippedWeapons.bag && bagMesh) {
    const bp = worldToMinimap(bagMesh.position.x, bagMesh.position.z);
    mmCtx.beginPath();
    mmCtx.arc(bp.x, bp.y, 4, 0, Math.PI * 2);
    mmCtx.fillStyle = '#c89050';
    mmCtx.fill();
    mmCtx.strokeStyle = '#3a2010';
    mmCtx.lineWidth = 1;
    mmCtx.stroke();
  }

  mmCtx.fillStyle = 'rgba(0,0,0,0.55)';
  mmCtx.font = 'bold 12px Arial';
  mmCtx.textAlign = 'center';
  mmCtx.textBaseline = 'middle';
  mmCtx.fillText('С', MM_SIZE / 2, 8);
  mmCtx.fillText('Ю', MM_SIZE / 2, MM_SIZE - 8);
  mmCtx.fillText('З', 8, MM_SIZE / 2);
  mmCtx.fillText('В', MM_SIZE - 8, MM_SIZE / 2);
}

// =====================================================
//  ИГРОВОЙ ЦИКЛ
// =====================================================
let last = performance.now();
let spawnTimer = 0;

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (gameActive && !paused) {
    updateJump(dt);

      // Движение героя
    let mx = 0, mz = 0;
    if (!hammerSlamState.active) {
      if (keys.w || keys.up) mz -= 1;
      if (keys.s || keys.down) mz += 1;
      if (keys.a || keys.left) mx -= 1;
      if (keys.d || keys.right) mx += 1;
    }

    if (mx || mz) {
      const l = Math.hypot(mx, mz);
      const speedMul = heroTransformTimer > 0 ? heroTransformSpeedMult : 1;
      const curSpeed = stats.speed * speedMul;
      const nx = hero.x + (mx / l) * curSpeed * dt;
      const nz = hero.z + (mz / l) * curSpeed * dt;

      let tryX = resolveHouseCollision(nx, hero.z, 0.9);
      let tryZ = resolveHouseCollision(hero.x, nz, 0.9);
      let tryBoth = resolveHouseCollision(nx, nz, 0.9);

      if (!isInsideHouse(tryBoth.x, tryBoth.z, 0)) {
        hero.x = tryBoth.x;
        hero.z = tryBoth.z;
      } else if (!isInsideHouse(tryX.x, tryX.z, 0)) {
        hero.x = tryX.x;
      } else if (!isInsideHouse(tryZ.x, tryZ.z, 0)) {
        hero.z = tryZ.z;
      }

      hero.walkPhase += dt * 10;

      const targetRot = Math.atan2(mx, mz);
      let diff = targetRot - heroGroup.rotation.y;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      heroGroup.rotation.y += diff * 0.2;
    } else {
      hero.walkPhase *= 0.9;
    }

    hero.x = Math.max(-MAP / 2 + 2, Math.min(MAP / 2 - 2, hero.x));
    hero.z = Math.max(-MAP / 2 + 2, Math.min(MAP / 2 - 2, hero.z));
    heroGroup.position.set(hero.x, hero.height, hero.z);

    if (!hero.isJumping) {
      const swing = Math.sin(hero.walkPhase) * 0.4;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.7;
      armR.rotation.x = swing * 0.7;
      torso.position.y = 1.5 + Math.abs(Math.sin(hero.walkPhase)) * 0.06;
    }

    if (hero.attackTimer > 0) {
      hero.attackTimer -= dt;
      const t = Math.max(0, hero.attackTimer / 0.18);
      armR.rotation.x = -1.8 * t;
      heroGroup.rotation.y = hero.attackAngle + Math.PI;
    } else if (!(mx || mz) && !hero.isJumping) {
      armR.rotation.x *= 0.85;
    }

    if (hero.isJumping) {
      legL.rotation.x = -0.9;
      legR.rotation.x = -0.9;
      armL.rotation.x = -1.5;
      if (hero.attackTimer <= 0) {
        armR.rotation.x = -1.5;
      }
      torso.position.y = 1.5;
    }

    if (stats.regen > 0) {
      hp = Math.min(stats.maxHp, hp + stats.regen * dt);
    }
    updateHud();
    updateWeaponHud();

    updateHammerSlam(dt);
    useWeapons(dt);
    updateXpOrbs(dt);

    updateZones(dt);
    updateZoneHUD();

    // СТАТУИ — спавн раз в 60 секунд
    if (now - lastStatueSpawn > STATUE_INTERVAL && statues.length < 4) {
      spawnStatue();
      lastStatueSpawn = now;
    }
    // Обновление статуй (парение, HP-бар лицом к камере)
    for (const s of statues) {
      s.bobPhase += dt * 1.6;
      s.mesh.position.y = 0.05 + Math.sin(s.bobPhase) * 0.08;
      s.hpBar.position.y = 4.6 + Math.sin(s.bobPhase) * 0.08;
      s.hpBar.lookAt(camera.position.x, s.hpBar.position.y, camera.position.z);
    }

    // ТАЙМЕР БОССА — 3 минуты между появлениями
    if (!boss.active) {
      bossTimer += dt;
      if (bossTimer >= BOSS_INTERVAL) {
        bossTimer = 0;
        spawnBoss();
      }
    }

    // БОСС
    updateBoss(dt);
    updateBossProjectiles(dt);

    // Враги
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.wobble += dt * 6;

            // === ЛЕТЯЩАЯ СОБАКА (отброшена ударом в прыжке) ===
      if (e.isDog && e.flyingToBoss) {
        e.x += e.flyVx * dt;
        e.z += e.flyVz * dt;
        e.wobble += dt * 20;

        // Вращение в полёте + свечение
        e.mesh.position.set(e.x, 1.5 + Math.sin(e.wobble) * 0.3, e.z);
        e.mesh.rotation.x += dt * 14;
        e.mesh.rotation.z += dt * 10;

        // Долетела до босса — урон
        if (boss.active) {
          const d = Math.hypot(boss.x - e.x, boss.z - e.z);
          if (d < boss.r + 1.2) {
            const dmg = DOG_RETURN_DAMAGE_PER_LEVEL * level;
            damageBoss(dmg);
            burst(e.x, e.z, 0xff88ff);
            burst(e.x, e.z, 0x88ff44);
            scene.remove(e.mesh);
            enemies.splice(i, 1);
            continue;
          }
        } else {
          // Босс умер — собака просто исчезает
          scene.remove(e.mesh);
          enemies.splice(i, 1);
          continue;
        }
        continue;
      }

      if (e.dying) {
        e.dyingTimer -= dt;
        e.x += e.kbX * dt;
        e.z += e.kbZ * dt;
        e.kbX *= 0.9;
        e.kbZ *= 0.9;
        e.mesh.position.set(e.x, 0.9 + (0.25 - e.dyingTimer) * 2, e.z);
        e.mesh.rotation.z += dt * 8;
        e.mesh.rotation.x += dt * 5;
        e.mesh.scale.multiplyScalar(1 - dt * 1.5);

        if (e.dyingTimer <= 0) {
          scene.remove(e.mesh);
          enemies.splice(i, 1);
        }
        continue;
      }

      e.x += e.kbX * dt;
      e.z += e.kbZ * dt;
      e.kbX *= 0.88;
      e.kbZ *= 0.88;

      const dx = hero.x - e.x;
      const dz = hero.z - e.z;
      const d = Math.hypot(dx, dz) || 1;
      let nx = e.x + (dx / d) * e.speed * dt;
      let nz = e.z + (dz / d) * e.speed * dt;

      const resolved = resolveHouseCollision(nx, nz, e.r * 0.6);
      e.x = resolved.x;
      e.z = resolved.z;

      if (e.isDog) {
        // Собака бежит по земле
        e.wobble += dt * 4;
        e.mesh.position.set(e.x, 0.05 + Math.abs(Math.sin(e.wobble * 3)) * 0.08, e.z);
        e.mesh.rotation.z = Math.sin(e.wobble * 3) * 0.06;
        e.mesh.lookAt(hero.x, e.mesh.position.y, hero.z);
      } else if (e.isTeacher) {
        // Учитель идёт с покачиванием
        const step = Math.abs(Math.sin(e.wobble * 1.5));
        e.mesh.position.set(e.x, step * 0.15, e.z);
        e.mesh.rotation.z = Math.sin(e.wobble * 1.5) * 0.05;
        e.mesh.rotation.y = Math.atan2(hero.x - e.x, hero.z - e.z);
        const pointer = e.mesh.children.find(c => c.geometry && c.geometry.type === 'CylinderGeometry');
        if (pointer) pointer.rotation.z = -0.35 + Math.sin(e.wobble * 3) * 0.15;
      } else {
        // Учебник парит
        e.mesh.position.set(e.x, 1.0 + Math.sin(e.wobble) * 0.12, e.z);
        e.mesh.rotation.z = Math.sin(e.wobble * 0.7) * 0.12;
        e.mesh.rotation.y = Math.atan2(hero.x - e.x, hero.z - e.z);
      }

      const ud = e.mesh.userData;
      if (ud.pupilL) {
        const a = Math.atan2(hero.x - e.x, hero.z - e.z);
        const ox = Math.cos(a) * 0.04;
        const oz = Math.sin(a) * 0.04;
        ud.pupilL.position.x = -0.3 + ox;
        ud.pupilL.position.z = 0.24 + oz * 0.2;
        ud.pupilR.position.x = 0.3 + ox;
        ud.pupilR.position.z = 0.24 + oz * 0.2;
      }

      if (d < 1.3 && hero.height < JUMP_SAFE_HEIGHT && !e.flyingToBoss) {
        hp -= e.damage * dt * 4;
        if (hp <= 0 && gameActive) {
          hp = 0;
          gameActive = false;
          document.getElementById('bossHud').classList.remove('active');
          showGameOver();
        }
        updateHud();
      }
    }

    // Спавн врагов (реже во время боя с боссом)
    spawnTimer += dt;
    const spawnMultiplier = boss.active ? 2.2 : 1;
    let interval = Math.max(0.3, (1.1 - level * 0.04)) * spawnMultiplier;

    // С 7 уровня учителя начинают появляться, но учебников становится меньше
    if (level >= 7) {
      // 0 при 7 ур → 0.5 при 17 ур
      const reduction = Math.min(0.5, (level - 7) * 0.05);
      interval *= (1 + reduction);
    }

    if (spawnTimer > interval) {
      spawnTimer = 0;
      let count = boss.active ? 1 : (1 + Math.floor(level / 4));
      // Количество врагов тоже уменьшается на высоких уровнях
      if (level >= 7) {
        count = Math.max(1, Math.ceil(count * (1 - Math.min(0.5, (level - 7) * 0.05))));
      }
      for (let i = 0; i < Math.min(count, 5); i++) spawnEnemy();
    }
  }

  // Частицы
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.userData.life -= dt;
    p.position.x += p.userData.vx * dt;
    p.position.z += p.userData.vz * dt;
    p.userData.vx *= 0.95;
    p.userData.vz *= 0.95;
    p.position.y += dt * 3;
    p.scale.multiplyScalar(1 - dt * 2);

    if (p.userData.life <= 0) {
      scene.remove(p);
      particles.splice(i, 1);
    }
  }

  updateAttackIndicator();
  updateCamera();
  renderer.render(scene, camera);
  drawMinimap();
  requestAnimationFrame(loop);
}

// =====================================================
//  РЕСТАРТ
// =====================================================
function reset() {
  gameActive = true;
  paused = false;
  overlay.classList.remove('active');
  weaponOverlay.classList.remove('active');
  gameoverEl.classList.remove('active');
  document.getElementById('zoneAlert').style.display = 'none';
  document.getElementById('bossHud').classList.remove('active');
  levelUpQueue = 0;
  weaponChoiceQueue = 0;
  nextWeaponLevel = 5;
  nextRescueLevel = 4;
  bossTimer = 0;
  nextBossType = 'biology';
  dogSpawnTimer = 0;
  jumpCooldownBonus = 0;
  lastStatueSpawn = performance.now();

  score = 0;
  level = 1;
  xp = 0;
  xpNext = 30;
  kills = 0;

  stats.maxHp = 100;
  stats.speed = 8;
  stats.damage = 8;
  stats.radius = 3.0;
  stats.cooldown = 700;
  stats.regen = 0;
  stats.magnet = 2.5;

  hp = stats.maxHp;
  hero.x = 0;
  hero.z = -20;
  hero.attackTimer = 0;
  hero.walkPhase = 0;
  hero.isJumping = false;
  hero.jumpTimer = 0;
  hero.jumpCooldown = 0;
  hero.height = 0;

  heroGroup.position.set(0, 0, -20);
  heroGroup.rotation.y = 0;

  // Сброс босса
  if (boss.active) {
    scene.remove(boss.mesh);
    scene.remove(boss.aura);
  }
  boss.active = false;
  boss.mesh = null;
  boss.aura = null;
  bossProjectiles.forEach(p => scene.remove(p));
  bossProjectiles.length = 0;

  for (const k in equippedWeapons) delete equippedWeapons[k];
  weaponDamageFlat.pen = 0;
  weaponDamageFlat.bag = 0;
  weaponDamageFlat.ruler = 0;
  weaponDamageFlat.slingshot = 0;
   // У молота нет бонусов урона — карточки усиления к нему не относятся
  weaponTimers.pen = 0;
  weaponTimers.ruler = 0;
  weaponTimers.slingshot = 0;
  weaponTimers.hammer = 0;
  heroTransformTimer = 0;
  hammerSwingTimer = 0;
  hammerStacks = 0;
  hammerSlamCooldown = 0;
  hammerSlamState.active = false;
  hammerSlamState.timer = 0;
  lastShiftTime = 0;
  cameraShakeAmount = 0;
  revertHeroTransform();
  bagAngle = 0;
  rebuildWeaponMeshes();
  updateWeaponHud();

  enemies.forEach(e => scene.remove(e.mesh));
  enemies.length = 0;

  particles.forEach(p => scene.remove(p));
  particles.length = 0;

  xpOrbs.forEach(o => scene.remove(o.mesh));
  xpOrbs.length = 0;

  projectiles.forEach(p => scene.remove(p));
  projectiles.length = 0;

  zones.forEach(z => scene.remove(z.group));
  zones.length = 0;

  statues.forEach(s => {
    scene.remove(s.mesh);
    scene.remove(s.hpBar);
  });
  statues.length = 0;

  updateHud();
}

document.getElementById('restart').onclick = reset;
document.getElementById('gameoverRestart').onclick = reset;

// =====================================================
//  РЕСАЙЗ
// =====================================================
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// =====================================================
//  СТАРТ
// =====================================================
reset();
requestAnimationFrame(loop);

// =====================================================
//  ЧИТ-ПАНЕЛЬ ДЛЯ БЕТА-ТЕСТА
//  ⚠ УДАЛИТЬ ПЕРЕД РЕЛИЗОМ
// =====================================================
function createCheatPanel() {
  const style = document.createElement('style');
  style.textContent = `
    #cheatPanel {
      position: fixed;
      top: 12px;
      left: 12px;
      width: 270px;
      background: rgba(10, 15, 20, 0.94);
      border: 2px solid #ffd966;
      border-radius: 12px;
      color: #e0e8f0;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 12px;
      z-index: 900;
      padding: 10px 12px;
      display: none;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.8);
    }
    #cheatPanel.open { display: block; }
    #cheatPanel h3 {
      margin: 0 0 8px;
      color: #ffd966;
      font-size: 13px;
      letter-spacing: 1px;
      text-align: center;
      border-bottom: 1px solid #ffd96650;
      padding-bottom: 6px;
    }
    #cheatPanel .row {
      display: flex;
      gap: 6px;
      align-items: center;
      margin-bottom: 6px;
    }
    #cheatPanel label {
      flex: 0 0 72px;
      color: #a0b8d0;
    }
    #cheatPanel input {
      flex: 1;
      background: #1a2530;
      border: 1px solid #3a4a5a;
      color: #e0e8f0;
      padding: 3px 6px;
      border-radius: 4px;
      font-family: inherit;
      font-size: 12px;
      min-width: 0;
    }
    #cheatPanel button {
      background: #2a4a6a;
      color: #e0e8f0;
      border: 1px solid #4a6a8a;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: 11px;
      font-weight: 700;
      transition: 0.1s;
    }
    #cheatPanel button:hover { background: #3a5a7a; }
    #cheatPanel button:active { background: #1a3a5a; }
    #cheatPanel .sect {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #ffd96630;
    }
    #cheatPanel .info {
      color: #7a8a9a;
      font-size: 10px;
      text-align: center;
      margin-top: 6px;
      line-height: 1.3;
    }
    #cheatToggle {
      position: fixed;
      top: 12px;
      left: 12px;
      z-index: 901;
      background: rgba(10, 15, 20, 0.8);
      color: #ffd966;
      border: 2px solid #ffd966;
      border-radius: 8px;
      padding: 4px 10px;
      cursor: pointer;
      font-family: 'Consolas', monospace;
      font-weight: 900;
      font-size: 12px;
      display: block;
    }
    #cheatToggle:hover { background: rgba(255, 217, 102, 0.15); }
    #cheatToggle.hidden { display: none; }
  `;
  document.head.appendChild(style);

  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'cheatToggle';
  toggleBtn.textContent = '⚙ ЧИТЫ [F2]';
  document.body.appendChild(toggleBtn);

  const panel = document.createElement('div');
  panel.id = 'cheatPanel';
  panel.innerHTML = `
    <h3>⚙ ЧИТ-ПАНЕЛЬ [F2]</h3>

    <div class="row">
      <label>Max HP</label>
      <input type="number" id="cheatMaxHp" min="1" step="10">
      <button id="cheatSetMaxHp">OK</button>
    </div>

    <div class="row">
      <label>HP</label>
      <input type="number" id="cheatHp" min="0" step="10">
      <button id="cheatSetHp">OK</button>
    </div>

    <div class="row">
      <button id="cheatFullHp" style="flex:1;">❤ Полное HP</button>
    </div>

    <div class="row">
      <label>Уровень</label>
      <input type="number" id="cheatLevel" min="1" max="200">
      <button id="cheatSetLevel">OK</button>
    </div>

    <div class="row">
      <button id="cheatLevelUp1" style="flex:1;">+1</button>
      <button id="cheatLevelUp5" style="flex:1;">+5</button>
      <button id="cheatLevelUp10" style="flex:1;">+10</button>
    </div>

    <div class="sect">
      <div class="row">
        <button id="cheatAllWeapons" style="flex:1;">🎒 Всё оружие (макс)</button>
      </div>
      <div class="row">
        <button id="cheatSpawnBoss" style="flex:1;">👹 Босс</button>
        <button id="cheatKillBoss" style="flex:1;">💀 Убить</button>
      </div>
      <div class="row">
        <button id="cheatSpawnStatue" style="flex:1;">🗿 Статуя</button>
        <button id="cheatAddXp" style="flex:1;">+500 XP</button>
      </div>
      <div class="row">
        <button id="cheatKillAll" style="flex:1;">⚔ Убить всех врагов</button>
      </div>
    </div>

    <div class="info">Повышение уровня открывает карточки<br>и выбор оружия по стандартным правилам</div>
  `;
  document.body.appendChild(panel);

  let panelOpen = false;

  function refreshCheatValues() {
    document.getElementById('cheatMaxHp').value = Math.round(stats.maxHp);
    document.getElementById('cheatHp').value = Math.round(hp);
    document.getElementById('cheatLevel').value = level;
  }

  function togglePanel() {
    panelOpen = !panelOpen;
    panel.classList.toggle('open', panelOpen);
    toggleBtn.classList.toggle('hidden', panelOpen);
    if (panelOpen) refreshCheatValues();
  }

  toggleBtn.onclick = togglePanel;

  addEventListener('keydown', e => {
    if (e.code === 'F2') {
      e.preventDefault();
      togglePanel();
    }
  });

  // ---------- MAX HP ----------
  document.getElementById('cheatSetMaxHp').onclick = () => {
    const v = parseFloat(document.getElementById('cheatMaxHp').value);
    if (!isNaN(v) && v > 0) {
      stats.maxHp = v;
      if (hp > stats.maxHp) hp = stats.maxHp;
      updateHud();
      refreshCheatValues();
    }
  };

  // ---------- ТЕКУЩЕЕ HP ----------
  document.getElementById('cheatSetHp').onclick = () => {
    const v = parseFloat(document.getElementById('cheatHp').value);
    if (!isNaN(v) && v >= 0) {
      hp = Math.min(v, stats.maxHp);
      updateHud();
      refreshCheatValues();
    }
  };

  document.getElementById('cheatFullHp').onclick = () => {
    hp = stats.maxHp;
    updateHud();
    refreshCheatValues();
  };

  // ---------- УРОВЕНЬ ----------
  document.getElementById('cheatSetLevel').onclick = () => {
    const v = parseInt(document.getElementById('cheatLevel').value);
    if (!isNaN(v) && v >= 1) setLevel(v);
  };
  document.getElementById('cheatLevelUp1').onclick  = () => setLevel(level + 1);
  document.getElementById('cheatLevelUp5').onclick  = () => setLevel(level + 5);
  document.getElementById('cheatLevelUp10').onclick = () => setLevel(level + 10);

  // ---------- ВСЁ ОРУЖИЕ ----------
  document.getElementById('cheatAllWeapons').onclick = () => {
    for (const w of WEAPONS) {
      equippedWeapons[w.id] = { level: w.maxLevel };
    }
    updateWeaponHud();
    rebuildWeaponMeshes();
  };

  // ---------- БОСС ----------
  document.getElementById('cheatSpawnBoss').onclick = () => {
    if (!boss.active) spawnBoss();
  };
  document.getElementById('cheatKillBoss').onclick = () => {
    if (boss.active) killBoss();
  };

  // ---------- ПРОЧЕЕ ----------
  document.getElementById('cheatSpawnStatue').onclick = () => spawnStatue();
  document.getElementById('cheatAddXp').onclick = () => addXP(500);
  document.getElementById('cheatKillAll').onclick = () => {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dying) continue;
      e.hp = 0;
      killEnemy(e, i);
    }
  };
}

// =====================================================
//  УСТАНОВКА УРОВНЯ С ОБРАБОТКОЙ ВСЕХ ПОРОГОВ
// =====================================================
function calcXpForLevel(lvl) {
  let xpNeed = 30;
  for (let i = 1; i < lvl; i++) {
    xpNeed = Math.floor(xpNeed * 1.35 + 10);
  }
  return xpNeed;
}

function setLevel(target) {
  target = Math.max(1, Math.min(200, Math.floor(target)));
  if (target === level) return;

  // Закрываем любые открытые модалки
  if (paused) {
    overlay.classList.remove('active');
    weaponOverlay.classList.remove('active');
    paused = false;
  }

  const oldLevel = level;

  // Очереди формируются заново
  levelUpQueue = 0;
  weaponChoiceQueue = 0;

  if (target > oldLevel) {
    // --- ПОВЫШЕНИЕ ---
    // Обычные прокачки — по одной на каждый новый уровень
    for (let l = oldLevel + 1; l <= target; l++) levelUpQueue++;

    // Карточки оружия — каждые 5 уровней
    while (nextWeaponLevel <= target) {
      weaponChoiceQueue++;
      nextWeaponLevel += 5;
    }

    // Зоны спасения — каждые 4 уровня
    while (nextRescueLevel <= target) {
      spawnRescueZone();
      nextRescueLevel += 4;
    }

    // Восстановление HP как при обычном level-up
    const levelsGained = target - oldLevel;
    hp = Math.min(stats.maxHp, hp + stats.maxHp * 0.2 * levelsGained);
  } else {
    // --- ПОНИЖЕНИЕ ---
    // Пересчитываем следующие пороги
    nextWeaponLevel = Math.floor(target / 5) * 5 + 5;
    nextRescueLevel = Math.floor(target / 4) * 4 + 4;
  }

  level = target;
  xp = 0;
  xpNext = calcXpForLevel(level);

  updateHud();

  // Открываем первую из накопленных очередей
  if (weaponChoiceQueue > 0 && gameActive) {
    openWeaponChoice();
  } else if (levelUpQueue > 0 && gameActive) {
    openLevelUp();
  }
}

// Запуск чит-панели
createCheatPanel();