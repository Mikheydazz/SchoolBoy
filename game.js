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
const BUFF_ZONE_INTERVAL = 60000;
const BUFF_ZONE_LIFETIME = 60;
const RESCUE_ZONE_LIFETIME = 60;

const zones = [];
let lastBuffZoneSpawn = 0;
let nextRescueLevel = 4;

// =====================================================
//  БОСС
// =====================================================
const BOSS_TIMER = 90;             // 1.5 минуты на убийство
const BOSS_FIRE_INTERVAL = 1.2;    // как часто босс стреляет
const BOSS_PROJ_SPEED = 12;
const BOSS_PROJ_DAMAGE = 25;
const BOSS_CONTACT_RADIUS = 4.5;   // босс наносит контактный урон в этом радиусе

const boss = {
  active: false,
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
let nextBossLevel = 10;    // 10, 20, 30...

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
    desc: 'Крутится вокруг Грифони. С каждым уровнем — больше радиус, быстрее вращение и шире зона урона.',
    color: 0x8a5a2a,
    maxLevel: 5,
    orbitRadius: [4.5, 5.5, 6.5, 7.5, 9.0],
    dotDamage:   [55, 85, 120, 165, 220],
    rotateSpeed: [3.2, 3.8, 4.4, 5.0, 5.8],
    hitRadius:   [1.8, 2.1, 2.4, 2.7, 3.2],
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
];

const equippedWeapons = {};

const weaponTimers = {
  pen: 0,
  bag: 0,
  ruler: 0,
  slingshot: 0,
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
}

function updateWeaponHud() {
  const info = document.getElementById('weaponInfo');
  const list = [];
  for (const w of WEAPONS) {
    if (equippedWeapons[w.id]) {
      list.push(`${w.ico}${equippedWeapons[w.id].level}`);
    }
  }
  info.textContent = list.length ? list.join(' ') : '—';
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

  // МЕШОК
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

    const visualScale = 0.85 + (hitR - 1.8) * 0.35;
    bagMesh.scale.setScalar(visualScale);

    const angularHalfWidth = 0.55 + Math.max(0, hitR - 1.0) * 0.13;
    const maxReach = r + hitR + 1.2;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (e.dying) continue;

      const dx = e.x - hero.x;
      const dz = e.z - hero.z;
      const eDist = Math.hypot(dx, dz);
      const eAngle = Math.atan2(dz, dx);

      let angleDiff = Math.abs(eAngle - bagAngle);
      angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

      if (angleDiff < angularHalfWidth && eDist < maxReach + e.r) {
        e.hp -= dps * dt;
        if (e.hp <= 0) killEnemy(e, i);
      }
    }
    // Мешок бьёт босса
    if (boss.active) {
      const dx = boss.x - hero.x;
      const dz = boss.z - hero.z;
      const eDist = Math.hypot(dx, dz);
      const eAngle = Math.atan2(dz, dx);
      let angleDiff = Math.abs(eAngle - bagAngle);
      angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
      if (angleDiff < angularHalfWidth && eDist < maxReach + boss.r) {
        damageBoss(dps * dt);
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
}

function killEnemy(e, idx) {
  if (e.dying) return;
  e.dying = true;
  e.dyingTimer = 0.25;
  score += 10;
  kills++;
  spawnXPOrb(e.x, e.z, e.xpValue);
  burst(e.x, e.z, e.type.color);
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

function makeBossMesh() {
  const group = new THREE.Group();
  const W = 4.5, H = 5.5, D = 1.2;

  const pagesMat = new THREE.MeshLambertMaterial({ color: 0xe0e8c0 });
  const pages = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, H * 0.96, D * 0.9), pagesMat);
  pages.castShadow = true;
  group.add(pages);

  const coverMat = new THREE.MeshLambertMaterial({ map: makeBossCoverTexture() });
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(W, H), coverMat);
  cover.position.z = D / 2 + 0.001;
  cover.castShadow = true;
  group.add(cover);

  const backMat = new THREE.MeshLambertMaterial({ color: 0x6b1a8a });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), backMat);
  back.position.z = -D / 2 - 0.001;
  back.rotation.y = Math.PI;
  group.add(back);

  const spineMat = new THREE.MeshLambertMaterial({ color: 0x4a0a6a });
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.35, H, D * 0.95), spineMat);
  spine.position.x = -W / 2;
  spine.castShadow = true;
  group.add(spine);

  // Красные глаза
  const eyeM = new THREE.MeshBasicMaterial({ color: 0xff3030 });
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

  // Злые брови
  const browMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.1), browMat);
  browL.position.set(-1.05, 1.65, D / 2 + 0.05);
  browL.rotation.z = 0.4;
  group.add(browL);
  const browR = browL.clone();
  browR.position.x = 1.05;
  browR.rotation.z = -0.4;
  group.add(browR);

  // Злой рот
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.65, 0.14, 6, 12, Math.PI),
    browMat
  );
  mouth.position.set(0, -1.2, D / 2 + 0.05);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  // Зубы
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

  const maxHp = 5000 + level * 250;

  const angle = Math.random() * Math.PI * 2;
  const dist = 32;
  const x = hero.x + Math.cos(angle) * dist;
  const z = hero.z + Math.sin(angle) * dist;

  const mesh = makeBossMesh();
  mesh.position.set(x, 2.6, z);
  scene.add(mesh);

  const aura = makeBossAura();
  aura.position.set(x, 0, z);
  scene.add(aura);

  boss.active = true;
  boss.mesh = mesh;
  boss.aura = aura;
  boss.x = x;
  boss.z = z;
  boss.hp = maxHp;
  boss.maxHp = maxHp;
  boss.r = 3.5;
  boss.speed = 2.8;
  boss.contactDamage = 80 + level * 3;
  boss.timeLeft = BOSS_TIMER;
  boss.attackTimer = 1.5;

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

  // Время вышло — герой погибает
  if (boss.timeLeft <= 0) {
    hp = 0;
    gameActive = false;
    updateHud();
    document.getElementById('bossHud').classList.remove('active');
    showGameOver('Химия победила — вы не успели её убить за 1:30');
    return;
  }

  // Движение к герою
  const dx = hero.x - boss.x;
  const dz = hero.z - boss.z;
  const d = Math.hypot(dx, dz) || 1;

  if (d > 5.5) {
    boss.x += (dx / d) * boss.speed * dt;
    boss.z += (dz / d) * boss.speed * dt;
  }

  // Позиционирование меша
  const bob = Math.sin(performance.now() * 0.003) * 0.35;
  boss.mesh.position.set(boss.x, 2.6 + bob, boss.z);
  boss.mesh.lookAt(hero.x, 2.6 + bob, hero.z);

  boss.aura.position.set(boss.x, 0, boss.z);
  boss.aura.rotation.y += dt * 1.4;

  // Стрельба
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

  // Не спавним бафф-зону во время боя с боссом
  if (!boss.active && now - lastBuffZoneSpawn > BUFF_ZONE_INTERVAL &&
      !zones.some(z => z.type === 'buff')) {
    spawnBuffZone();
    lastBuffZoneSpawn = now;
  }

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
  if (c === 'ShiftLeft' || c === 'ShiftRight') keys.shift = 1;
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

function spawnEnemy() {
  const tier = Math.min(1 + Math.floor(level / 3), 5);

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

  let x, z, attempts = 0;
  do {
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 10;
    x = hero.x + Math.cos(angle) * dist;
    z = hero.z + Math.sin(angle) * dist;
    attempts++;
  } while (attempts < 10 && isInsideHouse(x, z, 1.5));

  const mesh = makeBookMesh(type);
  mesh.position.set(x, 0.9, z);
  scene.add(mesh);

  const maxHp = 12 + tier * 12;
  enemies.push({
    mesh, x, z,
    type,
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
  hero.attackTimer = 0.18;

  let nearest = null, nd = Infinity;
  for (const e of enemies) {
    if (e.dying) continue;
    const d = Math.hypot(e.x - hero.x, e.z - hero.z);
    if (d < nd) { nd = d; nearest = e; }
  }
  // Босс имеет приоритет, если он ближе
  if (boss.active) {
    const bd = Math.hypot(boss.x - hero.x, boss.z - hero.z);
    if (bd < nd) {
      nd = bd;
      nearest = { x: boss.x, z: boss.z, isBoss: true };
    }
  }

  if (nearest) {
    hero.attackAngle = Math.atan2(nearest.z - hero.z, nearest.x - hero.x);
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.dying) continue;

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

  // Проверка попадания по боссу
  if (boss.active) {
    const dx = boss.x - hero.x;
    const dz = boss.z - hero.z;
    const dist = Math.hypot(dx, dz);
    if (dist < stats.radius + boss.r) {
      let diff = Math.abs(Math.atan2(dz, dx) - hero.attackAngle);
      diff = Math.min(diff, Math.PI * 2 - diff);
      if (diff > 1.15) {
        // не попал
      } else {
        damageBoss(stats.damage);
      }
    }
  }
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

    // Спавн босса каждые 10 уровней
    if (level >= nextBossLevel && !boss.active) {
      nextBossLevel += 10;
      spawnBoss();
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
];

let jumpCooldownBonus = 0;

const overlay = document.getElementById('levelup');
const cardsEl = document.getElementById('cards');

function openLevelUp() {
  paused = true;
  overlay.classList.add('active');
  const pool = [...UPGRADES];
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

  if (keys.shift && !hero.isJumping && hero.jumpCooldown <= 0 && gameActive && !paused) {
    hero.isJumping = true;
    hero.jumpTimer = JUMP_DURATION;
    hero.jumpCooldown = Math.max(600, JUMP_COOLDOWN - jumpCooldownBonus);
    keys.shift = 0;
  }

  if (hero.isJumping) {
    hero.jumpTimer -= dt;
    const progress = 1 - (hero.jumpTimer / JUMP_DURATION);
    hero.height = Math.sin(progress * Math.PI) * JUMP_HEIGHT;

    if (hero.jumpTimer <= 0) {
      hero.isJumping = false;
      hero.height = 0;
    }
  } else {
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
    mmCtx.arc(p.x, p.y, 2.6, 0, Math.PI * 2);
    mmCtx.fillStyle = '#' + e.type.color.toString(16).padStart(6, '0');
    mmCtx.fill();
    mmCtx.strokeStyle = 'rgba(0,0,0,0.6)';
    mmCtx.lineWidth = 1;
    mmCtx.stroke();
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
    if (keys.w || keys.up) mz -= 1;
    if (keys.s || keys.down) mz += 1;
    if (keys.a || keys.left) mx -= 1;
    if (keys.d || keys.right) mx += 1;

    if (mx || mz) {
      const l = Math.hypot(mx, mz);
      const nx = hero.x + (mx / l) * stats.speed * dt;
      const nz = hero.z + (mz / l) * stats.speed * dt;

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

    useWeapons(dt);
    updateXpOrbs(dt);

    updateZones(dt);
    updateZoneHUD();

    // БОСС
    updateBoss(dt);
    updateBossProjectiles(dt);

    // Враги
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.wobble += dt * 6;

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

      e.mesh.position.set(e.x, 1.0 + Math.sin(e.wobble) * 0.12, e.z);
      e.mesh.rotation.z = Math.sin(e.wobble * 0.7) * 0.12;
      e.mesh.rotation.y = Math.atan2(hero.x - e.x, hero.z - e.z);

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

      if (d < 1.3 && hero.height < JUMP_SAFE_HEIGHT) {
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
    const interval = Math.max(0.3, (1.1 - level * 0.04)) * spawnMultiplier;
    if (spawnTimer > interval) {
      spawnTimer = 0;
      const count = boss.active ? 1 : (1 + Math.floor(level / 4));
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
  nextBossLevel = 10;
  jumpCooldownBonus = 0;
  lastBuffZoneSpawn = performance.now();

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
  weaponTimers.pen = 0;
  weaponTimers.ruler = 0;
  weaponTimers.slingshot = 0;
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