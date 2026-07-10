import * as THREE from 'three';
import { FighterClass } from '../types';

// Helper to create a materials cache to save draw calls
const materialCache: Record<string, THREE.Material> = {};
function getMaterial(color: string, roughness = 0.5, metalness = 0.1, emissive = '#000000'): THREE.Material {
  const key = `${color}_${roughness}_${metalness}_${emissive}`;
  if (!materialCache[key]) {
    materialCache[key] = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness,
      metalness,
      emissive: new THREE.Color(emissive),
      flatShading: true
    });
  }
  return materialCache[key];
}

// Procedurally create the Boxing Ring inside a Group
export function createBoxingRing(): THREE.Group {
  const ringGroup = new THREE.Group();

  // 1. Ring Canvas (Floor)
  // Standard ring size: 16x16 units
  const canvasGeo = new THREE.BoxGeometry(16, 0.4, 16);
  // Grey/Blueish canvas
  const canvasMat = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    roughness: 0.9,
    metalness: 0.05,
    flatShading: true
  });
  const canvas = new THREE.Mesh(canvasGeo, canvasMat);
  canvas.position.y = -0.2;
  canvas.receiveShadow = true;
  ringGroup.add(canvas);

  // Red/Blue corner pads on the floor
  const centerMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const centerRingGeo = new THREE.RingGeometry(2, 2.1, 32);
  centerRingGeo.rotateX(-Math.PI / 2);
  const centerRing = new THREE.Mesh(centerRingGeo, centerMat);
  centerRing.position.y = 0.01;
  ringGroup.add(centerRing);

  // 2. Corner Posts (Red, Blue, and two Whites)
  // Corners at X=+-7.5, Z=+-7.5
  const corners = [
    { x: -7.5, z: -7.5, color: 0xd91e18, name: 'Red Corner' },   // Red
    { x: 7.5, z: 7.5, color: 0x1f3a93, name: 'Blue Corner' },   // Blue
    { x: -7.5, z: 7.5, color: 0xffffff, name: 'Neutral White 1' }, // White
    { x: 7.5, z: -7.5, color: 0xffffff, name: 'Neutral White 2' }, // White
  ];

  const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
  corners.forEach(corner => {
    const postMat = new THREE.MeshStandardMaterial({ color: corner.color, metalness: 0.6, roughness: 0.2 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.set(corner.x, 1.5, corner.z);
    post.castShadow = true;
    ringGroup.add(post);

    // Corner padding cushions
    const cushionGeo = new THREE.BoxGeometry(0.35, 2.2, 0.35);
    const cushionMat = new THREE.MeshStandardMaterial({ color: corner.color, roughness: 0.6 });
    const cushion = new THREE.Mesh(cushionGeo, cushionMat);
    cushion.position.set(corner.x * 0.97, 1.5, corner.z * 0.97);
    cushion.rotation.y = Math.atan2(corner.x, corner.z) + Math.PI / 4;
    ringGroup.add(cushion);
  });

  // 3. Ring Ropes (3 levels)
  // Ropes surrounding the ring at heights: 0.8m, 1.4m, 2.0m
  const ropeHeights = [0.7, 1.4, 2.1];
  const ropesColors = [0xd91e18, 0xffffff, 0x1f3a93]; // Red, White, Blue

  ropeHeights.forEach((height, ropeIndex) => {
    const ropeColor = ropesColors[ropeIndex];
    const ropeMat = new THREE.MeshStandardMaterial({ color: ropeColor, roughness: 0.8 });
    
    // Create segments of rope between corners
    // Corners sequence: C0(-7.5, -7.5) -> C2(-7.5, 7.5) -> C1(7.5, 7.5) -> C3(7.5, -7.5) -> C0
    const cornerPositions = [
      new THREE.Vector3(-7.5, height, -7.5),
      new THREE.Vector3(-7.5, height, 7.5),
      new THREE.Vector3(7.5, height, 7.5),
      new THREE.Vector3(7.5, height, -7.5),
    ];

    for (let i = 0; i < 4; i++) {
      const p1 = cornerPositions[i];
      const p2 = cornerPositions[(i + 1) % 4];
      const distance = p1.distanceTo(p2);
      
      const ropeSegmentGeo = new THREE.CylinderGeometry(0.05, 0.05, distance, 6);
      ropeSegmentGeo.rotateX(Math.PI / 2); // Align along cylinder axis
      
      const rope = new THREE.Mesh(ropeSegmentGeo, ropeMat);
      // Position at midpoint
      rope.position.copy(p1).add(p2).multiplyScalar(0.5);
      rope.lookAt(p2);
      ringGroup.add(rope);
    }
  });

  // 4. Little stairs on red and blue corners
  const stairMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
  const stairGeo = new THREE.BoxGeometry(1.2, 0.3, 0.6);
  
  // Red Corner Stairs (near -7.5, -7.5)
  const stair1 = new THREE.Mesh(stairGeo, stairMat);
  stair1.position.set(-8.2, 0.15, -7.5);
  ringGroup.add(stair1);

  // Blue Corner Stairs (near 7.5, 7.5)
  const stair2 = new THREE.Mesh(stairGeo, stairMat);
  stair2.position.set(8.2, 0.15, 7.5);
  ringGroup.add(stair2);

  // 5. Ground Surroundings / Skirt
  const skirtGeo = new THREE.BoxGeometry(17, 0.35, 17);
  const skirtMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const skirt = new THREE.Mesh(skirtGeo, skirtMat);
  skirt.position.y = -0.22;
  ringGroup.add(skirt);

  return ringGroup;
}

export interface FighterJoints {
  group: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Mesh;
  leftShoulder: THREE.Group;
  rightShoulder: THREE.Group;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  leftHand: THREE.Mesh;
  rightHand: THREE.Mesh;
  leftHip: THREE.Group;
  rightHip: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  weapon?: THREE.Mesh | THREE.Group;
  mongkhon?: THREE.Group;
  helmet?: THREE.Mesh;
  isBoss: boolean;
  isGod?: boolean;
}

// Procedurally create a 3D character mesh based on type
export function createFighterMesh(type: FighterClass, isEnemy = false, isBoss = false, isGod = false): FighterJoints {
  const masterGroup = new THREE.Group();
  
  // Custom scaling for boss
  const scaleMultiplier = isGod ? 2.2 : isBoss ? 1.7 : isEnemy ? 1.1 : 1.0;
  masterGroup.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);

  // Base skins & colors
  const skinColor = isGod ? '#fbbf24' : isBoss ? '#450a0a' : isEnemy ? '#3b0764' : '#fbcfe8'; // Boss dark red skin, Enemy dark purple skin, Player pinkish skin
  const shortsColor = isGod ? '#111827' : type === 'thai_boxer' ? '#dc2626' : type === 'intl_boxer' ? '#2563eb' : type === 'soldier' ? '#14532d' : '#1e293b';
  
  // 1. Torso (Body)
  const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.5);
  const torsoMat = getMaterial(isBoss ? '#7f1d1d' : shortsColor);
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  torso.position.y = 1.05; // Pivot elevation
  torso.castShadow = true;
  torso.receiveShadow = true;
  masterGroup.add(torso);

  // Red/Gold Belt for Champions or Boss
  if (isGod || isBoss || type === 'thai_boxer') {
    const beltGeo = new THREE.BoxGeometry(0.74, 0.15, 0.54);
    const beltMat = getMaterial('#fbbf24', 0.2, 0.8); // Golden belt
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = -0.3; // Relative to torso center
    torso.add(belt);

    const badgeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const badgeMat = getMaterial(isGod ? '#38bdf8' : '#dc2626', 0.3, 0.7); // Cyan badge for God, Red for King
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0, -0.3, 0.27);
    torso.add(badge);
  }

  // 2. Head (Sphere)
  const headGeo = new THREE.SphereGeometry(0.3, 8, 8);
  const headMat = getMaterial(skinColor);
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(0, 0.65, 0); // Relative to torso center
  head.castShadow = true;
  torso.add(head);

  // Add Halo if God
  if (isGod) {
    const haloGeo = new THREE.TorusGeometry(0.24, 0.03, 8, 24);
    haloGeo.rotateX(Math.PI / 2);
    const haloMat = getMaterial('#fbbf24', 0.1, 0.9, '#fbbf24');
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 0.55, 0); // elevated slightly above head
    head.add(halo);
  }

  // Add Eyes
  const eyeGeo = new THREE.SphereGeometry(0.05, 4, 4);
  const eyeMat = getMaterial('#000000', 0.1, 0.1);
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.12, 0.05, 0.24);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.12, 0.05, 0.24);
  head.add(rightEye);

  // Character specific head gear / features
  let mongkhonGroup: THREE.Group | undefined;
  let helmetMesh: THREE.Mesh | undefined;

  if (type === 'thai_boxer') {
    // Muay Thai Mongkhon headband
    mongkhonGroup = new THREE.Group();
    const ringGeo = new THREE.TorusGeometry(0.32, 0.05, 8, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = getMaterial('#fbbf24', 0.3, 0.6); // Golden string headband
    const ring = new THREE.Mesh(ringGeo, ringMat);
    mongkhonGroup.add(ring);

    // Tail extending back
    const tailGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6);
    tailGeo.rotateX(Math.PI / 4);
    const tailMat = getMaterial('#ffffff', 0.8, 0);
    const tail = new THREE.Mesh(tailGeo, tailMat);
    tail.position.set(0, 0.1, -0.35);
    mongkhonGroup.add(tail);

    mongkhonGroup.position.y = 0.08;
    head.add(mongkhonGroup);
  } else if (type === 'intl_boxer') {
    // Red/Blue Headgear protective gear
    const headgearMat = getMaterial(shortsColor, 0.4, 0.1);
    
    // Top protective cap
    const capGeo = new THREE.SphereGeometry(0.32, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, headgearMat);
    cap.position.y = 0.05;
    head.add(cap);

    // Ear guards
    const earGeo = new THREE.BoxGeometry(0.1, 0.25, 0.15);
    const leftEar = new THREE.Mesh(earGeo, headgearMat);
    leftEar.position.set(-0.28, 0, 0.05);
    head.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, headgearMat);
    rightEar.position.set(0.28, 0, 0.05);
    head.add(rightEar);
  } else if (type === 'soldier') {
    // Military Helmet
    const helmetGeo = new THREE.SphereGeometry(0.34, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMat = getMaterial('#14532d', 0.8, 0.1); // Green metal helmet
    helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
    helmetMesh.position.y = 0.05;
    head.add(helmetMesh);

    // Helmet visor strap
    const strapGeo = new THREE.BoxGeometry(0.64, 0.04, 0.1);
    const strapMat = getMaterial('#0f172a', 0.9, 0);
    const strap = new THREE.Mesh(strapGeo, strapMat);
    strap.position.set(0, -0.05, 0.28);
    helmetMesh.add(strap);
  } else if (type === 'samurai') {
    // Samurai Kabuto Helmet
    const helmetGeo = new THREE.SphereGeometry(0.34, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const helmetMat = getMaterial('#1e293b', 0.3, 0.5); // Black/Gold helmet
    helmetMesh = new THREE.Mesh(helmetGeo, helmetMat);
    helmetMesh.position.y = 0.05;
    head.add(helmetMesh);

    // Golden Crest / Horns on front
    const crestGroup = new THREE.Group();
    const hornGeo = new THREE.BoxGeometry(0.08, 0.3, 0.03);
    const hornMat = getMaterial('#fbbf24', 0.2, 0.8);
    
    const leftHorn = new THREE.Mesh(hornGeo, hornMat);
    leftHorn.rotation.z = -Math.PI / 6;
    leftHorn.position.set(-0.1, 0.2, 0.3);
    crestGroup.add(leftHorn);

    const rightHorn = new THREE.Mesh(hornGeo, hornMat);
    rightHorn.rotation.z = Math.PI / 6;
    rightHorn.position.set(0.1, 0.2, 0.3);
    crestGroup.add(rightHorn);

    helmetMesh.add(crestGroup);
  }

  // 3. Left Shoulder Pivot + Arm + Glove/Hand
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.45, 0.35, 0); // Positioned relative to torso center
  torso.add(leftShoulder);

  const armGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.5, 6);
  armGeo.translate(0, -0.25, 0); // Pivot at the shoulder joint
  const armMat = getMaterial(skinColor);
  const leftArm = new THREE.Mesh(armGeo, armMat);
  leftArm.castShadow = true;
  leftShoulder.add(leftArm);

  // Left glove or hand
  const handGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const gloveColor = type === 'thai_boxer' ? '#dc2626' : type === 'intl_boxer' ? '#2563eb' : type === 'soldier' ? '#27272a' : skinColor;
  const handMat = getMaterial(isBoss ? '#ef4444' : gloveColor, 0.3, 0.2);
  const leftHand = new THREE.Mesh(handGeo, handMat);
  leftHand.position.set(0, -0.5, 0); // At the end of forearm
  leftHand.castShadow = true;
  leftArm.add(leftHand);

  // 4. Right Shoulder Pivot + Arm + Glove/Hand
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.45, 0.35, 0); // Positioned relative to torso center
  torso.add(rightShoulder);

  const rightArm = new THREE.Mesh(armGeo, armMat);
  rightArm.castShadow = true;
  rightShoulder.add(rightArm);

  const rightHand = new THREE.Mesh(handGeo, handMat);
  rightHand.position.set(0, -0.5, 0);
  rightHand.castShadow = true;
  rightArm.add(rightHand);

  // Wield weapon for Samurai
  let weaponGroup: THREE.Group | undefined;
  if (type === 'samurai') {
    weaponGroup = new THREE.Group();
    
    // Sword Handle (Golden/Black)
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6);
    const handleMat = getMaterial('#111111', 0.9, 0);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = 0.15;
    weaponGroup.add(handle);

    // Golden sword guard (tsuba)
    const guardGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 8);
    const guardMat = getMaterial('#fbbf24', 0.2, 0.8);
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.position.y = 0.3;
    weaponGroup.add(guard);

    // Gleaming Blade
    const bladeGeo = new THREE.BoxGeometry(0.02, 0.9, 0.06);
    const bladeMat = getMaterial('#f1f5f9', 0.1, 0.9, '#334155'); // Metallic shiny blade
    const blade = new THREE.Mesh(bladeGeo, bladeMat);
    blade.position.set(0, 0.75, 0.01);
    weaponGroup.add(blade);

    // Attach to right arm/hand
    weaponGroup.position.set(0, -0.1, 0.1);
    weaponGroup.rotation.x = -Math.PI / 3; // Forward angled
    rightHand.add(weaponGroup);
  }

  // 5. Left Hip Pivot + Leg + Foot
  const leftHip = new THREE.Group();
  leftHip.position.set(-0.25, -0.45, 0); // At bottom of torso
  torso.add(leftHip);

  const legGeo = new THREE.CylinderGeometry(0.12, 0.1, 0.6, 6);
  legGeo.translate(0, -0.3, 0); // Pivot at the hip joint
  const legMat = getMaterial(skinColor);
  const leftLeg = new THREE.Mesh(legGeo, legMat);
  leftLeg.castShadow = true;
  leftHip.add(leftLeg);

  // Shorts trim over left thigh
  const shortTrimGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 8);
  const shortTrim = new THREE.Mesh(shortTrimGeo, torsoMat);
  shortTrim.position.y = -0.12;
  leftLeg.add(shortTrim);

  const footGeo = new THREE.BoxGeometry(0.16, 0.12, 0.28);
  const footColor = type === 'soldier' ? '#1e293b' : type === 'intl_boxer' ? '#ffffff' : skinColor;
  const footMat = getMaterial(footColor, 0.8, 0);
  const leftFoot = new THREE.Mesh(footGeo, footMat);
  leftFoot.position.set(0, -0.6, 0.06);
  leftFoot.castShadow = true;
  leftLeg.add(leftFoot);

  // 6. Right Hip Pivot + Leg + Foot
  const rightHip = new THREE.Group();
  rightHip.position.set(0.25, -0.45, 0);
  torso.add(rightHip);

  const rightLeg = new THREE.Mesh(legGeo, legMat);
  rightLeg.castShadow = true;
  rightHip.add(rightLeg);

  // Shorts trim over right thigh
  const shortTrim2 = new THREE.Mesh(shortTrimGeo, torsoMat);
  shortTrim2.position.y = -0.12;
  rightLeg.add(shortTrim2);

  const rightFoot = new THREE.Mesh(footGeo, footMat);
  rightFoot.position.set(0, -0.6, 0.06);
  rightFoot.castShadow = true;
  rightLeg.add(rightFoot);

  return {
    group: masterGroup,
    torso,
    head,
    leftShoulder,
    rightShoulder,
    leftArm,
    rightArm,
    leftHand,
    rightHand,
    leftHip,
    rightHip,
    leftLeg,
    rightLeg,
    weapon: weaponGroup,
    mongkhon: mongkhonGroup,
    helmet: helmetMesh,
    isBoss,
    isGod
  };
}

// Animate a fighter based on state, elapsed time, and custom attack parameters
export function updateFighterAnimations(
  joints: FighterJoints,
  state: 'IDLE' | 'WALK' | 'ATTACK' | 'RAPID_PUNCH' | 'RAPID_KICK' | 'DANCE',
  time: number,
  attackProgress = 0, // 0 to 1 for key-triggered animations
  speedFactor = 1.0
) {
  const { torso, head, leftShoulder, rightShoulder, leftHip, rightHip, leftArm, rightArm, leftLeg, rightLeg, weapon } = joints;

  // Reset defaults first
  torso.position.y = 1.05;
  torso.rotation.set(0, 0, 0);
  head.rotation.set(0, 0, 0);
  
  // Guard stances
  leftShoulder.rotation.set(0.5, 0, 0.3);
  rightShoulder.rotation.set(0.5, 0, -0.3);
  leftArm.rotation.set(0, 0, 0);
  rightArm.rotation.set(0, 0, 0);

  leftHip.rotation.set(0, 0, 0);
  rightHip.rotation.set(0, 0, 0);
  leftLeg.rotation.set(0, 0, 0);
  rightLeg.rotation.set(0, 0, 0);

  const bounce = Math.sin(time * 12) * 0.04;

  switch (state) {
    case 'IDLE':
      // Gentle breathing & fighting guard bounce
      torso.position.y = 1.05 + Math.sin(time * 4) * 0.03;
      // Fighting guard stance
      leftShoulder.rotation.set(0.6 + Math.sin(time * 4) * 0.05, 0, 0.4);
      rightShoulder.rotation.set(0.7 + Math.cos(time * 4) * 0.05, 0, -0.4);
      head.rotation.y = Math.sin(time * 2) * 0.05;
      break;

    case 'WALK':
      // Walk cycling with head bobbing
      torso.position.y = 1.05 + Math.abs(Math.sin(time * 10)) * 0.08;
      
      // Swing shoulders/hips opposite each other (standard gait)
      const swingAngle = Math.sin(time * 10) * 0.5;
      leftShoulder.rotation.set(0.5 - swingAngle * 0.5, 0, 0.3);
      rightShoulder.rotation.set(0.5 + swingAngle * 0.5, 0, -0.3);

      leftHip.rotation.set(swingAngle, 0, 0);
      rightHip.rotation.set(-swingAngle, 0, 0);
      
      // Slight knee bending during swing
      leftLeg.rotation.set(swingAngle > 0 ? swingAngle * 0.3 : 0, 0, 0);
      rightLeg.rotation.set(swingAngle < 0 ? -swingAngle * 0.3 : 0, 0, 0);
      break;

    case 'ATTACK': {
      // Punching or Slashing
      // Attack progress 0 -> 1 goes fast
      const p = attackProgress;
      const punchExtension = Math.sin(p * Math.PI) * 1.5;

      // Twist body into the punch
      torso.rotation.y = -0.5 * Math.sin(p * Math.PI);
      
      if (weapon) {
        // Samurai Sword Slash
        rightShoulder.rotation.set(0.8 - punchExtension * 1.2, 0, -0.5);
        weapon.rotation.x = -Math.PI / 3 - punchExtension * 1.5;
        // Left hand guards
        leftShoulder.rotation.set(0.8, 0, 0.5);
      } else {
        // Boxer / Soldier Punch
        // Right glove lunges forward
        rightShoulder.rotation.set(1.5, 0, -0.1);
        rightArm.rotation.set(0, 0, -punchExtension * 0.8);
        rightShoulder.position.z = punchExtension * 0.4;
        
        // Left glove protects head
        leftShoulder.rotation.set(1.2, 0, 0.5);
      }
      break;
    }

    case 'RAPID_PUNCH': {
      // Rapid fire alternate punches
      const punchCycle = Math.sin(time * 24 * speedFactor);
      const isLeftActive = punchCycle > 0;
      const extension = Math.abs(punchCycle) * 1.2;

      torso.rotation.y = punchCycle * 0.25;

      if (weapon) {
        // Samurai rapid slashes
        rightShoulder.rotation.set(1.0 + punchCycle * 0.8, 0, -0.3);
        weapon.rotation.x = -Math.PI / 3 - extension * 1.2;
        leftShoulder.rotation.set(0.8, 0, 0.5);
      } else {
        // Double jab alternation
        if (isLeftActive) {
          leftShoulder.rotation.set(1.4, 0, 0.2);
          leftShoulder.position.z = extension * 0.3;
          
          rightShoulder.rotation.set(0.8, 0, -0.4);
          rightShoulder.position.z = 0;
        } else {
          rightShoulder.rotation.set(1.4, 0, -0.2);
          rightShoulder.position.z = extension * 0.3;
          
          leftShoulder.rotation.set(0.8, 0, 0.4);
          leftShoulder.position.z = 0;
        }
      }
      break;
    }

    case 'RAPID_KICK': {
      // High speed roundhouse kick cycling
      const kickCycle = Math.sin(time * 16 * speedFactor);
      const kickAngle = Math.abs(kickCycle) * 1.6;

      torso.position.y = 1.05 + bounce;
      torso.rotation.y = kickCycle * 0.6; // Body twist

      // Pivot high right or left leg up for high kick!
      if (kickCycle > 0) {
        rightHip.rotation.set(-0.2, 0, kickAngle); // Sideways high kick
        rightLeg.rotation.set(0.3, 0, 0);
        leftHip.rotation.set(0.1, 0, -0.1); // Support leg solid
      } else {
        leftHip.rotation.set(-0.2, 0, -kickAngle); // Sideways high kick
        leftLeg.rotation.set(0.3, 0, 0);
        rightHip.rotation.set(0.1, 0, 0.1); // Support leg solid
      }
      // Put arms out for balance
      leftShoulder.rotation.set(0.4, 0, 1.2);
      rightShoulder.rotation.set(0.4, 0, -1.2);
      break;
    }

    case 'DANCE':
      // Victory dance or Row 4 showcase
      // Body spins, hips bob, arms wave in joy!
      torso.position.y = 1.1 + Math.abs(Math.sin(time * 6)) * 0.3;
      torso.rotation.y = time * 4.0; // Spin!
      
      // Arms waving overhead
      const wave = Math.sin(time * 8) * 0.8;
      leftShoulder.rotation.set(2.2 + wave, 0, 0.5 + wave * 0.2);
      rightShoulder.rotation.set(2.2 - wave, 0, -0.5 - wave * 0.2);

      // Cute feet tapping
      leftHip.rotation.set(Math.sin(time * 12) * 0.4, 0, 0);
      rightHip.rotation.set(Math.cos(time * 12) * 0.4, 0, 0);
      break;
  }
}
