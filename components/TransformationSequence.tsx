
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Cpu, Activity, AlertTriangle } from 'lucide-react';
import { soundService } from '../services/soundService';

interface TransformationSequenceProps {
  onComplete: () => void;
}

const TransformationSequence: React.FC<TransformationSequenceProps> = ({ onComplete }) => {
  const [stage, setStage] = useState(0);
  const [syncPercent, setSyncPercent] = useState(0);

  useEffect(() => {
    // Stage 0: Warning/Gathering (0-2s)
    // Stage 1: Merging (2-4s)
    // Stage 2: Powering Up (4-6s)
    // Stage 3: Final Form (6-8s)
    
    const timers = [
      setTimeout(() => setStage(1), 2000),
      setTimeout(() => setStage(2), 4000),
      setTimeout(() => setStage(3), 6000),
      setTimeout(() => onComplete(), 8500),
    ];

    const syncInterval = setInterval(() => {
      setSyncPercent(prev => {
        if (prev >= 100) return 100;
        return prev + 1.2;
      });
    }, 50);

    soundService.playTransform('SENTINEL' as any, true);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(syncInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center overflow-hidden font-orbitron">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-cyan-500/5 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]" />
        
        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      </div>

      <AnimatePresence mode="wait">
        {stage === 0 && (
          <motion.div
            key="stage0"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            <div className="flex items-center gap-4 text-yellow-500 animate-pulse">
              <AlertTriangle className="w-12 h-12" />
              <h2 className="text-4xl font-black tracking-tighter uppercase italic">Initiating Combiner Protocol</h2>
            </div>
            <div className="w-96 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2, ease: "linear" }}
                className="h-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
              />
            </div>
            <p className="text-zinc-500 text-sm tracking-[0.3em] uppercase font-mono">Gathering Squad Signatures...</p>
          </motion.div>
        )}

        {stage === 1 && (
          <motion.div
            key="stage1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="relative z-10 flex flex-col items-center gap-12"
          >
            <div className="grid grid-cols-2 gap-24">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative">
                  <Cpu className="w-10 h-10 text-cyan-400" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute inset-0 border-t-2 border-cyan-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-cyan-500 tracking-widest uppercase font-black">Neural Link</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-full border-2 border-emerald-500/30 flex items-center justify-center relative">
                  <Activity className="w-10 h-10 text-emerald-400" />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                    className="absolute inset-0 border-b-2 border-emerald-500 rounded-full"
                  />
                </div>
                <span className="text-[10px] text-emerald-500 tracking-widest uppercase font-black">Core Sync</span>
              </div>
            </div>
            <h2 className="text-6xl font-black tracking-tighter uppercase italic text-white">
              Merging <span className="text-cyan-500">Sub-Systems</span>
            </h2>
          </motion.div>
        )}

        {stage === 2 && (
          <motion.div
            key="stage2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="relative z-10 flex flex-col items-center gap-6"
          >
            <div className="text-[120px] font-black text-white leading-none tracking-tighter italic uppercase">
              {Math.floor(syncPercent)}%
            </div>
            <div className="flex items-center gap-3 text-cyan-400">
              <Zap className="w-6 h-6 animate-bounce" />
              <span className="text-xl font-bold tracking-[0.5em] uppercase">Power Overload</span>
            </div>
            <div className="w-[600px] h-4 bg-zinc-900 border border-white/10 rounded-full overflow-hidden p-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${syncPercent}%` }}
                className="h-full bg-gradient-to-r from-cyan-600 to-white shadow-[0_0_30px_rgba(6,182,212,0.8)] rounded-full"
              />
            </div>
          </motion.div>
        )}

        {stage === 3 && (
          <motion.div
            key="stage3"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="mb-4"
            >
              <Shield className="w-32 h-32 text-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.5)]" />
            </motion.div>
            
            <h1 className="text-[12vw] font-black text-white leading-[0.85] tracking-tighter italic uppercase text-center">
              Ultimate<br />
              <span className="text-cyan-500">CyberBot</span>
            </h1>
            
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              className="h-2 bg-cyan-500 mt-8 shadow-[0_0_30px_rgba(6,182,212,1)]"
            />
            
            <div className="mt-12 flex gap-16">
              <div className="text-center">
                <div className="text-cyan-500 text-xs font-black uppercase tracking-widest mb-1">Attack Power</div>
                <div className="text-3xl font-bold text-white tracking-tighter">MAXIMUM</div>
              </div>
              <div className="text-center">
                <div className="text-cyan-500 text-xs font-black uppercase tracking-widest mb-1">Armor Class</div>
                <div className="text-3xl font-bold text-white tracking-tighter">TITANIUM+</div>
              </div>
              <div className="text-center">
                <div className="text-cyan-500 text-xs font-black uppercase tracking-widest mb-1">Core Output</div>
                <div className="text-3xl font-bold text-white tracking-tighter">UNLIMITED</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash Effect */}
      <AnimatePresence>
        {(stage === 2 || stage === 3) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 0.1 }}
            className="absolute inset-0 bg-white pointer-events-none z-[301]"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransformationSequence;
