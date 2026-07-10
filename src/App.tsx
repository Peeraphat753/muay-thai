import { useState, useEffect, useCallback } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { GameHUD } from './components/GameHUD';
import { FighterClass, GameState, FIGHTER_CLASSES } from './types';
import { sfx } from './utils/audio';
import { Swords, Trophy, Sparkles, Volume2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('LOBBY');
  const [playerClass, setPlayerClass] = useState<FighterClass>('thai_boxer');
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [enemyClass, setEnemyClass] = useState<FighterClass>('intl_boxer');
  
  // Health states for React rendering (mirrored from ThreeJS canvas engine)
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerMaxHp, setPlayerMaxHp] = useState<number>(100);
  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [enemyMaxHp, setEnemyMaxHp] = useState<number>(100);

  // Auto-play state
  const [autoPlayActive, setAutoPlayActive] = useState<boolean>(false);

  // Custom alert notifications (fading banners for moves/events)
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = useCallback((msg: string) => {
    setNotification(msg);
    // Auto clear after 2.5s
    const t = setTimeout(() => {
      setNotification((prev) => (prev === msg ? null : prev));
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  // Choose a random enemy class that is ideally different from player class
  const pickRandomEnemyClass = useCallback((pClass: FighterClass): FighterClass => {
    const list: FighterClass[] = ['thai_boxer', 'intl_boxer', 'soldier', 'samurai'];
    const filtered = list.filter((c) => c !== pClass);
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }, []);

  // Start a new fight round
  const handleStartGame = () => {
    // Pick enemy class
    const nextEnemy = pickRandomEnemyClass(playerClass);
    setEnemyClass(nextEnemy);

    // Reset health percentages
    const pStats = FIGHTER_CLASSES[playerClass];
    setPlayerHp(pStats.hp);
    setPlayerMaxHp(pStats.hp);

    const isBoss10 = currentStage === 10;
    const isBoss20 = currentStage === 20;
    if (isBoss20) {
      setEnemyHp(500);
      setEnemyMaxHp(500);
    } else if (isBoss10) {
      setEnemyHp(300);
      setEnemyMaxHp(300);
    } else {
      const eStats = FIGHTER_CLASSES[nextEnemy];
      const hpMultiplier = 1 + (currentStage - 1) * 0.15;
      const finalHp = Math.round(eStats.hp * hpMultiplier);
      setEnemyHp(finalHp);
      setEnemyMaxHp(finalHp);
    }

    setGameState('PLAYING');
    triggerNotification(`🥊 ROUND START! ชกมวยรอบที่ ${currentStage} เริ่มขึ้นแล้ว! 🥊`);
  };

  // Move back to Lobby / Main menu
  const handleRestartLobby = () => {
    setGameState('LOBBY');
    setCurrentStage(1);
    setAutoPlayActive(false);
    setNotification(null);
  };

  // Sync health indicators from inside the ThreeJS thread loop
  const handleUpdateHp = (pHp: number, pMax: number, eHp: number, eMax: number) => {
    setPlayerHp(pHp);
    setPlayerMaxHp(pMax);
    setEnemyHp(eHp);
    setEnemyMaxHp(eMax);
  };

  // When player defeats enemy
  const handleEnemyDefeated = (isBoss: boolean) => {
    // Play win fanfare!
    sfx.playVictory();

    if (currentStage === 20) {
      setGameState('VICTORY');
      triggerNotification('🏆 มหาเทพแห่งสังเวียน! คุณพิชิต "เทพเจ้านักมวย" ลงได้อย่างสมบูรณ์แบบไร้ที่ติ!');
    } else if (currentStage === 10) {
      setGameState('VICTORY');
      triggerNotification('🏆 แชมป์ไร้พ่าย! คุณพิชิต "ราชาแห่งนักมวย" ลงได้อย่างสมศักดิ์ศรี!');
    } else {
      setGameState('VICTORY');
      triggerNotification('🎉 ชนะการประลอง! คุณได้น็อคเอาท์คู่ชกสำเร็จ!');
      // Prepare next stage index (will increment when clicking next round)
    }
  };

  // When player is defeated
  const handlePlayerDefeated = () => {
    sfx.playDefeat();
    setGameState('GAMEOVER');
    triggerNotification('💀 K.O. คุณพ่ายแพ้ สลบคาเวทีมวย!');
  };

  // Advance Stage logic
  const handleAdvanceStage = () => {
    const nextStage = currentStage + 1;
    setCurrentStage(nextStage);
    
    // Pick next enemy
    const nextEnemy = pickRandomEnemyClass(playerClass);
    setEnemyClass(nextEnemy);

    // Reset HP
    const pStats = FIGHTER_CLASSES[playerClass];
    setPlayerHp(pStats.hp);
    setPlayerMaxHp(pStats.hp);

    const isBoss10 = nextStage === 10;
    const isBoss20 = nextStage === 20;
    if (isBoss20) {
      setEnemyHp(500);
      setEnemyMaxHp(500);
    } else if (isBoss10) {
      setEnemyHp(300);
      setEnemyMaxHp(300);
    } else {
      const eStats = FIGHTER_CLASSES[nextEnemy];
      const hpMultiplier = 1 + (nextStage - 1) * 0.15;
      const finalHp = Math.round(eStats.hp * hpMultiplier);
      setEnemyHp(finalHp);
      setEnemyMaxHp(finalHp);
    }

    setGameState('PLAYING');
    triggerNotification(`🥊 เริ่มยกถัดไป! STAGE ${nextStage}/20 🥊`);
  };

  // Trigger auto play manually or via key
  const triggerAutoPlay = () => {
    if (gameState !== 'PLAYING') return;
    setAutoPlayActive(true);
  };

  const handleAutoPlayTimeout = () => {
    setAutoPlayActive(false);
  };

  // Global key listening for utility keys
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // key L toggles auto play
      if (key === 'l' && gameState === 'PLAYING' && !autoPlayActive) {
        triggerAutoPlay();
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [gameState, autoPlayActive]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090d16] select-none text-slate-100 flex flex-col">
      
      {/* Top Notification Banner */}
      {notification && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-md px-6 py-3.5 bg-slate-950/90 border-2 border-amber-500 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.45)] backdrop-blur-md flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <span className="text-xs md:text-sm font-black tracking-wide text-amber-300 whitespace-nowrap">
            {notification}
          </span>
        </div>
      )}

      {/* Background Sound FX Helper Indicator in Lobby */}
      {gameState === 'LOBBY' && (
        <div className="absolute top-4 right-4 z-40 bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded-full py-1.5 px-3 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
          <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>ระบบเสียงสังเคราะห์ Web Audio ทำงาน</span>
        </div>
      )}

      {/* 3D WebGL Canvas Module */}
      <div className="w-full h-full flex-grow relative">
        <ThreeCanvas
          gameState={gameState}
          playerClass={playerClass}
          winCount={currentStage - 1}
          autoPlayActive={autoPlayActive}
          onAutoPlayTimeout={handleAutoPlayTimeout}
          onUpdateHp={handleUpdateHp}
          onEnemyDefeated={handleEnemyDefeated}
          onPlayerDefeated={handlePlayerDefeated}
          currentStage={currentStage}
          enemyClass={enemyClass}
          setEnemyClass={setEnemyClass}
          triggerNotification={triggerNotification}
        />
      </div>

      {/* Overlay HUD / Screen states */}
      <GameHUD
        gameState={gameState}
        playerClass={playerClass}
        setPlayerClass={setPlayerClass}
        currentStage={currentStage}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        enemyHp={enemyHp}
        enemyMaxHp={enemyMaxHp}
        enemyClass={enemyClass}
        autoPlayActive={autoPlayActive}
        triggerAutoPlay={triggerAutoPlay}
        onRestartLobby={handleRestartLobby}
        // Custom conditional next action
        onStartGame={gameState === 'VICTORY' && currentStage < 20 ? handleAdvanceStage : handleStartGame}
      />
    </div>
  );
}
