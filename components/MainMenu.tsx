
import React, { useState } from 'react';
import { LayoutGrid, PlayCircle, Home, HelpCircle, Shield, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { soundService } from '../services/soundService';
import Logo from './Logo';

interface MainMenuProps {
  onStart: () => void;
  onContinue: () => void;
  onStartTutorial: () => void;
  onOpenBase: () => void;
  onOpenLevelSelect: () => void;
  onOpenHowToPlay: () => void;
  onOpenDailyMissions: () => void;
  hasSave: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, onContinue, onStartTutorial, onOpenBase, onOpenLevelSelect, onOpenHowToPlay, onOpenDailyMissions, hasSave }) => {
  return (
    <div className="min-h-full w-full flex flex-col items-center justify-start md:justify-center bg-gradient-to-b from-black via-gray-900 to-blue-950 p-4 py-12 relative overflow-y-auto">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-cyan-500 rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-900 rounded-full filter blur-[120px]"></div>
      </div>

      <div className="max-w-4xl text-center space-y-12 relative z-10">
        <div className="relative inline-block">
          <div className="absolute -inset-4 bg-cyan-500/10 blur-xl rounded-full"></div>
          <Logo className="scale-125 md:scale-150 mb-8" />
          <div className="absolute -top-6 -right-8 bg-cyan-600 text-white px-4 py-1 text-[10px] font-black uppercase rotate-12 font-orbitron shadow-[0_0_20px_rgba(6,182,212,0.6)] border border-white/20 z-20">
            SQUAD DEFENSE PROTOCOL
          </div>
        </div>

        <p className="text-cyan-200 text-lg md:text-xl tracking-[0.3em] uppercase font-orbitron font-bold opacity-80">
          Sync Squad • Merge Chassis • Save Mankind
        </p>

        <div className="flex flex-col items-center space-y-6">
          <button 
            onClick={hasSave ? onContinue : onStart}
            className="group relative w-full md:w-[45rem] py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-4xl border-b-8 border-cyan-900 transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_15px_30px_rgba(6,182,212,0.4)] font-orbitron flex items-center justify-center gap-4 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            <PlayCircle className="w-10 h-10" />
            {hasSave ? "CONTINUE MISSION" : "START MISSION"}
          </button>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-[45rem]">
            <button 
              onClick={onOpenLevelSelect}
              className="group py-5 bg-blue-800 hover:bg-blue-700 text-white font-black text-xl border-b-6 border-blue-950 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(30,58,138,0.4)] flex items-center justify-center gap-2 font-orbitron"
            >
              <LayoutGrid className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              SECTORS
            </button>

            <button 
              onClick={onOpenBase}
              className="group py-5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xl border-b-6 border-emerald-950 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(5,150,105,0.4)] flex items-center justify-center gap-2 font-orbitron"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              BASE
            </button>

            <button 
              onClick={onOpenDailyMissions}
              className="group py-5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xl border-b-6 border-amber-800 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(217,119,6,0.4)] flex items-center justify-center gap-2 font-orbitron"
            >
              <Trophy className="w-5 h-5 group-hover:animate-pulse transition-transform text-yellow-300" />
              MISSIONS
            </button>

            <button 
              onClick={onStartTutorial}
              className="group py-5 bg-purple-800 hover:bg-purple-700 text-white font-black text-xl border-b-6 border-purple-950 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(107,33,168,0.4)] flex items-center justify-center gap-2 font-orbitron"
            >
              <HelpCircle className="w-5 h-5 group-hover:animate-bounce transition-transform" />
              TUTORIAL
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 text-cyan-500/40 text-[10px] pt-8 font-mono font-bold tracking-widest uppercase">
            <div className="flex flex-col items-center gap-2">
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded text-white font-black">WASD</span>
              <span>Locomotion</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded text-white font-black">SPACE</span>
              <span>Arsenal</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded text-white font-black">SHIFT</span>
              <span>Transform</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span className="bg-white/5 border border-white/10 px-3 py-1 rounded text-white font-black">C</span>
              <span>Combine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 opacity-50">
        <Shield className="w-4 h-4 text-cyan-500" />
        <span className="text-[10px] text-cyan-700 font-black uppercase tracking-[0.5em] font-orbitron">Cyber Defense Network v.2.0</span>
      </div>
    </div>
  );
};

export default MainMenu;
