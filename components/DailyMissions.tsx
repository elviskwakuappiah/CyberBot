import React, { useEffect, useState } from 'react';
import { Calendar, Trophy, CheckCircle2, Award, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyMission, missionService } from '../services/missionService';
import { soundService } from '../services/soundService';

interface DailyMissionsProps {
  username: string;
  onClaimReward: (reward: number) => void;
  onClose: () => void;
}

export const DailyMissions: React.FC<DailyMissionsProps> = ({ username, onClaimReward, onClose }) => {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [timeLeft, setTimeLeft] = useState('');

  // Load missions
  useEffect(() => {
    setMissions(missionService.getDailyMissions(username));
  }, [username]);

  // Midnight countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();

      const hrs = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClaim = (missionId: string) => {
    const res = missionService.claimMissionReward(username, missionId);
    if (res.success) {
      soundService.playShoot(); // or some high pitch sound
      onClaimReward(res.rewardAmount);
      setMissions(res.missions);
    }
  };

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="max-w-xl w-full bg-black border-2 border-cyan-500 p-6 md:p-8 relative shadow-[0_0_50px_rgba(6,182,212,0.35)] font-orbitron flex flex-col max-h-[90vh]"
      >
        {/* Header Decors */}
        <div className="absolute top-0 right-0 p-2 text-[8px] text-cyan-800 font-mono select-none">
          SECURE_UPLINK_v7.1
        </div>

        {/* Title */}
        <div className="mb-6 border-b-2 border-cyan-900 pb-4">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="text-3xl font-black italic text-cyan-400 tracking-tighter uppercase">
                Daily Missions
              </h2>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                Tactical Challenges • Updated Every 24 Hours
              </p>
            </div>
          </div>
        </div>

        {/* Timer / Progress Bar */}
        <div className="grid grid-cols-2 gap-4 mb-6 bg-cyan-950/10 border border-cyan-900/40 p-4 rounded-lg">
          <div>
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              Next Rotation In
            </div>
            <div className="text-xl font-mono font-black text-cyan-400 tracking-wider">
              {timeLeft || '00:00:00'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-end gap-1.5 mb-1">
              <Award className="w-3.5 h-3.5 text-cyan-500" />
              Day Progress
            </div>
            <div className="text-xl font-mono font-black text-emerald-400 tracking-wider">
              {completedCount} / 3 COMPLETED
            </div>
          </div>
        </div>

        {/* Mission List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[250px]">
          <AnimatePresence mode="wait">
            {missions.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 font-mono text-xs uppercase animate-pulse">
                Establishing military neural link...
              </div>
            ) : (
              missions.map((mission) => {
                const isClaimable = mission.completed && !mission.claimed;
                const isClaimed = mission.claimed;

                return (
                  <motion.div
                    key={mission.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 border rounded-xl flex flex-col justify-between transition-all ${
                      isClaimed
                        ? 'border-zinc-800 bg-zinc-950/20 opacity-50'
                        : isClaimable
                        ? 'border-emerald-500 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                        : mission.difficulty === 'EASY'
                        ? 'border-emerald-950 bg-black hover:border-emerald-500/30'
                        : mission.difficulty === 'NORMAL'
                        ? 'border-cyan-950 bg-black hover:border-cyan-500/30'
                        : 'border-red-950/80 bg-red-950/5 hover:border-red-500/35 shadow-[inset_0_0_10px_rgba(239,68,68,0.02)]'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-black uppercase tracking-wider ${
                              isClaimed
                                ? 'text-zinc-500 line-through'
                                : isClaimable
                                ? 'text-emerald-400'
                                : 'text-white'
                            }`}
                          >
                            {mission.title}
                          </span>
                          <span
                            className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest leading-none ${
                              isClaimed
                                ? 'border-zinc-800 text-zinc-600 bg-zinc-950/10'
                                : mission.difficulty === 'EASY'
                                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-950/20'
                                : mission.difficulty === 'NORMAL'
                                ? 'border-cyan-500/30 text-cyan-400 bg-cyan-950/20'
                                : 'border-red-500/30 text-red-400 bg-red-950/20 animate-pulse'
                            }`}
                          >
                            {mission.difficulty}
                          </span>
                          <span
                            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-widest flex items-center gap-1 leading-none ${
                              isClaimed
                                ? 'border-zinc-800/50 text-zinc-600 bg-zinc-950/5'
                                : 'border-cyan-950 text-cyan-400/85 bg-cyan-950/10'
                            }`}
                          >
                            <Clock className={`w-2.5 h-2.5 ${isClaimed ? 'text-zinc-600' : 'text-cyan-500/80 animate-pulse'}`} />
                            {timeLeft || '00:00:00'}
                          </span>
                          {isClaimable && (
                            <span className="text-[8px] font-black bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest animate-pulse leading-none">
                              Ready to Claim
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                          {mission.description}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-black text-yellow-400">
                          +${mission.reward}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Buttons */}
                    <div className="mt-4 flex items-center justify-between gap-4 border-t border-zinc-900/50 pt-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                          <span>System Objective</span>
                          <span className="font-mono">
                            {mission.progress} / {mission.target}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isClaimed
                                ? 'bg-zinc-700'
                                : isClaimable
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                                : mission.difficulty === 'EASY'
                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                                : mission.difficulty === 'NORMAL'
                                ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                                : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                            }`}
                            style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isClaimed ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            <CheckCircle2 className="w-4 h-4 text-zinc-600" />
                            Claimed
                          </div>
                        ) : isClaimable ? (
                          <button
                            onClick={() => handleClaim(mission.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider px-4 py-2 rounded-lg border-b-2 border-emerald-800 transition-all flex items-center gap-1 relative overflow-hidden group"
                          >
                            Claim Reward
                            <Sparkles className="w-3 h-3 animate-spin [animation-duration:3s]" />
                          </button>
                        ) : (
                          <div className={`text-[9px] font-mono font-bold uppercase tracking-widest px-3 py-1.5 rounded border ${
                            mission.difficulty === 'EASY'
                              ? 'border-emerald-950 text-emerald-600 bg-emerald-950/10'
                              : mission.difficulty === 'NORMAL'
                              ? 'border-cyan-950 text-cyan-600 bg-cyan-950/10'
                              : 'border-red-950 text-red-600 bg-red-950/10'
                          }`}>
                            Active
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer/Close Button */}
        <div className="mt-8">
          <button
            onClick={onClose}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-lg transition-all border-b-4 border-cyan-900 uppercase active:translate-y-1 active:border-b-0"
          >
            Acknowledge Protocols
          </button>
        </div>
      </motion.div>
    </div>
  );
};
