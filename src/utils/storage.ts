import { Game, ExcelRowStats, Shot, PlayerProfile } from '../types/basketball';
import { calculateRowMetrics } from './calculations';

const STORAGE_KEY = 'somisa_stats_data_v4';
const ROSTER_KEY = 'somisa_master_roster_v1';
const DARK_MODE_KEY = 'somisa_dark_mode';

export const DEFAULT_SOMISA_ROSTER: PlayerProfile[] = [
  { id: 'som_p1', name: 'PAEZ, FELIPE', number: 1, position: 'Base', isCaptain: false, active: true },
  { id: 'som_p2', name: 'PEDEMONTE, JUAN PABLO', number: 2, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p3', name: 'ZACCHERINI ROMERO, FABRICIO MATIAS', number: 4, position: 'Escolta', isCaptain: false, active: true },
  { id: 'som_p4', name: 'GONZALEZ ROVEDA, LUCIO', number: 5, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p5', name: 'DIAZ, JAIME', number: 7, position: 'Escolta', isCaptain: false, active: true },
  { id: 'som_p6', name: 'BUALO, AGUSTIN', number: 8, position: 'Base', isCaptain: false, active: true },
  { id: 'som_p7', name: 'BROVARONE, FAUSTINO', number: 9, position: 'Escolta', isCaptain: false, active: true },
  { id: 'som_p8', name: 'VITANGELI, SANTINO', number: 10, position: 'Base', isCaptain: false, active: true },
  { id: 'som_p9', name: 'RATTERO, RAMIRO', number: 11, position: 'Ala-Pívot', isCaptain: false, active: true },
  { id: 'som_p10', name: 'URANGA, SEBASTIAN', number: 12, position: 'Pívot', isCaptain: true, active: true },
  { id: 'som_p11', name: 'MASCAZZINI, ALEJO BENJAMIN', number: 20, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p12', name: 'ANDOLLO, SEBASTIAN', number: 33, position: 'Pívot', isCaptain: false, active: true }
];

export function loadMasterRoster(): PlayerProfile[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load master roster:', err);
  }
  saveMasterRoster(DEFAULT_SOMISA_ROSTER);
  return DEFAULT_SOMISA_ROSTER;
}

export function saveMasterRoster(roster: PlayerProfile[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  } catch (err) {
    console.error('Failed to save master roster:', err);
  }
}

export function getSampleGameRows(): ExcelRowStats[] {
  const rawData: Partial<ExcelRowStats>[] = [
    { playerNumber: 1, playerName: 'PAEZ, FELIPE', playerPosition: 'Base', min: '00:00', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 0, fpr: 0, ptsTot: 0 },
    { playerNumber: 2, playerName: 'PEDEMONTE, JUAN PABLO', playerPosition: 'Alero', min: '34:20', tc: 4, ti: 4, c3p: 5, i3p: 9, tlc: 2, tli: 2, rd: 3, ro: 0, as: 0, rec: 0, per: 2, tap: 0, fpc: 2, fpr: 2, ptsTot: 21 },
    { playerNumber: 4, playerName: 'ZACCHERINI ROMERO, FABRICIO MATIAS', playerPosition: 'Escolta', min: '06:34', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 1, ro: 1, as: 0, rec: 0, per: 2, tap: 0, fpc: 2, fpr: 0, ptsTot: -2 },
    { playerNumber: 5, playerName: 'GONZALEZ ROVEDA, LUCIO', playerPosition: 'Alero', min: '36:13', tc: 6, ti: 9, c3p: 2, i3p: 4, tlc: 2, tli: 2, rd: 7, ro: 0, as: 5, rec: 3, per: 0, tap: 0, fpc: 3, fpr: 4, ptsTot: 30 },
    { playerNumber: 7, playerName: 'DIAZ, JAIME', playerPosition: 'Escolta', min: '00:00', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 0, fpr: 0, ptsTot: 0 },
    { playerNumber: 8, playerName: 'BUALO, AGUSTIN', playerPosition: 'Base', min: '31:03', tc: 2, ti: 3, c3p: 3, i3p: 10, tlc: 1, tli: 2, rd: 6, ro: 0, as: 3, rec: 0, per: 3, tap: 0, fpc: 1, fpr: 3, ptsTot: 13 },
    { playerNumber: 9, playerName: 'BROVARONE, FAUSTINO', playerPosition: 'Escolta', min: '17:02', tc: 0, ti: 1, c3p: 1, i3p: 4, tlc: 0, tli: 0, rd: 0, ro: 1, as: 3, rec: 1, per: 1, tap: 0, fpc: 1, fpr: 0, ptsTot: 2 },
    { playerNumber: 10, playerName: 'VITANGELI, SANTINO', playerPosition: 'Base', min: '00:00', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 0, fpr: 0, ptsTot: 0 },
    { playerNumber: 11, playerName: 'RATTERO, RAMIRO', playerPosition: 'Ala-Pívot', min: '19:50', tc: 1, ti: 3, c3p: 1, i3p: 3, tlc: 2, tli: 2, rd: 4, ro: 0, as: 1, rec: 0, per: 1, tap: 0, fpc: 5, fpr: 2, ptsTot: 4 },
    { playerNumber: 12, playerName: 'URANGA, SEBASTIAN', playerPosition: 'Pívot', min: '27:40', tc: 0, ti: 1, c3p: 0, i3p: 3, tlc: 2, tli: 2, rd: 3, ro: 1, as: 2, rec: 1, per: 2, tap: 0, fpc: 3, fpr: 4, ptsTot: 4 },
    { playerNumber: 20, playerName: 'MASCAZZINI, ALEJO BENJAMIN', playerPosition: 'Alero', min: '00:07', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 0, fpr: 0, ptsTot: 0 },
    { playerNumber: 33, playerName: 'ANDOLLO, SEBASTIAN', playerPosition: 'Pívot', min: '27:06', tc: 5, ti: 6, c3p: 0, i3p: 0, tlc: 2, tli: 4, rd: 8, ro: 1, as: 3, rec: 2, per: 4, tap: 0, fpc: 2, fpr: 3, ptsTot: 20 }
  ];

  return rawData.map(d => calculateRowMetrics(d));
}

export function getInitialGames(): Game[] {
  const sampleRows = getSampleGameRows();
  const sampleGame: Game = {
    id: 'game_somisa_gimnasia_2026',
    title: 'SOMISA (San Nicolas) vs GIMNASIA (Pergamino)',
    date: '2026-03-28',
    competition: 'LIGA PCIAL FBB (Masculino 2026) - CABB',
    season: '2026',
    homeAway: 'home',
    myTeamName: 'SOMISA (San Nicolas)',
    opponentName: 'GIMNASIA (Pergamino)',
    scoreMyTeam: 83,
    scoreOpponent: 75,
    notes: 'Partido oficial de Liga Provincial FBB. Gran efectividad en dobles (67%) y triples de Pedemonte.',
    rows: sampleRows,
    opponentStats: {
      pts: 75,
      tc: 19,
      ti: 38,
      c3p: 8,
      i3p: 26,
      tlc: 13,
      tli: 18,
      rd: 26,
      ro: 8,
      as: 14,
      rec: 5,
      per: 13,
      tap: 2,
      fpc: 18
    },
    shots: [
      { id: 's1', gameId: 'game_somisa_gimnasia_2026', playerId: 'som_p2', playerName: 'PEDEMONTE, JUAN PABLO', playerNumber: 2, quarter: 1, x: 25, y: 15, made: true, shotType: '2pt', zone: 'restricted', timestamp: Date.now() - 3600000 },
      { id: 's2', gameId: 'game_somisa_gimnasia_2026', playerId: 'som_p2', playerName: 'PEDEMONTE, JUAN PABLO', playerNumber: 2, quarter: 2, x: 10, y: 40, made: true, shotType: '3pt', zone: 'arc3_left', timestamp: Date.now() - 2600000 },
      { id: 's3', gameId: 'game_somisa_gimnasia_2026', playerId: 'som_p4', playerName: 'GONZALEZ ROVEDA, LUCIO', playerNumber: 5, quarter: 3, x: 26, y: 22, made: true, shotType: '2pt', zone: 'paint', timestamp: Date.now() - 1600000 },
      { id: 's4', gameId: 'game_somisa_gimnasia_2026', playerId: 'som_p12', playerName: 'ANDOLLO, SEBASTIAN', playerNumber: 33, quarter: 4, x: 24, y: 12, made: true, shotType: '2pt', zone: 'restricted', timestamp: Date.now() - 600000 }
    ]
  };

  return [sampleGame];
}

export function loadSavedGames(): Game[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load games from localStorage:', err);
  }
  const init = getInitialGames();
  saveGames(init);
  return init;
}

export function saveGames(games: Game[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    console.error('Failed to save games to localStorage:', err);
  }
}

export function getDarkModePreference(): boolean {
  try {
    const val = localStorage.getItem(DARK_MODE_KEY);
    if (val !== null) {
      return val === 'true';
    }
  } catch {
    // fallback
  }
  return true; // Dark mode default for elite sports UI
}

export function saveDarkModePreference(isDark: boolean): void {
  try {
    localStorage.setItem(DARK_MODE_KEY, String(isDark));
  } catch {
    // fallback
  }
}
