
import React, { useEffect, useState } from 'react';
import { soundService } from '../services/soundService';
import { Music, Star, Zap } from 'lucide-react';

interface MilestoneVictoryProps {
  milestone: number;
  onContinue: () => void;
}

const MilestoneVictory: React.FC<MilestoneVictoryProps> = ({ milestone, onContinue }) => {
  const [lyricsStep, setLyricsStep] = useState(0);
  const [showButton, setShowButton] = useState(false);

  const lyrics = [
    "YOU GOT THE TOUCH!",
    "YOU GOT THE POWER!",
    "AFTER ALL IS SAID AND DONE...",
    "YOU'VE NEVER WALKED, YOU'VE NEVER RUN!",
    "YOU'RE A WINNER!"
  ];

  useEffect(() => {
    soundService.playTheTouch();
    
    let timer: any;
    const advanceLyrics = (step: number) => {
      if (step < lyrics.length) {
        setLyricsStep(step);
        timer = setTimeout(() => advanceLyrics(step + 1), 2200);
      } else {
        setShowButton(true);
      }
    };

    advanceLyrics(0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-8 overflow-hidden font-orbitron">
      {/* War for Cybertron Style Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-500/5 rounded-full blur-[150px] animate-pulse"></div>
        
        {/* Glowing Grid Lines */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
        
        {/* Floating Cybertronian Particles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      </div>

      <div className="relative z-10 text-center space-y-12">
        <div className="space-y-2">
          <h2 className="text-cyan-400 text-sm font-black tracking-[0.8em] uppercase animate-pulse">SECTOR {milestone * 10} SECURED // ENERGON_STABLE</h2>
          <h1 className="text-6xl md:text-9xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-400 to-blue-800 drop-shadow-[0_0_50px_rgba(34,211,238,0.6)] uppercase tracking-tighter">
            ULTIMATE VICTORY
          </h1>
        </div>

        <div className="h-40 flex items-center justify-center">
          <div key={lyricsStep} className="text-4xl md:text-7xl font-black text-white italic tracking-tighter animate-in zoom-in slide-in-from-bottom duration-500 text-center uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">
            {lyrics[lyricsStep]}
          </div>
        </div>

        <div className="flex justify-center gap-16 text-cyan-400">
           <Zap className="w-16 h-16 animate-pulse" />
           <Music className="w-16 h-16 animate-bounce" />
           <Zap className="w-16 h-16 animate-pulse" />
        </div>

        {showButton && (
          <button 
            onClick={onContinue}
            className="px-20 py-8 bg-cyan-600 hover:bg-white text-white hover:text-black font-black text-4xl border-b-8 border-cyan-900 transition-all transform hover:scale-105 active:translate-y-2 active:border-b-4 shadow-[0_0_60px_rgba(6,182,212,0.5)] uppercase group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            <span className="flex items-center gap-4">
               <Music className="w-10 h-10 group-hover:rotate-12 transition-transform" />
               CONTINUE MISSION
            </span>
          </button>
        )}
      </div>

      {/* Decorative Scanlines & Vignette */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,1)]"></div>
    </div>
  );
};

export default MilestoneVictory;
