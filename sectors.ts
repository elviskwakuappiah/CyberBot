import { Sector, SectorTheme } from './types';

export const SECTORS: Sector[] = Array.from({ length: 30 }, (_, i) => {
  const id = i + 1;
  const difficulty = 1 + (id * 0.15);
  
  // Assign themes based on progression
  const themes = [
    SectorTheme.CYBER_CITY,
    SectorTheme.INDUSTRIAL,
    SectorTheme.WASTELAND,
    SectorTheme.NEON_DISTRICT,
    SectorTheme.ORBITAL_STATION,
    SectorTheme.DATA_CORE,
  ];
  const theme = themes[Math.floor((id - 1) / 5)] || themes[themes.length - 1];

  // Define enemy pools based on progression
  const enemies = [];
  
  // Basic Seekers (always present)
  enemies.push({
    type: 'seeker',
    count: 3 + Math.floor(id / 4),
    healthMult: difficulty,
    damageMult: difficulty,
    speedMult: 1 + (id * 0.02)
  });

  // Tanks introduced at sector 5
  if (id >= 5) {
    enemies.push({
      type: 'tank',
      count: 1 + Math.floor(id / 8),
      healthMult: difficulty * 1.5,
      damageMult: difficulty * 1.2,
      speedMult: 0.8 + (id * 0.01)
    });
  }

  // Drones introduced at sector 8
  if (id >= 8) {
    enemies.push({
      type: 'drone',
      count: 1 + Math.floor(id / 10),
      healthMult: difficulty * 0.7,
      damageMult: difficulty * 0.8,
      speedMult: 1.2 + (id * 0.03)
    });
  }

  // Kamikaze Drones introduced at sector 12
  if (id >= 12) {
    enemies.push({
      type: 'kamikaze_drone',
      count: 1 + Math.floor(id / 15),
      healthMult: difficulty * 0.5,
      damageMult: difficulty * 2.0,
      speedMult: 1.5 + (id * 0.04)
    });
  }

  // Shield Sentinels introduced at sector 15
  if (id >= 15) {
    enemies.push({
      type: 'shield_sentinel',
      count: 1 + Math.floor(id / 18),
      healthMult: difficulty * 2.5,
      damageMult: difficulty * 1.0,
      speedMult: 0.7 + (id * 0.01)
    });
  }

  // Bosses
  let boss;
  let bossHealth;
  if (id === 5) { boss = 'scout_commander'; bossHealth = 1500; }
  if (id === 10) { boss = 'fortress_tank'; bossHealth = 4000; }
  if (id === 15) { boss = 'swarm_queen'; bossHealth = 8000; }
  if (id === 20) { boss = 'plasma_sentinel'; bossHealth = 12000; }
  if (id === 25) { boss = 'fortress_tank'; bossHealth = 25000; }
  if (id === 30) { boss = 'omega_annihilator'; bossHealth = 60000; }

  return {
    id,
    name: `Sector ${id}`,
    description: `Neutralize all rogue hardware in Sector ${id}.`,
    enemies,
    boss,
    bossHealth,
    reward: id % 10 === 0 ? 15000 : 300 + (id * 100),
    theme
  };
});
