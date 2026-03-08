
import React, { useEffect, useState } from 'react';
import { soundService } from '../services/soundService';

interface VictoryProps {
  onMenu: () => void;
}

const Victory: React.FC<VictoryProps> = ({ onMenu }) => {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    soundService.playVictory();
    const timer = setTimeout(() => setShowButtons(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-50 p-6 overflow-hidden">
      {/* Background Peace Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-b from-blue-900/20 to-black">
         <div className="w-full h-full animate-pulse"></div>
      </div>

      <div className="max-w-2xl text-center space-y-12 relative z-10">
        <div className="space-y-4 animate-in fade-in duration-1000">
          <h1 className="text-5xl font-black text-gray-400 uppercase italic tracking-tighter">
            THE CITY HAS <span className="text-white">NO MORE</span> THREATS
          </h1>
          <p className="text-cyan-400 text-xl tracking-widest uppercase font-bold animate-pulse font-orbitron">The Mechanical War is Over.</p>
        </div>
        
        <div className="relative group animate-in slide-in-from-bottom duration-1000 delay-500">
          {/* Gravestone Visual */}
          <div className="w-64 h-80 mx-auto bg-gradient-to-t from-gray-900 to-transparent border-x border-t border-gray-700 rounded-t-full flex flex-col items-center justify-end pb-12 shadow-[0_0_80px_rgba(0,0,0,1)]">
            <div className="text-8xl mb-4 opacity-70 filter grayscale transform rotate-3 scale-90">🤖</div>
            <div className="w-40 h-1 bg-cyan-900/40 rounded-full mb-2"></div>
            <div className="text-cyan-600 font-mono text-[10px] tracking-[0.4em] uppercase font-black">UNIT 77-SQUAD</div>
            <div className="text-gray-500 font-mono text-[9px] uppercase mt-1">FOR THE FALLEN COMRADE</div>
          </div>
          {/* Grave Base */}
          <div className="w-96 h-2 mx-auto bg-gray-900 border-t border-gray-800"></div>
          
          <div className="mt-10 space-y-2">
            <p className="text-gray-400 italic text-sm max-w-md mx-auto font-medium">
              "We built this grave in the center of a silent sector, where the only sound left is the wind through empty circuits. We remember."
            </p>
          </div>
        </div>

        {showButtons && (
          <div className="animate-in fade-in zoom-in duration-1000 flex flex-col items-center">
            <button 
              onClick={onMenu}
              className="px-16 py-5 bg-gray-900 hover:bg-white hover:text-black text-white font-black text-2xl transition-all border border-gray-700 uppercase tracking-[0.2em] font-orbitron shadow-[0_0_40px_rgba(0,0,0,0.5)]"
            >
              LOG OFF (RETIRE)
            </button>
            <p className="text-[9px] text-gray-600 mt-6 uppercase font-mono tracking-[0.5em] animate-pulse">Peace has been established. No further action required.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Victory;
