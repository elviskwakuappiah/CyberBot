
import React from 'react';
import { HelpCircle, Move, Zap, RefreshCw, Layers, Plane } from 'lucide-react';

interface HowToPlayProps {
  onBack: () => void;
}

const HowToPlay: React.FC<HowToPlayProps> = ({ onBack }) => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-start bg-gray-950 p-6 py-12 overflow-y-auto">
      <div className="max-w-3xl w-full bg-black border-2 border-cyan-500 p-8 relative shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <div className="absolute -top-4 left-10 bg-cyan-600 px-4 py-1 text-white font-black italic font-orbitron uppercase text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Tactical Training Manual
        </div>
        
        <div className="flex justify-between items-center mb-8 border-b border-cyan-900 pb-4">
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase font-orbitron">Combat <span className="text-cyan-400">Tutorial</span></h2>
          <button 
            onClick={onBack}
            className="text-cyan-400 hover:text-white transition-colors font-bold uppercase text-sm border border-cyan-500/30 px-4 py-1 font-orbitron"
          >
            Exit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 text-gray-300">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-cyan-900/40 p-3 rounded border border-cyan-500/30 h-fit">
                <Move className="text-cyan-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold uppercase mb-1 font-orbitron">Locomotion</h3>
                <p className="text-sm leading-relaxed">Use <span className="text-cyan-400 font-bold">WASD</span> or <span className="text-cyan-400 font-bold">Arrow Keys</span> to navigate your units. Double jump is available for most robot forms.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-red-900/40 p-3 rounded border border-red-500/30 h-fit">
                <Zap className="text-red-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold uppercase mb-1 font-orbitron">Offense</h3>
                <p className="text-sm leading-relaxed">Press <span className="text-red-400 font-bold">SPACE</span> to fire your primary weapon systems. Each unit has unique fire rates and patterns.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-yellow-900/40 p-3 rounded border border-yellow-500/30 h-fit">
                <RefreshCw className="text-yellow-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold uppercase mb-1 font-orbitron">Transform</h3>
                <p className="text-sm leading-relaxed">Tap <span className="text-yellow-400 font-bold">SHIFT</span> to toggle Alt-Mode. Combat forms are better for combat, while Alt-Modes offer specialized mobility.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="bg-purple-900/40 p-3 rounded border border-purple-500/30 h-fit">
                <Plane className="text-purple-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold uppercase mb-1 font-orbitron">Flight Systems</h3>
                <p className="text-sm leading-relaxed">Units like <span className="text-cyan-400 font-bold">Falcon</span> and <span className="text-white font-bold">Omega</span> fly automatically in Alt Mode. For <span className="text-pink-400 font-bold">Glitch</span>, press <span className="text-white font-bold text-lg px-2 bg-gray-800 rounded">F</span> to engage flight thrusters while transformed.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-emerald-900/40 p-3 rounded border border-emerald-500/30 h-fit">
                <Layers className="text-emerald-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-bold uppercase mb-1 font-orbitron">Combiner Protocol</h3>
                <p className="text-sm leading-relaxed">Once you unlock <span className="text-emerald-400 font-bold">5 UNITS</span>, press <span className="text-emerald-400 font-bold">C</span> to merge into the Mega CyberBot. This form shares a massive health pool and firepower.</p>
              </div>
            </div>

            <div className="bg-cyan-950/20 border border-cyan-900/50 p-4 rounded text-[11px] leading-relaxed">
              <p className="text-cyan-500 font-bold uppercase mb-2">Pro Tip:</p>
              The leader of your squad (Sentinel) is followed by all other active units. Use your team's positioning to create a wall of lead against the rogue machine uprising. Visit the <span className="text-yellow-500 font-bold italic">BASE</span> between missions to recruit new units.
            </div>
          </div>
        </div>

        <button 
          onClick={onBack}
          className="w-full py-4 bg-cyan-900 hover:bg-cyan-600 text-white font-black border border-cyan-400 transition-all uppercase font-orbitron tracking-widest text-lg"
        >
          Understood, Deploy HQ
        </button>
      </div>
    </div>
  );
};

export default HowToPlay;
