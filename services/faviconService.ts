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
