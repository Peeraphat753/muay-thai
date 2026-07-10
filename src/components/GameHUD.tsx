import React from 'react';
import { FighterClass, FIGHTER_CLASSES, FighterStats, GameState } from '../types';
import { Shield, Swords, Zap, Award, Target, Trophy, Play, RefreshCw, Bot, User, ArrowRight, HelpCircle } from 'lucide-react';

interface GameHUDProps {
  gameState: GameState;
  playerClass: FighterClass;
  setPlayerClass: (c: FighterClass) => void;
  currentStage: number;
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemyClass: FighterClass;
  autoPlayActive: boolean;
  triggerAutoPlay: () => void;
  onStartGame: () => void;
  onRestartLobby: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  playerClass,
  setPlayerClass,
  currentStage,
  playerHp,
  playerMaxHp,
  enemyHp,
  enemyMaxHp,
  enemyClass,
  autoPlayActive,
  triggerAutoPlay,
  onStartGame,
  onRestartLobby,
}) => {
  const selectedFighter = FIGHTER_CLASSES[playerClass];
  const enemyFighter = FIGHTER_CLASSES[enemyClass];

  const playerHpPercent = Math.max(0, (playerHp / playerMaxHp) * 100);
  const enemyHpPercent = Math.max(0, (enemyHp / enemyMaxHp) * 100);

  // Render correct title for enemy
  const isBoss10 = currentStage === 10;
  const isBoss20 = currentStage === 20;
  const isBoss = isBoss10 || isBoss20;
  const enemyName = isBoss20 
    ? 'เทพเจ้านักมวย (GOD OF BOXERS) ⚡' 
    : isBoss10 
      ? 'ราชาแห่งนักมวย (BOXING KING) 👑' 
      : `มอนสเตอร์ ${FIGHTER_CLASSES[enemyClass].nameTh}`;

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10 font-sans text-slate-100">
      
      {/* ================= HEADER: HEALTH BARS ================= */}
      {gameState === 'PLAYING' && (
        <div id="top-health-bars" className="w-full max-w-4xl mx-auto flex flex-col gap-1.5 pointer-events-auto mt-2">
          {/* Dual Bar Layout */}
          <div className="grid grid-cols-12 items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-800 shadow-2xl">
            
            {/* Player Side */}
            <div className="col-span-5 flex flex-col">
              <div className="flex justify-between items-end mb-1">
                <span className="font-bold text-emerald-400 text-sm md:text-base flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {selectedFighter.nameTh} <span className="text-xs text-slate-400">({selectedFighter.name})</span>
                </span>
                <span className="font-mono text-xs text-emerald-300">
                  {Math.round(playerHp)} / {playerMaxHp} HP
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden border border-slate-700 p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-150 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  style={{ width: `${playerHpPercent}%` }}
                />
              </div>
            </div>

            {/* Stage Timer / Versus Counter */}
            <div className="col-span-2 flex flex-col items-center justify-center text-center px-1">
              {isBoss ? (
                <div className={`${isBoss20 ? 'bg-amber-950/90 text-amber-300 border-amber-500' : 'bg-red-950/90 text-red-400 border-red-600'} border px-2.5 py-1 rounded-md shadow-lg animate-pulse`}>
                  <span className="font-black text-xs md:text-sm tracking-widest block">{isBoss20 ? 'GOD' : 'BOSS'}</span>
                </div>
              ) : (
                <div className="bg-amber-950/90 text-amber-300 border border-amber-600/50 px-2.5 py-0.5 rounded-md">
                  <span className="font-bold text-xs block">STAGE</span>
                  <span className="font-mono text-sm md:text-base font-black">{currentStage} / 20</span>
                </div>
              )}
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">VS</span>
            </div>

            {/* Enemy Side */}
            <div className="col-span-5 flex flex-col">
              <div className="flex justify-between items-end mb-1 flex-row-reverse">
                <span className={`font-bold text-sm md:text-base flex items-center gap-1.5 flex-row-reverse ${isBoss ? 'text-rose-500 animate-pulse' : 'text-purple-400'}`}>
                  <Swords className="w-4 h-4" />
                  {enemyName}
                </span>
                <span className={`font-mono text-xs ${isBoss ? 'text-rose-300' : 'text-purple-300'}`}>
                  {Math.round(enemyHp)} / {enemyMaxHp} HP
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3.5 rounded-full overflow-hidden border border-slate-700 p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-150 ${isBoss ? 'bg-gradient-to-l from-rose-600 to-amber-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-gradient-to-l from-purple-500 to-rose-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]'}`}
                  style={{ width: `${enemyHpPercent}%` }}
                />
              </div>
            </div>

          </div>

          {/* Prompt controls reminder */}
          <div className="flex justify-between items-center px-2 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              บังคับเดิน: <b className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">W A S D</b> หรือ <b className="text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded">Arrow Keys</b>
            </span>
            <div className="flex gap-2">
              <span><b>P</b>: โจมตีเร็ว (ปล่อย Hit Box)</span>
              <span><b>O</b>: ระเบิดพลังวงแหวน</span>
              <span><b>I</b>/<b>K</b>: รัวหมัด/เตะรัว</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= LOBBY SCREEN (CHARACTER SELECTION) ================= */}
      {gameState === 'LOBBY' && (
        <div id="character-lobby" className="w-full max-w-4xl mx-auto my-auto flex flex-col gap-6 pointer-events-auto bg-slate-950/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border-2 border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]">
          
          <div className="text-center flex flex-col gap-1 border-b border-slate-800 pb-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-sky-400 tracking-wider">
              🥊 3D BOXING ARENA (สนามมวย 3D) 🥊
            </h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto mt-1">
              ยินดีต้อนรับสู่ยิมฝึกมวย 3D ด้านล่างแสดงตัวละครทั้ง 4 คลาสในอิริยาบถต่างๆ ทั้ง 4 แถว
              เลือกนักชกตัวโปรดเพื่อลงสังเวียนต่อสู้กับคู่ชกเพื่อก้าวขึ้นสู่ราชาแห่งนักมวย!
            </p>
          </div>

          {/* Grid Layout of the selectable classes */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {(Object.keys(FIGHTER_CLASSES) as FighterClass[]).map((classKey) => {
              const info = FIGHTER_CLASSES[classKey];
              const isSelected = playerClass === classKey;

              return (
                <div
                  key={classKey}
                  onClick={() => setPlayerClass(classKey)}
                  className={`cursor-pointer rounded-2xl p-4 flex flex-col justify-between transition-all relative border-2 ${isSelected ? 'bg-slate-900 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'}`}
                >
                  {/* Select indicator */}
                  {isSelected && (
                    <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded-full text-[10px] tracking-wider animate-pulse">
                      SELECTED
                    </span>
                  )}

                  <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-widest font-black text-slate-500">CLASS</span>
                    <h3 className="text-lg font-bold text-slate-100 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                      {info.nameTh}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-3">
                      {info.description}
                    </p>
                  </div>

                  {/* Character Stats indicators */}
                  <div className="flex flex-col gap-1.5 border-t border-slate-800/80 pt-3 mt-4 text-[11px]">
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-emerald-400" /> HP:</span>
                      <span className="font-mono font-bold text-emerald-300">{info.hp}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="flex items-center gap-1"><Swords className="w-3 h-3 text-rose-400" /> ATK:</span>
                      <span className="font-mono font-bold text-rose-300">{info.attackPower}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-sky-400" /> SPEED:</span>
                      <span className="font-mono font-bold text-sky-300">{info.speed}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Showcase rows representation guide */}
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
            <div>🧍 <b>แถวที่ 1 (Row 1):</b> ยืนนิ่งๆ (Idle)</div>
            <div>🏃 <b>แถวที่ 2 (Row 2):</b> เดิน (Walk)</div>
            <div>👊 <b>แถวที่ 3 (Row 3):</b> โจมตี (Attack)</div>
            <div>🕺 <b>แถวที่ 4 (Row 4):</b> เต้น (Dance)</div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col md:flex-row gap-3 justify-center items-center mt-2 pt-2 border-t border-slate-800">
            <button
              onClick={onStartGame}
              className="w-full md:w-56 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-slate-950 hover:text-slate-950 font-black py-4.5 px-8 rounded-xl shadow-lg shadow-rose-950/40 text-sm tracking-wider flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span>ก้าวขึ้นสังเวียนไฟต์!</span>
            </button>
          </div>

        </div>
      )}

      {/* ================= GAME OVER / DEFEAT SPLASH SCREEN ================= */}
      {gameState === 'GAMEOVER' && (
        <div id="defeat-splash" className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 pointer-events-auto bg-slate-950/95 backdrop-blur-md p-8 rounded-3xl border-2 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.4)] text-center">
          
          <div className="flex flex-col gap-2">
            <span className="text-red-500 font-extrabold text-lg uppercase tracking-widest animate-pulse">K.O.</span>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600">
              คุณพ่ายแพ้การประลอง!
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              มอนสเตอร์ได้น็อคเอาท์คุณล้มลงกับพื้นเวที... อย่ายอมแพ้! ลุกขึ้นฝึกซ้อมแล้วก้าวกลับคืนสังเวียนอีกครั้ง!
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">คลาสของคุณ:</span>
              <span className="text-slate-200 font-bold">{selectedFighter.nameTh}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">เอาชนะได้สะสม:</span>
              <span className="text-amber-400 font-bold">{currentStage - 1} ครั้ง</span>
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              onClick={onRestartLobby}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-6 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>กลับสู่หน้าล็อบบี้</span>
            </button>
          </div>

        </div>
      )}

      {/* ================= VICTORY / STAGE CLEAR SPLASH SCREEN ================= */}
      {gameState === 'VICTORY' && (
        <div id="victory-splash" className="w-full max-w-md mx-auto my-auto flex flex-col gap-6 pointer-events-auto bg-slate-950/95 backdrop-blur-md p-8 rounded-3xl border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)] text-center">
          
          <div className="flex flex-col gap-2">
            <span className="text-amber-400 font-extrabold text-lg uppercase tracking-widest animate-bounce">VICTORY</span>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              {currentStage === 20 
                ? '⚡ มหาเทพสังเวียนไร้พ่าย! ⚡' 
                : currentStage === 10 
                  ? '👑 แชมเปี้ยนแห่งเวที! 👑' 
                  : 'ชนะการประลอง!'}
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              {currentStage === 20 
                ? 'ยินดีด้วยอย่างสูงที่สุด! คุณเอาชนะ "เทพเจ้านักมวย" ลงได้สำเร็จ และก้าวเข้าสู่ความเป็นตำนานอันเป็นนิรันดร์!' 
                : currentStage === 10 
                  ? 'สุดยอด! คุณโค่นล้ม "ราชาแห่งนักมวย" ได้เป็นผลสำเร็จ! บัดนี้ประตูด่านถัดไปสู่แดนสวรรค์มวยไทยได้เปิดออกแล้ว!'
                  : `ยอดเยี่ยม! คุณเอาชนะมอนสเตอร์ได้ในรอบนี้ และฟื้นฟูร่างกายเพื่อสู้ในสเตจถัดไป`
              }
            </p>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 flex flex-col gap-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">นักชกของคุณ:</span>
              <span className="text-emerald-400 font-bold">{selectedFighter.nameTh}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ชนะรวมสะสม:</span>
              <span className="text-amber-400 font-bold">{currentStage} ครั้ง</span>
            </div>
            {currentStage < 10 && (
              <div className="flex justify-between text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/50">
                <span>(สู้ชนะสะสมครบ 10 ครั้ง เพื่อท้าดวลบอสใหญ่ ราชาแห่งนักมวย!)</span>
              </div>
            )}
            {currentStage >= 10 && currentStage < 20 && (
              <div className="flex justify-between text-[11px] text-amber-400 italic pt-1 border-t border-slate-800/50">
                <span>(สู้ชนะสะสมครบ 20 ครั้ง เพื่อท้าดวลสุดยอดบอส เทพเจ้านักมวย!)</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            {currentStage === 20 ? (
              <button
                onClick={onRestartLobby}
                className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black py-4 px-6 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Trophy className="w-4 h-4 text-slate-950 fill-slate-950" />
                <span>เล่นอีกครั้ง (กลับหน้าล็อบบี้)</span>
              </button>
            ) : (
              <button
                onClick={onStartGame}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black py-4 px-6 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <span>ก้าวไปสเตจถัดไป ({currentStage + 1}/20)</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* ================= BOTTOM PERSISTENT HUD: COOLDOWNS & AUTO PLAY TRIGGER ================= */}
      {gameState === 'PLAYING' && (
        <div id="playing-bottom-bar" className="w-full max-w-4xl mx-auto flex justify-between items-end pointer-events-auto mb-2 bg-slate-950/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-800 shadow-2xl">
          
          {/* Controls Quick reference (Left) */}
          <div className="flex gap-2.5 items-center">
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 font-black w-6 h-6 rounded flex items-center justify-center text-xs border border-slate-700 shadow-inner">P</span>
              <span className="text-[11px] text-slate-400">โจมตี</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 font-black w-6 h-6 rounded flex items-center justify-center text-xs border border-slate-700 shadow-inner">O</span>
              <span className="text-[11px] text-slate-400">ระเบิดพลัง</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 font-black w-6 h-6 rounded flex items-center justify-center text-xs border border-slate-700 shadow-inner">I</span>
              <span className="text-[11px] text-slate-400">รัวหมัด</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-800 text-slate-300 font-black w-6 h-6 rounded flex items-center justify-center text-xs border border-slate-700 shadow-inner">K</span>
              <span className="text-[11px] text-slate-400">เตะรัว</span>
            </div>
          </div>

          {/* Auto Bot Helper Control (Right) */}
          <div className="flex items-center gap-3">
            <button
              id="btn-auto-fight"
              onClick={triggerAutoPlay}
              disabled={autoPlayActive}
              className={`flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl font-bold text-xs transition-all border shadow-lg ${autoPlayActive ? 'bg-amber-500/35 border-amber-500/50 text-amber-300 animate-pulse' : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-slate-600 text-slate-200 cursor-pointer active:scale-95'}`}
            >
              <Bot className="w-4 h-4" />
              <span>{autoPlayActive ? '🤖 บอทกำลังต่อสู้...' : 'กด L: บอทต่อสู้ 30 วิ'}</span>
            </button>
            <button
              onClick={onRestartLobby}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold px-3.5 py-2.5 rounded-xl text-xs cursor-pointer active:scale-95 transition-all"
            >
              หนี/ล็อบบี้
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
