
import React, { useState } from 'react';
import { Lock, ChevronLeft, Map, Crosshair, Skull, TrendingUp } from 'lucide-react';
import { SECTORS } from '../sectors';

interface LevelSelectProps {
  onSelect: (level: number) => void;
  onBack: () => void;
  currentUnlocked: number;
}

const LevelSelect: React.FC<LevelSelectProps> = ({ onSelect, onBack, currentUnlocked }) => {
  const totalSectors = 30;

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-950 p-4 overflow-hidden">
      <div className="max-w-5xl w-full bg-black border-2 border-cyan-500 p-8 relative shadow-[0_0_30px_rgba(6,182,212,0.2)] max-h-[90vh] flex flex-col">
        <div className="absolute -top-4 left-10 bg-cyan-600 px-4 py-1 text-white font-black italic font-orbitron uppercase text-sm">Tactical Interface v5.0</div>
        
        <div className="flex justify-between items-center mb-8 border-b border-cyan-900 pb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase font-orbitron">
              SELECT <span className="text-cyan-400">SECTOR</span>
            </h2>
          </div>
          <button 
            onClick={onBack}
            className="text-cyan-400 hover:text-white transition-colors font-bold uppercase text-sm border border-cyan-500/30 px-4 py-1 font-orbitron"
          >
            Back to HQ
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 mb-8 scrollbar-thin scrollbar-thumb-cyan-500 scrollbar-track-black">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {SECTORS.map((sector) => {
              const levelNum = sector.id;
              const isUnlocked = levelNum === 1 || levelNum <= currentUnlocked;
              const isBoss = !!sector.boss;
              
              return (
                <button
                  key={levelNum}
                  disabled={!isUnlocked}
                  onClick={() => onSelect(levelNum)}
                  className={`relative group h-32 flex flex-col items-center justify-center border-2 transition-all overflow-hidden ${
                    isUnlocked 
                      ? 'border-cyan-800 bg-black hover:border-cyan-400 hover:bg-cyan-900/40 cursor-pointer shadow-[inset_0_0_10px_rgba(6,182,212,0.1)]' 
                      : 'border-gray-900 bg-gray-950 cursor-not-allowed opacity-40 grayscale'
                  }`}
                >
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                      <Lock className="w-4 h-4 text-gray-700" />
                    </div>
                  )}
                  <div className="absolute top-1 left-1 text-[8px] text-cyan-600 font-mono uppercase">SEC_{levelNum.toString().padStart(2, '0')}</div>
                  
                  <span className={`text-3xl font-black font-orbitron ${isUnlocked ? 'text-white group-hover:text-cyan-400' : 'text-gray-700'}`}>
                    {levelNum}
                  </span>
                  
                  <span className={`text-[10px] uppercase tracking-widest font-bold mt-1 font-orbitron ${isUnlocked ? 'text-cyan-800' : 'text-gray-800'}`}>
                    {sector.name}
                  </span>
  
                  {isUnlocked && (
                    <div className="mt-2 text-[8px] text-emerald-500 font-mono font-bold uppercase flex items-center gap-1">
                      <TrendingUp className="w-2 h-2" /> ${sector.reward}
                    </div>
                  )}
                  
                  {isBoss && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-1 bg-red-900/80 text-red-200 px-1.5 py-0.5 font-orbitron uppercase text-[7px] border border-red-500/30">
                      <Skull className="w-2 h-2" /> BOSS
                    </div>
                  )}
                  
                  {isUnlocked && <Crosshair className="absolute top-1 right-1 w-2 h-2 text-cyan-500/30 group-hover:text-cyan-400 transition-colors" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-6">
          <button 
            onClick={onBack}
            className="w-full py-4 bg-gray-900 hover:bg-gray-800 text-cyan-400 font-black border border-cyan-900 hover:border-cyan-400 transition-all uppercase font-orbitron tracking-widest text-lg shadow-[0_0_20px_rgba(6,182,212,0.1)] active:scale-[0.98]"
          >
            EXIT TO MAIN MENU
          </button>

          <div className="flex justify-center gap-8 border-t border-white/5 pt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-900/40 border border-cyan-800"></div>
              <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest">Active Operative Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-950 border border-gray-900 opacity-40"></div>
              <span className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest">Restricted Airspace</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelSelect;
