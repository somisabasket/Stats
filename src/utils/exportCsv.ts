import * as XLSX from 'xlsx';
import { Game } from '../types/basketball';
import { calculateTeamRowTotals, calculateFourFactors } from './calculations';

interface AggregatedPlayerStats {
  number?: number;
  name: string;
  position?: string;
  gamesPlayed: number;
  totalPoints: number;
  avgPoints: number;
  totalRebounds: number;
  avgRebounds: number;
  totalAssists: number;
  avgAssists: number;
  totalValuation: number;
  avgValuation: number;
  tc: number;
  ti: number;
  pct2p: number;
  c3p: number;
  i3p: number;
  pct3p: number;
  tlc: number;
  tli: number;
  pctFt: number;
  rd: number;
  ro: number;
  rec: number;
  per: number;
  tap: number;
  fpc: number;
  fpr: number;
}

export function computeAggregatedPlayers(games: Game[]): AggregatedPlayerStats[] {
  const map = new Map<string, AggregatedPlayerStats>();

  games.forEach(g => {
    g.rows.forEach(r => {
      const key = r.playerName.trim().toUpperCase();
      if (!key || key === 'TOTALES') return;

      const existing = map.get(key) || {
        number: r.playerNumber,
        name: r.playerName,
        position: r.playerPosition || 'Alero',
        gamesPlayed: 0,
        totalPoints: 0,
        avgPoints: 0,
        totalRebounds: 0,
        avgRebounds: 0,
        totalAssists: 0,
        avgAssists: 0,
        totalValuation: 0,
        avgValuation: 0,
        tc: 0,
        ti: 0,
        pct2p: 0,
        c3p: 0,
        i3p: 0,
        pct3p: 0,
        tlc: 0,
        tli: 0,
        pctFt: 0,
        rd: 0,
        ro: 0,
        rec: 0,
        per: 0,
        tap: 0,
        fpc: 0,
        fpr: 0
      };

      existing.gamesPlayed += 1;
      existing.totalPoints += r.pt;
      existing.totalRebounds += r.rt;
      existing.totalAssists += r.as;
      existing.totalValuation += r.ptsTot;
      existing.tc += r.tc;
      existing.ti += r.ti;
      existing.c3p += r.c3p;
      existing.i3p += r.i3p;
      existing.tlc += r.tlc;
      existing.tli += r.tli;
      existing.rd += r.rd;
      existing.ro += r.ro;
      existing.rec += r.rec;
      existing.per += r.per;
      existing.tap += r.tap;
      existing.fpc += r.fpc;
      existing.fpr += r.fpr;

      if (r.playerNumber !== undefined) {
        existing.number = r.playerNumber;
      }
      if (r.playerPosition) {
        existing.position = r.playerPosition;
      }

      map.set(key, existing);
    });
  });

  return Array.from(map.values()).map(p => ({
    ...p,
    avgPoints: Number((p.totalPoints / (p.gamesPlayed || 1)).toFixed(1)),
    avgRebounds: Number((p.totalRebounds / (p.gamesPlayed || 1)).toFixed(1)),
    avgAssists: Number((p.totalAssists / (p.gamesPlayed || 1)).toFixed(1)),
    avgValuation: Number((p.totalValuation / (p.gamesPlayed || 1)).toFixed(1)),
    pct2p: p.ti > 0 ? Number(((p.tc / p.ti) * 100).toFixed(1)) : 0,
    pct3p: p.i3p > 0 ? Number(((p.c3p / p.i3p) * 100).toFixed(1)) : 0,
    pctFt: p.tli > 0 ? Number(((p.tlc / p.tli) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.avgPoints - a.avgPoints);
}

/**
 * Exports complete multi-sheet Excel (.xlsx) file containing:
 * Sheet 1: Planilla del Partido (Box Score)
 * Sheet 2: Resumen del Equipo (Four Factors, Possessions, Ratings)
 * Sheet 3: Resumen Individual (Player season averages & totals)
 */
export function exportComprehensiveExcel(game: Game, allGames: Game[] = [game]): void {
  const wb = XLSX.utils.book_new();

  // ---------------- SHEET 1: PLANILLA DEL PARTIDO ----------------
  const teamTotals = calculateTeamRowTotals(game.rows);
  const sheet1Data: (string | number)[][] = [
    ['CLUB SOMISA - REPORTE OFICIAL DE PARTIDO'],
    [`Encuentro: ${game.myTeamName} vs ${game.opponentName}`],
    [`Fecha: ${game.date} | Torneo: ${game.competition} | Temporada: ${game.season}`],
    [`Resultado: ${game.myTeamName} ${game.scoreMyTeam} - ${game.scoreOpponent} ${game.opponentName}`],
    [],
    [
      '#',
      'Jugador',
      'Posición',
      'MIN',
      '2P Conv',
      '2P Int',
      '2P %',
      '3P Conv',
      '3P Int',
      '3P %',
      '3PAr',
      'TL Conv',
      'TL Int',
      'TL %',
      'FTr',
      'eFG %',
      'TS %',
      'ToV %',
      'Reb Def',
      'Reb Of',
      'Reb Tot',
      'AST',
      'REC',
      'PER',
      'TAP',
      'Faltas Com',
      'Faltas Rec',
      'PTS',
      'VAL'
    ]
  ];

  game.rows.forEach(r => {
    sheet1Data.push([
      r.playerNumber ?? '',
      r.playerName,
      r.playerPosition || '',
      r.min,
      r.tc,
      r.ti,
      r.tiPct,
      r.c3p,
      r.i3p,
      r.pct3p,
      r.ar3p,
      r.tlc,
      r.tli,
      r.tlPct,
      r.ftr,
      r.efgPct,
      r.tsPct,
      r.tovPct,
      r.rd,
      r.ro,
      r.rt,
      r.as,
      r.rec,
      r.per,
      r.tap,
      r.fpc,
      r.fpr,
      r.pt,
      r.ptsTot
    ]);
  });

  // Totals Row
  sheet1Data.push([
    '∑',
    'TOTALES SOMISA',
    '',
    teamTotals.min,
    teamTotals.tc,
    teamTotals.ti,
    teamTotals.tiPct,
    teamTotals.c3p,
    teamTotals.i3p,
    teamTotals.pct3p,
    teamTotals.ar3p,
    teamTotals.tlc,
    teamTotals.tli,
    teamTotals.tlPct,
    teamTotals.ftr,
    teamTotals.efgPct,
    teamTotals.tsPct,
    teamTotals.tovPct,
    teamTotals.rd,
    teamTotals.ro,
    teamTotals.rt,
    teamTotals.as,
    teamTotals.rec,
    teamTotals.per,
    teamTotals.tap,
    teamTotals.fpc,
    teamTotals.fpr,
    teamTotals.pt,
    teamTotals.ptsTot
  ]);

  if (game.opponentStats) {
    const opp = game.opponentStats;
    sheet1Data.push([
      '∑',
      `TOTALES ${game.opponentName}`,
      '',
      teamTotals.min,
      opp.tc,
      opp.ti,
      opp.ti > 0 ? Number(((opp.tc / opp.ti) * 100).toFixed(1)) : 0,
      opp.c3p,
      opp.i3p,
      opp.i3p > 0 ? Number(((opp.c3p / opp.i3p) * 100).toFixed(1)) : 0,
      '',
      opp.tlc,
      opp.tli,
      opp.tli > 0 ? Number(((opp.tlc / opp.tli) * 100).toFixed(1)) : 0,
      '',
      '',
      '',
      '',
      opp.rd,
      opp.ro,
      opp.rd + opp.ro,
      opp.as,
      opp.rec,
      opp.per,
      opp.tap,
      opp.fpc,
      '',
      opp.pts,
      ''
    ]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Planilla de Partido');

  // ---------------- SHEET 2: RESUMEN DEL EQUIPO & 4 FACTORES ----------------
  const factors = calculateFourFactors(teamTotals, game.opponentStats);
  const seasonAdv = computeAggregatedTeamTotals(allGames);
  const singlePoss = (teamTotals.ti + teamTotals.i3p) + 0.44 * teamTotals.tli - teamTotals.ro + teamTotals.per || 1;
  const oppFgaSingle = game.opponentStats ? game.opponentStats.ti + game.opponentStats.i3p : 0;
  const oppPossSingle = game.opponentStats
    ? (oppFgaSingle + 0.44 * game.opponentStats.tli - game.opponentStats.ro + game.opponentStats.per || singlePoss)
    : singlePoss;
  const singlePpp = Number((game.scoreMyTeam / singlePoss).toFixed(2));
  const singleOppPpp = Number((game.scoreOpponent / oppPossSingle).toFixed(2));
  const singleAstTo = teamTotals.per > 0 ? Number((teamTotals.as / teamTotals.per).toFixed(2)) : teamTotals.as;
  const singleFgm = teamTotals.tc + teamTotals.c3p;
  const singleAstPct = singleFgm > 0 ? Number(((teamTotals.as / singleFgm) * 100).toFixed(1)) : 0;

  const sheet2Data: (string | number)[][] = [
    ['CLUB SOMISA - RESUMEN COLECTIVO, EFICIENCIA AVANZADA Y 4 FACTORES DE DEAN OLIVER'],
    [`Partido: ${game.myTeamName} vs ${game.opponentName} (${game.date}) | Torneo: ${game.competition}`],
    [],
    ['MÉTRICAS DE EFICIENCIA AVANZADA (PARTIDO)', 'SOMISA', 'RIVAL', 'DIFERENCIA / EVALUACIÓN'],
    ['Resultado Final (Puntos)', game.scoreMyTeam, game.scoreOpponent, game.scoreMyTeam - game.scoreOpponent],
    ['Posesiones Estimadas (Pace / 40 min)', factors.pace, factors.pace, `~${(2400 / (factors.pace || 1) / 2).toFixed(1)} seg/posesión`],
    ['Offensive Rating (ORtg - Pts/100 pos)', factors.offensiveRating, factors.defensiveRating, `${factors.netRating > 0 ? '+' : ''}${factors.netRating} Net Rating`],
    ['Defensive Rating (DRtg - Pts recibidos/100 pos)', factors.defensiveRating, factors.offensiveRating, factors.defensiveRating <= 98 ? 'Defensa Sólida' : 'Estándar'],
    ['Net Rating (Diferencial Neto)', factors.netRating, -factors.netRating, factors.netRating >= 0 ? 'Favorable (+)' : 'Desfavorable (-)'],
    ['Puntos Por Posesión (PPP)', singlePpp, singleOppPpp, `${(singlePpp - singleOppPpp).toFixed(2)} dif PPP`],
    ['True Shooting % (TS% - Tiro Real)', `${teamTotals.tsPct}%`, '', 'Efectividad global c/ triples y libres'],
    ['Relación Asistencias / Pérdidas (AST/PER)', singleAstTo, '', `${teamTotals.as} AST / ${teamTotals.per} PER`],
    ['Canastas Asistidas (AST%)', `${singleAstPct}%`, '', '% de goles de campo asistidos'],
    [],
    ['LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER)', 'SOMISA', 'RIVAL', 'IMPACTO EN EL JUEGO'],
    ['1. Tiro Efectivo (eFG% - 40% peso)', `${factors.eFGPct}%`, `${factors.oppEFGPct}%`, factors.eFGPct >= factors.oppEFGPct ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['2. Cuidado de Balón (ToV% - 25% peso)', `${factors.tovPct}%`, `${factors.oppTovPct}%`, factors.tovPct <= factors.oppTovPct ? 'Ventaja SOMISA (Menos pérdidas)' : 'Ventaja Rival'],
    ['3. Rebote Ofensivo (ORB% - 20% peso)', `${factors.orbPct}%`, `${100 - factors.drbPct}%`, factors.orbPct >= (100 - factors.drbPct) ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['4. Frecuencia Tiros Libres (FTr - 15% peso)', `${factors.ftRate}%`, `${factors.oppFtRate}%`, factors.ftRate >= factors.oppFtRate ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    [],
    ['DESGLOSE DE PUNTOS ANOTADOS', 'PUNTOS', '% DEL TOTAL DE PUNTOS', 'TIROS CONVERTIDOS/INT'],
    ['Puntos en Tiros de 2 (Dobles)', teamTotals.tc * 2, teamTotals.pt > 0 ? `${((teamTotals.tc * 2 / teamTotals.pt) * 100).toFixed(1)}%` : '0%', `${teamTotals.tc}/${teamTotals.ti} (${teamTotals.tiPct}%)`],
    ['Puntos en Tiros de 3 (Triples)', teamTotals.c3p * 3, teamTotals.pt > 0 ? `${((teamTotals.c3p * 3 / teamTotals.pt) * 100).toFixed(1)}%` : '0%', `${teamTotals.c3p}/${teamTotals.i3p} (${teamTotals.pct3p}%)`],
    ['Puntos en Tiros Libres', teamTotals.tlc, teamTotals.pt > 0 ? `${((teamTotals.tlc / teamTotals.pt) * 100).toFixed(1)}%` : '0%', `${teamTotals.tlc}/${teamTotals.tli} (${teamTotals.tlPct}%)`],
    [],
    ['EFICIENCIA AVANZADA ACUMULADA (MUESTRA DE PARTIDOS)', 'VALOR GLOBAL', 'PROMEDIO / DETALLE', 'EVALUACIÓN'],
    ['Partidos Computados / Récord', `${allGames.length} PJ`, `${seasonAdv.wins}V - ${seasonAdv.losses}D (${seasonAdv.winPct}%)`, 'Balance general'],
    ['Offensive Rating Global (ORtg)', seasonAdv.offensiveRating, `${seasonAdv.pointsPerPossession} PPP`, seasonAdv.offensiveRating >= 105 ? 'Ataque Eficiente' : 'Estándar'],
    ['Defensive Rating Global (DRtg)', seasonAdv.defensiveRating, `${seasonAdv.oppPointsPerPossession} Opp PPP`, seasonAdv.defensiveRating <= 98 ? 'Defensa Sólida' : 'Estándar'],
    ['Net Rating Global (NetRtg)', seasonAdv.netRating, `Dif Pts: ${seasonAdv.pointDiff > 0 ? '+' : ''}${seasonAdv.pointDiff}`, seasonAdv.netRating >= 0 ? 'Positivo (+)' : 'Negativo (-)'],
    ['Pace Promedio (Posesiones / 40 min)', seasonAdv.pace, `~${(2400 / (seasonAdv.pace || 1) / 2).toFixed(1)}s por posesión`, 'Ritmo de juego'],
    ['True Shooting Global (TS%)', `${seasonAdv.trueShootingPct}%`, `eFG%: ${seasonAdv.eFGPct}%`, 'Eficiencia real de tiro'],
    ['Relación AST / PER Global', seasonAdv.assistToTurnoverRatio, `Canastas Asistidas: ${seasonAdv.assistedFGPct}%`, 'Control y circulación'],
    [],
    ['EVOLUCIÓN DE EFICIENCIA AVANZADA POR PARTIDO (MUESTRA)'],
    ['Fecha', 'Rival', 'Competencia', 'Condición', 'Resultado', 'Pace', 'ORtg (Ataque)', 'DRtg (Defensa)', 'Net Rating', 'eFG%', 'ToV%', 'TS%']
  ];

  allGames.forEach(g => {
    const rTot = calculateTeamRowTotals(g.rows);
    const f = calculateFourFactors(rTot, g.opponentStats);
    sheet2Data.push([
      g.date,
      g.opponentName,
      g.competition,
      g.homeAway === 'home' ? 'Local' : 'Visitante',
      `${g.scoreMyTeam} - ${g.scoreOpponent}`,
      f.pace,
      f.offensiveRating,
      f.defensiveRating,
      f.netRating > 0 ? `+${f.netRating}` : f.netRating,
      `${f.eFGPct}%`,
      `${f.tovPct}%`,
      `${rTot.tsPct}%`
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen y Eficiencia');

  // ---------------- SHEET 3: RESUMEN INDIVIDUAL (PLANTILLA) ----------------
  const aggPlayers = computeAggregatedPlayers(allGames);
  const sheet3Data: (string | number)[][] = [
    ['CLUB SOMISA - RESUMEN INDIVIDUAL Y PROMEDIOS ACUMULADOS'],
    [`Temporada ${game.season} | Total Partidos Computados: ${allGames.length}`],
    [],
    [
      '# Dorsal',
      'Jugador',
      'Posición',
      'Partidos (PJ)',
      'PTS / PJ',
      'REB / PJ',
      'AST / PJ',
      'VAL / PJ',
      '2P %',
      '3P %',
      'TL %',
      'Pts Totales',
      '2P Conv',
      '2P Int',
      '3P Conv',
      '3P Int',
      'TL Conv',
      'TL Int',
      'Reb Def',
      'Reb Of',
      'Reb Tot',
      'AST Tot',
      'REC Tot',
      'PER Tot',
      'TAP Tot',
      'FAL Com',
      'FAL Rec',
      'VAL Total'
    ]
  ];

  aggPlayers.forEach(p => {
    sheet3Data.push([
      p.number ?? '',
      p.name,
      p.position || '',
      p.gamesPlayed,
      p.avgPoints,
      p.avgRebounds,
      p.avgAssists,
      p.avgValuation,
      `${p.pct2p}%`,
      `${p.pct3p}%`,
      `${p.pctFt}%`,
      p.totalPoints,
      p.tc,
      p.ti,
      p.c3p,
      p.i3p,
      p.tlc,
      p.tli,
      p.rd,
      p.ro,
      p.totalRebounds,
      p.totalAssists,
      p.rec,
      p.per,
      p.tap,
      p.fpc,
      p.fpr,
      p.totalValuation
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Resumen Individual');

  // Download XLSX
  const filename = `SOMISA_Reporte_Completo_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exports complete multi-section CSV file containing all 3 sections
 */
export function exportGameToCsv(game: Game, allGames: Game[] = [game]): void {
  const teamTotals = calculateTeamRowTotals(game.rows);
  const factors = calculateFourFactors(teamTotals, game.opponentStats);
  const aggPlayers = computeAggregatedPlayers(allGames);

  const lines: string[] = [
    `"==========================================================="`,
    `"SECCIÓN 1: PLANILLA OFICIAL DE PARTIDO"`,
    `"PARTIDO: ${game.myTeamName} vs ${game.opponentName}"`,
    `"FECHA: ${game.date} | TORNEO: ${game.competition} | TEMPORADA: ${game.season}"`,
    `"RESULTADO: ${game.myTeamName} ${game.scoreMyTeam} - ${game.scoreOpponent} ${game.opponentName}"`,
    `"==========================================================="`,
    '',
    [
      '#',
      'Jugador',
      'Posición',
      'MIN',
      '2PC',
      '2PI',
      '2P%',
      '3PC',
      '3PI',
      '3P%',
      '3PAr',
      'TLC',
      'TLI',
      'TL%',
      'FTr',
      'eFG%',
      'TS%',
      'ToV%',
      'RD',
      'RO',
      'RT',
      'AS',
      'REC',
      'PER',
      'TAP',
      'FC',
      'FR',
      'PTS',
      'VAL'
    ].join(',')
  ];

  game.rows.forEach(r => {
    lines.push([
      r.playerNumber ?? '',
      `"${r.playerName}"`,
      `"${r.playerPosition || ''}"`,
      r.min,
      r.tc,
      r.ti,
      `${r.tiPct}%`,
      r.c3p,
      r.i3p,
      `${r.pct3p}%`,
      `${r.ar3p}%`,
      r.tlc,
      r.tli,
      `${r.tlPct}%`,
      `${r.ftr}%`,
      `${r.efgPct}%`,
      `${r.tsPct}%`,
      `${r.tovPct}%`,
      r.rd,
      r.ro,
      r.rt,
      r.as,
      r.rec,
      r.per,
      r.tap,
      r.fpc,
      r.fpr,
      r.pt,
      r.ptsTot
    ].join(','));
  });

  // Totales SOMISA
  lines.push([
    '∑',
    '"TOTALES SOMISA"',
    '""',
    teamTotals.min,
    teamTotals.tc,
    teamTotals.ti,
    `${teamTotals.tiPct}%`,
    teamTotals.c3p,
    teamTotals.i3p,
    `${teamTotals.pct3p}%`,
    `${teamTotals.ar3p}%`,
    teamTotals.tlc,
    teamTotals.tli,
    `${teamTotals.tlPct}%`,
    `${teamTotals.ftr}%`,
    `${teamTotals.efgPct}%`,
    `${teamTotals.tsPct}%`,
    `${teamTotals.tovPct}%`,
    teamTotals.rd,
    teamTotals.ro,
    teamTotals.rt,
    teamTotals.as,
    teamTotals.rec,
    teamTotals.per,
    teamTotals.tap,
    teamTotals.fpc,
    teamTotals.fpr,
    teamTotals.pt,
    teamTotals.ptsTot
  ].join(','));

  // SECCIÓN 2: RESUMEN DEL EQUIPO & EFICIENCIA AVANZADA
  const singlePossCsv = (teamTotals.ti + teamTotals.i3p) + 0.44 * teamTotals.tli - teamTotals.ro + teamTotals.per || 1;
  const oppFgaSingleCsv = game.opponentStats ? game.opponentStats.ti + game.opponentStats.i3p : 0;
  const oppPossSingleCsv = game.opponentStats
    ? (oppFgaSingleCsv + 0.44 * game.opponentStats.tli - game.opponentStats.ro + game.opponentStats.per || singlePossCsv)
    : singlePossCsv;
  const singlePppCsv = Number((game.scoreMyTeam / singlePossCsv).toFixed(2));
  const singleOppPppCsv = Number((game.scoreOpponent / oppPossSingleCsv).toFixed(2));
  const singleAstToCsv = teamTotals.per > 0 ? Number((teamTotals.as / teamTotals.per).toFixed(2)) : teamTotals.as;
  const singleFgmCsv = teamTotals.tc + teamTotals.c3p;
  const singleAstPctCsv = singleFgmCsv > 0 ? Number(((teamTotals.as / singleFgmCsv) * 100).toFixed(1)) : 0;

  const seasonAdvCsv = computeAggregatedTeamTotals(allGames);
  lines.push('');
  lines.push(`"==========================================================="`);
  lines.push(`"SECCIÓN 2: RESUMEN DEL EQUIPO, EFICIENCIA AVANZADA Y 4 FACTORES"`);
  lines.push(`"==========================================================="`);
  lines.push('Métrica,SOMISA,Rival,Diferencia/Impacto');
  lines.push(`Puntos Finales,${game.scoreMyTeam},${game.scoreOpponent},${game.scoreMyTeam - game.scoreOpponent}`);
  lines.push(`Posesiones Estimadas (Pace),${factors.pace},${factors.pace},Ritmo del juego (~${(2400 / (factors.pace || 1) / 2).toFixed(1)}s/pos)`);
  lines.push(`Offensive Rating (ORtg - Pts/100 pos),${factors.offensiveRating},${factors.defensiveRating},${factors.netRating} Net Rating`);
  lines.push(`Defensive Rating (DRtg - Pts recibidos/100 pos),${factors.defensiveRating},${factors.offensiveRating},""`);
  lines.push(`Puntos Por Posesión (PPP),${singlePppCsv},${singleOppPppCsv},${(singlePppCsv - singleOppPppCsv).toFixed(2)} dif PPP`);
  lines.push(`True Shooting % (TS%),${teamTotals.tsPct}%,"",Efectividad real c/ triples y libres`);
  lines.push(`Relación Asistencias / Pérdidas (AST/PER),${singleAstToCsv},"",${teamTotals.as} AST / ${teamTotals.per} PER`);
  lines.push(`Canastas Asistidas (AST%),${singleAstPctCsv}%,"",Circulación de balón`);
  lines.push(`1. Tiro Efectivo (eFG%),${factors.eFGPct}%,${factors.oppEFGPct}%,40% de importancia`);
  lines.push(`2. Cuidado de Balón (ToV%),${factors.tovPct}%,${factors.oppTovPct}%,25% de importancia`);
  lines.push(`3. Rebote Ofensivo (ORB%),${factors.orbPct}%,${100 - factors.drbPct}%,20% de importancia`);
  lines.push(`4. Frecuencia Tiros Libres (FTr),${factors.ftRate}%,${factors.oppFtRate}%,15% de importancia`);
  lines.push('');
  lines.push(`"EFICIENCIA AVANZADA ACUMULADA (${allGames.length} PARTIDOS)"`);
  lines.push('Métrica Global,Valor Acumulado,Detalle / Promedio');
  lines.push(`Balance Global,${seasonAdvCsv.wins}V - ${seasonAdvCsv.losses}D,${seasonAdvCsv.winPct}% victorias`);
  lines.push(`Offensive Rating Global (ORtg),${seasonAdvCsv.offensiveRating},${seasonAdvCsv.pointsPerPossession} PPP`);
  lines.push(`Defensive Rating Global (DRtg),${seasonAdvCsv.defensiveRating},${seasonAdvCsv.oppPointsPerPossession} Opp PPP`);
  lines.push(`Net Rating Global (NetRtg),${seasonAdvCsv.netRating},Dif Pts: ${seasonAdvCsv.pointDiff > 0 ? '+' : ''}${seasonAdvCsv.pointDiff}`);
  lines.push(`Pace Promedio (Posesiones / 40m),${seasonAdvCsv.pace},~${(2400 / (seasonAdvCsv.pace || 1) / 2).toFixed(1)}s/pos`);
  lines.push(`True Shooting Global (TS%),${seasonAdvCsv.trueShootingPct}%,eFG%: ${seasonAdvCsv.eFGPct}%`);
  lines.push(`Relación AST / PER Global,${seasonAdvCsv.assistToTurnoverRatio},AST%: ${seasonAdvCsv.assistedFGPct}%`);
  lines.push('');
  lines.push(`"EVOLUCIÓN DE EFICIENCIA AVANZADA POR PARTIDO"`);
  lines.push('Fecha,Rival,Competencia,Condición,Resultado,Pace,ORtg,DRtg,Net Rating,eFG%,ToV%,TS%');
  allGames.forEach(g => {
    const rTot = calculateTeamRowTotals(g.rows);
    const f = calculateFourFactors(rTot, g.opponentStats);
    lines.push([
      g.date,
      `"${g.opponentName}"`,
      `"${g.competition}"`,
      g.homeAway === 'home' ? 'Local' : 'Visitante',
      `"${g.scoreMyTeam} - ${g.scoreOpponent}"`,
      f.pace,
      f.offensiveRating,
      f.defensiveRating,
      f.netRating > 0 ? `+${f.netRating}` : f.netRating,
      `${f.eFGPct}%`,
      `${f.tovPct}%`,
      `${rTot.tsPct}%`
    ].join(','));
  });

  // SECCIÓN 3: RESUMEN INDIVIDUAL
  lines.push('');
  lines.push(`"==========================================================="`);
  lines.push(`"SECCIÓN 3: RESUMEN INDIVIDUAL Y PROMEDIOS ACUMULADOS"`);
  lines.push(`"==========================================================="`);
  lines.push([
    '#',
    'Jugador',
    'Posición',
    'Partidos (PJ)',
    'PTS / PJ',
    'REB / PJ',
    'AST / PJ',
    'VAL / PJ',
    '2P%',
    '3P%',
    'TL%',
    'Puntos Totales',
    'Rebotes Totales',
    'Asistencias Totales',
    'Valoración Total'
  ].join(','));

  aggPlayers.forEach(p => {
    lines.push([
      p.number ?? '',
      `"${p.name}"`,
      `"${p.position || ''}"`,
      p.gamesPlayed,
      p.avgPoints,
      p.avgRebounds,
      p.avgAssists,
      p.avgValuation,
      `${p.pct2p}%`,
      `${p.pct3p}%`,
      `${p.pctFt}%`,
      p.totalPoints,
      p.totalRebounds,
      p.totalAssists,
      p.totalValuation
    ].join(','));
  });

  const csvContent = lines.join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SOMISA_Reporte_Completo_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export only Team Summary & Four Factors to Excel
 */
export function exportTeamSummaryExcel(game: Game): void {
  const wb = XLSX.utils.book_new();
  const teamTotals = calculateTeamRowTotals(game.rows);
  const factors = calculateFourFactors(teamTotals, game.opponentStats);
  const singlePoss = (teamTotals.ti + teamTotals.i3p) + 0.44 * teamTotals.tli - teamTotals.ro + teamTotals.per || 1;
  const oppFgaSingle = game.opponentStats ? game.opponentStats.ti + game.opponentStats.i3p : 0;
  const oppPossSingle = game.opponentStats
    ? (oppFgaSingle + 0.44 * game.opponentStats.tli - game.opponentStats.ro + game.opponentStats.per || singlePoss)
    : singlePoss;
  const singlePpp = Number((game.scoreMyTeam / singlePoss).toFixed(2));
  const singleOppPpp = Number((game.scoreOpponent / oppPossSingle).toFixed(2));
  const singleAstTo = teamTotals.per > 0 ? Number((teamTotals.as / teamTotals.per).toFixed(2)) : teamTotals.as;
  const singleFgm = teamTotals.tc + teamTotals.c3p;
  const singleAstPct = singleFgm > 0 ? Number(((teamTotals.as / singleFgm) * 100).toFixed(1)) : 0;

  const sheetData: (string | number)[][] = [
    ['CLUB SOMISA - RESUMEN COLECTIVO, EFICIENCIA AVANZADA Y 4 FACTORES DE DEAN OLIVER'],
    [`Partido: ${game.myTeamName} vs ${game.opponentName} (${game.date}) | Torneo: ${game.competition}`],
    [],
    ['MÉTRICAS DE EFICIENCIA AVANZADA', 'SOMISA', 'RIVAL', 'DIFERENCIA / EVALUACIÓN'],
    ['Resultado Final (Puntos)', game.scoreMyTeam, game.scoreOpponent, game.scoreMyTeam - game.scoreOpponent],
    ['Posesiones Estimadas (Pace)', factors.pace, factors.pace, `~${(2400 / (factors.pace || 1) / 2).toFixed(1)} seg/posesión`],
    ['Offensive Rating (ORtg - Pts/100 pos)', factors.offensiveRating, factors.defensiveRating, `${factors.netRating > 0 ? '+' : ''}${factors.netRating} Net Rating`],
    ['Defensive Rating (DRtg - Pts recibidos/100 pos)', factors.defensiveRating, factors.offensiveRating, ''],
    ['Net Rating (+/- neto)', factors.netRating, -factors.netRating, factors.netRating >= 0 ? 'Favorable' : 'Desfavorable'],
    ['Puntos Por Posesión (PPP)', singlePpp, singleOppPpp, `${(singlePpp - singleOppPpp).toFixed(2)} dif PPP`],
    ['True Shooting % (TS% - Tiro Real)', `${teamTotals.tsPct}%`, '', 'Efectividad global c/ triples y libres'],
    ['Relación Asistencias / Pérdidas (AST/PER)', singleAstTo, '', `${teamTotals.as} AST / ${teamTotals.per} PER`],
    ['Canastas Asistidas (AST%)', `${singleAstPct}%`, '', '% de goles de campo asistidos'],
    [],
    ['LOS 4 FACTORES DE LA VICTORIA', 'SOMISA', 'RIVAL', 'IMPACTO EN EL JUEGO'],
    ['1. Tiro Efectivo (eFG% - 40% peso)', `${factors.eFGPct}%`, `${factors.oppEFGPct}%`, factors.eFGPct >= factors.oppEFGPct ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['2. Cuidado de Balón (ToV% - 25% peso)', `${factors.tovPct}%`, `${factors.oppTovPct}%`, factors.tovPct <= factors.oppTovPct ? 'Ventaja SOMISA (Menos pérdidas)' : 'Ventaja Rival'],
    ['3. Rebote Ofensivo (ORB% - 20% peso)', `${factors.orbPct}%`, `${100 - factors.drbPct}%`, factors.orbPct >= (100 - factors.drbPct) ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['4. Frecuencia Tiros Libres (FTr - 15% peso)', `${factors.ftRate}%`, `${factors.oppFtRate}%`, factors.ftRate >= factors.oppFtRate ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    [],
    ['DESGLOSE DE PUNTOS ANOTADOS', 'PUNTOS', '% DEL TOTAL DE PUNTOS', 'TIROS CONVERTIDOS/INT'],
    ['Puntos en Tiros de 2 (Dobles)', teamTotals.tc * 2, teamTotals.pt > 0 ? `${((teamTotals.tc * 2 / teamTotals.pt) * 100).toFixed(1)}%` : '0%', `${teamTotals.tc}/${teamTotals.ti}`],
    ['Puntos en Tiros de 3 (Triples)', teamTotals.c3p * 3, teamTotals.pt > 0 ? `${((teamTotals.c3p * 3 / teamTotals.pt) * 100).toFixed(1)}%` : '0%', `${teamTotals.c3p}/${teamTotals.i3p}`],
    ['Puntos en Tiros Libres', teamTotals.tlc, teamTotals.pt > 0 ? `${((teamTotals.tlc / teamTotals.pt) * 100).toFixed(1)}%` : '0%', `${teamTotals.tlc}/${teamTotals.tli}`]
  ];

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen del Equipo');
  XLSX.writeFile(wb, `SOMISA_Resumen_Equipo_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.xlsx`);
}

/**
 * Export only Individual Player Summary to Excel
 */
export function exportPlayerSummaryExcel(allGames: Game[]): void {
  const wb = XLSX.utils.book_new();
  const aggPlayers = computeAggregatedPlayers(allGames);

  const sheetData: (string | number)[][] = [
    ['CLUB SOMISA - RESUMEN INDIVIDUAL Y PROMEDIOS ACUMULADOS'],
    [`Total Partidos Computados: ${allGames.length}`],
    [],
    [
      '# Dorsal',
      'Jugador',
      'Posición',
      'Partidos (PJ)',
      'PTS / PJ',
      'REB / PJ',
      'AST / PJ',
      'VAL / PJ',
      '2P %',
      '3P %',
      'TL %',
      'Pts Totales',
      '2P Conv',
      '2P Int',
      '3P Conv',
      '3P Int',
      'TL Conv',
      'TL Int',
      'Reb Def',
      'Reb Of',
      'Reb Tot',
      'AST Tot',
      'REC Tot',
      'PER Tot',
      'TAP Tot',
      'FAL Com',
      'FAL Rec',
      'VAL Total'
    ]
  ];

  aggPlayers.forEach(p => {
    sheetData.push([
      p.number ?? '',
      p.name,
      p.position || '',
      p.gamesPlayed,
      p.avgPoints,
      p.avgRebounds,
      p.avgAssists,
      p.avgValuation,
      `${p.pct2p}%`,
      `${p.pct3p}%`,
      `${p.pctFt}%`,
      p.totalPoints,
      p.tc,
      p.ti,
      p.c3p,
      p.i3p,
      p.tlc,
      p.tli,
      p.rd,
      p.ro,
      p.totalRebounds,
      p.totalAssists,
      p.rec,
      p.per,
      p.tap,
      p.fpc,
      p.fpr,
      p.totalValuation
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Resumen Individual');
  XLSX.writeFile(wb, `SOMISA_Resumen_Individual_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export only Team Summary & Four Factors to CSV
 */
export function exportTeamSummaryCsv(game: Game): void {
  const teamTotals = calculateTeamRowTotals(game.rows);
  const factors = calculateFourFactors(teamTotals, game.opponentStats);
  const singlePoss = (teamTotals.ti + teamTotals.i3p) + 0.44 * teamTotals.tli - teamTotals.ro + teamTotals.per || 1;
  const oppFgaSingle = game.opponentStats ? game.opponentStats.ti + game.opponentStats.i3p : 0;
  const oppPossSingle = game.opponentStats
    ? (oppFgaSingle + 0.44 * game.opponentStats.tli - game.opponentStats.ro + game.opponentStats.per || singlePoss)
    : singlePoss;
  const singlePpp = Number((game.scoreMyTeam / singlePoss).toFixed(2));
  const singleOppPpp = Number((game.scoreOpponent / oppPossSingle).toFixed(2));
  const singleAstTo = teamTotals.per > 0 ? Number((teamTotals.as / teamTotals.per).toFixed(2)) : teamTotals.as;
  const singleFgm = teamTotals.tc + teamTotals.c3p;
  const singleAstPct = singleFgm > 0 ? Number(((teamTotals.as / singleFgm) * 100).toFixed(1)) : 0;

  const lines = [
    `"CLUB SOMISA - RESUMEN DEL EQUIPO, EFICIENCIA AVANZADA Y 4 FACTORES (DEAN OLIVER)"`,
    `"PARTIDO: ${game.myTeamName} vs ${game.opponentName} (${game.date})"`,
    '',
    'Métrica,SOMISA,Rival,Diferencia/Impacto',
    `Puntos Finales,${game.scoreMyTeam},${game.scoreOpponent},${game.scoreMyTeam - game.scoreOpponent}`,
    `Posesiones Estimadas (Pace),${factors.pace},${factors.pace},Ritmo del juego`,
    `Offensive Rating (ORtg - Pts/100 pos),${factors.offensiveRating},${factors.defensiveRating},${factors.netRating} Net Rating`,
    `Defensive Rating (DRtg),${factors.defensiveRating},${factors.offensiveRating},""`,
    `Puntos Por Posesión (PPP),${singlePpp},${singleOppPpp},${(singlePpp - singleOppPpp).toFixed(2)} dif PPP`,
    `True Shooting % (TS%),${teamTotals.tsPct}%,"",Efectividad real c/ triples y libres`,
    `Relación AST / PER,${singleAstTo},"",${teamTotals.as} AST / ${teamTotals.per} PER`,
    `Canastas Asistidas (AST%),${singleAstPct}%,"",Circulación de balón`,
    `1. Tiro Efectivo (eFG%),${factors.eFGPct}%,${factors.oppEFGPct}%,40% de importancia`,
    `2. Cuidado de Balón (ToV%),${factors.tovPct}%,${factors.oppTovPct}%,25% de importancia`,
    `3. Rebote Ofensivo (ORB%),${factors.orbPct}%,${100 - factors.drbPct}%,20% de importancia`,
    `4. Frecuencia Tiros Libres (FTr),${factors.ftRate}%,${factors.oppFtRate}%,15% de importancia`
  ];

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SOMISA_Resumen_Equipo_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export only Individual Player Summary to CSV
 */
export function exportPlayerSummaryCsv(allGames: Game[]): void {
  const aggPlayers = computeAggregatedPlayers(allGames);

  const lines = [
    `"CLUB SOMISA - RESUMEN INDIVIDUAL Y PROMEDIOS ACUMULADOS"`,
    `"TOTAL PARTIDOS COMPUTADOS: ${allGames.length}"`,
    '',
    [
      '#',
      'Jugador',
      'Posición',
      'Partidos (PJ)',
      'PTS / PJ',
      'REB / PJ',
      'AST / PJ',
      'VAL / PJ',
      '2P%',
      '3P%',
      'TL%',
      'Puntos Totales',
      'Rebotes Totales',
      'Asistencias Totales',
      'Valoración Total'
    ].join(',')
  ];

  aggPlayers.forEach(p => {
    lines.push([
      p.number ?? '',
      `"${p.name}"`,
      `"${p.position || ''}"`,
      p.gamesPlayed,
      p.avgPoints,
      p.avgRebounds,
      p.avgAssists,
      p.avgValuation,
      `${p.pct2p}%`,
      `${p.pct3p}%`,
      `${p.pctFt}%`,
      p.totalPoints,
      p.totalRebounds,
      p.totalAssists,
      p.totalValuation
    ].join(','));
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SOMISA_Resumen_Individual_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export interface AggregatedTeamTotals {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  totalPoints: number;
  avgPoints: number;
  totalOpponentPoints: number;
  avgOpponentPoints: number;
  pointDiff: number;
  avgPointDiff: number;
  tc: number;
  ti: number;
  tiPct: number;
  c3p: number;
  i3p: number;
  pct3p: number;
  tlc: number;
  tli: number;
  tlPct: number;
  rd: number;
  ro: number;
  rt: number;
  avgRebounds: number;
  as: number;
  avgAssists: number;
  rec: number;
  avgSteals: number;
  per: number;
  avgTurnovers: number;
  tap: number;
  avgBlocks: number;
  fpc: number;
  fpr: number;
  totalValuation: number;
  avgValuation: number;
  eFGPct: number;
  oppEFGPct: number;
  tovPct: number;
  oppTovPct: number;
  orbPct: number;
  drbPct: number;
  ftRate: number;
  oppFtRate: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  pointsPerPossession: number;
  oppPointsPerPossession: number;
  trueShootingPct: number;
  assistToTurnoverRatio: number;
  assistedFGPct: number;
}

export function computeAggregatedTeamTotals(games: Game[]): AggregatedTeamTotals {
  const gp = games.length || 1;
  let wins = 0;
  let losses = 0;
  let totalPts = 0;
  let totalOppPts = 0;
  let tc = 0, ti = 0, c3p = 0, i3p = 0, tlc = 0, tli = 0;
  let rd = 0, ro = 0, as = 0, rec = 0, per = 0, tap = 0, fpc = 0, fpr = 0, totalVal = 0;
  let oppTc = 0, oppTi = 0, oppC3p = 0, oppI3p = 0, oppTlc = 0, oppTli = 0;
  let oppRd = 0, oppRo = 0, oppPer = 0;

  games.forEach(g => {
    if (g.scoreMyTeam > g.scoreOpponent) wins++;
    else if (g.scoreMyTeam < g.scoreOpponent) losses++;

    totalPts += g.scoreMyTeam;
    totalOppPts += g.scoreOpponent;

    const rowTotals = calculateTeamRowTotals(g.rows);
    tc += rowTotals.tc;
    ti += rowTotals.ti;
    c3p += rowTotals.c3p;
    i3p += rowTotals.i3p;
    tlc += rowTotals.tlc;
    tli += rowTotals.tli;
    rd += rowTotals.rd;
    ro += rowTotals.ro;
    as += rowTotals.as;
    rec += rowTotals.rec;
    per += rowTotals.per;
    tap += rowTotals.tap;
    fpc += rowTotals.fpc;
    fpr += rowTotals.fpr;
    totalVal += rowTotals.ptsTot;

    if (g.opponentStats) {
      oppTc += g.opponentStats.tc;
      oppTi += g.opponentStats.ti;
      oppC3p += g.opponentStats.c3p;
      oppI3p += g.opponentStats.i3p;
      oppTlc += g.opponentStats.tlc;
      oppTli += g.opponentStats.tli;
      oppRd += g.opponentStats.rd;
      oppRo += g.opponentStats.ro;
      oppPer += g.opponentStats.per;
    }
  });

  const rt = rd + ro;
  const fga = ti + i3p;
  const fgm = tc + c3p;
  const oppFga = oppTi + oppI3p;
  const oppFgm = oppTc + oppC3p;

  const eFGPct = fga > 0 ? Number((((fgm + 0.5 * c3p) / fga) * 100).toFixed(1)) : 0;
  const oppEFGPct = oppFga > 0 ? Number((((oppFgm + 0.5 * oppC3p) / oppFga) * 100).toFixed(1)) : 0;

  const poss = fga + 0.44 * tli - ro + per || 1;
  const oppPoss = oppFga + 0.44 * oppTli - oppRo + oppPer || poss;
  const avgPoss = (poss + oppPoss) / 2;

  const tovPct = Number(((per / poss) * 100).toFixed(1));
  const oppTovPct = Number(((oppPer / oppPoss) * 100).toFixed(1));

  const orbPct = (ro + oppRd) > 0 ? Number(((ro / (ro + oppRd)) * 100).toFixed(1)) : 0;
  const drbPct = (rd + oppRo) > 0 ? Number(((rd / (rd + oppRo)) * 100).toFixed(1)) : 0;

  const ftRate = fga > 0 ? Number(((tlc / fga) * 100).toFixed(1)) : 0;
  const oppFtRate = oppFga > 0 ? Number(((oppTlc / oppFga) * 100).toFixed(1)) : 0;

  const pace = Number((avgPoss / gp).toFixed(1));
  const offensiveRating = Number(((totalPts / poss) * 100).toFixed(1));
  const defensiveRating = Number(((totalOppPts / oppPoss) * 100).toFixed(1));
  const netRating = Number((offensiveRating - defensiveRating).toFixed(1));

  const pointsPerPossession = Number((totalPts / poss).toFixed(2));
  const oppPointsPerPossession = Number((totalOppPts / oppPoss).toFixed(2));

  const tsDenom = 2 * (fga + 0.44 * tli);
  const trueShootingPct = tsDenom > 0 ? Number(((totalPts / tsDenom) * 100).toFixed(1)) : 0;

  const assistToTurnoverRatio = per > 0 ? Number((as / per).toFixed(2)) : as;
  const assistedFGPct = fgm > 0 ? Number(((as / fgm) * 100).toFixed(1)) : 0;

  return {
    gamesPlayed: games.length,
    wins,
    losses,
    winPct: games.length > 0 ? Number(((wins / games.length) * 100).toFixed(1)) : 0,
    totalPoints: totalPts,
    avgPoints: Number((totalPts / gp).toFixed(1)),
    totalOpponentPoints: totalOppPts,
    avgOpponentPoints: Number((totalOppPts / gp).toFixed(1)),
    pointDiff: totalPts - totalOppPts,
    avgPointDiff: Number(((totalPts - totalOppPts) / gp).toFixed(1)),
    tc,
    ti,
    tiPct: ti > 0 ? Number(((tc / ti) * 100).toFixed(1)) : 0,
    c3p,
    i3p,
    pct3p: i3p > 0 ? Number(((c3p / i3p) * 100).toFixed(1)) : 0,
    tlc,
    tli,
    tlPct: tli > 0 ? Number(((tlc / tli) * 100).toFixed(1)) : 0,
    rd,
    ro,
    rt,
    avgRebounds: Number((rt / gp).toFixed(1)),
    as,
    avgAssists: Number((as / gp).toFixed(1)),
    rec,
    avgSteals: Number((rec / gp).toFixed(1)),
    per,
    avgTurnovers: Number((per / gp).toFixed(1)),
    tap,
    avgBlocks: Number((tap / gp).toFixed(1)),
    fpc,
    fpr,
    totalValuation: totalVal,
    avgValuation: Number((totalVal / gp).toFixed(1)),
    eFGPct,
    oppEFGPct,
    tovPct,
    oppTovPct,
    orbPct,
    drbPct,
    ftRate,
    oppFtRate,
    pace,
    offensiveRating,
    defensiveRating,
    netRating,
    pointsPerPossession,
    oppPointsPerPossession,
    trueShootingPct,
    assistToTurnoverRatio,
    assistedFGPct
  };
}

/**
 * EXPORTAR RESUMEN TOTAL ACUMULADO (EQUIPO E INDIVIDUAL) EN EXCEL (.xlsx)
 * Hoja 1: Resumen Total del Equipo & Eficiencia Avanzada
 * Hoja 2: Resumen Total Individual
 */
export function exportSeasonTotalsExcel(games: Game[], filterDescription?: string): void {
  const wb = XLSX.utils.book_new();
  const teamTotals = computeAggregatedTeamTotals(games);
  const aggPlayers = computeAggregatedPlayers(games);
  const gp = games.length || 1;

  // ---------------- HOJA 1: RESUMEN TOTAL DEL EQUIPO & EFICIENCIA AVANZADA ----------------
  const sheet1Data: (string | number)[][] = [
    ['CLUB SOMISA - RESUMEN TOTAL DEL EQUIPO Y EFICIENCIA AVANZADA'],
    [`Total Partidos Computados: ${games.length} | Balance: ${teamTotals.wins} Victorias - ${teamTotals.losses} Derrotas (${teamTotals.winPct}%)`],
    ...(filterDescription ? [[`Filtro Aplicado: ${filterDescription}`]] : []),
    [],
    ['EFICIENCIA AVANZADA COLECTIVA (RATINGS & RITMO)', 'VALOR GLOBAL', 'DETALLE / IMPACTO TÁCTICO'],
    ['Offensive Rating Global (ORtg - Pts/100 pos)', teamTotals.offensiveRating, `${teamTotals.pointsPerPossession} Puntos Por Posesión (PPP)`],
    ['Defensive Rating Global (DRtg - Pts recibidos/100 pos)', teamTotals.defensiveRating, `${teamTotals.oppPointsPerPossession} Opp PPP permitidos`],
    ['Net Rating Global (NetRtg - Diferencial Neto)', teamTotals.netRating, teamTotals.netRating >= 0 ? 'Ventaja de Eficiencia (+)' : 'Déficit de Eficiencia (-)'],
    ['Ritmo de Juego Promedio (Pace)', teamTotals.pace, `Posesiones / 40 min (~${(2400 / (teamTotals.pace || 1) / 2).toFixed(1)}s por posesión)`],
    ['True Shooting % Global (TS%)', `${teamTotals.trueShootingPct}%`, 'Eficiencia real de tiro (2P, 3P y TL)'],
    ['Relación Asistencias / Pérdidas (AST/PER)', teamTotals.assistToTurnoverRatio, `${teamTotals.as} asistencias / ${teamTotals.per} pérdidas`],
    ['Porcentaje de Canastas Asistidas (AST%)', `${teamTotals.assistedFGPct}%`, 'Proporción de goles de campo tras asistencia'],
    [],
    ['MÉTRICA COLECTIVA (GLOBAL MUESTRA)', 'VALOR TOTAL ACUMULADO', 'PROMEDIO POR PARTIDO (PJ)'],
    ['Puntos Anotados por SOMISA', teamTotals.totalPoints, `${teamTotals.avgPoints} pts/pj`],
    ['Puntos Recibidos (Rivales)', teamTotals.totalOpponentPoints, `${teamTotals.avgOpponentPoints} pts/pj`],
    ['Diferencial de Puntos (+/-)', teamTotals.pointDiff, `${teamTotals.avgPointDiff > 0 ? '+' : ''}${teamTotals.avgPointDiff} pts/pj`],
    [],
    ['LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER - GLOBAL)', 'SOMISA', 'RIVALES', 'EVALUACIÓN'],
    ['1. Tiro Efectivo (eFG%)', `${teamTotals.eFGPct}%`, `${teamTotals.oppEFGPct}%`, teamTotals.eFGPct >= teamTotals.oppEFGPct ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['2. Cuidado de Balón (ToV%)', `${teamTotals.tovPct}%`, `${teamTotals.oppTovPct}%`, teamTotals.tovPct <= teamTotals.oppTovPct ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['3. Rebote Ofensivo (ORB%)', `${teamTotals.orbPct}%`, `${100 - teamTotals.drbPct}%`, teamTotals.orbPct >= (100 - teamTotals.drbPct) ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['4. Frecuencia de Libres (FTr)', `${teamTotals.ftRate}%`, `${teamTotals.oppFtRate}%`, teamTotals.ftRate >= teamTotals.oppFtRate ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    [],
    ['ESTADÍSTICAS TOTALES Y PROMEDIOS DE JUEGO', 'TOTALES SOMISA', 'PROMEDIO / PARTIDO', 'EFECTIVIDAD %'],
    ['Tiros de 2 Puntos (Dobles)', `${teamTotals.tc} / ${teamTotals.ti}`, `${(teamTotals.tc / gp).toFixed(1)} / ${(teamTotals.ti / gp).toFixed(1)}`, `${teamTotals.tiPct}%`],
    ['Tiros de 3 Puntos (Triples)', `${teamTotals.c3p} / ${teamTotals.i3p}`, `${(teamTotals.c3p / gp).toFixed(1)} / ${(teamTotals.i3p / gp).toFixed(1)}`, `${teamTotals.pct3p}%`],
    ['Tiros Libres (TL)', `${teamTotals.tlc} / ${teamTotals.tli}`, `${(teamTotals.tlc / gp).toFixed(1)} / ${(teamTotals.tli / gp).toFixed(1)}`, `${teamTotals.tlPct}%`],
    ['Rebotes Totales', teamTotals.rt, teamTotals.avgRebounds, `Def: ${teamTotals.rd} | Of: ${teamTotals.ro}`],
    ['Asistencias', teamTotals.as, teamTotals.avgAssists, ''],
    ['Recuperos / Robos', teamTotals.rec, teamTotals.avgSteals, ''],
    ['Pérdidas', teamTotals.per, teamTotals.avgTurnovers, ''],
    ['Tapas / Bloqueos', teamTotals.tap, teamTotals.avgBlocks, ''],
    ['Faltas Cometidas / Recibidas', `${teamTotals.fpc} / ${teamTotals.fpr}`, `${(teamTotals.fpc / gp).toFixed(1)} / ${(teamTotals.fpr / gp).toFixed(1)}`, ''],
    ['Valoración Total', teamTotals.totalValuation, teamTotals.avgValuation, ''],
    [],
    ['DESGLOSE Y EVOLUCIÓN DE EFICIENCIA POR PARTIDO'],
    ['Fecha', 'Rival', 'Competencia', 'Condición', 'Resultado', 'Pace', 'ORtg (Ataque)', 'DRtg (Defensa)', 'Net Rating', 'eFG%', 'ToV%', 'TS%']
  ];

  games.forEach(g => {
    const rTot = calculateTeamRowTotals(g.rows);
    const f = calculateFourFactors(rTot, g.opponentStats);
    sheet1Data.push([
      g.date,
      g.opponentName,
      g.competition,
      g.homeAway === 'home' ? 'Local' : 'Visitante',
      `${g.scoreMyTeam} - ${g.scoreOpponent}`,
      f.pace,
      f.offensiveRating,
      f.defensiveRating,
      f.netRating > 0 ? `+${f.netRating}` : f.netRating,
      `${f.eFGPct}%`,
      `${f.tovPct}%`,
      `${rTot.tsPct}%`
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Total Equipo');

  // ---------------- HOJA 2: RESUMEN TOTAL INDIVIDUAL ----------------
  const sheet2Data: (string | number)[][] = [
    ['CLUB SOMISA - RESUMEN TOTAL INDIVIDUAL (PLANTILLA COMPLETA)'],
    [`Total Partidos Computados: ${games.length} | Temporada Oficial`],
    ...(filterDescription ? [[`Filtro Aplicado: ${filterDescription}`]] : []),
    [],
    [
      '# Dorsal',
      'Jugador',
      'Posición',
      'Partidos (PJ)',
      'PTS / PJ',
      'REB / PJ',
      'AST / PJ',
      'VAL / PJ',
      '2P %',
      '3P %',
      'TL %',
      'Pts Totales',
      '2P Conv',
      '2P Int',
      '3P Conv',
      '3P Int',
      'TL Conv',
      'TL Int',
      'Reb Def',
      'Reb Of',
      'Reb Tot',
      'AST Tot',
      'REC Tot',
      'PER Tot',
      'TAP Tot',
      'FAL Com',
      'FAL Rec',
      'VAL Total'
    ]
  ];

  aggPlayers.forEach(p => {
    sheet2Data.push([
      p.number ?? '',
      p.name,
      p.position || '',
      p.gamesPlayed,
      p.avgPoints,
      p.avgRebounds,
      p.avgAssists,
      p.avgValuation,
      `${p.pct2p}%`,
      `${p.pct3p}%`,
      `${p.pctFt}%`,
      p.totalPoints,
      p.tc,
      p.ti,
      p.c3p,
      p.i3p,
      p.tlc,
      p.tli,
      p.rd,
      p.ro,
      p.totalRebounds,
      p.totalAssists,
      p.rec,
      p.per,
      p.tap,
      p.fpc,
      p.fpr,
      p.totalValuation
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumen Total Individual');

  XLSX.writeFile(wb, `SOMISA_Resumen_Total_Temporada_Equipo_e_Individual.xlsx`);
}

/**
 * EXPORTAR RESUMEN TOTAL ACUMULADO (EQUIPO E INDIVIDUAL) EN CSV (.csv)
 */
export function exportSeasonTotalsCsv(games: Game[], filterDescription?: string): void {
  const teamTotals = computeAggregatedTeamTotals(games);
  const aggPlayers = computeAggregatedPlayers(games);

  const lines: string[] = [
    `"==========================================================="`,
    `"CLUB SOMISA SAN NICOLÁS - RESUMEN TOTAL Y EFICIENCIA AVANZADA"`,
    `"TOTAL PARTIDOS COMPUTADOS: ${games.length} | RECORD: ${teamTotals.wins}V - ${teamTotals.losses}D (${teamTotals.winPct}%)"`,
    ...(filterDescription ? [`"FILTRO APLICADO: ${filterDescription}"`] : []),
    `"==========================================================="`,
    '',
    `"SECCIÓN 1: RESUMEN TOTAL DEL EQUIPO Y EFICIENCIA AVANZADA"`,
    'Métrica,Total Acumulado / Global,Promedio por Partido / Impacto',
    `Offensive Rating Global (ORtg - Pts/100 pos),${teamTotals.offensiveRating},${teamTotals.pointsPerPossession} PPP (Puntos Por Posesión)`,
    `Defensive Rating Global (DRtg - Pts recibidos/100 pos),${teamTotals.defensiveRating},${teamTotals.oppPointsPerPossession} Opp PPP`,
    `Net Rating Global (NetRtg),${teamTotals.netRating},${teamTotals.netRating >= 0 ? 'Favorable (+)' : 'Desfavorable (-)'}`,
    `Ritmo / Posesiones (Pace),${teamTotals.pace},Posesiones / 40 min (~${(2400 / (teamTotals.pace || 1) / 2).toFixed(1)}s/pos)`,
    `True Shooting % Global (TS%),${teamTotals.trueShootingPct}%,Eficiencia real de tiro (2P + 3P + TL)`,
    `Relación Asistencias / Pérdidas (AST/PER),${teamTotals.assistToTurnoverRatio},${teamTotals.as} AST / ${teamTotals.per} PER`,
    `Canastas Asistidas (AST%),${teamTotals.assistedFGPct}%,Circulación colectiva de balón`,
    `Puntos Anotados,${teamTotals.totalPoints},${teamTotals.avgPoints} pts/pj`,
    `Puntos Recibidos Rival,${teamTotals.totalOpponentPoints},${teamTotals.avgOpponentPoints} pts/pj`,
    `Diferencial (+/-),${teamTotals.pointDiff},${teamTotals.avgPointDiff} pts/pj`,
    `1. Tiro Efectivo (eFG%),${teamTotals.eFGPct}%,Rival: ${teamTotals.oppEFGPct}%`,
    `2. Cuidado Balón (ToV%),${teamTotals.tovPct}%,Rival: ${teamTotals.oppTovPct}%`,
    `3. Rebote Ofensivo (ORB%),${teamTotals.orbPct}%,Rival Def: ${teamTotals.drbPct}%`,
    `4. Frecuencia Libres (FTr),${teamTotals.ftRate}%,Rival: ${teamTotals.oppFtRate}%`,
    `Tiros 2P (Dobles),${teamTotals.tc}/${teamTotals.ti},${teamTotals.tiPct}%`,
    `Tiros 3P (Triples),${teamTotals.c3p}/${teamTotals.i3p},${teamTotals.pct3p}%`,
    `Tiros Libres (TL),${teamTotals.tlc}/${teamTotals.tli},${teamTotals.tlPct}%`,
    `Rebotes Totales,${teamTotals.rt},${teamTotals.avgRebounds} reb/pj`,
    `Asistencias,${teamTotals.as},${teamTotals.avgAssists} ast/pj`,
    `Recuperos,${teamTotals.rec},${teamTotals.avgSteals} rec/pj`,
    `Pérdidas,${teamTotals.per},${teamTotals.avgTurnovers} per/pj`,
    `Valoración Total,${teamTotals.totalValuation},${teamTotals.avgValuation} val/pj`,
    '',
    `"EVOLUCIÓN DE EFICIENCIA AVANZADA POR PARTIDO"`,
    'Fecha,Rival,Competencia,Condición,Resultado,Pace,ORtg,DRtg,Net Rating,eFG%,ToV%,TS%'
  ];

  games.forEach(g => {
    const rTot = calculateTeamRowTotals(g.rows);
    const f = calculateFourFactors(rTot, g.opponentStats);
    lines.push([
      g.date,
      `"${g.opponentName}"`,
      `"${g.competition}"`,
      g.homeAway === 'home' ? 'Local' : 'Visitante',
      `"${g.scoreMyTeam} - ${g.scoreOpponent}"`,
      f.pace,
      f.offensiveRating,
      f.defensiveRating,
      f.netRating > 0 ? `+${f.netRating}` : f.netRating,
      `${f.eFGPct}%`,
      `${f.tovPct}%`,
      `${rTot.tsPct}%`
    ].join(','));
  });

  lines.push(
    '',
    `"==========================================================="`,
    `"SECCIÓN 2: RESUMEN TOTAL INDIVIDUAL (PLANTILLA OFICIAL)"`,
    `"==========================================================="`,
    [
      '#',
      'Jugador',
      'Posición',
      'Partidos (PJ)',
      'PTS / PJ',
      'REB / PJ',
      'AST / PJ',
      'VAL / PJ',
      '2P%',
      '3P%',
      'TL%',
      'Puntos Totales',
      'Rebotes Totales',
      'Asistencias Totales',
      'Valoración Total'
    ].join(',')
  );

  aggPlayers.forEach(p => {
    lines.push([
      p.number ?? '',
      `"${p.name}"`,
      `"${p.position || ''}"`,
      p.gamesPlayed,
      p.avgPoints,
      p.avgRebounds,
      p.avgAssists,
      p.avgValuation,
      `${p.pct2p}%`,
      `${p.pct3p}%`,
      `${p.pctFt}%`,
      p.totalPoints,
      p.totalRebounds,
      p.totalAssists,
      p.totalValuation
    ].join(','));
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SOMISA_Resumen_Total_Temporada_Equipo_e_Individual.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * EXPORTAR PLANILLA DE UN PARTIDO ESPECÍFICO EN EXCEL (.xlsx)
 */
export function exportSingleGameExcel(game: Game): void {
  const wb = XLSX.utils.book_new();
  const teamTotals = calculateTeamRowTotals(game.rows);

  const sheetData: (string | number)[][] = [
    ['CLUB SOMISA - PLANILLA OFICIAL DE PARTIDO (CABB / FBB)'],
    [`Partido: ${game.myTeamName} vs ${game.opponentName}`],
    [`Fecha: ${game.date} | Torneo: ${game.competition} | Temporada: ${game.season}`],
    [`Resultado Final: ${game.myTeamName} ${game.scoreMyTeam} - ${game.scoreOpponent} ${game.opponentName}`],
    [],
    [
      '#',
      'Jugador',
      'Posición',
      'MIN',
      '2P Conv',
      '2P Int',
      '2P %',
      '3P Conv',
      '3P Int',
      '3P %',
      'TL Conv',
      'TL Int',
      'TL %',
      'Reb Def',
      'Reb Of',
      'Reb Tot',
      'AST',
      'REC',
      'PER',
      'TAP',
      'FC',
      'FR',
      'PTS',
      'VAL'
    ]
  ];

  game.rows.forEach(r => {
    sheetData.push([
      r.playerNumber ?? '',
      r.playerName,
      r.playerPosition || '',
      r.min,
      r.tc,
      r.ti,
      r.tiPct,
      r.c3p,
      r.i3p,
      r.pct3p,
      r.tlc,
      r.tli,
      r.tlPct,
      r.rd,
      r.ro,
      r.rt,
      r.as,
      r.rec,
      r.per,
      r.tap,
      r.fpc,
      r.fpr,
      r.pt,
      r.ptsTot
    ]);
  });

  // Totales SOMISA
  sheetData.push([
    '∑',
    'TOTALES SOMISA',
    '',
    teamTotals.min,
    teamTotals.tc,
    teamTotals.ti,
    teamTotals.tiPct,
    teamTotals.c3p,
    teamTotals.i3p,
    teamTotals.pct3p,
    teamTotals.tlc,
    teamTotals.tli,
    teamTotals.tlPct,
    teamTotals.rd,
    teamTotals.ro,
    teamTotals.rt,
    teamTotals.as,
    teamTotals.rec,
    teamTotals.per,
    teamTotals.tap,
    teamTotals.fpc,
    teamTotals.fpr,
    teamTotals.pt,
    teamTotals.ptsTot
  ]);

  if (game.opponentStats) {
    const opp = game.opponentStats;
    sheetData.push([
      '∑',
      `TOTALES ${game.opponentName}`,
      '',
      teamTotals.min,
      opp.tc,
      opp.ti,
      opp.ti > 0 ? Number(((opp.tc / opp.ti) * 100).toFixed(1)) : 0,
      opp.c3p,
      opp.i3p,
      opp.i3p > 0 ? Number(((opp.c3p / opp.i3p) * 100).toFixed(1)) : 0,
      opp.tlc,
      opp.tli,
      opp.tli > 0 ? Number(((opp.tlc / opp.tli) * 100).toFixed(1)) : 0,
      opp.rd,
      opp.ro,
      opp.rd + opp.ro,
      opp.as,
      opp.rec,
      opp.per,
      opp.tap,
      opp.fpc,
      '',
      opp.pts,
      ''
    ]);
  }

  const singleFactors = calculateFourFactors(teamTotals, game.opponentStats);
  const singlePoss = (teamTotals.ti + teamTotals.i3p) + 0.44 * teamTotals.tli - teamTotals.ro + teamTotals.per || 1;
  const oppFgaSingle = game.opponentStats ? game.opponentStats.ti + game.opponentStats.i3p : 0;
  const oppPossSingle = game.opponentStats
    ? (oppFgaSingle + 0.44 * game.opponentStats.tli - game.opponentStats.ro + game.opponentStats.per || singlePoss)
    : singlePoss;
  const singlePpp = Number((game.scoreMyTeam / singlePoss).toFixed(2));
  const singleOppPpp = Number((game.scoreOpponent / oppPossSingle).toFixed(2));
  const singleAstTo = teamTotals.per > 0 ? Number((teamTotals.as / teamTotals.per).toFixed(2)) : teamTotals.as;
  const singleFgm = teamTotals.tc + teamTotals.c3p;
  const singleAstPct = singleFgm > 0 ? Number(((teamTotals.as / singleFgm) * 100).toFixed(1)) : 0;

  sheetData.push(
    [],
    ['EFICIENCIA AVANZADA Y 4 FACTORES DE DEAN OLIVER (PARTIDO)'],
    ['Métrica', 'SOMISA', 'Rival', 'Evaluación / Impacto'],
    ['Pace (Posesiones / 40 min)', singleFactors.pace, singleFactors.pace, `~${(2400 / (singleFactors.pace || 1) / 2).toFixed(1)}s por posesión`],
    ['Offensive Rating (ORtg - Pts/100 pos)', singleFactors.offensiveRating, singleFactors.defensiveRating, `${singlePpp} PPP (Puntos Por Posesión)`],
    ['Defensive Rating (DRtg - Pts recibidos/100 pos)', singleFactors.defensiveRating, singleFactors.offensiveRating, `${singleOppPpp} Opp PPP`],
    ['Net Rating (Diferencial Neto)', singleFactors.netRating, -singleFactors.netRating, singleFactors.netRating >= 0 ? 'Favorable (+)' : 'Desfavorable (-)'],
    ['True Shooting % (TS%)', `${teamTotals.tsPct}%`, '', 'Efectividad real de tiro (2P, 3P y TL)'],
    ['Relación AST / PER', singleAstTo, '', `${teamTotals.as} AST / ${teamTotals.per} PER (${singleAstPct}% canastas asistidas)`],
    ['1. Tiro Efectivo (eFG% - 40%)', `${singleFactors.eFGPct}%`, `${singleFactors.oppEFGPct}%`, singleFactors.eFGPct >= singleFactors.oppEFGPct ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['2. Cuidado de Balón (ToV% - 25%)', `${singleFactors.tovPct}%`, `${singleFactors.oppTovPct}%`, singleFactors.tovPct <= singleFactors.oppTovPct ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['3. Rebote Ofensivo (ORB% - 20%)', `${singleFactors.orbPct}%`, `${100 - singleFactors.drbPct}%`, singleFactors.orbPct >= (100 - singleFactors.drbPct) ? 'Ventaja SOMISA' : 'Ventaja Rival'],
    ['4. Frecuencia Tiros Libres (FTr - 15%)', `${singleFactors.ftRate}%`, `${singleFactors.oppFtRate}%`, singleFactors.ftRate >= singleFactors.oppFtRate ? 'Ventaja SOMISA' : 'Ventaja Rival']
  );

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Planilla de Partido');
  XLSX.writeFile(wb, `SOMISA_Planilla_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.xlsx`);
}

/**
 * EXPORTAR TODOS LOS PARTIDOS EN UN LIBRO EXCEL (UNA HOJA POR PARTIDO + RESUMEN GLOBAL)
 */
export function exportAllGamesExcel(games: Game[]): void {
  const wb = XLSX.utils.book_new();
  const teamTotalsGlobal = computeAggregatedTeamTotals(games);

  // Hoja Inicial: Resumen Global de Eficiencia Avanzada
  const summarySheetData: (string | number)[][] = [
    ['CLUB SOMISA - RESUMEN GLOBAL DE EFICIENCIA AVANZADA Y EVOLUCIÓN DE PARTIDOS'],
    [`Total Partidos: ${games.length} | Récord: ${teamTotalsGlobal.wins}V - ${teamTotalsGlobal.losses}D (${teamTotalsGlobal.winPct}%)`],
    [],
    ['MÉTRICA GLOBAL DE EFICIENCIA AVANZADA', 'VALOR ACUMULADO', 'PROMEDIO / DETALLE'],
    ['Offensive Rating Global (ORtg)', teamTotalsGlobal.offensiveRating, `${teamTotalsGlobal.pointsPerPossession} PPP`],
    ['Defensive Rating Global (DRtg)', teamTotalsGlobal.defensiveRating, `${teamTotalsGlobal.oppPointsPerPossession} Opp PPP`],
    ['Net Rating Global (NetRtg)', teamTotalsGlobal.netRating, `Dif Pts: ${teamTotalsGlobal.pointDiff > 0 ? '+' : ''}${teamTotalsGlobal.pointDiff}`],
    ['Pace Promedio (Posesiones / 40 min)', teamTotalsGlobal.pace, `~${(2400 / (teamTotalsGlobal.pace || 1) / 2).toFixed(1)}s/pos`],
    ['True Shooting Global (TS%)', `${teamTotalsGlobal.trueShootingPct}%`, `eFG%: ${teamTotalsGlobal.eFGPct}%`],
    ['Relación AST / PER Global', teamTotalsGlobal.assistToTurnoverRatio, `AST%: ${teamTotalsGlobal.assistedFGPct}%`],
    ['1. Tiro Efectivo (eFG%)', `${teamTotalsGlobal.eFGPct}%`, `Rival: ${teamTotalsGlobal.oppEFGPct}%`],
    ['2. Cuidado de Balón (ToV%)', `${teamTotalsGlobal.tovPct}%`, `Rival: ${teamTotalsGlobal.oppTovPct}%`],
    ['3. Rebote Ofensivo (ORB%)', `${teamTotalsGlobal.orbPct}%`, `Rival Def: ${teamTotalsGlobal.drbPct}%`],
    ['4. Frecuencia Tiros Libres (FTr)', `${teamTotalsGlobal.ftRate}%`, `Rival: ${teamTotalsGlobal.oppFtRate}%`],
    [],
    ['EVOLUCIÓN PARTIDO A PARTIDO'],
    ['Fecha', 'Rival', 'Competencia', 'Condición', 'Resultado', 'Pace', 'ORtg', 'DRtg', 'Net Rating', 'eFG%', 'ToV%', 'TS%']
  ];

  games.forEach(g => {
    const rTot = calculateTeamRowTotals(g.rows);
    const f = calculateFourFactors(rTot, g.opponentStats);
    summarySheetData.push([
      g.date,
      g.opponentName,
      g.competition,
      g.homeAway === 'home' ? 'Local' : 'Visitante',
      `${g.scoreMyTeam} - ${g.scoreOpponent}`,
      f.pace,
      f.offensiveRating,
      f.defensiveRating,
      f.netRating > 0 ? `+${f.netRating}` : f.netRating,
      `${f.eFGPct}%`,
      `${f.tovPct}%`,
      `${rTot.tsPct}%`
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Eficiencia Global');

  games.forEach((game, index) => {
    const teamTotals = calculateTeamRowTotals(game.rows);
    const factors = calculateFourFactors(teamTotals, game.opponentStats);
    const sheetData: (string | number)[][] = [
      [`PLANILLA OFICIAL - PARTIDO ${index + 1}: ${game.myTeamName} vs ${game.opponentName}`],
      [`Fecha: ${game.date} | Torneo: ${game.competition} | Resultado: ${game.scoreMyTeam} - ${game.scoreOpponent}`],
      [`Eficiencia Avanzada: Pace ${factors.pace} | ORtg ${factors.offensiveRating} | DRtg ${factors.defensiveRating} | NetRtg ${factors.netRating > 0 ? '+' : ''}${factors.netRating} | eFG% ${factors.eFGPct}% | TS% ${teamTotals.tsPct}%`],
      [],
      [
        '#',
        'Jugador',
        'Posición',
        'MIN',
        '2P Conv',
        '2P Int',
        '2P %',
        '3P Conv',
        '3P Int',
        '3P %',
        'TL Conv',
        'TL Int',
        'TL %',
        'Reb Def',
        'Reb Of',
        'Reb Tot',
        'AST',
        'REC',
        'PER',
        'TAP',
        'FC',
        'FR',
        'PTS',
        'VAL'
      ]
    ];

    game.rows.forEach(r => {
      sheetData.push([
        r.playerNumber ?? '',
        r.playerName,
        r.playerPosition || '',
        r.min,
        r.tc,
        r.ti,
        r.tiPct,
        r.c3p,
        r.i3p,
        r.pct3p,
        r.tlc,
        r.tli,
        r.tlPct,
        r.rd,
        r.ro,
        r.rt,
        r.as,
        r.rec,
        r.per,
        r.tap,
        r.fpc,
        r.fpr,
        r.pt,
        r.ptsTot
      ]);
    });

    sheetData.push([
      '∑',
      'TOTALES SOMISA',
      '',
      teamTotals.min,
      teamTotals.tc,
      teamTotals.ti,
      teamTotals.tiPct,
      teamTotals.c3p,
      teamTotals.i3p,
      teamTotals.pct3p,
      teamTotals.tlc,
      teamTotals.tli,
      teamTotals.tlPct,
      teamTotals.rd,
      teamTotals.ro,
      teamTotals.rt,
      teamTotals.as,
      teamTotals.rec,
      teamTotals.per,
      teamTotals.tap,
      teamTotals.fpc,
      teamTotals.fpr,
      teamTotals.pt,
      teamTotals.ptsTot
    ]);

    const cleanSheetName = `P${index + 1}_${game.opponentName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}` || `Partido_${index + 1}`;
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
  });

  XLSX.writeFile(wb, `SOMISA_Todos_Los_Partidos_${games.length}_Partidos.xlsx`);
}

/**
 * EXPORTAR PLANILLA DE UN PARTIDO EN CSV (.csv)
 */
export function exportSingleGameCsv(game: Game): void {
  const teamTotals = calculateTeamRowTotals(game.rows);
  const factors = calculateFourFactors(teamTotals, game.opponentStats);
  const singlePoss = (teamTotals.ti + teamTotals.i3p) + 0.44 * teamTotals.tli - teamTotals.ro + teamTotals.per || 1;
  const oppFgaSingle = game.opponentStats ? game.opponentStats.ti + game.opponentStats.i3p : 0;
  const oppPossSingle = game.opponentStats
    ? (oppFgaSingle + 0.44 * game.opponentStats.tli - game.opponentStats.ro + game.opponentStats.per || singlePoss)
    : singlePoss;
  const singlePpp = Number((game.scoreMyTeam / singlePoss).toFixed(2));
  const singleOppPpp = Number((game.scoreOpponent / oppPossSingle).toFixed(2));
  const singleAstTo = teamTotals.per > 0 ? Number((teamTotals.as / teamTotals.per).toFixed(2)) : teamTotals.as;
  const singleFgm = teamTotals.tc + teamTotals.c3p;
  const singleAstPct = singleFgm > 0 ? Number(((teamTotals.as / singleFgm) * 100).toFixed(1)) : 0;

  const lines: string[] = [
    `"PLANILLA OFICIAL DE PARTIDO: ${game.myTeamName} vs ${game.opponentName}"`,
    `"FECHA: ${game.date} | TORNEO: ${game.competition} | RESULTADO: ${game.scoreMyTeam} - ${game.scoreOpponent}"`,
    '',
    [
      '#',
      'Jugador',
      'Posición',
      'MIN',
      '2PC',
      '2PI',
      '2P%',
      '3PC',
      '3PI',
      '3P%',
      'TLC',
      'TLI',
      'TL%',
      'RD',
      'RO',
      'RT',
      'AS',
      'REC',
      'PER',
      'TAP',
      'FC',
      'FR',
      'PTS',
      'VAL'
    ].join(',')
  ];

  game.rows.forEach(r => {
    lines.push([
      r.playerNumber ?? '',
      `"${r.playerName}"`,
      `"${r.playerPosition || ''}"`,
      r.min,
      r.tc,
      r.ti,
      `${r.tiPct}%`,
      r.c3p,
      r.i3p,
      `${r.pct3p}%`,
      r.tlc,
      r.tli,
      `${r.tlPct}%`,
      r.rd,
      r.ro,
      r.rt,
      r.as,
      r.rec,
      r.per,
      r.tap,
      r.fpc,
      r.fpr,
      r.pt,
      r.ptsTot
    ].join(','));
  });

  lines.push([
    '∑',
    '"TOTALES SOMISA"',
    '""',
    teamTotals.min,
    teamTotals.tc,
    teamTotals.ti,
    `${teamTotals.tiPct}%`,
    teamTotals.c3p,
    teamTotals.i3p,
    `${teamTotals.pct3p}%`,
    teamTotals.tlc,
    teamTotals.tli,
    `${teamTotals.tlPct}%`,
    teamTotals.rd,
    teamTotals.ro,
    teamTotals.rt,
    teamTotals.as,
    teamTotals.rec,
    teamTotals.per,
    teamTotals.tap,
    teamTotals.fpc,
    teamTotals.fpr,
    teamTotals.pt,
    teamTotals.ptsTot
  ].join(','));

  lines.push(
    '',
    `"EFICIENCIA AVANZADA Y 4 FACTORES DE DEAN OLIVER"`,
    'Métrica,SOMISA,Rival,Evaluación',
    `Pace (Posesiones / 40 min),${factors.pace},${factors.pace},~${(2400 / (factors.pace || 1) / 2).toFixed(1)}s/pos`,
    `Offensive Rating (ORtg),${factors.offensiveRating},${factors.defensiveRating},${singlePpp} PPP`,
    `Defensive Rating (DRtg),${factors.defensiveRating},${factors.offensiveRating},${singleOppPpp} Opp PPP`,
    `Net Rating (NetRtg),${factors.netRating},${-factors.netRating},${factors.netRating >= 0 ? 'Favorable (+)' : 'Desfavorable (-)'}`,
    `True Shooting % (TS%),${teamTotals.tsPct}%,"",Efectividad real`,
    `Relación AST / PER,${singleAstTo},"",AST%: ${singleAstPct}%`,
    `1. Tiro Efectivo (eFG%),${factors.eFGPct}%,${factors.oppEFGPct}%,40% peso`,
    `2. Cuidado de Balón (ToV%),${factors.tovPct}%,${factors.oppTovPct}%,25% peso`,
    `3. Rebote Ofensivo (ORB%),${factors.orbPct}%,${100 - factors.drbPct}%,20% peso`,
    `4. Frecuencia Tiros Libres (FTr),${factors.ftRate}%,${factors.oppFtRate}%,15% peso`
  );

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `SOMISA_Planilla_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

