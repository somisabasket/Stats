import { jsPDF } from 'jspdf';
import { Game } from '../types/basketball';
import { calculateTeamRowTotals } from './calculations';

export function exportGameReportToPdf(game: Game): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pantone281c = [0, 32, 91]; // #00205B
  const slateText = [30, 41, 59];
  const mutedText = [100, 116, 139];

  // Header Banner
  doc.setFillColor(pantone281c[0], pantone281c[1], pantone281c[2]);
  doc.rect(0, 0, pageWidth, 20, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('HOOPANALYTICS PRO · PLANILLA TÉCNICA OFICIAL POST-PARTIDO', 12, 10);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${game.myTeamName.toUpperCase()} (${game.scoreMyTeam}) vs ${game.opponentName.toUpperCase()} (${game.scoreOpponent}) | ${game.date} | ${game.competition}`, 12, 16);

  doc.text(`Temporada ${game.season} · ${game.homeAway === 'home' ? 'Local' : 'Visitante'}`, pageWidth - 12, 14, { align: 'right' });

  // Main Excel Boxscore Table
  let currentY = 24;
  const teamTotals = calculateTeamRowTotals(game.rows);

  // Table Columns
  // #, Jugador, Min, TC, TI, Ti%, 3PC, 3PI, 3P%, 3PAr, TLC, TLI, TL%, FTr, eFG%, TS%, ToV%, RD, RO, RT, AS, REC, PER, Tap, FPC, FPR, Pt, Pts Tot
  const headers = [
    '#', 'JUGADOR', 'MIN', 'TC', 'TI', 'Ti%', '3PC', '3PI', '3P%', '3PAr', 
    'TLC', 'TLI', 'TL%', 'FTr', 'eFG%', 'TS%', 'ToV%', 
    'RD', 'RO', 'RT', 'AS', 'REC', 'PER', 'Tap', 'FPC', 'FPR', 'Pt', 'Pts Tot'
  ];

  const colWidths = [
    8, 40, 11, 7, 7, 10, 7, 7, 10, 10,
    7, 7, 10, 10, 10, 10, 10,
    7, 7, 8, 7, 7, 7, 7, 7, 7, 9, 11
  ];

  // Draw Header Row
  doc.setFillColor(pantone281c[0], pantone281c[1], pantone281c[2]);
  doc.rect(10, currentY, pageWidth - 20, 6, 'F');
  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);

  let currentX = 10;
  headers.forEach((h, i) => {
    const w = colWidths[i];
    // Special background highlight for 3PAr (red) and factors (green)
    if (h === '3PAr') {
      doc.setFillColor(220, 38, 38);
      doc.rect(currentX, currentY, w, 6, 'F');
      doc.setTextColor(255, 255, 255);
    } else if (['FTr', 'eFG%', 'TS%', 'ToV%'].includes(h)) {
      doc.setFillColor(22, 101, 52);
      doc.rect(currentX, currentY, w, 6, 'F');
      doc.setTextColor(255, 255, 255);
    } else {
      doc.setTextColor(255, 255, 255);
    }

    if (i === 1) {
      doc.text(h, currentX + 2, currentY + 4.2);
    } else {
      doc.text(h, currentX + w / 2, currentY + 4.2, { align: 'center' });
    }
    currentX += w;
  });

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);

  // Rows
  game.rows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, currentY, pageWidth - 20, 5, 'F');
    }

    doc.setTextColor(slateText[0], slateText[1], slateText[2]);
    let xPos = 10;

    const rowData = [
      r.playerNumber !== undefined ? `#${r.playerNumber}` : '-',
      r.playerName.length > 25 ? r.playerName.substring(0, 24) + '.' : r.playerName,
      r.min,
      r.tc.toString(),
      r.ti.toString(),
      `${r.tiPct.toFixed(1)}%`,
      r.c3p.toString(),
      r.i3p.toString(),
      `${r.pct3p.toFixed(1)}%`,
      `${r.ar3p.toFixed(1)}%`,
      r.tlc.toString(),
      r.tli.toString(),
      `${r.tlPct.toFixed(1)}%`,
      `${r.ftr.toFixed(1)}%`,
      `${r.efgPct.toFixed(1)}%`,
      `${r.tsPct.toFixed(1)}%`,
      `${r.tovPct.toFixed(1)}%`,
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
    ];

    rowData.forEach((val, i) => {
      const w = colWidths[i];
      if (i === 0) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(pantone281c[0], pantone281c[1], pantone281c[2]);
        doc.text(val, xPos + w / 2, currentY + 3.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      } else if (i === 1) {
        doc.setFont('helvetica', 'bold');
        doc.text(val, xPos + 2, currentY + 3.5);
        doc.setFont('helvetica', 'normal');
      } else if (i === 26 || i === 27) {
        // Points and Total Points bold
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(pantone281c[0], pantone281c[1], pantone281c[2]);
        doc.text(val, xPos + w / 2, currentY + 3.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(slateText[0], slateText[1], slateText[2]);
      } else {
        doc.text(val, xPos + w / 2, currentY + 3.5, { align: 'center' });
      }
      xPos += w;
    });

    currentY += 5;
  });

  // Totals Row
  doc.setFillColor(pantone281c[0], pantone281c[1], pantone281c[2]);
  doc.rect(10, currentY, pageWidth - 20, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);

  let totX = 10;
  const totData = [
    '',
    'TOTALES',
    teamTotals.min,
    teamTotals.tc.toString(),
    teamTotals.ti.toString(),
    `${teamTotals.tiPct.toFixed(1)}%`,
    teamTotals.c3p.toString(),
    teamTotals.i3p.toString(),
    `${teamTotals.pct3p.toFixed(1)}%`,
    `${teamTotals.ar3p.toFixed(1)}%`,
    teamTotals.tlc.toString(),
    teamTotals.tli.toString(),
    `${teamTotals.tlPct.toFixed(1)}%`,
    `${teamTotals.ftr.toFixed(1)}%`,
    `${teamTotals.efgPct.toFixed(1)}%`,
    `${teamTotals.tsPct.toFixed(1)}%`,
    `${teamTotals.tovPct.toFixed(1)}%`,
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
  ];

  totData.forEach((val, i) => {
    const w = colWidths[i];
    if (i === 0) {
      doc.text(val, totX + 2, currentY + 4.2);
    } else {
      doc.text(val, totX + w / 2, currentY + 4.2, { align: 'center' });
    }
    totX += w;
  });

  currentY += 10;

  // Footer notes & Team summary
  doc.setTextColor(slateText[0], slateText[1], slateText[2]);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMEN DE EFICIENCIA Y CUATRO FACTORES DE DEAN OLIVER:', 10, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  currentY += 4.5;
  const summaryStr = `· Puntos Totales: ${teamTotals.pt} | Tiro Efectivo (eFG%): ${teamTotals.efgPct.toFixed(1)}% | True Shooting (TS%): ${teamTotals.tsPct.toFixed(1)}% | Pérdidas (ToV%): ${teamTotals.tovPct.toFixed(1)}% | Frecuencia Triples (3PAr): ${teamTotals.ar3p.toFixed(1)}% | Rebotes: ${teamTotals.rt} (Ofensivos: ${teamTotals.ro}, Defensivos: ${teamTotals.rd}) | Asistencias: ${teamTotals.as} | Robos: ${teamTotals.rec} | Tapones: ${teamTotals.tap}`;
  doc.text(summaryStr, 10, currentY);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
  doc.text(
    `HoopAnalytics Pro · Base Pantone 281 C (#00205B) · Generado el ${new Date().toLocaleString()}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  const cleanTitle = `Reporte_${game.myTeamName}_vs_${game.opponentName}_${game.date}`.replace(/\s+/g, '_');
  doc.save(`${cleanTitle}.pdf`);
}
