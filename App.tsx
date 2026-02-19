import React, { useRef, useState, useEffect, useCallback } from 'react';
import GameScene from './components/GameScene';
import HandController from './components/HandController';
import { HandControls, GameStatus } from './types';

function App() {
  const controlsRef = useRef<HandControls>({
    x: 0,
    y: 0,
    isFlying: false,
    isDetected: false
  });

  const [gameStatus, setGameStatus] = useState<GameStatus>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('neon_flight_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Score loop based on survival
  useEffect(() => {
    let interval: number;
    if (gameStatus === 'PLAYING') {
      interval = window.setInterval(() => {
        if (controlsRef.current.isFlying) {
             setScore(s => s + 10);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameStatus]);

  const handleStart = () => {
    setScore(0);
    setGameStatus('PLAYING');
  };

  const handleGameOver = useCallback(() => {
    setGameStatus('GAME_OVER');
    setHighScore(prev => {
      const newHigh = Math.max(prev, score);
      localStorage.setItem('neon_flight_highscore', newHigh.toString());
      return newHigh;
    });
  }, [score]);

  const handleAddScore = useCallback((points: number) => {
    setScore(s => s + points);
  }, []);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden font-mono text-white select-none">
      
      {/* Game Layer */}
      <div className="absolute inset-0 z-0">
         <GameScene 
            controlsRef={controlsRef} 
            gameStatus={gameStatus}
            onGameOver={handleGameOver}
            onScore={handleAddScore}
         />
      </div>

      {/* UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header HUD */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 drop-shadow-lg" style={{filter: 'drop-shadow(0 0 10px rgba(0,255,255,0.5))'}}>
              NEON FLIGHT
            </h1>
            <div className="mt-2 text-xl font-bold font-mono text-white">
               SCORE: <span className="text-cyan-400">{score.toLocaleString()}</span>
            </div>
            {highScore > 0 && (
                <div className="text-xs text-white/50">HI: {highScore.toLocaleString()}</div>
            )}
          </div>
          
          <div className="text-right flex flex-col items-end gap-2">
             <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
               <div className={`w-2 h-2 rounded-full ${gameStatus === 'PLAYING' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`} />
               <span className="text-xs font-bold text-white/70">
                 {gameStatus === 'PLAYING' ? 'LIVE FEED' : 'OFFLINE'}
               </span>
             </div>
             {gameStatus === 'PLAYING' && (
                 <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded text-xs text-yellow-400 border border-yellow-400/20">
                    OBJ: COLLECT SHARDS
                 </div>
             )}
          </div>
        </div>

        {/* MENU SCREEN */}
        {gameStatus === 'MENU' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-black/40 backdrop-blur-sm">
             <div className="bg-black/80 border border-cyan-500/50 p-8 rounded-2xl max-w-md text-center shadow-[0_0_50px_rgba(0,255,255,0.2)]">
                <h2 className="text-2xl font-bold mb-4 text-white">SYSTEM READY</h2>
                <p className="mb-6 text-gray-300">
                  Avoid the buildings. Collect the gold shards.<br/>
                  Speed increases over time.
                </p>
                
                <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                   <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <div className="text-2xl mb-2">🤟</div>
                      <div className="font-bold text-pink-400">"LOVE"</div>
                      <div className="text-xs text-gray-400">Boost Speed</div>
                   </div>
                   <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <div className="text-2xl mb-2">✋</div>
                      <div className="font-bold text-cyan-400">"PLANE"</div>
                      <div className="text-xs text-gray-400">Normal Flight</div>
                   </div>
                </div>

                <button 
                  onClick={handleStart}
                  className="w-full px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg text-lg tracking-widest"
                >
                  LAUNCH
                </button>
             </div>
          </div>
        )}

        {/* GAME OVER SCREEN */}
        {gameStatus === 'GAME_OVER' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto bg-red-900/20 backdrop-blur-sm">
             <div className="bg-black/90 border border-red-500 p-8 rounded-2xl max-w-md text-center shadow-[0_0_50px_rgba(255,0,0,0.4)]">
                <h2 className="text-4xl font-black mb-2 text-red-500 italic tracking-tighter">CRITICAL FAILURE</h2>
                <div className="text-6xl font-mono mb-6 text-white">{score.toLocaleString()}</div>
                
                <div className="flex flex-col gap-3">
                    <button 
                    onClick={handleStart}
                    className="w-full px-8 py-3 bg-white text-black rounded font-bold hover:scale-105 transition-transform"
                    >
                    REBOOT SYSTEM
                    </button>
                    <button 
                    onClick={() => setGameStatus('MENU')}
                    className="w-full px-8 py-3 bg-transparent border border-white/20 text-white rounded hover:bg-white/10 transition-colors"
                    >
                    MAIN MENU
                    </button>
                </div>
             </div>
          </div>
        )}

        {/* Footer / Status */}
        <div className="flex justify-between items-end opacity-50">
          <div className="space-y-1">
             <div className="text-xs text-gray-500 uppercase tracking-widest">Controls</div>
             <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded border border-white/20 flex items-center justify-center bg-white/5">✋</div>
                   <span>Move</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded border border-pink-500/50 flex items-center justify-center bg-pink-500/10">🤟</div>
                   <span className="text-pink-400">Fast</span>
                </div>
             </div>
          </div>
        </div>

      </div>

      {/* Logic Layer */}
      <HandController controlsRef={controlsRef} />
    </div>
  );
}

export default App;