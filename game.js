import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { CHARACTERS } from './characters.js';

// =====================================================
//  ФОНОВАЯ МУЗЫКА
// =====================================================
const bgMusic = new Audio('./bg_music.mp3');
bgMusic.loop = true;
bgMusic.preload = 'auto';
// Начальная громкость 15%
// Загружаем сохранённую громкость или ставим 15%
let bgMusicVolume = (() => {
  try {
    const saved = localStorage.getItem('bgMusicVolume');
    if (saved !== null) {
      const v = parseFloat(saved);
      if (!isNaN(v) && v >= 0 && v <= 1) return v;
    }
  } catch (e) {}
  return 0.15;
})();
bgMusic.volume = bgMusicVolume;

// Автозапуск после первого взаимодействия пользователя
// (браузеры блокируют autoplay без действия пользователя)
let bgMusicStarted = false;
function tryStartBgMusic() {
  if (bgMusicStarted) return;
  bgMusic.play().then(() => {
    bgMusicStarted = true;
  }).catch(() => {
    // Ждём следующего события
  });
}
// Первое касание / клик / нажатие клавиши — запускаем
['click', 'keydown', 'touchstart'].forEach(evt => {
  addEventListener(evt, tryStartBgMusic, { once: false, passive: true });
});

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
//  ПРЕДЗАГРУЗКА МОДЕЛИ УРУРУ
// =====================================================
let ururuModel = null;       // сюда ляжет заготовка (prototype)
let ururuModelLoaded = false;

(function preloadUruru() {
  const loader = new GLTFLoader();
  loader.load(
    './models/ururu.glb',
    gltf => {
      ururuModel = gltf.scene;
      ururuModel.traverse(o => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });
      ururuModelLoaded = true;
    },
    undefined,
    err => {
      console.error('[Уруру] не удалось загрузить models/ururu.glb:', err);
    }
  );
})();

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
//  ГЕРОЙ — контейнеры и фабрика персонажа
// =====================================================
const heroGroup = new THREE.Group();
scene.add(heroGroup);

// Куда добавляется меш текущего персонажа (оружие крепится прямо к heroGroup)
const characterRoot = new THREE.Group();
heroGroup.add(characterRoot);

let currentCharacter = null;
let selectedCharacterId = null;

function instantiateCharacter(charDef) {
  // Очищаем корень от предыдущего персонажа
  while (characterRoot.children.length > 0) {
    characterRoot.remove(characterRoot.children[0]);
  }
  currentCharacter = charDef.build();
  characterRoot.add(currentCharacter.group);

  // Применяем базовые статы
  stats.maxHp = charDef.stats.maxHp;
  stats.speed = charDef.stats.speed;
  stats.damage = charDef.stats.damage;
  stats.radius = charDef.stats.radius;
  stats.cooldown = charDef.stats.cooldown;
  stats.jumpCooldown = charDef.stats.jumpCooldown || 2000;
  stats.regen = charDef.stats.regen;
  stats.magnet = charDef.stats.magnet;

  hp = stats.maxHp;

  hero.height = 0;
  hero.walkPhase = 0;
  hero.isJumping = false;
  hero.attackTimer = 0;

  updateHud();
}

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
// Широкий сектор для Колобка: ±80°
const attackArcWideGeo = new THREE.CircleGeometry(1, 32, -1.4, 2.8);
const attackArcWideMat = new THREE.MeshBasicMaterial({
  color: 0xffa040, transparent: true, opacity: 0,
  side: THREE.DoubleSide, depthWrite: false,
});
const attackArcWide = new THREE.Mesh(attackArcWideGeo, attackArcWideMat);
attackArcWide.rotation.x = -Math.PI / 2;
attackArcWide.position.y = 0.06;
scene.add(attackArcWide);

// =====================================================
//  ДВОЙНОЙ СЕКТОР ДЛЯ ШИШКУНА (два узких «крыла»)
// =====================================================
const SHISHKUN_SECTOR_OFFSET = 0.3925; // 22.5° — половина от 45° между центрами
const SHISHKUN_SECTOR_HALF = 0.55;      // полураствор каждого сектора

const attackArcShishGeo = new THREE.CircleGeometry(
  1, 24, -SHISHKUN_SECTOR_HALF, SHISHKUN_SECTOR_HALF * 2
);
const attackArcShishMat = new THREE.MeshBasicMaterial({
  color: 0xffaa44, transparent: true, opacity: 0,
  side: THREE.DoubleSide, depthWrite: false,
});
const attackArcShishA = new THREE.Mesh(attackArcShishGeo, attackArcShishMat);
attackArcShishA.rotation.x = -Math.PI / 2;
attackArcShishA.position.y = 0.06;
scene.add(attackArcShishA);

const attackArcShishB = new THREE.Mesh(attackArcShishGeo, attackArcShishMat);
attackArcShishB.rotation.x = -Math.PI / 2;
attackArcShishB.position.y = 0.06;
scene.add(attackArcShishB);

// =====================================================
//  ПРИЦЕЛ ДЛЯ НАПРАВЛЕННОГО ОРУЖИЯ (линейка, дробовик)
// =====================================================
const aimLineGroup = new THREE.Group();
aimLineGroup.position.y = 0.09;
scene.add(aimLineGroup);

const aimLineMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 0.16),
  new THREE.MeshBasicMaterial({
    color: 0xffee66, transparent: true, opacity: 0.55,
    side: THREE.DoubleSide, depthWrite: false,
  })
);
aimLineMesh.rotation.x = -Math.PI / 2;
aimLineGroup.add(aimLineMesh);

// Кончик-стрелка на дальнем конце
const aimTipMesh = new THREE.Mesh(
  new THREE.CircleGeometry(0.32, 16),
  new THREE.MeshBasicMaterial({
    color: 0xffdd44, transparent: true, opacity: 0.7,
    side: THREE.DoubleSide, depthWrite: false,
  })
);
aimTipMesh.rotation.x = -Math.PI / 2;
aimLineGroup.add(aimTipMesh);

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
//  ЯРОСТЬ КОЛОБКА (Q)
// =====================================================
const KOLOBOK_BERSERK_DURATION = 6.0;         // сек
const KOLOBOK_BERSERK_COOLDOWN = 20.0;        // сек
// DPS ярости = speed × SPEED_FACTOR + damage × DAMAGE_FACTOR
const KOLOBOK_BERSERK_SPEED_FACTOR  = 2.5;
const KOLOBOK_BERSERK_DAMAGE_FACTOR = 1.5;
const KOLOBOK_BERSERK_RADIUS = 2.0;           // радиус касания
const KOLOBOK_BERSERK_UNLOCK_LEVEL = 5;

let kolobokBerserkActive = false;
let kolobokBerserkTimer = 0;
let kolobokBerserkCooldown = 0;

// =====================================================
//  ГАЗЫ ГРИФОНИ (Q)
// =====================================================
const GAS_DURATION = 5.0;            // сек
const GAS_COOLDOWN = 20.0;           // сек
const GAS_UNLOCK_LEVEL = 5;
const GAS_RADIUS = 6.0;              // радиус торнадо
const GAS_DPS_FROM_HP = 0.4;         // урон в секунду = maxHp × 0.4
const GAS_PULL_SPEED = 9;            // скорость притяжения к центру
const GAS_SPIN_SPEED = 5.5;          // радиан в секунду (вращение вокруг центра)
const GAS_MIN_DISTANCE = 0.6;        // ближе этого не притягивает

let gasActive = false;
let gasTimer = 0;
let gasCooldown = 0;
let gasCenterX = 0;
let gasCenterZ = 0;

// =====================================================
//  ЛУКСМАКСИНГ ШИШКУНА (Q)
// =====================================================
const LUCK_UNLOCK_LEVEL = 5;
const LUCK_CUTSCENE_DURATION = 3.6;   // сек — вся катсцена
const LUCK_DRIVING_DURATION = 5.0;    // сек — режим езды
const LUCK_COOLDOWN = 20.0;           // сек — откат
const LUCK_EXPLOSION_RADIUS = 12;
const LUCK_EXPLOSION_DMG_MULT = 10;   // × maxHp
const LUCK_CAR_SPEED_MULT = 1.8;      // × скорость героя во время езды
const LUCK_RAM_RADIUS = 2.2;
const LUCK_RAM_DPS_MULT = 0.7;        // × maxHp в секунду

let lucksMaxingActive = false;
let lucksMaxingCooldown = 0;
let lucksMaxingPhase = 'none';   // 'cutscene' | 'driving' | 'none'
let lucksMaxingTimer = 0;
let lucksMaxingExploded = false;
let enemiesFrozen = false;

let carMesh = null;
const carStart = new THREE.Vector3();
const carEnd = new THREE.Vector3();
const cinStartPos = new THREE.Vector3();
const cinStartLook = new THREE.Vector3();
const cinEndPos = new THREE.Vector3();
const cinEndLook = new THREE.Vector3();

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
let runTimer = 0;   // секунды с начала забега

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
// Угол прицела (мышь / джойстик / тап).
// Используется для направленного оружия: линейка, дробовик.
// НЕ влияет на обычный удар рюкзаком — тот бьёт по ближайшему врагу.
let playerAimAngle = 0;

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
    lineLength: [8, 10, 12, 15, 18],
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
    desc: 'Бумеранг. Летит вперёд и возвращается — бьёт врагов на пути туда и обратно. С каждым уровнем — больше урон и дальность.',
    color: 0xd9a02a,
    maxLevel: 5,
    range:   [10, 12, 15, 18, 22],     // дальность полёта вперёд
    damage:  [50, 80, 120, 170, 235],  // урон за касание
    cooldown:[2000, 1800, 1600, 1400, 1200],
    projectileSpeed: 22,                // юнитов в секунду (постоянно)
    hitRadius: 0.9,                     // радиус попадания по врагу
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
    // Бафф урона (базовый ×1.4, растёт со стаками)
    baseDamageMult: 1.4,
    // Активная способность (открывается на 2 ур.)
    // Индексы: [ур.1, ур.2, ур.3, ур.4, ур.5]
    // Ур.1 не используется (слам ещё не открыт), но нужен для правильного смещения
    slamCooldown:   [0,   6000, 5000, 4000, 3000],
    slamDamageMult: [0,   7.0,  9.0,  12.0, 15.0],
    slamRadius:     [0,   12.0,  13.0,  14.0,  17.0],
  },
  {
    id: 'shotgun',
    name: 'Дробовик',
    ico: '🔫',
    desc: 'Заряжен крупной солью. Раз в 3 сек бьёт широким конусом — задевает всех врагов в секторе. С каждым уровнем — шире залп и больше урон.',
    color: 0x8a4a2a,
    maxLevel: 5,
    range:      [11, 13, 15, 17, 19],
    damage:     [110, 175, 260, 370, 510],
    cooldown:   [3000, 3000, 3000, 3000, 3000],
    halfAngle:  [0.35, 0.45, 0.55, 0.68, 0.85],  // полураствор конуса (радианы)
  },
  {
    id: 'perfume',
    name: 'Мамины духи',
    ico: '💨',
    desc: 'Раз в 6 сек распыляет вокруг героя облако. Враги в нём замедляются и бьют слабее. Со 2 ур. — ещё и получают урон.',
    color: 0xd966c8,
    maxLevel: 5,
    radius:   15,                                 // 3 клетки (клетка = 5 юнитов)
    cooldown: [8000, 7000, 6000, 5000, 4000],     // 6 сек → 2 сек
    slow:     [0.50, 0.55, 0.62, 0.70, 0.80],     // 50% → 80%
    weaken:   [0.50, 0.55, 0.62, 0.70, 0.80],     // 50% → 80%
    dps:      [0,    10,   15,   20,  25],      // урон в секунду (с ур. 2)
    duration: 4.0,                                 // время жизни облака
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
  shotgun: 0,
  perfume: 0,
};

const equippedWeapons = {};

const weaponTimers = {
  pen: 0,
  bag: 0,
  ruler: 0,
  slingshot: 0,
  hammer: 0,
  shotgun: 0,
  perfume: 0,
};

// Активные облака духов
const perfumeClouds = [];

// =====================================================
//  СОСТОЯНИЕ ПРЕВРАЩЕНИЯ (от молота)
// =====================================================
let heroTransformTimer = 0;
let heroTransformMaxDuration = 1;   // длительность текущего баффа — для шкалы
let heroTransformSpeedMult = 1.3;
let heroTransformJumpMult = 1.3;
let heroTransformDamageMult = 1.0;
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
const rulerProjectiles = [];     // активные бумеранги
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

  if (equippedWeapons.shotgun) {
    const g = new THREE.Group();
    // Ствол
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.11, 1.5, 8),
      new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
    );
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.55, 0, 0);
    barrel.castShadow = true;
    g.add(barrel);
    // Второй ствол сверху
    const barrel2 = barrel.clone();
    barrel2.position.set(0.55, 0.12, 0);
    g.add(barrel2);
    // Приклад
    const stock = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.22, 0.18),
      new THREE.MeshLambertMaterial({ color: 0x6b3a1a })
    );
    stock.position.set(-0.5, -0.05, 0);
    stock.castShadow = true;
    g.add(stock);
    // Рукоять снизу
    const grip = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.35, 0.14),
      new THREE.MeshLambertMaterial({ color: 0x4a2a1a })
    );
    grip.position.set(-0.2, -0.25, 0);
    g.add(grip);

    g.position.set(0.9, 1.7, 0.4);
    g.rotation.y = -0.15;
    heroGroup.add(g);
    weaponMeshes.shotgun = g;
  }

  if (equippedWeapons.perfume) {
    const g = new THREE.Group();

    // Стеклянный флакон
    const bottle = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.42, 0.18),
      new THREE.MeshLambertMaterial({
        color: 0xffccdd, transparent: true, opacity: 0.75,
      })
    );
    bottle.position.y = -0.05;
    bottle.castShadow = true;
    g.add(bottle);

    // Крышка
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8),
      new THREE.MeshLambertMaterial({ color: 0xd4af37 })
    );
    cap.position.y = 0.24;
    g.add(cap);

    // Распылитель
    const nozzle = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 6),
      new THREE.MeshLambertMaterial({ color: 0xcccccc })
    );
    nozzle.position.y = 0.32;
    g.add(nozzle);

    // Розовая жидкость внутри
    const liquid = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.22, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xff66bb })
    );
    liquid.position.y = -0.1;
    g.add(liquid);

    g.position.set(-1.05, 1.7, 0.35);
    heroGroup.add(g);
    weaponMeshes.perfume = g;
  }
}

// =====================================================
//  ПРЕВРАЩЕНИЕ ГЕРОЯ (баф молота)
// =====================================================
function applyHeroTransform() {
  if (currentCharacter) currentCharacter.applyTransform();
}

function revertHeroTransform() {
  if (currentCharacter) currentCharacter.revertTransform();
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

  // ЛИНЕЙКА — бумеранг
  if (equippedWeapons.ruler) {
    weaponTimers.ruler -= dt * 1000;
    if (weaponTimers.ruler <= 0) {
      const cd = weaponStat('ruler', 'cooldown');
      weaponTimers.ruler = cd;

      const dmg = weaponStat('ruler', 'damage');
      const range = weaponStat('ruler', 'range');
      const def = WEAPONS.find(w => w.id === 'ruler');
      const speed = def.projectileSpeed;
      const angle = playerAimAngle;

      // Создаём меш бумеранга
      const mesh = new THREE.Group();
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 0.06, 0.35),
        new THREE.MeshLambertMaterial({ color: 0xe0b040 })
      );
      body.castShadow = true;
      mesh.add(body);
      // Деления
      for (let k = 0; k < 6; k++) {
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(0.02, 0.07, 0.12),
          new THREE.MeshBasicMaterial({ color: 0x3a2a1a })
        );
        tick.position.set(-0.6 + k * 0.24, 0.005, 0);
        mesh.add(tick);
      }
      mesh.position.set(hero.x, 1.0, hero.z);
      scene.add(mesh);

      rulerProjectiles.push({
        x: hero.x,
        z: hero.z,
        angle: angle,
        phase: 'out',                 // 'out' → летит вперёд, 'back' → возвращается
        speed: speed,
        maxDistance: range,
        traveled: 0,
        damage: dmg,
        mesh: mesh,
        spin: 0,
        hitSet: new Set(),            // кого уже ударил в этой фазе
      });

      // Вспышка при броске
      burst(hero.x, hero.z, 0xffd966);
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
  //  ДРОБОВИК — широкий сектор раз в 3 секунды
  // =====================================================
  if (equippedWeapons.shotgun) {
    weaponTimers.shotgun -= dt * 1000;
    if (weaponTimers.shotgun <= 0) {
      const cd = weaponStat('shotgun', 'cooldown');
      weaponTimers.shotgun = cd;

      const dmg = weaponStat('shotgun', 'damage');
      const range = weaponStat('shotgun', 'range');
      const halfAngle = weaponStat('shotgun', 'halfAngle');
      const angle = playerAimAngle;

      let hitAny = false;

      // Урон по врагам
      for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.dying || e.flyingToBoss) continue;
        const dx = e.x - hero.x;
        const dz = e.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist > range + e.r) continue;
        let diff = Math.abs(Math.atan2(dz, dx) - angle);
        diff = Math.min(diff, Math.PI * 2 - diff);
        if (diff > halfAngle) continue;

        e.hp -= dmg;
        // Лёгкий отброс
        const kb = 8;
        e.kbX = Math.cos(Math.atan2(dz, dx)) * kb;
        e.kbZ = Math.sin(Math.atan2(dz, dx)) * kb;
        hitAny = true;
        if (e.hp <= 0) killEnemy(e, i);
      }

      // Босс
      if (boss.active) {
        const dx = boss.x - hero.x;
        const dz = boss.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist < range + boss.r) {
          let diff = Math.abs(Math.atan2(dz, dx) - angle);
          diff = Math.min(diff, Math.PI * 2 - diff);
          if (diff < halfAngle + 0.15) {
            damageBoss(dmg);
            hitAny = true;
          }
        }
      }

      // Статуи
      for (let i = statues.length - 1; i >= 0; i--) {
        const s = statues[i];
        const dx = s.x - hero.x;
        const dz = s.z - hero.z;
        const dist = Math.hypot(dx, dz);
        if (dist > range + s.r) continue;
        let diff = Math.abs(Math.atan2(dz, dx) - angle);
        diff = Math.min(diff, Math.PI * 2 - diff);
        if (diff < halfAngle + 0.15) {
          damageStatue(s, i, dmg);
          hitAny = true;
        }
      }
    }    
  }
  // =====================================================
  //  МАМИНЫ ДУХИ — облако вокруг героя
  // =====================================================
  if (equippedWeapons.perfume) {
    weaponTimers.perfume -= dt * 1000;
    if (weaponTimers.perfume <= 0) {
      const cd = weaponStat('perfume', 'cooldown');
      weaponTimers.perfume = cd;

      const def = WEAPONS.find(w => w.id === 'perfume');
      const lvl = weaponLevel('perfume') - 1;

      const radius    = def.radius;
      const slow      = def.slow[lvl];
      const weaken    = def.weaken[lvl];
      let   dps       = def.dps[lvl];

      // Плоский бонус от карточек добавляется к dps
      if (dps > 0) {
        dps += (weaponDamageFlat.perfume || 0);
        dps *= (1 + (level - 1) * 0.08);
      }

      const duration  = def.duration;

      // Меш облака
      const cloudGroup = new THREE.Group();
      const cloudX = hero.x;
      const cloudZ = hero.z;
      cloudGroup.position.set(cloudX, 0, cloudZ);

      // Полупрозрачная сфера — основное тело облака
      const cloudMat = new THREE.MeshBasicMaterial({
        color: 0xff88cc,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const cloudSphere = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.95, 24, 18), cloudMat);
      cloudSphere.position.y = 2.5;
      cloudGroup.add(cloudSphere);

      // Кольцо на земле
      const cloudRing = new THREE.Mesh(
        new THREE.RingGeometry(radius - 0.5, radius, 48),
        new THREE.MeshBasicMaterial({
          color: 0xff66bb, transparent: true, opacity: 0.55,
          side: THREE.DoubleSide, depthWrite: false,
        })
      );
      cloudRing.rotation.x = -Math.PI / 2;
      cloudRing.position.y = 0.12;
      cloudGroup.add(cloudRing);

      // Внутреннее кольцо
      const cloudRing2 = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.5, radius * 0.55, 40),
        new THREE.MeshBasicMaterial({
          color: 0xffaaee, transparent: true, opacity: 0.35,
          side: THREE.DoubleSide, depthWrite: false,
        })
      );
      cloudRing2.rotation.x = -Math.PI / 2;
      cloudRing2.position.y = 0.13;
      cloudGroup.add(cloudRing2);

      // Плавающие частицы — «пузырьки» духов
      const cloudParticles = [];
      for (let i = 0; i < 18; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * radius * 0.9;
        const pMat = new THREE.MeshBasicMaterial({
          color: 0xffccdd, transparent: true, opacity: 0.7,
          depthWrite: false,
        });
        const p = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), pMat);
        p.position.set(Math.cos(a) * r, 0.5 + Math.random() * 3.5, Math.sin(a) * r);
        p.userData = {
          baseY: p.position.y,
          phase: Math.random() * Math.PI * 2,
          radius: r,
          angle: a,
        };
        cloudGroup.add(p);
        cloudParticles.push(p);
      }

      scene.add(cloudGroup);

      perfumeClouds.push({
        x: cloudX,
        z: cloudZ,
        radius,
        slow,
        weaken,
        dps,
        timer: duration,
        mesh: cloudGroup,
        sphere: cloudSphere,
        sphereMat: cloudMat,
        particles: cloudParticles,
      });

      // Вспышка при появлении
      burst(cloudX, cloudZ, 0xff88cc);
      burst(cloudX, cloudZ, 0xffccdd);
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
        const dMul = Math.min(def.maxMult,
          def.baseDamageMult + hammerStacks * def.stackMultBonus);

        heroTransformTimer = dur;
        heroTransformMaxDuration = dur;
        heroTransformSpeedMult = sMul;
        heroTransformJumpMult = jMul;
        heroTransformDamageMult = dMul;
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
  

    // =====================================================
  //  БУМЕРАНГИ ЛИНЕЙКИ
  // =====================================================
  for (let i = rulerProjectiles.length - 1; i >= 0; i--) {
    const b = rulerProjectiles[i];

    // ---- Движение ----
    if (b.phase === 'out') {
      const step = b.speed * dt;
      b.x += Math.cos(b.angle) * step;
      b.z += Math.sin(b.angle) * step;
      b.traveled += step;
      if (b.traveled >= b.maxDistance) {
        b.phase = 'back';
        // Сбрасываем список — те же враги могут быть задеты на обратном пути
        b.hitSet.clear();
      }
    } else {
      // Возвращается к герою
      const dx = hero.x - b.x;
      const dz = hero.z - b.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.6) {
        // Вернулся — убираем
        scene.remove(b.mesh);
        b.mesh.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        rulerProjectiles.splice(i, 1);
        continue;
      }
      b.x += (dx / d) * b.speed * dt;
      b.z += (dz / d) * b.speed * dt;
    }

    // ---- Урон по врагам ----
    const hitR = 0.9;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (e.dying || e.flyingToBoss) continue;
      if (b.hitSet.has(e)) continue;
      const d = Math.hypot(e.x - b.x, e.z - b.z);
      if (d < hitR + e.r) {
        e.hp -= b.damage;
        b.hitSet.add(e);
        burst(e.x, e.z, 0xffd966);
        if (e.hp <= 0) killEnemy(e, j);
      }
    }

    // ---- Босс ----
    if (boss.active && !b.hitSet.has(boss)) {
      const d = Math.hypot(boss.x - b.x, boss.z - b.z);
      if (d < hitR + boss.r) {
        damageBoss(b.damage);
        b.hitSet.add(boss);
        burst(b.x, b.z, 0xffd966);
      }
    }

    // ---- Статуи ----
    for (let k = statues.length - 1; k >= 0; k--) {
      const s = statues[k];
      if (b.hitSet.has(s)) continue;
      const d = Math.hypot(s.x - b.x, s.z - b.z);
      if (d < hitR + s.r) {
        damageStatue(s, k, b.damage);
        b.hitSet.add(s);
        burst(s.x, s.z, 0xffd966);
      }
    }

    // ---- Анимация меша ----
    b.spin += dt * 18;
    b.mesh.position.set(b.x, 1.0 + Math.sin(b.spin * 1.4) * 0.1, b.z);
    b.mesh.rotation.y = -b.angle + b.spin;
    b.mesh.rotation.x = Math.sin(b.spin * 0.7) * 0.25;
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

  // ---- Обновление активных облаков духов ----
  updatePerfumeClouds(dt);
}

// =====================================================
//  ОБЛАКА ДУХОВ — движение по времени, эффекты на врагов
// =====================================================
function updatePerfumeClouds(dt) {
  // Сброс эффектов на всех врагах.
  // Если враг в этот кадр не попадёт ни в одно облако — флаги останутся 0.
  for (const e of enemies) {
    e._perfumeSlow = 0;
    e._perfumeWeaken = 0;
  }

  for (let i = perfumeClouds.length - 1; i >= 0; i--) {
    const c = perfumeClouds[i];
    c.timer -= dt;

    // Затухание облака к концу времени жизни
    const lifeRatio = Math.max(0, c.timer / 4);
    c.sphereMat.opacity = 0.06 + lifeRatio * 0.14;

    // Анимация кольца
    if (c.mesh.children[1]) {
      const ring = c.mesh.children[1];
      ring.rotation.z += dt * 0.6;
    }
    if (c.mesh.children[2]) {
      const ring2 = c.mesh.children[2];
      ring2.rotation.z -= dt * 0.9;
    }

    // Анимация частиц — лёгкое вращение и вертикальная пульсация
    const t = performance.now() * 0.001;
    for (const p of c.particles) {
      p.userData.angle += dt * 0.25;
      const r = p.userData.radius;
      p.position.x = Math.cos(p.userData.angle) * r;
      p.position.z = Math.sin(p.userData.angle) * r;
      p.position.y = p.userData.baseY + Math.sin(t * 2 + p.userData.phase) * 0.3;
    }

    // ---- Эффекты на врагов внутри облака ----
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (e.dying || e.flyingToBoss) continue;

      const dx = e.x - c.x;
      const dz = e.z - c.z;
      const d = Math.hypot(dx, dz);

      if (d < c.radius + e.r) {
        // Максимум эффектов, если враг в нескольких облаках
        if (c.slow > e._perfumeSlow) e._perfumeSlow = c.slow;
        if (c.weaken > e._perfumeWeaken) e._perfumeWeaken = c.weaken;

        // Урон со 2-го уровня
        if (c.dps > 0) {
          e.hp -= c.dps * dt;
          if (Math.random() < 0.12) burst(e.x, e.z, 0xff88cc);
          if (e.hp <= 0) {
            killEnemy(e, j);
            continue;
          }
        }
      }
    }

    // Урон боссу
    if (boss.active && c.dps > 0) {
      const dx = boss.x - c.x;
      const dz = boss.z - c.z;
      const d = Math.hypot(dx, dz);
      if (d < c.radius + boss.r) {
        damageBoss(c.dps * dt * 0.7);
      }
    }

    // Статуи (только урон, без замедления — они статичны)
    if (c.dps > 0) {
      for (let k = statues.length - 1; k >= 0; k--) {
        const s = statues[k];
        const dx = s.x - c.x;
        const dz = s.z - c.z;
        const d = Math.hypot(dx, dz);
        if (d < c.radius + s.r) {
          damageStatue(s, k, c.dps * dt * 0.7);
        }
      }
    }

    // Убираем облако когда время вышло
    if (c.timer <= 0) {
      scene.remove(c.mesh);
      c.mesh.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      perfumeClouds.splice(i, 1);
    }
  }
}

function killEnemy(e, idx) {
  if (e.dying) return;
  e.dying = true;
  e.dyingTimer = 0.25;
  if (e.isDog) score += 5;
  else if (e.isUruru) score += 75;
  else if (e.isTeacher) score += 100;
  else score += 10;
  kills++;
  spawnXPOrb(e.x, e.z, e.xpValue);
  burst(e.x, e.z,
    e.isDog     ? 0x8a5a2a :
    e.isUruru   ? 0xaa66cc :
    e.isTeacher ? 0x333333 :
                  e.type.color);
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

// =====================================================
//  ЭФФЕКТ ЗАЛПА ДРОБОВИКА
// =====================================================
function spawnShotgunEffect(x, z, angle, range, halfAngle) {
  // Расширяющийся конус.
  // ВАЖНО: после rotation.x = -π/2 угол φ в геометрии даёт угол -φ в мире.
  // Поэтому передаём -angle, чтобы сектор встал в реальном направлении.
  const geo = new THREE.CircleGeometry(range, 32, -angle - halfAngle, halfAngle * 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffaa55, transparent: true, opacity: 0.85,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, 0.55, z);
  m.rotation.x = -Math.PI / 2;
  scene.add(m);

  const start = performance.now();
  function fade() {
    const t = (performance.now() - start) / 320;
    if (t >= 1) { scene.remove(m); return; }
    mat.opacity = 0.85 * (1 - t);
    m.scale.setScalar(1 + t * 0.15);
    requestAnimationFrame(fade);
  }
  fade();

  // Вспышка у дула — короткий яркий круг на старте
  const flashGeo = new THREE.CircleGeometry(1.3, 20);
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffee88, transparent: true, opacity: 0.95,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const flash = new THREE.Mesh(flashGeo, flashMat);
  flash.position.set(x + Math.cos(angle) * 1.5, 1.4, z + Math.sin(angle) * 1.5);
  flash.rotation.x = -Math.PI / 2;
  scene.add(flash);

  const start2 = performance.now();
  function animFlash() {
    const t = (performance.now() - start2) / 180;
    if (t >= 1) { scene.remove(flash); return; }
    flashMat.opacity = 0.95 * (1 - t);
    flash.scale.setScalar(1 + t * 0.8);
    requestAnimationFrame(animFlash);
  }
  animFlash();

  // Искры-соль разлетаются от героя в сторону конуса
  for (let i = 0; i < 14; i++) {
    const a = angle + (Math.random() - 0.5) * 2 * halfAngle;
    const sp = 6 + Math.random() * 8;
    const p = new THREE.Mesh(particleGeo, new THREE.MeshBasicMaterial({ color: 0xfff0c0 }));
    p.position.set(x + Math.cos(angle) * 1.5, 1.4, z + Math.sin(angle) * 1.5);
    p.userData = {
      vx: Math.cos(a) * sp,
      vz: Math.sin(a) * sp,
      life: 0.4,
    };
    scene.add(p);
    particles.push(p);
  }
}


function spawnSlashEffect(x, z, angle, r, halfAngle) {
  const geo = new THREE.CircleGeometry(r, 32, -angle - halfAngle, halfAngle * 2);
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
      removeDebugHitbox(enemies[i]);
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

  // Заморозка во время катсцены Луксмаксинга
  if (enemiesFrozen) return;

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

// =====================================================
//  ПРИЦЕЛ ДЛЯ КОЛОБКА — мышь + тач
// =====================================================
// true только если устройство использует тач как основной ввод
// (hover: none → нет мыши, pointer: coarse → грубый указатель)
const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
let mobileAimAngle = null;   // угол, заданный тапом по экрану (сбрасывается джойстиком)

const mouseNDC = new THREE.Vector2(0, 0);
const mouseRaycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const mouseWorld = new THREE.Vector3(0, 0, 0);

addEventListener('mousemove', e => {
  mouseNDC.x = (e.clientX / innerWidth) * 2 - 1;
  mouseNDC.y = -(e.clientY / innerHeight) * 2 + 1;
});

// Пересчёт экранных координат мыши в мировую точку на плоскости Y=0
function updateMouseWorld() {
  mouseRaycaster.setFromCamera(mouseNDC, camera);
  mouseRaycaster.ray.intersectPlane(groundPlane, mouseWorld);
}

// Угол от героя к произвольной экранной точке (для тапа на мобиле)
function getAimAngleAtScreen(cx, cy) {
  mouseNDC.x = (cx / innerWidth) * 2 - 1;
  mouseNDC.y = -(cy / innerHeight) * 2 + 1;
  updateMouseWorld();
  return Math.atan2(mouseWorld.z - hero.z, mouseWorld.x - hero.x);
}

// Универсальный расчёт угла прицела Колобка:
//   - джойстик ведёт направление (приоритет)
//   - иначе — последний тап по экрану
//   - на десктопе — мышь
function computeRollerAimAngle() {
  const mi = (typeof mobileInput !== 'undefined' && mobileInput)
    ? mobileInput
    : { mx: 0, mz: 0 };
  const joyMag = Math.hypot(mi.mx, mi.mz);

  // 1. Активно двигаем джойстик — целимся по нему
  if (joyMag > 0.15) {
    mobileAimAngle = null;
    return Math.atan2(mi.mz, mi.mx);
  }

  // 2. Задан прицел тапом по экрану
  if (mobileAimAngle !== null) {
    return mobileAimAngle;
  }

  // 3. Десктоп — считаем угол к курсору мыши напрямую
  if (!isTouchDevice) {
    if (typeof mouseRaycaster !== 'undefined' &&
        typeof groundPlane !== 'undefined') {
      mouseRaycaster.setFromCamera(mouseNDC, camera);
      mouseRaycaster.ray.intersectPlane(groundPlane, mouseWorld);
      return Math.atan2(mouseWorld.z - hero.z, mouseWorld.x - hero.x);
    }
  }

  // 4. Нечего наводить — оставляем прошлый угол
  return hero.attackAngle;
}

const keys = {
  w: 0, a: 0, s: 0, d: 0,
  up: 0, left: 0, down: 0, right: 0,
  space: 0, shift: 0,
};

// Аналоговый ввод с мобильного джойстика (-1..1)
const mobileInput = { mx: 0, mz: 0 };

addEventListener('keydown', e => {
  // Не реагируем на игровые клавиши, пока открыта модалка прокачки
  // (там свои обработчики — A/D/Enter/пробел)
  if (paused && overlay && overlay.classList.contains('active')) return;
  // И при открытой модалке выбора оружия
  if (paused && weaponOverlay && weaponOverlay.classList.contains('active')) return;
  // Также не реагируем, пока открыто ESC-меню
  const escEl = document.getElementById('escMenu');
  if (escEl && escEl.classList.contains('active')) return;

  const c = e.code;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(c)) {
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
    // Пробел — прыжок, двойной пробел — удар молотом
  if (c === 'Space') {
    const now = performance.now();
    if (now - lastShiftTime < 300 && weaponLevel('hammer') >= 2 &&
        hammerSlamCooldown <= 0 && !hammerSlamState.active) {
      triggerHammerSlam();
      lastShiftTime = 0;
    } else {
      keys.shift = 1;
      lastShiftTime = now;
    }
  }

  if (c === 'KeyQ') {
    if (gameActive && !paused) {
      if (currentCharacter && currentCharacter.isRoller) {
        tryActivateKolobokBerserk();
      } else if (currentCharacter && currentCharacter.doubleSector) {
        tryActivateLucksMaxing();
      } else {
        tryActivateGrifonyaGas();
      }
    }
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
  if (c === 'Space') keys.shift = 0;
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
  removeStatueHitbox(s);
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

// =====================================================
//  МЕШ УРУРУ (из внешней модели)
// =====================================================
function makeUruruMesh() {
  const group = new THREE.Group();

  if (ururuModelLoaded && ururuModel) {
    // SkeletonUtils.clone корректно клонирует SkinnedMesh и кости.
    // Без него копия остаётся «привязанной» к костям оригинала,
    // и модель визуально не двигается вместе с группой.
    const clone = skeletonClone(ururuModel);
    clone.traverse(o => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.frustumCulled = false;   // skinned-меши нельзя отсекать по bbox
      }
      // Гарантируем, что клон обновляет свою матрицу каждый кадр
      o.matrixAutoUpdate = true;
    });

        // Разворот модели. Если лежит — меняйте X_ROT/Y_ROT/Z_ROT
    const URURU_ROT_X = 0;   // ← основной параметр
    const URURU_ROT_Y = 0;
    const URURU_ROT_Z = 0;
    clone.rotation.x = URURU_ROT_X;
    clone.rotation.y = URURU_ROT_Y;
    clone.rotation.z = URURU_ROT_Z;

    // Авто-масштаб до высоты 2.5 юнита
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    if (size.y > 0.001) {
      const scale = 2.5 / size.y;
      clone.scale.multiplyScalar(scale);
    }

        // Прижимаем низ модели к земле.
    // Для skinned-модели Box3 даёт bind-pose, поэтому вместо авто-центрирования
    // по XZ используем ручные смещения.
    const boxAfter = new THREE.Box3().setFromObject(clone);
    clone.position.y -= boxAfter.min.y;
    clone.position.x += URURU_XZ_OFFSET_X;
    clone.position.z += URURU_XZ_OFFSET_Z;

    group.add(clone);
  } else {
    // Fallback на случай, если модель ещё не загрузилась
    const mat = new THREE.MeshLambertMaterial({ color: 0xaa66cc });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1.0, 6, 12), mat);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 10), mat);
    head.position.y = 2.05;
    head.castShadow = true;
    group.add(head);
  }

  return group;
}

// Проверка: может ли Уруру заспавниться
function canSpawnUruru() {
  return level >= 10 && ururuModelLoaded;
}

// Вероятность спавна Уруру вместо обычного врага
function getUruruProbability(lvl) {
  if (lvl < 10) return 0;
  if (lvl < 15) return 0.04;   // 4% — редко
  if (lvl < 20) return 0.06;   // 6%
  return 0.08;                 // 8%
}

const URURU_Y_OFFSET = -1.65;
const URURU_RADIUS = 1.6;
const URURU_XZ_OFFSET_X = 0;
const URURU_XZ_OFFSET_Z = 0;
// =====================================================
//  ОТЛАДКА: показывать хитбоксы всех врагов
//  Управляется из меню ESC
// =====================================================
let debugShowHitboxes = false;

function spawnEnemy() {
  const tier = Math.min(1 + Math.floor(level / 3), 5);

  // Уруру — приоритетная проверка (спавнится редко)
  const isUruru = Math.random() < getUruruProbability(level);

  // Определяем, будет ли это учитель
  const isTeacher = !isUruru && Math.random() < getTeacherProbability(level);

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
  //  УРУРУ — редкий элитный враг
  // ============================================================
  if (isUruru) {
        const mesh = makeUruruMesh();
    mesh.position.set(x, 0, z);

    // Небольшой случайный поворот, чтобы все клоны не смотрели одинаково
    mesh.rotation.y = Math.random() * Math.PI * 2;

    scene.add(mesh);

    // Чуть слабее учителя
    const baseHp     = 12 + tier * 12;
    const baseDamage = 22 + tier * 6;
    const baseSpeed  = 2.2 + tier * 0.3;
    const baseXp     = (4 + tier * 2) + 3;

    const maxHp = Math.round(baseHp * 2.5);   // у учителя ×3.0

    enemies.push({
      mesh, x, z,
      type: { name: 'УРУРУ', color: 0xaa66cc, r: URURU_RADIUS },
      isUruru: true,
      isTeacher: false,
      hp: maxHp, maxHp,
      speed: baseSpeed * 1.35,
      damage: Math.round(baseDamage * 2.5),
      r: URURU_RADIUS,
      xpValue: Math.round(baseXp * 2.5),     // у учителя ×3.0
      dying: false,
      dyingTimer: 0,
      kbX: 0, kbZ: 0,
      wobble: Math.random() * Math.PI * 2,
    });
    return;
  }

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


// Проверка попадания в «зону атаки» текущего персонажа.
// Для Шишкуна — два сектора ±22.5° от направления прицела.
function isInAttackSector(angleToTarget, aimAngle) {
  if (currentCharacter && currentCharacter.doubleSector) {
    for (const o of [-SHISHKUN_SECTOR_OFFSET, SHISHKUN_SECTOR_OFFSET]) {
      let diff = Math.abs(angleToTarget - (aimAngle + o));
      diff = Math.min(diff, Math.PI * 2 - diff);
      if (diff <= SHISHKUN_SECTOR_HALF) return true;
    }
    return false;
  }
  const isRoller = currentCharacter && currentCharacter.isRoller;
  const half = isRoller ? 1.4 : 1.15;
  let diff = Math.abs(angleToTarget - aimAngle);
  diff = Math.min(diff, Math.PI * 2 - diff);
  return diff <= half;
}

// =====================================================
//  УДАР РЮКЗАКОМ
// =====================================================
let lastAttack = 0;
let lastJumpAttack = 0;

function doAttack() {
  // Во время катсцены / езды Луксмаксинга обычная атака недоступна
  if (lucksMaxingActive) return;

  const now = performance.now();
  const isJumpAttack = hero.isJumping && hero.height > 0.3;

  // Бафф молота усиливает урон физических атак
  const hammerDmgMul = heroTransformTimer > 0 ? heroTransformDamageMult : 1;
  const baseDamage = stats.damage * hammerDmgMul;

  // Прыжковый удар имеет свой кулдаун и не блокируется наземным
  if (isJumpAttack) {
    if (now - lastJumpAttack < 350) return;
    lastJumpAttack = now;
  } else {
    if (now - lastAttack < stats.cooldown) return;
    lastAttack = now;
  }

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
    const damage = baseDamage * (1 + heightRatio * (JUMP_ATTACK_MULT - 1));

        // Направление прыжкового удара
    if (currentCharacter && currentCharacter.isRoller) {
      hero.attackAngle = computeRollerAimAngle();
    } else {
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
    }

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

   // Колобок бьёт в сторону мыши/джойстика, Грифоня — в сторону ближайшего врага
  if (currentCharacter && currentCharacter.isRoller) {
    hero.attackAngle = computeRollerAimAngle();
  } else {
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
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dying || e.flyingToBoss) continue;

    const dx = e.x - hero.x;
    const dz = e.z - hero.z;
    const dist = Math.hypot(dx, dz);
    if (dist > stats.radius + e.r) continue;

    if (!isInAttackSector(Math.atan2(dz, dx), hero.attackAngle)) continue;

    e.hp -= baseDamage;
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
      if (isInAttackSector(Math.atan2(dz, dx), hero.attackAngle)) {
        damageBoss(baseDamage);
      }
    }
  }

  for (let i = statues.length - 1; i >= 0; i--) {
    const s = statues[i];
    const dx = s.x - hero.x;
    const dz = s.z - hero.z;
    const dist = Math.hypot(dx, dz);
    if (dist > stats.radius + s.r) continue;
    if (isInAttackSector(Math.atan2(dz, dx), hero.attackAngle)) {
      damageStatue(s, i, baseDamage);
    }
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
  const activeMul = heroTransformTimer > 0 ? heroTransformDamageMult : 1;
  hammerSlamState.active = true;
  hammerSlamState.timer = 0;
  hammerSlamState.duration = 0.7;
  hammerSlamState.damage = stats.damage * def.slamDamageMult[lvl - 1] * activeMul;
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

// =====================================================
//  ЯРОСТЬ КОЛОБКА — активация и апдейт
// =====================================================
function tryActivateKolobokBerserk() {
  if (!currentCharacter || !currentCharacter.isRoller) return;
  if (level < KOLOBOK_BERSERK_UNLOCK_LEVEL) return;
  if (kolobokBerserkActive) return;
  if (kolobokBerserkCooldown > 0) return;
  if (!gameActive || paused) return;

  kolobokBerserkActive = true;
  kolobokBerserkTimer = KOLOBOK_BERSERK_DURATION;
  kolobokAuraGroup.visible = true;

  // Прерываем прыжок — в ярости нельзя быть в воздухе
  hero.isJumping = false;
  hero.height = 0;

  // Вспышка при активации
  burst(hero.x, hero.z, 0xffaa00);
  burst(hero.x, hero.z, 0xff5522);
  cameraShake(0.15);
}

function updateKolobokBerserk(dt) {
  // Откат
  if (kolobokBerserkCooldown > 0) {
    kolobokBerserkCooldown -= dt;
    if (kolobokBerserkCooldown < 0) kolobokBerserkCooldown = 0;
  }

  if (!kolobokBerserkActive) {
    if (kolobokAuraGroup.visible) kolobokAuraGroup.visible = false;
    return;
  }

  // Длительность
  kolobokBerserkTimer -= dt;
  if (kolobokBerserkTimer <= 0) {
    kolobokBerserkActive = false;
    kolobokBerserkTimer = 0;
    kolobokBerserkCooldown = KOLOBOK_BERSERK_COOLDOWN;
    kolobokAuraGroup.visible = false;
    burst(hero.x, hero.z, 0xff5522);
    return;
  }

  // Привязка ауры к герою
  kolobokAuraGroup.position.set(hero.x, 0, hero.z);

  // Анимация
  const t = performance.now() * 0.006;
  kAuraRing.scale.setScalar(1 + Math.sin(t) * 0.07);
  kAuraRing2.scale.setScalar(1 + Math.sin(t * 0.8 + 1) * 0.1);
  kAuraSphereMat.opacity = 0.12 + Math.sin(t * 1.4) * 0.05;
  kAuraRing.rotation.z += dt * 1.5;
  kAuraRing2.rotation.z -= dt * 1.0;

  // Вращаем спицы
  for (const s of kAuraSpokes) {
    s.rotation.z += dt * 2.2;
  }

   // Урон = скорость × коэф. + урон × коэф.
  const speedMul = heroTransformTimer > 0 ? heroTransformSpeedMult : 1;
  const dmgMul = heroTransformTimer > 0 ? heroTransformDamageMult : 1;
  const currentSpeed = stats.speed * speedMul;
  const currentDamage = stats.damage * dmgMul;
  const dps = (currentSpeed * KOLOBOK_BERSERK_SPEED_FACTOR) * 2.5
            + currentDamage * KOLOBOK_BERSERK_DAMAGE_FACTOR;

  // Врагам
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dying || e.flyingToBoss) continue;
    const d = Math.hypot(e.x - hero.x, e.z - hero.z);
    if (d < KOLOBOK_BERSERK_RADIUS + e.r) {
      e.hp -= dps * dt;
      if (Math.random() < 0.15) burst(e.x, e.z, 0xffaa00);
      if (e.hp <= 0) killEnemy(e, i);
    }
  }

  // Боссу
  if (boss.active) {
    const d = Math.hypot(boss.x - hero.x, boss.z - hero.z);
    if (d < KOLOBOK_BERSERK_RADIUS + boss.r) {
      damageBoss(dps * dt);
    }
  }

  // Статуям
  for (let i = statues.length - 1; i >= 0; i--) {
    const s = statues[i];
    const d = Math.hypot(s.x - hero.x, s.z - hero.z);
    if (d < KOLOBOK_BERSERK_RADIUS + s.r) {
      damageStatue(s, i, dps * dt);
    }
  }
}

// ---------- HUD для способности ----------
const kolobokHudEl = (function createKolobokHud() {
  const style = document.createElement('style');
  style.textContent = `
    #kolobokHud {
      position: fixed;
      bottom: 140px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 30, 40, 0.85);
      border: 3px solid #ffaa00;
      border-radius: 20px;
      padding: 8px 22px;
      color: #ffdd88;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-weight: 900;
      font-size: 16px;
      z-index: 60;
      display: none;
      letter-spacing: 1px;
      box-shadow: 0 0 20px rgba(255, 170, 0, 0.4);
      text-shadow: 2px 2px 0 #000;
      white-space: nowrap;
      pointer-events: none;
    }
    #kolobokHud.ready { animation: kPulse 1.2s ease-in-out infinite; }
    #kolobokHud.active {
      background: rgba(80, 30, 10, 0.92);
      color: #ffeedd;
      border-color: #ff5522;
      animation: none;
      box-shadow: 0 0 30px rgba(255, 100, 20, 0.85);
    }
    @keyframes kPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(255, 170, 0, 0.4); }
      50%      { box-shadow: 0 0 35px rgba(255, 170, 0, 0.95); }
    }
  `;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.id = 'kolobokHud';
  document.body.appendChild(el);
  return el;
})();

// =====================================================
//  ОТЛАДОЧНЫЕ ХИТБОКСЫ
// =====================================================
function getHitboxColor(e) {
  if (e.isUruru)   return 0xff00ff;   // пурпурный
  if (e.isTeacher) return 0x00ff66;   // зелёный
  if (e.isDog)     return 0xff8800;   // оранжевый
  return 0xff3333;                    // красный — учебники
}

function createDebugHitbox(e) {
  if (!e || e.debugHitbox) return;
  const r = e.r || 1;
  const ringGeo = new THREE.RingGeometry(Math.max(0.05, r - 0.06), r, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: getHitboxColor(e),
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(e.x, 0.14, e.z);
  ring.userData.__debugRing = true;
  scene.add(ring);
  e.debugHitbox = ring;
}

function removeDebugHitbox(e) {
  if (!e || !e.debugHitbox) return;
  scene.remove(e.debugHitbox);
  e.debugHitbox.geometry.dispose();
  e.debugHitbox.material.dispose();
  e.debugHitbox = null;
}

function createBossHitbox() {
  if (boss.debugHitbox) return;
  const r = boss.r;
  const ringGeo = new THREE.RingGeometry(Math.max(0.1, r - 0.1), r, 40);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xff00ff,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(boss.x, 0.14, boss.z);
  ring.userData.__debugRing = true;
  scene.add(ring);
  boss.debugHitbox = ring;
}

function removeBossHitbox() {
  if (!boss.debugHitbox) return;
  scene.remove(boss.debugHitbox);
  boss.debugHitbox.geometry.dispose();
  boss.debugHitbox.material.dispose();
  boss.debugHitbox = null;
}

function createStatueHitbox(s) {
  if (s.debugHitbox) return;
  const r = s.r;
  const ringGeo = new THREE.RingGeometry(Math.max(0.1, r - 0.06), r, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x66ddff,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(s.x, 0.14, s.z);
  ring.userData.__debugRing = true;
  scene.add(ring);
  s.debugHitbox = ring;
}

function removeStatueHitbox(s) {
  if (!s.debugHitbox) return;
  scene.remove(s.debugHitbox);
  s.debugHitbox.geometry.dispose();
  s.debugHitbox.material.dispose();
  s.debugHitbox = null;
}

function syncDebugHitboxes() {
  // Враги
  for (const e of enemies) {
    if (e.dying) {
      removeDebugHitbox(e);
      continue;
    }
    if (debugShowHitboxes) {
      if (!e.debugHitbox) createDebugHitbox(e);
      if (e.debugHitbox) e.debugHitbox.position.set(e.x, 0.14, e.z);
    } else if (e.debugHitbox) {
      removeDebugHitbox(e);
    }
  }

  // Аварийная очистка «осиротевших» колец —
  // если враг удалился без removeDebugHitbox, кольцо осталось в сцене.
  // Пробегаем по сцене и удаляем debugHitbox-меши, не привязанные ни к кому.
  const liveHitboxes = new Set();
  for (const e of enemies) if (e.debugHitbox) liveHitboxes.add(e.debugHitbox);
  for (const s of statues)  if (s.debugHitbox) liveHitboxes.add(s.debugHitbox);
  if (boss.debugHitbox) liveHitboxes.add(boss.debugHitbox);
  for (const p of projectiles) if (p.userData.debugHitbox) liveHitboxes.add(p.userData.debugHitbox);

  for (let i = scene.children.length - 1; i >= 0; i--) {
    const obj = scene.children[i];
    if (obj.userData && obj.userData.__debugRing && !liveHitboxes.has(obj)) {
      scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    }
  }

  // Босс
  if (boss.active) {
    if (debugShowHitboxes) {
      if (!boss.debugHitbox) createBossHitbox();
      if (boss.debugHitbox) boss.debugHitbox.position.set(boss.x, 0.14, boss.z);
    } else if (boss.debugHitbox) {
      removeBossHitbox();
    }
  } else if (boss.debugHitbox) {
    removeBossHitbox();
  }

  // Статуи
  for (const s of statues) {
    if (debugShowHitboxes) {
      if (!s.debugHitbox) createStatueHitbox(s);
    } else if (s.debugHitbox) {
      removeStatueHitbox(s);
    }
  }

  // Снаряды рогатки игрока
  for (const p of projectiles) {
    if (debugShowHitboxes) {
      if (!p.userData.debugHitbox) {
        const r = 0.3;
        const geo = new THREE.RingGeometry(0.22, r, 16);
        const mat = new THREE.MeshBasicMaterial({
          color: 0xffff00, transparent: true, opacity: 0.85,
          side: THREE.DoubleSide, depthWrite: false,
        });
        const ring = new THREE.Mesh(geo, mat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(p.position.x, 0.14, p.position.z);
        ring.userData.__debugRing = true;
        scene.add(ring);
        p.userData.debugHitbox = ring;
      }
      p.userData.debugHitbox.position.set(p.position.x, 0.14, p.position.z);
    } else if (p.userData.debugHitbox) {
      scene.remove(p.userData.debugHitbox);
      p.userData.debugHitbox.geometry.dispose();
      p.userData.debugHitbox.material.dispose();
      p.userData.debugHitbox = null;
    }
  }
}

function clearAllDebugHitboxes() {
  for (const e of enemies) removeDebugHitbox(e);
  removeBossHitbox();
  for (const s of statues) removeStatueHitbox(s);
  for (const p of projectiles) {
    if (p.userData.debugHitbox) {
      scene.remove(p.userData.debugHitbox);
      p.userData.debugHitbox.geometry.dispose();
      p.userData.debugHitbox.material.dispose();
      p.userData.debugHitbox = null;
    }
  }
}

// =====================================================
//  ТАЙМЕР ЗАБЕГА
// =====================================================
const runTimerEl = (function createRunTimer() {
  const style = document.createElement('style');
  style.textContent = `
    #runTimer {
      position: fixed;
      bottom: 14px;
      left: 14px;
      background: rgba(20, 30, 40, 0.85);
      border: 3px solid #6b5a3e;
      border-radius: 14px;
      padding: 6px 16px;
      color: #ffd966;
      font-family: 'Consolas', 'Courier New', monospace;
      font-weight: 900;
      font-size: 22px;
      letter-spacing: 2px;
      z-index: 25;
      text-shadow: 2px 2px 0 #000;
      box-shadow: 0 6px 0 #0b1114, 0 8px 16px rgba(0,0,0,0.6);
      pointer-events: none;
      min-width: 92px;
      text-align: center;
    }
    @media (hover: none) and (pointer: coarse) {
      #runTimer {
        bottom: 180px;
        left: 20px;
        font-size: 16px;
        padding: 4px 12px;
        min-width: 76px;
      }
    }
  `;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.id = 'runTimer';
  el.textContent = '00:00';
  document.body.appendChild(el);
  return el;
})();

let _lastRunTimerText = '';
function updateRunTimer() {
  const total = Math.floor(runTimer);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  const text = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  if (text !== _lastRunTimerText) {
    runTimerEl.textContent = text;
    _lastRunTimerText = text;
  }
}

// =====================================================
//  ШКАЛА БАФФА МОЛОТА
// =====================================================
const hammerBuffBar = (function createHammerBuffBar() {
  const style = document.createElement('style');
  style.textContent = `
     #hammerBuffBar {
      position: fixed;
      top: 50%;
      left: 14px;
      transform: translateY(-50%) translateX(-12px);
      width: 220px;
      background: rgba(20, 30, 40, 0.85);
      border: 3px solid #ffd966;
      border-radius: 20px;
      padding: 6px 14px 8px;
      z-index: 65;
      display: none;
      box-shadow: 0 0 20px rgba(255, 217, 102, 0.5), 0 6px 0 #4a3a1a;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-weight: 900;
      color: #ffe9a0;
      text-shadow: 2px 2px 0 #000;
      text-align: center;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
      pointer-events: none;
    }
    #hammerBuffBar.visible {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
    #hammerBuffBar .hbLabel {
      font-size: 13px;
      letter-spacing: 2px;
      margin-bottom: 4px;
    }
    #hammerBuffBar .hbTrack {
      width: 100%;
      height: 12px;
      background: #3a2a10;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: inset 0 2px 5px #000;
      position: relative;
    }
    #hammerBuffBar .hbFill {
      display: block;
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #ffb340, #ffd966, #ffee88);
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(255, 217, 102, 0.9);
      transition: width 0.1s linear;
    }
    #hammerBuffBar .hbTime {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 9px;
      color: #1a0e00;
      text-shadow: none;
      letter-spacing: 1px;
    }
  `;
  document.head.appendChild(style);

  const el = document.createElement('div');
  el.id = 'hammerBuffBar';
  el.innerHTML = `
    <div class="hbLabel">🔨 КРАСОТА АКТИВНА</div>
    <div class="hbTrack">
      <span class="hbFill"></span>
      <span class="hbTime"></span>
    </div>
  `;
  document.body.appendChild(el);

  return {
    el,
    fill: el.querySelector('.hbFill'),
    time: el.querySelector('.hbTime'),
  };
})();

let _hammerBarVisible = false;
function updateHammerBuffBar() {
  const active = heroTransformTimer > 0;

  if (!active) {
    if (_hammerBarVisible) {
      hammerBuffBar.el.classList.remove('visible');
      // Полностью прячем после анимации
      setTimeout(() => {
        if (heroTransformTimer <= 0) hammerBuffBar.el.style.display = 'none';
      }, 220);
      _hammerBarVisible = false;
    }
    return;
  }

  const ratio = Math.max(0, Math.min(1, heroTransformTimer / heroTransformMaxDuration));
  hammerBuffBar.fill.style.width = (ratio * 100) + '%';
  hammerBuffBar.time.textContent = heroTransformTimer.toFixed(1) + 'с';

  // Меняем цвет при малом остатке
  if (ratio < 0.25) {
    hammerBuffBar.fill.style.background = 'linear-gradient(90deg, #ff5533, #ff8866)';
  } else if (ratio < 0.5) {
    hammerBuffBar.fill.style.background = 'linear-gradient(90deg, #ffaa33, #ffcc66)';
  } else {
    hammerBuffBar.fill.style.background = 'linear-gradient(90deg, #ffb340, #ffd966, #ffee88)';
  }

  if (!_hammerBarVisible) {
    hammerBuffBar.el.style.display = 'block';
    // Заставляем браузер пересчитать layout перед добавлением класса
    void hammerBuffBar.el.offsetWidth;
    hammerBuffBar.el.classList.add('visible');
    _hammerBarVisible = true;
  }
}

// =====================================================
//  ГАЗЫ — активация и апдейт
// =====================================================
function tryActivateGrifonyaGas() {
  // Только для Грифони
  if (!currentCharacter || currentCharacter.isRoller || currentCharacter.doubleSector) return;
  if (level < GAS_UNLOCK_LEVEL) return;
  if (gasActive) return;
  if (gasCooldown > 0) return;
  if (!gameActive || paused) return;

  gasActive = true;
  gasTimer = GAS_DURATION;
  gasCenterX = hero.x;
  gasCenterZ = hero.z;

  gasTornadoGroup.visible = true;
  gasTornadoGroup.position.set(gasCenterX, 0, gasCenterZ);

  // Вспышка при активации
  burst(gasCenterX, gasCenterZ, 0x66ff44);
  burst(gasCenterX, gasCenterZ, 0x88ffaa);
  cameraShake(0.12);
}

function updateGrifonyaGas(dt) {
  // Откат
  if (gasCooldown > 0) {
    gasCooldown -= dt;
    if (gasCooldown < 0) gasCooldown = 0;
  }

  if (!gasActive) {
    if (gasTornadoGroup.visible) gasTornadoGroup.visible = false;
    return;
  }

  // Длительность
  gasTimer -= dt;
  if (gasTimer <= 0) {
    gasActive = false;
    gasTimer = 0;
    gasCooldown = GAS_COOLDOWN;
    gasTornadoGroup.visible = false;
    // Снимаем метку со всех врагов — иначе они останутся «в газе» навсегда
    for (const e of enemies) e.inGas = false;
    burst(gasCenterX, gasCenterZ, 0x66ff44);
    return;
  }

  // ---- Анимация ----
  const t = performance.now() * 0.001;
  for (let i = 0; i < gasRings.length; i++) {
    const r = gasRings[i];
    // Пульс радиуса
    const pulse = 1 + Math.sin(t * 3 + r.phase) * 0.08;
    r.mesh.scale.set(pulse, pulse, 1);
    // Вращение колец (противоположные направления для эффекта)
    r.mesh.rotation.z += dt * (1.2 + i * 0.4) * (i % 2 === 0 ? 1 : -1);
    // Лёгкое покачивание по высоте
    r.mesh.position.y = r.y + Math.sin(t * 2.5 + r.phase) * 0.2;
  }
  gasCoreMat.opacity = 0.18 + Math.sin(t * 2) * 0.06;
  gasBeamMat.opacity = 0.12 + Math.sin(t * 1.5) * 0.04;

  // ---- Движение торнадо к ближайшему врагу ----
  // Ищем ближайшую цель (враг или босс)
  let targetX = null, targetZ = null, bestDist = Infinity;

  for (const e of enemies) {
    if (e.dying || e.flyingToBoss) continue;
    const dx = e.x - gasCenterX;
    const dz = e.z - gasCenterZ;
    const d = Math.hypot(dx, dz);
    if (d < bestDist) {
      bestDist = d;
      targetX = e.x;
      targetZ = e.z;
    }
  }
  if (boss.active) {
    const dx = boss.x - gasCenterX;
    const dz = boss.z - gasCenterZ;
    const d = Math.hypot(dx, dz);
    if (d < bestDist) {
      bestDist = d;
      targetX = boss.x;
      targetZ = boss.z;
    }
  }

  // Двигаемся к цели со скоростью Грифони
  if (targetX !== null && bestDist > 0.5) {
    const dx = targetX - gasCenterX;
    const dz = targetZ - gasCenterZ;
    const d = Math.hypot(dx, dz) || 1;
    // Скорость торнадо = скорость героя (с учётом баффа молота)
    const speedMul = heroTransformTimer > 0 ? heroTransformSpeedMult : 1;
    const tornadoSpeed = stats.speed * speedMul;
    const step = tornadoSpeed * dt;
    // Не перескакиваем цель
    const moveDist = Math.min(step, d - 0.3);
    if (moveDist > 0) {
      gasCenterX += (dx / d) * moveDist;
      gasCenterZ += (dz / d) * moveDist;
    }
  }

  // Обновляем позицию визуала
  gasTornadoGroup.position.set(gasCenterX, 0, gasCenterZ);


  // ---- Урон и стягивание врагов ----
  const dps = stats.maxHp * GAS_DPS_FROM_HP;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dying || e.flyingToBoss) continue;

    const dx = e.x - gasCenterX;
    const dz = e.z - gasCenterZ;
    const d = Math.hypot(dx, dz);

    if (d < GAS_RADIUS) {
      // Метка: враг внутри торнадо — блокируем его урон игроку
      e.inGas = true;

      // --- Физика стягивания и кручения ---
      // Нормализованный вектор от центра к врагу
      const nx = d > 0.0001 ? dx / d : 1;
      const nz = d > 0.0001 ? dz / d : 0;

      // Радиальное притяжение (если враг далеко от центра)
      let moveX = 0, moveZ = 0;
      if (d > GAS_MIN_DISTANCE) {
        moveX -= nx * GAS_PULL_SPEED * dt;
        moveZ -= nz * GAS_PULL_SPEED * dt;
      }

      // Тангенциальное вращение вокруг центра
      const tx = -nz;
      const tz = nx;
      const spinSpeed = GAS_SPIN_SPEED * (0.5 + (GAS_RADIUS - d) / GAS_RADIUS);
      moveX += tx * spinSpeed * dt * Math.min(d, GAS_RADIUS);
      moveZ += tz * spinSpeed * dt * Math.min(d, GAS_RADIUS);

      e.x += moveX;
      e.z += moveZ;

      // Обнуляем обычный отброс, чтобы врага не выбивало из торнадо
      e.kbX *= 0.6;
      e.kbZ *= 0.6;

      // --- Урон ---
      e.hp -= dps * dt;
      if (Math.random() < 0.15) burst(e.x, e.z, 0x66ff44);
      if (e.hp <= 0) killEnemy(e, i);
    } else {
      // Снаружи — снимаем метку
      e.inGas = false;
    }
  }

  // ---- Урон боссу и статуям ----
  if (boss.active) {
    const dx = boss.x - gasCenterX;
    const dz = boss.z - gasCenterZ;
    const d = Math.hypot(dx, dz);
    if (d < GAS_RADIUS + boss.r) {
      damageBoss(stats.maxHp * GAS_DPS_FROM_HP * dt * 0.7);
    }
  }

  for (let i = statues.length - 1; i >= 0; i--) {
    const s = statues[i];
    const dx = s.x - gasCenterX;
    const dz = s.z - gasCenterZ;
    const d = Math.hypot(dx, dz);
    if (d < GAS_RADIUS + s.r) {
      damageStatue(s, i, stats.maxHp * GAS_DPS_FROM_HP * dt * 0.7);
    }
  }
}

// ---------- HUD для газов ----------
const gasHudEl = (function createGasHud() {
  const style = document.createElement('style');
  style.textContent = `
    #gasHud {
      position: fixed;
      bottom: 190px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(20, 40, 25, 0.85);
      border: 3px solid #66ff44;
      border-radius: 20px;
      padding: 8px 22px;
      color: #ccffbb;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-weight: 900;
      font-size: 16px;
      z-index: 60;
      display: none;
      letter-spacing: 1px;
      box-shadow: 0 0 20px rgba(102, 255, 68, 0.45);
      text-shadow: 2px 2px 0 #000;
      white-space: nowrap;
      pointer-events: none;
    }
    #gasHud.ready { animation: gasPulse 1.2s ease-in-out infinite; }
    #gasHud.active {
      background: rgba(30, 70, 20, 0.92);
      color: #eeffee;
      border-color: #88ff66;
      animation: none;
      box-shadow: 0 0 35px rgba(120, 255, 80, 0.95);
    }
    @keyframes gasPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(102, 255, 68, 0.45); }
      50%      { box-shadow: 0 0 35px rgba(120, 255, 80, 0.95); }
    }
  `;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.id = 'gasHud';
  document.body.appendChild(el);
  return el;
})();

let _lastGasHudText = '';
function updateGasHud() {
  const isRoller = currentCharacter && currentCharacter.isRoller;
  const isShishkun = currentCharacter && currentCharacter.doubleSector;
  if (isRoller || isShishkun || level < GAS_UNLOCK_LEVEL) {
    if (gasHudEl.style.display !== 'none') {
      gasHudEl.style.display = 'none';
      _lastGasHudText = '';
    }
    return;
  }

  let text, cls;
  if (gasActive) {
    text = `☣ ГАЗЫ! ${gasTimer.toFixed(1)}с`;
    cls = 'active';
  } else if (gasCooldown > 0) {
    text = `☣ Газы: ${gasCooldown.toFixed(1)}с`;
    cls = '';
  } else {
    text = `☣ Q — ГАЗЫ ГОТОВЫ`;
    cls = 'ready';
  }

  if (text !== _lastGasHudText || gasHudEl.className !== cls) {
    gasHudEl.textContent = text;
    gasHudEl.className = cls;
    gasHudEl.style.display = 'block';
    _lastGasHudText = text;
  }
}

// =====================================================
//  ЛУКСМАКСИНГ — модель машины
// =====================================================
function createLucksCarMesh() {
  // Внешняя группа — её position и rotation.y меняет игра.
  // Внутренняя — скомпенсированный разворот, чтобы «нос» модели
  // смотрел в +Z (как у всех персонажей).
  const g = new THREE.Group();
  const inner = new THREE.Group();
  inner.rotation.y = Math.PI / 2;
  g.add(inner);
  // Внутри inner всё, что раньше добавлялось в g.
  // Псевдоним, чтобы не переписывать все .add ниже:
  const attach = inner;

  const bodyMat  = new THREE.MeshLambertMaterial({ color: 0x8a1a2a });
  const trimMat  = new THREE.MeshLambertMaterial({ color: 0xffd966 });
  const glassMat = new THREE.MeshLambertMaterial({
    color: 0x88ddff, emissive: 0x224466, transparent: true, opacity: 0.75,
  });
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const rimMat   = new THREE.MeshLambertMaterial({ color: 0xcccccc });

  // Нижняя часть — «кузов»
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.9, 1.8), bodyMat);
  body.position.y = 0.9;
  body.castShadow = true;
  inner.add(body);

  // Верх — «кабина» чуть выше
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.85, 1.7), bodyMat);
  cabin.position.set(0.1, 1.75, 0);
  cabin.castShadow = true;
  inner.add(cabin);

  // Заднее стекло
  const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 1.5), glassMat);
  rearGlass.position.set(1.12, 1.8, 0);
  inner.add(rearGlass);

  // Лобовое стекло
  const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 1.5), glassMat);
  frontGlass.position.set(-0.92, 1.8, 0);
  inner.add(frontGlass);

  // Полоска-хром по низу
  const chrome = new THREE.Mesh(new THREE.BoxGeometry(4.05, 0.08, 1.82), trimMat);
  chrome.position.y = 0.5;
  inner.add(chrome);

  // Полоска-хром по верху
  const chromeTop = new THREE.Mesh(new THREE.BoxGeometry(4.05, 0.06, 1.82), trimMat);
  chromeTop.position.y = 1.32;
  inner.add(chromeTop);

  // Колёса + диски
  const wheelPositions = [
    [1.3, 0.42, 0.92], [-1.3, 0.42, 0.92],
    [1.3, 0.42, -0.92], [-1.3, 0.42, -0.92],
  ];
  for (const [x, y, z] of wheelPositions) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.32, 16), wheelMat);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, y, z);
    w.castShadow = true;
    inner.add(w);
    // Диск
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.34, 12), rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, y, z);
    inner.add(rim);
  }

  // Фары
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xffee88 });
  const hl1 = new THREE.Mesh(new THREE.CircleGeometry(0.22, 12), hlMat);
  hl1.position.set(-2.01, 0.95, 0.55);
  hl1.rotation.y = -Math.PI / 2;
  inner.add(hl1);
  const hl2 = hl1.clone();
  hl2.position.z = -0.55;
  inner.add(hl2);

  // Задние стопы
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xff3020 });
  const tl1 = new THREE.Mesh(new THREE.CircleGeometry(0.16, 12), tlMat);
  tl1.position.set(2.01, 0.95, 0.55);
  tl1.rotation.y = Math.PI / 2;
  inner.add(tl1);
  const tl2 = tl1.clone();
  tl2.position.z = -0.55;
  inner.add(tl2);

  return g;
}

// =====================================================
//  ЛУКСМАКСИНГ — активация
// =====================================================
function tryActivateLucksMaxing() {
  if (!currentCharacter || !currentCharacter.doubleSector) return;
  if (level < LUCK_UNLOCK_LEVEL) return;
  if (lucksMaxingActive) return;
  if (lucksMaxingCooldown > 0) return;
  if (!gameActive || paused) return;

  lucksMaxingActive = true;
  lucksMaxingPhase = 'cutscene';
  lucksMaxingTimer = 0;
  lucksMaxingExploded = false;
  enemiesFrozen = true;

  // Сохраняем текущую позицию камеры и её цель
  cinStartPos.copy(camera.position);
  cinStartLook.set(hero.x, 1.5 + hero.height * 0.4, hero.z);

  // Финальная позиция камеры — сбоку от Шишкуна, чуть выше
  const heroAngle = heroGroup.rotation.y;
  const camSide = heroAngle + Math.PI * 0.5;
  cinEndPos.set(
    hero.x + Math.sin(camSide) * 6.5,
    3.4,
    hero.z + Math.cos(camSide) * 6.5
  );
  cinEndLook.set(hero.x, 1.4, hero.z);

  // Машина подъезжает спереди-слева, останавливается рядом с Шишкуном
  const approachAngle = heroAngle - Math.PI * 0.65;
  const approachDist = 24;
  carStart.set(
    hero.x + Math.sin(approachAngle) * approachDist,
    0,
    hero.z + Math.cos(approachAngle) * approachDist
  );
  const parkSide = heroAngle + Math.PI * 0.5;
  carEnd.set(
    hero.x + Math.sin(parkSide) * 2.4,
    0,
    hero.z + Math.cos(parkSide) * 2.4
  );

  // Создаём машину
  carMesh = createLucksCarMesh();
  carMesh.position.copy(carStart);
  // Развернуть машину носом к точке парковки
  const dx = carEnd.x - carStart.x;
  const dz = carEnd.z - carStart.z;
  carMesh.rotation.y = Math.atan2(dx, dz);
  scene.add(carMesh);

  burst(hero.x, hero.z, 0xffd966);
}

// =====================================================
//  ЛУКСМАКСИНГ — апдейт
// =====================================================
function updateLucksMaxing(dt) {
  // Откат
  if (lucksMaxingCooldown > 0) {
    lucksMaxingCooldown -= dt;
    if (lucksMaxingCooldown < 0) lucksMaxingCooldown = 0;
  }

  if (!lucksMaxingActive) return;

  lucksMaxingTimer += dt;
  const t = lucksMaxingTimer;

  if (lucksMaxingPhase === 'cutscene') {
    // =============== ФАЗА КАТСЦЕНЫ ===============
    const ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

    // 0.0–1.2: камера спускается к Шишкуну
    // 1.2–3.0: держим крупный план
    // 3.0–3.6: камера возвращается
    let camPos, camLook;
    if (t < 1.2) {
      const p = ease(t / 1.2);
      camPos = new THREE.Vector3().lerpVectors(cinStartPos, cinEndPos, p);
      camLook = new THREE.Vector3().lerpVectors(cinStartLook, cinEndLook, p);
    } else if (t < 3.0) {
      camPos = cinEndPos.clone();
      camLook = cinEndLook.clone();
    } else {
      const p = ease((t - 3.0) / 0.6);
      // Возвращаемся к «нормальной» позиции камеры
      const normalPos = new THREE.Vector3(hero.x, 18, hero.z + 22);
      const normalLook = new THREE.Vector3(hero.x, 1.5, hero.z);
      camPos = new THREE.Vector3().lerpVectors(cinEndPos, normalPos, p);
      camLook = new THREE.Vector3().lerpVectors(cinEndLook, normalLook, p);
    }
    camera.position.copy(camPos);
    camera.lookAt(camLook);

    // --- Машина подъезжает: 1.2 – 2.4 ---
    if (carMesh) {
      if (t < 1.2) {
        carMesh.position.copy(carStart);
      } else if (t < 2.4) {
        const p = ease((t - 1.2) / 1.2);
        carMesh.position.lerpVectors(carStart, carEnd, p);
        // Плавное доворачивание
        const dx = carEnd.x - carStart.x;
        const dz = carEnd.z - carStart.z;
        const targetRot = Math.atan2(dx, dz);
        carMesh.rotation.y = targetRot;
      } else {
        carMesh.position.copy(carEnd);
      }
    }

    // --- Шишкун садится в машину: 2.4 – 3.0 ---
    if (t >= 2.4 && t < 3.0) {
      const p = (t - 2.4) / 0.6;
      // Сжимаем героя, будто он «запрыгивает» в машину
      heroGroup.scale.setScalar(1 - p * 0.9);
      heroGroup.position.y = hero.height + p * 0.5;
    } else if (t >= 3.0) {
      heroGroup.visible = false;
      heroGroup.scale.setScalar(1);
    }

    // --- Взрыв: 3.4 ---
    if (t >= 3.4 && !lucksMaxingExploded) {
      lucksMaxingExploded = true;
      explodeLucksMaxing();
    }

    // --- Конец катсцены ---
    if (t >= LUCK_CUTSCENE_DURATION) {
      lucksMaxingPhase = 'driving';
      lucksMaxingTimer = 0;
      enemiesFrozen = false;
      heroGroup.visible = false; // герой внутри машины
    }
  }

  if (lucksMaxingPhase === 'driving') {
    // =============== ФАЗА ЕЗДЫ ===============
    // Машина под героем
    if (carMesh) {
      carMesh.position.set(hero.x, 0, hero.z);
      carMesh.rotation.y = heroGroup.rotation.y;
      // Легкое покачивание кузова
      carMesh.position.y = Math.sin(performance.now() * 0.02) * 0.05;
    }

    // Урон при наезде
    const dps = stats.maxHp * LUCK_RAM_DPS_MULT;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dying || e.flyingToBoss) continue;
      const d = Math.hypot(e.x - hero.x, e.z - hero.z);
      if (d < LUCK_RAM_RADIUS + e.r) {
        e.hp -= dps * dt;
        if (Math.random() < 0.25) burst(e.x, e.z, 0xffaa44);
        if (e.hp <= 0) killEnemy(e, i);
      }
    }

    // Конец езды
    if (t >= LUCK_DRIVING_DURATION) {
      lucksMaxingActive = false;
      lucksMaxingPhase = 'none';
      lucksMaxingCooldown = LUCK_COOLDOWN;
      heroGroup.visible = true;
      heroGroup.scale.setScalar(1);
      heroGroup.position.y = hero.height;
      if (carMesh) {
        scene.remove(carMesh);
        carMesh.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) o.material.dispose();
        });
        carMesh = null;
      }
      burst(hero.x, hero.z, 0xffd966);
    }
  }
}

// =====================================================
//  ЛУКСМАКСИНГ — взрыв
// =====================================================
function explodeLucksMaxing() {
  const R = LUCK_EXPLOSION_RADIUS;
  const dmg = stats.maxHp * LUCK_EXPLOSION_DMG_MULT;

  // Урон врагам
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dying || e.flyingToBoss) continue;
    const d = Math.hypot(e.x - hero.x, e.z - hero.z);
    if (d < R + e.r) {
      e.hp -= dmg;
      burst(e.x, e.z, 0xffaa44);
      if (e.hp <= 0) killEnemy(e, i);
    }
  }

  // Босс
  if (boss.active) {
    const d = Math.hypot(boss.x - hero.x, boss.z - hero.z);
    if (d < R + boss.r) damageBoss(dmg);
  }

  // Статуи
  for (let i = statues.length - 1; i >= 0; i--) {
    const s = statues[i];
    const d = Math.hypot(s.x - hero.x, s.z - hero.z);
    if (d < R + s.r) damageStatue(s, i, dmg);
  }

  // Визуал — расширяющееся кольцо
  const ringGeo = new THREE.RingGeometry(R * 0.2, R, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffdd44, transparent: true, opacity: 1,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(hero.x, 0.15, hero.z);
  scene.add(ring);

  const start = performance.now();
  function animRing() {
    const t = (performance.now() - start) / 700;
    if (t >= 1) { scene.remove(ring); return; }
    const s = 1 + t * 0.5;
    ring.scale.set(s, s, 1);
    ringMat.opacity = 1 - t;
    requestAnimationFrame(animRing);
  }
  animRing();

  // Взрыв частиц
  for (let i = 0; i < 6; i++) burst(hero.x, hero.z, 0xffaa44);
  for (let i = 0; i < 4; i++) burst(hero.x, hero.z, 0xffee88);
  burst(hero.x, hero.z, 0xff5522);

  cameraShake(0.7);
}

// ---------- HUD ----------
const luckHudEl = (function createLuckHud() {
  const style = document.createElement('style');
  style.textContent = `
    #luckHud {
      position: fixed;
      bottom: 240px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(40, 20, 25, 0.85);
      border: 3px solid #ff5566;
      border-radius: 20px;
      padding: 8px 22px;
      color: #ffccdd;
      font-family: 'Segoe UI', Arial, sans-serif;
      font-weight: 900;
      font-size: 16px;
      z-index: 60;
      display: none;
      letter-spacing: 1px;
      box-shadow: 0 0 20px rgba(255, 85, 102, 0.45);
      text-shadow: 2px 2px 0 #000;
      white-space: nowrap;
      pointer-events: none;
    }
    #luckHud.ready { animation: luckPulse 1.2s ease-in-out infinite; }
    #luckHud.active {
      background: rgba(80, 20, 30, 0.95);
      color: #ffddee;
      border-color: #ff8855;
      animation: none;
      box-shadow: 0 0 35px rgba(255, 120, 80, 0.95);
    }
    @keyframes luckPulse {
      0%, 100% { box-shadow: 0 0 20px rgba(255, 85, 102, 0.45); }
      50%      { box-shadow: 0 0 35px rgba(255, 120, 80, 0.95); }
    }
  `;
  document.head.appendChild(style);
  const el = document.createElement('div');
  el.id = 'luckHud';
  document.body.appendChild(el);
  return el;
})();

let _lastLuckHudText = '';
function updateLuckHud() {
  const isShishkun = currentCharacter && currentCharacter.doubleSector;
  if (!isShishkun || level < LUCK_UNLOCK_LEVEL) {
    if (luckHudEl.style.display !== 'none') {
      luckHudEl.style.display = 'none';
      _lastLuckHudText = '';
    }
    return;
  }

  let text, cls;
  if (lucksMaxingActive) {
    if (lucksMaxingPhase === 'cutscene') {
      text = `🚗 ЛУКСМАКСИНГ...`;
    } else {
      text = `🚗 ЕЗДА! ${(LUCK_DRIVING_DURATION - lucksMaxingTimer).toFixed(1)}с`;
    }
    cls = 'active';
  } else if (lucksMaxingCooldown > 0) {
    text = `🚗 Луксмаксинг: ${lucksMaxingCooldown.toFixed(1)}с`;
    cls = '';
  } else {
    text = `🚗 Q — ЛУКСМАКСИНГ`;
    cls = 'ready';
  }

  if (text !== _lastLuckHudText || luckHudEl.className !== cls) {
    luckHudEl.textContent = text;
    luckHudEl.className = cls;
    luckHudEl.style.display = 'block';
    _lastLuckHudText = text;
  }
}


let _lastKolobokHudText = '';
function updateKolobokHud() {
  const isRoller = currentCharacter && currentCharacter.isRoller;
  if (!isRoller || level < KOLOBOK_BERSERK_UNLOCK_LEVEL) {
    if (kolobokHudEl.style.display !== 'none') {
      kolobokHudEl.style.display = 'none';
      _lastKolobokHudText = '';
    }
    return;
  }

  let text, cls;
  if (kolobokBerserkActive) {
    text = `🔥 ЯРОСТЬ! ${kolobokBerserkTimer.toFixed(1)}с`;
    cls = 'active';
  } else if (kolobokBerserkCooldown > 0) {
    text = `🔥 Ярость: ${kolobokBerserkCooldown.toFixed(1)}с`;
    cls = '';
  } else {
    text = `🔥 Q — ЯРОСТЬ ГОТОВА`;
    cls = 'ready';
  }

  if (text !== _lastKolobokHudText || kolobokHudEl.className !== cls) {
    kolobokHudEl.textContent = text;
    kolobokHudEl.className = cls;
    kolobokHudEl.style.display = 'block';
    _lastKolobokHudText = text;
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

  { ico: '🔫', name: 'Крупная соль',
    desc: '+25 к урону дробовика',
    condition: () => !!equippedWeapons.shotgun,
    apply: () => { weaponDamageFlat.shotgun += 25; } },

  { ico: '💨', name: 'Стойкий аромат',
    desc: '+5 к урону облака духов',
    condition: () => !!equippedWeapons.perfume,
    apply: () => { weaponDamageFlat.perfume += 5; } },
];

let jumpCooldownBonus = 0;

const overlay = document.getElementById('levelup');
const cardsEl = document.getElementById('cards');

// =====================================================
//  НАВИГАЦИЯ ПО КАРТОЧКАМ КЛАВИАТУРОЙ (A/D + Enter)
// =====================================================
let levelUpSelectedIndex = 0;
let levelUpCardElements = [];
// Если true — в модалке прокачки мышь не работает, только клавиши
let blockMouseOnLevelUp = false;

// Навигация по карточкам выбора оружия
let weaponSelectedIndex = 0;
let weaponCardElements = [];   // 5 карточек оружия + кнопка «НЕ БРАТЬ»

// Однократная инъекция стилей подсветки
(function injectCardNavStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .card.selected {
      transform: translateY(-10px) !important;
      border-color: #ffd966 !important;
      box-shadow: 0 18px 0 #0b1114, 0 22px 40px #000, 0 0 30px rgba(255,217,102,0.9) !important;
      position: relative;
    }
       .card.selected::before {
      content: '▼';
      position: absolute;
      top: -26px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffd966;
      font-size: 22px;
      font-weight: 900;
      text-shadow: 2px 2px 0 #000, 0 0 10px rgba(255,217,102,0.9);
      animation: cardNavArrow 0.7s ease-in-out infinite;
    }
    @keyframes cardNavArrow {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50%      { transform: translateX(-50%) translateY(5px); }
    }

    /* Режим «мышь заблокирована» в модалке прокачки */
    #levelup.no-mouse .card {
      pointer-events: none !important;
      cursor: default !important;
    }
    #levelup.no-mouse .card:hover {
      transform: none !important;
      border-color: #6b5a3e !important;
      box-shadow: 0 8px 0 #0b1114, 0 12px 20px #000 !important;
    }
    #levelup.no-mouse .card.selected {
      transform: translateY(-10px) !important;
      border-color: #ffd966 !important;
      box-shadow: 0 18px 0 #0b1114, 0 22px 40px #000, 0 0 30px rgba(255,217,102,0.9) !important;
    }
    #levelup .mouse-blocked-hint {
      position: absolute;
      top: 22px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(120, 30, 30, 0.85);
      border: 2px solid #ff5555;
      border-radius: 14px;
      padding: 8px 18px;
      color: #ffdddd;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      box-shadow: 0 0 18px rgba(255, 80, 80, 0.55);
      text-shadow: 2px 2px 0 #000;
      pointer-events: none;
      display: none;
    }
        #levelup.no-mouse .mouse-blocked-hint {
      display: block;
    }

    /* ---------- Подсветка в модалке выбора оружия ---------- */
    .weapon-card.selected, #skipWeapon.selected {
      transform: translateY(-10px) !important;
      border-color: #ffd966 !important;
      box-shadow: 0 18px 0 #0b1114, 0 22px 40px #000, 0 0 30px rgba(255,217,102,0.9) !important;
      position: relative;
    }
    #skipWeapon.selected {
      background: rgba(255, 217, 102, 0.18) !important;
      color: #ffd966 !important;
      border-color: #ffd966 !important;
    }
    .weapon-card.selected::before, #skipWeapon.selected::before {
      content: '▼';
      position: absolute;
      top: -26px;
      left: 50%;
      transform: translateX(-50%);
      color: #ffd966;
      font-size: 22px;
      font-weight: 900;
      text-shadow: 2px 2px 0 #000, 0 0 10px rgba(255,217,102,0.9);
      animation: cardNavArrow 0.7s ease-in-out infinite;
    }

    /* ---------- Блокировка мыши в выборе оружия ---------- */
    #weaponchoice.no-mouse .weapon-card,
    #weaponchoice.no-mouse #skipWeapon {
      pointer-events: none !important;
      cursor: default !important;
    }
    #weaponchoice.no-mouse .weapon-card:hover {
      transform: none !important;
      border-color: #6b5a3e !important;
      box-shadow: 0 8px 0 #0b1114, 0 12px 20px #000 !important;
    }
    #weaponchoice.no-mouse .weapon-card.selected {
      transform: translateY(-10px) !important;
      border-color: #ffd966 !important;
      box-shadow: 0 18px 0 #0b1114, 0 22px 40px #000, 0 0 30px rgba(255,217,102,0.9) !important;
    }
    #weaponchoice.no-mouse #skipWeapon.selected {
      background: rgba(255, 217, 102, 0.18) !important;
      color: #ffd966 !important;
      border-color: #ffd966 !important;
    }
    #weaponchoice .mouse-blocked-hint {
      position: absolute;
      top: 22px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(120, 30, 30, 0.85);
      border: 2px solid #ff5555;
      border-radius: 14px;
      padding: 8px 18px;
      color: #ffdddd;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 1px;
      box-shadow: 0 0 18px rgba(255, 80, 80, 0.55);
      text-shadow: 2px 2px 0 #000;
      pointer-events: none;
      display: none;
      z-index: 5;
    }
    #weaponchoice.no-mouse .mouse-blocked-hint {
      display: block;
    }
  `;
  document.head.appendChild(style);
})();

function highlightLevelUpCard(index) {
  if (levelUpCardElements.length === 0) return;
  index = Math.max(0, Math.min(levelUpCardElements.length - 1, index));
  levelUpSelectedIndex = index;
  levelUpCardElements.forEach((el, i) => {
    if (i === index) el.classList.add('selected');
    else el.classList.remove('selected');
  });
}
function highlightWeaponCard(index) {
  if (weaponCardElements.length === 0) return;
  index = Math.max(0, Math.min(weaponCardElements.length - 1, index));
  weaponSelectedIndex = index;
  weaponCardElements.forEach((el, i) => {
    if (i === index) el.classList.add('selected');
    else el.classList.remove('selected');
  });
}

function openLevelUp() {
  paused = true;
  // Если открыто ESC-меню — сначала закроем его
  const escEl = document.getElementById('escMenu');
  if (escEl && escEl.classList.contains('active')) {
    escEl.classList.remove('active');
    if (window.__escMenu && window.__escMenu.forceClose) {
      window.__escMenu.forceClose();
    }
  }
  overlay.classList.add('active');
  const pool = UPGRADES.filter(u => !u.condition || u.condition());
  cardsEl.innerHTML = '';

  levelUpCardElements = [];

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
      overlay.classList.remove('no-mouse');
      paused = false;
      levelUpQueue--;
      levelUpCardElements = [];
      levelUpSelectedIndex = 0;
      if (weaponChoiceQueue > 0) {
        setTimeout(openWeaponChoice, 60);
      } else if (levelUpQueue > 0) {
        setTimeout(openLevelUp, 60);
      }
    };
    cardsEl.appendChild(card);
    levelUpCardElements.push(card);
  }

  // Подсказка «мышь заблокирована»
  let blockedHint = overlay.querySelector('.mouse-blocked-hint');
  if (!blockedHint) {
    blockedHint = document.createElement('div');
    blockedHint.className = 'mouse-blocked-hint';
    blockedHint.textContent = '🖱 Мышь заблокирована · используйте A / D + Enter';
    overlay.appendChild(blockedHint);
  }

  // Применяем режим блокировки мыши
  if (blockMouseOnLevelUp) {
    overlay.classList.add('no-mouse');
  } else {
    overlay.classList.remove('no-mouse');
  }

  // Выделяем первую карточку
  levelUpSelectedIndex = 0;
  highlightLevelUpCard(0);
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

  weaponCardElements = [];

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
        weaponOverlay.classList.remove('no-mouse');
        paused = false;
        weaponChoiceQueue--;
        weaponCardElements = [];
        weaponSelectedIndex = 0;
        if (weaponChoiceQueue > 0) {
          setTimeout(openWeaponChoice, 60);
        } else if (levelUpQueue > 0) {
          setTimeout(openLevelUp, 60);
        }
      };
    }

    weaponCardsEl.appendChild(card);
    weaponCardElements.push(card);
  }

  // Последний элемент навигации — кнопка «НЕ БРАТЬ ОРУЖИЕ»
  weaponCardElements.push(skipBtn);

  // Подсказка «мышь заблокирована»
  let blockedHint = weaponOverlay.querySelector('.mouse-blocked-hint');
  if (!blockedHint) {
    blockedHint = document.createElement('div');
    blockedHint.className = 'mouse-blocked-hint';
    blockedHint.textContent = '🖱 Мышь заблокирована · A / D + Enter · S — пропустить';
    weaponOverlay.appendChild(blockedHint);
  }

  // Применяем режим блокировки мыши
  if (blockMouseOnLevelUp) {
    weaponOverlay.classList.add('no-mouse');
  } else {
    weaponOverlay.classList.remove('no-mouse');
  }

  // Подсвечиваем первую карточку
  weaponSelectedIndex = 0;
  highlightWeaponCard(0);
}

skipBtn.onclick = () => {
  weaponOverlay.classList.remove('active');
  weaponOverlay.classList.remove('no-mouse');
  paused = false;
  weaponChoiceQueue--;
  weaponCardElements = [];
  weaponSelectedIndex = 0;
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
  // Во время езды на машине индикаторы атаки не нужны
  if (lucksMaxingActive && lucksMaxingPhase === 'driving') {
    attackRingMat.opacity = 0;
    attackDiscMat.opacity = 0;
    attackArcMat.opacity = 0;
    attackArcWideMat.opacity = 0;
    attackArcShishMat.opacity = 0;
    aimLineGroup.visible = false;
    return;
  }

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
  attackArcWide.position.x = hero.x;
  attackArcWide.position.z = hero.z;
  attackArcShishA.position.x = hero.x;
  attackArcShishA.position.z = hero.z;
  attackArcShishB.position.x = hero.x;
  attackArcShishB.position.z = hero.z;

  // ---- ПРИЦЕЛ для направленного оружия ----
  const isRoller = currentCharacter && currentCharacter.isRoller;
  const hasDirectional = !!(equippedWeapons.ruler || equippedWeapons.shotgun);
  const showAim = !isRoller && hasDirectional;

  if (showAim) {
    const len = equippedWeapons.shotgun
      ? (weaponStat('shotgun', 'range') || 11) * 0.8
      : (equippedWeapons.ruler ? (weaponStat('ruler', 'range') || 10) * 0.8 : 6);

    aimLineGroup.visible = true;
    aimLineGroup.position.x = hero.x;
    aimLineGroup.position.z = hero.z;
    aimLineGroup.rotation.y = -playerAimAngle;

    aimLineMesh.scale.set(len, 1, 1);
    aimLineMesh.position.x = len * 0.5;

    aimTipMesh.position.x = len;
    aimTipMesh.position.y = 0;
    aimTipMesh.visible = true;
  } else {
    aimLineGroup.visible = false;
  }

  const isShishkun = currentCharacter && currentCharacter.doubleSector;

  // Скрываем все секторы по умолчанию
  attackArcMat.opacity = 0;
  attackArcWideMat.opacity = 0;
  attackArcShishMat.opacity = 0;

  if (hero.attackTimer > 0) {
    const t = hero.attackTimer / 0.18;
    if (isShishkun) {
      // Два узких сектора, разнесённых на ±22.5°
      attackArcShishA.scale.set(r, r, r);
      attackArcShishB.scale.set(r, r, r);
      attackArcShishA.rotation.z = -hero.attackAngle + SHISHKUN_SECTOR_OFFSET;
      attackArcShishB.rotation.z = -hero.attackAngle - SHISHKUN_SECTOR_OFFSET;
      attackArcShishMat.opacity = t * 0.75;
    } else if (isRoller) {
      attackArcWide.scale.set(r, r, r);
      attackArcWide.rotation.z = -hero.attackAngle;
      attackArcWideMat.opacity = t * 0.8;
    } else {
      attackArc.scale.set(r, r, r);
      attackArc.rotation.z = -hero.attackAngle;
      attackArcMat.opacity = t * 0.55;
    }
  } else if (isRoller) {
    attackArcWide.scale.set(r, r, r);
    attackArcWide.rotation.z = -hero.attackAngle;
    attackArcWideMat.opacity = 0.3;
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
//  ВИЗУАЛ ТОРНАДО ГАЗОВ
// =====================================================
const gasTornadoGroup = new THREE.Group();
gasTornadoGroup.visible = false;
scene.add(gasTornadoGroup);

// Несколько колец на разной высоте — эффект воронки
const gasRings = [];
for (let i = 0; i < 5; i++) {
  const t = i / 4;                       // 0 → 1
  const ringRadius = 0.6 + t * (GAS_RADIUS - 0.6);
  const ringY = 0.2 + t * 4.5;           // растёт кверху
  const geo = new THREE.RingGeometry(ringRadius - 0.35, ringRadius, 40);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x66ff44,
    transparent: true,
    opacity: 0.55 - t * 0.4,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = ringY;
  gasTornadoGroup.add(ring);
  gasRings.push({ mesh: ring, baseRadius: ringRadius, y: ringY, phase: i * 1.1 });
}

// Внутренняя сфера — плотность газов
const gasCoreMat = new THREE.MeshBasicMaterial({
  color: 0x44dd22, transparent: true, opacity: 0.22,
  side: THREE.DoubleSide, depthWrite: false,
});
const gasCore = new THREE.Mesh(new THREE.SphereGeometry(GAS_RADIUS * 0.85, 20, 14), gasCoreMat);
gasCore.position.y = 2;
gasTornadoGroup.add(gasCore);

// Столб света вверх
const gasBeamMat = new THREE.MeshBasicMaterial({
  color: 0x88ff66, transparent: true, opacity: 0.15,
  side: THREE.DoubleSide, depthWrite: false,
});
const gasBeam = new THREE.Mesh(
  new THREE.CylinderGeometry(GAS_RADIUS * 0.9, GAS_RADIUS, 8, 28, 1, true),
  gasBeamMat
);
gasBeam.position.y = 4;
gasTornadoGroup.add(gasBeam);

// =====================================================
//  АУРА ЯРОСТИ КОЛОБКА
// =====================================================
const kolobokAuraGroup = new THREE.Group();
kolobokAuraGroup.visible = false;
scene.add(kolobokAuraGroup);

// Кольцо на земле
const kAuraRingGeo = new THREE.RingGeometry(2.0, 2.5, 40);
const kAuraRingMat = new THREE.MeshBasicMaterial({
  color: 0xffaa00, transparent: true, opacity: 0.75,
  side: THREE.DoubleSide, depthWrite: false,
});
const kAuraRing = new THREE.Mesh(kAuraRingGeo, kAuraRingMat);
kAuraRing.rotation.x = -Math.PI / 2;
kAuraRing.position.y = 0.12;
kolobokAuraGroup.add(kAuraRing);

// Второе кольцо — сдвинутое по фазе для пульсации
const kAuraRing2Geo = new THREE.RingGeometry(2.4, 2.7, 40);
const kAuraRing2Mat = new THREE.MeshBasicMaterial({
  color: 0xff6622, transparent: true, opacity: 0.5,
  side: THREE.DoubleSide, depthWrite: false,
});
const kAuraRing2 = new THREE.Mesh(kAuraRing2Geo, kAuraRing2Mat);
kAuraRing2.rotation.x = -Math.PI / 2;
kAuraRing2.position.y = 0.13;
kolobokAuraGroup.add(kAuraRing2);

// Огненная сфера
const kAuraSphereGeo = new THREE.SphereGeometry(1.9, 18, 14);
const kAuraSphereMat = new THREE.MeshBasicMaterial({
  color: 0xff5522, transparent: true, opacity: 0.15,
  side: THREE.DoubleSide, depthWrite: false,
});
const kAuraSphere = new THREE.Mesh(kAuraSphereGeo, kAuraSphereMat);
kAuraSphere.position.y = 1.2;
kolobokAuraGroup.add(kAuraSphere);

// Вращающиеся спицы
const kAuraSpokes = [];
for (let i = 0; i < 6; i++) {
  const a = (i / 6) * Math.PI * 2;
  const spoke = new THREE.Mesh(
    new THREE.PlaneGeometry(0.25, 1.4),
    new THREE.MeshBasicMaterial({
      color: 0xffdd44, transparent: true, opacity: 0.6,
      side: THREE.DoubleSide, depthWrite: false,
    })
  );
  spoke.rotation.x = -Math.PI / 2;
  spoke.rotation.z = a;
  spoke.position.set(Math.cos(a) * 1.6, 0.14, Math.sin(a) * 1.6);
  kolobokAuraGroup.add(spoke);
  kAuraSpokes.push(spoke);
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
      gameActive && !paused && !hammerSlamState.active && !kolobokBerserkActive) {
    hero.isJumping = true;
    hero.jumpTimer = JUMP_DURATION;
    hero.jumpCooldown = Math.max(600, (stats.jumpCooldown || 2000) - jumpCooldownBonus);
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
        if (e.isUruru) {
      // Уруру — фиолетовый ромб
      mmCtx.save();
      mmCtx.translate(p.x, p.y);
      mmCtx.rotate(Math.PI / 4);
      mmCtx.fillStyle = '#aa66cc';
      mmCtx.fillRect(-3, -3, 6, 6);
      mmCtx.strokeStyle = '#ffffff';
      mmCtx.lineWidth = 1.5;
      mmCtx.strokeRect(-3, -3, 6, 6);
      mmCtx.restore();
    } else if (e.isTeacher) {
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

  // Бумеранги линейки
  for (const b of rulerProjectiles) {
    const mp = worldToMinimap(b.x, b.z);
    mmCtx.beginPath();
    mmCtx.arc(mp.x, mp.y, 2.5, 0, Math.PI * 2);
    mmCtx.fillStyle = b.phase === 'out' ? '#ffdd66' : '#ffbb33';
    mmCtx.fill();
    mmCtx.strokeStyle = '#5a3a1a';
    mmCtx.lineWidth = 1;
    mmCtx.stroke();
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
    runTimer += dt;
    updateRunTimer();
    updateJump(dt);

    // Движение героя
    let mx = 0, mz = 0;
    const inLuckCutscene = lucksMaxingActive && lucksMaxingPhase === 'cutscene';
    if (!hammerSlamState.active && !inLuckCutscene) {
      if (keys.w || keys.up) mz -= 1;
      if (keys.s || keys.down) mz += 1;
      if (keys.a || keys.left) mx -= 1;
      if (keys.d || keys.right) mx += 1;
      // Мобильный джойстик (если он создан)
      if (typeof mobileInput !== 'undefined' && mobileInput) {
        mx += mobileInput.mx || 0;
        mz += mobileInput.mz || 0;
      }
    }

    if (mx || mz) {
      const l = Math.hypot(mx, mz);
      let speedMul = heroTransformTimer > 0 ? heroTransformSpeedMult : 1;
      // Луксмаксинг — езда на машине быстрее
      if (lucksMaxingActive && lucksMaxingPhase === 'driving') {
        speedMul *= LUCK_CAR_SPEED_MULT;
      }
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
    // Прицел — от мыши/джойстика/тапа. Работает для обоих персонажей.
    playerAimAngle = computeRollerAimAngle();
    // Колобок использует прицел для обычной атаки
    if (currentCharacter && currentCharacter.isRoller) {
      hero.attackAngle = playerAimAngle;
    }

        // Анимация текущего персонажа
    if (currentCharacter) {
      // Базовая анимация (ходьба/прыжок)
      if (!hero.isJumping) {
        currentCharacter.setWalk(hero.walkPhase, !!(mx || mz));
      }

      // Атака перебивает базовую позу
      if (hero.attackTimer > 0) {
        hero.attackTimer -= dt;
        const t = Math.max(0, hero.attackTimer / 0.18);
        currentCharacter.setAttack(t);
        // Грифоня разворачивается к цели, Колобок — только крутится
        if (!currentCharacter.isRoller) {
          heroGroup.rotation.y = hero.attackAngle + Math.PI;
        }
      }

      // Прыжок — только если не в атаке
      if (hero.isJumping) {
        currentCharacter.setJump(hero.attackTimer > 0);
      }
    }

    if (stats.regen > 0) {
      hp = Math.min(stats.maxHp, hp + stats.regen * dt);
    }
    updateHud();
    updateWeaponHud();

    updateHammerSlam(dt);
    updateKolobokBerserk(dt);
    updateKolobokHud();
    updateGrifonyaGas(dt);
    updateGasHud();
    updateLucksMaxing(dt);
    updateLuckHud();
    updateHammerBuffBar();
    syncDebugHitboxes();
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

      // Заморозка во время катсцены — враги не двигаются
      if (enemiesFrozen) continue;

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
            removeDebugHitbox(e);
            enemies.splice(i, 1);
            continue;
          }
        } else {
          // Босс умер — собака просто исчезает
          scene.remove(e.mesh);
          removeDebugHitbox(e);
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
          removeDebugHitbox(e);
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
      // Замедление от облака духов
      const slowMul = 1 - (e._perfumeSlow || 0);
      const effSpeed = e.speed * slowMul;
      let nx = e.x + (dx / d) * effSpeed * dt;
      let nz = e.z + (dz / d) * effSpeed * dt;

      const resolved = resolveHouseCollision(nx, nz, e.r * 0.6);
      e.x = resolved.x;
      e.z = resolved.z;

        if (e.isDog) {
        // Собака бежит по земле
        e.wobble += dt * 4;
        e.mesh.position.set(e.x, 0.05 + Math.abs(Math.sin(e.wobble * 3)) * 0.08, e.z);
        e.mesh.rotation.z = Math.sin(e.wobble * 3) * 0.06;
        e.mesh.lookAt(hero.x, e.mesh.position.y, hero.z);
          } else if (e.isUruru) {
        // Уруру ходит по земле, как учитель — лёгкое покачивание при шаге
        const step = Math.abs(Math.sin(e.wobble * 1.4));
        e.mesh.position.set(e.x, URURU_Y_OFFSET + step * 0.1, e.z);
        e.mesh.rotation.z = Math.sin(e.wobble * 1.4) * 0.05;
        e.mesh.rotation.y = Math.atan2(hero.x - e.x, hero.z - e.z);
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

      if (d < 1.3 && hero.height < JUMP_SAFE_HEIGHT && !e.flyingToBoss && !kolobokBerserkActive && !e.inGas && !(lucksMaxingActive && lucksMaxingPhase === 'driving')) {
        // Ослабление от облака духов
        const weakenMul = 1 - (e._perfumeWeaken || 0);
        hp -= e.damage * dt * 4 * weakenMul;
        if (hp <= 0 && gameActive) {
          hp = 0;
          gameActive = false;
          document.getElementById('bossHud').classList.remove('active');
          showGameOver();
        }
        updateHud();
      }
    }

    // Спавн врагов (реже во время боя с боссом, не спавним во время катсцены)
    if (!(lucksMaxingActive && lucksMaxingPhase === 'cutscene')) {
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
  }

    // Синхронизация хитбоксов даже когда игра на паузе
  syncDebugHitboxes();

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
  if (!(lucksMaxingActive && lucksMaxingPhase === 'cutscene')) {
    updateCamera();
  }
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
  runTimer = 0;
  _lastRunTimerText = '';
  updateRunTimer();

    // Применяем базовые статы выбранного персонажа (или дефолты)
  if (selectedCharacterId) {
    const charDef = CHARACTERS.find(c => c.id === selectedCharacterId);
    if (charDef) instantiateCharacter(charDef);
  }

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
  removeBossHitbox();
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
  weaponDamageFlat.shotgun = 0;
  weaponDamageFlat.perfume = 0;
   // У молота нет бонусов урона — карточки усиления к нему не относятся
  weaponTimers.pen = 0;
  weaponTimers.ruler = 0;
  weaponTimers.slingshot = 0;
  weaponTimers.hammer = 0;
  weaponTimers.shotgun = 0;
  weaponTimers.perfume = 0;
  heroTransformTimer = 0;
  heroTransformMaxDuration = 1;
  heroTransformDamageMult = 1.0;
  hammerSwingTimer = 0;
  _hammerBarVisible = false;
  if (typeof hammerBuffBar !== 'undefined' && hammerBuffBar) {
    hammerBuffBar.el.classList.remove('visible');
    hammerBuffBar.el.style.display = 'none';
  }
  hammerStacks = 0;
  hammerSlamCooldown = 0;
  lastAttack = 0;
  lastJumpAttack = 0;
  hammerSlamState.active = false;
  hammerSlamState.timer = 0;
  lastShiftTime = 0;
  cameraShakeAmount = 0;
  kolobokBerserkActive = false;
  kolobokBerserkTimer = 0;
  kolobokBerserkCooldown = 0;
  kolobokAuraGroup.visible = false;
  _lastKolobokHudText = '';

  gasActive = false;
  gasTimer = 0;
  gasCooldown = 0;
  gasTornadoGroup.visible = false;
  _lastGasHudText = '';
  for (const e of enemies) e.inGas = false;

  lucksMaxingActive = false;
  lucksMaxingCooldown = 0;
  lucksMaxingPhase = 'none';
  lucksMaxingTimer = 0;
  lucksMaxingExploded = false;
  enemiesFrozen = false;
  _lastLuckHudText = '';
  heroGroup.visible = true;
  heroGroup.scale.setScalar(1);
  if (carMesh) {
    scene.remove(carMesh);
    carMesh.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    carMesh = null;
  }
  revertHeroTransform();
  bagAngle = 0;
  rebuildWeaponMeshes();
  updateWeaponHud();

  clearAllDebugHitboxes();
  enemies.forEach(e => scene.remove(e.mesh));
  enemies.length = 0;

  particles.forEach(p => scene.remove(p));
  particles.length = 0;

  xpOrbs.forEach(o => scene.remove(o.mesh));
  xpOrbs.length = 0;

  projectiles.forEach(p => scene.remove(p));
  projectiles.length = 0;

  rulerProjectiles.forEach(b => {
    scene.remove(b.mesh);
    b.mesh.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  });
  rulerProjectiles.length = 0;

    perfumeClouds.forEach(c => {
    scene.remove(c.mesh);
    c.mesh.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
  });
  perfumeClouds.length = 0;
  for (const e of enemies) {
    e._perfumeSlow = 0;
    e._perfumeWeaken = 0;
  }

  zones.forEach(z => scene.remove(z.group));
  zones.length = 0;

  statues.forEach(s => {
    scene.remove(s.mesh);
    scene.remove(s.hpBar);
    if (s.debugHitbox) {
      scene.remove(s.debugHitbox);
      s.debugHitbox.geometry.dispose();
      s.debugHitbox.material.dispose();
      s.debugHitbox = null;
    }
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
//  ЭКРАН ВЫБОРА ПЕРСОНАЖА
// =====================================================
function createCharacterSelect() {
  paused = true;

  const style = document.createElement('style');
  style.textContent = `
    #charSelect {
      position: fixed;
      inset: 0;
      background: radial-gradient(circle at center, #2a3a5a 0%, #0a1220 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1500;
      gap: 30px;
      padding: 30px;
      font-family: 'Segoe UI', 'Arial', sans-serif;
    }
    #charSelect h1 {
      color: #ffd966;
      font-size: 52px;
      letter-spacing: 4px;
      text-shadow: 5px 5px 0 #3a2e1e, 0 0 40px rgba(255,200,80,0.4);
      text-align: center;
    }
    #charSelect .chars-grid {
      display: flex;
      gap: 30px;
      flex-wrap: wrap;
      justify-content: center;
    }
    #charSelect .char-card {
      width: 260px;
      background: linear-gradient(160deg, #3b4f5e, #1e2b32);
      border: 5px solid #6b5a3e;
      border-radius: 24px;
      padding: 24px 20px;
      cursor: pointer;
      text-align: center;
      color: #ffeecc;
      transition: 0.15s ease;
      box-shadow: 0 10px 0 #0b1114, 0 16px 30px #000;
    }
    #charSelect .char-card:hover {
      transform: translateY(-8px);
      border-color: #ffd966;
      box-shadow: 0 18px 0 #0b1114, 0 22px 40px #000;
    }
    #charSelect .char-card:active {
      transform: translateY(0);
    }
    #charSelect .char-emoji {
      font-size: 72px;
      line-height: 1;
      filter: drop-shadow(3px 4px 0 #00000066);
    }
    #charSelect .char-name {
      color: #ffd966;
      font-size: 28px;
      font-weight: 900;
      margin: 12px 0 8px;
      letter-spacing: 1px;
    }
    #charSelect .char-desc {
      color: #b8c9d6;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.4;
      min-height: 60px;
    }
    #charSelect .char-stats {
      display: flex;
      justify-content: center;
      gap: 14px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #ffffff20;
      font-size: 14px;
      font-weight: 900;
      color: #cfdde6;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'charSelect';
  overlay.innerHTML = `
    <h1>ВЫБЕРИ ПЕРСОНАЖА</h1>
    <div class="chars-grid" id="charGrid"></div>
  `;
  document.body.appendChild(overlay);

  const grid = document.getElementById('charGrid');
  for (const char of CHARACTERS) {
    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerHTML = `
      <div class="char-emoji">${char.emoji}</div>
      <div class="char-name">${char.name}</div>
      <div class="char-desc">${char.desc}</div>
      <div class="char-stats">
        <span>❤ ${char.stats.maxHp}</span>
        <span>⚡ ${char.stats.speed}</span>
        <span>💥 ${char.stats.damage}</span>
      </div>
    `;
    card.onclick = () => {
      selectedCharacterId = char.id;
      overlay.remove();
      reset();  // reset() выставит gameActive=true, paused=false и инстанцирует персонажа
    };
    grid.appendChild(card);
  }
}

// =====================================================
//  АТАКА МЫШЬЮ (только на десктопе)
// =====================================================
renderer.domElement.addEventListener('mousedown', e => {
  if (e.button !== 0) return;          // только левая кнопка
  if (isTouchDevice) return;            // на мобиле не дублируем
  if (gameActive && !paused) doAttack();
});

// ПКМ и СКМ можно использовать позже под другие действия
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

// =====================================================
//  МОБИЛЬНОЕ УПРАВЛЕНИЕ (джойстик + кнопки)
// =====================================================
function createMobileControls() {
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (!isTouch) return;

  const style = document.createElement('style');
  style.textContent = `
    #mobileControls {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 80;
    }

    /* ---------- Джойстик ---------- */
    #joyBase {
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 70%);
      border: 3px solid rgba(255,255,255,0.4);
      box-shadow: inset 0 0 24px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.4);
      pointer-events: auto;
      touch-action: none;
      user-select: none;
    }
    #joyKnob {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 62px;
      height: 62px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ffd966, #b88832);
      border: 3px solid #5a3a1a;
      box-shadow: 0 4px 10px rgba(0,0,0,0.7);
      transform: translate(-50%, -50%);
      pointer-events: none;
      transition: box-shadow 0.1s;
    }
    #joyBase.active #joyKnob {
      box-shadow: 0 6px 16px rgba(0,0,0,0.9), 0 0 24px rgba(255,217,102,0.6);
    }

    /* ---------- Кнопки ---------- */
    .mobileBtn {
      position: absolute;
      border-radius: 50%;
      pointer-events: auto;
      touch-action: none;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      font-weight: 900;
      color: #fff;
      text-shadow: 2px 2px 0 #000;
      border: 4px solid rgba(255,255,255,0.55);
      box-shadow: 0 6px 0 rgba(0,0,0,0.55), 0 12px 22px rgba(0,0,0,0.6);
      transition: transform 0.05s, box-shadow 0.05s;
    }
    .mobileBtn.pressed {
      transform: translateY(5px);
      box-shadow: 0 1px 0 rgba(0,0,0,0.55), 0 4px 8px rgba(0,0,0,0.6);
    }
    #btnAttack {
      bottom: 36px;
      right: 30px;
      width: 96px;
      height: 96px;
      background: radial-gradient(circle at 35% 30%, #ff8080, #a02020);
    }
    #btnJump {
      bottom: 150px;
      right: 48px;
      width: 82px;
      height: 82px;
      background: radial-gradient(circle at 35% 30%, #88ccff, #2a5a9a);
    }

    /* ---------- Адаптация остального UI ---------- */
    @media (hover: none) and (pointer: coarse) {
      #minimap {
        width: 130px !important;
        height: 130px !important;
        top: 8px !important;
        right: 8px !important;
        bottom: auto !important;
        left: auto !important;
      }
      #hud {
        padding-right: 150px;
      }
      #hint {
        display: none !important;
      }
      #restart {
        top: 148px;
        bottom: auto;
        left: auto;
        right: 8px;
        transform: none;
        font-size: 12px;
        padding: 6px 14px;
      }
      #restart:active {
        transform: translateY(3px);
      }
      #btnBerserk {
        bottom: 250px;
        right: 60px;
        width: 72px;
        height: 72px;
        background: radial-gradient(circle at 35% 30%, #ffbb44, #b84010);
        display: none;
      }
    }
  `;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'mobileControls';
  container.innerHTML = `
    <div id="joyBase"><div id="joyKnob"></div></div>
    <div class="mobileBtn" id="btnAttack">💥</div>
    <div class="mobileBtn" id="btnJump">⤴</div>
    <div class="mobileBtn" id="btnBerserk">🔥</div>
  `;
  document.body.appendChild(container);

  const joyBase = document.getElementById('joyBase');
  const joyKnob = document.getElementById('joyKnob');
  const btnAttack = document.getElementById('btnAttack');
  const btnJump = document.getElementById('btnJump');

  // ---------- Джойстик ----------
  let joyActive = false;
  let joyCenterX = 0, joyCenterY = 0;
  const joyMaxRadius = 55;
  const joyDeadzone = 0.18;

  function getClientPos(e) {
    if (e.touches && e.touches.length) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  function startJoy(e) {
    const rect = joyBase.getBoundingClientRect();
    joyCenterX = rect.left + rect.width / 2;
    joyCenterY = rect.top + rect.height / 2;
    joyActive = true;
    joyBase.classList.add('active');
    moveJoy(e);
  }

  function moveJoy(e) {
    if (!joyActive) return;
    const pos = getClientPos(e);
    let dx = pos.x - joyCenterX;
    let dy = pos.y - joyCenterY;
    const dist = Math.hypot(dx, dy);
    if (dist > joyMaxRadius) {
      dx = dx / dist * joyMaxRadius;
      dy = dy / dist * joyMaxRadius;
    }
    joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

    let tmx = dx / joyMaxRadius;
    let tmz = dy / joyMaxRadius;
    // Дедзона — чтобы палец в покое не сдвигал героя
    if (Math.hypot(tmx, tmz) < joyDeadzone) { tmx = 0; tmz = 0; }
    mobileInput.mx = tmx;
    mobileInput.mz = tmz;
  }

  function endJoy() {
    if (!joyActive) return;
    joyActive = false;
    joyBase.classList.remove('active');
    joyKnob.style.transform = 'translate(-50%, -50%)';
    mobileInput.mx = 0;
    mobileInput.mz = 0;
  }

  joyBase.addEventListener('touchstart',  e => { e.preventDefault(); startJoy(e); }, { passive: false });
  joyBase.addEventListener('touchmove',   e => { e.preventDefault(); moveJoy(e);  }, { passive: false });
  joyBase.addEventListener('touchend',    e => { e.preventDefault(); endJoy();   }, { passive: false });
  joyBase.addEventListener('touchcancel', e => { endJoy(); });

  // Fallback для отладки на десктопе
  joyBase.addEventListener('mousedown', e => { e.preventDefault(); startJoy(e); });
  addEventListener('mousemove', e => { if (joyActive) moveJoy(e); });
  addEventListener('mouseup',   () => { if (joyActive) endJoy(); });

  // ---------- Кнопка атаки ----------
    btnAttack.addEventListener('touchstart', e => {
    e.preventDefault();
    btnAttack.classList.add('pressed');
    if (!gameActive || paused) return;
    // Если герой уже в воздухе — сразу прыжковый удар
    if (hero.isJumping && hero.height > 0.3) {
      doAttack();
      return;
    }
    // Если только что нажали прыжок (в пределах 250мс) — откладываем атаку
    // до момента, когда герой уже будет в воздухе
    const sinceJump = performance.now() - lastShiftTime;
    if (sinceJump < 250 && hero.jumpCooldown > 0) {
      setTimeout(() => {
        if (gameActive && !paused && hero.isJumping && hero.height > 0.3) {
          doAttack();
        } else if (gameActive && !paused) {
          doAttack(); // на всякий случай — если прыжок не удался
        }
      }, Math.max(0, 120 - sinceJump));
    } else {
      doAttack();
    }
  }, { passive: false });
  btnAttack.addEventListener('touchend', e => {
    e.preventDefault();
    btnAttack.classList.remove('pressed');
  }, { passive: false });
  btnAttack.addEventListener('touchcancel', () => {
    btnAttack.classList.remove('pressed');
  });

  // ---------- Кнопка прыжка (двойной тап → удар молотом) ----------
  function handleJumpTap() {
    const now = performance.now();
    if (now - lastShiftTime < 300 && weaponLevel('hammer') >= 2 &&
        hammerSlamCooldown <= 0 && !hammerSlamState.active) {
      triggerHammerSlam();
      lastShiftTime = 0;
    } else {
      keys.shift = 1;
      lastShiftTime = now;
      // Подстраховка — если прыжок не был съеден в этом кадре
      setTimeout(() => { keys.shift = 0; }, 100);
    }
  }

  btnJump.addEventListener('touchstart', e => {
    e.preventDefault();
    btnJump.classList.add('pressed');
    handleJumpTap();
  }, { passive: false });
  btnJump.addEventListener('touchend', e => {
    e.preventDefault();
    btnJump.classList.remove('pressed');
  }, { passive: false });
  btnJump.addEventListener('touchcancel', () => {
    btnJump.classList.remove('pressed');
  });

   // Отключаем скролл/зум жестами на всей странице для мобилы
  document.addEventListener('touchmove', e => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // ---------- Тап/свайп по пустому месту экрана — задаёт прицел ----------
  function isTapOnUI(cx, cy) {
    const el = document.elementFromPoint(cx, cy);
    if (!el) return false;
    return !!el.closest('#mobileControls, #minimap, #restart, #hud, #bossHud, ' +
                       '#levelup, #weaponchoice, #gameover, #cheatPanel, ' +
                       '#cheatToggle, #charSelect, #zoneAlert');
  }

  function handleAimTouch(cx, cy) {
    if (!currentCharacter) return;
    if (!gameActive || paused) return;
    if (isTapOnUI(cx, cy)) return;
    // Для Грифони тап по экрану тоже задаёт прицел,
    // но только если у него есть направленное оружие
    const isRoller = currentCharacter.isRoller;
    const hasDirectional = !!(equippedWeapons.ruler || equippedWeapons.shotgun);
    if (!isRoller && !hasDirectional) return;
    // Наводим сектор в точку тапа
    mobileAimAngle = getAimAngleAtScreen(cx, cy);
    // Обновляем сразу, чтобы удар (если сработает в этом кадре) уже бил в правильную сторону
    hero.attackAngle = mobileAimAngle;
  }

    // ---------- Кнопка ярости (только для Колобка с 5 ур.) ----------
  const btnBerserk = document.getElementById('btnBerserk');
  btnBerserk.addEventListener('touchstart', e => {
    e.preventDefault();
    btnBerserk.classList.add('pressed');
    if (currentCharacter && currentCharacter.isRoller) {
      tryActivateKolobokBerserk();
    } else if (currentCharacter && currentCharacter.doubleSector) {
      tryActivateLucksMaxing();
    } else {
      tryActivateGrifonyaGas();
    }
  }, { passive: false });
  btnBerserk.addEventListener('touchend', e => {
    e.preventDefault();
    btnBerserk.classList.remove('pressed');
  }, { passive: false });

  // Показываем кнопку только Колобку с 5-го уровня
  setInterval(() => {
    let show = false;
    let icon = '🔥';
    if (currentCharacter) {
      if (currentCharacter.isRoller) {
        show = level >= KOLOBOK_BERSERK_UNLOCK_LEVEL;
        icon = '🔥';
      } else if (currentCharacter.doubleSector) {
        show = level >= LUCK_UNLOCK_LEVEL;
        icon = '🚗';
      } else {
        show = level >= GAS_UNLOCK_LEVEL;
        icon = '☣';
      }
    }
    btnBerserk.textContent = icon;
    btnBerserk.style.display = show ? 'flex' : 'none';
  }, 200);

  document.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) {
      // Правая половина экрана — наведение. Левая — джойстик, не трогаем.
      if (t.clientX > innerWidth * 0.35) {
        handleAimTouch(t.clientX, t.clientY);
      }
    }
  }, { passive: true });

  document.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.clientX > innerWidth * 0.35) {
        handleAimTouch(t.clientX, t.clientY);
      }
    }
  }, { passive: true });
}

// =====================================================
//  СТАРТ
// =====================================================
createMobileControls();
gameActive = false;
paused = true;
createCharacterSelect();
requestAnimationFrame(loop);


// =====================================================
//  МЕНЮ ПАУЗЫ (ESC)
// =====================================================
function createEscapeMenu() {
  const style = document.createElement('style');
  style.textContent = `
    #escMenu {
      position: fixed;
      inset: 0;
      background: rgba(8, 14, 20, 0.78);
      backdrop-filter: blur(6px);
      z-index: 800;
      display: none;
      justify-content: center;
      align-items: center;
      font-family: 'Segoe UI', Arial, sans-serif;
    }
    #escMenu.active { display: flex; }

    .esc-panel {
      background: linear-gradient(160deg, #2a3a4a, #14202a);
      border: 4px solid #6b5a3e;
      border-radius: 24px;
      padding: 26px 34px 22px;
      min-width: 340px;
      max-width: 90vw;
      box-shadow: 0 14px 0 #0a1114, 0 20px 40px rgba(0,0,0,0.85);
      text-align: center;
      color: #ffeecc;
    }

    .esc-panel h2 {
      color: #ffd966;
      font-size: 32px;
      letter-spacing: 4px;
      margin: 0 0 20px;
      text-shadow: 4px 4px 0 #3a2e1e;
    }

    .esc-row {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(15, 25, 32, 0.85);
      border: 2px solid #3a4a5a;
      border-radius: 14px;
      padding: 12px 16px;
      cursor: pointer;
      user-select: none;
      transition: 0.12s;
      margin-bottom: 12px;
    }
    .esc-row:hover { border-color: #ffd966; }

    .esc-row input[type="checkbox"] {
      appearance: none;
      -webkit-appearance: none;
      width: 26px;
      height: 26px;
      border: 3px solid #6b5a3e;
      border-radius: 6px;
      background: #1a2630;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      transition: 0.12s;
    }
    .esc-row input[type="checkbox"]:checked {
      background: #ffd966;
      border-color: #ffd966;
      box-shadow: 0 0 12px rgba(255,217,102,0.7);
    }
    .esc-row input[type="checkbox"]:checked::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -55%);
      color: #1a2630;
      font-size: 20px;
      font-weight: 900;
    }

    .esc-label {
      font-size: 16px;
      font-weight: 700;
      color: #cfdde6;
      text-align: left;
      flex: 1;
      letter-spacing: 0.5px;
    }

    .esc-hint {
      margin-top: 16px;
      font-size: 13px;
      color: #8a9aaa;
      letter-spacing: 1px;
    }

        .esc-hint b {
      color: #ffd966;
    }

    /* ---------- Слайдер громкости ---------- */
    .esc-slider-row {
      cursor: default;
      flex-direction: column;
      align-items: stretch;
      gap: 8px;
      padding: 14px 16px;
    }
    .esc-slider-row:hover {
      border-color: #3a4a5a;
    }
    .esc-slider-label {
      text-align: center;
      font-size: 15px;
      color: #ffd966;
    }
    .esc-slider-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    #escMusicVol {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 8px;
      border-radius: 6px;
      background: linear-gradient(to right, #ffd966 0%, #ffd966 15%, #1a2630 15%, #1a2630 100%);
      outline: none;
      cursor: pointer;
      box-shadow: inset 0 2px 4px #000;
    }
    #escMusicVol::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ffee88, #b88832);
      border: 3px solid #5a3a1a;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.7);
    }
    #escMusicVol::-moz-range-thumb {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: radial-gradient(circle at 35% 30%, #ffee88, #b88832);
      border: 3px solid #5a3a1a;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.7);
    }
    .esc-slider-value {
      font-size: 14px;
      font-weight: 900;
      color: #ffd966;
      min-width: 44px;
      text-align: right;
      letter-spacing: 1px;
      text-shadow: 2px 2px 0 #000;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'escMenu';
    overlay.innerHTML = `
    <div class="esc-panel">
      <h2>ПАУЗА</h2>
      <label class="esc-row">
        <input type="checkbox" id="escHitboxes">
        <span class="esc-label">Показывать хитбоксы врагов</span>
      </label>
      <label class="esc-row">
        <input type="checkbox" id="escBlockMouse">
        <span class="esc-label">Блокировать мышь при выборе улучшения</span>
      </label>

      <div class="esc-row esc-slider-row">
        <span class="esc-label esc-slider-label">🎵 Громкость музыки</span>
        <div class="esc-slider-wrap">
          <input type="range" id="escMusicVol" min="0" max="100" step="1" value="15">
          <span class="esc-slider-value" id="escMusicVolVal">15%</span>
        </div>
      </div>

      <div class="esc-hint">Нажмите <b>ESC</b>, чтобы продолжить</div>
    </div>
  `;
  document.body.appendChild(overlay);

  const checkbox = document.getElementById('escHitboxes');
  const checkboxMouse = document.getElementById('escBlockMouse');
  const musicSlider = document.getElementById('escMusicVol');
  const musicSliderValue = document.getElementById('escMusicVolVal');
  let menuOpen = false;
  let savedPausedState = false;

  function updateSliderBackground(val) {
    const pct = Math.max(0, Math.min(100, val));
    musicSlider.style.background =
      `linear-gradient(to right, #ffd966 0%, #ffd966 ${pct}%, #1a2630 ${pct}%, #1a2630 100%)`;
  }

  function openMenu() {
    menuOpen = true;
    savedPausedState = paused;
    paused = true;
    checkbox.checked = debugShowHitboxes;
    checkboxMouse.checked = blockMouseOnLevelUp;
    const volPct = Math.round(bgMusicVolume * 100);
    musicSlider.value = volPct;
    musicSliderValue.textContent = volPct + '%';
    updateSliderBackground(volPct);
    overlay.classList.add('active');
  }

  function closeMenu() {
    menuOpen = false;
    overlay.classList.remove('active');
    paused = savedPausedState;
  }

    checkbox.addEventListener('change', () => {
    debugShowHitboxes = checkbox.checked;
  });

  checkboxMouse.addEventListener('change', () => {
    blockMouseOnLevelUp = checkboxMouse.checked;
    // Применяем ко всем открытым модалкам сразу
    if (overlay.classList.contains('active')) {
      if (blockMouseOnLevelUp) overlay.classList.add('no-mouse');
      else overlay.classList.remove('no-mouse');
    }
    if (weaponOverlay.classList.contains('active')) {
      if (blockMouseOnLevelUp) weaponOverlay.classList.add('no-mouse');
      else weaponOverlay.classList.remove('no-mouse');
    }
  });

    // Слайдер громкости музыки
  function applyMusicVolume(pct) {
    pct = Math.max(0, Math.min(100, pct));
    bgMusicVolume = pct / 100;
    bgMusic.volume = bgMusicVolume;
    musicSliderValue.textContent = pct + '%';
    updateSliderBackground(pct);
    try {
      localStorage.setItem('bgMusicVolume', bgMusicVolume.toString());
    } catch (e) {}
  }

  musicSlider.addEventListener('input', () => {
    applyMusicVolume(parseInt(musicSlider.value, 10));
    // Пробуждаем музыку, если пользователь ещё её не слышал —
    // двигая слайдер, он точно взаимодействует с игрой
    tryStartBgMusic();
  });

  // Клик по дорожке слайдера — обновляем значение
  musicSlider.addEventListener('change', () => {
    applyMusicVolume(parseInt(musicSlider.value, 10));
  });

  // Клик по фону — закрыть
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeMenu();
  });

  addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      e.preventDefault();
      if (menuOpen) {
        closeMenu();
      } else if (gameActive) {
        openMenu();
      }
    }
  });

  // Экспортируем для отладки
  window.__escMenu = {
    openMenu,
    closeMenu,
    isOpen: () => menuOpen,
    forceClose: () => {
      if (menuOpen) closeMenu();
    }
  };
}

// =====================================================
//  УПРАВЛЕНИЕ КАРТОЧКАМИ С КЛАВИАТУРЫ
// =====================================================
(function initCardKeyboardNav() {
  addEventListener('keydown', e => {
    // ============ МОДАЛКА ПРОКАЧКИ ============
    if (overlay.classList.contains('active') && levelUpCardElements.length > 0) {
      const c = e.code;

      if (c === 'KeyA' || c === 'ArrowLeft') {
        e.preventDefault();
        highlightLevelUpCard(levelUpSelectedIndex - 1);
        return;
      }
      if (c === 'KeyD' || c === 'ArrowRight') {
        e.preventDefault();
        highlightLevelUpCard(levelUpSelectedIndex + 1);
        return;
      }
      if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space') {
        e.preventDefault();
        const card = levelUpCardElements[levelUpSelectedIndex];
        if (card && card.onclick) card.onclick();
        return;
      }
      if (c === 'Digit1' || c === 'Digit2' || c === 'Digit3') {
        e.preventDefault();
        const num = parseInt(c.replace('Digit', ''), 10) - 1;
        if (num >= 0 && num < levelUpCardElements.length) {
          const card = levelUpCardElements[num];
          if (card && card.onclick) card.onclick();
        }
        return;
      }
      return;
    }

    // ============ МОДАЛКА ВЫБОРА ОРУЖИЯ ============
    if (weaponOverlay.classList.contains('active') && weaponCardElements.length > 0) {
      const c = e.code;

      if (c === 'KeyA' || c === 'ArrowLeft') {
        e.preventDefault();
        highlightWeaponCard(weaponSelectedIndex - 1);
        return;
      }
      if (c === 'KeyD' || c === 'ArrowRight') {
        e.preventDefault();
        highlightWeaponCard(weaponSelectedIndex + 1);
        return;
      }
      if (c === 'Enter' || c === 'NumpadEnter' || c === 'Space') {
        e.preventDefault();
        const el = weaponCardElements[weaponSelectedIndex];
        if (el && el.onclick) el.onclick();
        return;
      }
      // 1–5 — быстрое оружие по номеру
      if (c === 'Digit1' || c === 'Digit2' || c === 'Digit3' ||
          c === 'Digit4' || c === 'Digit5') {
        e.preventDefault();
        const num = parseInt(c.replace('Digit', ''), 10) - 1;
        // Длины weaponCardElements - 1 = 5 (карточек оружия), skipBtn — вне диапазона
        if (num >= 0 && num < weaponCardElements.length - 1) {
          const el = weaponCardElements[num];
          if (el && el.onclick) el.onclick();
        }
        return;
      }
      // S — пропустить
      if (c === 'KeyS') {
        e.preventDefault();
        if (skipBtn.onclick) skipBtn.onclick();
        return;
      }
      return;
    }
  });
})();

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
      <div class="row">
        <button id="cheatChangeChar" style="flex:1;">👤 Сменить персонажа</button>
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
  document.getElementById('cheatChangeChar').onclick = () => {
    // Убираем существующий оверлей, если он ещё висит
    const old = document.getElementById('charSelect');
    if (old) old.remove();
    createCharacterSelect();
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

// Запуск чит-панели и меню паузы
createCheatPanel();
createEscapeMenu();