
export enum GameState {
  MENU = 'MENU',
  BRIEFING = 'BRIEFING',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAMEOVER = 'GAMEOVER',
  VICTORY = 'VICTORY',
  MILESTONE_COMPLETE = 'MILESTONE_COMPLETE',
  LEVEL_COMPLETE = 'LEVEL_COMPLETE',
  BASE = 'BASE',
  LEVEL_SELECT = 'LEVEL_SELECT',
  HOW_TO_PLAY = 'HOW_TO_PLAY',
  TITAN_SCENE = 'TITAN_SCENE',
  SQUAD_SELECTION = 'SQUAD_SELECTION'
}

export enum RobotUnit {
  SENTINEL = 'SENTINEL',
  STRIKER = 'STRIKER',
  FALCON = 'FALCON',
  TITAN = 'TITAN',
  SPECTER = 'SPECTER',
  VANGUARD = 'VANGUARD',
  NIGHTSHADE = 'NIGHTSHADE',
  BLAZE = 'BLAZE',
  GLITCH = 'GLITCH',
  OMEGA = 'OMEGA'
}

export interface LevelInfo {
  level: number;
  title: string;
  description: string;
  threatLevel: string;
  enemyType: string;
}

export interface Upgrades {
  robotTier: number;
  weaponTier: number;
  unlockedUnits: RobotUnit[];
  activeSquad: RobotUnit[];
}

export interface Vector {
  x: number;
  y: number;
}

export interface Entity {
  pos: Vector;
  vel: Vector;
  width: number;
  height: number;
  health: number;
  maxHealth: number;
}

export interface Bullet extends Entity {
  owner: 'player' | 'enemy';
  damage?: number;
  color?: string;
}

export interface Enemy extends Entity {
  id: number;
  isDead: boolean;
  isDying?: boolean;
  deathTimer?: number;
  type: string;
  lastShot: number;
  facing?: number;
  hasSplit?: boolean;
  sequenceStage?: number;
  sequenceTimer?: number;
  isTransformed?: boolean;
  transformTimer?: number;
  unit?: RobotUnit;
}
