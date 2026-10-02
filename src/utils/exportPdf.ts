import jsPDF from 'jspdf';
import { Game } from '../types/basketball';
import { calculateTeamRowTotals, calculateFourFactors } from './calculations';
import { computeAggregatedPlayers, computeAggregatedTeamTotals } from './exportCsv';

/**
 * Loads the official SOMISA crest image for embedding into PDF documents
 */
function loadCrestImage(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = () => resolve(null);
      fallback.src = '/somisa_crest.jpg';
    };
    img.src = '/somisa_crest.jpg';
  });
}

/**
 * Common Header with Club SOMISA Official Crest and Pantone 281 C branding
 */
function drawHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  pageNum: number,
  totalPages: number,
  crestImg: HTMLImageElement | null
) {
  // Top Banner Pantone 281 C #00205B
  doc.setFillColor(0, 32, 91);
  doc.rect(0, 0, 297, 24, 'F');

  // Basketball orange accent line
  doc.setFillColor(230, 81, 0);
  doc.rect(0, 23, 297, 1.2, 'F');

  // Embed official Somisa Crest if available
  let textX = 14;
  if (crestImg) {
    try {
      // Draw white circular backing for crest
      doc.setFillColor(255, 255, 255);
      doc.circle(20, 12, 9.5, 'F');
      doc.addImage(crestImg, 'JPEG', 11, 3, 18, 18);
      textX = 34;
    } catch {
      textX = 14;
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CLUB SOMISA - BÁSQUETBOL SAN NICOLÁS', textX, 9.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(title.toUpperCase(), textX, 15.5);

  doc.setFontSize(7.5);
  doc.setTextColor(190, 215, 255);
  doc.text(subtitle, textX, 20.5);

  // Page number
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`Página ${pageNum} de ${totalPages}`, 283, 13, { align: 'right' });
}

function drawFooter(doc: jsPDF) {
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 202, 297, 8, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Club SOMISA San Nicolás · Sistema Técnico Estadístico Oficial de Básquetbol (CABB / FBB / FIBA)', 148, 207, { align: 'center' });
}

/**
 * EXPORTACIÓN COMPLETA (TODOS LOS APARTADOS):
 * Página 1: Planilla Oficial de Partido (Box Score)
 * Página 2: Resumen del Equipo & 4 Factores de Dean Oliver
 * Página 3: Resumen Individual de la Plantilla (Promedios y Totales)
 */
export async function exportComprehensivePdf(game: Game, allGames: Game[] = [game]): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const teamTotals = calculateTeamRowTotals(game.rows);
  const factors = calculateFourFactors(teamTotals, game.opponentStats);
  const aggPlayers = computeAggregatedPlayers(allGames);

  // =========================================================================
  // PÁGINA 1: PLANILLA OFICIAL DE PARTIDO (BOX SCORE)
  // =========================================================================
  drawHeader(
    doc,
    `Planilla Técnica Oficial · ${game.myTeamName} vs ${game.opponentName}`,
    `Fecha: ${game.date} | Competición: ${game.competition} | Temporada: ${game.season} | Condición: ${game.homeAway === 'home' ? 'Local' : 'Visitante'}`,
    1,
    3,
    crestImg
  );

  // Score Badge
  doc.setFillColor(238, 243, 250);
  doc.roundedRect(210, 5, 55, 14, 2, 2, 'F');
  doc.setTextColor(0, 32, 91);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${game.scoreMyTeam} - ${game.scoreOpponent}`, 237.5, 14, { align: 'center' });

  // Box Score Table Headers
  const startY = 32;
  const colX = [10, 18, 55, 70, 85, 100, 115, 130, 145, 160, 175, 190, 205, 220, 235, 250, 265, 280];
  const headers = ['#', 'Jugador', 'MIN', '2PC/I', '2P%', '3PC/I', '3P%', 'TLC/I', 'TL%', 'REB', 'AST', 'REC', 'PER', 'TAP', 'FC/FR', 'PTS', 'VAL'];

  doc.setFillColor(241, 245, 249);
  doc.rect(8, startY - 5, 281, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  headers.forEach((h, i) => {
    doc.text(h, colX[i] + (i === 1 ? 0 : 4), startY, { align: i === 1 ? 'left' : 'center' });
  });

  let currentY = startY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  game.rows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(8, currentY - 4.5, 281, 6, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(r.playerNumber ?? '-'), colX[0] + 4, currentY, { align: 'center' });
    doc.text(r.playerName, colX[1], currentY, { align: 'left' });
    doc.text(r.min, colX[2] + 4, currentY, { align: 'center' });
    doc.text(`${r.tc}/${r.ti}`, colX[3] + 4, currentY, { align: 'center' });
    doc.text(`${r.tiPct}%`, colX[4] + 4, currentY, { align: 'center' });
    doc.text(`${r.c3p}/${r.i3p}`, colX[5] + 4, currentY, { align: 'center' });
    doc.text(`${r.pct3p}%`, colX[6] + 4, currentY, { align: 'center' });
    doc.text(`${r.tlc}/${r.tli}`, colX[7] + 4, currentY, { align: 'center' });
    doc.text(`${r.tlPct}%`, colX[8] + 4, currentY, { align: 'center' });
    doc.text(String(r.rt), colX[9] + 4, currentY, { align: 'center' });
    doc.text(String(r.as), colX[10] + 4, currentY, { align: 'center' });
    doc.text(String(r.rec), colX[11] + 4, currentY, { align: 'center' });
    doc.text(String(r.per), colX[12] + 4, currentY, { align: 'center' });
    doc.text(String(r.tap), colX[13] + 4, currentY, { align: 'center' });
    doc.text(`${r.fpc}/${r.fpr}`, colX[14] + 4, currentY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(String(r.pt), colX[15] + 4, currentY, { align: 'center' });
    doc.text(String(r.ptsTot), colX[16] + 4, currentY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    currentY += 6;
  });

  // Totales SOMISA
  doc.setFillColor(0, 32, 91);
  doc.rect(8, currentY - 4.5, 281, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTALES SOMISA', colX[1], currentY, { align: 'left' });
  doc.text(teamTotals.min, colX[2] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.tc}/${teamTotals.ti}`, colX[3] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.tiPct}%`, colX[4] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.c3p}/${teamTotals.i3p}`, colX[5] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.pct3p}%`, colX[6] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.tlc}/${teamTotals.tli}`, colX[7] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.tlPct}%`, colX[8] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.rt), colX[9] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.as), colX[10] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.rec), colX[11] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.per), colX[12] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.tap), colX[13] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.fpc}/${teamTotals.fpr}`, colX[14] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.pt), colX[15] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.ptsTot), colX[16] + 4, currentY, { align: 'center' });

  // Totales Rival (si existen)
  if (game.opponentStats) {
    currentY += 6.5;
    const opp = game.opponentStats;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, currentY - 4.5, 281, 6, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTALES ${game.opponentName}`, colX[1], currentY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${opp.tc}/${opp.ti}`, colX[3] + 4, currentY, { align: 'center' });
    doc.text(`${opp.ti > 0 ? ((opp.tc / opp.ti) * 100).toFixed(0) : 0}%`, colX[4] + 4, currentY, { align: 'center' });
    doc.text(`${opp.c3p}/${opp.i3p}`, colX[5] + 4, currentY, { align: 'center' });
    doc.text(`${opp.i3p > 0 ? ((opp.c3p / opp.i3p) * 100).toFixed(0) : 0}%`, colX[6] + 4, currentY, { align: 'center' });
    doc.text(`${opp.tlc}/${opp.tli}`, colX[7] + 4, currentY, { align: 'center' });
    doc.text(`${opp.tli > 0 ? ((opp.tlc / opp.tli) * 100).toFixed(0) : 0}%`, colX[8] + 4, currentY, { align: 'center' });
    doc.text(String(opp.rd + opp.ro), colX[9] + 4, currentY, { align: 'center' });
    doc.text(String(opp.as), colX[10] + 4, currentY, { align: 'center' });
    doc.text(String(opp.rec), colX[11] + 4, currentY, { align: 'center' });
    doc.text(String(opp.per), colX[12] + 4, currentY, { align: 'center' });
    doc.text(String(opp.tap), colX[13] + 4, currentY, { align: 'center' });
    doc.text(String(opp.fpc), colX[14] + 4, currentY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(String(opp.pts), colX[15] + 4, currentY, { align: 'center' });
  }

  drawFooter(doc);

  // =========================================================================
  // PÁGINA 2: RESUMEN DEL EQUIPO & 4 FACTORES DE DEAN OLIVER
  // =========================================================================
  doc.addPage('a4', 'landscape');
  drawHeader(
    doc,
    'Resumen Colectivo del Equipo & Análisis de los 4 Factores (Dean Oliver)',
    `Evaluación táctica de posesiones, eficiencias y balance de juego vs ${game.opponentName}`,
    2,
    3,
    crestImg
  );

  // 4 Top Cards
  const cardW = 66;
  const cardH = 26;
  const cardY = 32;

  // Card 1: Puntos
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PUNTOS FINALES', 14, cardY + 7);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(`${game.scoreMyTeam} - ${game.scoreOpponent}`, 14, cardY + 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`SOMISA vs ${game.opponentName}`, 14, cardY + 23);

  // Card 2: Posesiones (Pace)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(80, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RITMO / POSESIONES (PACE)', 84, cardY + 7);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 81, 0);
  doc.text(String(factors.pace), 84, cardY + 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Posesiones estimadas en 40 min', 84, cardY + 23);

  // Card 3: Offensive Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(150, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RATING OFENSIVO', 154, cardY + 7);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(String(factors.offensiveRating), 154, cardY + 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Puntos anotados cada 100 posesiones', 154, cardY + 23);

  // Card 4: Net Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(220, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RATING NETO (+/- NETO)', 224, cardY + 7);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(factors.netRating >= 0 ? 16 : 239, factors.netRating >= 0 ? 185 : 68, factors.netRating >= 0 ? 129 : 68);
  doc.text(factors.netRating > 0 ? `+${factors.netRating}` : String(factors.netRating), 224, cardY + 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Defensive Rating: ${factors.defensiveRating}`, 224, cardY + 23);

  // Four Factors Section Header
  doc.setFillColor(0, 32, 91);
  doc.rect(10, 65, 276, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS DE LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER)', 14, 70);

  const factorTableY = 74;
  const factorRows = [
    {
      factor: '1. Tiro Efectivo (eFG%)',
      weight: '40% del resultado',
      somisa: `${factors.eFGPct}%`,
      rival: `${factors.oppEFGPct}%`,
      diff: `${(factors.eFGPct - factors.oppEFGPct).toFixed(1)}%`,
      desc: 'Mide la efectividad ponderada de tiros dobles y triples.'
    },
    {
      factor: '2. Cuidado de Balón (ToV%)',
      weight: '25% del resultado',
      somisa: `${factors.tovPct}%`,
      rival: `${factors.oppTovPct}%`,
      diff: `${(factors.tovPct - factors.oppTovPct).toFixed(1)}%`,
      desc: 'Porcentaje de posesiones que terminan en pérdida de balón.'
    },
    {
      factor: '3. Rebote Ofensivo (ORB%)',
      weight: '20% del resultado',
      somisa: `${factors.orbPct}%`,
      rival: `${100 - factors.drbPct}%`,
      diff: `${(factors.orbPct - (100 - factors.drbPct)).toFixed(1)}%`,
      desc: 'Porcentaje de rebotes ofensivos disponibles capturados.'
    },
    {
      factor: '4. Frecuencia de Libres (FTr)',
      weight: '15% del resultado',
      somisa: `${factors.ftRate}%`,
      rival: `${factors.oppFtRate}%`,
      diff: `${(factors.ftRate - factors.oppFtRate).toFixed(1)}%`,
      desc: 'Capacidad de conseguir tiros libres por cada tiro de campo intentado.'
    }
  ];

  // Factors Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(10, factorTableY, 276, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Factor / Fundamento', 14, factorTableY + 5);
  doc.text('Importancia', 75, factorTableY + 5);
  doc.text('SOMISA', 125, factorTableY + 5, { align: 'center' });
  doc.text('Rival', 160, factorTableY + 5, { align: 'center' });
  doc.text('Diferencia', 195, factorTableY + 5, { align: 'center' });
  doc.text('Definición e Impacto', 225, factorTableY + 5);

  let fY = factorTableY + 8;
  doc.setFont('helvetica', 'normal');
  factorRows.forEach((fr, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, fY - 4, 276, 9, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.text(fr.factor, 14, fY + 2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(fr.weight, 75, fY + 2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fr.somisa, 125, fY + 2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(fr.rival, 160, fY + 2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(fr.diff, 195, fY + 2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text(fr.desc, 225, fY + 2);
    doc.setFontSize(8.5);

    fY += 9;
  });

  // Points Breakdown Box
  const pBreakY = 124;
  doc.setFillColor(0, 32, 91);
  doc.rect(10, pBreakY, 276, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DESGLOSE DE PUNTOS Y DISTRIBUCIÓN DEL TIRO (SOMISA)', 14, pBreakY + 5);

  const pts2 = teamTotals.tc * 2;
  const pts3 = teamTotals.c3p * 3;
  const ptsFt = teamTotals.tlc;
  const totalPts = teamTotals.pt || 1;

  const pctPts2 = ((pts2 / totalPts) * 100).toFixed(1);
  const pctPts3 = ((pts3 / totalPts) * 100).toFixed(1);
  const pctPtsFt = ((ptsFt / totalPts) * 100).toFixed(1);

  doc.setFillColor(248, 250, 252);
  doc.rect(10, pBreakY + 8, 276, 25, 'F');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`• Tiros de 2 Puntos (Dobles): ${pts2} pts (${pctPts2}% de la anotación) | ${teamTotals.tc} convertidos de ${teamTotals.ti} intentados (${teamTotals.tiPct}%)`, 16, pBreakY + 15);
  doc.text(`• Tiros de 3 Puntos (Triples): ${pts3} pts (${pctPts3}% de la anotación) | ${teamTotals.c3p} convertidos de ${teamTotals.i3p} intentados (${teamTotals.pct3p}%)`, 16, pBreakY + 22);
  doc.text(`• Tiros Libres (TL): ${ptsFt} pts (${pctPtsFt}% de la anotación) | ${teamTotals.tlc} convertidos de ${teamTotals.tli} intentados (${teamTotals.tlPct}%)`, 16, pBreakY + 29);

  drawFooter(doc);

  // =========================================================================
  // PÁGINA 3: RESUMEN INDIVIDUAL DE LA PLANTILLA (TEMPORADA)
  // =========================================================================
  doc.addPage('a4', 'landscape');
  drawHeader(
    doc,
    'Resumen Individual y Promedios Acumulados de la Plantilla',
    `Estadísticas globales de jugadores de Club SOMISA · Total Partidos Computados: ${allGames.length}`,
    3,
    3,
    crestImg
  );

  const aggStartY = 32;
  const aggColX = [10, 18, 65, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280];
  const aggHeaders = [
    '#',
    'Jugador',
    'Posición',
    'PJ',
    'PTS/PJ',
    'REB/PJ',
    'AST/PJ',
    '2P%',
    '3P%',
    'TL%',
    'PTS Tot',
    'REB Tot',
    'AST Tot',
    'VAL/PJ'
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(8, aggStartY - 5, 281, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  aggHeaders.forEach((h, i) => {
    doc.text(h, aggColX[i] + (i === 1 ? 0 : 4), aggStartY, { align: i === 1 ? 'left' : 'center' });
  });

  let aY = aggStartY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  aggPlayers.forEach((p, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(8, aY - 4.5, 281, 6, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(p.number ?? '-'), aggColX[0] + 4, aY, { align: 'center' });
    doc.text(p.name, aggColX[1], aY, { align: 'left' });
    doc.text(p.position || '-', aggColX[2] + 4, aY, { align: 'center' });
    doc.text(String(p.gamesPlayed), aggColX[3] + 4, aY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(String(p.avgPoints), aggColX[4] + 4, aY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    doc.text(String(p.avgRebounds), aggColX[5] + 4, aY, { align: 'center' });
    doc.text(String(p.avgAssists), aggColX[6] + 4, aY, { align: 'center' });
    doc.text(`${p.pct2p}%`, aggColX[7] + 4, aY, { align: 'center' });
    doc.text(`${p.pct3p}%`, aggColX[8] + 4, aY, { align: 'center' });
    doc.text(`${p.pctFt}%`, aggColX[9] + 4, aY, { align: 'center' });
    doc.text(String(p.totalPoints), aggColX[10] + 4, aY, { align: 'center' });
    doc.text(String(p.totalRebounds), aggColX[11] + 4, aY, { align: 'center' });
    doc.text(String(p.totalAssists), aggColX[12] + 4, aY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(String(p.avgValuation), aggColX[13] + 4, aY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    aY += 6;
  });

  drawFooter(doc);

  // Save PDF
  doc.save(`SOMISA_Reporte_Completo_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.pdf`);
}

/**
 * Alias exported as exportGameToPdf to maintain full backwards-compatibility
 */
export async function exportGameToPdf(game: Game, allGames: Game[] = [game]): Promise<void> {
  return exportComprehensivePdf(game, allGames);
}

/**
 * EXPORTACIÓN INDIVIDUAL: Solo Resumen del Equipo & 4 Factores
 */
export async function exportTeamSummaryPdf(game: Game): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const teamTotals = calculateTeamRowTotals(game.rows);
  const factors = calculateFourFactors(teamTotals, game.opponentStats);

  drawHeader(
    doc,
    'Resumen Colectivo del Equipo & Análisis de los 4 Factores',
    `Evaluación táctica de posesiones y balance de juego vs ${game.opponentName} (${game.date})`,
    1,
    1,
    crestImg
  );

  const cardW = 66;
  const cardH = 26;
  const cardY = 32;

  // Card 1: Puntos
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PUNTOS FINALES', 14, cardY + 7);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(`${game.scoreMyTeam} - ${game.scoreOpponent}`, 14, cardY + 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`SOMISA vs ${game.opponentName}`, 14, cardY + 23);

  // Card 2: Posesiones
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(80, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RITMO / POSESIONES (PACE)', 84, cardY + 7);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 81, 0);
  doc.text(String(factors.pace), 84, cardY + 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Posesiones estimadas en 40 min', 84, cardY + 23);

  // Card 3: Off Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(150, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RATING OFENSIVO', 154, cardY + 7);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(String(factors.offensiveRating), 154, cardY + 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Puntos cada 100 posesiones', 154, cardY + 23);

  // Card 4: Net Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(220, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RATING NETO (+/-)', 224, cardY + 7);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(factors.netRating >= 0 ? 16 : 239, factors.netRating >= 0 ? 185 : 68, factors.netRating >= 0 ? 129 : 68);
  doc.text(factors.netRating > 0 ? `+${factors.netRating}` : String(factors.netRating), 224, cardY + 17);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Defensive Rating: ${factors.defensiveRating}`, 224, cardY + 23);

  // Four Factors Table
  doc.setFillColor(0, 32, 91);
  doc.rect(10, 65, 276, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS DE LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER)', 14, 70);

  const factorTableY = 74;
  const factorRows = [
    { factor: '1. Tiro Efectivo (eFG%)', weight: '40% del resultado', somisa: `${factors.eFGPct}%`, rival: `${factors.oppEFGPct}%`, diff: `${(factors.eFGPct - factors.oppEFGPct).toFixed(1)}%`, desc: 'Efectividad ponderada de campo.' },
    { factor: '2. Cuidado de Balón (ToV%)', weight: '25% del resultado', somisa: `${factors.tovPct}%`, rival: `${factors.oppTovPct}%`, diff: `${(factors.tovPct - factors.oppTovPct).toFixed(1)}%`, desc: '% posesiones perdidas.' },
    { factor: '3. Rebote Ofensivo (ORB%)', weight: '20% del resultado', somisa: `${factors.orbPct}%`, rival: `${100 - factors.drbPct}%`, diff: `${(factors.orbPct - (100 - factors.drbPct)).toFixed(1)}%`, desc: '% rebotes ofensivos disponibles.' },
    { factor: '4. Frecuencia de Libres (FTr)', weight: '15% del resultado', somisa: `${factors.ftRate}%`, rival: `${factors.oppFtRate}%`, diff: `${(factors.ftRate - factors.oppFtRate).toFixed(1)}%`, desc: 'Tiros libres por tiro de campo.' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, factorTableY, 276, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Factor / Fundamento', 14, factorTableY + 5);
  doc.text('Importancia', 75, factorTableY + 5);
  doc.text('SOMISA', 125, factorTableY + 5, { align: 'center' });
  doc.text('Rival', 160, factorTableY + 5, { align: 'center' });
  doc.text('Diferencia', 195, factorTableY + 5, { align: 'center' });
  doc.text('Definición e Impacto', 225, factorTableY + 5);

  let fY = factorTableY + 8;
  doc.setFont('helvetica', 'normal');
  factorRows.forEach((fr, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, fY - 4, 276, 9, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.text(fr.factor, 14, fY + 2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(fr.weight, 75, fY + 2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fr.somisa, 125, fY + 2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(fr.rival, 160, fY + 2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(fr.diff, 195, fY + 2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text(fr.desc, 225, fY + 2);
    doc.setFontSize(8.5);

    fY += 9;
  });

  drawFooter(doc);
  doc.save(`SOMISA_Resumen_Equipo_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.pdf`);
}

/**
 * EXPORTACIÓN INDIVIDUAL: Solo Resumen Individual de la Plantilla
 */
export async function exportPlayerSummaryPdf(allGames: Game[]): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const aggPlayers = computeAggregatedPlayers(allGames);

  drawHeader(
    doc,
    'Resumen Individual y Promedios Acumulados de Jugadores',
    `Club SOMISA San Nicolás · Total de Partidos Computados: ${allGames.length}`,
    1,
    1,
    crestImg
  );

  const aggStartY = 32;
  const aggColX = [10, 18, 65, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280];
  const aggHeaders = [
    '#',
    'Jugador',
    'Posición',
    'PJ',
    'PTS/PJ',
    'REB/PJ',
    'AST/PJ',
    '2P%',
    '3P%',
    'TL%',
    'PTS Tot',
    'REB Tot',
    'AST Tot',
    'VAL/PJ'
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(8, aggStartY - 5, 281, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  aggHeaders.forEach((h, i) => {
    doc.text(h, aggColX[i] + (i === 1 ? 0 : 4), aggStartY, { align: i === 1 ? 'left' : 'center' });
  });

  let aY = aggStartY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  aggPlayers.forEach((p, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(8, aY - 4.5, 281, 6, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(p.number ?? '-'), aggColX[0] + 4, aY, { align: 'center' });
    doc.text(p.name, aggColX[1], aY, { align: 'left' });
    doc.text(p.position || '-', aggColX[2] + 4, aY, { align: 'center' });
    doc.text(String(p.gamesPlayed), aggColX[3] + 4, aY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(String(p.avgPoints), aggColX[4] + 4, aY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    doc.text(String(p.avgRebounds), aggColX[5] + 4, aY, { align: 'center' });
    doc.text(String(p.avgAssists), aggColX[6] + 4, aY, { align: 'center' });
    doc.text(`${p.pct2p}%`, aggColX[7] + 4, aY, { align: 'center' });
    doc.text(`${p.pct3p}%`, aggColX[8] + 4, aY, { align: 'center' });
    doc.text(`${p.pctFt}%`, aggColX[9] + 4, aY, { align: 'center' });
    doc.text(String(p.totalPoints), aggColX[10] + 4, aY, { align: 'center' });
    doc.text(String(p.totalRebounds), aggColX[11] + 4, aY, { align: 'center' });
    doc.text(String(p.totalAssists), aggColX[12] + 4, aY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(String(p.avgValuation), aggColX[13] + 4, aY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    aY += 6;
  });

  drawFooter(doc);
  doc.save(`SOMISA_Resumen_Individual_Plantilla_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * EXPORTAR RESUMEN TOTAL DE TEMPORADA (EQUIPO E INDIVIDUAL) EN PDF
 * Página 1: Resumen Total del Equipo (Récord, Pace, Ratings, 4 Factores) con escudo oficial
 * Página 2: Resumen Total Individual (Plantilla de jugadores) con escudo oficial
 */
export async function exportSeasonTotalsPdf(games: Game[]): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const teamTotals = computeAggregatedTeamTotals(games);
  const aggPlayers = computeAggregatedPlayers(games);

  // ==================== PÁGINA 1: RESUMEN TOTAL DEL EQUIPO ====================
  drawHeader(
    doc,
    'Resumen Total del Equipo · Métricas Globales Acumuladas',
    `Temporada Oficial · Partidos Computados: ${games.length} | Balance: ${teamTotals.wins} Victorias - ${teamTotals.losses} Derrotas (${teamTotals.winPct}%)`,
    1,
    2,
    crestImg
  );

  // 4 Top Cards
  const cardW = 66;
  const cardH = 26;
  const cardY = 32;

  // Card 1: Balance y Puntos
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RÉCORD Y BALANCE TOTAL', 14, cardY + 7);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(`${teamTotals.wins}V - ${teamTotals.losses}D (${teamTotals.winPct}%)`, 14, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${teamTotals.totalPoints} pts anotados (${teamTotals.avgPoints}/pj)`, 14, cardY + 22);

  // Card 2: Posesiones
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(80, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RITMO / POSESIONES (PACE)', 84, cardY + 7);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 81, 0);
  doc.text(String(teamTotals.pace), 84, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Posesiones promedio / 40 min', 84, cardY + 22);

  // Card 3: Offensive Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(150, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RATING OFENSIVO GLOBAL', 154, cardY + 7);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(String(teamTotals.offensiveRating), 154, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Puntos cada 100 posesiones', 154, cardY + 22);

  // Card 4: Net Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(220, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RATING NETO (+/-)', 224, cardY + 7);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(teamTotals.netRating >= 0 ? 16 : 239, teamTotals.netRating >= 0 ? 185 : 68, teamTotals.netRating >= 0 ? 129 : 68);
  doc.text(teamTotals.netRating > 0 ? `+${teamTotals.netRating}` : String(teamTotals.netRating), 224, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Defensive Rating: ${teamTotals.defensiveRating}`, 224, cardY + 22);

  // Four Factors Section Header
  doc.setFillColor(0, 32, 91);
  doc.rect(10, 65, 276, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER) · ACUMULADO DE TEMPORADA', 14, 70);

  const factorTableY = 74;
  const factorRows = [
    { factor: '1. Tiro Efectivo (eFG%)', weight: '40% del resultado', somisa: `${teamTotals.eFGPct}%`, rival: `${teamTotals.oppEFGPct}%`, diff: `${(teamTotals.eFGPct - teamTotals.oppEFGPct).toFixed(1)}%`, desc: 'Efectividad ponderada de tiros dobles y triples.' },
    { factor: '2. Cuidado de Balón (ToV%)', weight: '25% del resultado', somisa: `${teamTotals.tovPct}%`, rival: `${teamTotals.oppTovPct}%`, diff: `${(teamTotals.tovPct - teamTotals.oppTovPct).toFixed(1)}%`, desc: '% de posesiones que terminan en pérdida.' },
    { factor: '3. Rebote Ofensivo (ORB%)', weight: '20% del resultado', somisa: `${teamTotals.orbPct}%`, rival: `${100 - teamTotals.drbPct}%`, diff: `${(teamTotals.orbPct - (100 - teamTotals.drbPct)).toFixed(1)}%`, desc: '% de rebotes ofensivos disponibles atrapados.' },
    { factor: '4. Frecuencia de Libres (FTr)', weight: '15% del resultado', somisa: `${teamTotals.ftRate}%`, rival: `${teamTotals.oppFtRate}%`, diff: `${(teamTotals.ftRate - teamTotals.oppFtRate).toFixed(1)}%`, desc: 'Capacidad de ir a la línea de tiros libres.' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, factorTableY, 276, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Factor / Fundamento', 14, factorTableY + 5);
  doc.text('Importancia', 75, factorTableY + 5);
  doc.text('SOMISA', 125, factorTableY + 5, { align: 'center' });
  doc.text('Rivales', 160, factorTableY + 5, { align: 'center' });
  doc.text('Diferencia', 195, factorTableY + 5, { align: 'center' });
  doc.text('Definición e Impacto', 225, factorTableY + 5);

  let fY = factorTableY + 8;
  doc.setFont('helvetica', 'normal');
  factorRows.forEach((fr, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, fY - 4, 276, 9, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.text(fr.factor, 14, fY + 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(fr.weight, 75, fY + 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fr.somisa, 125, fY + 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(fr.rival, 160, fY + 2, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(fr.diff, 195, fY + 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.text(fr.desc, 225, fY + 2);
    doc.setFontSize(8.5);
    fY += 9;
  });

  // Totales y Promedios Colectivos
  const pBreakY = 122;
  doc.setFillColor(0, 32, 91);
  doc.rect(10, pBreakY, 276, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VOLUMEN DE JUEGO Y TOTALES COLECTIVOS DE LA TEMPORADA', 14, pBreakY + 5);

  doc.setFillColor(248, 250, 252);
  doc.rect(10, pBreakY + 8, 276, 32, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`• Tiros de 2 Puntos (Dobles): ${teamTotals.tc}/${teamTotals.ti} (${teamTotals.tiPct}%) | ${(teamTotals.tc / games.length).toFixed(1)} anotados por partido`, 16, pBreakY + 15);
  doc.text(`• Tiros de 3 Puntos (Triples): ${teamTotals.c3p}/${teamTotals.i3p} (${teamTotals.pct3p}%) | ${(teamTotals.c3p / games.length).toFixed(1)} anotados por partido`, 16, pBreakY + 22);
  doc.text(`• Tiros Libres (TL): ${teamTotals.tlc}/${teamTotals.tli} (${teamTotals.tlPct}%) | ${(teamTotals.tlc / games.length).toFixed(1)} anotados por partido`, 16, pBreakY + 29);
  doc.text(`• Rebotes: ${teamTotals.rt} totales (${teamTotals.avgRebounds}/pj) | Asistencias: ${teamTotals.as} (${teamTotals.avgAssists}/pj) | Recuperos: ${teamTotals.rec} (${teamTotals.avgSteals}/pj)`, 16, pBreakY + 36);

  drawFooter(doc);

  // ==================== PÁGINA 2: RESUMEN TOTAL INDIVIDUAL ====================
  doc.addPage('a4', 'landscape');
  drawHeader(
    doc,
    'Resumen Total Individual · Estadísticas Acumuladas de Jugadores',
    `Plantilla Oficial de Club SOMISA · Total Partidos Computados: ${games.length}`,
    2,
    2,
    crestImg
  );

  const aggStartY = 32;
  const aggColX = [10, 18, 65, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280];
  const aggHeaders = [
    '#',
    'Jugador',
    'Posición',
    'PJ',
    'PTS/PJ',
    'REB/PJ',
    'AST/PJ',
    '2P%',
    '3P%',
    'TL%',
    'PTS Tot',
    'REB Tot',
    'AST Tot',
    'VAL/PJ'
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(8, aggStartY - 5, 281, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  aggHeaders.forEach((h, i) => {
    doc.text(h, aggColX[i] + (i === 1 ? 0 : 4), aggStartY, { align: i === 1 ? 'left' : 'center' });
  });

  let aY = aggStartY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  aggPlayers.forEach((p, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(8, aY - 4.5, 281, 6, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(p.number ?? '-'), aggColX[0] + 4, aY, { align: 'center' });
    doc.text(p.name, aggColX[1], aY, { align: 'left' });
    doc.text(p.position || '-', aggColX[2] + 4, aY, { align: 'center' });
    doc.text(String(p.gamesPlayed), aggColX[3] + 4, aY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.text(String(p.avgPoints), aggColX[4] + 4, aY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    doc.text(String(p.avgRebounds), aggColX[5] + 4, aY, { align: 'center' });
    doc.text(String(p.avgAssists), aggColX[6] + 4, aY, { align: 'center' });
    doc.text(`${p.pct2p}%`, aggColX[7] + 4, aY, { align: 'center' });
    doc.text(`${p.pct3p}%`, aggColX[8] + 4, aY, { align: 'center' });
    doc.text(`${p.pctFt}%`, aggColX[9] + 4, aY, { align: 'center' });
    doc.text(String(p.totalPoints), aggColX[10] + 4, aY, { align: 'center' });
    doc.text(String(p.totalRebounds), aggColX[11] + 4, aY, { align: 'center' });
    doc.text(String(p.totalAssists), aggColX[12] + 4, aY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(String(p.avgValuation), aggColX[13] + 4, aY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    aY += 6;
  });

  drawFooter(doc);
  doc.save(`SOMISA_Resumen_Total_Temporada_Equipo_e_Individual.pdf`);
}

/**
 * EXPORTAR PLANILLA DE UN SOLO PARTIDO EN PDF (A4 Apaisado con escudo)
 */
export async function exportSingleGamePdf(game: Game): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const teamTotals = calculateTeamRowTotals(game.rows);

  drawHeader(
    doc,
    `Planilla Técnica Oficial · ${game.myTeamName} vs ${game.opponentName}`,
    `Fecha: ${game.date} | Torneo: ${game.competition} | Condición: ${game.homeAway === 'home' ? 'Local' : 'Visitante'}`,
    1,
    1,
    crestImg
  );

  // Score Badge
  doc.setFillColor(238, 243, 250);
  doc.roundedRect(210, 5, 55, 14, 2, 2, 'F');
  doc.setTextColor(0, 32, 91);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${game.scoreMyTeam} - ${game.scoreOpponent}`, 237.5, 14, { align: 'center' });

  // Box Score Table
  const startY = 32;
  const colX = [10, 18, 55, 70, 85, 100, 115, 130, 145, 160, 175, 190, 205, 220, 235, 250, 265, 280];
  const headers = ['#', 'Jugador', 'MIN', '2PC/I', '2P%', '3PC/I', '3P%', 'TLC/I', 'TL%', 'REB', 'AST', 'REC', 'PER', 'TAP', 'FC/FR', 'PTS', 'VAL'];

  doc.setFillColor(241, 245, 249);
  doc.rect(8, startY - 5, 281, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');

  headers.forEach((h, i) => {
    doc.text(h, colX[i] + (i === 1 ? 0 : 4), startY, { align: i === 1 ? 'left' : 'center' });
  });

  let currentY = startY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  game.rows.forEach((r, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(8, currentY - 4.5, 281, 6, 'F');
    }

    doc.setTextColor(30, 41, 59);
    doc.text(String(r.playerNumber ?? '-'), colX[0] + 4, currentY, { align: 'center' });
    doc.text(r.playerName, colX[1], currentY, { align: 'left' });
    doc.text(r.min, colX[2] + 4, currentY, { align: 'center' });
    doc.text(`${r.tc}/${r.ti}`, colX[3] + 4, currentY, { align: 'center' });
    doc.text(`${r.tiPct}%`, colX[4] + 4, currentY, { align: 'center' });
    doc.text(`${r.c3p}/${r.i3p}`, colX[5] + 4, currentY, { align: 'center' });
    doc.text(`${r.pct3p}%`, colX[6] + 4, currentY, { align: 'center' });
    doc.text(`${r.tlc}/${r.tli}`, colX[7] + 4, currentY, { align: 'center' });
    doc.text(`${r.tlPct}%`, colX[8] + 4, currentY, { align: 'center' });
    doc.text(String(r.rt), colX[9] + 4, currentY, { align: 'center' });
    doc.text(String(r.as), colX[10] + 4, currentY, { align: 'center' });
    doc.text(String(r.rec), colX[11] + 4, currentY, { align: 'center' });
    doc.text(String(r.per), colX[12] + 4, currentY, { align: 'center' });
    doc.text(String(r.tap), colX[13] + 4, currentY, { align: 'center' });
    doc.text(`${r.fpc}/${r.fpr}`, colX[14] + 4, currentY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(String(r.pt), colX[15] + 4, currentY, { align: 'center' });
    doc.text(String(r.ptsTot), colX[16] + 4, currentY, { align: 'center' });
    doc.setFont('helvetica', 'normal');

    currentY += 6;
  });

  // Totales SOMISA
  doc.setFillColor(0, 32, 91);
  doc.rect(8, currentY - 4.5, 281, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTALES SOMISA', colX[1], currentY, { align: 'left' });
  doc.text(teamTotals.min, colX[2] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.tc}/${teamTotals.ti}`, colX[3] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.tiPct}%`, colX[4] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.c3p}/${teamTotals.i3p}`, colX[5] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.pct3p}%`, colX[6] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.tlc}/${teamTotals.tli}`, colX[7] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.tlPct}%`, colX[8] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.rt), colX[9] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.as), colX[10] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.rec), colX[11] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.per), colX[12] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.tap), colX[13] + 4, currentY, { align: 'center' });
  doc.text(`${teamTotals.fpc}/${teamTotals.fpr}`, colX[14] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.pt), colX[15] + 4, currentY, { align: 'center' });
  doc.text(String(teamTotals.ptsTot), colX[16] + 4, currentY, { align: 'center' });

  // Totales Rival
  if (game.opponentStats) {
    currentY += 6.5;
    const opp = game.opponentStats;
    doc.setFillColor(241, 245, 249);
    doc.rect(8, currentY - 4.5, 281, 6, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTALES ${game.opponentName}`, colX[1], currentY, { align: 'left' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${opp.tc}/${opp.ti}`, colX[3] + 4, currentY, { align: 'center' });
    doc.text(`${opp.ti > 0 ? ((opp.tc / opp.ti) * 100).toFixed(0) : 0}%`, colX[4] + 4, currentY, { align: 'center' });
    doc.text(`${opp.c3p}/${opp.i3p}`, colX[5] + 4, currentY, { align: 'center' });
    doc.text(`${opp.i3p > 0 ? ((opp.c3p / opp.i3p) * 100).toFixed(0) : 0}%`, colX[6] + 4, currentY, { align: 'center' });
    doc.text(`${opp.tlc}/${opp.tli}`, colX[7] + 4, currentY, { align: 'center' });
    doc.text(`${opp.tli > 0 ? ((opp.tlc / opp.tli) * 100).toFixed(0) : 0}%`, colX[8] + 4, currentY, { align: 'center' });
    doc.text(String(opp.rd + opp.ro), colX[9] + 4, currentY, { align: 'center' });
    doc.text(String(opp.as), colX[10] + 4, currentY, { align: 'center' });
    doc.text(String(opp.rec), colX[11] + 4, currentY, { align: 'center' });
    doc.text(String(opp.per), colX[12] + 4, currentY, { align: 'center' });
    doc.text(String(opp.tap), colX[13] + 4, currentY, { align: 'center' });
    doc.text(String(opp.fpc), colX[14] + 4, currentY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(String(opp.pts), colX[15] + 4, currentY, { align: 'center' });
  }

  drawFooter(doc);
  doc.save(`SOMISA_Planilla_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.pdf`);
}

