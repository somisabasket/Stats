import { Game } from '../types/basketball';
import { calculateTeamRowTotals } from './calculations';

function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports complete standard Boxscore in exact Excel format
 */
export function exportBoxscoreToCsv(game: Game): void {
  const teamTotals = calculateTeamRowTotals(game.rows);

  const headers = [
    '#', 'Jugador', 'Min.', 'TC', 'TI', 'Ti%', '3PC', '3PI', '3P%', '3PAr', 
    'TLC', 'TLI', 'TL%', 'FTr', 'eFG%', 'TS%', 'ToV%', 
    'RD', 'RO', 'RT', 'AS', 'REC', 'PER', 'Tap', 'FPC', 'FPR', 'Pt', 'Pts Tot'
  ];

  const rows: string[][] = [
    [`CLUB SOMISA - ${game.myTeamName} vs ${game.opponentName}`],
    [`Fecha: ${game.date}`, `Competencia: ${game.competition}`, `Temporada: ${game.season}`],
    [],
    headers
  ];

  game.rows.forEach(r => {
    rows.push([
      r.playerNumber !== undefined ? r.playerNumber.toString() : '',
      `"${r.playerName}"`,
      r.min,
      r.tc.toString(),
      r.ti.toString(),
      `${r.tiPct.toFixed(2)}%`,
      r.c3p.toString(),
      r.i3p.toString(),
      `${r.pct3p.toFixed(2)}%`,
      `${r.ar3p.toFixed(1)}%`,
      r.tlc.toString(),
      r.tli.toString(),
      `${r.tlPct.toFixed(2)}%`,
      `${r.ftr.toFixed(2)}%`,
      `${r.efgPct.toFixed(2)}%`,
      `${r.tsPct.toFixed(2)}%`,
      `${r.tovPct.toFixed(2)}%`,
      r.rd.toString(),
      r.ro.toString(),
      r.rt.toString(),
      r.as.toString(),
      r.rec.toString(),
      r.per.toString(),
      r.tap.toString(),
      r.fpc.toString(),
      r.fpr.toString(),
      r.pt.toString(),
      r.ptsTot.toString()
    ]);
  });

  // Totals Row
  rows.push([
    '',
    'Totales',
    teamTotals.min,
    teamTotals.tc.toString(),
    teamTotals.ti.toString(),
    `${teamTotals.tiPct.toFixed(2)}%`,
    teamTotals.c3p.toString(),
    teamTotals.i3p.toString(),
    `${teamTotals.pct3p.toFixed(2)}%`,
    `${teamTotals.ar3p.toFixed(1)}%`,
    teamTotals.tlc.toString(),
    teamTotals.tli.toString(),
    `${teamTotals.tlPct.toFixed(2)}%`,
    `${teamTotals.ftr.toFixed(2)}%`,
    `${teamTotals.efgPct.toFixed(2)}%`,
    `${teamTotals.tsPct.toFixed(2)}%`,
    `${teamTotals.tovPct.toFixed(2)}%`,
    teamTotals.rd.toString(),
    teamTotals.ro.toString(),
    teamTotals.rt.toString(),
    teamTotals.as.toString(),
    teamTotals.rec.toString(),
    teamTotals.per.toString(),
    teamTotals.tap.toString(),
    teamTotals.fpc.toString(),
    teamTotals.fpr.toString(),
    teamTotals.pt.toString(),
    teamTotals.ptsTot.toString()
  ]);

  const csvContent = rows.map(r => r.join(';')).join('\n'); // Semicolon for Spanish Excel regional settings
  const filename = `Estadisticas_${game.myTeamName}_vs_${game.opponentName}_${game.date}.csv`.replace(/\s+/g, '_');
  downloadCsvFile(csvContent, filename);
}
