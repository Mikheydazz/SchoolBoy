// =====================================================
//  characters.js — персонажи игры
//  Экспортирует CHARACTERS с методами build()
// =====================================================
import * as THREE from 'three';

// =====================================================
//  ПРОЦЕДУРНАЯ ТЕКСТУРА ТКАНИ (для пионерской формы)
// =====================================================
function makeFabricTexture(baseColor, accentColor, density) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const g = c.getContext('2d');

  // Основа
  g.fillStyle = baseColor;
  g.fillRect(0, 0, 128, 128);

  // Тонкая сетка нитей
  const step = density || 4;
  g.strokeStyle = accentColor;
  g.lineWidth = 1;
  g.globalAlpha = 0.18;
  for (let i = 0; i < 128; i += step) {
    g.beginPath();
    g.moveTo(0, i);
    g.lineTo(128, i);
    g.stroke();
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, 128);
    g.stroke();
  }

  // Лёгкий шум — «мятость» ткани
  g.globalAlpha = 0.07;
  for (let i = 0; i < 500; i++) {
    g.fillStyle = Math.random() < 0.5 ? '#000' : '#fff';
    g.fillRect(Math.random() * 128, Math.random() * 128, 1, 1);
  }

  // Тонкие диагональные штрихи — более заметная фактура
  g.globalAlpha = 0.05;
  g.strokeStyle = accentColor;
  g.lineWidth = 0.6;
  for (let i = -128; i < 128; i += 6) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + 128, 128);
    g.stroke();
  }

  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// =====================================================
//  ГРИФОНЯ
// =====================================================
function buildGrifonya(skinId) {
  const isAfterSchool = skinId === 'after_school';
  const isPioneer     = skinId === 'pioneer';
  const group = new THREE.Group();

  // Тканевые текстуры для пионера
  const pioneerShirtTex = isPioneer
    ? makeFabricTexture('#cfc8b8', '#7a7060', 4)
    : null;
  const pioneerPantsTex = isPioneer
    ? makeFabricTexture('#1e2a44', '#0a1228', 5)
    : null;

  const skinMat     = new THREE.MeshLambertMaterial({ color: 0xf5d6a8 });
  const shirtMat    = isAfterSchool
    ? new THREE.MeshLambertMaterial({ color: 0xffffff })   // белая майка
    : isPioneer
      ? new THREE.MeshLambertMaterial({
          color: 0xcfc8b8,           // чуть темнее и теплее белого
          map: pioneerShirtTex,
        })
      : new THREE.MeshLambertMaterial({ color: 0x4a6ea8 });
  const pantsMat    = isAfterSchool
    ? new THREE.MeshLambertMaterial({ color: 0xd97a2a })   // оранжевые шорты
    : isPioneer
      ? new THREE.MeshLambertMaterial({
          color: 0x1e2a44,           // насыщенный тёмно-синий
          map: pioneerPantsTex,
        })
      : new THREE.MeshLambertMaterial({ color: 0x3a3a5a });
  const shoeMat     = isAfterSchool
    ? new THREE.MeshLambertMaterial({ color: 0x8a5a2a })   // тапочки
    : new THREE.MeshLambertMaterial({ color: 0x2a2a1a });
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

  // Галстук: у «После школы» его нет,
  // у базового — короткий, у «Пионера» — длинный красный
  if (!isAfterSchool) {
    const tieLength = isPioneer ? 0.95 : 0.7;
    const tieWidth  = isPioneer ? 0.16 : 0.12;

    // У пионера — плотная ткань галстука, чуть темнее базового красного
    const tieMatFinal = isPioneer
      ? new THREE.MeshLambertMaterial({
          color: 0x8a1818,
          map: makeFabricTexture('#8a1818', '#3a0808', 3),
        })
      : tieMat;

    const tie = new THREE.Mesh(
      new THREE.ConeGeometry(tieWidth, tieLength, 4),
      tieMatFinal
    );
    tie.position.set(0, isPioneer ? 1.45 : 1.55, 0.95);
    tie.rotation.x = Math.PI;
    group.add(tie);

    // Узелок галстука (маленький кубик сверху)
    if (isPioneer) {
      const knot = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), tieMatFinal);
      knot.position.set(0, 1.92, 0.95);
      group.add(knot);
    }
  }

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
  // У пионера волосы скрыты пилоткой — оставляем, но сверху будет пилотка
  group.add(hair);

  // Пионерская пилотка
  if (isPioneer) {
    const capTex  = makeFabricTexture('#c8a868', '#8a7048', 4);
    const bandTex = makeFabricTexture('#a8884a', '#6a5028', 3);
    const capMat  = new THREE.MeshLambertMaterial({
      color: 0xc8a868,           // темнее, чем было (0xe8c88a)
      map: capTex,
    });
    const bandMat = new THREE.MeshLambertMaterial({
      color: 0xa8884a,
      map: bandTex,
    });
    const starMat = new THREE.MeshBasicMaterial({ color: 0xc01010 });

    // Основной корпус пилотки — сплюснутая пирамида
    const capBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.55, 0.35, 6),
      capMat
    );
    capBody.position.y = 3.42;
    capBody.rotation.y = Math.PI / 6;
    capBody.castShadow = true;
    group.add(capBody);

    // Окантовка снизу
    const capBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.7, 0.08, 6),
      bandMat
    );
    capBand.position.y = 3.26;
    capBand.rotation.y = Math.PI / 6;
    group.add(capBand);

    // Маленькая красная звезда спереди
    const starShape = new THREE.Shape();
    const outerR = 0.11;
    const innerR = 0.045;
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 === 0) ? outerR : innerR;
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeo = new THREE.ShapeGeometry(starShape);
    const frontStar = new THREE.Mesh(starGeo, starMat);
    frontStar.position.set(0, 3.4, 0.55);
    frontStar.scale.set(1.4, 1.4, 1.4);
    group.add(frontStar);

    // Кисточка сбоку? У пилотки нет кисточки, добавлять не будем.
  }

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.5), backpackMat);
  backpack.position.set(0, 1.6, -1.05);
  backpack.castShadow = true;
  group.add(backpack);

  const backpackTop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.35), backpackMat);
  backpackTop.position.set(0, 2.15, -1.0);
  group.add(backpackTop);

  // Красная звезда на рюкзаке у пионера
  if (isPioneer) {
    const starMat = new THREE.MeshBasicMaterial({ color: 0xd02020 });
    const starGroup = new THREE.Group();
    // Пятиконечная звезда из двух треугольников + верхний луч
    // Проще всего — сделать звезду из 5 плоских треугольников,
    // но это громоздко. Используем простую форму: круг с 5 зубцами
    // через ExtrudeGeometry. Ещё проще — плоский Shape.
    const starShape = new THREE.Shape();
    const outerR = 0.22;
    const innerR = 0.09;
    for (let i = 0; i < 10; i++) {
      const r = (i % 2 === 0) ? outerR : innerR;
      const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(x, y);
      else starShape.lineTo(x, y);
    }
    starShape.closePath();
    const starGeo = new THREE.ShapeGeometry(starShape);
    const star = new THREE.Mesh(starGeo, starMat);
    star.position.set(0, 1.55, -1.31);   // на задней стенке рюкзака
    star.rotation.y = Math.PI;            // лицом назад
    star.scale.set(1.3, 1.3, 1.3);
    group.add(star);
  }

  function makeArm(side) {
    const arm = new THREE.Group();
    // На скине «После школы» рукава нет — рука голая от плеча
    const sleeveMat = isAfterSchool ? skinMat : shirtMat;
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.7, 6, 12), sleeveMat);
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
function buildShishkun(skinId) {
  const isSochi = skinId === 'sochi_2014';
  const group = new THREE.Group();

  const skinMat  = new THREE.MeshLambertMaterial({ color: 0x8a5a3a });    // смуглая кожа
  const shirtMat = isSochi
    ? new THREE.MeshLambertMaterial({ color: 0x8a5a3a })                  // на скине торс голый
    : new THREE.MeshLambertMaterial({ color: 0xd8d8e0 });
  const vestMat  = isSochi
    ? new THREE.MeshLambertMaterial({ color: 0x8a5a3a })
    : new THREE.MeshLambertMaterial({ color: 0x3a2e22 });
  const pantsMat = isSochi
    ? new THREE.MeshLambertMaterial({ color: 0xd02020 })                  // красные плавки
    : new THREE.MeshLambertMaterial({ color: 0x2a2a3a });
  const shoeMat  = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const hairMat  = new THREE.MeshLambertMaterial({ color: 0x1a0e08 });
  const tieMat   = new THREE.MeshLambertMaterial({ color: 0x2a4a8a });
  const eyeMat   = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a0a0a });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });

  // ===== Ноги — длинные, тонкие =====
  function makeLeg(side) {
    const leg = new THREE.Group();

    if (isSochi) {
      // ===== Скин «Сочи 2014»: короткие плавки + голые ноги =====
      const shorts = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.25, 6, 12), pantsMat);
      shorts.position.y = -0.15;
      shorts.castShadow = true;
      leg.add(shorts);

      // Голая кожа от колена и ниже
      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.6, 6, 12), skinMat);
      shin.position.y = -0.7;
      shin.castShadow = true;
      leg.add(shin);

      // Сланцы вместо кроссовок
      const flipMat = new THREE.MeshLambertMaterial({ color: 0xd8d8c0 });
      const flip = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.08, 0.5), flipMat);
      flip.position.set(0, -1.05, 0.1);
      flip.castShadow = true;
      leg.add(flip);
      // Ремешок
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.06), flipMat);
      strap.position.set(0, -0.99, 0.05);
      leg.add(strap);
    } else {
      // ===== Базовый скин: длинные штаны =====
      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.9, 6, 12), pantsMat);
      thigh.position.y = -0.5;
      thigh.castShadow = true;
      leg.add(thigh);

      const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.5), shoeMat);
      shoe.position.set(0, -1.05, 0.1);
      shoe.castShadow = true;
      leg.add(shoe);
    }

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

  // Жилет — создаём всегда, но на скине «Сочи» он скрыт.
  // Так анимации не сломаются от обращения к несуществующей переменной.
  const vest = new THREE.Mesh(new THREE.CapsuleGeometry(0.41, 0.75, 8, 14), vestMat);
  vest.position.y = 1.85;
  vest.scale.set(0.85, 1.0, 0.68);
  vest.castShadow = true;
  vest.visible = !isSochi;
  group.add(vest);

  // Галстук — аналогично
  const tie = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 4), tieMat);
  tie.position.set(0, 1.85, 0.32);
  tie.rotation.x = Math.PI;
  tie.visible = !isSochi;
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
//  КВИКС — маленький робот-изобретатель в стиле Тинкера
// =====================================================
function buildQuicks() {
  const group = new THREE.Group();

  const metalMat   = new THREE.MeshLambertMaterial({ color: 0x4a5a7a });
  const darkMat    = new THREE.MeshLambertMaterial({ color: 0x2a3050 });
  const goldMat    = new THREE.MeshLambertMaterial({ color: 0xd9a02a });
  const glowMat    = new THREE.MeshBasicMaterial({ color: 0x66ddff });
  const glowRedMat = new THREE.MeshBasicMaterial({ color: 0xff5522 });
  const visorMat   = new THREE.MeshBasicMaterial({ color: 0x0a1a3a });
  const eyeMat     = new THREE.MeshBasicMaterial({ color: 0xffee66 });

  // --- Ноги ---
  function makeLeg(side) {
    const leg = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 8), darkMat);
    thigh.position.y = -0.18;
    thigh.castShadow = true;
    leg.add(thigh);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.4, 8), metalMat);
    shin.position.y = -0.55;
    leg.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.42), darkMat);
    foot.position.set(0, -0.78, 0.06);
    foot.castShadow = true;
    leg.add(foot);
    leg.position.set(side * 0.22, 1.0, 0);
    return leg;
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  group.add(legL, legR);

  // --- Торс ---
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.6), metalMat);
  torso.position.y = 1.45;
  torso.castShadow = true;
  group.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.62), goldMat);
  chest.position.y = 1.45;
  group.add(chest);

  const chestGlow = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), glowMat);
  chestGlow.position.set(0, 1.45, 0.32);
  group.add(chestGlow);

  // --- Плечи ---
  const shoulderL = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), darkMat);
  shoulderL.position.set(-0.55, 1.75, 0);
  group.add(shoulderL);
  const shoulderR = shoulderL.clone();
  shoulderR.position.x = 0.55;
  group.add(shoulderR);

  // --- Голова ---
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.6), metalMat);
  head.position.y = 2.2;
  head.castShadow = true;
  group.add(head);

  const visor = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.32, 0.05), visorMat);
  visor.position.set(0, 2.24, 0.31);
  group.add(visor);

  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), eyeMat);
  eyeL.position.set(-0.15, 2.24, 0.34);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.15;
  group.add(eyeR);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), goldMat);
  antenna.position.y = 2.7;
  group.add(antenna);
  const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), glowRedMat);
  antennaBall.position.y = 2.92;
  group.add(antennaBall);

  // --- Реактивный ранец ---
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.9, 0.4), darkMat);
  backpack.position.set(0, 1.5, -0.5);
  backpack.castShadow = true;
  group.add(backpack);

  const nozzleL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.25, 10), goldMat);
  nozzleL.position.set(-0.22, 0.95, -0.5);
  group.add(nozzleL);
  const nozzleR = nozzleL.clone();
  nozzleR.position.x = 0.22;
  group.add(nozzleR);

  const flameL = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 10), glowMat);
  flameL.position.set(-0.22, 0.75, -0.5);
  flameL.rotation.x = Math.PI;
  group.add(flameL);
  const flameR = flameL.clone();
  flameR.position.x = 0.22;
  group.add(flameR);

  for (let i = 0; i < 2; i++) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 6), goldMat);
    pipe.position.set(i === 0 ? -0.35 : 0.35, 1.6, -0.3);
    pipe.rotation.x = 0.2;
    group.add(pipe);
  }

  // --- Руки с ракетными установками ---
  function makeArm(side) {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.4, 6, 10), metalMat);
    upper.position.y = -0.25;
    upper.castShadow = true;
    arm.add(upper);
    const launcher = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 10), darkMat);
    launcher.rotation.z = Math.PI / 2;
    launcher.position.set(0, -0.55, 0);
    launcher.castShadow = true;
    arm.add(launcher);
    const launcherRing = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.03, 6, 12), goldMat);
    launcherRing.position.set(side * 0.22, -0.55, 0);
    launcherRing.rotation.y = Math.PI / 2;
    arm.add(launcherRing);
    const barrel = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), glowRedMat);
    barrel.position.set(side * 0.26, -0.55, 0);
    barrel.rotation.y = side * Math.PI / 2;
    arm.add(barrel);

    arm.position.set(side * 0.65, 1.6, 0);
    arm.rotation.z = side * 0.15;
    return arm;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);
  group.add(armL, armR);

  return {
    group,
    isRoller: false,
    isQuicks: true,
    setWalk(phase) {
      const swing = Math.sin(phase) * 0.35;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.6;
      armR.rotation.x = swing * 0.6;
      torso.position.y = 1.45 + Math.abs(Math.sin(phase)) * 0.05;
    },
    setJump(attackActive) {
      legL.rotation.x = -0.7;
      legR.rotation.x = -0.7;
      armL.rotation.x = -0.9;
      if (!attackActive) armR.rotation.x = -0.9;
      torso.position.y = 1.45;
    },
    setAttack(progress) {
      const p = 1 - progress;
      armL.rotation.x = -1.2 * p;
      armR.rotation.x = -1.2 * p;
    },
    applyTransform() { antennaBall.material.color.setHex(0xffee88); },
    revertTransform() { antennaBall.material.color.setHex(0xff5522); },
  };
}

// =====================================================
//  КВЕЙК — высокий мальчик с чёлкой, закрывающей глаза
// =====================================================
function buildKveik(skinId) {
  const group = new THREE.Group();

  const skinMat  = new THREE.MeshLambertMaterial({ color: 0xe8c8a0 });
  const hairMat  = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
  const shirtMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
  const pantsMat = new THREE.MeshLambertMaterial({ color: 0x2a2a3a });
  const shoeMat  = new THREE.MeshLambertMaterial({ color: 0x151515 });
  const eyeMat   = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x1a0a0a });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0x1a1a2a });

  // ===== Ноги =====
  function makeLeg(side) {
    const leg = new THREE.Group();
    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.7, 6, 12), pantsMat);
    thigh.position.y = -0.45;
    thigh.castShadow = true;
    leg.add(thigh);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 0.52), shoeMat);
    shoe.position.set(0, -0.95, 0.1);
    shoe.castShadow = true;
    leg.add(shoe);
    leg.position.set(side * 0.25, 1.05, 0);
    return leg;
  }
  const legL = makeLeg(-1);
  const legR = makeLeg(1);
  group.add(legL, legR);

  // ===== Торс — среднего телосложения =====
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 0.6, 8, 14), shirtMat);
  torso.position.y = 1.75;
  torso.scale.set(0.92, 1.0, 0.68);
  torso.castShadow = true;
  group.add(torso);

  // ===== Руки =====
  function makeArm(side) {
    const arm = new THREE.Group();
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.55, 6, 10), shirtMat);
    upper.position.y = -0.3;
    upper.castShadow = true;
    arm.add(upper);
    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.5, 6, 10), skinMat);
    forearm.position.y = -0.85;
    forearm.castShadow = true;
    arm.add(forearm);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), skinMat);
    hand.position.y = -1.2;
    arm.add(hand);
    arm.position.set(side * 0.58, 2.15, 0);
    arm.rotation.z = side * 0.12;
    return arm;
  }
  const armL = makeArm(-1);
  const armR = makeArm(1);
  group.add(armL, armR);

  // ===== Голова =====
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), skinMat);
  head.position.y = 2.7;
  head.castShadow = true;
  group.add(head);

  // ===== Волосы — пышная кудрявая шапка без чёлки =====
  const hairGroup = new THREE.Group();
  hairGroup.position.y = 2.7;

  // Основной купол — только верхняя полусфера, лицо не трогает
  const hairCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.54, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairMat
  );
  hairCap.position.y = 0.08;
  hairCap.scale.set(1.02, 1.05, 1.02);
  hairCap.castShadow = true;
  hairGroup.add(hairCap);

  // Крупные кудри по всей поверхности шапки — создают объём и форму
  const curlPositions = [
    [ 0.00, 0.42,  0.00, 0.26],   // макушка
    [ 0.26, 0.36,  0.10, 0.24],   // спереди-слева
    [-0.26, 0.36,  0.10, 0.24],   // спереди-справа
    [ 0.40, 0.22, -0.05, 0.22],   // слева сбоку
    [-0.40, 0.22, -0.05, 0.22],   // справа сбоку
    [ 0.30, 0.32, -0.30, 0.22],   // зад-слева
    [-0.30, 0.32, -0.30, 0.22],   // зад-справа
    [ 0.00, 0.30, -0.42, 0.26],   // сзади
    [ 0.15, 0.42, -0.15, 0.20],   // верх-сзади
    [-0.15, 0.42, -0.15, 0.20],   // верх-сзади
  ];
  for (const [cx, cy, cz, cr] of curlPositions) {
    const curl = new THREE.Mesh(
      new THREE.SphereGeometry(cr, 14, 12),
      hairMat
    );
    curl.position.set(cx, cy, cz);
    curl.castShadow = true;
    hairGroup.add(curl);
  }

  // Боковые пряди — маленькие кудри у висков, лицо не закрывают
  const sideCurlL = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), hairMat);
  sideCurlL.position.set(-0.44, 0.06, 0.06);
  sideCurlL.scale.set(0.9, 1.3, 0.9);
  hairGroup.add(sideCurlL);

  const sideCurlR = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), hairMat);
  sideCurlR.position.set(0.44, 0.06, 0.06);
  sideCurlR.scale.set(0.9, 1.3, 0.9);
  hairGroup.add(sideCurlR);

  group.add(hairGroup);

  // Глаза за чёлкой — почти не видны
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), eyeMat);
  eyeL.position.set(-0.16, 2.7, 0.36);
  group.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.16;
  group.add(eyeR);
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), pupilMat);
  pupilL.position.set(-0.16, 2.7, 0.44);
  group.add(pupilL);
  const pupilR = pupilL.clone();
  pupilR.position.x = 0.16;
  group.add(pupilR);

  // Рот — тонкая линия
  const mouth = new THREE.Mesh(
    new THREE.TorusGeometry(0.1, 0.02, 5, 12, Math.PI),
    pupilMat
  );
  mouth.position.set(0, 2.5, 0.38);
  mouth.rotation.z = Math.PI;
  group.add(mouth);

  // ===== Контейнер для магического костюма =====
  // Группа всегда видима — скрываются только сами элементы костюма по отдельности.
  const costumeGroup = new THREE.Group();
  group.add(costumeGroup);

  // Порядок: 0–1 = рукава L/R, 2–3 = обувь L/R
  const costumeParts = [];

  // Координаты рук в системе координат группы персонажа:
  // arm.position = (side * 0.75, 2.15, 0),
  // внутри руки: upper (capsule) на y=-0.3, forearm на y=-0.85, hand на y=-1.2
  // Значит средняя часть руки находится в мире на y ≈ 2.15 - 0.55 ≈ 1.6.
  // Рукав должен идти от плеча к запястью — от y=2.0 до y=1.2, центр 1.6.

  // 1. Фиолетовые рукава на левой и правой руке
  const sleeveMat = new THREE.MeshLambertMaterial({
    color: 0x8833cc, emissive: 0x441166,
  });

  // Рукав левый — точно по руке (та же X, тот же наклон)
  const sleeveL = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.7, 8, 12),
    sleeveMat
  );
  sleeveL.position.set(-0.58, 1.55, 0);
  sleeveL.rotation.z = -0.12;
  sleeveL.visible = false;
  costumeGroup.add(sleeveL);
  costumeParts.push(sleeveL);

  // Рукав правый
  const sleeveR = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.22, 0.7, 8, 12),
    sleeveMat
  );
  sleeveR.position.set(0.58, 1.55, 0);
  sleeveR.rotation.z = 0.12;
  sleeveR.visible = false;
  costumeGroup.add(sleeveR);
  costumeParts.push(sleeveR);

  // 2. Красивая обувь — глянцевые блестящие сапожки
  // Координаты ног: leg.position = (side * 0.25, 1.05, 0),
  // внутри: thigh на y=-0.45 (то есть в мире ~0.6),
  // shoe на y=-0.95 (в мире ~0.1).
  // Обувь должна быть на y ≈ 0.1, чуть ниже, чтобы обхватывала ступню.
  const bootMat = new THREE.MeshLambertMaterial({
    color: 0x9966ff, emissive: 0x331166,
  });

  // Сапог левый — от ступни вверх до голени
  const bootL = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.55, 0.62),
    bootMat
  );
  bootL.position.set(-0.25, 0.35, 0.08);
  bootL.visible = false;
  costumeGroup.add(bootL);
  costumeParts.push(bootL);

  // Сапог правый
  const bootR = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.55, 0.62),
    bootMat
  );
  bootR.position.set(0.25, 0.35, 0.08);
  bootR.visible = false;
  costumeGroup.add(bootR);
  costumeParts.push(bootR);

  // Голенища — верхняя часть сапога чуть выше
  const shinL = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.45, 10),
    bootMat
  );
  shinL.position.set(-0.25, 0.8, 0);
  shinL.visible = false;
  costumeGroup.add(shinL);
  costumeParts.push(shinL);

  const shinR = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.45, 10),
    bootMat
  );
  shinR.position.set(0.25, 0.8, 0);
  shinR.visible = false;
  costumeGroup.add(shinR);
  costumeParts.push(shinR);

  // 6. Розовые волосы (энчантрикс) — та же форма, другой цвет
  const hairCostumeMat = new THREE.MeshLambertMaterial({
    color: 0xff88dd, emissive: 0x662266,
  });
  const hairCostumeGroup = new THREE.Group();
  hairCostumeGroup.visible = false;
  hairCostumeGroup.position.y = 2.7;

  const hairCapPink = new THREE.Mesh(
    new THREE.SphereGeometry(0.54, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    hairCostumeMat
  );
  hairCapPink.position.y = 0.08;
  hairCapPink.scale.set(1.03, 1.07, 1.03);
  hairCostumeGroup.add(hairCapPink);

  for (const [cx, cy, cz, cr] of curlPositions) {
    const curl = new THREE.Mesh(
      new THREE.SphereGeometry(cr * 1.05, 14, 12),
      hairCostumeMat
    );
    curl.position.set(cx, cy, cz);
    hairCostumeGroup.add(curl);
  }

  const sideCurlLPink = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), hairCostumeMat);
  sideCurlLPink.position.set(-0.44, 0.06, 0.06);
  sideCurlLPink.scale.set(0.95, 1.35, 0.95);
  hairCostumeGroup.add(sideCurlLPink);

  const sideCurlRPink = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), hairCostumeMat);
  sideCurlRPink.position.set(0.44, 0.06, 0.06);
  sideCurlRPink.scale.set(0.95, 1.35, 0.95);
  hairCostumeGroup.add(sideCurlRPink);

  group.add(hairCostumeGroup);

  // ===== Крылья (появляются в конце катсцены) =====
  const wingsGroup = new THREE.Group();
  wingsGroup.visible = false;
  wingsGroup.position.set(0, 2.0, -0.3);

  const wingMat = new THREE.MeshLambertMaterial({
    color: 0xaaddff,
    emissive: 0x4488bb,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });

  // Форма крыла — плоский «лепесток» из Shape
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.bezierCurveTo(0.2, 0.4, 0.6, 0.9, 1.5, 1.2);
  wingShape.bezierCurveTo(1.6, 0.8, 1.4, 0.3, 1.0, -0.1);
  wingShape.bezierCurveTo(0.8, -0.4, 0.4, -0.3, 0, 0);
  const wingGeo = new THREE.ShapeGeometry(wingShape, 20);

  // Правое крыло — растёт вправо-вверх от спины
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingR.position.set(0.1, 0.2, 0);
  wingR.rotation.z = 0.4;     // наклон вверх
  wingR.scale.set(1, 1, 1);
  wingsGroup.add(wingR);

  // Левое крыло — зеркальная копия через scale.x = -1
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.1, 0.2, 0);
  wingL.rotation.z = 0.4;
  wingL.scale.set(-1, 1, 1);
  wingsGroup.add(wingL);

  group.add(wingsGroup);

  return {
    group,
    isRoller: false,
    isKveik: true,
    setWalk(phase) {
      const swing = Math.sin(phase) * 0.4;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.7;
      armR.rotation.x = swing * 0.7;
      torso.position.y = 1.75 + Math.abs(Math.sin(phase)) * 0.05;
    },
    setJump(attackActive) {
      legL.rotation.x = -0.85;
      legR.rotation.x = -0.85;
      armL.rotation.x = -1.4;
      if (!attackActive) armR.rotation.x = -1.4;
      torso.position.y = 1.75;
    },
    setAttack(progress) {
      // Обе руки разводятся горизонтально — «рассекающие волны»
      armL.rotation.x = -0.6 * progress;
      armL.rotation.z = 0.1 + 0.9 * progress;
      armR.rotation.x = -0.6 * progress;
      armR.rotation.z = -0.1 - 0.9 * progress;
    },
    applyTransform() {
      // От молота — очки
      hairGroup.visible = false;
      // Ничего не делаем с костюмом
    },
    revertTransform() {
      hairGroup.visible = true;
    },
    // Управление частями костюма
    showSleeves() {
      if (costumeParts[0]) costumeParts[0].visible = true;
      if (costumeParts[1]) costumeParts[1].visible = true;
    },
    showBoots() {
      // Индексы 2–5 — это bootL, bootR, shinL, shinR
      for (let i = 2; i < 6; i++) {
        if (costumeParts[i]) costumeParts[i].visible = true;
      }
    },
    showPinkHair() {
      hairGroup.visible = false;
      hairCostumeGroup.visible = true;
    },
    showWings() {
      wingsGroup.visible = true;
    },
    hideWings() {
      wingsGroup.visible = false;
    },
    hideCostume() {
      for (const p of costumeParts) p.visible = false;
      hairCostumeGroup.visible = false;
      hairGroup.visible = true;
      wingsGroup.visible = false;
    },
    wingsGroup,
    setFlyingPose(t) {
      // Поза в полёте: слегка наклонена, крылья машут
      const flap = Math.sin(t * 12) * 0.35;
      wingsGroup.children[0].rotation.z = -0.3 + flap;
      wingsGroup.children[1].rotation.z = -0.3 - flap;
      legL.rotation.x = -0.15;
      legR.rotation.x = -0.15;
      armL.rotation.x = -0.3;
      armR.rotation.x = -0.3;
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
  {
    id: 'quicks',
    name: 'Квикс',
    emoji: '🤖',
    desc: 'Маленький робот-изобретатель. Кидает самонаводящиеся ракеты. Телепортируется и имеет встроенный щит.',
    stats: {
      maxHp: 90,
      speed: 9,
      damage: 10,
      radius: 2.5,
      cooldown: 900,
      regen: 0,
      magnet: 2.5,
      jumpCooldown: 2000,
    },
    build: buildQuicks,
  },
  {
    id: 'kveik',
    name: 'Квейк',
    emoji: '✨',
    desc: 'Высокий мальчик с чёлкой. Бьёт горизонтальными рассекающими волнами. На 5 ур. превращается в фею и летает над врагами.',
    stats: {
      maxHp: 100,
      speed: 8,
      damage: 9,
      radius: 3.2,
      cooldown: 700,
      regen: 0,
      magnet: 2.5,
      jumpCooldown: 2000,
    },
    build: buildKveik,
  },
];