import * as XLSX from 'xlsx';
import { ExcelRowStats, Game, PlayerProfile } from '../types/basketball';
import { calculateRowMetrics, calculateTeamRowTotals } from './calculations';

export interface ParsedExcelGame {
  matchTitle?: string;
  myTeamName: string;
  opponentName: string;
  date: string;
  competition: string;
  season: string;
  scoreMyTeam: number;
  scoreOpponent: number;
  rows: ExcelRowStats[];
  opponentRows?: ExcelRowStats[];
  opponentStats?: Game['opponentStats'];
  unmatchedPlayers?: { number?: number; name: string }[];
}

/**
 * Parses "A/I" cell format (e.g. "4/4", "6/9", "18/27", "0/0")
 */
export function parseAI(cellValue: any): { made: number; attempted: number } {
  if (cellValue === undefined || cellValue === null || cellValue === '') {
    return { made: 0, attempted: 0 };
  }

  const str = String(cellValue).trim();

  // If format is "4/4" or "6 / 9"
  if (str.includes('/')) {
    const parts = str.split('/');
    const made = parseInt(parts[0]?.trim(), 10) || 0;
    const attempted = parseInt(parts[1]?.trim(), 10) || 0;
    return { made, attempted };
  }

  // If format is "4-4"
  if (str.includes('-') && !str.startsWith('-')) {
    const parts = str.split('-');
    const made = parseInt(parts[0]?.trim(), 10) || 0;
    const attempted = parseInt(parts[1]?.trim(), 10) || 0;
    return { made, attempted };
  }

  // If it's a single number (e.g. only attempted or made)
  const num = parseFloat(str) || 0;
  return { made: num, attempted: num };
}

/**
 * Cleans numerical values from cells (e.g. "25", "100%", "34,20")
 */
export function cleanCellNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace('%', '').replace(',', '.').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Normalizes minutes string to "MM:SS"
 */
export function normalizeMinutes(val: any): string {
  if (!val) return '00:00';
  const str = String(val).trim();
  
  if (str.includes(':')) {
    const parts = str.split(':');
    const m = parts[0]?.padStart(2, '0') || '00';
    const s = parts[1]?.padStart(2, '0') || '00';
    return `${m}:${s}`;
  }

  // If numeric float (e.g. 34.33 minutes)
  const num = parseFloat(str);
  if (!isNaN(num)) {
    const mins = Math.floor(num);
    const secs = Math.round((num - mins) * 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return '00:00';
}

/**
 * Parses raw 2D grid of strings into SOMISA match statistics
 */
export function parseGridData(
  grid: (string | number | undefined)[][],
  masterRoster: PlayerProfile[] = []
): ParsedExcelGame {
  let matchTitle = '';
  let competition = 'LIGA PCIAL FBB (Masculino 2026) - CABB';
  let season = '2026';
  let myTeamName = 'SOMISA (San Nicolas)';
  let opponentName = 'Rival';
  let date = new Date().toISOString().split('T')[0];

  // 1. Scan top rows for Title and Team Names
  // e.g.: "Estadísticas - SOMISA (San Nicolas) vs GIMNASIA (Pergamino) - MM - LIGA PCIAL FBB (Masculino 2026) - CABB - 2026"
  for (let r = 0; r < Math.min(10, grid.length); r++) {
    const rowStr = grid[r].filter(Boolean).map(c => String(c).trim()).join(' ');
    
    if (rowStr.toLowerCase().includes(' vs ') || rowStr.toLowerCase().includes('estadísticas') || rowStr.toLowerCase().includes('estadisticas')) {
      matchTitle = rowStr;

      // Extract teams: "SOMISA (...) vs GIMNASIA (...)"
      const vsMatch = rowStr.match(/(.+?)\s+vs\s+(.+)/i);
      if (vsMatch) {
        let teamA = vsMatch[1].replace(/^.*?estad[íi]sticas\s*[-–—:\s]*/i, '').trim();
        let teamB = vsMatch[2].split(/[-–—]/)[0].trim();

        if (teamA.toUpperCase().includes('SOMISA')) {
          myTeamName = teamA;
          opponentName = teamB;
        } else if (teamB.toUpperCase().includes('SOMISA')) {
          myTeamName = teamB;
          opponentName = teamA;
        } else {
          myTeamName = teamA;
          opponentName = teamB;
        }
      }

      // Extract season / year
      const yearMatch = rowStr.match(/\b(202\d)\b/);
      if (yearMatch) {
        season = yearMatch[1];
      }

      // Extract tournament/competition
      if (rowStr.toUpperCase().includes('LIGA')) {
        const compMatch = rowStr.match(/LIGA[^-–—\n]+/i);
        if (compMatch) {
          competition = compMatch[0].trim();
        }
      }
      break;
    }
  }

  // 2. Identify sections
  // Look for SOMISA section, player rows, and Totals
  const somisaRows: ExcelRowStats[] = [];
  const opponentRows: ExcelRowStats[] = [];

  let currentTeamSection: 'somisa' | 'opponent' | 'unknown' = 'unknown';
  let isInsideStatsTable = false;

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    if (!row || row.length === 0) continue;

    const rowText = row.filter(Boolean).map(c => String(c).trim().toUpperCase()).join(' ');

    // Detect team header
    if (rowText.includes('SOMISA')) {
      currentTeamSection = 'somisa';
      isInsideStatsTable = false;
      continue;
    } else if (opponentName !== 'Rival' && rowText.includes(opponentName.toUpperCase())) {
      currentTeamSection = 'opponent';
      isInsideStatsTable = false;
      continue;
    } else if (currentTeamSection === 'somisa' && rowText.length > 3 && !rowText.includes('TOTALES') && !rowText.includes('NUM') && !rowText.includes('NOMBRE') && (rowText.includes('CLUB') || rowText.includes('ASOCIACION') || rowText.includes('BASKET') || rowText.includes('('))) {
      // Possible opponent team header following SOMISA table
      if (r > 15) {
        currentTeamSection = 'opponent';
        if (opponentName === 'Rival') {
          opponentName = String(row.find(c => Boolean(c)) || 'Rival').trim();
        }
        isInsideStatsTable = false;
        continue;
      }
    }

    // Detect table header row (e.g. Num, Nombre, MIN, PTS, TC 2P, etc.)
    const col0 = String(row[0] || '').trim().toUpperCase();
    const col1 = String(row[1] || '').trim().toUpperCase();
    const col2 = String(row[2] || '').trim().toUpperCase();

    if (col0.includes('NUM') || col1.includes('NOMBRE') || col2.includes('MIN') || rowText.includes('TC 2P') || rowText.includes('A/I')) {
      isInsideStatsTable = true;
      if (currentTeamSection === 'unknown') {
        currentTeamSection = 'somisa'; // Default first table to SOMISA
      }
      continue;
    }

    // Detect TOTALS row
    if (rowText.startsWith('TOTAL') || col0.includes('TOTAL') || col1.includes('TOTAL')) {
      isInsideStatsTable = false;
      continue;
    }

    // Check if this row is a player row:
    // Format in CABB/FBB:
    // [0] Num: 1, 2, 4, 5...
    // [1] Nombre: "PAEZ, FELIPE"
    // [2] MIN: "00:00"
    // [3] PTS: 0, 25...
    // [4] TC 2P A/I: "0/0", "4/4"
    // [5] TC 2P %: 0, 100
    // [6] TC 3P A/I: "0/0", "5/9"
    // [7] TC 3P %: 0, 56
    // [8] TL A/I: "0/0", "2/2"
    // [9] TL %: 0, 100
    // [10] Rebotes DEF: 3
    // [11] Rebotes OF: 0
    // [12] Rebotes Tot.: 3
    // [13] AST: 0
    // [14] REC: 0
    // [15] PER: 2
    // [16] TAP TC: 0
    // [17] TAP TR: 1
    // [18] FAL FC: 2
    // [19] FAL FR: 2
    // [20] VAL: 21
    // [21] +/-: 0

    const playerNumVal = cleanCellNumber(row[0]);
    const playerNameVal = String(row[1] || '').trim();
    const minVal = normalizeMinutes(row[2]);

    // Validate that it looks like a real player row (has a name with letters and either a jersey number or minutes)
    const hasValidName = playerNameVal.length >= 3 && /[A-Za-z]/.test(playerNameVal);
    const hasPlayerNum = !isNaN(playerNumVal) && playerNumVal >= 0 && playerNumVal <= 99;
    const hasStatsNumbers = row.slice(3, 10).some(c => c !== undefined && c !== '' && !isNaN(cleanCellNumber(c)));

    if (hasValidName && (hasPlayerNum || hasStatsNumbers || String(row[2]).includes(':'))) {
      // 2P (Dobles)
      const p2 = parseAI(row[4]);
      // 3P (Triples)
      const p3 = parseAI(row[6]);
      // TL (Libres)
      const ft = parseAI(row[8]);

      // Rebounds
      const defReb = cleanCellNumber(row[10]);
      const offReb = cleanCellNumber(row[11]);

      // Playmaking & Defense
      const ast = cleanCellNumber(row[13]);
      const rec = cleanCellNumber(row[14]);
      const per = cleanCellNumber(row[15]);
      const tap = cleanCellNumber(row[16]); // TC: Tapones cometidos / a favor

      // Fouls
      const fc = cleanCellNumber(row[18]); // Faltas cometidas
      const fpr = cleanCellNumber(row[19]); // Faltas recibidas

      // Points & Valuation
      const manualPts = cleanCellNumber(row[3]);
      const manualVal = cleanCellNumber(row[20]);

      // Match player with master roster to get their preferred position
      const matchedProfile = masterRoster.find(
        p => p.number === playerNumVal || p.name.toUpperCase() === playerNameVal.toUpperCase()
      );

      const parsedRow = calculateRowMetrics({
        id: `row_${currentTeamSection}_${playerNumVal}_${Date.now()}_${Math.random()}`,
        playerNumber: playerNumVal,
        playerName: playerNameVal,
        playerPosition: matchedProfile?.position || 'Alero',
        min: minVal,
        tc: p2.made,
        ti: p2.attempted,
        c3p: p3.made,
        i3p: p3.attempted,
        tlc: ft.made,
        tli: ft.attempted,
        rd: defReb,
        ro: offReb,
        as: ast,
        rec: rec,
        per: per,
        tap: tap,
        fpc: fc,
        fpr: fpr,
        pt: manualPts,
        ptsTot: manualVal
      });

      if (currentTeamSection === 'opponent') {
        opponentRows.push(parsedRow);
      } else {
        somisaRows.push(parsedRow);
      }
    }
  }

  // Calculate totals
  const myTotals = calculateTeamRowTotals(somisaRows);
  const oppTotals = calculateTeamRowTotals(opponentRows);

  const opponentStats: Game['opponentStats'] = opponentRows.length > 0 ? {
    pts: oppTotals.pt,
    tc: oppTotals.tc,
    ti: oppTotals.ti,
    c3p: oppTotals.c3p,
    i3p: oppTotals.i3p,
    tlc: oppTotals.tlc,
    tli: oppTotals.tli,
    rd: oppTotals.rd,
    ro: oppTotals.ro,
    as: oppTotals.as,
    rec: oppTotals.rec,
    per: oppTotals.per,
    tap: oppTotals.tap,
    fpc: oppTotals.fpc
  } : undefined;

  return {
    matchTitle,
    myTeamName,
    opponentName,
    date,
    competition,
    season,
    scoreMyTeam: myTotals.pt,
    scoreOpponent: oppTotals.pt || 0,
    rows: somisaRows,
    opponentRows,
    opponentStats
  };
}

/**
 * Reads and parses an uploaded Excel file (.xlsx, .xls, .csv)
 */
export async function parseExcelFile(
  file: File,
  masterRoster: PlayerProfile[] = []
): Promise<ParsedExcelGame> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: false,
    raw: false // raw: false returns formatted text so "4/4" and "00:00" remain exact strings!
  });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert sheet to 2D array of string/values
  const grid: (string | number | undefined)[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false
  });

  return parseGridData(grid, masterRoster);
}

/**
 * Parses tab-separated text copied directly from Excel (Ctrl + C)
 */
export function parseExcelClipboardText(
  clipboardText: string,
  masterRoster: PlayerProfile[] = []
): ParsedExcelGame {
  const lines = clipboardText.trim().split(/\r?\n/);
  const grid: string[][] = lines.map(line => {
    if (line.includes('\t')) {
      return line.split('\t');
    }
    return line.split(/[;,]/);
  });

  return parseGridData(grid, masterRoster);
}
