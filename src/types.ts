export type FighterClass = 'thai_boxer' | 'intl_boxer' | 'soldier' | 'samurai';

export interface FighterStats {
  id: FighterClass;
  name: string;
  nameTh: string;
  description: string;
  color: string;
  weaponColor: string;
  hp: number;
  maxHp: number;
  attackPower: number;
  speed: number;
}

export const FIGHTER_CLASSES: Record<FighterClass, FighterStats> = {
  thai_boxer: {
    id: 'thai_boxer',
    name: 'Muay Thai Boxer',
    nameTh: 'นักมวยไทย',
    description: 'Master of Eight Limbs. Wears the traditional Mongkhon headband, sacred Sak Yant tattoos, and red boxing gloves. Specializes in swift kicks and rapid elbows.',
    color: '#e11d48', // Crimson red
    weaponColor: '#fda4af',
    hp: 120,
    maxHp: 120,
    attackPower: 14,
    speed: 5.5,
  },
  intl_boxer: {
    id: 'intl_boxer',
    name: 'Classic Boxer',
    nameTh: 'มวยสากล',
    description: 'The sweet science champion. Wears heavy padded blue gloves, high boots, and protective headgear. Known for quick jabs and powerful heavy punches.',
    color: '#2563eb', // Royal blue
    weaponColor: '#93c5fd',
    hp: 150,
    maxHp: 150,
    attackPower: 12,
    speed: 5.0,
  },
  soldier: {
    id: 'soldier',
    name: 'Elite Soldier',
    nameTh: 'ทหารเสือ',
    description: 'Modern tactical fighter. Wears military green uniform, helmet, combat boots, and tactical gloves. Combines militarized striking and heavy endurance.',
    color: '#15803d', // Jungle green
    weaponColor: '#a7f3d0',
    hp: 130,
    maxHp: 130,
    attackPower: 13,
    speed: 5.2,
  },
  samurai: {
    id: 'samurai',
    name: 'Ronin Samurai',
    nameTh: 'ซามูไร',
    description: 'Disciplined warrior of the East. Wears a classic Kabuto helmet, red-and-gold armor trims, and wields a gleaming 3D Katana blade. Deadly with rapid slashes.',
    color: '#d97706', // Amber gold
    weaponColor: '#ffffff',
    hp: 110,
    maxHp: 110,
    attackPower: 16,
    speed: 5.8,
  },
};

export type GameState = 'LOBBY' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';

export interface ParticleEffect {
  id: string;
  type: 'hit' | 'punch_wave' | 'kick_wave' | 'burst' | 'dust';
  position: [number, number, number];
  color: string;
  size: number;
  life: number; // 0 to 1
  maxLife: number; // in ms
  velocity: [number, number, number];
}
