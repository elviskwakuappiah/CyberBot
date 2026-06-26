import { safeStorage } from './safeStorage';

export type MissionDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: 'COMPLETE_SECTOR' | 'COMPLETE_BOSS_SECTOR' | 'COMPLETE_HIGH_SECTOR' | 'UPGRADE_ARMOR' | 'UPGRADE_WEAPON' | 'RECRUIT_UNIT' | 'SQUAD_SIZE_3';
  progress: number;
  target: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
  difficulty: MissionDifficulty;
}

const EASY_MISSIONS: Omit<DailyMission, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'easy_complete_sector',
    title: 'Steel Recon',
    description: 'Secure 1 Sector in the campaign.',
    type: 'COMPLETE_SECTOR',
    target: 1,
    reward: 200,
    difficulty: 'EASY',
  },
  {
    id: 'easy_upgrade_armor',
    title: 'Chassis Upgrade',
    description: 'Perform 1 Squad Armor Enhancement in the Base.',
    type: 'UPGRADE_ARMOR',
    target: 1,
    reward: 250,
    difficulty: 'EASY',
  },
  {
    id: 'easy_upgrade_weapon',
    title: 'Weapon Overclock',
    description: 'Perform 1 Weapon Overclock in the Base.',
    type: 'UPGRADE_WEAPON',
    target: 1,
    reward: 250,
    difficulty: 'EASY',
  },
];

const NORMAL_MISSIONS: Omit<DailyMission, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'normal_complete_sector',
    title: 'Steel Vanguard',
    description: 'Secure 2 Sectors to clear rogue machine outposts.',
    type: 'COMPLETE_SECTOR',
    target: 2,
    reward: 450,
    difficulty: 'NORMAL',
  },
  {
    id: 'normal_complete_high',
    title: 'Deep Frontier Strike',
    description: 'Secure any Sector 5 or higher.',
    type: 'COMPLETE_HIGH_SECTOR',
    target: 1,
    reward: 400,
    difficulty: 'NORMAL',
  },
  {
    id: 'normal_recruit',
    title: 'Frame Acquisition',
    description: 'Recruit a new Robot Frame to expand your reserve.',
    type: 'RECRUIT_UNIT',
    target: 1,
    reward: 450,
    difficulty: 'NORMAL',
  },
  {
    id: 'normal_squad_size',
    title: 'Heavy Strike Group',
    description: 'Form an active squad with 3 or more active units.',
    type: 'SQUAD_SIZE_3',
    target: 1,
    reward: 350,
    difficulty: 'NORMAL',
  },
];

const HARD_MISSIONS: Omit<DailyMission, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'hard_complete_sector',
    title: 'Grand Offensive',
    description: 'Establish total domination by securing 3 Sectors.',
    type: 'COMPLETE_SECTOR',
    target: 3,
    reward: 850,
    difficulty: 'HARD',
  },
  {
    id: 'hard_complete_boss',
    title: 'High-Value Target',
    description: 'Successfully secure a Boss Sector (Sector 10, 20, or 30).',
    type: 'COMPLETE_BOSS_SECTOR',
    target: 1,
    reward: 800,
    difficulty: 'HARD',
  },
  {
    id: 'hard_complete_high',
    title: 'Deep Frontier Purge',
    description: 'Secure any Sector 5 or higher 2 times.',
    type: 'COMPLETE_HIGH_SECTOR',
    target: 2,
    reward: 800,
    difficulty: 'HARD',
  },
  {
    id: 'hard_upgrade_armor',
    title: 'Titanium Chassis Overhaul',
    description: 'Perform 2 Squad Armor Enhancements in the Base.',
    type: 'UPGRADE_ARMOR',
    target: 2,
    reward: 750,
    difficulty: 'HARD',
  },
  {
    id: 'hard_upgrade_weapon',
    title: 'Military Weapon Overclock',
    description: 'Perform 2 Weapon Overclocks in the Base.',
    type: 'UPGRADE_WEAPON',
    target: 2,
    reward: 750,
    difficulty: 'HARD',
  },
];

const getTodayKey = (): string => {
  // Return YYYY-MM-DD
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Seed-based random number generator to ensure identical selection on a given day
const getSeededRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return () => {
    h = Math.imul(h ^ h >>> 16, 2246822507);
    h = Math.imul(h ^ h >>> 13, 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
};

export const missionService = {
  getDailyMissions: (username: string): DailyMission[] => {
    const today = getTodayKey();
    const storageKey = `cyberbot_daily_missions_${username}`;
    const dateKey = `cyberbot_daily_missions_date_${username}`;

    const savedDate = safeStorage.getItem(dateKey);
    const savedMissions = safeStorage.getItem(storageKey);

    if (savedDate === today && savedMissions) {
      try {
        return JSON.parse(savedMissions);
      } catch (e) {
        console.error('Failed to parse saved daily missions', e);
      }
    }

    // Generate new missions for today - exactly 1 Easy, 1 Normal, 1 Hard
    const randEasy = getSeededRandom(`${today}_${username}_easy`);
    const randNormal = getSeededRandom(`${today}_${username}_normal`);
    const randHard = getSeededRandom(`${today}_${username}_hard`);

    const selectedEasy = EASY_MISSIONS[Math.floor(randEasy() * EASY_MISSIONS.length)];
    const selectedNormal = NORMAL_MISSIONS[Math.floor(randNormal() * NORMAL_MISSIONS.length)];
    const selectedHard = HARD_MISSIONS[Math.floor(randHard() * HARD_MISSIONS.length)];

    const selected: DailyMission[] = [
      {
        ...selectedEasy,
        id: `${selectedEasy.id}_${today}_0`,
        progress: 0,
        completed: false,
        claimed: false,
      } as DailyMission,
      {
        ...selectedNormal,
        id: `${selectedNormal.id}_${today}_1`,
        progress: 0,
        completed: false,
        claimed: false,
      } as DailyMission,
      {
        ...selectedHard,
        id: `${selectedHard.id}_${today}_2`,
        progress: 0,
        completed: false,
        claimed: false,
      } as DailyMission,
    ];

    safeStorage.setItem(dateKey, today);
    safeStorage.setItem(storageKey, JSON.stringify(selected));

    return selected;
  },

  saveMissions: (username: string, missions: DailyMission[]): void => {
    const storageKey = `cyberbot_daily_missions_${username}`;
    safeStorage.setItem(storageKey, JSON.stringify(missions));
  },

  progressMission: (username: string, type: DailyMission['type'], amount: number = 1): { missions: DailyMission[]; newlyCompleted: boolean } => {
    const missions = missionService.getDailyMissions(username);
    let updated = false;
    let newlyCompleted = false;

    const nextMissions = missions.map(m => {
      if (m.type === type && !m.completed && !m.claimed) {
        const nextProgress = Math.min(m.target, m.progress + amount);
        const isNowCompleted = nextProgress >= m.target;
        if (isNowCompleted) {
          newlyCompleted = true;
        }
        updated = true;
        return {
          ...m,
          progress: nextProgress,
          completed: isNowCompleted,
        };
      }
      return m;
    });

    if (updated) {
      missionService.saveMissions(username, nextMissions);
    }

    return { missions: nextMissions, newlyCompleted };
  },

  claimMissionReward: (username: string, missionId: string): { success: boolean; rewardAmount: number; missions: DailyMission[] } => {
    const missions = missionService.getDailyMissions(username);
    let rewardAmount = 0;
    let success = false;

    const nextMissions = missions.map(m => {
      if (m.id === missionId && m.completed && !m.claimed) {
        rewardAmount = m.reward;
        success = true;
        return {
          ...m,
          claimed: true,
        };
      }
      return m;
    });

    if (success) {
      missionService.saveMissions(username, nextMissions);
    }

    return { success, rewardAmount, missions: nextMissions };
  }
};
