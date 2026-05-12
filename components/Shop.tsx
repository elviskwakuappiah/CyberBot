
import React from 'react';
import { Upgrades, RobotUnit } from '../types';
import { Shield, Zap, Users } from 'lucide-react';

interface ShopProps {
  money: number;
  upgrades: Upgrades;
  onBuyRobot: () => void;
  onBuyWeapon: () => void;
  onUnlockUnit: (unit: RobotUnit, price: number) => void;
  onToggleSquadMember: (unit: RobotUnit) => void;
  onExit: () => void;
  isFromMenu?: boolean;
}

const ROBOT_CATALOG = [
  { unit: RobotUnit.STRIKER, name: "STRIKER", price: 150, description: "High-speed scout. Ability: TURBO DASH.", color: "#fbbf24" },
  { unit: RobotUnit.FALCON, name: "FALCON", price: 300, description: "Aerial drone. Ability: AIR STRIKE.", color: "#22d3ee" },
  { unit: RobotUnit.TITAN, name: "TITAN", price: 500, description: "Heavy siege. Ability: GROUND SLAM.", color: "#ef4444" },
  { unit: RobotUnit.SPECTER, name: "SPECTER", price: 750, description: "Support unit. Ability: STEALTH CLOAK.", color: "#a855f7" },
  { unit: RobotUnit.VANGUARD, name: "VANGUARD", price: 1000, description: "Fire Truck. Ability: REPAIR NANO.", color: "#10b981" },
  { unit: RobotUnit.NIGHTSHADE, name: "NIGHTSHADE", price: 1250, description: "Cyber Tiger. Ability: SHADOW POUNCE.", color: "#6366f1" },
  { unit: RobotUnit.BLAZE, name: "BLAZE", price: 1500, description: "Race Car. Ability: INFERNO TRAIL.", color: "#f97316" },
  { unit: RobotUnit.GLITCH, name: "GLITCH", price: 2000, description: "Flying Car. Ability: EMP BURST.", color: "#ec4899" },
  { unit: RobotUnit.OMEGA, name: "OMEGA", price: 5000, description: "Super-Unit. Ability: OMEGA BEAM.", color: "#ffffff" },
];

const Shop: React.FC<ShopProps> = ({ money, upgrades, onBuyRobot, onBuyWeapon, onUnlockUnit, onToggleSquadMember, onExit, isFromMenu }) => {
  const squadSize = upgrades.activeSquad?.length || 0;
  const isSquadFull = squadSize >= 5;

  return (
    <div className="h-full w-full flex flex-col items-center justify-start bg-gray-950 p-4 py-12 overflow-y-auto">
      <div className="max-w-4xl w-full bg-black border-2 border-cyan-500 p-8 relative shadow-[0_0_30px_rgba(6,182,212,0.2)] font-orbitron">
        <div className="absolute -top-4 left-10 bg-cyan-600 px-4 py-1 text-white font-black italic uppercase text-sm">Deployment & Logistics</div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-cyan-900 pb-4 gap-4">
          <div>
            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Squad <span className="text-cyan-400">Terminal</span></h2>
            <div className="flex items-center gap-2 mt-2">
               <Users className={`w-4 h-4 ${isSquadFull ? 'text-red-500' : 'text-cyan-500'}`} />
               <span className={`text-xs font-bold tracking-widest ${isSquadFull ? 'text-red-500' : 'text-cyan-600'}`}>
                 SQUAD CAPACITY: {squadSize} / 5
               </span>
               {isSquadFull && <span className="text-[10px] bg-red-950 text-red-400 px-2 py-0.5 rounded border border-red-900 ml-2 animate-pulse">MAX LIMIT REACHED</span>}
            </div>
          </div>
          <div className="text-3xl font-mono text-yellow-400 font-bold bg-yellow-900/20 px-6 py-3 border border-yellow-600/50 rounded-sm shadow-[0_0_20px_rgba(234,179,8,0.1)]">
            ${money.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-5 border-2 border-blue-500/50 bg-blue-950/10 flex flex-col justify-between group hover:border-blue-400 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white uppercase">Alloy Hardening</h3>
              </div>
              <p className="text-gray-400 text-[10px] leading-relaxed mb-4">Enhance all active chassis integrity via molecular binding. Adds +50 Max HP to every unit in your squad.</p>
              <div className="text-blue-300 font-mono text-[10px] uppercase tracking-widest bg-blue-900/20 p-2 border border-blue-900/50 rounded flex justify-between">
                <span>Current Tier:</span>
                <span className="font-black">{upgrades.robotTier}</span>
              </div>
            </div>
            <button 
              disabled={money < 100} 
              onClick={onBuyRobot} 
              className={`mt-6 py-3 font-black uppercase transition-all shadow-lg text-lg ${money >= 100 ? 'bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800 active:translate-y-1 active:border-b-0' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}
            >
              Enhance Armor ($100)
            </button>
          </div>

          <div className="p-5 border-2 border-red-500/50 bg-red-950/10 flex flex-col justify-between group hover:border-red-400 transition-all">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Zap className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white uppercase">Power Core Link</h3>
              </div>
              <p className="text-gray-400 text-[10px] leading-relaxed mb-4">Overclock recharge cycles for all offensive modules. Increases weapon discharge frequency (Fire Rate).</p>
              <div className="text-red-300 font-mono text-[10px] uppercase tracking-widest bg-red-900/20 p-2 border border-red-900/50 rounded flex justify-between">
                <span>Current Tier:</span>
                <span className="font-black">{upgrades.weaponTier}</span>
              </div>
            </div>
            <button 
              disabled={money < 50} 
              onClick={onBuyWeapon} 
              className={`mt-6 py-3 font-black uppercase transition-all shadow-lg text-lg ${money >= 50 ? 'bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800 active:translate-y-1 active:border-b-0' : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'}`}
            >
              Overclock Guns ($50)
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 border-b border-cyan-900/50 pb-2">
            <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-sm">Squad Recruitment Center</h3>
            <span className="text-[10px] text-gray-600 uppercase font-mono">Limit: 5 Active Frames</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ROBOT_CATALOG.map(robot => {
              const isUnlocked = upgrades.unlockedUnits?.includes(robot.unit) || false;
              const isActive = upgrades.activeSquad?.includes(robot.unit) || false;
              const canAfford = money >= robot.price;
              const isTotalLimitReached = (upgrades.unlockedUnits?.length || 0) >= 5;
              
              return (
                <div key={robot.unit} className={`p-4 border-2 transition-all relative overflow-hidden ${isActive ? 'border-emerald-500 bg-emerald-950/20' : isUnlocked ? 'border-cyan-900/50 bg-cyan-950/5' : canAfford && !isTotalLimitReached ? 'border-gray-800 bg-gray-900/50 hover:border-cyan-500/40' : 'border-gray-900 bg-black opacity-60'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-black" style={{ color: robot.color }}>{robot.name}</h4>
                    {isUnlocked && <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">{isActive ? 'ACTIVE' : 'RESERVE'}</span>}
                  </div>
                  <p className="text-[9px] text-gray-400 mb-4 h-8 line-clamp-2 leading-tight">{robot.description}</p>
                  
                  {isUnlocked ? (
                    <button 
                      onClick={() => onToggleSquadMember(robot.unit)}
                      className={`w-full py-2 text-[10px] font-black uppercase rounded-sm transition-all ${isActive ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : (isSquadFull ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-cyan-700 hover:bg-cyan-600 text-white')}`}
                      disabled={!isActive && isSquadFull}
                    >
                      {isActive ? "DESELECT" : (isSquadFull ? "SQUAD FULL" : "SELECT UNIT")}
                    </button>
                  ) : (
                    <button 
                      disabled={!canAfford || isTotalLimitReached} 
                      onClick={() => onUnlockUnit(robot.unit, robot.price)} 
                      className={`w-full py-2 text-[10px] font-black uppercase rounded-sm transition-all ${canAfford && !isTotalLimitReached ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-md' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                    >
                      {isTotalLimitReached ? "SQUAD FULL" : `RECRUIT $${robot.price}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4">
           <button onClick={onExit} className="flex-1 py-5 bg-cyan-700 hover:bg-cyan-600 text-white font-black text-2xl transition-all border-b-8 border-cyan-900 uppercase active:translate-y-1 active:border-b-4 shadow-xl">
            Confirm Deployment
          </button>
        </div>
        
        <p className="text-center text-[8px] text-cyan-900 uppercase mt-6 font-mono tracking-[0.5em] animate-pulse">
          EDN SQUAD PROTOCOL v4.2 // SECTOR LOGISTICS TERMINAL
        </p>
      </div>
    </div>
  );
};

export default Shop;
