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

  // If user entered a manual ptsTot keep it, otherwise FIBA valuation:
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
 * Aggregates all row stats into team totals
 */
export function calculateTeamRowTotals(rows: ExcelRowStats[]): ExcelRowStats {
  const sum = rows.reduce(
    (acc, curr) => {
      acc.minSeconds += curr.minSeconds;
      acc.tc += curr.tc;
      acc.ti += curr.ti;
      acc.c3p += curr.c3p;
      acc.i3p += curr.i3p;
      acc.tlc += curr.tlc;
      acc.tli += curr.tli;
      acc.rd += curr.rd;
      acc.ro += curr.ro;
      acc.as += curr.as;
      acc.rec += curr.rec;
      acc.per += curr.per;
      acc.tap += curr.tap;
      acc.fpc += curr.fpc;
      acc.fpr += curr.fpr;
      acc.pt += curr.pt;
      acc.ptsTot += curr.ptsTot;
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

  const fga = sum.ti + sum.i3p;
  const tiPct = sum.ti > 0 ? Number(((sum.tc / sum.ti) * 100).toFixed(2)) : 0;
  const pct3p = sum.i3p > 0 ? Number(((sum.c3p / sum.i3p) * 100).toFixed(2)) : 0;
  const ar3p = fga > 0 ? Number(((sum.i3p / fga) * 100).toFixed(1)) : 0;
  const tlPct = sum.tli > 0 ? Number(((sum.tlc / sum.tli) * 100).toFixed(2)) : 0;
  const ftr = fga > 0 ? Number(((sum.tli / fga) * 100).toFixed(2)) : 0;
  const efgPct = fga > 0 ? Number((((sum.tc + 1.5 * sum.c3p) / fga) * 100).toFixed(2)) : 0;

  const tsDenom = 2 * (fga + 0.44 * sum.tli);
  const tsPct = tsDenom > 0 ? Number(((sum.pt / tsDenom) * 100).toFixed(2)) : 0;

  const tovDenom = fga + 0.44 * sum.tli + sum.per;
  const tovPct = tovDenom > 0 ? Number(((sum.per / tovDenom) * 100).toFixed(2)) : 0;

  return {
    id: 'totals',
    playerName: 'Totales',
    min: formatSecondsToMinutes(sum.minSeconds),
    minSeconds: sum.minSeconds,
    tc: sum.tc,
    ti: sum.ti,
    tiPct,
    c3p: sum.c3p,
    i3p: sum.i3p,
    pct3p,
    ar3p,
    tlc: sum.tlc,
    tli: sum.tli,
    tlPct,
    ftr,
    efgPct,
    tsPct,
    tovPct,
    rd: sum.rd,
    ro: sum.ro,
    rt: sum.rd + sum.ro,
    as: sum.as,
    rec: sum.rec,
    per: sum.per,
    tap: sum.tap,
    fpc: sum.fpc,
    fpr: sum.fpr,
    pt: sum.pt,
    ptsTot: sum.ptsTot
  };
}

/**
 * Shot Zone and Type calculation for court mapping
 */
export function getShotZoneAndType(x: number, y: number): { zone: ShotZone; shotType: '2pt' | '3pt' } {
  const hoopX = 50;
  const hoopY = 8.5;
  const dist = Math.sqrt(Math.pow(x - hoopX, 2) + Math.pow(y - hoopY, 2));

  if (y <= 28) {
    if (x <= 9) return { zone: 'corner3_left', shotType: '3pt' };
    if (x >= 91) return { zone: 'corner3_right', shotType: '3pt' };
  }

  const isThreePoint = dist >= 45 || (y <= 28 && (x <= 9 || x >= 91));

  if (isThreePoint) {
    if (x < 36) return { zone: 'arc3_left', shotType: '3pt' };
    if (x > 64) return { zone: 'arc3_right', shotType: '3pt' };
    return { zone: 'arc3_center', shotType: '3pt' };
  }

  if (dist <= 8.5) return { zone: 'restricted', shotType: '2pt' };
  if (x >= 34 && x <= 66 && y <= 38) return { zone: 'paint', shotType: '2pt' };
  if (x < 34) return { zone: 'mid_left', shotType: '2pt' };
  if (x > 66) return { zone: 'mid_right', shotType: '2pt' };
  return { zone: 'mid_center', shotType: '2pt' };
}

export const ZONE_METADATA: Record<ShotZone, { label: string; shortLabel: string; benchmarkPct: number; is3pt: boolean }> = {
  restricted: { label: 'Zona Restringida (Aro)', shortLabel: 'Restringida', benchmarkPct: 62.0, is3pt: false },
  paint: { label: 'Pintura', shortLabel: 'Pintura', benchmarkPct: 41.0, is3pt: false },
  mid_left: { label: 'Media Izquierda', shortLabel: 'Media Izq', benchmarkPct: 39.0, is3pt: false },
  mid_center: { label: 'Media Centro', shortLabel: 'Media Centro', benchmarkPct: 40.5, is3pt: false },
  mid_right: { label: 'Media Derecha', shortLabel: 'Media Der', benchmarkPct: 39.0, is3pt: false },
  corner3_left: { label: 'Triple Esquina Izquierda', shortLabel: 'Esq. Izq 3P', benchmarkPct: 38.0, is3pt: true },
  corner3_right: { label: 'Triple Esquina Derecha', shortLabel: 'Esq. Der 3P', benchmarkPct: 38.0, is3pt: true },
  arc3_left: { label: 'Triple 45° Izquierda', shortLabel: '45° Izq 3P', benchmarkPct: 35.5, is3pt: true },
  arc3_center: { label: 'Triple Frontal', shortLabel: 'Frontal 3P', benchmarkPct: 35.0, is3pt: true },
  arc3_right: { label: 'Triple 45° Derecha', shortLabel: '45° Der 3P', benchmarkPct: 35.5, is3pt: true },
};

export function calculateZoneEfficiency(shots: Shot[]): ZoneEfficiency[] {
  const zones: ShotZone[] = [
    'restricted',
    'paint',
    'mid_left',
    'mid_center',
    'mid_right',
    'corner3_left',
    'arc3_left',
    'arc3_center',
    'arc3_right',
    'corner3_right'
  ];

  return zones.map(zone => {
    const meta = ZONE_METADATA[zone];
    const zoneShots = shots.filter(s => s.zone === zone);
    const attempted = zoneShots.length;
    const made = zoneShots.filter(s => s.made).length;
    const percentage = attempted > 0 ? (made / attempted) * 100 : 0;
    const points = made * (meta.is3pt ? 3 : 2);
    const pps = attempted > 0 ? points / attempted : 0;

    return {
      zone,
      label: meta.label,
      made,
      attempted,
      percentage: Number(percentage.toFixed(1)),
      points,
      pps: Number(pps.toFixed(2)),
      benchmarkPct: meta.benchmarkPct
    };
  });
}
