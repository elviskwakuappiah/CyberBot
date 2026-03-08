
import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, X, ShieldAlert, Key, BarChart3, Music as MusicIcon, Volume2, VolumeX, CheckCircle2, Database } from 'lucide-react';
import { GameState, LevelInfo, RobotUnit, Upgrades } from './types';
import { getLevelBriefing, getStaticBriefing } from './services/geminiService';
import { soundService } from './services/soundService';
import MainMenu from './components/MainMenu';
import Briefing from './components/Briefing';
import GameView from './components/GameView';
import GameOver from './components/GameOver';
import Victory from './components/Victory';
import MilestoneVictory from './components/ChapterVictory';
import Shop from './components/Shop';
import LevelSelect from './components/LevelSelect';
import HowToPlay from './components/HowToPlay';

const SAVE_KEY = 'cyberbot_save_data_v4';
const SETTINGS_KEY = 'cyberbot_settings_v3';

const DEFAULT_UPGRADES: Upgrades = { 
  robotTier: 0, 
  weaponTier: 0, 
  unlockedUnits: [RobotUnit.SENTINEL],
  activeSquad: [RobotUnit.SENTINEL]
};

const MAX_CAMPAIGN_LEVELS = 30; 

const App: React.FC = () => {
  const [initialSaveData] = useState(() => {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return null;
    try { return JSON.parse(data); } catch (e) { return null; }
  });

  const [settings, setSettings] = useState(() => {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { music: true, sound: true };
    try { return JSON.parse(data); } catch (e) { return { music: true, sound: true }; }
  });

  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [level, setLevel] = useState<number>(initialSaveData?.level || 1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(initialSaveData?.maxUnlockedLevel || 1);
  const [money, setMoney] = useState<number>(initialSaveData?.money || 0);
  const [isTitanSceneTriggered, setIsTitanSceneTriggered] = useState<boolean>(initialSaveData?.isTitanSceneTriggered || false);
  const [isSector22Unlocked, setIsSector22Unlocked] = useState<boolean>(initialSaveData?.isSector22Unlocked || false);
  const [upgrades, setUpgrades] = useState<Upgrades>(() => {
    const loaded = initialSaveData?.upgrades;
    if (!loaded) return DEFAULT_UPGRADES;
    // Migration: ensure activeSquad exists
    if (!loaded.activeSquad) {
      return { ...loaded, activeSquad: loaded.unlockedUnits || [RobotUnit.SENTINEL] };
    }
    return loaded;
  });
  
  const [briefing, setBriefing] = useState<LevelInfo | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [baseOrigin, setBaseOrigin] = useState<GameState>(GameState.MENU);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [savePulse, setSavePulse] = useState(false);

  const saveToDisk = useCallback(() => {
    const dataToSave = { level, maxUnlockedLevel, money, upgrades, isTitanSceneTriggered, isSector22Unlocked };
    localStorage.setItem(SAVE_KEY, JSON.stringify(dataToSave));
  }, [level, maxUnlockedLevel, money, upgrades, isTitanSceneTriggered, isSector22Unlocked]);

  useEffect(() => {
    saveToDisk();
    setSavePulse(true);
    const timer = setTimeout(() => setSavePulse(false), 800);
    return () => clearTimeout(timer);
  }, [level, maxUnlockedLevel, money, upgrades, isTitanSceneTriggered, isSector22Unlocked, saveToDisk]);

  useEffect(() => {
    const handleUnload = () => saveToDisk();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [saveToDisk]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    soundService.soundEnabled = settings.sound;
  }, [settings]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') {
        setGameState(prev => {
          if (prev === GameState.PLAYING) return GameState.PAUSED;
          if (prev === GameState.PAUSED) return GameState.PLAYING;
          return prev;
        });
      }
      if (e.code === 'Escape') {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleOpenKeySelection = async () => {
    await (window as any).aistudio.openSelectKey();
    if (gameState === GameState.BRIEFING) {
      startLevel(level);
    }
  };

  const handleSaveProgress = () => {
    saveToDisk();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const startLevel = useCallback(async (lvl: number) => {
    setGameState(GameState.BRIEFING);
    setLevel(lvl);
    setBriefing(getStaticBriefing(lvl));
    setIsBriefingLoading(true);
    
    getLevelBriefing(lvl).then(data => {
      setBriefing(data);
      setIsBriefingLoading(false);
    }).catch(() => {
      setIsBriefingLoading(false);
    });
  }, []);

  const handleStartGame = async () => startLevel(1);

  const handleContinueGame = () => {
    startLevel(level);
  };

  const handleLevelComplete = () => {
    const isMilestone = [10, 20, 30].includes(level);
    const reward = isMilestone ? 15000 : 300;
    setMoney(m => m + reward); 
    const newlyUnlocked = level + 1;
    if (newlyUnlocked > maxUnlockedLevel && newlyUnlocked <= MAX_CAMPAIGN_LEVELS) {
      setMaxUnlockedLevel(newlyUnlocked);
    }
    
    if (level === 21 && isTitanSceneTriggered) {
      setIsSector22Unlocked(true);
    }

    if (isMilestone) {
      setGameState(GameState.MILESTONE_COMPLETE);
    } else {
      setGameState(GameState.LEVEL_COMPLETE);
    }
  };

  const handleMilestoneContinue = () => {
    if (level === MAX_CAMPAIGN_LEVELS) {
      setGameState(GameState.VICTORY);
    } else {
      setGameState(GameState.LEVEL_COMPLETE);
    }
  };

  const openBase = (origin: GameState) => {
    setBaseOrigin(origin);
    setGameState(GameState.BASE);
  };

  const handleSelectLevel = (lvlNum: number) => {
    if (lvlNum === 22 && !isSector22Unlocked) return;
    setLevel(lvlNum);
    if (lvlNum === 22) {
      setGameState(GameState.SQUAD_SELECTION);
    } else {
      startLevel(lvlNum);
    }
  };

  const handleNextLevel = () => {
    if (level === MAX_CAMPAIGN_LEVELS) setGameState(GameState.VICTORY);
    else handleSelectLevel(level + 1);
  };

  const handleBaseExit = () => {
    setGameState(baseOrigin === GameState.MENU ? GameState.MENU : GameState.LEVEL_COMPLETE);
  };

  const handlePlayerDeath = () => setGameState(GameState.GAMEOVER);

  const handleTitanScene = () => {
    setIsTitanSceneTriggered(true);
    setGameState(GameState.TITAN_SCENE);
  };

  const handleSquadSelect = (unit: RobotUnit) => {
    setUpgrades(u => ({ ...u, activeSquad: [unit] }));
    startLevel(22);
  };

  const buyRobotTier = () => {
    if (money >= 100) {
      setMoney(m => m - 100);
      setUpgrades(u => ({ ...u, robotTier: u.robotTier + 1 }));
    }
  };

  const buyWeaponTier = () => {
    if (money >= 50) {
      setMoney(m => m - 50);
      setUpgrades(u => ({ ...u, weaponTier: u.weaponTier + 1 }));
    }
  };

  const unlockRobotUnit = (unit: RobotUnit, price: number) => {
    if (money >= price && !upgrades.unlockedUnits.includes(unit)) {
      setMoney(m => m - price);
      setUpgrades(u => {
        const newUnlocked = [...u.unlockedUnits, unit];
        // Auto-add to squad if there's space
        const newActive = u.activeSquad.length < 5 ? [...u.activeSquad, unit] : u.activeSquad;
        return {
          ...u,
          unlockedUnits: newUnlocked,
          activeSquad: newActive
        };
      });
    }
  };

  const toggleSquadMember = (unit: RobotUnit) => {
    setUpgrades(u => {
      const isActive = u.activeSquad.includes(unit);
      if (isActive) {
        // Don't allow empty squad
        if (u.activeSquad.length <= 1) return u;
        return {
          ...u,
          activeSquad: u.activeSquad.filter(m => m !== unit)
        };
      } else {
        if (u.activeSquad.length >= 5) return u;
        return {
          ...u,
          activeSquad: [...u.activeSquad, unit]
        };
      }
    });
  };

  const isGameVisible = gameState === GameState.PLAYING || gameState === GameState.PAUSED;

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none text-white font-rajdhani flex flex-col">
      <button 
        onClick={() => setIsSettingsOpen(true)} 
        className="fixed top-4 left-4 z-[110] p-3 bg-gray-950/80 border border-cyan-900/50 text-cyan-500 hover:text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950 transition-all rounded-full shadow-[0_0_15px_rgba(6,182,212,0.1)] group"
        title="Settings Menu"
      >
        <SettingsIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
      </button>

      <div className={`fixed top-4 right-4 z-[110] flex items-center gap-2 transition-all duration-300 pointer-events-none ${savePulse ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
        <div className="flex flex-col items-end">
           <div className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Mission_Data_Synced</div>
           <div className="text-[8px] font-bold text-emerald-600/60 uppercase font-mono">ENCRYPTED_UPLINK_SUCCESS</div>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,1)]"></div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-black border-2 border-cyan-500 p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.3)] font-orbitron overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-8 border-b-2 border-cyan-900 pb-4">
              <h2 className="text-4xl font-black italic text-cyan-400 tracking-tighter uppercase">Operations Configuration</h2>
              <div className="flex items-center gap-2 mt-1">
                 <p className="text-[10px] text-cyan-700 tracking-[0.4em] font-bold uppercase">System_OS v4.2 //</p>
                 <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Auto-Save: Continuous Persistence</span>
                 </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-900/50 pb-2">
                  <span className="text-xs font-black bg-cyan-900 px-2 py-0.5 rounded text-white">1</span>
                  <BarChart3 className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Operation Stats</h3>
                </div>
                <div className="bg-gray-950 p-4 border border-gray-800 rounded flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-500 font-bold uppercase">Campaign Clearance</span>
                      <span className="text-cyan-400 font-mono">{maxUnlockedLevel}/{MAX_CAMPAIGN_LEVELS}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${(maxUnlockedLevel/MAX_CAMPAIGN_LEVELS)*100}%` }}></div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={handleSaveProgress}
                      className="w-full flex items-center justify-between p-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 hover:border-emerald-500 transition-all text-[9px] font-black uppercase text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                    >
                      <span className="flex items-center gap-2"><Database className="w-3 h-3" /> Force Secure Sync</span>
                      <span className={`${justSaved ? 'text-white' : 'text-emerald-600'}`}>{justSaved ? 'SAVED' : 'COMMIT'}</span>
                    </button>
                    <button 
                      onClick={() => { handleOpenKeySelection(); setIsSettingsOpen(false); }}
                      className="w-full flex items-center justify-between p-2.5 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-600/30 hover:border-cyan-500 transition-all text-[9px] font-black uppercase"
                    >
                      <span className="flex items-center gap-2"><Key className="w-3 h-3" /> AI Tactical Uplink</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-900/50 pb-2">
                  <span className="text-xs font-black bg-cyan-900 px-2 py-0.5 rounded text-white">2</span>
                  <MusicIcon className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Ambient Audio</h3>
                </div>
                <button 
                  onClick={() => setSettings(s => ({ ...s, music: !s.music }))}
                  className={`w-full p-8 flex items-center justify-between border transition-all ${settings.music ? 'border-cyan-500/50 bg-cyan-900/10' : 'border-gray-800 bg-gray-950 opacity-50'}`}
                >
                  <div className="text-left">
                    <span className="text-[12px] font-black uppercase tracking-widest block">{settings.music ? 'ENABLED' : 'DISABLED'}</span>
                    <span className="text-[8px] text-gray-500">MISSION BACKGROUND THEME</span>
                  </div>
                  {settings.music ? <Volume2 className="w-8 h-8 text-cyan-400" /> : <VolumeX className="w-8 h-8 text-gray-600" />}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-900/50 pb-2">
                  <span className="text-xs font-black bg-cyan-900 px-2 py-0.5 rounded text-white">3</span>
                  <Volume2 className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Tactical SFX</h3>
                </div>
                <button 
                  onClick={() => setSettings(s => ({ ...s, sound: !s.sound }))}
                  className={`w-full p-8 flex items-center justify-between border transition-all ${settings.sound ? 'border-cyan-500/50 bg-cyan-900/10' : 'border-gray-800 bg-gray-950 opacity-50'}`}
                >
                  <div className="text-left">
                    <span className="text-[12px] font-black uppercase tracking-widest block">{settings.sound ? 'ENABLED' : 'DISABLED'}</span>
                    <span className="text-[8px] text-gray-500">WEAPON & ENGINE FEEDBACK</span>
                  </div>
                  {settings.sound ? <Volume2 className="w-8 h-8 text-cyan-400" /> : <VolumeX className="w-8 h-8 text-gray-600" />}
                </button>
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xl transition-all border-b-8 border-cyan-950 uppercase shadow-[0_15px_30px_rgba(6,182,212,0.2)] active:translate-y-1 active:border-b-4"
              >
                Save & Close Terminal
              </button>
              <div className="flex items-center justify-center gap-2 opacity-20">
                <ShieldAlert className="w-4 h-4 text-cyan-500" />
                <span className="text-[8px] uppercase tracking-[0.5em] font-mono">EDN-SECURE-PROTOCOL ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {gameState === GameState.MENU && (
          <MainMenu 
            onStart={handleStartGame} 
            onContinue={handleContinueGame} 
            onOpenBase={() => openBase(GameState.MENU)} 
            onOpenLevelSelect={() => setGameState(GameState.LEVEL_SELECT)} 
            onOpenHowToPlay={() => setGameState(GameState.HOW_TO_PLAY)}
            hasSave={!!initialSaveData} 
          />
        )}
        
        {gameState === GameState.HOW_TO_PLAY && (
          <HowToPlay onBack={() => setGameState(GameState.MENU)} />
        )}

        {gameState === GameState.LEVEL_SELECT && (
          <LevelSelect currentUnlocked={maxUnlockedLevel} onSelect={handleSelectLevel} onBack={() => setGameState(GameState.MENU)} />
        )}

        {gameState === GameState.TITAN_SCENE && (
          <div className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center p-10 text-center font-orbitron">
            <div className="max-w-4xl space-y-8 animate-pulse">
              <h2 className="text-6xl font-black text-red-600 italic tracking-tighter uppercase">CRITICAL SYSTEM FAILURE</h2>
              <p className="text-2xl text-red-400 font-bold uppercase tracking-widest">The Gigantic Titan has initiated a localized EMP burst...</p>
              <div className="w-full h-2 bg-red-950 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 animate-[shimmer_2s_infinite]"></div>
              </div>
              <p className="text-xl text-gray-500 uppercase">All CyberBot squad signatures lost. Sector 21 is compromised.</p>
              <button 
                onClick={handleLevelComplete}
                className="px-12 py-4 bg-red-700 hover:bg-red-600 text-white font-black text-2xl border-b-8 border-red-900 transition-all uppercase"
              >
                Acknowledge Defeat
              </button>
            </div>
          </div>
        )}

        {gameState === GameState.SQUAD_SELECTION && (
          <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-10 font-orbitron">
            <h2 className="text-4xl font-black text-cyan-400 mb-8 uppercase italic tracking-tighter">Select Rescue Unit</h2>
            <p className="text-gray-400 mb-12 max-w-lg text-center uppercase text-sm tracking-widest">Only one unit can be deployed for the rescue mission. Choose wisely.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {upgrades.unlockedUnits.map(unit => (
                <button 
                  key={unit}
                  onClick={() => handleSquadSelect(unit)}
                  className="p-6 border-2 border-cyan-900 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/40 transition-all group flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-16 rounded-full bg-cyan-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldAlert className="w-8 h-8 text-cyan-400" />
                  </div>
                  <span className="text-xs font-black text-cyan-500 uppercase tracking-widest">{unit}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === GameState.BRIEFING && (
          <Briefing briefing={briefing || {} as LevelInfo} isLoading={isBriefingLoading} onConfirm={() => setGameState(GameState.PLAYING)} />
        )}

        {isGameVisible && (
          <GameView 
            level={level} 
            upgrades={upgrades} 
            isPaused={gameState === GameState.PAUSED} 
            onWin={handleLevelComplete} 
            onDie={handlePlayerDeath}
            onTitanScene={handleTitanScene}
          />
        )}

        {gameState === GameState.PAUSED && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 p-4">
            <div className="p-10 border-2 border-cyan-500 bg-black/80 relative overflow-hidden group max-w-full font-orbitron text-center">
              <h2 className="text-4xl md:text-6xl font-black text-cyan-400 italic tracking-tighter uppercase mb-6">SYSTEM SUSPENDED</h2>
              <div className="flex flex-col gap-4 items-center">
                <button onClick={() => setGameState(GameState.PLAYING)} className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-2xl border-b-4 border-cyan-900 transition-all w-full uppercase">RESUME MISSION</button>
                <button onClick={() => setGameState(GameState.MENU)} className="px-12 py-2 text-cyan-400 font-bold hover:text-white transition-all uppercase text-sm border border-cyan-900/30 hover:border-cyan-400 mt-2">ABORT TO HQ</button>
              </div>
            </div>
          </div>
        )}

        {gameState === GameState.MILESTONE_COMPLETE && (
          <MilestoneVictory 
            milestone={level <= 10 ? 1 : level <= 20 ? 2 : 3} 
            onContinue={handleMilestoneContinue} 
          />
        )}

        {gameState === GameState.LEVEL_COMPLETE && (
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-start md:justify-center z-50 p-6 overflow-y-auto pt-20 md:pt-6 font-orbitron">
            <h2 className="text-4xl md:text-5xl text-cyan-400 mb-2 font-black italic tracking-tighter animate-pulse uppercase text-center">Sector {level} Secured</h2>
            <div className="text-xl md:text-2xl text-yellow-400 mb-8 font-bold tracking-widest text-center">REWARD EARNED: ${[10, 20, 30].includes(level) ? 15000 : 300}</div>
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
              <button onClick={() => openBase(GameState.LEVEL_COMPLETE)} className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-sm border-b-4 border-yellow-800 transition-all w-full uppercase">RETURN TO BASE</button>
              {level < MAX_CAMPAIGN_LEVELS && (
                <button onClick={handleNextLevel} className="px-12 py-4 font-black rounded-sm transition-all w-full shadow-[0_0_30px_rgba(6,182,212,0.3)] uppercase tracking-widest text-xl bg-cyan-700 hover:bg-cyan-600 text-white">
                  Deploy to Sector {level + 1}
                </button>
              )}
              <button onClick={() => setGameState(GameState.MENU)} className="px-12 py-2 text-gray-400 font-bold hover:text-white transition-all uppercase text-sm mt-4 border border-gray-800 hover:border-gray-400 bg-gray-950/40 w-full">Return to HQ</button>
            </div>
          </div>
        )}

        {gameState === GameState.BASE && (
          <Shop 
            money={money} 
            upgrades={upgrades} 
            onBuyRobot={buyRobotTier} 
            onBuyWeapon={buyWeaponTier} 
            onUnlockUnit={unlockRobotUnit} 
            onToggleSquadMember={toggleSquadMember}
            onExit={handleBaseExit} 
            isFromMenu={baseOrigin === GameState.MENU} 
          />
        )}

        {gameState === GameState.GAMEOVER && (
          <GameOver level={level} onRetry={() => startLevel(level)} onMenu={() => setGameState(GameState.MENU)} />
        )}

        {gameState === GameState.VICTORY && <Victory onMenu={() => setGameState(GameState.MENU)} />}
      </div>
    </div>
  );
};

export default App;
