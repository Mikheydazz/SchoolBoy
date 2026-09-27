// =====================================================
//  characters.js — персонажи игры
//  Экспортирует CHARACTERS с методами build()
// =====================================================
import * as THREE from 'three';

// =====================================================
//  ГРИФОНЯ
// =====================================================
function buildGrifonya() {
  const group = new THREE.Group();

  const skinMat     = new THREE.MeshLambertMaterial({ color: 0xf5d6a8 });
  const shirtMat    = new THREE.MeshLambertMaterial({ color: 0x4a6ea8 });
  const pantsMat    = new THREE.MeshLambertMaterial({ color: 0x3a3a5a });
  const shoeMat     = new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
  const hairMat     = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
  const backpackMat = new THREE.MeshLambertMaterial({ color: 0xb57c4a });
  const tieMat      = new THREE.MeshLambertMaterial({ color: 0xa02020 });
  const eyeMat      = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat    = new THREE.MeshBasicMaterial({ color: 0x1a0a0a });
  const glassMat    = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });

  // Торс
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 16), shirtMat);
  torso.position.y = 1.5;
  torso.scale.set(1.1, 1.15, 0.85);
  torso.castShadow = true;
  group.add(torso);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12), shirtMat);
  belly.position.set(0, 1.05, 0.35);
  belly.scale.set(1.0, 0.9, 0.9);
  belly.castShadow = true;
  group.add(belly);

  const tie = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.7, 4), tieMat);
  tie.position.set(0, 1.55, 0.95);
  tie.rotation.x = Math.PI;
  group.add(tie);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 20, 16), skinMat);
  head.position.y = 2.85;
  head.castShadow = true;
  group.add(head);

  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), skinMat);
  cheekL.position.set(-0.35, 2.75, 0.5);
  group.add(cheekL);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.35;
  group.add(cheekR);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), eyeMat);
  eyeL.position.set(-0.2, 2.95, 0.52);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.2;
  group.add(eyeR);

  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), pupilMat);
  pupilL.position.set(-0.2, 2.95, 0.62);
  group.add(pupilL);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.2;
  group.add(pupilR);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.035, 6, 12, Math.PI),
    pupilMat
  );
  mouth.position.set(0, 2.65, 0.55);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(0.64, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    hairMat
  );
  hair.position.y = 2.9;
  group.add(hair);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.5), backpackMat);
  backpack.position.set(0, 1.6, -1.05);
  backpack.castShadow = true;
  group.add(backpack);

  const backpackTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.35), backpackMat);
  backpackTop.position.set(0, 2.15, -1.0);
  group.add(backpackTop);

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
  group.add(armL, armR);

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
  group.add(legL, legR);

  // Элементы превращения
  const chin = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.3, 0.55), skinMat);
  chin.position.set(0, 2.4, 0.35);
  chin.visible = false;
  chin.castShadow = true;
  group.add(chin);

  const sunglasses = new THREE.Group();
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
  group.add(sunglasses);

  return {
    group,
    isRoller: false,
    setWalk(phase) {
      const swing = Math.sin(phase) * 0.4;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.7;
      armR.rotation.x = swing * 0.7;
      torso.position.y = 1.5 + Math.abs(Math.sin(phase)) * 0.06;
    },
    setJump(attackActive) {
      legL.rotation.x = -0.9;
      legR.rotation.x = -0.9;
      armL.rotation.x = -1.5;
      if (!attackActive) armR.rotation.x = -1.5;
      torso.position.y = 1.5;
    },
    setAttack(progress) {
      armR.rotation.x = -1.8 * progress;
    },
    applyTransform() {
      belly.visible = false;
      cheekL.visible = false;
      cheekR.visible = false;
      torso.scale.set(0.95, 1.3, 0.7);
      chin.visible = true;
      sunglasses.visible = true;
    },
    revertTransform() {
      belly.visible = true;
      cheekL.visible = true;
      cheekR.visible = true;
      torso.scale.set(1.1, 1.15, 0.85);
      chin.visible = false;
      sunglasses.visible = false;
    },
  };
}

// =====================================================
//  КОЛОБОК
// =====================================================
function buildKolobok() {
  const group = new THREE.Group();

  // Внутренний контейнер для быстрого вращения (атака)
  const spinGroup = new THREE.Group();
  group.add(spinGroup);

  const doughMat    = new THREE.MeshLambertMaterial({ color: 0xd9a25a });
  const crustMat    = new THREE.MeshLambertMaterial({ color: 0xb07830 });
  const eyeMat      = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat    = new THREE.MeshBasicMaterial({ color: 0x1a0a0a });
  const glassMat    = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });
  const mustacheMat = new THREE.MeshLambertMaterial({ color: 0x2a1a0a });

  const bodyRadius = 1.15;
  const bodyY = 1.2;

  const body = new THREE.Mesh(new THREE.SphereGeometry(bodyRadius, 24, 18), doughMat);
  body.position.y = bodyY;
  body.castShadow = true;
  spinGroup.add(body);

  // Группа для визуального катания — крапинки на поверхности
  const rollGroup = new THREE.Group();
  rollGroup.position.y = bodyY;
  spinGroup.add(rollGroup);

  // Крапинки распределены по сфере (фибоначчи)
  const spotCount = 12;
  for (let i = 0; i < spotCount; i++) {
    const yy = 1 - (i / (spotCount - 1)) * 2;
    const radAtY = Math.sqrt(Math.max(0, 1 - yy * yy));
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const sx = Math.cos(theta) * radAtY;
    const sz = Math.sin(theta) * radAtY;

    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), crustMat);
    spot.position.set(sx * bodyRadius, yy * bodyRadius, sz * bodyRadius);
    spot.scale.setScalar(0.7 + Math.random() * 0.5);
    rollGroup.add(spot);
  }

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), eyeMat);
  eyeL.position.set(-0.32, bodyY + 0.15, bodyRadius * 0.9);
  spinGroup.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.32;
  spinGroup.add(eyeR);

  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), pupilMat);
  pupilL.position.set(-0.32, bodyY + 0.15, bodyRadius * 0.98);
  spinGroup.add(pupilL);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.32;
  spinGroup.add(pupilR);

  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xff8080, transparent: true, opacity: 0.55 });
  const cheekGeo = new THREE.CircleGeometry(0.2, 12);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.6, bodyY - 0.15, bodyRadius * 0.82);
  cheekL.lookAt(-1.8, bodyY - 0.15, bodyRadius * 2.5);
  spinGroup.add(cheekL);
  const cheekR = cheekL.clone();
  cheekR.position.x = 0.6;
  cheekR.lookAt(1.8, bodyY - 0.15, bodyRadius * 2.5);
  spinGroup.add(cheekR);

  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.035, 6, 14, Math.PI),
    pupilMat
  );
  mouth.position.set(0, bodyY - 0.12, bodyRadius * 0.95);
  mouth.rotation.z = Math.PI;
  spinGroup.add(mouth);

  // Очки (превращение)
  const sunglasses = new THREE.Group();
  const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.24, 0.05), glassMat);
  lensL.position.set(-0.32, bodyY + 0.15, bodyRadius * 1.05);
  sunglasses.add(lensL);
  const lensR = lensL.clone();
  lensR.position.x = 0.32;
  sunglasses.add(lensR);
  const gb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.05), glassMat);
  gb.position.set(0, bodyY + 0.15, bodyRadius * 1.05);
  sunglasses.add(gb);
  sunglasses.visible = false;
  spinGroup.add(sunglasses);

  // Усы (превращение)
  const mustache = new THREE.Group();
  const mL = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.1, 0.1), mustacheMat);
  mL.position.set(-0.2, bodyY - 0.4, bodyRadius * 0.98);
  mL.rotation.z = 0.2;
  mustache.add(mL);
  const mR = mL.clone();
  mR.position.x = 0.2;
  mR.rotation.z = -0.2;
  mustache.add(mR);
  mustache.visible = false;
  spinGroup.add(mustache);

  return {
    group,
    isRoller: true,
    setWalk(phase, moving) {
      // Затухание спина при простое
      if (!moving && Math.abs(spinGroup.rotation.y) > 0.01) {
        spinGroup.rotation.y *= 0.8;
      }
      if (moving) {
        body.position.y = bodyY + Math.abs(Math.sin(phase)) * 0.1;
        rollGroup.position.y = body.position.y;
        rollGroup.rotation.x += 0.22;   // катимся
      } else {
        const t = performance.now() * 0.002;
        body.position.y = bodyY + Math.sin(t) * 0.05;
        rollGroup.position.y = body.position.y;
      }
      body.scale.set(1, 1, 1);
    },
    setJump() {
      body.position.y = bodyY;
      rollGroup.position.y = bodyY;
      rollGroup.rotation.x += 0.45;   // крутимся в воздухе
      body.scale.set(1, 1, 1);
    },
    setAttack(progress) {
      spinGroup.rotation.y += 0.7;    // быстрое вращение
      const squash = 1 + progress * 0.2;
      body.scale.set(squash, 2 - squash, squash);
    },
    applyTransform() {
      sunglasses.visible = true;
      mustache.visible = true;
      body.material.color.setHex(0xe8b878);
    },
    revertTransform() {
      sunglasses.visible = false;
      mustache.visible = false;
      body.material.color.setHex(0xd9a25a);
    },
  };
}

// =====================================================
//  ШИШКУН — высокий худой смуглый школьник
// =====================================================
function buildShishkun() {
  const group = new THREE.Group();

  const skinMat  = new THREE.MeshLambertMaterial({ color: 0x8a5a3a });    // смуглая кожа
  const shirtMat = new THREE.MeshLambertMaterial({ color: 0xd8d8e0 });    // светлая рубашка
  const vestMat  = new THREE.MeshLambertMaterial({ color: 0x3a2e22 });    // тёмный жилет
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x2a2a3a });
  const shoeMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const hairMat  = new THREE.MeshLambertMaterial({ color: 0x1a0e08 });    // чёрные волосы
  const tieMat   = new THREE.MeshLambertMaterial({ color: 0x2a4a8a });
  const eyeMat   = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a0a0a });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });

  // ===== Ноги — длинные, тонкие =====
  function makeLeg(side) {
    const leg = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 6, 12), pantsMat);
    thigh.position.y = -0.5;
    thigh.castShadow = true;
    leg.add(thigh);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.5), shoeMat);
    shoe.position.set(0, -1.05, 0.1);
    shoe.castShadow = true;
    leg.add(shoe);

    leg.position.set(side * 0.24, 1.1, 0);
    return leg;
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  group.add(legL, legR);

  // ===== Торс — тонкий, вытянутый =====
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.85, 8, 14), shirtMat);
  torso.position.y = 1.85;
  torso.scale.set(0.82, 1.0, 0.65);
  torso.castShadow = true;
  group.add(torso);

  // Жилет
  const vest = new THREE.Mesh(new THREE.CapsuleGeometry(0.41, 0.75, 8, 14), vestMat);
  vest.position.y = 1.85;
  vest.scale.set(0.85, 1.0, 0.68);
  vest.castShadow = true;
  group.add(vest);

  // Галстук
  const tie = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 4), tieMat);
  tie.position.set(0, 1.85, 0.32);
  tie.rotation.x = Math.PI;
  group.add(tie);

  // ===== Шея =====
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.22, 10), skinMat);
  neck.position.y = 2.5;
  group.add(neck);

  // ===== Голова =====
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 16), skinMat);
  head.position.y = 2.9;
  head.scale.set(0.95, 1.05, 0.95);
  head.castShadow = true;
  group.add(head);

  // =====================================================
  //  ПЫШНОЕ КАРЕ КОРИЧНЕВОГО ЦВЕТА (открытое лицо)
  // =====================================================
  const hairBrownMat = new THREE.MeshLambertMaterial({ color: 0x6b3a1a });
  const hairBrownLightMat = new THREE.MeshLambertMaterial({ color: 0x8a4e28 });
  const hairBrownDarkMat  = new THREE.MeshLambertMaterial({ color: 0x4a2810 });

  // --- Верхний купол: только верхняя полусфера, сдвинут назад ---
  // thetaLength = 90° — купол не спускается ниже «экватора» головы,
  // лицо полностью открыто.
  const hairTop = new THREE.Mesh(
    new THREE.SphereGeometry(0.52, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.5),
    hairBrownMat
  );
  hairTop.position.set(0, 2.98, -0.08);
  hairTop.scale.set(1.02, 1.05, 1.05);
  hairTop.castShadow = true;
  group.add(hairTop);

  // --- Задний объём каре: пышный «хвост» сзади ---
  const hairBack = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 20, 16),
    hairBrownMat
  );
  hairBack.position.set(0, 2.78, -0.22);
  hairBack.scale.set(1.05, 1.25, 0.85);
  hairBack.castShadow = true;
  group.add(hairBack);

  // --- Боковые объёмы по бокам головы, чуть назад ---
  const sideVolumeR = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 14, 12),
    hairBrownMat
  );
  sideVolumeR.position.set(0.42, 2.78, -0.1);
  sideVolumeR.scale.set(0.85, 1.15, 1.0);
  group.add(sideVolumeR);

  const sideVolumeL = new THREE.Mesh(
    new THREE.SphereGeometry(0.26, 14, 12),
    hairBrownMat
  );
  sideVolumeL.position.set(-0.42, 2.78, -0.1);
  sideVolumeL.scale.set(0.85, 1.15, 1.0);
  group.add(sideVolumeL);

  // --- Правая боковая прядь (до подбородка) ---
  // Держим её сбоку, ближе к уху, чтобы не закрывала щёку
  const hairSideR = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.16, 0.5, 8, 12),
    hairBrownMat
  );
  hairSideR.position.set(0.44, 2.55, -0.05);
  hairSideR.rotation.z = 0.12;
  hairSideR.castShadow = true;
  group.add(hairSideR);

  const hairSideRTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    hairBrownLightMat
  );
  hairSideRTip.position.set(0.46, 2.2, -0.03);
  hairSideRTip.scale.set(1.0, 1.3, 1.0);
  group.add(hairSideRTip);

  // --- Левая боковая прядь ---
  const hairSideL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.16, 0.5, 8, 12),
    hairBrownMat
  );
  hairSideL.position.set(-0.44, 2.55, -0.05);
  hairSideL.rotation.z = -0.12;
  hairSideL.castShadow = true;
  group.add(hairSideL);

  const hairSideLTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    hairBrownLightMat
  );
  hairSideLTip.position.set(-0.46, 2.2, -0.03);
  hairSideLTip.scale.set(1.0, 1.3, 1.0);
  group.add(hairSideLTip);

  // --- Чёлка: три небольшие пряди, лежащие на лбу ---
  // Держим их ВЫШЕ глаз (y ≈ 3.15) и почти не выдвигаем вперёд (z ≈ 0.3),
  // чтобы не перекрывать обзор.
  const bangMat = hairBrownLightMat;

  const bang1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    bangMat
  );
  bang1.position.set(-0.2, 3.18, 0.28);
  bang1.scale.set(1.0, 0.9, 0.55);
  bang1.rotation.z = 0.2;
  group.add(bang1);

  const bang2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 10),
    bangMat
  );
  bang2.position.set(0.02, 3.22, 0.3);
  bang2.scale.set(1.05, 0.85, 0.55);
  bang2.rotation.z = -0.06;
  group.add(bang2);

  const bang3 = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    bangMat
  );
  bang3.position.set(0.24, 3.18, 0.28);
  bang3.scale.set(1.0, 0.9, 0.55);
  bang3.rotation.z = -0.2;
  group.add(bang3);

  // --- Тёмная «подложка» — только сзади и по бокам, не на лице ---
  const hairShadow = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 12, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.3),
    hairBrownDarkMat
  );
  hairShadow.position.set(0, 2.9, -0.06);
  hairShadow.scale.set(1.03, 1.0, 1.02);
  group.add(hairShadow);

  // Глаза
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), eyeMat);
  eyeL.position.set(-0.15, 2.95, 0.38);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.15;
  group.add(eyeR);

  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), pupilMat);
  pupilL.position.set(-0.15, 2.95, 0.46);
  group.add(pupilL);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.15;
  group.add(pupilR);

  // Тонкие брови
  const browMat = new THREE.MeshBasicMaterial({ color: 0x0a0504 });
  const browL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.03), browMat);
  browL.position.set(-0.15, 3.08, 0.38);
  group.add(browL);
  const browR = browL.clone();
  browR.position.x = 0.15;
  group.add(browR);

  // Рот
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.02, 6, 12, Math.PI),
    pupilMat
  );
  mouth.position.set(0, 2.72, 0.38);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  // ===== Руки — длинные, тонкие =====
  function makeArm(side) {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.85, 6, 12), shirtMat);
    upper.position.y = -0.45;
    upper.castShadow = true;
    arm.add(upper);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skinMat);
    hand.position.y = -1.0;
    hand.castShadow = true;
    arm.add(hand);

    arm.position.set(side * 0.5, 2.2, 0);
    arm.rotation.z = side * 0.06;
    return arm;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);
  group.add(armL, armR);

  // ===== Элементы превращения от молота =====
  const glasses = new THREE.Group();
  const lensL = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.16, 0.05), glassMat);
  lensL.position.set(-0.15, 2.95, 0.42);
  glasses.add(lensL);
  const lensR = lensL.clone();
  lensR.position.x = 0.15;
  glasses.add(lensR);
  const gbridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.05), glassMat);
  gbridge.position.set(0, 2.95, 0.42);
  glasses.add(gbridge);
  const garmL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.4), glassMat);
  garmL.position.set(-0.29, 2.95, 0.25);
  glasses.add(garmL);
  const garmR = garmL.clone();
  garmR.position.x = 0.29;
  glasses.add(garmR);
  glasses.visible = false;
  group.add(glasses);

  // Медаль на груди
  const medal = new THREE.Mesh(
    new THREE.CircleGeometry(0.1, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd966 })
  );
  medal.position.set(-0.25, 2.05, 0.28);
  medal.visible = false;
  group.add(medal);
  const medalRibbon = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.14, 0.03),
    new THREE.MeshLambertMaterial({ color: 0xa02020 })
  );
  medalRibbon.position.set(-0.25, 2.15, 0.28);
  medalRibbon.visible = false;
  group.add(medalRibbon);

  // Усики
  const mustache = new THREE.Group();
  const mL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), hairMat);
  mL.position.set(-0.12, 2.78, 0.42);
  mL.rotation.z = 0.2;
  mustache.add(mL);
  const mR = mL.clone();
  mR.position.x = 0.12;
  mR.rotation.z = -0.2;
  mustache.add(mR);
  mustache.visible = false;
  group.add(mustache);

  return {
    group,
    isRoller: false,
    doubleSector: true,
    setWalk(phase) {
      const swing = Math.sin(phase) * 0.45;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.8;
      armL.rotation.z = -0.06;
      armR.rotation.x = swing * 0.8;
      armR.rotation.z = 0.06;
      torso.position.y = 1.85 + Math.abs(Math.sin(phase)) * 0.06;
      vest.position.y = 1.85 + Math.abs(Math.sin(phase)) * 0.06;
    },
    setJump(attackActive) {
      legL.rotation.x = -0.95;
      legR.rotation.x = -0.95;
      armL.rotation.x = -1.6;
      if (!attackActive) armR.rotation.x = -1.6;
      torso.position.y = 1.85;
      vest.position.y = 1.85;
    },
    setAttack(progress) {
      // Руки разлетаются в стороны, как будто рвёт воздух на две стороны
      armL.rotation.x = -0.7 * progress;
      armL.rotation.z = -0.06 - 0.7 * progress;
      armR.rotation.x = -0.7 * progress;
      armR.rotation.z = 0.06 + 0.7 * progress;
    },
    applyTransform() {
      glasses.visible = true;
      mustache.visible = true;
      medal.visible = true;
      medalRibbon.visible = true;
      torso.scale.set(0.95, 1.05, 0.72);
      vest.scale.set(0.97, 1.05, 0.74);
    },
    revertTransform() {
      glasses.visible = false;
      mustache.visible = false;
      medal.visible = false;
      medalRibbon.visible = false;
      torso.scale.set(0.82, 1.0, 0.65);
      vest.scale.set(0.85, 1.0, 0.68);
    },
  };
}

// =====================================================
//  РЕЕСТР ПЕРСОНАЖЕЙ
// =====================================================
export const CHARACTERS = [
  {
    id: 'grifonya',
    name: 'Грифоня',
    emoji: '🎒',
    desc: 'Полный школьник с рюкзаком. Крепкий, но не самый быстрый.',
    stats: {
      maxHp: 100,
      speed: 8,
      damage: 8,
      radius: 3.0,
      cooldown: 700,
      jumpCooldown: 2000,
      regen: 0,
      magnet: 2.5,
    },
    build: buildGrifonya,
  },
  {
    id: 'kolobok',
    name: 'Колобок',
    emoji: '🥯',
    desc: 'Катится — быстрее всех. Атака: вращение с ударной волной по сектору.',
    stats: {
      maxHp: 185,
      speed: 11,
      damage: 7,
      radius: 3.2,
      cooldown: 600,
      jumpCooldown: 1800,
      regen: 0,
      magnet: 2.5,
    },
    build: buildKolobok,
  },
  {
    id: 'shishkun',
    name: 'Шишкун',
    emoji: '🎓',
    desc: 'Высокий худой смуглый школьник. Атакует сразу двумя секторами — узкими и точными.',
    stats: {
      maxHp: 90,
      speed: 9,
      damage: 8,
      radius: 3.0,
      cooldown: 650,
      regen: 0,
      magnet: 2.5,
    },
    build: buildShishkun,
  },
];