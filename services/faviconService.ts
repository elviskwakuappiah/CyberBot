// Service to manage dynamic robotic favicons for the CyberBot app
import { safeStorage } from './safeStorage';

export interface FaviconOption {
  id: string;
  name: string;
  codename: string;
  color: string;
  svg: string;
}

export const FAVICONS: FaviconOption[] = [
  {
    id: 'gemini_infinity',
    name: 'CyberBot Infinity',
    codename: 'INFINITY_CORE_V1',
    color: '#00f3ff',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <defs>
    <!-- Background Gradient -->
    <linearGradient id='bg_grad' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#060913' />
      <stop offset='100%' stop-color='#03050a' />
    </linearGradient>
    <!-- Silver Metallic Gradient for robot and infinity casing -->
    <linearGradient id='silver_metallic' x1='0%' y1='0%' x2='0%' y2='100%'>
      <stop offset='0%' stop-color='#ffffff' />
      <stop offset='30%' stop-color='#e2e8f0' />
      <stop offset='70%' stop-color='#94a3b8' />
      <stop offset='100%' stop-color='#475569' />
    </linearGradient>
    <!-- Deep Blue-Gray for loop structure backing -->
    <linearGradient id='loop_back' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#475569' />
      <stop offset='100%' stop-color='#1e293b' />
    </linearGradient>
    <!-- Glow filter -->
    <filter id='glow' x='-30%' y='-30%' width='160%' height='160%'>
      <feGaussianBlur stdDeviation='3' result='blur' />
      <feMerge>
        <feMergeNode in='blur' />
        <feMergeNode in='SourceGraphic' />
      </feMerge>
    </filter>
    <!-- Subtle Visor Glow -->
    <filter id='visor_glow' x='-20%' y='-20%' width='140%' height='140%'>
      <feGaussianBlur stdDeviation='1.5' result='blur' />
      <feMerge>
        <feMergeNode in='blur' />
        <feMergeNode in='SourceGraphic' />
      </feMerge>
    </filter>
  </defs>

  <!-- Sleek rounded dark container -->
  <rect x='2' y='2' width='96' height='96' rx='20' fill='url(#bg_grad)' stroke='#111827' stroke-width='2'/>

  <!-- Background circuit paths -->
  <path d='M65,12 H82 V29' stroke='#1e293b' stroke-width='1.5' fill='none' opacity='0.3'/>
  <path d='M82,20 L88,26' stroke='#1e293b' stroke-width='1.5' fill='none' opacity='0.3'/>
  <path d='M15,70 V85 H30' stroke='#1e293b' stroke-width='1.5' fill='none' opacity='0.3'/>

  <!-- INFINITY TRACK -->
  <!-- 1. Thick Neon Cyan Under-Glow -->
  <path d='M 51,55 C 63,33 84,33 84,55 C 84,77 63,77 51,55 C 39,33 18,33 18,55 C 18,77 39,77 51,55 Z' 
        fill='none' stroke='#00f3ff' stroke-width='12' filter='url(#glow)' opacity='0.6'/>

  <!-- 2. Thick Dark Loop Border -->
  <path d='M 51,55 C 63,33 84,33 84,55 C 84,77 63,77 51,55 C 39,33 18,33 18,55 C 18,77 39,77 51,55 Z' 
        fill='none' stroke='url(#loop_back)' stroke-width='9' stroke-linejoin='round'/>

  <!-- 3. Thick Silver Metallic Track Base -->
  <path d='M 51,55 C 63,33 84,33 84,55 C 84,77 63,77 51,55 C 39,33 18,33 18,55 C 18,77 39,77 51,55 Z' 
        fill='none' stroke='url(#silver_metallic)' stroke-width='6' stroke-linejoin='round'/>

  <!-- 4. Glowing Neon Cyan Center Line -->
  <path d='M 51,55 C 63,33 84,33 84,55 C 84,77 63,77 51,55 C 39,33 18,33 18,55 C 18,77 39,77 51,55 Z' 
        fill='none' stroke='#00f3ff' stroke-width='1.8' filter='url(#glow)' stroke-linecap='round'/>
  <path d='M 51,55 C 63,33 84,33 84,55 C 84,77 63,77 51,55 C 39,33 18,33 18,55 C 18,77 39,77 51,55 Z' 
        fill='none' stroke='#ffffff' stroke-width='0.6' stroke-linecap='round'/>

  <!-- ROBOT UNIT -->
  <!-- Robot Ear Caps (Backing) -->
  <rect x='15.5' y='33' width='3.5' height='7' rx='1.5' fill='url(#silver_metallic)' stroke='#111827' stroke-width='0.5'/>
  <rect x='41' y='33' width='3.5' height='7' rx='1.5' fill='url(#silver_metallic)' stroke='#111827' stroke-width='0.5'/>

  <!-- Main Head Dome (Centered over Left Loop Center area) -->
  <ellipse cx='30' cy='36.5' rx='13.5' ry='10.5' fill='url(#silver_metallic)' stroke='#0f172a' stroke-width='0.5'/>
  <ellipse cx='30' cy='35.5' rx='12' ry='9' fill='#ffffff' opacity='0.25'/>

  <!-- Face Shield/Visor Plate (Deep Dark Plate) -->
  <rect x='20.5' y='31.5' width='19' height='9.5' rx='4.75' fill='#04060c' stroke='url(#silver_metallic)' stroke-width='1.5'/>
  <rect x='21.5' y='32.5' width='17' height='7.5' rx='3.75' fill='#020408' stroke='#00f3ff' stroke-width='0.8' filter='url(#visor_glow)'/>

  <!-- Glowing Cyan Eyes -->
  <circle cx='26' cy='36.2' r='2.2' fill='#00f3ff' filter='url(#glow)'/>
  <circle cx='26' cy='36.2' r='1.1' fill='#ffffff'/>
  
  <circle cx='34' cy='36.2' r='2.2' fill='#00f3ff' filter='url(#glow)'/>
  <circle cx='34' cy='36.2' r='1.1' fill='#ffffff'/>
</svg>`
  },
  {
    id: 'gemini_cyber',
    name: 'Gemini Cyber',
    codename: 'GEMINI_CORE_X1',
    color: '#00f3ff',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <defs>
    <!-- Background Gradient -->
    <linearGradient id='bg_grad' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#0a0f1d' />
      <stop offset='100%' stop-color='#070a14' />
    </linearGradient>
    <!-- Main Cyber Blue Gradient -->
    <linearGradient id='cyber_blue' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#00f3ff' />
      <stop offset='100%' stop-color='#3b82f6' />
    </linearGradient>
    <!-- Secondary Purple Gradient for depth -->
    <linearGradient id='neon_purple' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='#3b82f6' />
      <stop offset='100%' stop-color='#7c3aed' />
    </linearGradient>
    <filter id='glow' x='-20%' y='-20%' width='140%' height='140%'>
      <feGaussianBlur stdDeviation='2' result='blur' />
      <feMerge>
        <feMergeNode in='blur' />
        <feMergeNode in='SourceGraphic' />
      </feMerge>
    </filter>
  </defs>
  
  <!-- Sleek rounded dark container -->
  <rect x='2' y='2' width='96' height='96' rx='20' fill='url(#bg_grad)' stroke='#1e293b' stroke-width='2'/>
  
  <!-- Subtle Circuit Traces in Background -->
  <path d='M75,15 H85 V25' stroke='#1e293b' stroke-width='1.5' fill='none' opacity='0.4'/>
  <path d='M85,20 L90,25' stroke='#1e293b' stroke-width='1.5' fill='none' opacity='0.4'/>
  <path d='M15,75 V85 H25' stroke='#1e293b' stroke-width='1.5' fill='none' opacity='0.4'/>
  
  <!-- Outer glowing hexagon frame (glowing C-shape) -->
  <path d='M 72,25 L 42,25 L 20,50 L 42,75 L 72,75 L 65,68 L 45,68 L 28,50 L 45,32 L 65,32 Z' 
        fill='url(#neon_purple)' filter='url(#glow)' opacity='0.6'/>
  <path d='M 72,25 L 42,25 L 20,50 L 42,75 L 72,75 L 65,68 L 45,68 L 28,50 L 45,32 L 65,32 Z' 
        fill='url(#cyber_blue)' stroke='#00f3ff' stroke-width='0.5'/>
        
  <!-- Robot Head Profile -->
  <!-- Neck/collar -->
  <path d='M 42,57 L 48,63 L 52,63 L 47,55 Z' fill='url(#cyber_blue)' opacity='0.85'/>
  
  <!-- Main Helmet Dome -->
  <path d='M 48,35 A 13,13 0 0,0 41,52 L 53,52 L 57,48 L 54,39 Z' fill='url(#cyber_blue)'/>
  
  <!-- Visor (Extremely bright cyan glow) -->
  <polygon points='52,42 63,44 61,49 51,47' fill='#ffffff' filter='url(#glow)'/>
  <polygon points='52,42 63,44 61,49 51,47' fill='#00f3ff'/>
  
  <!-- Ear Cup -->
  <circle cx='45' cy='48' r='5' fill='#0a0f1d' stroke='url(#cyber_blue)' stroke-width='2'/>
  <circle cx='45' cy='48' r='1.5' fill='#00f3ff'/>
</svg>`
  },
  {
    id: 'nexus_observer',
    name: 'Nexus Observer',
    codename: 'CYAN_OBSERVER_V5',
    color: '#00f3ff',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <!-- Outer Tech Hex Hexagon Plate -->
  <polygon points='50,15 85,32 85,68 50,85 15,68 15,32' fill='#050505' stroke='#00f3ff' stroke-width='6' stroke-linejoin='round'/>
  <!-- Glowing Eye Orbit -->
  <circle cx='50' cy='50' r='18' fill='#00f3ff' fill-opacity='0.15' stroke='#00f3ff' stroke-width='3'/>
  <!-- Inner Optical Lens -->
  <circle cx='50' cy='50' r='8' fill='#00f3ff'/>
  <circle cx='46' cy='46' r='3' fill='white' opacity='0.9'/>
  <!-- Left/Right Sensor Slits -->
  <line x1='28' y1='40' x2='28' y2='60' stroke='#00f3ff' stroke-width='4' stroke-linecap='round'/>
  <line x1='72' y1='40' x2='72' y2='60' stroke='#00f3ff' stroke-width='4' stroke-linecap='round'/>
  <!-- Status Lights -->
  <circle cx='50' cy='28' r='3' fill='#00f3ff' opacity='0.8'/>
</svg>`
  },
  {
    id: 'emerald_overlord',
    name: 'Emerald Overlord',
    codename: 'EMERALD_WARLORD_V9',
    color: '#10b981',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <!-- Sleek Angular Crown Helmet -->
  <path d='M50,10 L85,25 L80,65 L50,90 L20,65 L15,25 Z' fill='#050505' stroke='#10b981' stroke-width='6' stroke-linejoin='round'/>
  <!-- Glowing Hexagonal Core / Visor -->
  <polygon points='50,28 72,40 72,60 50,72 28,60 28,40' fill='#10b981' fill-opacity='0.15' stroke='#10b981' stroke-width='3' stroke-linejoin='round'/>
  <!-- Tri-Ocular Laser Sensors -->
  <circle cx='50' cy='50' r='6' fill='#10b981'/>
  <circle cx='38' cy='44' r='4' fill='#10b981'/>
  <circle cx='62' cy='44' r='4' fill='#10b981'/>
  <!-- Electronic Circuit Traces -->
  <path d='M50,15 V22' stroke='#10b981' stroke-width='3' stroke-linecap='round'/>
  <path d='M30,73 L42,80' stroke='#10b981' stroke-width='3' stroke-linecap='round'/>
  <path d='M70,73 L58,80' stroke='#10b981' stroke-width='3' stroke-linecap='round'/>
</svg>`
  },
  {
    id: 'gold_sentinel',
    name: 'Gold Sentinel',
    codename: 'GOLDEN_DEFENDER_77',
    color: '#fbbf24',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <!-- Heavy Crown Shield Base -->
  <path d='M20,20 L50,10 L80,20 L85,60 L50,85 L15,60 Z' fill='#050505' stroke='#fbbf24' stroke-width='6' stroke-linejoin='round'/>
  <!-- Cybernetic Visor -->
  <rect x='30' y='35' width='40' height='12' rx='4' fill='#fbbf24' fill-opacity='0.2'/>
  <!-- Scanning Visor Line -->
  <line x1='35' y1='41' x2='65' y2='41' stroke='#fbbf24' stroke-width='4' stroke-linecap='round'/>
  <!-- Auxiliary Power Lines -->
  <line x1='35' y1='58' x2='45' y2='68' stroke='#fbbf24' stroke-width='3' stroke-linecap='round'/>
  <line x1='65' y1='58' x2='55' y2='68' stroke='#fbbf24' stroke-width='3' stroke-linecap='round'/>
  <!-- Golden Core -->
  <circle cx='50' cy='70' r='5' fill='#fbbf24'/>
</svg>`
  },
  {
    id: 'void_shadow',
    name: 'Void Shadow',
    codename: 'PURPLE_ASSASSIN_09',
    color: '#a855f7',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <!-- Stealth Fighter Triangular Plate -->
  <polygon points='50,15 85,55 70,82 50,70 30,82 15,55' fill='#050505' stroke='#a855f7' stroke-width='6' stroke-linejoin='round'/>
  <!-- Dual Violet Ocular Slots -->
  <polygon points='32,44 46,47 44,52 30,49' fill='#a855f7'/>
  <polygon points='68,44 54,47 56,52 70,49' fill='#a855f7'/>
  <!-- Quantum Vent Ports -->
  <line x1='40' y1='62' x2='60' y2='62' stroke='#a855f7' stroke-width='3' stroke-linecap='round'/>
  <line x1='45' y1='68' x2='55' y2='68' stroke='#a855f7' stroke-width='3' stroke-linecap='round'/>
</svg>`
  },
  {
    id: 'phoenix_core',
    name: 'Phoenix Core',
    codename: 'CRIMSON_WARMASTER_X',
    color: '#ef4444',
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>
  <!-- Heavy Fortified Helmet -->
  <rect x='18' y='28' width='64' height='58' rx='16' fill='#050505' stroke='#ef4444' stroke-width='6'/>
  <!-- Pulsating Heavy Visor -->
  <rect x='28' y='40' width='44' height='16' rx='6' fill='#ef4444' fill-opacity='0.25' stroke='#ef4444' stroke-width='2'/>
  <circle cx='38' cy='48' r='4' fill='#ef4444'/>
  <circle cx='62' cy='48' r='4' fill='#ef4444'/>
  <!-- Top Mounted Antennas -->
  <path d='M35,28 V12' stroke='#ef4444' stroke-width='4' stroke-linecap='round'/>
  <path d='M65,28 V12' stroke='#ef4444' stroke-width='4' stroke-linecap='round'/>
  <circle cx='35' cy='10' r='3' fill='#ef4444'/>
  <circle cx='65' cy='10' r='3' fill='#ef4444'/>
</svg>`
  }
];

export const applyFavicon = (svgContent: string) => {
  if (typeof window === 'undefined') return;
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  // Convert standard SVG string to data URI correctly
  const urlEncoded = svgContent.trim()
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
    .replace(/\s+/g, ' ');
  
  link.href = `data:image/svg+xml,${urlEncoded}`;
};

export const saveAndApplyFavicon = (id: string) => {
  const chosen = FAVICONS.find(f => f.id === id);
  if (chosen) {
    safeStorage.setItem('cyberbot_favicon_id', id);
    applyFavicon(chosen.svg);
  }
};

export const loadSavedFavicon = () => {
  if (typeof window === 'undefined') return;
  const savedId = safeStorage.getItem('cyberbot_favicon_id');
  if (savedId) {
    const chosen = FAVICONS.find(f => f.id === savedId);
    if (chosen) {
      applyFavicon(chosen.svg);
    }
  } else {
    // Apply standard default as fallback
    const defaultFav = FAVICONS[0];
    if (defaultFav) {
      applyFavicon(defaultFav.svg);
    }
  }
};
