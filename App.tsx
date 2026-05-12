
import React, { useState, useEffect, useCallback } from 'react';
import { Settings as SettingsIcon, X, ShieldAlert, Key, BarChart3, Music as MusicIcon, Volume2, VolumeX, CheckCircle2, Database, LogOut } from 'lucide-react';
import { GameState, LevelInfo, RobotUnit, Upgrades } from './types';
import { getLevelBriefing, getStaticBriefing } from './services/geminiService';
import { soundService } from './services/soundService';
import { SECTORS } from './sectors';
import MainMenu from './components/MainMenu';
import Briefing from './components/Briefing';
import GameView from './components/GameView';
import GameOver from './components/GameOver';
import Victory from './components/Victory';
import MilestoneVictory from './components/ChapterVictory';
import Shop from './components/Shop';
import LevelSelect from './components/LevelSelect';
import HowToPlay from './components/HowToPlay';
import AuthPage from './components/AuthPage';

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
  const [user, setUser] = useState<{ id: string; username: string; twoFactorEnabled: boolean } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [initialSaveData, setInitialSaveData] = useState<any>(null);

  const [settings, setSettings] = useState(() => {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return { music: true, sound: true };
    try { return JSON.parse(data); } catch (e) { return { music: true, sound: true }; }
  });

  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [level, setLevel] = useState<number>(1);
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(1);
  const [money, setMoney] = useState<number>(0);
  const [isTitanSceneTriggered, setIsTitanSceneTriggered] = useState<boolean>(false);
  const [isSector22Unlocked, setIsSector22Unlocked] = useState<boolean>(false);
  const [upgrades, setUpgrades] = useState<Upgrades>(DEFAULT_UPGRADES);

  const [briefing, setBriefing] = useState<LevelInfo | null>(null);
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);
  const [baseOrigin, setBaseOrigin] = useState<GameState>(GameState.MENU);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'sound' | 'account' | 'security'>('sound');
  const [justSaved, setJustSaved] = useState(false);
  const [savePulse, setSavePulse] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Auth check failed', err);
      } finally {
        setIsAuthLoading(false);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const userSaveKey = `${SAVE_KEY}_${user.username}`;
      const data = localStorage.getItem(userSaveKey);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setLevel(parsed.level || 1);
          setMaxUnlockedLevel(parsed.maxUnlockedLevel || 1);
          setMoney(parsed.money || 0);
          setIsTitanSceneTriggered(parsed.isTitanSceneTriggered || false);
          setIsSector22Unlocked(parsed.isSector22Unlocked || false);
          setUpgrades(parsed.upgrades || DEFAULT_UPGRADES);
          setInitialSaveData(parsed);
        } catch (e) {
          console.error('Failed to parse save data', e);
        }
      }
    }
  }, [user]);

  const saveToDisk = useCallback(() => {
    if (!user) return;
    const userSaveKey = `${SAVE_KEY}_${user.username}`;
    const dataToSave = { level, maxUnlockedLevel, money, upgrades, isTitanSceneTriggered, isSector22Unlocked };
    localStorage.setItem(userSaveKey, JSON.stringify(dataToSave));
  }, [user, level, maxUnlockedLevel, money, upgrades, isTitanSceneTriggered, isSector22Unlocked]);

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

  const handleStartGame = async () => {
    setIsTutorialActive(false);
    startLevel(1);
  };

  const handleStartTutorial = () => {
    setIsTutorialActive(true);
    startLevel(1);
  };

  const handleContinueGame = () => {
    startLevel(level);
  };

  const handleLevelComplete = () => {
    const sector = SECTORS.find(s => s.id === level);
    const isMilestone = sector ? !!sector.boss : false;
    const reward = sector ? sector.reward : 300;
    setMoney(m => m + reward); 
    const newlyUnlocked = level + 1;
    if (newlyUnlocked > maxUnlockedLevel && newlyUnlocked <= MAX_CAMPAIGN_LEVELS) {
      setMaxUnlockedLevel(newlyUnlocked);
    }
    
    const isMajorMilestone = level % 10 === 0;
    
    if (level === 21 && isTitanSceneTriggered) {
      setIsSector22Unlocked(true);
    }

    if (isMajorMilestone) {
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
    if (upgrades.unlockedUnits.length >= 5) return; // Strict 5-member limit
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setGameState(GameState.MENU);
      // Reset state
      setLevel(1);
      setMaxUnlockedLevel(1);
      setMoney(0);
      setIsTitanSceneTriggered(false);
      setIsSector22Unlocked(false);
      setUpgrades(DEFAULT_UPGRADES);
      setInitialSaveData(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const handleResetProgress = () => {
    if (confirm('Are you sure? This will reset all your progress.')) {
      setLevel(1);
      setMaxUnlockedLevel(1);
      setMoney(0);
      setIsTitanSceneTriggered(false);
      setIsSector22Unlocked(false);
      setUpgrades(DEFAULT_UPGRADES);
      saveToDisk();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure? This will delete your account and all progress forever.')) {
      try {
        const res = await fetch('/api/auth/delete', { method: 'DELETE' });
        if (res.ok) {
          setUser(null);
          setGameState(GameState.MENU);
          // Reset state
          setLevel(1);
          setMaxUnlockedLevel(1);
          setMoney(0);
          setIsTitanSceneTriggered(false);
          setIsSector22Unlocked(false);
          setUpgrades(DEFAULT_UPGRADES);
          setInitialSaveData(null);
        }
      } catch (err) {
        console.error('Delete account failed', err);
      }
    }
  };

  const handleToggle2FA = async () => {
    try {
      const res = await fetch('/api/auth/2fa/toggle', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => prev ? { ...prev, twoFactorEnabled: data.twoFactorEnabled } : null);
      }
    } catch (err) {
      console.error('Toggle 2FA failed', err);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden select-none text-white font-rajdhani flex flex-col">
      {gameState !== GameState.PLAYING && (
        <button 
          onClick={() => setIsSettingsOpen(true)} 
          className="fixed top-4 left-4 z-[110] p-3 bg-gray-950/80 border border-cyan-900/50 text-cyan-500 hover:text-cyan-400 hover:border-cyan-400 hover:bg-cyan-950 transition-all rounded-full shadow-[0_0_15px_rgba(6,182,212,0.1)] group"
          title="Settings Menu"
        >
          <SettingsIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      )}

      <div className={`fixed top-4 right-4 z-[110] flex items-center gap-2 transition-all duration-300 pointer-events-none ${savePulse ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
        <div className="flex flex-col items-end">
           <div className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Mission_Data_Synced</div>
           <div className="text-[8px] font-bold text-emerald-600/60 uppercase font-mono">ENCRYPTED_UPLINK_SUCCESS</div>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,1)]"></div>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-black border-2 border-cyan-500 p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.3)] font-orbitron overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="mb-8 border-b-2 border-cyan-900 pb-4">
              <h2 className="text-4xl font-black italic text-cyan-400 tracking-tighter uppercase">Settings</h2>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-8 border-b border-cyan-900/30 pb-4">
              <button 
                onClick={() => setSettingsTab('sound')}
                className={`px-6 py-2 text-sm font-black uppercase tracking-widest transition-all ${settingsTab === 'sound' ? 'bg-cyan-500 text-black' : 'text-cyan-500 hover:bg-cyan-900/30'}`}
              >
                Sound
              </button>
              <button 
                onClick={() => setSettingsTab('account')}
                className={`px-6 py-2 text-sm font-black uppercase tracking-widest transition-all ${settingsTab === 'account' ? 'bg-cyan-500 text-black' : 'text-cyan-500 hover:bg-cyan-900/30'}`}
              >
                Account
              </button>
              <button 
                onClick={() => setSettingsTab('security')}
                className={`px-6 py-2 text-sm font-black uppercase tracking-widest transition-all ${settingsTab === 'security' ? 'bg-cyan-500 text-black' : 'text-cyan-500 hover:bg-cyan-900/30'}`}
              >
                Security
              </button>
            </div>
            
            <div className="min-h-[300px]">
              {settingsTab === 'sound' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Music</h3>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, music: !s.music }))}
                      className={`w-full p-6 flex items-center justify-between border transition-all ${settings.music ? 'border-cyan-500/50 bg-cyan-900/10' : 'border-gray-800 bg-gray-950 opacity-50'}`}
                    >
                      <span className="text-sm font-black uppercase tracking-widest">{settings.music ? 'ON' : 'OFF'}</span>
                      {settings.music ? <Volume2 className="w-6 h-6 text-cyan-400" /> : <VolumeX className="w-6 h-6 text-gray-600" />}
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Sound Effects</h3>
                    <button 
                      onClick={() => setSettings(s => ({ ...s, sound: !s.sound }))}
                      className={`w-full p-6 flex items-center justify-between border transition-all ${settings.sound ? 'border-cyan-500/50 bg-cyan-900/10' : 'border-gray-800 bg-gray-950 opacity-50'}`}
                    >
                      <span className="text-sm font-black uppercase tracking-widest">{settings.sound ? 'ON' : 'OFF'}</span>
                      {settings.sound ? <Volume2 className="w-6 h-6 text-cyan-400" /> : <VolumeX className="w-6 h-6 text-gray-600" />}
                    </button>
                  </div>
                </div>
              )}

              {settingsTab === 'account' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-gray-950 p-6 border border-gray-800 rounded space-y-6">
                    <div>
                      <div className="flex justify-between text-[10px] mb-2">
                        <span className="text-gray-500 font-bold uppercase">Levels Finished</span>
                        <span className="text-cyan-400 font-mono">{maxUnlockedLevel}/{MAX_CAMPAIGN_LEVELS}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]" style={{ width: `${(maxUnlockedLevel/MAX_CAMPAIGN_LEVELS)*100}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleSaveProgress}
                        className="w-full flex items-center justify-between p-4 bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 hover:border-emerald-500 transition-all text-xs font-black uppercase text-emerald-400"
                      >
                        <span className="flex items-center gap-2"><Database className="w-4 h-4" /> Save Game</span>
                        <span>{justSaved ? 'SAVED' : 'SAVE'}</span>
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 hover:border-red-500 transition-all text-xs font-black uppercase text-red-400"
                      >
                        <span className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Log Out</span>
                        <span>EXIT</span>
                      </button>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-6 border-2 border-red-600 bg-red-950/20 space-y-4">
                    <h3 className="text-red-500 font-black uppercase tracking-widest text-sm">Danger Zone</h3>
                    <div className="grid grid-cols-1 gap-3">
                      <button 
                        onClick={handleResetProgress}
                        className="w-full p-3 bg-red-600/20 hover:bg-red-600/40 border border-red-600/50 text-red-400 text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Reset progress
                      </button>
                      <button 
                        onClick={handleDeleteAccount}
                        className="w-full p-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        Delete account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'security' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Security Key</h3>
                    <p className="text-[10px] text-gray-500 uppercase leading-relaxed">Use this to connect your AI brain to the game.</p>
                    <button 
                      onClick={() => { handleOpenKeySelection(); setIsSettingsOpen(false); }}
                      className="w-full flex items-center justify-between p-6 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-600/30 hover:border-cyan-500 transition-all text-sm font-black uppercase"
                    >
                      <span className="flex items-center gap-2"><Key className="w-5 h-5" /> Set Key</span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </button>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-cyan-900/30">
                    <h3 className="text-xs font-black uppercase tracking-widest text-cyan-400">Extra Protection</h3>
                    <button 
                      onClick={handleToggle2FA}
                      className={`w-full p-4 transition-all text-xs font-black uppercase ${
                        user?.twoFactorEnabled 
                          ? 'bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 hover:border-red-500 text-red-400' 
                          : 'bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-600/30 hover:border-cyan-500 text-cyan-400'
                      }`}
                    >
                      {user?.twoFactorEnabled ? 'Disable 2-Factor Authentication' : 'Enable 2-Factor Authentication'}
                    </button>
                    {user?.twoFactorEnabled && (
                      <p className="text-[8px] text-emerald-500/60 uppercase tracking-widest text-center mt-2">
                        Status: Active (Code: 123456)
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-lg transition-all border-b-4 border-cyan-900 uppercase active:translate-y-1 active:border-b-0"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden relative">
        {gameState === GameState.MENU && (
          <MainMenu 
            onStart={handleStartGame} 
            onContinue={handleContinueGame} 
            onStartTutorial={handleStartTutorial}
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
              {upgrades.unlockedUnits
                .filter(unit => unit !== RobotUnit.SENTINEL)
                .map(unit => (
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
            isTutorial={isTutorialActive}
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
            milestone={Math.floor(level / 10)} 
            onContinue={handleMilestoneContinue} 
          />
        )}

        {gameState === GameState.LEVEL_COMPLETE && (
          <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-start md:justify-center z-50 p-6 overflow-y-auto pt-20 md:pt-6 font-orbitron">
            <h2 className="text-4xl md:text-5xl text-cyan-400 mb-2 font-black italic tracking-tighter animate-pulse uppercase text-center">Sector {level} Secured</h2>
            <div className="text-xl md:text-2xl text-yellow-400 mb-8 font-bold tracking-widest text-center">REWARD EARNED: ${SECTORS.find(s => s.id === level)?.reward || 300}</div>
            <div className="flex flex-col items-center gap-6 w-full max-w-xs">
              <button onClick={() => openBase(GameState.LEVEL_COMPLETE)} style={{ height: '65px' }} className="px-8 py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-sm border-b-4 border-yellow-800 transition-all w-full uppercase">RETURN TO BASE</button>
              {level < MAX_CAMPAIGN_LEVELS && (
                <button onClick={handleNextLevel} style={{ height: '88px' }} className="px-12 py-4 font-black rounded-sm transition-all w-full shadow-[0_0_30px_rgba(6,182,212,0.3)] uppercase tracking-widest text-xl bg-cyan-700 hover:bg-cyan-600 text-white">
                  Deploy to Sector {level + 1}
                </button>
              )}
              <button onClick={() => setGameState(GameState.MENU)} style={{ height: '50px' }} className="px-12 py-2 text-gray-400 font-bold hover:text-white transition-all uppercase text-sm mt-4 border border-gray-800 hover:border-gray-400 bg-gray-950/40 w-full">Return to HQ</button>
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
