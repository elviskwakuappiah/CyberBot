
import React, { useEffect } from 'react';
import { soundService } from '../services/soundService';

interface GameOverProps {
  level: number;
  onRetry: () => void;
  onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ level, onRetry, onMenu }) => {
  useEffect(() => {
    soundService.playLose();
  }, []);

  return (
    <div className="fixed inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 p-6">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
        <h1 className="text-6xl font-black text-white italic tracking-tighter drop-shadow-lg">
          UNIT <span className="text-red-500">OFFLINE</span>
        </h1>
        
        <div className="p-6 bg-black/40 border-y border-red-500">
          <p className="text-red-200 text-lg uppercase tracking-widest mb-2">Operational Failure</p>
          <p className="text-white font-mono">Mission aborted in Sector {level}.</p>
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={onRetry}
            className="py-4 bg-white text-red-900 font-black text-xl hover:bg-red-100 transition-colors"
          >
            REBOOT & RETRY
          </button>
          <button 
            onClick={onMenu}
            className="py-2 text-red-300 font-bold hover:text-white transition-colors uppercase text-sm"
          >
            Return to HQ
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
