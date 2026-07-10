import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { FighterClass, FighterStats, FIGHTER_CLASSES, GameState, ParticleEffect } from '../types';
import { createBoxingRing, createFighterMesh, updateFighterAnimations, FighterJoints } from '../utils/threeHelpers';
import { sfx } from '../utils/audio';

interface ThreeCanvasProps {
  gameState: GameState;
  playerClass: FighterClass;
  winCount: number;
  autoPlayActive: boolean;
  onAutoPlayTimeout: () => void;
  onUpdateHp: (playerHp: number, playerMax: number, enemyHp: number, enemyMax: number) => void;
  onEnemyDefeated: (isBoss: boolean) => void;
  onPlayerDefeated: () => void;
  currentStage: number;
  enemyClass: FighterClass;
  setEnemyClass: (enemyClass: FighterClass) => void;
  triggerNotification: (msg: string) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  gameState,
  playerClass,
  winCount,
  autoPlayActive,
  onAutoPlayTimeout,
  onUpdateHp,
  onEnemyDefeated,
  onPlayerDefeated,
  currentStage,
  enemyClass,
  setEnemyClass,
  triggerNotification,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // States exposed to HUD/React
  const [autoPlayTimer, setAutoPlayTimer] = useState<number>(0);

  // Refs for loop controls and gameplay variables
  const stateRef = useRef({
    gameState,
    playerClass,
    currentStage,
    autoPlayActive,
    enemyClass,
    
    // Player gameplay properties
    playerHp: 100,
    playerMaxHp: 100,
    playerPosition: new THREE.Vector3(0, 0.2, 3),
    playerVelocity: new THREE.Vector3(),
    playerFacing: 0, // Angle in radians
    playerMoveState: 'IDLE' as 'IDLE' | 'WALK' | 'ATTACK' | 'RAPID_PUNCH' | 'RAPID_KICK' | 'DANCE',
    
    // Attack timers & progress
    attackTimer: 0, // ms
    attackDuration: 200, // ms (plays faster than typical games as requested!)
    attackActive: false,
    attackType: 'P' as 'P' | 'O' | 'I' | 'K',
    specialSkillCooldown: 0, // ms
    
    // Enemy gameplay properties
    enemyHp: 100,
    enemyMaxHp: 100,
    enemyPosition: new THREE.Vector3(0, 0.2, -3),
    enemyVelocity: new THREE.Vector3(),
    enemyFacing: Math.PI,
    enemyMoveState: 'IDLE' as 'IDLE' | 'WALK' | 'ATTACK' | 'RAPID_PUNCH' | 'RAPID_KICK' | 'DANCE',
    enemyAttackTimer: 0,
    enemyAttackActive: false,
    enemyStunTimer: 0, // Knocks back/stuns when hit

    // Match meta
    isBossMatch: false,
    isGodMatch: false,
    autoPlayTimeRemaining: 0, // seconds

    // Ring size boundaries
    ringLimit: 7.2, // Cannot exit absolute coords
  });

  // Keep stateRef up to date with props
  useEffect(() => {
    stateRef.current.gameState = gameState;
    stateRef.current.playerClass = playerClass;
    stateRef.current.currentStage = currentStage;
    stateRef.current.enemyClass = enemyClass;

    // Set boss / god boolean
    const isBoss10 = currentStage === 10;
    const isBoss20 = currentStage === 20;
    const isBoss = isBoss10 || isBoss20;
    stateRef.current.isBossMatch = isBoss;
    stateRef.current.isGodMatch = isBoss20;

    if (gameState === 'PLAYING') {
      // Play Gong Sound representing round start!
      sfx.playGong();
      
      // Initialize stats
      const pStats = FIGHTER_CLASSES[playerClass];
      stateRef.current.playerHp = pStats.hp;
      stateRef.current.playerMaxHp = pStats.hp;
      stateRef.current.playerPosition.set(0, 0.2, 3.5);
      stateRef.current.playerMoveState = 'IDLE';

      // Setup enemy
      if (isBoss20) {
        stateRef.current.enemyHp = 500; // Boxing God massive health
        stateRef.current.enemyMaxHp = 500;
        stateRef.current.enemyPosition.set(0, 0.2, -3.5);
        stateRef.current.enemyMoveState = 'IDLE';
        triggerNotification('🔥 WARNING: DIVINE SHOWDOWN! "เทพเจ้านักมวย" has descended to the ring! 🔥');
      } else if (isBoss10) {
        stateRef.current.enemyHp = 300; // Boxing King high health
        stateRef.current.enemyMaxHp = 300;
        stateRef.current.enemyPosition.set(0, 0.2, -3.5);
        stateRef.current.enemyMoveState = 'IDLE';
        triggerNotification('🔊 WARNING: Boss Fight! "ราชาแห่งนักมวย" has entered the ring!');
      } else {
        const eStats = FIGHTER_CLASSES[enemyClass];
        // Scale enemy stats based on stage count
        const hpMultiplier = 1 + (currentStage - 1) * 0.15;
        const finalHp = Math.round(eStats.hp * hpMultiplier);
        stateRef.current.enemyHp = finalHp;
        stateRef.current.enemyMaxHp = finalHp;
        stateRef.current.enemyPosition.set(0, 0.2, -3.5);
        stateRef.current.enemyMoveState = 'IDLE';
      }
    }
  }, [gameState, playerClass, currentStage, enemyClass]);

  // Handle Auto Play mode trigger & 30s timer
  useEffect(() => {
    stateRef.current.autoPlayActive = autoPlayActive;
    if (autoPlayActive) {
      stateRef.current.autoPlayTimeRemaining = 30;
      setAutoPlayTimer(30);
      triggerNotification('🤖 Auto-Fight Mode Activated (30 seconds)');

      const interval = setInterval(() => {
        stateRef.current.autoPlayTimeRemaining -= 1;
        const remaining = stateRef.current.autoPlayTimeRemaining;
        
        if (remaining <= 0) {
          clearInterval(interval);
          setAutoPlayTimer(0);
          onAutoPlayTimeout();
          triggerNotification('🤖 Auto-Fight Expired. Player manual control restored.');
        } else {
          setAutoPlayTimer(remaining);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      stateRef.current.autoPlayTimeRemaining = 0;
      setAutoPlayTimer(0);
    }
  }, [autoPlayActive]);

  // Keyboard and Input states
  const keysPressed = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      if (stateRef.current.gameState !== 'PLAYING') return;
      if (stateRef.current.autoPlayActive) return; // Prevent keys in auto-play

      // Action Keys
      if (key === 'p' && !stateRef.current.attackActive) {
        // Normal Punch
        stateRef.current.attackActive = true;
        stateRef.current.attackType = 'P';
        stateRef.current.attackTimer = 0;
        stateRef.current.playerMoveState = 'ATTACK';
      } else if (key === 'o' && !stateRef.current.attackActive && stateRef.current.specialSkillCooldown <= 0) {
        // Special Energy Burst Ring
        stateRef.current.attackActive = true;
        stateRef.current.attackType = 'O';
        stateRef.current.attackTimer = 0;
        stateRef.current.playerMoveState = 'ATTACK';
        stateRef.current.specialSkillCooldown = 4000; // 4s cooldown
      } else if (key === 'i' && !stateRef.current.attackActive) {
        // Rapid Punches / Slashes
        stateRef.current.attackActive = true;
        stateRef.current.attackType = 'I';
        stateRef.current.attackTimer = 0;
        stateRef.current.playerMoveState = 'RAPID_PUNCH';
      } else if (key === 'k' && !stateRef.current.attackActive) {
        // Rapid Kicks
        stateRef.current.attackActive = true;
        stateRef.current.attackType = 'K';
        stateRef.current.attackTimer = 0;
        stateRef.current.playerMoveState = 'RAPID_KICK';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onAutoPlayTimeout]);

  // Primary 3D Rendering & Simulation loop
  useEffect(() => {
    if (!canvasRef.current) return;

    // --- 1. SETUP SCENE, CAMERA, RENDERER ---
    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#090d16'); // Night boxing ring environment
    scene.fog = new THREE.FogExp2('#090d16', 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 8, 14);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // --- 2. LIGHTS ---
    const ambientLight = new THREE.AmbientLight('#1d2433', 1.2);
    scene.add(ambientLight);

    // Directional sky light
    const dirLight = new THREE.DirectionalLight('#38bdf8', 1.0); // Neon blue light
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const d = 10;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    // Ring Overhead Spotlights (Drama!)
    const spotRed = new THREE.SpotLight('#f43f5e', 45, 25, Math.PI / 4, 0.5, 1);
    spotRed.position.set(-5, 12, -5);
    spotRed.castShadow = true;
    scene.add(spotRed);

    const spotBlue = new THREE.SpotLight('#3b82f6', 45, 25, Math.PI / 4, 0.5, 1);
    spotBlue.position.set(5, 12, 5);
    spotBlue.castShadow = true;
    scene.add(spotBlue);

    // Big central white light downwards
    const centralSpot = new THREE.SpotLight('#ffffff', 30, 20, Math.PI / 3, 0.3, 1);
    centralSpot.position.set(0, 10, 0);
    scene.add(centralSpot);

    // --- 3. OBJECTS & RING ---
    const boxingRing = createBoxingRing();
    scene.add(boxingRing);

    // Audience Stands (Background grid boxes with colored spots representing audience)
    const standsGroup = new THREE.Group();
    const standRowGeo = new THREE.BoxGeometry(30, 2, 4);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x111622, roughness: 0.9 });
    
    // North, South, East, West spectators seating
    const northStand = new THREE.Mesh(standRowGeo, standMat);
    northStand.position.set(0, -0.5, -15);
    standsGroup.add(northStand);

    const southStand = new THREE.Mesh(standRowGeo, standMat);
    southStand.position.set(0, -0.5, 15);
    standsGroup.add(southStand);

    const eastStand = new THREE.Mesh(standRowGeo, standMat);
    eastStand.rotation.y = Math.PI / 2;
    eastStand.position.set(15, -0.5, 0);
    standsGroup.add(eastStand);

    const westStand = new THREE.Mesh(standRowGeo, standMat);
    westStand.rotation.y = Math.PI / 2;
    westStand.position.set(-15, -0.5, 0);
    standsGroup.add(westStand);
    scene.add(standsGroup);

    // Crowd light indicators
    const crowdCount = 45;
    const crowdParticlesGeo = new THREE.BufferGeometry();
    const crowdPositions = [];
    const crowdColors = [];
    for (let i = 0; i < crowdCount; i++) {
      // Circle layout representing people
      const angle = Math.random() * Math.PI * 2;
      const radius = 12 + Math.random() * 8;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = 0.5 + Math.random() * 4;
      crowdPositions.push(x, y, z);

      // Random purple/blue/red cheering colors
      const r = Math.random() > 0.5 ? 0.9 : 0.1;
      const g = 0.1;
      const b = Math.random() > 0.5 ? 0.9 : 0.5;
      crowdColors.push(r, g, b);
    }
    crowdParticlesGeo.setAttribute('position', new THREE.Float32BufferAttribute(crowdPositions, 3));
    crowdParticlesGeo.setAttribute('color', new THREE.Float32BufferAttribute(crowdColors, 3));
    const crowdMat = new THREE.PointsMaterial({
      size: 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    const crowdPoints = new THREE.Points(crowdParticlesGeo, crowdMat);
    scene.add(crowdPoints);

    // --- 4. SHOWCASE CHARACTERS (16 characters in 4 rows for LOBBY) ---
    // The user wants:
    // แถวแรก ยืนนิ่งๆ (Row 1: Idle)
    // แถวที่สอง เดิน (Row 2: Walk)
    // แถวที่สาม โจมตี (Row 3: Attack)
    // แถวที่สี่ เต้น (Row 4: Dance)
    const showcaseGroup = new THREE.Group();
    scene.add(showcaseGroup);

    const classes: FighterClass[] = ['thai_boxer', 'intl_boxer', 'soldier', 'samurai'];
    const showcaseFighters: { joints: FighterJoints; row: number; col: number; classId: FighterClass }[] = [];

    // Create 16 showcase characters
    // X goes from -6 to 6, Z goes from -4 to 2 (offset layout)
    // Let's lay them out beautifully on the left and right background stands of the gym,
    // so in Lobby they are clearly presented. Or let's center them beautifully for maximum appreciation!
    const zOffset = [2, 0, -2, -4]; // Rows: 1, 2, 3, 4
    const xOffset = [-4.5, -1.5, 1.5, 4.5]; // Columns

    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const classId = classes[col];
        // Create 3D joints
        const joints = createFighterMesh(classId, false, false);
        
        // Position them in grid rows
        // If lobby, place them in center. If playing, place them in the background cheering!
        joints.group.position.set(xOffset[col], 0.2, zOffset[row]);
        // Turn them slightly towards camera
        joints.group.rotation.y = Math.PI;

        showcaseGroup.add(joints.group);
        showcaseFighters.push({ joints, row, col, classId });
      }
    }

    // --- 5. CORE FIGHT ZONE (PLAYER AND ENEMY FOR 'PLAYING') ---
    const fightGroup = new THREE.Group();
    scene.add(fightGroup);

    let playerJoints: FighterJoints | null = null;
    let enemyJoints: FighterJoints | null = null;

    // Visual indicators for skills
    // special ring O
    const specialRingGeo = new THREE.TorusGeometry(0.1, 0.08, 12, 32);
    specialRingGeo.rotateX(Math.PI / 2);
    const specialRingMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      transparent: true,
      opacity: 0,
      flatShading: true,
    });
    const specialRing = new THREE.Mesh(specialRingGeo, specialRingMat);
    specialRing.position.y = 0.05;
    fightGroup.add(specialRing);

    // Hitbox visualization for P (Semi-transparent red wireframe sphere)
    const hitBoxGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const hitBoxMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true,
      transparent: true,
      opacity: 0, // start invisible
    });
    const hitBoxVisual = new THREE.Mesh(hitBoxGeo, hitBoxMat);
    fightGroup.add(hitBoxVisual);

    // Floating 3D Health bar indicators (above characters' heads)
    // Simple 3D Planes for player/enemy health tags
    const createBillboardHealth = (color: string) => {
      const g = new THREE.Group();
      
      const bgGeo = new THREE.PlaneGeometry(1.2, 0.15);
      const bgMat = new THREE.MeshBasicMaterial({ color: 0x333333, depthTest: false, transparent: true, opacity: 0.8 });
      const bg = new THREE.Mesh(bgGeo, bgMat);
      g.add(bg);

      const barGeo = new THREE.PlaneGeometry(1.16, 0.11);
      const barMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(color), depthTest: false });
      const bar = new THREE.Mesh(barGeo, barMat);
      bar.position.z = 0.01;
      g.add(bar);

      g.position.y = 2.4;
      return { group: g, bar };
    };

    const playerBar = createBillboardHealth('#10b981'); // Emerald green
    const enemyBar = createBillboardHealth('#ef4444'); // Crimson red
    fightGroup.add(playerBar.group);
    fightGroup.add(enemyBar.group);

    // Dust particles
    const particleCount = 60;
    const particles: ParticleEffect[] = [];
    const particlesGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    // Initialize particles invisible
    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = -100; // Keep offscreen
      particlePositions[i * 3 + 2] = 0;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    particlesGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const pMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particlePoints = new THREE.Points(particlesGeo, pMat);
    scene.add(particlePoints);

    const triggerParticles = (
      type: 'hit' | 'punch_wave' | 'kick_wave' | 'burst' | 'dust',
      pos: THREE.Vector3,
      colorHex: string,
      count = 8
    ) => {
      const color = new THREE.Color(colorHex);
      for (let i = 0; i < count; i++) {
        // Find empty slot or overwrite oldest
        const id = Math.random().toString();
        const velocity: [number, number, number] = [
          (Math.random() - 0.5) * 5,
          type === 'burst' ? Math.random() * 6 : Math.random() * 4,
          (Math.random() - 0.5) * 5
        ];
        particles.push({
          id,
          type,
          position: [pos.x, pos.y, pos.z],
          color: colorHex,
          size: type === 'burst' ? 0.6 : 0.3,
          life: 1.0,
          maxLife: type === 'burst' ? 600 : 350,
          velocity,
        });

        if (particles.length > particleCount) {
          particles.shift();
        }
      }
    };

    // Instantiate Player and Enemy mesh Groups
    const updateFighterMeshSetup = () => {
      // Clear old
      if (playerJoints) fightGroup.remove(playerJoints.group);
      if (enemyJoints) fightGroup.remove(enemyJoints.group);

      // Create new Player
      playerJoints = createFighterMesh(stateRef.current.playerClass, false, false);
      fightGroup.add(playerJoints.group);

      // Create new Enemy (Boss vs Normal vs God)
      enemyJoints = createFighterMesh(
        stateRef.current.enemyClass,
        true,
        stateRef.current.isBossMatch,
        stateRef.current.isGodMatch
      );
      fightGroup.add(enemyJoints.group);
    };

    updateFighterMeshSetup();

    // --- 6. TIME / ANIMATION TICK LOOP ---
    let clock = new THREE.Clock();
    let animFrameId: number;

    const tick = () => {
      if (!canvasRef.current) return;
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const state = stateRef.current;

      // Update spot lights target to player/arena center
      spotRed.target = playerJoints ? playerJoints.group : boxingRing;
      spotBlue.target = enemyJoints ? enemyJoints.group : boxingRing;

      // --- SCENE ROUTING BY STATE ---
      if (state.gameState === 'LOBBY') {
        // 1. Showcase active
        showcaseGroup.visible = true;
        fightGroup.visible = false;

        // Animate grid characters matching requested state per row
        // Row 1: Idle, Row 2: Walk, Row 3: Attack, Row 4: Dance
        showcaseFighters.forEach(item => {
          const { joints, row } = item;
          let showState: 'IDLE' | 'WALK' | 'ATTACK' | 'RAPID_PUNCH' | 'RAPID_KICK' | 'DANCE' = 'IDLE';
          let attackProgress = 0;

          if (row === 0) {
            showState = 'IDLE';
          } else if (row === 1) {
            showState = 'WALK';
          } else if (row === 2) {
            showState = 'ATTACK';
            // Slow loop of attack progress
            attackProgress = (elapsed * 1.5) % 1;
          } else if (row === 3) {
            showState = 'DANCE';
          }

          updateFighterAnimations(joints, showState, elapsed + item.col, attackProgress);
        });

        // Slow cinematic rotate camera around gym
        camera.position.x = Math.sin(elapsed * 0.15) * 15;
        camera.position.z = Math.cos(elapsed * 0.15) * 15;
        camera.position.y = 6 + Math.sin(elapsed * 0.3) * 1.5;
        camera.lookAt(0, 1.2, 0);

      } else {
        // 2. Playing/Fight Zone active!
        showcaseGroup.visible = true; // Still visible, let's keep them as spectators on the stands!
        fightGroup.visible = true;

        // Reposition showcase grid fighters to sit on the spectator stand benches!
        showcaseFighters.forEach((item, index) => {
          const { joints, col, row } = item;
          // Row 1: Idle, Row 2: Walk/Cheer, Row 3: Cheering punches, Row 4: Victory dance!
          // Distribute along back wall stands beautifully (North, South, East, West stands)
          const angle = (index / showcaseFighters.length) * Math.PI * 2;
          const radius = 13.5;
          joints.group.position.set(Math.cos(angle) * radius, 0.5, Math.sin(angle) * radius);
          joints.group.rotation.y = -angle - Math.PI / 2; // Face towards the center ring

          // Cheering animations!
          let spectateState: 'IDLE' | 'WALK' | 'ATTACK' | 'DANCE' = 'IDLE';
          if (row === 0) spectateState = 'IDLE';
          else if (row === 1) spectateState = 'WALK'; // marching cheer
          else if (row === 2) spectateState = 'ATTACK'; // arm throwing hits
          else spectateState = 'DANCE'; // full dance

          updateFighterAnimations(joints, spectateState, elapsed * 1.2 + col, (elapsed * 2) % 1);
        });

        // Maintain Player/Enemy meshes
        if (!playerJoints || !enemyJoints) {
          updateFighterMeshSetup();
        }

        // COOLDOWNS
        if (state.specialSkillCooldown > 0) {
          state.specialSkillCooldown -= delta * 1000;
        }

        // --- AUTOMATIC BOT FIGHTER AI (L-KEY OR ENEMY AI) ---
        // BOT AUTO PLAY (L Key logic)
        if (state.autoPlayActive && state.playerHp > 0 && state.enemyHp > 0) {
          // Calculate distance to enemy
          const toEnemy = new THREE.Vector3().copy(state.enemyPosition).sub(state.playerPosition);
          const dist = toEnemy.length();

          // Clear keysPressed for manual
          keysPressed.current = {};

          if (dist > 1.4) {
            // Move closer
            toEnemy.normalize().multiplyScalar(state.playerVelocity.length() + 0.1);
            state.playerVelocity.copy(toEnemy).multiplyScalar(0.08);
            state.playerMoveState = 'WALK';
          } else {
            // Close enough! Attack randomly!
            state.playerVelocity.set(0, 0, 0);
            
            if (!state.attackActive) {
              const randAction = Math.random();
              state.attackActive = true;
              state.attackTimer = 0;
              
              if (randAction < 0.45) {
                state.attackType = 'P'; // Regular strike
                state.playerMoveState = 'ATTACK';
              } else if (randAction < 0.70 && state.specialSkillCooldown <= 0) {
                state.attackType = 'O'; // Power explosion
                state.playerMoveState = 'ATTACK';
                state.specialSkillCooldown = 4000;
              } else if (randAction < 0.85) {
                state.attackType = 'I'; // Rapid punches
                state.playerMoveState = 'RAPID_PUNCH';
              } else {
                state.attackType = 'K'; // Rapid kicks
                state.playerMoveState = 'RAPID_KICK';
              }
            }
          }
        }

        // --- ENEMY MOVEMENT & FIGHT AI ---
        if (state.enemyHp > 0 && state.playerHp > 0) {
          // If stunned, slide back
          if (state.enemyStunTimer > 0) {
            state.enemyStunTimer -= delta * 1000;
            state.enemyVelocity.multiplyScalar(0.85); // friction sliding
            state.enemyMoveState = 'IDLE';
          } else {
            const toPlayer = new THREE.Vector3().copy(state.playerPosition).sub(state.enemyPosition);
            const dist = toPlayer.length();

            // Rotate towards player
            state.enemyFacing = Math.atan2(toPlayer.x, toPlayer.z);

            if (dist > 1.3) {
              // Move towards player
              toPlayer.normalize();
              const enemySpeed = state.isGodMatch ? 5.2 : state.isBossMatch ? 4.2 : 3.5;
              state.enemyVelocity.copy(toPlayer).multiplyScalar(enemySpeed * delta);
              state.enemyMoveState = 'WALK';
            } else {
              // In range! Attack player!
              state.enemyVelocity.set(0, 0, 0);
              state.enemyMoveState = 'IDLE';

              if (!state.enemyAttackActive && Math.random() < 0.07) {
                state.enemyAttackActive = true;
                state.enemyAttackTimer = 0;
                
                // Red glowing slash / heavy hit
                const pColor = state.isGodMatch ? '#fbbf24' : state.isBossMatch ? '#f43f5e' : '#c084fc';
                triggerParticles('punch_wave', state.enemyPosition, pColor, 5);

                // Attack logic
                const dealDamage = state.isGodMatch ? 25 : state.isBossMatch ? 18 : 10;
                state.playerHp = Math.max(0, state.playerHp - dealDamage);
                triggerParticles('hit', state.playerPosition, '#dc2626', 12); sfx.playPunchHit();
                
                // Shake camera
                camera.position.x += (Math.random() - 0.5) * 0.4;
                camera.position.y += (Math.random() - 0.5) * 0.4;

                onUpdateHp(state.playerHp, state.playerMaxHp, state.enemyHp, state.enemyMaxHp);

                if (state.playerHp <= 0) {
                  state.gameState = 'GAMEOVER';
                  onPlayerDefeated();
                }
              }
            }
          }
        }

        // --- MANUAL KEYBOARD MOVEMENT ---
        if (!state.autoPlayActive && state.playerHp > 0 && !state.attackActive) {
          const moveVector = new THREE.Vector3();
          if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveVector.z -= 1;
          if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveVector.z += 1;
          if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveVector.x -= 1;
          if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveVector.x += 1;

          if (moveVector.lengthSq() > 0) {
            moveVector.normalize();
            const fighterSpeed = FIGHTER_CLASSES[playerClass].speed;
            state.playerVelocity.copy(moveVector).multiplyScalar(fighterSpeed * delta);
            state.playerFacing = Math.atan2(moveVector.x, moveVector.z);
            state.playerMoveState = 'WALK';
          } else {
            state.playerVelocity.set(0, 0, 0);
            state.playerMoveState = 'IDLE';
          }
        }

        // --- SIMULATE PHYSICS & VELOCITIES ---
        // Player move
        state.playerPosition.add(state.playerVelocity);
        // Enemy move
        state.enemyPosition.add(state.enemyVelocity);

        // --- BOXING RING BOUNDARIES (CRITICAL REQUIREMENT) ---
        // Player and enemy are strictly forbidden from leaving the ring ropes boundary (ringLimit = 7.2)
        const boundLimit = state.ringLimit;
        
        if (state.playerPosition.x > boundLimit) state.playerPosition.x = boundLimit;
        if (state.playerPosition.x < -boundLimit) state.playerPosition.x = -boundLimit;
        if (state.playerPosition.z > boundLimit) state.playerPosition.z = boundLimit;
        if (state.playerPosition.z < -boundLimit) state.playerPosition.z = -boundLimit;

        if (state.enemyPosition.x > boundLimit) state.enemyPosition.x = boundLimit;
        if (state.enemyPosition.x < -boundLimit) state.enemyPosition.x = -boundLimit;
        if (state.enemyPosition.z > boundLimit) state.enemyPosition.z = boundLimit;
        if (state.enemyPosition.z < -boundLimit) state.enemyPosition.z = -boundLimit;

        // Collision between Player and Enemy (Don't pass through each other)
        const distanceBetween = state.playerPosition.distanceTo(state.enemyPosition);
        const minBodyDistance = 1.1; // radius sum
        if (distanceBetween < minBodyDistance) {
          const pushDir = new THREE.Vector3().copy(state.playerPosition).sub(state.enemyPosition).normalize();
          const overlap = minBodyDistance - distanceBetween;
          // Push them apart
          state.playerPosition.addScaledVector(pushDir, overlap * 0.5);
          state.enemyPosition.addScaledVector(pushDir, -overlap * 0.5);
        }

        // Sync visual meshes to physics vectors
        if (playerJoints) {
          playerJoints.group.position.copy(state.playerPosition);
          playerJoints.group.rotation.y = state.playerFacing;
        }
        if (enemyJoints) {
          enemyJoints.group.position.copy(state.enemyPosition);
          enemyJoints.group.rotation.y = state.enemyFacing;
        }

        // --- ATTACK LOGIC & SKILL PROGRESSION (P, O, I, K) ---
        if (state.attackActive) {
          state.attackTimer += delta * 1000;
          
          // SPEED MULTIPLIER: Plays animation much faster as requested ("เล่น Animation ไวขึ้น")
          const animSpeedFactor = state.attackType === 'P' ? 2.2 : 1.5; 
          const duration = state.attackDuration / animSpeedFactor;
          const progress = Math.min(1.0, state.attackTimer / duration);

          // Render active states
          if (state.attackType === 'P') {
            state.playerMoveState = 'ATTACK';
            // Show hitbox wireframe sphere at fist position
            hitBoxVisual.visible = true;
            hitBoxMat.opacity = Math.sin(progress * Math.PI) * 0.45;
            // Place hitbox sphere slightly ahead of player towards face direction
            const hitOffset = new THREE.Vector3(0, 1.1, 1.0).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerFacing);
            hitBoxVisual.position.copy(state.playerPosition).add(hitOffset);

            // COLLISION RESOLUTION ON THE MIDDLE OF ATTACK
            if (progress > 0.3 && progress < 0.6) {
              const hitRange = 1.35;
              const distToEnemy = hitBoxVisual.position.distanceTo(state.enemyPosition);
              if (distToEnemy <= hitRange && state.enemyHp > 0) {
                // Apply hit!
                const baseDmg = FIGHTER_CLASSES[playerClass].attackPower;
                state.enemyHp = Math.max(0, state.enemyHp - baseDmg);
                state.enemyStunTimer = 400; // stun 0.4s
                // Knockback enemy backwards from player
                const knockDir = new THREE.Vector3().copy(state.enemyPosition).sub(state.playerPosition).setY(0).normalize();
                state.enemyVelocity.addScaledVector(knockDir, 4.5);

                triggerParticles('hit', state.enemyPosition, '#fbbf24', 15); sfx.playPunchHit();
                onUpdateHp(state.playerHp, state.playerMaxHp, state.enemyHp, state.enemyMaxHp);

                if (state.enemyHp <= 0) {
                  onEnemyDefeated(state.isBossMatch);
                }
              }
            }
          } 
          else if (state.attackType === 'O') {
            // SPECIAL RING ENERGY BURST - TORUS SCALE OUT
            state.playerMoveState = 'ATTACK';
            specialRing.visible = true;
            // Expand ring
            const scaleSize = progress * 6.5; // Scales out wide!
            specialRing.scale.set(scaleSize, 1, scaleSize);
            specialRing.position.copy(state.playerPosition).setY(0.08);
            specialRingMat.opacity = (1.0 - progress) * 0.9;

            // Damage enemy if caught in expanding torus wave
            if (progress > 0.1 && progress < 0.9) {
              const enemyDist = state.playerPosition.distanceTo(state.enemyPosition);
              // If enemy inside the ring's current scale radius
              if (enemyDist < scaleSize * 1.1 && enemyDist > scaleSize * 0.7 && state.enemyHp > 0) {
                const dmg = FIGHTER_CLASSES[playerClass].attackPower * 1.8; // Heavy special damage!
                state.enemyHp = Math.max(0, state.enemyHp - dmg);
                state.enemyStunTimer = 700; // heavy stun
                const pushBack = new THREE.Vector3().copy(state.enemyPosition).sub(state.playerPosition).setY(0).normalize();
                state.enemyVelocity.addScaledVector(pushBack, 7.5); // BIG push back!

                triggerParticles('burst', state.enemyPosition, '#38bdf8', 25); sfx.playBurst();
                onUpdateHp(state.playerHp, state.playerMaxHp, state.enemyHp, state.enemyMaxHp);

                if (state.enemyHp <= 0) {
                  onEnemyDefeated(state.isBossMatch);
                }
              }
            }
          }
          else if (state.attackType === 'I') {
            // RAPID PUNCHES / SLASHES
            state.playerMoveState = 'RAPID_PUNCH';
            // Rapid multiple hits
            if (Math.random() < 0.35) {
              const hitOffset = new THREE.Vector3(0, 1.1, 1.1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerFacing);
              const testHitPos = new THREE.Vector3().copy(state.playerPosition).add(hitOffset);
              const distToEnemy = testHitPos.distanceTo(state.enemyPosition);

              if (distToEnemy < 1.4 && state.enemyHp > 0) {
                const dmg = FIGHTER_CLASSES[playerClass].attackPower * 0.5; // smaller quick hits
                state.enemyHp = Math.max(0, state.enemyHp - dmg);
                state.enemyVelocity.add(new THREE.Vector3().copy(state.enemyPosition).sub(state.playerPosition).normalize().multiplyScalar(0.8));
                
                triggerParticles('hit', state.enemyPosition, '#ffffff', 8); sfx.playPunchHit();
                onUpdateHp(state.playerHp, state.playerMaxHp, state.enemyHp, state.enemyMaxHp);

                if (state.enemyHp <= 0) {
                  onEnemyDefeated(state.isBossMatch);
                }
              }
            }
          }
          else if (state.attackType === 'K') {
            // RAPID KICKS
            state.playerMoveState = 'RAPID_KICK';
            if (Math.random() < 0.3) {
              const hitOffset = new THREE.Vector3(0, 0.7, 1.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.playerFacing);
              const testHitPos = new THREE.Vector3().copy(state.playerPosition).add(hitOffset);
              const distToEnemy = testHitPos.distanceTo(state.enemyPosition);

              if (distToEnemy < 1.5 && state.enemyHp > 0) {
                const dmg = FIGHTER_CLASSES[playerClass].attackPower * 0.65;
                state.enemyHp = Math.max(0, state.enemyHp - dmg);
                state.enemyVelocity.add(new THREE.Vector3().copy(state.enemyPosition).sub(state.playerPosition).normalize().multiplyScalar(1.2));
                
                triggerParticles('kick_wave', state.enemyPosition, '#a7f3d0', 10); sfx.playKick();
                onUpdateHp(state.playerHp, state.playerMaxHp, state.enemyHp, state.enemyMaxHp);

                if (state.enemyHp <= 0) {
                  onEnemyDefeated(state.isBossMatch);
                }
              }
            }
          }

          // Complete attack action
          if (progress >= 1.0) {
            state.attackActive = false;
            hitBoxVisual.visible = false;
            specialRing.visible = false;
            state.playerMoveState = 'IDLE';
          }
          
          updateFighterAnimations(
            playerJoints!,
            state.playerMoveState,
            elapsed,
            progress,
            animSpeedFactor
          );
        } else {
          // Default movement animation updates
          updateFighterAnimations(playerJoints!, state.playerMoveState, elapsed);
        }

        // Update Enemy animation frames
        if (enemyJoints) {
          let enemyState = state.enemyMoveState;
          if (state.enemyAttackActive) {
            state.enemyAttackTimer += delta * 1000;
            if (state.enemyAttackTimer > 300) {
              state.enemyAttackActive = false;
            } else {
              enemyState = 'ATTACK';
            }
          }
          updateFighterAnimations(
            enemyJoints,
            enemyState,
            elapsed,
            state.enemyAttackTimer / 300
          );
        }

        // --- BILLBOARD HEALTHBARS ORIENTATION & VAL ---
        if (playerBar.group && playerJoints) {
          playerBar.group.position.copy(state.playerPosition).setY(2.2);
          playerBar.group.lookAt(camera.position);
          const pRatio = Math.max(0, state.playerHp / state.playerMaxHp);
          playerBar.bar.scale.set(pRatio, 1, 1);
          // Left align scaling
          playerBar.bar.position.x = -0.58 * (1 - pRatio);
        }

        if (enemyBar.group && enemyJoints) {
          enemyBar.group.position.copy(state.enemyPosition).setY(enemyJoints.isGod ? 4.1 : enemyJoints.isBoss ? 3.3 : 2.2);
          enemyBar.group.lookAt(camera.position);
          const eRatio = Math.max(0, state.enemyHp / state.enemyMaxHp);
          enemyBar.bar.scale.set(eRatio, 1, 1);
          // Left align scaling
          enemyBar.bar.position.x = -0.58 * (1 - eRatio);
        }

        // --- CAMERA FOLLOW CHARACTER (8 DIRECTIONS, SMOOTH LERP) ---
        // Keeps camera focused relative to player position inside boxing ring ropes!
        const targetCamX = state.playerPosition.x;
        const targetCamZ = state.playerPosition.z + 9.5;
        const targetCamY = 5.2;

        camera.position.x += (targetCamX - camera.position.x) * 0.08;
        camera.position.z += (targetCamZ - camera.position.z) * 0.08;
        camera.position.y += (targetCamY - camera.position.y) * 0.08;

        const lookAtTarget = new THREE.Vector3().copy(state.playerPosition).add(state.enemyPosition).multiplyScalar(0.5);
        camera.lookAt(lookAtTarget.x, 1.1, lookAtTarget.z);
      }

      // --- SIMULATE DUST/HIT PARTICLES PHYSICS ---
      const posAttr = particlesGeo.getAttribute('position') as THREE.BufferAttribute;
      const colAttr = particlesGeo.getAttribute('color') as THREE.BufferAttribute;
      const sizeAttr = particlesGeo.getAttribute('size') as THREE.BufferAttribute;

      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        if (p && p.life > 0) {
          p.life -= (delta * 1000) / p.maxLife;
          
          // update position by velocity
          p.position[0] += p.velocity[0] * delta;
          p.position[1] += p.velocity[1] * delta;
          p.position[2] += p.velocity[2] * delta;

          // gravity pulling down slowly
          p.velocity[1] -= 9.8 * delta * 0.35;

          posAttr.setXYZ(i, p.position[0], p.position[1], p.position[2]);

          const col = new THREE.Color(p.color);
          colAttr.setXYZ(i, col.r * p.life, col.g * p.life, col.b * p.life);
          sizeAttr.setX(i, p.size * p.life);
        } else {
          // Keep dead particles off-screen
          posAttr.setXYZ(i, 0, -100, 0);
          sizeAttr.setX(i, 0);
        }
      }
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;

      // Render actual frame
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    tick();

    // --- 7. HANDLE RESIZE OBSERVER ---
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup WebGL instances
    return () => {
      cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      specialRingGeo.dispose();
      specialRingMat.dispose();
      hitBoxGeo.dispose();
      hitBoxMat.dispose();
      standsGroup.children.forEach(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
          else child.material.dispose();
        }
      });
      crowdParticlesGeo.dispose();
      crowdMat.dispose();
      pMat.dispose();
      particlesGeo.dispose();
    };
  }, [gameState, playerClass, currentStage, enemyClass]);

  // Handle auto-play triggers for mobile/visual interface
  const triggerManualAction = (type: 'P' | 'O' | 'I' | 'K') => {
    if (stateRef.current.gameState !== 'PLAYING') return;
    if (stateRef.current.autoPlayActive) return;
    if (stateRef.current.attackActive) return;

    stateRef.current.attackActive = true;
    stateRef.current.attackType = type;
    stateRef.current.attackTimer = 0;
    
    if (type === 'P') {
      stateRef.current.playerMoveState = 'ATTACK';
    } else if (type === 'O') {
      stateRef.current.playerMoveState = 'ATTACK';
      stateRef.current.specialSkillCooldown = 4000;
    } else if (type === 'I') {
      stateRef.current.playerMoveState = 'RAPID_PUNCH';
    } else if (type === 'K') {
      stateRef.current.playerMoveState = 'RAPID_KICK';
    }
  };

  return (
    <div id="three-container" ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#090d16]">
      <canvas id="game-canvas" ref={canvasRef} className="w-full h-full block" />

      {/* Auto play notification overlay */}
      {autoPlayActive && autoPlayTimer > 0 && (
        <div id="auto-play-banner" className="absolute top-24 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-slate-950 font-bold px-6 py-2 rounded-full shadow-lg flex items-center gap-3 backdrop-blur-sm z-30 animate-pulse border border-yellow-300">
          <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
          <span>บอทช่วยเล่นอัตโนมัติทำงาน: {autoPlayTimer} วินาที</span>
        </div>
      )}

      {/* Mobile/Virtual Action Buttons overlay to make the game extremely accessible */}
      {gameState === 'PLAYING' && !autoPlayActive && (
        <div id="visual-controller-help" className="absolute bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 flex flex-wrap gap-2.5 justify-center pointer-events-auto z-20">
          <button
            id="btn-p"
            onClick={() => triggerManualAction('P')}
            className="flex flex-col items-center justify-center w-14 h-14 bg-red-600/90 hover:bg-red-500 text-white font-black rounded-full shadow-md border-2 border-red-400 active:scale-95 transition-all"
            title="ต่อยหรือโจมตีปกติ"
          >
            <span className="text-sm">P</span>
            <span className="text-[9px] font-normal">โจมตี</span>
          </button>

          <button
            id="btn-i"
            onClick={() => triggerManualAction('I')}
            className="flex flex-col items-center justify-center w-14 h-14 bg-amber-500/90 hover:bg-amber-400 text-slate-950 font-black rounded-full shadow-md border-2 border-amber-300 active:scale-95 transition-all"
            title="ต่อยรัว หรือ ฟันรัว"
          >
            <span className="text-sm">I</span>
            <span className="text-[9px] font-normal">รัวหมัด</span>
          </button>

          <button
            id="btn-k"
            onClick={() => triggerManualAction('K')}
            className="flex flex-col items-center justify-center w-14 h-14 bg-emerald-600/90 hover:bg-emerald-500 text-white font-black rounded-full shadow-md border-2 border-emerald-400 active:scale-95 transition-all"
            title="เตะรัวๆ"
          >
            <span className="text-sm">K</span>
            <span className="text-[9px] font-normal">เตะรัว</span>
          </button>

          <button
            id="btn-o"
            onClick={() => triggerManualAction('O')}
            className="flex flex-col items-center justify-center w-14 h-14 bg-sky-500/90 hover:bg-sky-400 text-slate-950 font-black rounded-full shadow-md border-2 border-sky-300 active:scale-95 transition-all"
            title="ระเบิดพลัง วงแหวนขยาย"
          >
            <span className="text-sm">O</span>
            <span className="text-[9px] font-normal">สกิลระเบิด</span>
          </button>
        </div>
      )}
    </div>
  );
};
