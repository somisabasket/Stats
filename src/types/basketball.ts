export type ShotType = '2pt' | '3pt' | 'ft';

export interface PlayerProfile {
  id: string;
  name: string;
  number: number;
  position: string;
  height?: string;
  isCaptain?: boolean;
  active?: boolean;
}

export type ShotZone = 
  | 'restricted'       // Zona restringida (bajo el aro)
  | 'paint'            // Pintura
  | 'mid_left'         // Media distancia izquierda
  | 'mid_center'       // Media distancia centro
  | 'mid_right'        // Media distancia derecha
  | 'corner3_left'     // Triple esquina izquierda
  | 'corner3_right'    // Triple esquina derecha
  | 'arc3_left'        // Triple 45° izquierda
  | 'arc3_center'      // Triple frontal
  | 'arc3_right';      // Triple 45° derecha

export interface ExcelRowStats {
  id: string;
  playerNumber?: number; // Dorsal / Número de Camiseta (#)
  playerName: string;
  playerPosition?: string; // Posición (Base, Escolta, Alero, Ala-Pívot, Pívot)
  min: string; // "28:03"
  minSeconds: number; // in seconds for aggregation
  
  // 2-Points (Tiros de Campo)
  tc: number; // Tiros de Campo Convertidos (2PC)
  ti: number; // Tiros de Campo Intentados (2PI)
  tiPct: number; // Ti% (TC / TI * 100)
  
  // 3-Points
  c3p: number; // 3PC (Triples Convertidos)
  i3p: number; // 3PI (Triples Intentados)
  pct3p: number; // 3P% (3PC / 3PI * 100)
  ar3p: number; // 3PAr (3-Point Attempt Rate = 3PI / (TI + 3PI) * 100)
  
  // Free Throws
  tlc: number; // TLC (Tiros Libres Convertidos)
  tli: number; // TLI (Tiros Libres Intentados)
  tlPct: number; // TL% (TLC / TLI * 100)
  
  // Advanced Factors
  ftr: number; // FTr (Free Throw Rate = TLI / (TI + 3PI) * 100)
  efgPct: number; // eFG% (Effective Field Goal % = (TC + 1.5 * 3PC) / (TI + 3PI) * 100)
  tsPct: number; // TS% (True Shooting % = Pt / (2 * (FGA + 0.44 * TLI)) * 100)
  tovPct: number; // ToV% (Turnover % = PER / (FGA + 0.44 * TLI + PER) * 100)
  
  // Rebounds
  rd: number; // Rebotes Defensivos
  ro: number; // Rebotes Ofensivos
  rt: number; // Rebotes Totales (RD + RO)
  
  // Playmaking & Defense
  as: number; // Asistencias
  rec: number; // Recuperos / Robos
  per: number; // Pérdidas
  tap: number; // Tapones
  
  // Fouls
  fpc: number; // Faltas Personales Cometidas
  fpr: number; // Faltas Personales Recibidas
  
  // Points
  pt: number; // Puntos Anotados (TC*2 + 3PC*3 + TLC)
  ptsTot: number; // Pts Tot / Valoración Total
}

export interface Shot {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  playerNumber?: number;
  quarter: number;
  x: number;
  y: number;
  made: boolean;
  shotType: ShotType;
  zone: ShotZone;
  timestamp: number;
}

export interface Game {
  id: string;
  title: string;
  date: string;
  competition: string;
  season: string;
  homeAway: 'home' | 'away';
  myTeamName: string;
  opponentName: string;
  scoreMyTeam: number;
  scoreOpponent: number;
  notes?: string;

  // The Post-Game Roster and Stats Grid (identical to Excel sheet)
  rows: ExcelRowStats[];
  
  // Opponent stats summary for defense calculation
  opponentStats?: {
    pts: number;
    tc: number;
    ti: number;
    c3p: number;
    i3p: number;
    tlc: number;
    tli: number;
    rd: number;
    ro: number;
    as: number;
    rec: number;
    per: number;
    tap: number;
    fpc: number;
  };

  shots: Shot[];
}

export interface ZoneEfficiency {
  zone: ShotZone;
  label: string;
  made: number;
  attempted: number;
  percentage: number;
  points: number;
  pps: number;
  benchmarkPct: number;
}
