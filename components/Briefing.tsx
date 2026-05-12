
import React from 'react';
import { LevelInfo } from '../types';

interface BriefingProps {
  briefing: LevelInfo;
  isLoading: boolean;
  onConfirm: () => void;
}

const Briefing: React.FC<BriefingProps> = ({ briefing, isLoading, onConfirm }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-start bg-gray-950 p-6 py-12">
      <div className="max-w-lg w-full bg-gray-900 border border-cyan-900 relative overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Fixed Header */}
        <div className="p-8 pb-4 shrink-0 bg-gray-900 relative z-10">
          <div className="absolute top-0 right-0 p-2 text-[8px] text-cyan-800 font-mono select-none">
            {isLoading ? "SYNCING_REMOTE_INTEL..." : "SECURE_CHANNEL_v4.2"}
          </div>
          
          {isLoading && (
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-900 overflow-hidden">
              <div className="w-1/3 h-full bg-cyan-400 animate-[scan_1.5s_linear_infinite]"></div>
            </div>
          )}

          <div className="mb-2">
            <h3 className="text-cyan-600 font-bold mb-1 uppercase tracking-tighter font-orbitron text-xs">MISSION PROTOCOL: SECTOR {briefing.level || '??'}</h3>
            <h2 className="text-3xl text-white font-black uppercase tracking-tight font-orbitron">{briefing.title || 'Inbound Intel...'}</h2>
          </div>
        </div>

        {/* Scrollable Intel Section */}
        <div className="px-8 overflow-y-auto space-y-4 text-gray-300 font-medium pb-4">
          <div className="p-4 bg-gray-950 rounded italic text-sm border border-gray-800 leading-relaxed shadow-inner min-h-[120px] relative shrink-0">
            {briefing.description || "Compiling tactical mission data. Sector environmental analysis and hostile movement patterns are being synchronized with squad command chassis. Initial scans reveal increased rogue activity in the urban periphery..."}
            {isLoading && (
              <div className="absolute inset-0 bg-gray-950/40 flex items-center justify-center backdrop-blur-[1px]">
                <div className="flex gap-1">
                   <div className="w-1.5 h-1.5 bg-cyan-500 animate-bounce"></div>
                   <div className="w-1.5 h-1.5 bg-cyan-500 animate-bounce [animation-delay:0.2s]"></div>
                   <div className="w-1.5 h-1.5 bg-cyan-500 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer: Mission Deployment Area */}
        <div className="p-8 mt-auto flex flex-col space-y-4 bg-gray-900 border-t border-cyan-900/40 shrink-0 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
          {/* START MISSION button - Always visible */}
          <button 
            onClick={onConfirm}
            className="w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-2xl transition-all border-b-8 border-cyan-900 shadow-[0_10px_30px_rgba(6,182,212,0.4)] uppercase font-orbitron group relative overflow-hidden active:translate-y-1 active:border-b-4"
          >
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            START MISSION
          </button>
          
          <div className="text-[8px] text-cyan-900 uppercase text-center font-mono animate-pulse">
            Synchronization Complete • Ready for Immediate Deployment
          </div>
        </div>
      </div>
      
      {isLoading && (
        <p className="text-[10px] text-gray-700 mt-4 font-mono uppercase tracking-[0.2em] animate-pulse">
          Enhancing sector intel via deep-neural uplink...
        </p>
      )}
    </div>
  );
};

export default Briefing;
