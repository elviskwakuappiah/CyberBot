import React from 'react';
import { motion } from 'motion/react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Glowing Hexagon Background */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
        
        {/* Hexagonal Shield Shape (SVG) */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
          <defs>
            <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Outer Hexagon */}
          <path
            d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
            fill="none"
            stroke="url(#logoGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Inner Hexagon Segments */}
          <path
            d="M50 15 L80 30 L80 70 L50 85 L20 70 L20 30 Z"
            fill="none"
            stroke="white"
            strokeOpacity="0.1"
            strokeWidth="1"
          />
          
          {/* Central Chip */}
          <rect x="35" y="35" width="30" height="30" rx="4" fill="#0c0c0c" stroke="#10b981" strokeWidth="2" />
          
          {/* Brain Icon (Simple lines for AI) */}
          <motion.path
            d="M42 45 Q45 40 50 40 Q55 40 58 45 M42 55 Q45 60 50 60 Q55 60 58 55 M50 40 V60"
            stroke="#10b981"
            strokeWidth="1.5"
            fill="none"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          {/* Circuit Lines */}
          <path d="M65 45 H75 M65 55 H75 M65 50 H80" stroke="#10b981" strokeWidth="1" />
          <path d="M35 45 H25 M35 55 H25 M35 50 H20" stroke="#10b981" strokeWidth="1" />
        </svg>
      </div>

      <div className="mt-4 text-center">
        <h2 className="text-4xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
          CYBERBOT
        </h2>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] mt-1">
          ELVISAPPIAH.COM
        </p>
      </div>
    </div>
  );
};

export default Logo;
