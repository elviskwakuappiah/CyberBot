
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RobotUnit, Bullet, Enemy, Upgrades, Sector, SectorTheme } from '../types';
import { soundService } from '../services/soundService';
import { SECTORS } from '../sectors';

interface GameViewProps {
  level: number;
  upgrades: Upgrades;
  isPaused: boolean;
  isTutorial?: boolean;
  onWin: () => void;
  onDie: () => void;
  onTitanScene: () => void;
}

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;
const GRAVITY = 0.5;
const GROUND_Y = 750;
const DEATH_DURATION = 60; 

interface PlayerEntity {
  unit: RobotUnit;
  pos: { x: number; y: number };
  vel: { x: number; y: number };
  width: number;
  height: number;
  facing: number;
  grounded: boolean;
  lastShot: number;
  invulnerable: number;
  health: number;
  maxHealth: number;
  isTransformed: boolean;
  isDying?: boolean;
  deathTimer?: number;
  id: string;
  flightActive?: boolean;
  abilityCooldown: number;
  abilityActiveTimer: number;
}

const ROBOT_STATS: Record<RobotUnit, any> = {
  [RobotUnit.SENTINEL]: { 
    name: "SENTINEL", color: '#ffffff', hpMult: 1.0, 
    robot: { speed: 5, jump: -12, fireRate: 15 }, 
    alt: { speed: 10, jump: -6, fireRate: 25, type: 'Police Car' },
    ability: { name: "FORCE SHIELD", cooldown: 300, duration: 120 }
  },
  [RobotUnit.STRIKER]: { 
    name: "STRIKER", color: '#fbbf24', hpMult: 0.8, 
    robot: { speed: 7, jump: -10, fireRate: 10 }, 
    alt: { speed: 15, jump: -4, fireRate: 20, type: 'Police Motorcycle' },
    ability: { name: "TURBO DASH", cooldown: 180, duration: 20 }
  },
  [RobotUnit.FALCON]: { 
    name: "FALCON", color: '#22d3ee', hpMult: 0.7, 
    robot: { speed: 6, jump: -15, fireRate: 12 }, 
    alt: { speed: 14, jump: -12, fireRate: 15, type: 'Jet' },
    ability: { name: "AIR STRIKE", cooldown: 400, duration: 60 }
  },
  [RobotUnit.TITAN]: { 
    name: "TITAN", color: '#9333ea', hpMult: 2.5, 
    robot: { speed: 3.5, jump: -13, fireRate: 30 }, 
    alt: { speed: 5, jump: 0, fireRate: 20, type: 'Tank' },
    ability: { name: "GROUND SLAM", cooldown: 350, duration: 40 }
  },
  [RobotUnit.SPECTER]: { 
    name: "SPECTER", color: '#a855f7', hpMult: 0.6, 
    robot: { speed: 6, jump: -11, fireRate: 20 }, 
    alt: { speed: 8, jump: -5, fireRate: 40, type: 'Ambulance' },
    ability: { name: "STEALTH CLOAK", cooldown: 500, duration: 180 }
  },
  [RobotUnit.VANGUARD]: { 
    name: "VANGUARD", color: '#10b981', hpMult: 2.0, 
    robot: { speed: 4.5, jump: -12, fireRate: 25 }, 
    alt: { speed: 7, jump: -4, fireRate: 30, type: 'Fire Truck' },
    ability: { name: "REPAIR NANO", cooldown: 600, duration: 100 }
  },
  [RobotUnit.NIGHTSHADE]: { 
    name: "NIGHTSHADE", color: '#6366f1', hpMult: 0.9, 
    robot: { speed: 8, jump: -14, fireRate: 12 }, 
    alt: { speed: 12, jump: -10, fireRate: 18, type: 'Cyber Tiger' },
    ability: { name: "SHADOW POUNCE", cooldown: 240, duration: 30 }
  },
  [RobotUnit.BLAZE]: { 
    name: "BLAZE", color: '#f97316', hpMult: 1.2, 
    robot: { speed: 5.5, jump: -11, fireRate: 18 }, 
    alt: { speed: 18, jump: -6, fireRate: 15, type: 'Race Car' },
    ability: { name: "INFERNO TRAIL", cooldown: 300, duration: 150 }
  },
  [RobotUnit.GLITCH]: { 
    name: "GLITCH", color: '#ec4899', hpMult: 1.0, 
    robot: { speed: 6, jump: -12, fireRate: 14 }, 
    alt: { speed: 12, jump: -12, fireRate: 16, type: 'Flying Car' },
    ability: { name: "EMP BURST", cooldown: 450, duration: 20 }
  },
  [RobotUnit.OMEGA]: { 
    name: "OMEGA", color: '#ffffff', hpMult: 3.0, 
    robot: { speed: 8, jump: -16, fireRate: 10 }, 
    alt: { speed: 6, jump: -8, fireRate: 10, type: 'Blimp' },
    ability: { name: "OMEGA BEAM", cooldown: 800, duration: 60 }
  },
};

const GameView: React.FC<GameViewProps> = ({ level, upgrades, isPaused, isTutorial, onWin, onDie, onTitanScene }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCutscene, setShowCutscene] = useState(false);
  const [cutsceneStep, setCutsceneStep] = useState(0);
  const [tutorialStep, setTutorialStep] = useState(0);

  const tutorialMessages = [
    { title: "MOVEMENT", text: "Use WASD or ARROW KEYS to move your Sentinel unit.", key: "KeyW" },
    { title: "JUMPING", text: "Press W or UP to jump. Double jump is available for most forms.", key: "KeyW" },
    { title: "COMBAT", text: "Press SPACE to fire your primary weapon systems.", key: "Space" },
    { title: "TRANSFORM", text: "Tap SHIFT to toggle Alt-Mode. Higher speed, different mobility.", key: "ShiftLeft" },
    { title: "TACTICAL ABILITY", text: "Press E to activate your unique ability (Force Shield for Sentinel).", key: "KeyE" },
    { title: "SQUAD CONTROL", text: "Press Q to switch the active squad leader.", key: "KeyQ" },
    { title: "COMBINER", text: "If you have 5 units, press C to merge into the ULTIMATE CYBERBOT.", key: "KeyC" },
  ];

  const engineRef = useRef({
    players: [] as PlayerEntity[],
    enemies: [] as Enemy[],
    bullets: [] as Bullet[],
    keys: {} as Record<string, boolean>,
    frame: 0,
    cameraX: 0,
    cameraY: 0,
    isPaused: isPaused,
    level: level,
    upgrades: upgrades,
    isCombined: false,
    combineSequence: 0,
    combineTimer: 0,
    uncombineSequence: 0,
    uncombineTimer: 0,
    isUncombiningFromDeath: false,
    combinedHealth: 0,
    combinedMaxHealth: 0,
    activeLeaderIndex: 0,
    winTriggered: false,
    gameOverTriggered: false,
    isShipActive: false,
    shipPos: { x: 0, y: 0 },
    shipVel: { x: 0, y: 0 },
    shipHealth: 2000,
    shipMaxHealth: 2000,
    laserActive: false,
    grabbedBodyIndex: -1,
    bodies: [] as any[],
    rescueShipPos: { x: 1200, y: GROUND_Y - 150 },
    bodiesCollected: 0,
    cutsceneType: null as 'titan_laser' | null,
    cutsceneTimer: 0,
  });

  useEffect(() => { 
    engineRef.current.isPaused = isPaused || showCutscene; 
    engineRef.current.level = level;
    engineRef.current.upgrades = upgrades;
  }, [isPaused, level, upgrades, showCutscene]);

  const drawMechanicalPart = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, cornerRadius = 4) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, cornerRadius);
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, color);
    grad.addColorStop(0.3, '#ffffff88');
    grad.addColorStop(1, '#000000aa');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  const drawDrone = (ctx: CanvasRenderingContext2D, en: Enemy, frame: number) => {
    ctx.save();
    ctx.translate(en.pos.x + en.width/2, en.pos.y + en.height/2);

    if (en.isTransformed) {
      // Evil Seeker Humanoid
      ctx.scale(en.facing || 1, 1);
      drawHumanoid(ctx, en.isDying ? '#111' : '#441111', frame, true, 1.2, 1.2, en.isDying, en.deathTimer);
      // Red eyes
      ctx.fillStyle = '#ff0000';
      ctx.beginPath(); ctx.arc(-5, -25, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -25, 2, 0, Math.PI * 2); ctx.fill();
    } else {
      const hover = Math.sin(frame * 0.1) * 5;
      ctx.translate(0, hover);

      // Body
      drawMechanicalPart(ctx, -20, -10, 40, 20, en.isDying ? '#111' : '#333', 10);
      // Core
      ctx.fillStyle = en.isDying ? '#000' : '#ff0055';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      // Arms
      const rot = frame * 0.4;
      for(let i=0; i<4; i++) {
          ctx.save();
          ctx.rotate(rot + (i * Math.PI / 2));
          drawMechanicalPart(ctx, 15, -2, 10, 4, '#1a1a1a', 2);
          ctx.restore();
      }
    }
    ctx.restore();
  };

  const drawBoss = (ctx: CanvasRenderingContext2D, en: Enemy, frame: number) => {
    ctx.save();
    ctx.translate(en.pos.x + en.width / 2, en.pos.y + en.height / 2);
    ctx.scale(en.facing || 1, 1);
    
    let alpha = 1;
    if (en.isDying) {
      const progress = (en.deathTimer || 0) / DEATH_DURATION;
      ctx.scale(1, 1 - progress * 0.4);
      ctx.translate(0, (en.height * 0.2) * progress);
      alpha = 1 - progress;
    } else {
      const tilt = (en.vel.x * 0.05);
      ctx.rotate(tilt);
    }
    ctx.globalAlpha = alpha;

    const failThresh = en.isDying ? (DEATH_DURATION - (en.deathTimer || 0)) / DEATH_DURATION : 1.0;
    const coreActive = !en.isDying || (Math.random() < failThresh);
    const coreColor = en.isDying ? (coreActive ? '#333' : '#000') : '#ff0000';

    if (en.type === 'titan' || en.type === 'omega_annihilator') {
      ctx.scale(2.5, 2.5);
      drawHumanoid(ctx, en.isDying ? '#222' : '#222', frame, true, 1, 1.2, en.isDying, en.deathTimer);
      ctx.fillStyle = coreColor;
      ctx.beginPath(); ctx.arc(-5, -28, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -28, 3, 0, Math.PI * 2); ctx.fill();
    } else if (en.type === 'dragon' || en.type === 'swarm_queen') {
      const time = frame * 0.1;
      for (let i = 0; i < 8; i++) {
        const ox = -i * 30;
        const oy = en.isDying ? 0 : Math.sin(time + i * 0.5) * 40;
        ctx.save();
        ctx.translate(ox, oy);
        drawMechanicalPart(ctx, -15, -15, 30, 30, i === 0 ? (en.isDying ? '#111' : '#ff0055') : '#220011', 8);
        if (i === 0) { 
          ctx.fillStyle = coreColor;
          ctx.fillRect(5, -8, 8, 4);
          ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(30, -10); ctx.lineTo(30, 10); ctx.fill();
        }
        ctx.restore();
      }
    } else if (en.type === 'omnidroid' || en.type === 'plasma_sentinel') {
      const legTime = frame * 0.2;
      ctx.fillStyle = en.isDying ? '#050505' : '#1a1a1a';
      ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = en.isDying ? '#111' : '#ff0055'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = coreColor;
      ctx.beginPath(); ctx.arc(10, 0, 8, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 4; i++) {
        const angle = en.isDying ? (i * Math.PI / 2) : legTime + (i * Math.PI / 2);
        const lx = Math.cos(angle) * 60;
        const ly = Math.sin(angle) * 60;
        ctx.strokeStyle = '#222'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lx, ly); ctx.stroke();
        ctx.fillStyle = en.isDying ? '#111' : '#ff0055'; ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
      }
    } else if (en.type === 'tank' || en.type === 'fortress_tank') {
      const isMoving = Math.abs(en.vel.x) > 0.1 && !en.isDying;
      const rock = isMoving ? Math.sin(frame * 0.2) * 2 : 0;
      const treadOffset = (frame * en.vel.x * 2) % 40;

      if (!en.isTransformed) {
         drawHumanoid(ctx, en.isDying ? '#221111' : '#552222', frame, true, 1, 1.5, en.isDying, en.deathTimer);
      } else {
        ctx.save();
        ctx.translate(0, rock);
        drawMechanicalPart(ctx, -45, 10, 90, 30, '#0a0a0a', 8);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.setLineDash([10, 10]);
        ctx.lineDashOffset = -treadOffset; ctx.beginPath();
        ctx.moveTo(-40, 18); ctx.lineTo(40, 18); ctx.moveTo(-40, 32); ctx.lineTo(40, 32);
        ctx.stroke(); ctx.setLineDash([]);
        drawMechanicalPart(ctx, -35, -15, 75, 30, en.isDying ? '#1a0d0d' : '#331111', 4);
        ctx.save();
        const recoil = (frame % 120 < 10 && !en.isDying) ? -5 : 0;
        ctx.translate(recoil, 0);
        drawMechanicalPart(ctx, -20, -32, 45, 22, en.isDying ? '#1a0d0d' : '#552222', 2);
        drawMechanicalPart(ctx, 15, -26, 50, 10, '#050505', 1);
        ctx.restore();
        ctx.fillStyle = coreColor; ctx.fillRect(15, -24, 6, 4);
        ctx.restore();
      }
    } else if (en.type === 'scout_commander' || en.type === 'void_reaper') {
      ctx.scale(1.5, 1.5);
      const stealth = en.type === 'void_reaper' && !en.isDying ? 0.3 + Math.sin(frame * 0.1) * 0.2 : 1.0;
      ctx.globalAlpha *= stealth;
      drawHumanoid(ctx, en.isDying ? '#111' : (en.type === 'void_reaper' ? '#4400ff' : '#ffaa00'), frame, true, 1, 1.0, en.isDying, en.deathTimer);
      ctx.fillStyle = coreColor;
      ctx.beginPath(); ctx.arc(-3, -25, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3, -25, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };

  const drawAltMode = (ctx: CanvasRenderingContext2D, unit: RobotUnit, frame: number, alpha: number, vel: {x:number}, flightActive?: boolean, isDying?: boolean, deathTimer?: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    const stats = ROBOT_STATS[unit];
    const baseColor = stats.color;
    const color = isDying ? '#1a1a1a' : baseColor;
    const tilt = vel.x * 0.02;
    if (!isDying) ctx.rotate(tilt);

    switch (unit) {
      case RobotUnit.SENTINEL: 
        drawMechanicalPart(ctx, -35, -10, 70, 24, isDying ? '#111' : '#eee', 4);
        drawMechanicalPart(ctx, -35, 0, 70, 14, '#050505', 2);
        const siren = !isDying && Math.sin(frame * 0.5) > 0;
        ctx.fillStyle = isDying ? '#050505' : (siren ? '#f00' : '#00f'); ctx.fillRect(-12, -20, 24, 10);
        break;
      case RobotUnit.STRIKER: 
        drawMechanicalPart(ctx, -20, -8, 40, 15, color, 8);
        ctx.fillStyle = '#050505'; ctx.beginPath(); ctx.arc(-18, 12, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(18, 12, 10, 0, Math.PI * 2); ctx.fill();
        const sirenSmall = !isDying && Math.sin(frame * 0.8) > 0;
        ctx.fillStyle = isDying ? '#050505' : (sirenSmall ? '#f00' : '#00f'); ctx.fillRect(5, -12, 10, 5);
        break;
      case RobotUnit.FALCON: 
        ctx.beginPath(); ctx.moveTo(-40, 0); ctx.lineTo(10, -22); ctx.lineTo(30, 0); ctx.lineTo(10, 22); ctx.closePath();
        ctx.fillStyle = color; ctx.fill();
        drawMechanicalPart(ctx, -45, -8, 85, 16, '#1a1a1a', 2);
        drawMechanicalPart(ctx, 10, -6, 25, 12, isDying ? '#050505' : '#00f3ff', 8);
        if (frame % 3 !== 0 && !isDying) {
            ctx.fillStyle = '#ff7700';
            ctx.beginPath(); ctx.moveTo(-45, -5); ctx.lineTo(-65 - (Math.random() * 15), 0); ctx.lineTo(-45, 5); ctx.fill();
        }
        break;
      case RobotUnit.TITAN: 
        // Tank - Half purple armor
        drawMechanicalPart(ctx, -40, -5, 80, 25, '#1a1a1a', 2); 
        drawMechanicalPart(ctx, -30, -22, 30, 22, color, 4); // Half purple armor (left side)
        drawMechanicalPart(ctx, 0, -22, 30, 22, '#333', 4); // Right side armor
        drawMechanicalPart(ctx, 15, -16, 45, 10, '#050505', 1);
        break;
      case RobotUnit.SPECTER: 
        drawMechanicalPart(ctx, -35, -15, 70, 32, isDying ? '#111' : '#fff', 4);
        ctx.fillStyle = isDying ? '#050505' : '#a855f7'; ctx.fillRect(-6, -8, 12, 16); ctx.fillRect(-18, -2, 36, 4);
        break;
      case RobotUnit.VANGUARD: 
        drawMechanicalPart(ctx, -45, -15, 90, 34, isDying ? '#1a0505' : '#d92b2b', 2);
        drawMechanicalPart(ctx, -40, -28, 65, 12, '#444', 1);
        break;
      case RobotUnit.NIGHTSHADE: 
        const legMov = isDying ? 0 : Math.sin(frame * 0.25) * 12;
        drawMechanicalPart(ctx, -30, -15, 60, 25, color, 12);
        drawMechanicalPart(ctx, 25, -22, 18, 18, color, 4);
        drawMechanicalPart(ctx, -25, 8, 10, 18 + legMov, '#050505', 2);
        drawMechanicalPart(ctx, 15, 8, 10, 18 - legMov, '#050505', 2);
        break;
      case RobotUnit.BLAZE: 
        drawMechanicalPart(ctx, -40, 0, 80, 20, color, 2);
        drawMechanicalPart(ctx, -25, -10, 35, 10, '#050505', 12);
        drawMechanicalPart(ctx, -50, -8, 25, 6, color, 1);
        break;
      case RobotUnit.GLITCH: 
        drawMechanicalPart(ctx, -35, -12, 70, 24, color, 15);
        const glowAlpha = (flightActive && !isDying) ? 0.8 + Math.sin(frame * 0.4) * 0.2 : 0.1;
        ctx.fillStyle = isDying ? '#050505' : `rgba(0, 243, 255, ${glowAlpha})`;
        ctx.beginPath(); ctx.arc(-25, 14, 12, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(25, 14, 12, 0, Math.PI * 2); ctx.fill();
        break;
      case RobotUnit.OMEGA: 
        drawMechanicalPart(ctx, -80, -50, 160, 90, isDying ? '#111' : '#fff', 45);
        drawMechanicalPart(ctx, -30, 40, 60, 20, '#111', 5);
        if (frame % 5 !== 0 && !isDying) {
            ctx.fillStyle = '#00f3ff22';
            ctx.beginPath(); ctx.arc(-60, 50, 15, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(60, 50, 15, 0, Math.PI * 2); ctx.fill();
        }
        break;
      default:
        drawMechanicalPart(ctx, -25, -12, 50, 24, color, 6);
    }
    ctx.restore();
  };

  const drawHumanoid = (ctx: CanvasRenderingContext2D, color: string, frame: number, isEnemy = false, alpha = 1, sizeMult = 1, isDying = false, deathTimer = 0, pose: 'normal' | 'victory' | 'limb-arm' | 'limb-leg' | 'limb-torso' = 'normal', limbColors?: string[]) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.scale(sizeMult, sizeMult);

    // If we have limb colors (combiner mode), use them for specific parts
    const torsoColor = limbColors ? limbColors[0] : color;
    const leftArmColor = limbColors ? limbColors[1] : '#0a0a0a';
    const rightArmColor = limbColors ? limbColors[2] : '#0a0a0a';
    const leftLegColor = limbColors ? limbColors[3] : '#050505';
    const rightLegColor = limbColors ? limbColors[4] : '#050505';

    if (pose === 'limb-arm') {
      drawMechanicalPart(ctx, -6, -15, 12, 35, color, 2);
      drawMechanicalPart(ctx, -7, 15, 14, 8, '#050505', 1); // Hand/Connector
      ctx.restore();
      return;
    }
    if (pose === 'limb-leg') {
      drawMechanicalPart(ctx, -8, -20, 16, 45, color, 2);
      drawMechanicalPart(ctx, -10, 20, 20, 10, '#050505', 2); // Foot/Base
      ctx.restore();
      return;
    }
    if (pose === 'limb-torso') {
      drawMechanicalPart(ctx, -12, -20, 24, 35, color, 4);
      drawMechanicalPart(ctx, -6, -30, 12, 12, '#050505', 6); // Head
      ctx.restore();
      return;
    }

    const time = isDying ? 0 : frame * 0.15;
    let legSwing = Math.sin(time) * 8 * sizeMult;
    let armSwing = Math.cos(time) * 10 * sizeMult;

    if (pose === 'victory') {
      legSwing = 0;
      armSwing = -Math.PI * 40; // Raise arms
    }

    // Torso
    drawMechanicalPart(ctx, -12, -18, 24, 28, torsoColor, 4);
    // Head
    drawMechanicalPart(ctx, -8, -32, 16, 14, '#050505', 6);
    
    const failThresh = isDying ? (DEATH_DURATION - deathTimer) / DEATH_DURATION : 1.0;
    const coreActive = !isDying || (Math.random() < failThresh * 0.9);
    ctx.fillStyle = isDying ? (coreActive ? '#111' : '#000') : (isEnemy ? '#ff0000' : '#00f3ff'); 
    ctx.fillRect(isEnemy ? -4 : 2, -26, 6, 2);
    
    if (pose === 'victory') {
      // Victory pose: arms raised high
      ctx.save();
      ctx.translate(-14, -10);
      ctx.rotate(-Math.PI * 0.8);
      drawMechanicalPart(ctx, -4, 0, 8, 25, leftArmColor, 2);
      ctx.restore();

      ctx.save();
      ctx.translate(14, -10);
      ctx.rotate(Math.PI * 0.8);
      drawMechanicalPart(ctx, -4, 0, 8, 25, rightArmColor, 2);
      ctx.restore();
    } else {
      drawMechanicalPart(ctx, -18, -15, 8, 18 + armSwing/2, leftArmColor, 2);
      drawMechanicalPart(ctx, 10, -15, 8, 18 - armSwing/2, rightArmColor, 2);
    }
    
    drawMechanicalPart(ctx, -10, 10, 10, 16 + legSwing/2, leftLegColor, 2);
    drawMechanicalPart(ctx, 2, 10, 10, 16 - legSwing/2, rightLegColor, 2);
    ctx.restore();
  };

  const drawRogueMachine = (ctx: CanvasRenderingContext2D, en: Enemy, frame: number) => {
    ctx.save();
    ctx.translate(en.pos.x + en.width / 2, en.pos.y + en.height / 2);
    ctx.scale(en.facing || 1, 1);
    
    let alpha = 1;
    if (en.isDying) {
      const progress = (en.deathTimer || 0) / DEATH_DURATION;
      alpha = 1 - progress;
    }
    ctx.globalAlpha = alpha;

    switch (en.type) {
      case 'kamikaze_drone':
        const pulse = Math.sin(frame * 0.3) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 100, 0, ${pulse})`;
        ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(20, 10); ctx.lineTo(-20, 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'shield_sentinel':
        drawHumanoid(ctx, '#00ffcc', frame, true, 1, 1.3, en.isDying, en.deathTimer);
        // Shield
        if (!en.isDying) {
          ctx.strokeStyle = '#00ffcc88'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(30, 0, 40, -Math.PI/2, Math.PI/2); ctx.stroke();
          ctx.fillStyle = '#00ffcc22'; ctx.fill();
        }
        break;
      case 'plasma_sniper':
        drawHumanoid(ctx, '#00ccff', frame, true, 1, 1.1, en.isDying, en.deathTimer);
        // Long Rifle
        ctx.fillStyle = '#333'; ctx.fillRect(10, -10, 50, 6);
        ctx.fillStyle = '#00ccff'; ctx.fillRect(55, -11, 10, 8);
        break;
      case 'swarmer_bot':
        const rot = frame * 0.2;
        ctx.rotate(rot);
        drawMechanicalPart(ctx, -12, -12, 24, 24, '#ffff00', 12);
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(6, 0, 3, 0, Math.PI * 2); ctx.fill();
        break;
    }
    ctx.restore();
  };

  const drawUnit = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, unit: RobotUnit, facing: number, frame: number, isEnemy: boolean, invulnerable: boolean, transformed: boolean, alpha: number, vel: {x:number, y:number}, sizeMult = 1, isCombiner = false, type: string = 'grunt', flightActive?: boolean, isDying?: boolean, deathTimer?: number, pose: 'normal' | 'victory' | 'limb-arm' | 'limb-leg' | 'limb-torso' = 'normal', limbColors?: string[], abilityActive?: boolean) => {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(facing < 0 ? -1 : 1, 1);
    
    if (isDying) {
      const progress = (deathTimer || 0) / DEATH_DURATION;
      ctx.scale(1, 1 - progress * 0.4); 
      ctx.translate(0, (h * 0.2) * progress);
      alpha *= (1 - progress);
    }

    let drawAlpha = invulnerable ? (0.5 + Math.sin(frame * 0.5) * 0.3) * alpha : alpha;
    const stats = ROBOT_STATS[unit];
    const unitColor = isDying ? '#1a1a1a' : (isEnemy ? '#ff0055' : stats.color);

    if (abilityActive && !isEnemy) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = unitColor;
      if (unit === RobotUnit.SENTINEL) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.stroke();
      }
      if (unit === RobotUnit.SPECTER) {
        drawAlpha *= 0.3; // Stealth transparency
      }
      if (unit === RobotUnit.NIGHTSHADE) {
        // Motion trail effect
        for(let i=1; i<=3; i++) {
          ctx.save();
          ctx.translate(-vel.x * i * 2, -vel.y * i * 2);
          drawHumanoid(ctx, unitColor, frame, false, drawAlpha * (0.5 / i), sizeMult, false, 0);
          ctx.restore();
        }
      }
    }

    if (isCombiner) {
      ctx.save(); ctx.translate(0, -40);
      // Energy Aura for Combiner
      const auraPulse = Math.sin(frame * 0.2) * 0.2 + 0.8;
      ctx.shadowBlur = 30 * auraPulse;
      ctx.shadowColor = '#facc15';
      
      if (abilityActive) {
        // Nova Visual Effect
        const novaRadius = (120 - (deathTimer || 0)) * 5; // Using deathTimer as a proxy for ability timer if needed, but wait, abilityActiveTimer is passed
        // Actually abilityActive is passed as p.abilityActiveTimer > 0
        // I'll use frame to animate the nova
        const novaSize = (frame % 20) * 25;
        ctx.strokeStyle = `rgba(255, 252, 21, ${1 - (frame % 20) / 20})`;
        ctx.lineWidth = 10;
        ctx.beginPath(); ctx.arc(0, 40, novaSize, 0, Math.PI * 2); ctx.stroke();
      }

      drawHumanoid(ctx, isDying ? '#111' : '#facc15', frame, false, drawAlpha, 3.0, isDying, deathTimer || 0, pose, limbColors);
      ctx.restore();
    } else if (transformed) {
      drawAltMode(ctx, unit, frame, drawAlpha, vel, flightActive, isDying, deathTimer);
    } else {
      drawHumanoid(ctx, unitColor, frame, isEnemy, drawAlpha, sizeMult, isDying, deathTimer || 0);
      
      // Special armor for TITAN
      if (unit === RobotUnit.TITAN && !isDying) {
        ctx.save();
        ctx.translate(0, -18); // Center of torso
        ctx.scale(sizeMult, sizeMult);
        // Purple armor plate on left side
        drawMechanicalPart(ctx, -12, 0, 12, 28, stats.color, 4);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  const createPlayer = (unit: RobotUnit, x: number, y: number): PlayerEntity => {
    const stats = ROBOT_STATS[unit];
    const baseHP = 100 + (engineRef.current.upgrades.robotTier * 50);
    return { 
      id: Math.random().toString(36).substr(2, 9), 
      unit, 
      pos: { x, y: GROUND_Y - 48 }, 
      vel: { x: 0, y: 0 }, 
      width: 32, 
      height: 48, 
      facing: 1, 
      grounded: true, 
      lastShot: 0, 
      invulnerable: 0, 
      health: baseHP * stats.hpMult, 
      maxHealth: baseHP * stats.hpMult, 
      isTransformed: false, 
      flightActive: false,
      abilityCooldown: 0,
      abilityActiveTimer: 0
    };
  };

  const resetLevel = useCallback(() => {
    const e = engineRef.current;
    e.frame = 0; e.cameraX = 0; e.bullets = []; e.isCombined = false;
    e.winTriggered = false;
    e.gameOverTriggered = false;
    e.activeLeaderIndex = 0;
    e.isShipActive = false;
    e.laserActive = false;
    e.grabbedBodyIndex = -1;
    e.bodiesCollected = 0;
    e.bodies = [];
    e.players = (upgrades.activeSquad || []).map((unit, i) => createPlayer(unit, 100 - i * 95, GROUND_Y - 48));
    
    const sector = SECTORS.find(s => s.id === level) || SECTORS[0];

    // Spawn regular enemies from sector definition
    let enemyId = 0;
    const enemies: Enemy[] = [];
    
    sector.enemies.forEach(spawn => {
        for (let i = 0; i < spawn.count; i++) {
          const isTank = spawn.type === 'tank';
          const isDrone = spawn.type === 'drone' || spawn.type === 'kamikaze_drone';
          const isSeeker = spawn.type === 'seeker';
          const isSwarmer = spawn.type === 'swarmer_bot';
          const isSniper = spawn.type === 'plasma_sniper';
          const isShield = spawn.type === 'shield_sentinel';
          
          let eWidth = 48;
          let eHeight = 72;
          let eY = GROUND_Y - 72;

          if (isTank) { eWidth = 80; eHeight = 40; eY = GROUND_Y - 40; }
          if (isDrone) { eWidth = 40; eHeight = 40; eY = 200 + Math.random() * 300; }
          if (isSwarmer) { eWidth = 24; eHeight = 24; eY = GROUND_Y - 24; }
          if (isSniper) { eWidth = 48; eHeight = 80; eY = GROUND_Y - 80; }
          if (isShield) { eWidth = 60; eHeight = 90; eY = GROUND_Y - 90; }

          enemies.push({
            id: enemyId++,
            pos: { x: 1800 + enemyId * 1100, y: eY },
            vel: { x: 0, y: 0 },
            width: eWidth,
            height: eHeight,
            health: (isTank ? 200 : (isSwarmer ? 30 : (isShield ? 400 : 100))) * spawn.healthMult,
            maxHealth: (isTank ? 200 : (isSwarmer ? 30 : (isShield ? 400 : 100))) * spawn.healthMult,
            isDead: false,
            type: spawn.type,
            lastShot: 0,
            facing: -1,
            isTransformed: isSeeker ? true : (isTank ? false : undefined),
            transformTimer: (isTank || isSeeker) ? 100 + Math.random() * 200 : undefined
          });
        }
      });

      // Spawn boss if present
      if (sector.boss) {
        const bossType = sector.boss;
        const bossHP = sector.bossHealth || 5000;
        let bossWidth = 120;
        let bossHeight = 200;
        let bossY = GROUND_Y - 200;

        if (bossType === 'swarm_queen') { bossWidth = 150; bossHeight = 100; bossY = 200; }
        if (bossType === 'plasma_sentinel') { bossWidth = 100; bossHeight = 100; bossY = GROUND_Y - 100; }
        if (bossType === 'fortress_tank') { bossWidth = 160; bossHeight = 80; bossY = GROUND_Y - 80; }
        if (bossType === 'omega_annihilator') { bossWidth = 300; bossHeight = 400; bossY = GROUND_Y - 400; }

        enemies.push({
          id: enemyId++,
          pos: { x: 2500 + enemyId * 500, y: bossY },
          vel: { x: 0, y: 0 },
          width: bossWidth,
          height: bossHeight,
          health: bossHP,
          maxHealth: bossHP,
          isDead: false,
          type: bossType,
          lastShot: 0,
          facing: -1
        });
      }
      e.enemies = enemies;
  }, [level, upgrades]);

  useEffect(() => { resetLevel(); }, [resetLevel]);

  const drawCityscape = (ctx: CanvasRenderingContext2D, e: any) => {
    const sector = SECTORS.find(s => s.id === level) || SECTORS[0];
    const theme = sector.theme;
    const camX = e.cameraX;

    // Background Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    
    if (theme === SectorTheme.CYBER_CITY) {
      skyGrad.addColorStop(0, '#00000c'); skyGrad.addColorStop(0.7, '#2a0d08'); skyGrad.addColorStop(1, '#662200');
    } else if (theme === SectorTheme.INDUSTRIAL) {
      skyGrad.addColorStop(0, '#1a1a1a'); skyGrad.addColorStop(0.7, '#332211'); skyGrad.addColorStop(1, '#443322');
    } else if (theme === SectorTheme.WASTELAND) {
      skyGrad.addColorStop(0, '#2b1d0e'); skyGrad.addColorStop(0.7, '#4a3c2a'); skyGrad.addColorStop(1, '#6b5b4a');
    } else if (theme === SectorTheme.NEON_DISTRICT) {
      skyGrad.addColorStop(0, '#050010'); skyGrad.addColorStop(0.7, '#1a0033'); skyGrad.addColorStop(1, '#330066');
    } else if (theme === SectorTheme.ORBITAL_STATION) {
      skyGrad.addColorStop(0, '#000000'); skyGrad.addColorStop(0.7, '#000011'); skyGrad.addColorStop(1, '#000022');
    } else if (theme === SectorTheme.DATA_CORE) {
      skyGrad.addColorStop(0, '#000500'); skyGrad.addColorStop(0.7, '#001a00'); skyGrad.addColorStop(1, '#003300');
    }

    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Parallax Layers
    let layers = [];
    if (theme === SectorTheme.CYBER_CITY) {
      layers = [
        { scroll: 0.1, color: '#0c0c18', spacing: 450, hMin: 300, hMax: 600, type: 'building' },
        { scroll: 0.4, color: '#1a0f0a', spacing: 400, hMin: 400, hMax: 850, type: 'building' },
        { scroll: 0.8, color: '#050505', spacing: 350, hMin: 500, hMax: 1000, type: 'building' },
      ];
    } else if (theme === SectorTheme.INDUSTRIAL) {
      layers = [
        { scroll: 0.1, color: '#111', spacing: 500, hMin: 200, hMax: 400, type: 'pipe' },
        { scroll: 0.4, color: '#222', spacing: 450, hMin: 300, hMax: 600, type: 'factory' },
        { scroll: 0.8, color: '#111', spacing: 400, hMin: 400, hMax: 800, type: 'factory' },
      ];
    } else if (theme === SectorTheme.WASTELAND) {
      layers = [
        { scroll: 0.1, color: '#2b1d0e', spacing: 600, hMin: 100, hMax: 300, type: 'dune' },
        { scroll: 0.4, color: '#3d2b1a', spacing: 550, hMin: 150, hMax: 450, type: 'ruin' },
        { scroll: 0.8, color: '#1a110a', spacing: 500, hMin: 200, hMax: 600, type: 'ruin' },
      ];
    } else if (theme === SectorTheme.NEON_DISTRICT) {
      layers = [
        { scroll: 0.1, color: '#0a001a', spacing: 400, hMin: 300, hMax: 600, type: 'neon' },
        { scroll: 0.4, color: '#15002b', spacing: 350, hMin: 400, hMax: 800, type: 'neon' },
        { scroll: 0.8, color: '#050010', spacing: 300, hMin: 500, hMax: 1000, type: 'neon' },
      ];
    } else if (theme === SectorTheme.ORBITAL_STATION) {
      layers = [
        { scroll: 0.1, color: '#050505', spacing: 800, hMin: 50, hMax: 150, type: 'star' },
        { scroll: 0.4, color: '#111', spacing: 600, hMin: 200, hMax: 500, type: 'station' },
        { scroll: 0.8, color: '#0a0a0a', spacing: 500, hMin: 300, hMax: 700, type: 'station' },
      ];
    } else if (theme === SectorTheme.DATA_CORE) {
      layers = [
        { scroll: 0.1, color: '#001100', spacing: 400, hMin: 200, hMax: 500, type: 'grid' },
        { scroll: 0.4, color: '#002200', spacing: 350, hMin: 300, hMax: 700, type: 'server' },
        { scroll: 0.8, color: '#000500', spacing: 300, hMin: 400, hMax: 900, type: 'server' },
      ];
    }

    layers.forEach((layer, li) => {
      ctx.fillStyle = layer.color;
      const startX = Math.floor((camX * layer.scroll) / layer.spacing) * layer.spacing - layer.spacing * 2;
      for (let x = startX; x < startX + CANVAS_WIDTH + layer.spacing * 4; x += layer.spacing) {
        const seed = Math.abs(Math.sin(x * 0.01 + li));
        const h = seed * (layer.hMax - layer.hMin) + layer.hMin;
        const bx = x - (camX * layer.scroll);
        const bw = layer.spacing - 40;
        
        if (layer.type === 'building') {
          ctx.fillRect(bx, GROUND_Y - h, bw, h);
          // Windows
          ctx.fillStyle = 'rgba(255, 255, 200, 0.1)';
          for(let wy = GROUND_Y - h + 20; wy < GROUND_Y - 20; wy += 40) {
            for(let wx = bx + 10; wx < bx + bw - 10; wx += 30) {
              if (Math.sin(wx * wy) > 0.5) ctx.fillRect(wx, wy, 15, 20);
            }
          }
          ctx.fillStyle = layer.color;
        } else if (layer.type === 'factory') {
          ctx.fillRect(bx, GROUND_Y - h, bw, h);
          // Chimneys
          ctx.fillRect(bx + 10, GROUND_Y - h - 40, 20, 40);
          ctx.fillRect(bx + bw - 30, GROUND_Y - h - 60, 20, 60);
        } else if (layer.type === 'ruin') {
          ctx.beginPath();
          ctx.moveTo(bx, GROUND_Y);
          ctx.lineTo(bx + bw/2, GROUND_Y - h);
          ctx.lineTo(bx + bw, GROUND_Y);
          ctx.fill();
        } else if (layer.type === 'neon') {
          ctx.fillRect(bx, GROUND_Y - h, bw, h);
          // Neon signs
          const colors = ['#ff00ff', '#00ffff', '#ffff00'];
          ctx.fillStyle = colors[li % 3];
          ctx.shadowBlur = 10;
          ctx.shadowColor = ctx.fillStyle;
          ctx.fillRect(bx + bw/2 - 10, GROUND_Y - h + 50, 20, 40);
          ctx.shadowBlur = 0;
          ctx.fillStyle = layer.color;
        } else if (layer.type === 'station') {
          ctx.fillRect(bx, GROUND_Y - h, bw, h);
          ctx.fillStyle = '#333';
          ctx.fillRect(bx - 20, GROUND_Y - h + 100, bw + 40, 20);
          ctx.fillStyle = layer.color;
        } else if (layer.type === 'server') {
          ctx.fillRect(bx, GROUND_Y - h, bw, h);
          // Blinking lights
          ctx.fillStyle = e.frame % 60 < 30 ? '#00ff00' : '#004400';
          ctx.fillRect(bx + 10, GROUND_Y - h + 20, 5, 5);
          ctx.fillStyle = layer.color;
        } else {
          ctx.fillRect(bx, GROUND_Y - h, bw, h);
        }
      }
    });
  };

  const drawHUD = (ctx: CanvasRenderingContext2D, e: any) => {
    ctx.save();
    const hudX = 50; const hudY = 50;
    
    if (e.isCombined) {
      const hudW = 600; const hudH = 180;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudW, hudH, 8);
      ctx.fill();
      ctx.strokeStyle = '#facc15'; ctx.lineWidth = 4; ctx.stroke();
      
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 32px Orbitron';
      ctx.fillText("ULTIMATE CYBERBOT", hudX + 30, hudY + 50);
      
      const hRatio = Math.max(0, e.combinedHealth / e.combinedMaxHealth);
      ctx.fillStyle = '#111'; ctx.fillRect(hudX + 30, hudY + 70, 540, 40);
      ctx.fillStyle = '#facc15'; 
      ctx.shadowBlur = 15; ctx.shadowColor = '#facc15';
      ctx.fillRect(hudX + 30, hudY + 70, 540 * hRatio, 40);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px Orbitron';
      ctx.fillText("CHASSIS INTEGRITY: " + Math.round(hRatio * 100) + "%", hudX + 30, hudY + 130);
      
      const syncLevel = 90 + Math.sin(e.frame * 0.1) * 10;
      ctx.fillStyle = '#22d3ee'; ctx.fillText("CORE SYNC: " + Math.round(syncLevel) + "%", hudX + 30, hudY + 155);
      
      ctx.fillStyle = '#facc15'; ctx.font = 'bold 12px Orbitron';
      ctx.fillText("COMBINER MODE [ACTIVE]", hudX + 420, hudY + 155);
    } else {
      const hudW = 460; const hudH = e.players.length * 55 + 70;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.92)'; 
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, hudW, hudH, 4);
      ctx.fill();
      ctx.strokeStyle = '#00f3ff'; ctx.lineWidth = 4; ctx.stroke();
      
      ctx.font = 'bold 20px Orbitron'; ctx.fillStyle = '#00f3ff';
      ctx.fillText("ALPHA SQUAD: SECTOR " + e.level, hudX + 30, hudY + 45);

      e.players.forEach((p: PlayerEntity, i: number) => {
        const stats = ROBOT_STATS[p.unit];
        const hRatio = Math.max(0, p.health / p.maxHealth);
        const y = hudY + 90 + i * 55;
        
        ctx.font = 'bold 16px Orbitron';
        ctx.fillStyle = p.health > 0 ? stats.color : '#444';
        const flightStatus = (p.unit === RobotUnit.GLITCH && p.isTransformed && p.flightActive) ? " [FLIGHT]" : "";
        ctx.fillText(stats.name + (p.isTransformed ? " [" + stats.alt.type + "]" : "") + flightStatus, hudX + 30, y);
        
        // Health Bar
        ctx.fillStyle = '#111'; ctx.fillRect(hudX + 30, y + 10, 380, 8);
        ctx.fillStyle = p.health > 0 ? stats.color : '#222';
        ctx.fillRect(hudX + 30, y + 10, 380 * hRatio, 8);

        // Ability Bar
        const aRatio = 1 - (p.abilityCooldown / stats.ability.cooldown);
        ctx.fillStyle = '#050505'; ctx.fillRect(hudX + 30, y + 22, 380, 4);
        if (p.abilityActiveTimer > 0) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(hudX + 30, y + 22, 380 * (p.abilityActiveTimer / stats.ability.duration), 4);
        } else {
          ctx.fillStyle = p.abilityCooldown <= 0 ? '#00f3ff' : '#444';
          ctx.fillRect(hudX + 30, y + 22, 380 * (p.abilityCooldown > 0 ? aRatio : 1), 4);
        }
        if (i === e.activeLeaderIndex && p.abilityCooldown <= 0) {
          ctx.font = 'bold 10px Orbitron';
          ctx.fillStyle = '#fff';
          ctx.fillText("[E] " + stats.ability.name + " READY", hudX + 30, y + 38);
        }
      });
    }

    // Level 30: Final Boss HUD
    if (e.level === 30) {
      const boss = e.enemies.find(en => en.type === 'omega_annihilator');
      if (boss && !boss.isDead) {
        const bossHudX = CANVAS_WIDTH - 450;
        const bossHudY = 50;
        const bossHudW = 400;
        const bossHudH = 100;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
        ctx.beginPath();
        ctx.roundRect(bossHudX, bossHudY, bossHudW, bossHudH, 4);
        ctx.fill();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.stroke();

        ctx.font = 'bold 18px Orbitron'; ctx.fillStyle = '#ef4444';
        ctx.fillText("OMEGA ANNIHILATOR", bossHudX + 20, bossHudY + 40);

        const bRatio = Math.max(0, boss.health / boss.maxHealth);
        ctx.fillStyle = '#111'; ctx.fillRect(bossHudX + 20, bossHudY + 60, 360, 15);
        
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 10; ctx.shadowColor = '#ef4444';
        ctx.fillRect(bossHudX + 20, bossHudY + 60, 360 * bRatio, 15);
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  };

  useEffect(() => {
    const e = engineRef.current;
    const handleKeyDown = (ev: KeyboardEvent) => {
      e.keys[ev.code] = true;

      if (isTutorial && tutorialStep < tutorialMessages.length) {
        const current = tutorialMessages[tutorialStep];
        if (ev.code === current.key || (current.key === 'ShiftLeft' && (ev.code === 'ShiftLeft' || ev.code === 'ShiftRight'))) {
          setTutorialStep(prev => prev + 1);
        }
      }

      if (ev.code === 'Tab') {
        ev.preventDefault();
        const livingPlayers = e.players.map((p, i) => ({ p, i })).filter(item => item.p.health > 0 && !item.p.isDying);
        if (livingPlayers.length > 1) {
          const currentIdxInLiving = livingPlayers.findIndex(item => item.i === e.activeLeaderIndex);
          const nextIdxInLiving = (currentIdxInLiving + 1) % livingPlayers.length;
          e.activeLeaderIndex = livingPlayers[nextIdxInLiving].i;
          soundService.playShoot();
        }
      }
      if ((ev.code === 'ShiftLeft' || ev.code === 'ShiftRight') && !e.isCombined) {
        const activeLeader = e.players[e.activeLeaderIndex];
        if (activeLeader && activeLeader.health > 0 && !activeLeader.isDying) {
          soundService.playTransform(activeLeader.unit, !activeLeader.isTransformed);
        }
        e.players.forEach(p => { if (!p.isDying) p.isTransformed = !p.isTransformed; if (!p.isTransformed) p.flightActive = false; });
      }
      if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(ev.code) && !e.isCombined) {
        const idx = parseInt(ev.code.replace('Digit', '')) - 1;
        if (e.players[idx] && e.players[idx].health > 0 && !e.players[idx].isDying) {
          e.activeLeaderIndex = idx;
          soundService.playShoot();
        }
      }
      if (ev.code === 'KeyE') {
        if (e.isCombined) {
          const leader = e.players[e.activeLeaderIndex];
          if (leader && leader.abilityCooldown <= 0) {
            leader.abilityActiveTimer = 120; // 2 seconds of nova
            leader.abilityCooldown = 600; // 10 second cooldown
            soundService.playTransform(RobotUnit.OMEGA, true);
            // Screen shake effect could be added here if implemented
          }
          return;
        }
        const activeLeader = e.players[e.activeLeaderIndex];
        if (activeLeader && activeLeader.health > 0 && !activeLeader.isDying && activeLeader.abilityCooldown <= 0) {
          const stats = ROBOT_STATS[activeLeader.unit];
          activeLeader.abilityActiveTimer = stats.ability.duration;
          activeLeader.abilityCooldown = stats.ability.cooldown;
          soundService.playTransform(activeLeader.unit, true);
          
          // Immediate effects for some abilities
          if (activeLeader.unit === RobotUnit.TITAN) {
            e.enemies.forEach(en => {
              const dx = en.pos.x - activeLeader.pos.x;
              if (Math.abs(dx) < 400) {
                en.health -= 150;
                en.vel.y = -15;
              }
            });
          }
          if (activeLeader.unit === RobotUnit.NIGHTSHADE) {
            activeLeader.vel.x = activeLeader.facing * 30; // Initial burst
            soundService.playFly();
          }
          if (activeLeader.unit === RobotUnit.FALCON) {
            soundService.playShoot();
          }
          if (activeLeader.unit === RobotUnit.GLITCH) {
            e.enemies.forEach(en => {
              const dx = en.pos.x - activeLeader.pos.x;
              if (Math.abs(dx) < 600) {
                en.lastShot = e.frame + 120; // Disable shooting
              }
            });
          }
        }
      }
      if (ev.code === 'KeyG') {
        if (e.level === 21) {
          const leader = e.players[e.activeLeaderIndex];
          if (leader && !leader.isDying) {
            const dist = Math.sqrt(Math.pow(leader.pos.x - e.shipPos.x, 2) + Math.pow(leader.pos.y - e.shipPos.y, 2));
            if (dist < 200 || e.isShipActive) {
              e.isShipActive = !e.isShipActive;
              soundService.playTransform(RobotUnit.SENTINEL, e.isShipActive);
              if (e.isShipActive) {
                // Hide players when in ship
                e.players.forEach(p => { p.pos.x = -5000; p.pos.y = -5000; });
              } else {
                // Eject leader at ship position
                leader.pos.x = e.shipPos.x;
                leader.pos.y = e.shipPos.y;
                leader.vel.y = -10;
                leader.grounded = false;
              }
            }
          }
        }
      }
      if (ev.code === 'KeyF') {
        const activeLeader = e.players[e.activeLeaderIndex];
        if (activeLeader && activeLeader.health > 0 && !activeLeader.isDying && activeLeader.unit === RobotUnit.GLITCH && activeLeader.isTransformed) {
          activeLeader.flightActive = !activeLeader.flightActive;
          if (activeLeader.flightActive) soundService.playFly();
        }
      }
      if (ev.code === 'KeyC') {
        if (e.isCombined && e.uncombineSequence === 0) {
          e.isCombined = false;
          e.uncombineSequence = 1;
          e.uncombineTimer = 0;
          e.isUncombiningFromDeath = false;
          soundService.playShoot();
        } else if ((upgrades.activeSquad?.length || 0) >= 5 && e.combineSequence === 0 && e.uncombineSequence === 0) {
          const aliveOnes = e.players.filter(p => p.health > 0 && !p.isDying);
          if (aliveOnes.length >= 5) {
            e.combineSequence = 1;
            e.combineTimer = 0;
            soundService.playTransform(RobotUnit.SENTINEL, true);
          }
        }
      }
      if (ev.code === 'KeyT' && e.level === 22) {
        const leader = e.players[e.activeLeaderIndex];
        if (leader) {
          if (e.grabbedBodyIndex === -1) {
            // Try to grab
            const nearestBodyIdx = e.bodies.findIndex((b: any) => {
              if (b.delivered) return false;
              const dist = Math.sqrt(Math.pow(leader.pos.x - b.pos.x, 2) + Math.pow(leader.pos.y - b.pos.y, 2));
              return dist < 100;
            });
            if (nearestBodyIdx !== -1) {
              e.grabbedBodyIndex = nearestBodyIdx;
              e.bodies[nearestBodyIdx].grabbed = true;
              soundService.playShoot();
            }
          } else {
            // Ungrab
            e.bodies[e.grabbedBodyIndex].grabbed = false;
            e.grabbedBodyIndex = -1;
            soundService.playShoot();
          }
        }
      }
    };
    const handleKeyUp = (ev: KeyboardEvent) => { e.keys[ev.code] = false; };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    
    let animationId: number;
    const loop = () => { if (!e.isPaused) update(); draw(); animationId = requestAnimationFrame(loop); };

    const update = () => {
      e.frame++;
      
      // Update active leader if current one is dead
      if (!e.players[e.activeLeaderIndex] || e.players[e.activeLeaderIndex].health <= 0 || e.players[e.activeLeaderIndex].isDying) {
        const nextIdx = e.players.findIndex(p => p.health > 0 && !p.isDying);
        if (nextIdx !== -1) e.activeLeaderIndex = nextIdx;
      }
      const activeLeaderIndex = e.activeLeaderIndex;
      
      e.players.forEach(p => {
        if (p.isDying) {
          p.deathTimer = (p.deathTimer || 0) + 1;
          p.vel.x *= 0.8;
          if (p.pos.y < GROUND_Y - p.height) p.vel.y += GRAVITY; else { p.pos.y = GROUND_Y - p.height; p.vel.y = 0; }
          p.pos.y += p.vel.y;
          if (p.deathTimer > DEATH_DURATION) { p.health = 0; } 
        } else if (p.health <= 0 && p.health > -999) {
          p.isDying = true; p.deathTimer = 0; p.health = -999; 
          soundService.playLose();
        }
      });

      if (activeLeaderIndex === -1 && !e.gameOverTriggered) {
        const allActuallyDead = e.players.every(p => p.health <= 0 && p.isDying && (p.deathTimer || 0) >= DEATH_DURATION);
        if (allActuallyDead) { e.gameOverTriggered = true; onDie(); }
        return;
      }
      
      const leader = e.players[activeLeaderIndex];
      if (!leader && !e.gameOverTriggered) return;
      
      const moveRight = e.keys['ArrowRight'] || e.keys['KeyD'];
      const moveLeft = e.keys['ArrowLeft'] || e.keys['KeyA'];
      const moveUp = e.keys['ArrowUp'] || e.keys['KeyW'];
      const moveDown = e.keys['ArrowDown'] || e.keys['KeyS'];
      const firing = e.keys['Space'];

      if (e.isShipActive) {
        const s = { speed: 12 };
        if (moveRight) e.shipVel.x = s.speed; else if (moveLeft) e.shipVel.x = -s.speed; else e.shipVel.x *= 0.9;
        if (moveUp) e.shipVel.y = -s.speed; else if (moveDown) e.shipVel.y = s.speed; else e.shipVel.y *= 0.9;
        
        e.shipPos.x += e.shipVel.x;
        e.shipPos.y += e.shipVel.y;
        
        // Keep ship in bounds
        if (e.shipPos.y < 50) e.shipPos.y = 50;
        if (e.shipPos.y > GROUND_Y - 100) e.shipPos.y = GROUND_Y - 100;

        // Sync players to ship position
        e.players.forEach(p => {
          p.pos.x = e.shipPos.x;
          p.pos.y = e.shipPos.y;
          p.vel.x = e.shipVel.x;
          p.vel.y = e.shipVel.y;
        });

        e.laserActive = firing;
        if (firing && e.frame % 5 === 0) {
          soundService.playShoot();
          // Laser logic is handled in the drawing/collision part or here
          // For simplicity, let's create invisible bullets for collision if we want, 
          // but a continuous laser beam is cooler.
        }
      }

      if (e.combineSequence > 0) {
        e.combineTimer++;
        if (!leader) { e.combineSequence = 0; return; }

        // Force robot mode for all during combination
        e.players.forEach(p => { p.isTransformed = false; p.flightActive = false; });

        if (e.combineSequence === 1) { // Gathering
          let allReached = true;
          e.players.forEach((p, i) => {
            if (p === leader) return;
            
            // Staggered start: each robot starts moving 10 frames after the previous one
            const staggerDelay = i * 10;
            if (e.combineTimer < staggerDelay) {
              allReached = false;
              return;
            }

            const dx = leader.pos.x - p.pos.x;
            const dy = leader.pos.y - p.pos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 10) {
              p.pos.x += dx * 0.2; // Faster merging
              p.pos.y += dy * 0.2;
              allReached = false;
            }
          });
          if (allReached || e.combineTimer > 120) {
            e.combineSequence = 2;
            e.combineTimer = 0;
            soundService.playShoot(); // Play a flash sound
          }
        } else if (e.combineSequence === 2) { // Merging
          if (e.combineTimer > 40) {
            e.combineSequence = 3;
            e.combineTimer = 0;
            e.isCombined = true;
            e.combinedMaxHealth = e.players.reduce((s, p) => s + p.maxHealth, 0) * 1.5;
            e.combinedHealth = e.players.reduce((s, p) => s + p.health, 0) * 1.5;
            leader.width = 110; leader.height = 160;
            soundService.playTransform(RobotUnit.SENTINEL, true);
          }
        } else if (e.combineSequence === 3) { // Emerging
          if (e.combineTimer > 60) {
            e.combineSequence = 0;
          }
        }
        return; 
      }

      if (e.uncombineSequence > 0) {
        e.uncombineTimer++;
        if (!leader) { e.uncombineSequence = 0; return; }

        if (e.uncombineSequence === 1) { // Reverse Emerging
          if (e.uncombineTimer > 40) {
            e.uncombineSequence = 2;
            e.uncombineTimer = 0;
            leader.width = 32; leader.height = 48;
          }
        } else if (e.uncombineSequence === 2) { // Reverse Merging
          if (e.uncombineTimer > 40) {
            e.uncombineSequence = 3;
            e.uncombineTimer = 0;
          }
        } else if (e.uncombineSequence === 3) { // Reverse Gathering
          let allReached = true;
          e.players.forEach((p, i) => {
            const targetX = leader.pos.x - i * 90;
            const targetY = GROUND_Y - 48;
            const dx = targetX - p.pos.x;
            const dy = targetY - p.pos.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 5) {
              p.pos.x += dx * 0.15;
              p.pos.y += dy * 0.15;
              allReached = false;
            }
          });
          if (allReached || e.uncombineTimer > 100) {
            e.uncombineSequence = 0;
            if (e.isUncombiningFromDeath) {
              e.players.forEach(p => p.health = 0); // Final death
            } else {
              const hPer = e.combinedHealth / e.players.length;
              e.players.forEach((p, i) => { 
                if (!p.isDying) { 
                  p.health = Math.min(p.maxHealth, hPer); 
                  p.width = 32; 
                  p.height = 48; 
                  p.pos.x = leader.pos.x - i * 90; 
                  p.pos.y = GROUND_Y - 48; 
                } 
              });
            }
          }
        }
        return;
      }

      if (e.isCombined && leader) {
        const s = { speed: 7, jump: -24, fireRate: 3 };
        if (moveRight) { leader.vel.x = s.speed; leader.facing = 1; } else if (moveLeft) { leader.vel.x = -s.speed; leader.facing = -1; } else leader.vel.x *= 0.85;
        if (moveUp && leader.grounded) { leader.vel.y = s.jump; leader.grounded = false; soundService.playFly(); }
        leader.vel.y += GRAVITY; leader.pos.x += leader.vel.x; leader.pos.y += leader.vel.y;
        if (leader.pos.y > GROUND_Y - leader.height) { leader.pos.y = GROUND_Y - leader.height; leader.vel.y = 0; leader.grounded = true; }
        
        if (leader.abilityCooldown > 0) leader.abilityCooldown--;
        if (leader.abilityActiveTimer > 0) {
          leader.abilityActiveTimer--;
          // Ultimate Nova Damage
          e.enemies.forEach(en => {
            if (!en.isDead && !en.isDying) {
              const dx = en.pos.x - (leader.pos.x + leader.width/2);
              const dy = en.pos.y - (leader.pos.y + leader.height/2);
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < 500) {
                en.health -= 15; // Rapid damage
                en.vel.x += Math.sign(dx) * 5;
                en.vel.y -= 2;
              }
            }
          });
        }

        // Sync other players to leader for collision consistency
        e.players.forEach(p => {
          if (p !== leader) {
            p.pos.x = leader.pos.x;
            p.pos.y = leader.pos.y;
            p.width = leader.width;
            p.height = leader.height;
            p.invulnerable = leader.invulnerable;
          }
        });

        if (firing && e.frame - leader.lastShot > s.fireRate) {
          soundService.playShoot();
          // Massive 7-way spread for Ultimate CyberBot
          for(let i=-3; i<=3; i++) {
            e.bullets.push({ 
              pos: { x: leader.pos.x + (leader.facing > 0 ? 100 : -20), y: leader.pos.y + 80 + (i*25) }, 
              vel: { x: leader.facing * 50, y: i * 6 }, 
              width: 60, height: 20, owner: 'player', damage: 80, color: '#facc15', health: 1, maxHealth: 1 
            });
          }
          leader.lastShot = e.frame;
        }
      } else if (leader) {
        e.players.forEach((p, i) => {
          if (p.health <= 0 || p.isDying) return;
          const stats = ROBOT_STATS[p.unit]; 
          const s = p.isTransformed ? stats.alt : stats.robot;
          const isActuallyFlying = (p.unit === RobotUnit.FALCON || p.unit === RobotUnit.OMEGA || (p.unit === RobotUnit.GLITCH && p.flightActive)) && p.isTransformed;

          if (i === activeLeaderIndex) {
            if (moveRight) { p.vel.x = s.speed; p.facing = 1; } else if (moveLeft) { p.vel.x = -s.speed; p.facing = -1; } else p.vel.x *= 0.8;
            if (isActuallyFlying) {
              if (moveUp) p.vel.y = -s.speed; else if (moveDown) p.vel.y = s.speed; else p.vel.y *= 0.92;
              p.grounded = false;
            } else {
              if (moveUp && p.grounded) { p.vel.y = s.jump; p.grounded = false; }
              p.vel.y += GRAVITY;
            }
          } else {
            const targetX = leader.pos.x - ((i - activeLeaderIndex) * 110 * leader.facing); 
            const dist = targetX - p.pos.x;
            if (Math.abs(dist) > 50) { p.vel.x = Math.sign(dist) * s.speed * 0.98; p.facing = Math.sign(dist) || 1; } else p.vel.x *= 0.8;
            if (isActuallyFlying) {
              const targetY = leader.pos.y + (i * 35);
              const hDist = targetY - p.pos.y;
              if (Math.abs(hDist) > 10) p.vel.y = Math.sign(hDist) * s.speed * 0.7; else p.vel.y *= 0.85;
            } else {
              if (leader.vel.y < -5 && p.grounded) { p.vel.y = s.jump; p.grounded = false; }
              p.vel.y += GRAVITY;
            }
          }
          p.pos.x += p.vel.x; p.pos.y += p.vel.y;
          if (p.pos.y > GROUND_Y - p.height) { p.pos.y = GROUND_Y - p.height; p.vel.y = 0; p.grounded = true; }
          if (p.pos.y < 50) { p.pos.y = 50; p.vel.y = 0; }
          if (firing && e.frame - p.lastShot > s.fireRate) {
            soundService.playShoot();
            e.bullets.push({ pos: { x: p.pos.x + 25, y: p.pos.y + 30 }, vel: { x: p.facing * 35, y: 0 }, width: 35, height: 14, owner: 'player', damage: 20, color: stats.color, health: 1, maxHealth: 1 });
            p.lastShot = e.frame;
          }
          if (p.invulnerable > 0) p.invulnerable--;
          if (p.abilityCooldown > 0) p.abilityCooldown--;
          if (p.abilityActiveTimer > 0) {
            p.abilityActiveTimer--;
            // Continuous ability effects
            if (p.unit === RobotUnit.STRIKER) p.pos.x += p.facing * 10;
            if (p.unit === RobotUnit.SENTINEL) p.invulnerable = 2; // Constant invulnerability while shield is up
            if (p.unit === RobotUnit.NIGHTSHADE) {
              p.pos.x += p.facing * 15;
              // Damage enemies in path
              e.enemies.forEach(en => {
                if (!en.isDead && !en.isDying && Math.abs(en.pos.x - p.pos.x) < 100 && Math.abs(en.pos.y - p.pos.y) < 100) {
                  en.health -= 5;
                  if (en.health <= 0) { en.isDying = true; en.deathTimer = 0; soundService.playDrive(0.5); }
                }
              });
            }
            if (p.unit === RobotUnit.FALCON && e.frame % 10 === 0) {
              // Air strike: spawn explosions on random enemies
              const targetEnemies = e.enemies.filter(en => !en.isDead && !en.isDying && Math.abs(en.pos.x - p.pos.x) < 1000);
              if (targetEnemies.length > 0) {
                const target = targetEnemies[Math.floor(Math.random() * targetEnemies.length)];
                e.bullets.push({ 
                  pos: { x: target.pos.x, y: -100 }, 
                  vel: { x: 0, y: 25 }, 
                  width: 40, height: 40, owner: 'player', damage: 50, color: '#22d3ee', health: 1, maxHealth: 1 
                });
              }
            }
            if (p.unit === RobotUnit.VANGUARD && e.frame % 10 === 0) {
              e.players.forEach(other => { if (other.health > 0) other.health = Math.min(other.maxHealth, other.health + 2); });
              if (e.level === 21) e.shipHealth = Math.min(e.shipMaxHealth, e.shipHealth + 5);
            }
            if (p.unit === RobotUnit.BLAZE && e.frame % 5 === 0) {
              e.bullets.push({ pos: { x: p.pos.x, y: p.pos.y + 20 }, vel: { x: 0, y: 0 }, width: 40, height: 40, owner: 'player', damage: 10, color: '#f97316', health: 1, maxHealth: 1 });
            }
            if (p.unit === RobotUnit.OMEGA && e.frame % 2 === 0) {
              e.bullets.push({ pos: { x: p.pos.x + 40, y: p.pos.y + 10 }, vel: { x: p.facing * 50, y: (Math.random()-0.5)*10 }, width: 100, height: 20, owner: 'player', damage: 40, color: '#fff', health: 1, maxHealth: 1 });
            }
          }
        });
      }

      for (let i = e.bullets.length - 1; i >= 0; i--) {
        const b = e.bullets[i]; b.pos.x += b.vel.x; b.pos.y += b.vel.y || 0;
        if (b.owner === 'enemy') {
          const currentCombined = e.players.find(p => p.health > 0 && !p.isDying);
          if (e.isCombined && currentCombined && !currentCombined.invulnerable && b.pos.x < currentCombined.pos.x + currentCombined.width && b.pos.x + b.width > currentCombined.pos.x && b.pos.y < currentCombined.pos.y + currentCombined.height && b.pos.y + b.height > currentCombined.pos.y) {
            e.combinedHealth -= 25; currentCombined.invulnerable = 25; e.bullets.splice(i, 1); 
            if (e.combinedHealth <= 0) { 
              e.isCombined = false; 
              e.uncombineSequence = 1;
              e.uncombineTimer = 0;
              e.isUncombiningFromDeath = true;
              soundService.playShoot();
            }
          } else if (!e.isCombined && e.uncombineSequence === 0) {
            e.players.forEach(p => { 
              if (p.health > 0 && !p.isDying && !p.invulnerable && b.pos.x < p.pos.x + p.width && b.pos.x + b.width > p.pos.x && b.pos.y < p.pos.y + p.height && b.pos.y + b.height > p.pos.y) { 
                p.health -= 10; p.invulnerable = 40; e.bullets.splice(i, 1); 
              } 
            });
          }

          // Level 21: Ship Vulnerability to Bullets
          if (e.level === 21 && b.pos.x < e.shipPos.x + 60 && b.pos.x + b.width > e.shipPos.x - 60 && b.pos.y < e.shipPos.y + 30 && b.pos.y + b.height > e.shipPos.y - 30) {
            e.shipHealth -= 15;
            e.bullets.splice(i, 1);
            if (e.shipHealth <= 0) {
              e.gameOverTriggered = true;
              onDie();
            }
          }
        }
        if (leader && Math.abs(b.pos.x - leader.pos.x) > 4000) e.bullets.splice(i, 1);
      }

      let enemiesAliveCount = 0;
      const difficultyFactor = (1.0 + level * 0.1);
      e.enemies.forEach(en => {
        if (en.isDead) return;
        if (en.isDying) {
          en.deathTimer = (en.deathTimer || 0) + 1;
          if (en.deathTimer > DEATH_DURATION) en.isDead = true;
          return;
        }
        enemiesAliveCount++;
        const isStealthActive = leader?.unit === RobotUnit.SPECTER && leader.abilityActiveTimer > 0;
        const diff = (e.isShipActive ? e.shipPos.x : (leader?.pos.x || 0)) - en.pos.x;
        en.facing = Math.sign(diff) || -1;
        const targetX = e.isShipActive ? e.shipPos.x : (leader?.pos.x || 0);
        const targetY = e.isShipActive ? e.shipPos.y : (leader?.pos.y || 0);

        if (en.type === 'gigantic_titan') {
          // Gigantic Titan logic - Extremely Powerful
          en.pos.x += Math.sin(e.frame * 0.005) * 1.5;
          
          // Triple attack pattern
          if (e.frame % 60 === 0 && !isStealthActive) {
            const targetX = e.isShipActive ? e.shipPos.x : (leader?.pos.x || 0);
            const targetY = e.isShipActive ? e.shipPos.y : (leader?.pos.y || 0);
            const fireDir = Math.sign(targetX - en.pos.x) || -1;
            
            // Main barrage
            for(let i=0; i<8; i++) {
              e.bullets.push({ 
                pos: { x: en.pos.x, y: targetY - 140 + i*40 }, 
                vel: { x: fireDir * 10, y: (i-3.5)*1.5 }, 
                width: 50, height: 25, owner: 'enemy', health: 1, maxHealth: 1, damage: 80, color: '#ff00ff' 
              });
            }
            // Homing missiles
            if (leader) {
              const dx = targetX - en.pos.x;
              const dy = targetY - en.pos.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              e.bullets.push({ 
                pos: { x: en.pos.x + 50, y: en.pos.y + 100 }, 
                vel: { x: (dx/dist)*12, y: (dy/dist)*12 }, 
                width: 30, height: 30, owner: 'enemy', health: 1, maxHealth: 1, damage: 120, color: '#ffaa00' 
              });
            }
          }
          
          // Laser collision with titan
          if (e.isShipActive && e.laserActive) {
            // Laser is a beam from ship to the right
            if (e.shipPos.x < en.pos.x + en.width && e.shipPos.y > en.pos.y && e.shipPos.y < en.pos.y + en.height) {
              en.health -= 15; // High damage laser
              if (e.frame % 10 === 0) soundService.playShoot();
            }
          }
        } else if (en.type === 'titan' || en.type === 'omega_annihilator') {
          en.pos.x += Math.sign(targetX - en.pos.x) * 1.2 * difficultyFactor;
          if (leader && !isStealthActive && Math.abs(en.pos.x - targetX) < 1600 && e.frame - en.lastShot > 100 / difficultyFactor) {
            const dx = targetX - en.pos.x;
            const dy = targetY - (en.pos.y + 100);
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            e.bullets.push({ 
              pos: { x: en.pos.x, y: en.pos.y + 100 }, 
              vel: { x: (dx/dist) * 10 * difficultyFactor, y: (dy/dist) * 10 * difficultyFactor }, 
              width: 60, height: 40, owner: 'enemy', health: 1, maxHealth: 1, damage: 100, color: '#ff0055' 
            });
            en.lastShot = e.frame;
          }
        } else if (en.type === 'scout_commander') {
            const targetDir = Math.sign(targetX - en.pos.x);
            en.pos.x += targetDir * 4 * difficultyFactor;
            if (e.frame % 60 === 0) en.vel.y = -15; // Jump
            en.vel.y += GRAVITY;
            en.pos.y += en.vel.y;
            if (en.pos.y > GROUND_Y - en.height) { en.pos.y = GROUND_Y - en.height; en.vel.y = 0; }
            
            if (leader && !isStealthActive && e.frame - en.lastShot > 40 / difficultyFactor) {
              const dx = targetX - en.pos.x;
              const dy = targetY - (en.pos.y + 20);
              const dist = Math.sqrt(dx*dx + dy*dy) || 1;
              e.bullets.push({ 
                pos: { x: en.pos.x, y: en.pos.y + 20 }, 
                vel: { x: (dx/dist) * 20 * difficultyFactor, y: (dy/dist) * 20 * difficultyFactor }, 
                width: 20, height: 20, owner: 'enemy', health: 1, maxHealth: 1, damage: 30, color: '#ffaa00' 
              });
              en.lastShot = e.frame;
            }
        } else if (en.type === 'void_reaper') {
            const targetDir = Math.sign((leader?.pos.x || 0) - en.pos.x);
            en.pos.x += targetDir * 6 * difficultyFactor;
            if (e.frame % 120 === 0 && leader && !isStealthActive) { // Teleport
              en.pos.x = leader.pos.x + (Math.random() > 0.5 ? 200 : -200);
              soundService.playFly();
            }
            if (leader && !isStealthActive && Math.abs(en.pos.x - leader.pos.x) < 100 && e.frame - en.lastShot > 30) {
              // Melee strike
              e.bullets.push({ pos: { x: en.pos.x, y: en.pos.y }, vel: { x: targetDir * 5, y: 0 }, width: 100, height: 100, owner: 'enemy', health: 1, maxHealth: 1, damage: 150, color: '#4400ff' });
              en.lastShot = e.frame;
            }
        } else if (en.type === 'seeker' || en.type === 'drone') {
            if (en.transformTimer && en.transformTimer > 0) {
              en.transformTimer--;
              // Float up before transforming to drone (jet) mode
              if (en.isTransformed && en.transformTimer < 50) {
                en.pos.y -= 2.5;
              }
            } else { 
              en.isTransformed = !en.isTransformed; 
              en.transformTimer = 200 + Math.random() * 300; 
              if (en.isTransformed) {
                en.width = 48; en.height = 72;
              } else {
                en.width = 48; en.height = 40;
              }
            }

            if (en.isTransformed) {
              // Humanoid mode: walk on ground
              const targetDir = Math.sign((leader?.pos.x || 0) - en.pos.x);
              en.facing = targetDir || -1;
              en.pos.x += targetDir * 2 * difficultyFactor;
              if (en.pos.y < GROUND_Y - en.height) en.pos.y += 5; else en.pos.y = GROUND_Y - en.height;
              
              if (leader && !isStealthActive && Math.abs(en.pos.x - leader.pos.x) < 1200 && e.frame - en.lastShot > 80 / difficultyFactor) {
                e.bullets.push({ pos: { x: en.pos.x, y: en.pos.y + 20 }, vel: { x: Math.sign(leader.pos.x - en.pos.x) * 15 * difficultyFactor, y: 0 }, width: 30, height: 10, owner: 'enemy', health: 1, maxHealth: 1, damage: 40, color: '#ff0000' });
                en.lastShot = e.frame;
              }
            } else {
              // Drone (Jet) mode: fly
              en.pos.y = 250 + Math.sin(e.frame * 0.05 + en.id) * 60;
              en.pos.x += Math.cos(e.frame * 0.02 + en.id) * 3 * difficultyFactor;
              if (leader && !isStealthActive && Math.abs(en.pos.x - leader.pos.x) < 1400 && e.frame - en.lastShot > 100 / difficultyFactor) {
                 const dx = leader.pos.x - en.pos.x;
                 const dy = (leader.pos.y + 20) - en.pos.y;
                 const dist = Math.sqrt(dx*dx + dy*dy);
                 e.bullets.push({ 
                   pos: { x: en.pos.x, y: en.pos.y }, 
                   vel: { x: (dx/dist) * 10 * difficultyFactor, y: (dy/dist) * 10 * difficultyFactor }, 
                   width: 15, height: 15, owner: 'enemy', health: 1, maxHealth: 1, damage: 30, color: '#ff3300' 
                 });
                 en.lastShot = e.frame;
              }
            }
        } else if (en.type === 'dragon' || en.type === 'swarm_queen') {
          en.pos.x += Math.cos(e.frame * 0.05) * 8 * difficultyFactor;
          en.pos.y = 200 + Math.sin(e.frame * 0.05) * 100;
          if (leader && !isStealthActive && e.frame - en.lastShot > 60 / difficultyFactor) {
            e.bullets.push({ pos: { x: en.pos.x, y: en.pos.y }, vel: { x: Math.sign(leader.pos.x - en.pos.x) * 18 * difficultyFactor, y: 4 }, width: 30, height: 30, owner: 'enemy', health: 1, maxHealth: 1, damage: 60, color: '#ff7700' });
            en.lastShot = e.frame;
          }
          if (en.type === 'swarm_queen' && e.frame % 180 === 0) {
            // Spawn drone
            e.enemies.push({
              id: Math.random(),
              pos: { x: en.pos.x, y: en.pos.y },
              vel: { x: 0, y: 0 },
              width: 48, height: 40,
              health: 100 * difficultyFactor,
              maxHealth: 100 * difficultyFactor,
              isDead: false,
              type: 'drone',
              lastShot: 0,
              facing: -1,
              isTransformed: false,
              transformTimer: 100
            });
          }
        } else if (en.type === 'omnidroid' || en.type === 'plasma_sentinel') {
          en.pos.x += Math.sign((leader?.pos.x || 0) - en.pos.x) * 4 * difficultyFactor;
          if (leader && !isStealthActive && e.frame - en.lastShot > 40 / difficultyFactor) {
            for(let j=0; j<8; j++) { const ang = (j / 8) * Math.PI * 2; e.bullets.push({ pos: { x: en.pos.x, y: en.pos.y }, vel: { x: Math.cos(ang) * 12 * difficultyFactor, y: Math.sin(ang) * 12 * difficultyFactor }, width: 20, height: 20, owner: 'enemy', health: 1, maxHealth: 1, damage: 40, color: '#aa00ff' }); }
            en.lastShot = e.frame;
          }
        } else if (en.type === 'kamikaze_drone') {
          const target = e.isShipActive ? e.shipPos : (leader?.pos || { x: 0, y: 0 });
          const dx = target.x - en.pos.x;
          const dy = target.y - en.pos.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 5) {
            en.pos.x += (dx/dist) * 8 * difficultyFactor;
            en.pos.y += (dy/dist) * 8 * difficultyFactor;
          }
          if (dist < 50 && !isStealthActive) {
            // Explode
            en.health = 0;
            en.isDying = true;
            en.deathTimer = 0;
            for(let j=0; j<12; j++) {
              const ang = (j / 12) * Math.PI * 2;
              e.bullets.push({ 
                pos: { x: en.pos.x, y: en.pos.y }, 
                vel: { x: Math.cos(ang) * 15, y: Math.sin(ang) * 15 }, 
                width: 20, height: 20, owner: 'enemy', health: 1, maxHealth: 1, damage: 60, color: '#ffaa00' 
              });
            }
          }
        } else if (en.type === 'shield_sentinel') {
          const targetDir = Math.sign(targetX - en.pos.x);
          en.pos.x += targetDir * 1.5 * difficultyFactor;
          en.facing = targetDir;
          if (leader && !isStealthActive && e.frame - en.lastShot > 100 / difficultyFactor) {
            const dx = targetX - en.pos.x;
            const dy = targetY - (en.pos.y + 20);
            const dist = Math.sqrt(dx*dx + dy*dy) || 1;
            e.bullets.push({ 
              pos: { x: en.pos.x, y: en.pos.y + 20 }, 
              vel: { x: (dx/dist) * 12 * difficultyFactor, y: (dy/dist) * 12 * difficultyFactor }, 
              width: 40, height: 15, owner: 'enemy', health: 1, maxHealth: 1, damage: 40, color: '#00ffcc' 
            });
            en.lastShot = e.frame;
          }
        } else if (en.type === 'plasma_sniper') {
          const targetDir = Math.sign(targetX - en.pos.x);
          const dist = Math.abs(targetX - en.pos.x);
          if (dist < 600) en.pos.x -= targetDir * 2 * difficultyFactor;
          else if (dist > 1000) en.pos.x += targetDir * 2 * difficultyFactor;
          
          if (leader && !isStealthActive && e.frame - en.lastShot > 180 / difficultyFactor) {
            const dx = targetX - en.pos.x;
            const dy = targetY - (en.pos.y + 10);
            const d = Math.sqrt(dx*dx + dy*dy) || 1;
            e.bullets.push({ 
              pos: { x: en.pos.x, y: en.pos.y + 10 }, 
              vel: { x: (dx/d) * 30 * difficultyFactor, y: (dy/d) * 30 * difficultyFactor }, 
              width: 60, height: 6, owner: 'enemy', health: 1, maxHealth: 1, damage: 120, color: '#00ccff' 
            });
            en.lastShot = e.frame;
          }
        } else if (en.type === 'swarmer_bot') {
          const targetDir = Math.sign((leader?.pos.x || 0) - en.pos.x);
          en.pos.x += targetDir * 5 * difficultyFactor;
          en.pos.y = GROUND_Y - en.height + Math.sin(e.frame * 0.2 + en.id) * 10;
          if (leader && !isStealthActive && Math.abs(en.pos.x - leader.pos.x) < 400 && e.frame - en.lastShot > 40 / difficultyFactor) {
            e.bullets.push({ 
              pos: { x: en.pos.x, y: en.pos.y }, 
              vel: { x: targetDir * 10 * difficultyFactor, y: (Math.random() - 0.5) * 4 }, 
              width: 10, height: 10, owner: 'enemy', health: 1, maxHealth: 1, damage: 15, color: '#ffff00' 
            });
            en.lastShot = e.frame;
          }
        } else if (en.type === 'tank' || en.type === 'fortress_tank') {
          if (en.transformTimer && en.transformTimer > 0) en.transformTimer--; else { en.isTransformed = !en.isTransformed; en.transformTimer = 200 + Math.random() * 300; }
          const targetDir = Math.sign(targetX - en.pos.x);
          if (en.isTransformed) {
            en.vel.x += targetDir * 0.02 * difficultyFactor; if (Math.abs(en.vel.x) > 1.0 * difficultyFactor) en.vel.x = Math.sign(en.vel.x) * 1.0 * difficultyFactor;
          } else en.vel.x = targetDir * 1.6 * difficultyFactor;
          en.pos.x += en.vel.x;
          if (leader && !isStealthActive && Math.abs(en.pos.x - targetX) < 1400 && e.frame - en.lastShot > (en.isTransformed ? 120 : 60) / difficultyFactor) {
            const dx = targetX - en.pos.x;
            const dy = targetY - (en.isTransformed ? en.pos.y - 15 : en.pos.y + 30);
            const d = Math.sqrt(dx*dx + dy*dy) || 1;
            e.bullets.push({ 
              pos: { x: en.pos.x, y: en.isTransformed ? en.pos.y - 15 : en.pos.y + 30 }, 
              vel: { x: (dx/d) * 12 * difficultyFactor, y: (dy/d) * 12 * difficultyFactor }, 
              width: 40, height: 20, owner: 'enemy', health: 1, maxHealth: 1, damage: 50, color: '#550000' 
            });
            en.lastShot = e.frame;
          }
        }

        // Collision with player
        const playersToCheck = e.isCombined ? [e.players.find(p => p.health > 0 && !p.isDying) || e.players[0]] : e.players;
        playersToCheck.forEach(p => {
          if (p.health > 0 && !p.isDying && !p.invulnerable && 
              en.pos.x < p.pos.x + p.width && en.pos.x + en.width > p.pos.x && 
              en.pos.y < p.pos.y + p.height && en.pos.y + en.height > p.pos.y) {
            
            if (e.isCombined) {
              e.combinedHealth -= 20;
              p.invulnerable = 30;
              if (e.combinedHealth <= 0) {
                e.isCombined = false;
                e.uncombineSequence = 1;
                e.uncombineTimer = 0;
                e.isUncombiningFromDeath = true;
                soundService.playShoot();
              }
            } else {
              p.health -= 20;
              p.invulnerable = 40;
            }
            // Small knockback
            const knockDir = Math.sign(p.pos.x - en.pos.x) || 1;
            p.vel.x = knockDir * 10;
            p.vel.y = -5;
          }
        });

        // Level 21: Ship Collision with Enemies
        if (e.level === 21 && en.pos.x < e.shipPos.x + 60 && en.pos.x + en.width > e.shipPos.x - 60 && en.pos.y < e.shipPos.y + 30 && en.pos.y + en.height > e.shipPos.y - 30) {
          e.shipHealth -= 50; // Heavy damage from direct collision
          
          // If it's a kamikaze drone, it should explode on impact
          if (en.type === 'kamikaze_drone') {
            en.health = 0;
            en.isDying = true;
            en.deathTimer = 0;
          } else {
            // Push enemy back
            en.pos.x += Math.sign(en.pos.x - e.shipPos.x) * 100;
          }

          if (e.shipHealth <= 0) {
            e.gameOverTriggered = true;
            onDie();
          }
        }

        for (let bi = e.bullets.length - 1; bi >= 0; bi--) {
          const b = e.bullets[bi];
          if (b.owner === 'player' && b.pos.x < en.pos.x + en.width && b.pos.x + b.width > en.pos.x && b.pos.y < en.pos.y + en.height && b.pos.y + b.height > en.pos.y) { 
            en.health -= (b.damage || 20); e.bullets.splice(bi, 1); 
            if (en.health <= 0) { en.isDying = true; en.deathTimer = 0; soundService.playDrive(0.5); }
          }
        }
      });

      if (enemiesAliveCount === 0 && !e.winTriggered && e.level !== 21 && e.level !== 22) {
        if (e.enemies.every(en => en.isDead || !en.isDying)) { e.winTriggered = true; onWin(); }
      }
      
      // Level 21 Win Condition: 25% HP of Titan (Titan has 10000 HP, so 7500 HP remaining)
      if (e.level === 21 && !e.winTriggered && !e.cutsceneType) {
        const titan = e.enemies.find(en => en.type === 'gigantic_titan');
        if (titan && titan.health <= 7500) {
          e.cutsceneType = 'titan_laser';
          e.cutsceneTimer = 0;
          e.isShipActive = false; // Eject from ship
          
          // Reposition players for the "execution"
          const titanX = titan.pos.x;
          e.players.forEach((p, i) => {
            p.pos.x = titanX - 400 - (i * 60);
            p.pos.y = GROUND_Y - p.height;
            p.vel.x = 0;
            p.vel.y = 0;
            p.isTransformed = false;
            p.facing = 1;
          });
          e.cameraX = titanX - 800;
        }
      }

      // Handle Cutscene Logic
      if (e.cutsceneType === 'titan_laser') {
        e.cutsceneTimer++;
        
        // Lock camera
        const titan = e.enemies.find(en => en.type === 'gigantic_titan');
        if (titan) e.cameraX = titan.pos.x - 800;

        if (e.cutsceneTimer === 60) {
          soundService.playShoot(); // Charge sound
        }
        
        if (e.cutsceneTimer >= 120 && e.cutsceneTimer <= 180) {
          if (e.frame % 5 === 0) soundService.playShoot();
          // Kill players during the laser blast
          e.players.forEach(p => {
            if (p.health > 0) {
              p.health = 0;
              p.isDying = true;
              p.deathTimer = 0;
            }
          });
        }

        if (e.cutsceneTimer > 240) {
          e.winTriggered = true;
          onTitanScene();
          e.cutsceneType = null;
        }
        return; // Skip normal update during cutscene
      }

      // Level 22 Rescue Mission Logic
      if (e.level === 22) {
        const leader = e.players[e.activeLeaderIndex];
        if (leader) {
          // Update grabbed body position
          if (e.grabbedBodyIndex !== -1) {
            const body = e.bodies[e.grabbedBodyIndex];
            body.pos.x = leader.pos.x;
            body.pos.y = leader.pos.y - 30;

            // Check for delivery to rescue ship
            const distToShip = Math.sqrt(Math.pow(body.pos.x - e.rescueShipPos.x, 2) + Math.pow(body.pos.y - e.rescueShipPos.y, 2));
            if (distToShip < 150) {
              body.delivered = true;
              body.grabbed = false;
              e.grabbedBodyIndex = -1;
              e.bodiesCollected++;
              soundService.playShoot();
              if (e.bodiesCollected >= e.bodies.length && !e.winTriggered) {
                e.winTriggered = true;
                setTimeout(() => onWin(), 1000);
              }
            }
          }
        }
      }

      if (leader) e.cameraX = (e.isShipActive ? e.shipPos.x : leader.pos.x) - 700;
    };

    const draw = () => {
      const cvs = canvasRef.current; if (!cvs) return;
      const ctx = cvs.getContext('2d')!;
      
      drawCityscape(ctx, e);
      ctx.save(); ctx.translate(-e.cameraX, 0);
      
      const sector = SECTORS.find(s => s.id === level) || SECTORS[0];
      const theme = sector.theme;
      
      // Ground
      let groundColor = '#06060a';
      let gridColor = '#00f3ff11';
      
      if (theme === SectorTheme.WASTELAND) {
        groundColor = '#1a110a';
        gridColor = '#4a3c2a22';
      } else if (theme === SectorTheme.DATA_CORE) {
        groundColor = '#000500';
        gridColor = '#00ff0011';
      } else if (theme === SectorTheme.NEON_DISTRICT) {
        groundColor = '#050010';
        gridColor = '#ff00ff11';
      } else if (theme === SectorTheme.INDUSTRIAL) {
        groundColor = '#111';
        gridColor = '#33221122';
      } else if (theme === SectorTheme.ORBITAL_STATION) {
        groundColor = '#0a0a0a';
        gridColor = '#ffffff11';
      }

      ctx.fillStyle = groundColor; 
      ctx.fillRect(e.cameraX - 2500, GROUND_Y, CANVAS_WIDTH + 5000, 300);
      
      ctx.strokeStyle = gridColor; ctx.lineWidth = 5;
      for (let gx = Math.floor((e.cameraX - 2500) / 120) * 120; gx < e.cameraX + 5500; gx += 120) { 
        ctx.beginPath(); ctx.moveTo(gx, GROUND_Y); ctx.lineTo(gx, GROUND_Y + 300); ctx.stroke(); 
      }
      
      e.enemies.forEach(en => { 
        if(!en.isDead) { 
          if (en.type === 'gigantic_titan') {
            ctx.save();
            ctx.translate(en.pos.x + en.width/2, en.pos.y + en.height/2);
            ctx.scale(en.facing || 1, 1);
            
            const frame = e.frame;
            const bob = Math.sin(frame * 0.05) * 10;
            const armSwing = Math.sin(frame * 0.03) * 0.3;
            const legSwing = Math.sin(frame * 0.02) * 0.1;

            // --- LEGS ---
            // Left Leg
            ctx.save();
            ctx.translate(-80, 100);
            ctx.rotate(legSwing);
            drawMechanicalPart(ctx, -40, 0, 80, 120, '#111', 10); // Upper
            ctx.translate(0, 110);
            ctx.rotate(legSwing * 0.5);
            drawMechanicalPart(ctx, -45, 0, 90, 100, '#0a0a0a', 5); // Lower
            drawMechanicalPart(ctx, -60, 90, 120, 30, '#000', 5); // Foot
            ctx.restore();

            // Right Leg
            ctx.save();
            ctx.translate(80, 100);
            ctx.rotate(-legSwing);
            drawMechanicalPart(ctx, -40, 0, 80, 120, '#111', 10); // Upper
            ctx.translate(0, 110);
            ctx.rotate(-legSwing * 0.5);
            drawMechanicalPart(ctx, -45, 0, 90, 100, '#0a0a0a', 5); // Lower
            drawMechanicalPart(ctx, -60, 90, 120, 30, '#000', 5); // Foot
            ctx.restore();

            // --- TORSO ---
            ctx.translate(0, bob);
            drawMechanicalPart(ctx, -150, -200, 300, 350, '#1a1a1a', 30);
            
            // Armor Plates
            drawMechanicalPart(ctx, -130, -180, 260, 100, '#222', 10);
            drawMechanicalPart(ctx, -130, -60, 260, 100, '#222', 10);

            // --- ARMS ---
            // Left Arm
            ctx.save();
            ctx.translate(-150, -150);
            ctx.rotate(0.5 + armSwing);
            drawMechanicalPart(ctx, -100, -40, 120, 80, '#111', 15); // Upper
            ctx.translate(-90, 0);
            ctx.rotate(0.8 + armSwing);
            drawMechanicalPart(ctx, -120, -35, 140, 70, '#0a0a0a', 10); // Lower
            // Hand/Claw
            ctx.fillStyle = '#ff0055';
            ctx.beginPath(); ctx.moveTo(-120, -20); ctx.lineTo(-160, -40); ctx.lineTo(-160, 40); ctx.lineTo(-120, 20); ctx.fill();
            ctx.restore();

            // Right Arm
            ctx.save();
            ctx.translate(150, -150);
            ctx.rotate(-0.5 - armSwing);
            drawMechanicalPart(ctx, -20, -40, 120, 80, '#111', 15); // Upper
            ctx.translate(90, 0);
            ctx.rotate(-0.8 - armSwing);
            drawMechanicalPart(ctx, -20, -35, 140, 70, '#0a0a0a', 10); // Lower
            // Hand/Claw
            ctx.fillStyle = '#ff0055';
            ctx.beginPath(); ctx.moveTo(120, -20); ctx.lineTo(160, -40); ctx.lineTo(160, 40); ctx.lineTo(120, 20); ctx.fill();
            ctx.restore();

            // --- HEAD ---
            ctx.save();
            ctx.translate(0, -220);
            drawMechanicalPart(ctx, -60, -60, 120, 100, '#0a0a0a', 20);
            // Glowing Eyes
            const eyeGlow = 0.5 + Math.sin(frame * 0.2) * 0.5;
            ctx.fillStyle = `rgba(255, 0, 0, ${eyeGlow})`;
            ctx.shadowBlur = 15; ctx.shadowColor = '#ff0000';
            ctx.beginPath(); ctx.arc(-25, -10, 12, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(25, -10, 12, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.restore();

            // --- CORE ---
            const coreGlow = 0.5 + Math.sin(frame * 0.1) * 0.5;
            ctx.fillStyle = `rgba(255, 0, 255, ${coreGlow})`;
            ctx.shadowBlur = 30; ctx.shadowColor = '#ff00ff';
            ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI*2); ctx.fill();
            // Core Detail
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
            ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.restore();
          } else if (['titan', 'dragon', 'omnidroid', 'tank', 'scout_commander', 'fortress_tank', 'swarm_queen', 'plasma_sentinel', 'void_reaper', 'omega_annihilator'].includes(en.type)) { drawBoss(ctx, en, e.frame); } 
          else if (en.type === 'drone' || en.type === 'seeker') { drawDrone(ctx, en, e.frame); }
          else if (['kamikaze_drone', 'shield_sentinel', 'plasma_sniper', 'swarmer_bot'].includes(en.type)) { drawRogueMachine(ctx, en, e.frame); }
          else { drawUnit(ctx, en.pos.x, en.pos.y, en.width, en.height, RobotUnit.SENTINEL, en.facing || -1, e.frame, true, false, false, 1, en.vel, 1.6, false, 'grunt', false, en.isDying, en.deathTimer, 'normal', undefined, false); } 
          
          if (!en.isDying) { 
            const barY = en.type === 'gigantic_titan' ? en.pos.y - 100 : en.pos.y - 15;
            ctx.fillStyle = '#111'; ctx.fillRect(en.pos.x, barY, en.width, 6); ctx.fillStyle = '#ff0055'; ctx.fillRect(en.pos.x, barY, en.width * (en.health / en.maxHealth), 6); 
          } 
        } 
      });

      if (e.level === 21) {
        // Draw Space Ship as world object if not active
        ctx.save();
        ctx.translate(e.shipPos.x, e.shipPos.y);
        
        // Hover effect if not active
        if (!e.isShipActive) {
          ctx.translate(0, Math.sin(e.frame * 0.05) * 10);
        }

        // Draw Ship Body
        drawMechanicalPart(ctx, -60, -30, 120, 60, '#22d3ee', 15);
        drawMechanicalPart(ctx, -40, -45, 80, 30, '#0a0a0a', 10);
        
        // Thrusters
        if (e.isShipActive && e.frame % 4 !== 0) {
          ctx.fillStyle = '#ff7700';
          ctx.beginPath(); ctx.moveTo(-60, -10); ctx.lineTo(-90, 0); ctx.lineTo(-60, 10); ctx.fill();
        } else if (!e.isShipActive) {
          // Idle glow
          ctx.fillStyle = '#22d3ee44';
          ctx.beginPath(); ctx.arc(-60, 0, 20 + Math.sin(e.frame*0.1)*5, 0, Math.PI*2); ctx.fill();
        }

        // Laser
        if (e.isShipActive && e.laserActive) {
          const grad = ctx.createLinearGradient(60, 0, 2000, 0);
          grad.addColorStop(0, '#00f3ff');
          grad.addColorStop(1, 'transparent');
          ctx.strokeStyle = grad;
          ctx.lineWidth = 15 + Math.sin(e.frame * 0.5) * 5;
          ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(2000, 0); ctx.stroke();
          ctx.shadowBlur = 20; ctx.shadowColor = '#00f3ff';
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Boarding Popup
        if (!e.isShipActive) {
          const leader = e.players[e.activeLeaderIndex];
          if (leader) {
            const dist = Math.sqrt(Math.pow(leader.pos.x - e.shipPos.x, 2) + Math.pow(leader.pos.y - e.shipPos.y, 2));
            if (dist < 250) {
              ctx.save();
              ctx.translate(0, -80);
              // Bubble
              ctx.fillStyle = 'rgba(0, 243, 255, 0.9)';
              ctx.beginPath(); ctx.roundRect(-80, -30, 160, 40, 10); ctx.fill();
              ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-10, 0); ctx.lineTo(10, 0); ctx.fill();
              // Text
              ctx.fillStyle = '#000';
              ctx.font = 'bold 12px Orbitron';
              ctx.textAlign = 'center';
              ctx.fillText("CLICK [G] TO BOARD", 0, -5);
              ctx.restore();
            }
          }
        }
        ctx.restore();
      }

      // Level 22 Rescue Mission Rendering
      if (e.level === 22) {
        // Draw Rescue Ship
        ctx.save();
        ctx.translate(e.rescueShipPos.x, e.rescueShipPos.y);
        drawMechanicalPart(ctx, -150, -100, 300, 150, '#1a1a1a', 20);
        drawMechanicalPart(ctx, -120, -120, 240, 40, '#222', 10); // Top part
        ctx.fillStyle = '#00f3ff';
        ctx.shadowBlur = 20; ctx.shadowColor = '#00f3ff';
        ctx.beginPath(); ctx.arc(0, -80, 20, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText("RESCUE SHIP", 0, -140);
        ctx.fillText("DROP BODIES HERE", 0, 20);
        ctx.restore();

        // Draw Bodies
        e.bodies.forEach((b: any) => {
          if (b.delivered) return;
          ctx.save();
          ctx.translate(b.pos.x, b.pos.y);
          if (b.grabbed) {
            ctx.rotate(Math.sin(e.frame * 0.1) * 0.2);
          } else {
            ctx.rotate(Math.PI / 2); // Lying down
          }
          const stats = ROBOT_STATS[b.unit];
          drawHumanoid(ctx, stats.color, e.frame, false, 1, 1, true, 0, 'normal');
          
          if (!b.grabbed) {
            // Prompt to grab
            const leader = e.players[e.activeLeaderIndex];
            if (leader) {
              const dist = Math.sqrt(Math.pow(leader.pos.x - b.pos.x, 2) + Math.pow(leader.pos.y - b.pos.y, 2));
              if (dist < 150) {
                ctx.save();
                ctx.translate(0, -60);
                ctx.rotate(-Math.PI / 2);
                ctx.fillStyle = 'rgba(250, 204, 21, 0.9)';
                ctx.beginPath(); ctx.roundRect(-50, -20, 100, 30, 5); ctx.fill();
                ctx.fillStyle = '#000'; ctx.font = 'bold 10px Orbitron'; ctx.textAlign = 'center';
                ctx.fillText("[T] GRAB", 0, 0);
                ctx.restore();
              }
            }
          }
          ctx.restore();
        });
      }

      // Draw Cutscene Effects
      if (e.cutsceneType === 'titan_laser') {
        const titan = e.enemies.find(en => en.type === 'gigantic_titan');
        if (titan) {
          const coreX = titan.pos.x + titan.width / 2;
          const coreY = titan.pos.y + titan.height / 2 + (Math.sin(e.frame * 0.05) * 10); // Bobbing core
          
          if (e.cutsceneTimer > 60 && e.cutsceneTimer < 120) {
            // Charging effect
            const chargeProgress = (e.cutsceneTimer - 60) / 60;
            ctx.save();
            ctx.translate(coreX, coreY);
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            for(let i=0; i<8; i++) {
              const ang = (i / 8) * Math.PI * 2 + e.frame * 0.1;
              const dist = 200 * (1 - chargeProgress);
              ctx.beginPath();
              ctx.moveTo(Math.cos(ang) * dist, Math.sin(ang) * dist);
              ctx.lineTo(0, 0);
              ctx.stroke();
            }
            ctx.restore();
          }

          if (e.cutsceneTimer >= 120 && e.cutsceneTimer <= 200) {
            // MASSIVE LASER
            const laserWidth = 150 + Math.sin(e.frame * 0.8) * 30;
            const grad = ctx.createLinearGradient(coreX, coreY, coreX - 2000, coreY);
            grad.addColorStop(0, '#ff00ff');
            grad.addColorStop(0.5, '#ffffff');
            grad.addColorStop(1, '#ff00ff');
            
            ctx.save();
            ctx.shadowBlur = 50;
            ctx.shadowColor = '#ff00ff';
            ctx.strokeStyle = grad;
            ctx.lineWidth = laserWidth;
            ctx.beginPath();
            ctx.moveTo(coreX, coreY);
            ctx.lineTo(coreX - 2000, coreY);
            ctx.stroke();
            
            // Core flash
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(coreX, coreY, 100 + Math.random() * 50, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Screen flash
            if (e.cutsceneTimer < 130) {
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.fillStyle = `rgba(255, 255, 255, ${1 - (e.cutsceneTimer - 120) / 10})`;
              ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              ctx.restore();
            }
          }
        }

        // Overlay text
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (e.cutsceneTimer > 30 && e.cutsceneTimer < 120) {
          ctx.fillStyle = '#ff0000';
          ctx.font = 'bold 40px Orbitron';
          ctx.textAlign = 'center';
          ctx.fillText("WARNING: EXTREME ENERGY SIGNATURE DETECTED", CANVAS_WIDTH / 2, 200);
          ctx.font = 'bold 20px Orbitron';
          ctx.fillText("TITAN CORE OVERLOAD IN PROGRESS", CANVAS_WIDTH / 2, 250);
        }
        ctx.restore();
      }

      const activeLeader = e.players.find(p => p.health > 0 || p.isDying);
      if (e.combineSequence > 0 && activeLeader) {
          const lx = activeLeader.pos.x + activeLeader.width / 2;
          const ly = activeLeader.pos.y + activeLeader.height / 2;
          
          if (e.combineSequence === 1) {
            e.players.forEach(p => {
              if (p.health > 0) drawUnit(ctx, p.pos.x, p.pos.y, p.width, p.height, p.unit, p.facing, e.frame, false, false, p.isTransformed, 1, p.vel, 1, false, 'grunt', false, false, 0, 'normal', undefined, p.abilityActiveTimer > 0);
            });
            ctx.fillStyle = '#facc15'; ctx.font = 'bold 40px Orbitron'; ctx.textAlign = 'center';
            ctx.fillText("INITIATING COMBINATION SEQUENCE...", lx, ly - 150);
          } else if (e.combineSequence === 2) {
            const progress = e.combineTimer / 40;
            const lx = activeLeader.pos.x + activeLeader.width / 2;
            const ly = activeLeader.pos.y + activeLeader.height / 2;

            // Limb target offsets relative to combiner center
            const limbOffsets = [
              { x: 0, y: -40, pose: 'limb-torso' as const, rot: 0 },  // Torso (Leader)
              { x: 60, y: -30, pose: 'limb-arm' as const, rot: 0.2 },   // Right Arm
              { x: -60, y: -30, pose: 'limb-arm' as const, rot: -0.2 },  // Left Arm
              { x: 30, y: 50, pose: 'limb-leg' as const, rot: 0.1 },    // Right Leg
              { x: -30, y: 50, pose: 'limb-leg' as const, rot: -0.1 },   // Left Leg
            ];

            e.players.forEach((p, i) => {
              if (p.health <= 0) return;
              const offset = limbOffsets[i] || { x: 0, y: 0, pose: 'normal' as const, rot: 0 };
              
              // Interpolate from current position to limb position
              const targetX = lx + offset.x;
              const targetY = ly + offset.y;
              
              const curX = p.pos.x + p.width / 2;
              const curY = p.pos.y + p.height / 2;
              
              const drawX = curX + (targetX - curX) * progress;
              const drawY = curY + (targetY - curY) * progress;

              ctx.save();
              ctx.translate(drawX, drawY);
              ctx.rotate(offset.rot * progress);
              // Face the center
              const facing = Math.sign(lx - drawX) || 1;
              ctx.scale(facing, 1);
              
              const stats = ROBOT_STATS[p.unit];
              drawHumanoid(ctx, stats.color, e.frame, false, 1, 1 + progress * 1.5, false, 0, offset.pose);
              ctx.restore();
            });

            // Energy effects
            const radius = 50 + Math.sin(e.frame * 0.5) * 30;
            const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, radius);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(lx, ly, radius, 0, Math.PI * 2); ctx.fill();
          } else if (e.combineSequence === 3) {
            const alpha = Math.min(1, e.combineTimer / 20);
            const poseY = activeLeader.pos.y - (e.combineTimer < 20 ? (20 - e.combineTimer) * 2 : 0);
            const limbColors = upgrades.activeSquad.map(u => ROBOT_STATS[u].color);
            drawUnit(ctx, activeLeader.pos.x, poseY, activeLeader.width, activeLeader.height, activeLeader.unit, activeLeader.facing, e.frame, false, false, false, alpha, activeLeader.vel, 1, true, 'grunt', false, false, 0, 'victory', limbColors, activeLeader.abilityActiveTimer > 0);
            
            ctx.fillStyle = '#facc15'; ctx.font = 'bold 60px Orbitron'; ctx.textAlign = 'center';
            ctx.fillText("ULTIMATE CYBERBOT ONLINE", lx, ly - 200);
            
            if (e.combineTimer < 15) {
              ctx.save();
              ctx.setTransform(1, 0, 0, 1, 0, 0);
              ctx.fillStyle = `rgba(255, 255, 255, ${1 - e.combineTimer/15})`;
              ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
              ctx.restore();
            }
          }
      } else if (e.uncombineSequence > 0 && activeLeader) {
          const lx = activeLeader.pos.x + activeLeader.width / 2;
          const ly = activeLeader.pos.y + activeLeader.height / 2;
          const limbColors = upgrades.activeSquad.map(u => ROBOT_STATS[u].color);

          if (e.uncombineSequence === 1) { // Reverse Emerging
             const alpha = Math.max(0, 1 - e.uncombineTimer / 40);
             drawUnit(ctx, activeLeader.pos.x, activeLeader.pos.y, 110, 160, activeLeader.unit, activeLeader.facing, e.frame, false, false, false, alpha, activeLeader.vel, 1, true, 'grunt', false, false, 0, 'victory', limbColors, activeLeader.abilityActiveTimer > 0);
             if (e.uncombineTimer < 15) {
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = `rgba(255, 255, 255, ${e.uncombineTimer/15})`;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.restore();
             }
          } else if (e.uncombineSequence === 2) { // Reverse Merging
             const progress = 1 - (e.uncombineTimer / 40);
             const limbOffsets = [
               { x: 0, y: -40, pose: 'limb-torso' as const, rot: 0 },
               { x: 60, y: -30, pose: 'limb-arm' as const, rot: 0.2 },
               { x: -60, y: -30, pose: 'limb-arm' as const, rot: -0.2 },
               { x: 30, y: 50, pose: 'limb-leg' as const, rot: 0.1 },
               { x: -30, y: 50, pose: 'limb-leg' as const, rot: -0.1 },
             ];
             e.players.forEach((p, i) => {
               const offset = limbOffsets[i] || { x: 0, y: 0, pose: 'normal' as const, rot: 0 };
               const targetX = lx + offset.x;
               const targetY = ly + offset.y;
               const curX = p.pos.x + p.width / 2;
               const curY = p.pos.y + p.height / 2;
               const drawX = curX + (targetX - curX) * progress;
               const drawY = curY + (targetY - curY) * progress;
               ctx.save();
               ctx.translate(drawX, drawY);
               ctx.rotate(offset.rot * progress);
               const facing = Math.sign(lx - drawX) || 1;
               ctx.scale(facing, 1);
               const stats = ROBOT_STATS[p.unit];
               drawHumanoid(ctx, stats.color, e.frame, false, 1, 1 + progress * 1.5, false, 0, offset.pose);
               ctx.restore();
             });
          } else if (e.uncombineSequence === 3) { // Reverse Gathering
             e.players.forEach(p => {
               drawUnit(ctx, p.pos.x, p.pos.y, p.width, p.height, p.unit, p.facing, e.frame, false, false, false, 1, p.vel, 1, false, 'grunt', false, false, 0, 'normal', undefined, p.abilityActiveTimer > 0);
             });
          }
      } else if (e.isCombined && activeLeader) {
          const limbColors = upgrades.activeSquad.map(u => ROBOT_STATS[u].color);
          drawUnit(ctx, activeLeader.pos.x, activeLeader.pos.y, activeLeader.width, activeLeader.height, activeLeader.unit, activeLeader.facing, e.frame, false, activeLeader.invulnerable > 0, false, 1, activeLeader.vel, 1, true, 'grunt', false, activeLeader.isDying, activeLeader.deathTimer, 'normal', limbColors, activeLeader.abilityActiveTimer > 0);
      } else {
          e.players.forEach(p => { if(p.health > 0 || p.isDying) drawUnit(ctx, p.pos.x, p.pos.y, p.width, p.height, p.unit, p.facing, e.frame, false, p.invulnerable > 0, p.isTransformed, 1, p.vel, 1, false, 'grunt', p.flightActive, p.isDying, p.deathTimer, 'normal', undefined, p.abilityActiveTimer > 0); });
      }
      e.bullets.forEach(b => { ctx.fillStyle = b.color || '#fff'; ctx.fillRect(b.pos.x, b.pos.y, b.width, b.height); });
      
      ctx.restore();
      
      if (e.winTriggered) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 80px Orbitron';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 30; ctx.shadowColor = '#facc15';
        ctx.fillText("MISSION ACCOMPLISHED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        ctx.font = 'bold 30px Orbitron';
        ctx.fillText("SECTOR SECURED", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
        ctx.restore();
      }

      drawHUD(ctx, e);
    };
    loop();
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); cancelAnimationFrame(animationId); };
  }, [onWin, onDie, onTitanScene, upgrades, level, showCutscene]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden font-orbitron">
      {/* Tutorial Overlay */}
      {isTutorial && tutorialStep < tutorialMessages.length && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none">
          <div className="bg-black/90 border-2 border-cyan-500 p-8 min-w-[450px] text-center font-orbitron shadow-[0_0_60px_rgba(6,182,212,0.6)] animate-in zoom-in duration-300 backdrop-blur-md">
            <div className="text-cyan-400 text-xs font-black tracking-[0.5em] uppercase mb-3 opacity-70">Tactical Training // Step {tutorialStep + 1}</div>
            <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{tutorialMessages[tutorialStep].title}</h3>
            <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-6"></div>
            <p className="text-cyan-50/90 text-xl mb-8 leading-relaxed font-medium">{tutorialMessages[tutorialStep].text}</p>
            <div className="flex items-center justify-center">
               <div className="px-6 py-3 bg-cyan-950/40 border border-cyan-500/50 text-cyan-400 text-sm font-black animate-pulse tracking-widest">
                 PRESS [{tutorialMessages[tutorialStep].key.replace('Key', '').replace('ShiftLeft', 'SHIFT').replace('Space', 'SPACE')}] TO CONTINUE
               </div>
            </div>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full max-h-[100vh] aspect-video shadow-[0_0_250px_rgba(0,0,0,1)]" />
    </div>
  );
};

export default GameView;
