import { ExcelRowStats, Shot, ShotZone, ZoneEfficiency } from '../types/basketball';

export function parseMinutesToSeconds(minStr: string): number {
  if (!minStr) return 0;
  const parts = minStr.trim().split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseInt(parts[1], 10) || 0;
    return mins * 60 + secs;
  }
  const mins = parseFloat(minStr) || 0;
  return Math.round(mins * 60);
}

export function formatSecondsToMinutes(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates all derived percentages and advanced basketball metrics for an Excel row
 */
export function calculateRowMetrics(row: Partial<ExcelRowStats>): ExcelRowStats {
  const id = row.id || `row_${Date.now()}_${Math.random()}`;
  const playerName = row.playerName || '';
  const min = row.min || '00:00';
  const minSeconds = parseMinutesToSeconds(min);

  const tc = Number(row.tc) || 0;
  const ti = Number(row.ti) || 0;
  const tiPct = ti > 0 ? Number(((tc / ti) * 100).toFixed(2)) : 0;

  const c3p = Number(row.c3p) || 0;
  const i3p = Number(row.i3p) || 0;
  const pct3p = i3p > 0 ? Number(((c3p / i3p) * 100).toFixed(2)) : 0;

  const fga = ti + i3p;
  const ar3p = fga > 0 ? Number(((i3p / fga) * 100).toFixed(1)) : 0;

  const tlc = Number(row.tlc) || 0;
  const tli = Number(row.tli) || 0;
  const tlPct = tli > 0 ? Number(((tlc / tli) * 100).toFixed(2)) : 0;

  const ftr = fga > 0 ? Number(((tli / fga) * 100).toFixed(2)) : 0;

  // eFG%: (TC + 1.5 * 3PC) / (TI + 3PI) * 100
  const efgPct = fga > 0 ? Number((((tc + 1.5 * c3p) / fga) * 100).toFixed(2)) : 0;

  // Points: 2P*2 + 3P*3 + TL
  const pt = tc * 2 + c3p * 3 + tlc;

  // TS%: Pt / (2 * (FGA + 0.44 * TLI)) * 100
  const tsDenom = 2 * (fga + 0.44 * tli);
  const tsPct = tsDenom > 0 ? Number(((pt / tsDenom) * 100).toFixed(2)) : 0;

  const per = Number(row.per) || 0;
  // ToV%: PER / (FGA + 0.44 * TLI + PER) * 100
  const tovDenom = fga + 0.44 * tli + per;
  const tovPct = tovDenom > 0 ? Number(((per / tovDenom) * 100).toFixed(2)) : 0;

  const rd = Number(row.rd) || 0;
  const ro = Number(row.ro) || 0;
  const rt = rd + ro;

  const as = Number(row.as) || 0;
  const rec = Number(row.rec) || 0;
  const tap = Number(row.tap) || 0;
  const fpc = Number(row.fpc) || 0;
  const fpr = Number(row.fpr) || 0;

  // FIBA valuation formula:
  // (Pt + RT + AS + REC + Tap + FPR) - ((TI - TC) + (3PI - 3PC) + (TLI - TLC) + PER + FPC)
  const missed2p = Math.max(0, ti - tc);
  const missed3p = Math.max(0, i3p - c3p);
  const missedFt = Math.max(0, tli - tlc);
  const defaultValuation = (pt + rt + as + rec + tap + fpr) - (missed2p + missed3p + missedFt + per + fpc);
  const ptsTot = row.ptsTot !== undefined ? Number(row.ptsTot) : defaultValuation;

  return {
    id,
    playerNumber: row.playerNumber !== undefined ? Number(row.playerNumber) : undefined,
    playerName,
    playerPosition: row.playerPosition,
    min,
    minSeconds,
    tc,
    ti,
    tiPct,
    c3p,
    i3p,
    pct3p,
    ar3p,
    tlc,
    tli,
    tlPct,
    ftr,
    efgPct,
    tsPct,
    tovPct,
    rd,
    ro,
    rt,
    as,
    rec,
    per,
    tap,
    fpc,
    fpr,
    pt,
    ptsTot
  };
}

/**
 * Calculates sum totals and team-wide aggregated percentages for rows
 */
export function calculateTeamRowTotals(rows: ExcelRowStats[]): ExcelRowStats {
  const totals = rows.reduce(
    (acc, r) => {
      acc.minSeconds += r.minSeconds || 0;
      acc.tc += r.tc;
      acc.ti += r.ti;
      acc.c3p += r.c3p;
      acc.i3p += r.i3p;
      acc.tlc += r.tlc;
      acc.tli += r.tli;
      acc.rd += r.rd;
      acc.ro += r.ro;
      acc.rt += r.rt;
      acc.as += r.as;
      acc.rec += r.rec;
      acc.per += r.per;
      acc.tap += r.tap;
      acc.fpc += r.fpc;
      acc.fpr += r.fpr;
      acc.pt += r.pt;
      acc.ptsTot += r.ptsTot;
      return acc;
    },
    {
      minSeconds: 0,
      tc: 0,
      ti: 0,
      c3p: 0,
      i3p: 0,
      tlc: 0,
      tli: 0,
      rd: 0,
      ro: 0,
      rt: 0,
      as: 0,
      rec: 0,
      per: 0,
      tap: 0,
      fpc: 0,
      fpr: 0,
      pt: 0,
      ptsTot: 0
    }
  );

  const fga = totals.ti + totals.i3p;
  const tiPct = totals.ti > 0 ? Number(((totals.tc / totals.ti) * 100).toFixed(2)) : 0;
  const pct3p = totals.i3p > 0 ? Number(((totals.c3p / totals.i3p) * 100).toFixed(2)) : 0;
  const tlPct = totals.tli > 0 ? Number(((totals.tlc / totals.tli) * 100).toFixed(2)) : 0;
  const ar3p = fga > 0 ? Number(((totals.i3p / fga) * 100).toFixed(1)) : 0;
  const ftr = fga > 0 ? Number(((totals.tli / fga) * 100).toFixed(2)) : 0;
  const efgPct = fga > 0 ? Number((((totals.tc + 1.5 * totals.c3p) / fga) * 100).toFixed(2)) : 0;
  const tsDenom = 2 * (fga + 0.44 * totals.tli);
  const tsPct = tsDenom > 0 ? Number(((totals.pt / tsDenom) * 100).toFixed(2)) : 0;
  const tovDenom = fga + 0.44 * totals.tli + totals.per;
  const tovPct = tovDenom > 0 ? Number(((totals.per / tovDenom) * 100).toFixed(2)) : 0;

  return {
    id: 'team_totals',
    playerName: 'TOTALES',
    min: formatSecondsToMinutes(totals.minSeconds),
    minSeconds: totals.minSeconds,
    tc: totals.tc,
    ti: totals.ti,
    tiPct,
    c3p: totals.c3p,
    i3p: totals.i3p,
    pct3p,
    ar3p,
    tlc: totals.tlc,
    tli: totals.tli,
    tlPct,
    ftr,
    efgPct,
    tsPct,
    tovPct,
    rd: totals.rd,
    ro: totals.ro,
    rt: totals.rt,
    as: totals.as,
    rec: totals.rec,
    per: totals.per,
    tap: totals.tap,
    fpc: totals.fpc,
    fpr: totals.fpr,
    pt: totals.pt,
    ptsTot: totals.ptsTot
  };
}

export interface FourFactors {
  eFGPct: number;
  tovPct: number;
  orbPct: number;
  ftRate: number;
  oppEFGPct: number;
  oppTovPct: number;
  drbPct: number;
  oppFtRate: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
}

export function calculateFourFactors(
  teamTotals: ExcelRowStats,
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
  }
): FourFactors {
  const opp = opponentStats || {
    pts: Math.max(0, teamTotals.pt - 8),
    tc: Math.round(teamTotals.tc * 0.9),
    ti: Math.round(teamTotals.ti * 0.95),
    c3p: Math.round(teamTotals.c3p * 0.8),
    i3p: Math.round(teamTotals.i3p * 0.9),
    tlc: Math.round(teamTotals.tlc * 0.85),
    tli: Math.round(teamTotals.tli * 0.9),
    rd: Math.round(teamTotals.rd * 0.85),
    ro: Math.round(teamTotals.ro * 0.9),
    as: Math.round(teamTotals.as * 0.8),
    rec: Math.round(teamTotals.rec * 0.9),
    per: Math.round(teamTotals.per * 1.1),
    tap: Math.round(teamTotals.tap * 0.8),
    fpc: Math.round(teamTotals.fpc * 1.0)
  };

  const fga = teamTotals.ti + teamTotals.i3p;
  const oppFga = opp.ti + opp.i3p;

  const eFGPct = fga > 0 ? Number((((teamTotals.tc + 1.5 * teamTotals.c3p) / fga) * 100).toFixed(1)) : 0;
  const oppEFGPct = oppFga > 0 ? Number((((opp.tc + 1.5 * opp.c3p) / oppFga) * 100).toFixed(1)) : 0;

  const tovDenom = fga + 0.44 * teamTotals.tli + teamTotals.per;
  const tovPct = tovDenom > 0 ? Number(((teamTotals.per / tovDenom) * 100).toFixed(1)) : 0;

  const oppTovDenom = oppFga + 0.44 * opp.tli + opp.per;
  const oppTovPct = oppTovDenom > 0 ? Number(((opp.per / oppTovDenom) * 100).toFixed(1)) : 0;

  const orbDenom = teamTotals.ro + opp.rd;
  const orbPct = orbDenom > 0 ? Number(((teamTotals.ro / orbDenom) * 100).toFixed(1)) : 0;

  const drbDenom = teamTotals.rd + opp.ro;
  const drbPct = drbDenom > 0 ? Number(((teamTotals.rd / drbDenom) * 100).toFixed(1)) : 0;

  const ftRate = fga > 0 ? Number(((teamTotals.tlc / fga) * 100).toFixed(1)) : 0;
  const oppFtRate = oppFga > 0 ? Number(((opp.tlc / oppFga) * 100).toFixed(1)) : 0;

  const possessions = 0.5 * (
    (fga + 0.4 * teamTotals.tli - 1.07 * (teamTotals.ro / (teamTotals.ro + opp.rd || 1)) * (fga - (teamTotals.tc + teamTotals.c3p)) + teamTotals.per) +
    (oppFga + 0.4 * opp.tli - 1.07 * (opp.ro / (opp.ro + teamTotals.rd || 1)) * (oppFga - (opp.tc + opp.c3p)) + opp.per)
  );

  const pace = possessions > 0 ? Number(possessions.toFixed(1)) : 72;
  const offensiveRating = possessions > 0 ? Number(((teamTotals.pt / possessions) * 100).toFixed(1)) : 100;
  const defensiveRating = possessions > 0 ? Number(((opp.pts / possessions) * 100).toFixed(1)) : 95;
  const netRating = Number((offensiveRating - defensiveRating).toFixed(1));

  return {
    eFGPct,
    tovPct,
    orbPct,
    ftRate,
    oppEFGPct,
    oppTovPct,
    drbPct,
    oppFtRate,
    pace,
    offensiveRating,
    defensiveRating,
    netRating
  };
}

export function calculateZoneEfficiency(shots: Shot[]): Record<ShotZone, ZoneEfficiency> {
  const zones: { zone: ShotZone; label: string; benchmark: number }[] = [
    { zone: 'restricted', label: 'Bajo el Aro', benchmark: 60.0 },
    { zone: 'paint', label: 'Pintura', benchmark: 42.0 },
    { zone: 'mid_left', label: 'Media Izq', benchmark: 39.0 },
    { zone: 'mid_center', label: 'Media Centro', benchmark: 40.0 },
    { zone: 'mid_right', label: 'Media Der', benchmark: 39.0 },
    { zone: 'corner3_left', label: 'Triple Esquina Izq', benchmark: 38.0 },
    { zone: 'corner3_right', label: 'Triple Esquina Der', benchmark: 38.0 },
    { zone: 'arc3_left', label: 'Triple 45° Izq', benchmark: 35.0 },
    { zone: 'arc3_center', label: 'Triple Frontal', benchmark: 35.0 },
    { zone: 'arc3_right', label: 'Triple 45° Der', benchmark: 35.0 }
  ];

  const result: Partial<Record<ShotZone, ZoneEfficiency>> = {};

  for (const z of zones) {
    const zoneShots = shots.filter(s => s.zone === z.zone);
    const attempted = zoneShots.length;
    const made = zoneShots.filter(s => s.made).length;
    const percentage = attempted > 0 ? Number(((made / attempted) * 100).toFixed(1)) : 0;
    const is3p = z.zone.includes('3');
    const ptsMultiplier = is3p ? 3 : 2;
    const points = made * ptsMultiplier;
    const pps = attempted > 0 ? Number((points / attempted).toFixed(2)) : 0;

    result[z.zone] = {
      zone: z.zone,
      label: z.label,
      made,
      attempted,
      percentage,
      points,
      pps,
      benchmarkPct: z.benchmark
    };
  }

  return result as Record<ShotZone, ZoneEfficiency>;
}
