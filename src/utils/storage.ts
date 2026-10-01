import { Game, ExcelRowStats, Shot, PlayerProfile } from '../types/basketball';
import { calculateRowMetrics } from './calculations';

const STORAGE_KEY = 'somisa_stats_data_v4';
const ROSTER_KEY = 'somisa_master_roster_v1';
const DARK_MODE_KEY = 'somisa_dark_mode';

export const DEFAULT_SOMISA_ROSTER: PlayerProfile[] = [
  { id: 'som_p1', name: 'PEDEMONTE, JUAN PABLO', number: 4, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p2', name: 'NEUGEBAUER, BENJAMIN', number: 5, position: 'Base', isCaptain: false, active: true },
  { id: 'som_p3', name: 'FERREYRA, EMANUEL LUIS', number: 6, position: 'Escolta', isCaptain: false, active: true },
  { id: 'som_p4', name: 'CALCATERRA, GENARO', number: 7, position: 'Ala-Pívot', isCaptain: false, active: true },
  { id: 'som_p5', name: 'AQUADRO, VICENTE', number: 8, position: 'Base', isCaptain: false, active: true },
  { id: 'som_p6', name: 'COGNIGNI, JUAN FRANCISCO', number: 9, position: 'Base', isCaptain: true, active: true },
  { id: 'som_p7', name: 'BROVARONE, FAUSTINO', number: 10, position: 'Escolta', isCaptain: false, active: true },
  { id: 'som_p8', name: 'GONZALEZ ROVEDA, LUCIO', number: 11, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p9', name: 'URANGA, SEBASTIAN', number: 12, position: 'Pívot', isCaptain: false, active: true },
  { id: 'som_p10', name: 'GARCIA, LAUTARO JULIAN', number: 13, position: 'Alero', isCaptain: false, active: true },
  { id: 'som_p11', name: 'ROMERO, GUILLERMO PABLO', number: 14, position: 'Ala-Pívot', isCaptain: false, active: true }
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
    { playerNumber: 4, playerName: 'PEDEMONTE, JUAN PABLO', playerPosition: 'Alero', min: '28:03', tc: 0, ti: 2, c3p: 3, i3p: 6, tlc: 0, tli: 2, rd: 2, ro: 2, as: 0, rec: 0, per: 0, tap: 0, fpc: 4, fpr: 5, ptsTot: 24 },
    { playerNumber: 5, playerName: 'NEUGEBAUER, BENJAMIN', playerPosition: 'Base', min: '02:55', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 1, rec: 0, per: 0, tap: 0, fpc: 1, fpr: 0, ptsTot: 0 },
    { playerNumber: 6, playerName: 'FERREYRA, EMANUEL LUIS', playerPosition: 'Escolta', min: '01:21', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 1, tap: 0, fpc: 0, fpr: 1, ptsTot: 0 },
    { playerNumber: 7, playerName: 'CALCATERRA, GENARO', playerPosition: 'Ala-Pívot', min: '33:41', tc: 6, ti: 6, c3p: 1, i3p: 3, tlc: 0, tli: 1, rd: 8, ro: 1, as: 4, rec: 3, per: 3, tap: 0, fpc: 3, fpr: 2, ptsTot: 22 },
    { playerNumber: 8, playerName: 'AQUADRO, VICENTE', playerPosition: 'Base', min: '00:00', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 2, fpr: 0, ptsTot: 0 },
    { playerNumber: 9, playerName: 'COGNIGNI, JUAN FRANCISCO', playerPosition: 'Base', min: '37:04', tc: 3, ti: 4, c3p: 3, i3p: 8, tlc: 0, tli: 0, rd: 6, ro: 0, as: 5, rec: 3, per: 4, tap: 1, fpc: 2, fpr: 2, ptsTot: 32 },
    { playerNumber: 10, playerName: 'BROVARONE, FAUSTINO', playerPosition: 'Escolta', min: '12:17', tc: 1, ti: 1, c3p: 2, i3p: 5, tlc: 0, tli: 0, rd: 1, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 2, fpr: 0, ptsTot: 17 },
    { playerNumber: 11, playerName: 'GONZALEZ ROVEDA, LUCIO', playerPosition: 'Alero', min: '21:06', tc: 6, ti: 8, c3p: 1, i3p: 5, tlc: 4, tli: 4, rd: 2, ro: 4, as: 0, rec: 1, per: 0, tap: 1, fpc: 3, fpr: 2, ptsTot: 35 },
    { playerNumber: 12, playerName: 'URANGA, SEBASTIAN', playerPosition: 'Pívot', min: '34:51', tc: 3, ti: 6, c3p: 0, i3p: 2, tlc: 3, tli: 6, rd: 7, ro: 2, as: 3, rec: 2, per: 4, tap: 2, fpc: 4, fpr: 4, ptsTot: 24 },
    { playerNumber: 13, playerName: 'GARCIA, LAUTARO JULIAN', playerPosition: 'Alero', min: '09:45', tc: 1, ti: 3, c3p: 0, i3p: 0, tlc: 1, tli: 2, rd: 1, ro: 1, as: 0, rec: 0, per: 1, tap: 0, fpc: 1, fpr: 1, ptsTot: 8 },
    { playerNumber: 14, playerName: 'ROMERO, GUILLERMO PABLO', playerPosition: 'Ala-Pívot', min: '18:51', tc: 2, ti: 5, c3p: 0, i3p: 0, tlc: 0, tli: 4, rd: 3, ro: 1, as: 1, rec: 1, per: 0, tap: 1, fpc: 4, fpr: 4, ptsTot: 14 }
  ];

  return rawData.map(r => calculateRowMetrics(r));
}

export function createSampleShots(gameId: string): Shot[] {
  return [
    { id: 's1', gameId, playerId: 'som_p1', playerNumber: 4, playerName: 'PEDEMONTE, JUAN PABLO', quarter: 1, x: 8, y: 15, made: true, shotType: '3pt', zone: 'corner3_left', timestamp: 1 },
    { id: 's2', gameId, playerId: 'som_p1', playerNumber: 4, playerName: 'PEDEMONTE, JUAN PABLO', quarter: 2, x: 50, y: 55, made: true, shotType: '3pt', zone: 'arc3_center', timestamp: 2 },
    { id: 's3', gameId, playerId: 'som_p1', playerNumber: 4, playerName: 'PEDEMONTE, JUAN PABLO', quarter: 4, x: 74, y: 48, made: true, shotType: '3pt', zone: 'arc3_right', timestamp: 3 },
    { id: 's4', gameId, playerId: 'som_p4', playerNumber: 7, playerName: 'CALCATERRA, GENARO', quarter: 1, x: 48, y: 8, made: true, shotType: '2pt', zone: 'restricted', timestamp: 4 },
    { id: 's5', gameId, playerId: 'som_p4', playerNumber: 7, playerName: 'CALCATERRA, GENARO', quarter: 2, x: 52, y: 7.5, made: true, shotType: '2pt', zone: 'restricted', timestamp: 5 },
    { id: 's6', gameId, playerId: 'som_p4', playerNumber: 7, playerName: 'CALCATERRA, GENARO', quarter: 3, x: 50, y: 22, made: true, shotType: '2pt', zone: 'paint', timestamp: 6 },
    { id: 's7', gameId, playerId: 'som_p4', playerNumber: 7, playerName: 'CALCATERRA, GENARO', quarter: 4, x: 92, y: 16, made: true, shotType: '3pt', zone: 'corner3_right', timestamp: 7 },
    { id: 's8', gameId, playerId: 'som_p6', playerNumber: 9, playerName: 'COGNIGNI, JUAN FRANCISCO', quarter: 1, x: 50, y: 52, made: true, shotType: '3pt', zone: 'arc3_center', timestamp: 8 },
    { id: 's9', gameId, playerId: 'som_p6', playerNumber: 9, playerName: 'COGNIGNI, JUAN FRANCISCO', quarter: 3, x: 28, y: 50, made: true, shotType: '3pt', zone: 'arc3_left', timestamp: 9 },
    { id: 's10', gameId, playerId: 'som_p6', playerNumber: 9, playerName: 'COGNIGNI, JUAN FRANCISCO', quarter: 4, x: 75, y: 49, made: true, shotType: '3pt', zone: 'arc3_right', timestamp: 10 },
    { id: 's11', gameId, playerId: 'som_p8', playerNumber: 11, playerName: 'GONZALEZ ROVEDA, LUCIO', quarter: 1, x: 49, y: 8, made: true, shotType: '2pt', zone: 'restricted', timestamp: 11 },
    { id: 's12', gameId, playerId: 'som_p8', playerNumber: 11, playerName: 'GONZALEZ ROVEDA, LUCIO', quarter: 2, x: 51, y: 7, made: true, shotType: '2pt', zone: 'restricted', timestamp: 12 },
    { id: 's13', gameId, playerId: 'som_p8', playerNumber: 11, playerName: 'GONZALEZ ROVEDA, LUCIO', quarter: 3, x: 53, y: 26, made: true, shotType: '2pt', zone: 'paint', timestamp: 13 },
    { id: 's14', gameId, playerId: 'som_p8', playerNumber: 11, playerName: 'GONZALEZ ROVEDA, LUCIO', quarter: 4, x: 93, y: 15, made: true, shotType: '3pt', zone: 'corner3_right', timestamp: 14 },
    { id: 's15', gameId, playerId: 'som_p9', playerNumber: 12, playerName: 'URANGA, SEBASTIAN', quarter: 2, x: 46, y: 9, made: true, shotType: '2pt', zone: 'restricted', timestamp: 15 },
    { id: 's16', gameId, playerId: 'som_p9', playerNumber: 12, playerName: 'URANGA, SEBASTIAN', quarter: 4, x: 50, y: 7.5, made: true, shotType: '2pt', zone: 'restricted', timestamp: 16 }
  ];
}

export function createInitialGames(): Game[] {
  const g1Id = 'somisa_match_1';
  const rows1 = getSampleGameRows();
  const game1: Game = {
    id: g1Id,
    title: 'Fecha 1: Club SOMISA vs Sportivo Federal',
    date: '2026-09-28',
    competition: 'Liga Federal de Básquet',
    season: '2026',
    homeAway: 'home',
    myTeamName: 'Club SOMISA',
    opponentName: 'Sportivo Federal',
    scoreMyTeam: 82,
    scoreOpponent: 76,
    notes: 'Victoria de Club SOMISA de San Nicolás con 82 puntos. Gran efectividad en dobles (22/35) y dominio en rebotes.',
    rows: rows1,
    opponentStats: {
      pts: 76,
      tc: 20,
      ti: 38,
      c3p: 7,
      i3p: 24,
      tlc: 15,
      tli: 21,
      rd: 24,
      ro: 10,
      as: 12,
      rec: 8,
      per: 15,
      tap: 3,
      fpc: 21
    },
    shots: createSampleShots(g1Id)
  };

  const g2Id = 'somisa_match_2';
  const rows2: ExcelRowStats[] = [
    { playerNumber: 4, playerName: 'PEDEMONTE, JUAN PABLO', playerPosition: 'Alero', min: '25:12', tc: 2, ti: 4, c3p: 2, i3p: 5, tlc: 2, tli: 2, rd: 3, ro: 1, as: 2, rec: 1, per: 1, tap: 0, fpc: 3, fpr: 3, ptsTot: 18 },
    { playerNumber: 5, playerName: 'NEUGEBAUER, BENJAMIN', playerPosition: 'Base', min: '05:40', tc: 1, ti: 2, c3p: 0, i3p: 1, tlc: 0, tli: 0, rd: 1, ro: 0, as: 2, rec: 0, per: 0, tap: 0, fpc: 2, fpr: 1, ptsTot: 5 },
    { playerNumber: 6, playerName: 'FERREYRA, EMANUEL LUIS', playerPosition: 'Escolta', min: '04:10', tc: 0, ti: 1, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 1, rec: 0, per: 0, tap: 0, fpc: 1, fpr: 0, ptsTot: 2 },
    { playerNumber: 7, playerName: 'CALCATERRA, GENARO', playerPosition: 'Ala-Pívot', min: '31:20', tc: 5, ti: 8, c3p: 0, i3p: 2, tlc: 3, tli: 4, rd: 7, ro: 3, as: 3, rec: 2, per: 2, tap: 1, fpc: 2, fpr: 4, ptsTot: 26 },
    { playerNumber: 8, playerName: 'AQUADRO, VICENTE', playerPosition: 'Base', min: '02:00', tc: 0, ti: 0, c3p: 0, i3p: 0, tlc: 0, tli: 0, rd: 0, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 1, fpr: 0, ptsTot: 0 },
    { playerNumber: 9, playerName: 'COGNIGNI, JUAN FRANCISCO', playerPosition: 'Base', min: '35:10', tc: 4, ti: 7, c3p: 2, i3p: 6, tlc: 4, tli: 4, rd: 5, ro: 1, as: 6, rec: 2, per: 3, tap: 0, fpc: 3, fpr: 5, ptsTot: 28 },
    { playerNumber: 10, playerName: 'BROVARONE, FAUSTINO', playerPosition: 'Escolta', min: '14:30', tc: 2, ti: 3, c3p: 1, i3p: 3, tlc: 0, tli: 0, rd: 2, ro: 0, as: 1, rec: 1, per: 1, tap: 0, fpc: 1, fpr: 1, ptsTot: 10 },
    { playerNumber: 11, playerName: 'GONZALEZ ROVEDA, LUCIO', playerPosition: 'Alero', min: '24:15', tc: 5, ti: 9, c3p: 2, i3p: 4, tlc: 2, tli: 3, rd: 4, ro: 2, as: 1, rec: 2, per: 1, tap: 1, fpc: 2, fpr: 3, ptsTot: 24 },
    { playerNumber: 12, playerName: 'URANGA, SEBASTIAN', playerPosition: 'Pívot', min: '32:00', tc: 4, ti: 7, c3p: 0, i3p: 1, tlc: 4, tli: 5, rd: 8, ro: 3, as: 2, rec: 1, per: 2, tap: 1, fpc: 4, fpr: 4, ptsTot: 22 },
    { playerNumber: 13, playerName: 'GARCIA, LAUTARO JULIAN', playerPosition: 'Alero', min: '08:20', tc: 0, ti: 1, c3p: 0, i3p: 0, tlc: 2, tli: 2, rd: 1, ro: 0, as: 0, rec: 0, per: 0, tap: 0, fpc: 2, fpr: 1, ptsTot: 4 },
    { playerNumber: 14, playerName: 'ROMERO, GUILLERMO PABLO', playerPosition: 'Ala-Pívot', min: '17:15', tc: 1, ti: 3, c3p: 0, i3p: 0, tlc: 1, tli: 2, rd: 2, ro: 1, as: 2, rec: 0, per: 1, tap: 0, fpc: 3, fpr: 2, ptsTot: 8 }
  ].map(r => calculateRowMetrics(r));

  const game2: Game = {
    id: g2Id,
    title: 'Fecha 2: Atlético Rosario vs Club SOMISA',
    date: '2026-09-21',
    competition: 'Liga Federal de Básquet',
    season: '2026',
    homeAway: 'away',
    myTeamName: 'Club SOMISA',
    opponentName: 'Atlético Rosario',
    scoreMyTeam: 77,
    scoreOpponent: 72,
    notes: 'Victoria de visitante de Club SOMISA en Rosario. Gran rendimiento de Cognigni y Uranga.',
    rows: rows2,
    opponentStats: {
      pts: 72,
      tc: 18,
      ti: 36,
      c3p: 8,
      i3p: 26,
      tlc: 12,
      tli: 18,
      rd: 22,
      ro: 9,
      as: 11,
      rec: 7,
      per: 14,
      tap: 2,
      fpc: 23
    },
    shots: createSampleShots(g2Id)
  };

  return [game1, game2];
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
    console.error('Failed to parse saved games:', err);
  }
  const initial = createInitialGames();
  saveGames(initial);
  return initial;
}

export function saveGames(games: Game[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
  } catch (err) {
    console.error('Failed to save games:', err);
  }
}

export function getDarkModePreference(): boolean {
  try {
    const item = localStorage.getItem(DARK_MODE_KEY);
    if (item !== null) {
      return item === 'true';
    }
  } catch (e) {
    // ignore
  }
  return false;
}

export function saveDarkModePreference(isDark: boolean): void {
  try {
    localStorage.setItem(DARK_MODE_KEY, String(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {
    // ignore
  }
}

/**
 * Downloads a complete JSON file containing all matches, stats, and player master roster.
 * Perfect for saving to GitHub or transferring between computers.
 */
export function downloadDatabaseJson(games: Game[], roster: PlayerProfile[]): void {
  const exportPayload = {
    appName: 'Club SOMISA - Estadísticas de Baloncesto',
    exportDate: new Date().toISOString(),
    team: 'Club SOMISA San Nicolás',
    roster,
    games,
    version: '4.0.0'
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `club_somisa_datos_baloncesto_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
