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
      fallback.src = './somisa_crest.jpg';
    };
    img.src = './somisa_crest.jpg';
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
  // PÁGINA 2: RESUMEN DEL EQUIPO, EFICIENCIA AVANZADA & 4 FACTORES
  // =========================================================================
  doc.addPage('a4', 'landscape');
  drawHeader(
    doc,
    'Resumen Colectivo, Eficiencia Avanzada & 4 Factores (Dean Oliver)',
    `Evaluación táctica de posesiones, ORtg, DRtg, Pace y balance de juego vs ${game.opponentName}`,
    2,
    3,
    crestImg
  );

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

  // 4 Top Cards
  const cardW = 66;
  const cardH = 26;
  const cardY = 30;

  // Card 1: Offensive Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFENSIVE RATING (ORtg)', 14, cardY + 7);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(`${factors.offensiveRating} pts/100`, 14, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`PPP: ${singlePpp} | TS%: ${teamTotals.tsPct}%`, 14, cardY + 22.5);

  // Card 2: Defensive Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(80, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DEFENSIVE RATING (DRtg)', 84, cardY + 7);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(`${factors.defensiveRating} pts/100`, 84, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Opp PPP: ${singleOppPpp} | Rival: ${game.scoreOpponent} pts`, 84, cardY + 22.5);

  // Card 3: Net Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(150, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NET RATING (+/- NETO)', 154, cardY + 7);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(factors.netRating >= 0 ? 16 : 239, factors.netRating >= 0 ? 185 : 68, factors.netRating >= 0 ? 129 : 68);
  doc.text(factors.netRating > 0 ? `+${factors.netRating}` : String(factors.netRating), 154, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Resultado: ${game.scoreMyTeam} - ${game.scoreOpponent}`, 154, cardY + 22.5);

  // Card 4: Posesiones (Pace)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(220, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RITMO / PACE (40 MIN)', 224, cardY + 7);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 81, 0);
  doc.text(`${factors.pace} pos`, 224, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`AST/PER: ${singleAstTo} | AST%: ${singleAstPct}%`, 224, cardY + 22.5);

  // Four Factors Section Header
  doc.setFillColor(0, 32, 91);
  doc.rect(10, 62, 276, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISIS DE LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER)', 14, 67);

  const factorTableY = 71;
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

  // Points Breakdown & Advanced Efficiency Box
  const pBreakY = 114;
  doc.setFillColor(0, 32, 91);
  doc.rect(10, pBreakY, 276, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DESGLOSE DE PUNTOS, TIRO REAL (TS%) Y EFICIENCIA AVANZADA ACUMULADA DE TEMPORADA', 14, pBreakY + 4.5);

  const pts2 = teamTotals.tc * 2;
  const pts3 = teamTotals.c3p * 3;
  const ptsFt = teamTotals.tlc;
  const totalPts = teamTotals.pt || 1;

  const pctPts2 = ((pts2 / totalPts) * 100).toFixed(1);
  const pctPts3 = ((pts3 / totalPts) * 100).toFixed(1);
  const pctPtsFt = ((ptsFt / totalPts) * 100).toFixed(1);
  const seasonAdv = computeAggregatedTeamTotals(allGames);

  doc.setFillColor(248, 250, 252);
  doc.rect(10, pBreakY + 7, 276, 26, 'F');

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`• Desglose Partido: Dobles (2P): ${pts2} pts (${pctPts2}% | ${teamTotals.tc}/${teamTotals.ti} - ${teamTotals.tiPct}%) | Triples (3P): ${pts3} pts (${pctPts3}% | ${teamTotals.c3p}/${teamTotals.i3p} - ${teamTotals.pct3p}%) | Libres (TL): ${ptsFt} pts (${pctPtsFt}% | ${teamTotals.tlc}/${teamTotals.tli} - ${teamTotals.tlPct}%)`, 14, pBreakY + 13);
  doc.text(`• Eficiencia Partido: ORtg: ${factors.offensiveRating} (${singlePpp} PPP) | DRtg: ${factors.defensiveRating} (${singleOppPpp} Opp PPP) | NetRtg: ${factors.netRating > 0 ? '+' : ''}${factors.netRating} | Pace: ${factors.pace} pos | TS%: ${teamTotals.tsPct}% | AST/PER: ${singleAstTo} (AST%: ${singleAstPct}%)`, 14, pBreakY + 19.5);
  doc.setTextColor(0, 32, 91);
  doc.text(`• Acumulado Muestra (${allGames.length} PJ | ${seasonAdv.wins}V-${seasonAdv.losses}D): ORtg Global: ${seasonAdv.offensiveRating} (${seasonAdv.pointsPerPossession} PPP) | DRtg Global: ${seasonAdv.defensiveRating} | NetRtg: ${seasonAdv.netRating > 0 ? '+' : ''}${seasonAdv.netRating} | Pace: ${seasonAdv.pace} | TS%: ${seasonAdv.trueShootingPct}% | eFG%: ${seasonAdv.eFGPct}%`, 14, pBreakY + 26);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`• Control y 4 Factores Globales: AST/PER: ${seasonAdv.assistToTurnoverRatio} | Canastas Asistidas: ${seasonAdv.assistedFGPct}% | ToV%: ${seasonAdv.tovPct}% (Rival: ${seasonAdv.oppTovPct}%) | ORB%: ${seasonAdv.orbPct}% | FTr: ${seasonAdv.ftRate}%`, 14, pBreakY + 31.5);

  // Mini Table of Match Evolution on Page 2
  const evoY = pBreakY + 36;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, evoY, 276, 5.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  const evoCols = [12, 34, 85, 138, 160, 182, 202, 222, 242, 260, 276];
  const evoHeaders = ['Fecha', 'Rival', 'Competencia', 'Cond.', 'Resultado', 'Pace', 'ORtg', 'DRtg', 'NetRtg', 'eFG%', 'TS%'];
  evoHeaders.forEach((h, idx) => {
    doc.text(h, evoCols[idx], evoY + 3.8, { align: idx <= 2 ? 'left' : 'center' });
  });

  let eRowY = evoY + 9;
  doc.setFont('helvetica', 'normal');
  allGames.slice(0, 7).forEach((g, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, eRowY - 3.5, 276, 5, 'F');
    }
    const rTot = calculateTeamRowTotals(g.rows);
    const f = calculateFourFactors(rTot, g.opponentStats);
    doc.setTextColor(30, 41, 59);
    doc.text(g.date, evoCols[0], eRowY);
    doc.setFont('helvetica', 'bold');
    doc.text(g.opponentName.slice(0, 22), evoCols[1], eRowY);
    doc.setFont('helvetica', 'normal');
    doc.text((g.competition || '').slice(0, 24), evoCols[2], eRowY);
    doc.text(g.homeAway === 'home' ? 'Local' : 'Visit.', evoCols[3], eRowY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${g.scoreMyTeam}-${g.scoreOpponent}`, evoCols[4], eRowY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(String(f.pace), evoCols[5], eRowY, { align: 'center' });
    doc.text(String(f.offensiveRating), evoCols[6], eRowY, { align: 'center' });
    doc.text(String(f.defensiveRating), evoCols[7], eRowY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(f.netRating > 0 ? `+${f.netRating}` : String(f.netRating), evoCols[8], eRowY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${f.eFGPct}%`, evoCols[9], eRowY, { align: 'center' });
    doc.text(`${rTot.tsPct}%`, evoCols[10], eRowY, { align: 'center' });
    eRowY += 5;
  });

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
 * EXPORTACIÓN INDIVIDUAL: Solo Resumen del Equipo, Eficiencia Avanzada & 4 Factores
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

  drawHeader(
    doc,
    'Resumen Colectivo del Equipo, Eficiencia Avanzada & 4 Factores',
    `Evaluación táctica de posesiones, ORtg, DRtg, Pace y balance de juego vs ${game.opponentName} (${game.date})`,
    1,
    1,
    crestImg
  );

  const cardW = 66;
  const cardH = 26;
  const cardY = 32;

  // Card 1: Off Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFENSIVE RATING (ORtg)', 14, cardY + 7);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(`${factors.offensiveRating} pts/100`, 14, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`PPP: ${singlePpp} | TS%: ${teamTotals.tsPct}%`, 14, cardY + 22.5);

  // Card 2: Def Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(80, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('DEFENSIVE RATING (DRtg)', 84, cardY + 7);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(`${factors.defensiveRating} pts/100`, 84, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Opp PPP: ${singleOppPpp} | Rival: ${game.scoreOpponent} pts`, 84, cardY + 22.5);

  // Card 3: Net Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(150, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('NET RATING (+/-)', 154, cardY + 7);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(factors.netRating >= 0 ? 16 : 239, factors.netRating >= 0 ? 185 : 68, factors.netRating >= 0 ? 129 : 68);
  doc.text(factors.netRating > 0 ? `+${factors.netRating}` : String(factors.netRating), 154, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Marcador: ${game.scoreMyTeam} - ${game.scoreOpponent}`, 154, cardY + 22.5);

  // Card 4: Pace
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(220, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('RITMO / POSESIONES (PACE)', 224, cardY + 7);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 81, 0);
  doc.text(`${factors.pace} pos`, 224, cardY + 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`AST/PER: ${singleAstTo} | AST%: ${singleAstPct}%`, 224, cardY + 22.5);

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
 * Página 1: Resumen Total del Equipo, Eficiencia Avanzada y Evolución por Partido
 * Página 2: Resumen Total Individual (Plantilla de jugadores) con escudo oficial
 */
export async function exportSeasonTotalsPdf(games: Game[], filterDescription?: string): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const teamTotals = computeAggregatedTeamTotals(games);
  const aggPlayers = computeAggregatedPlayers(games);
  const gp = games.length || 1;

  // ==================== PÁGINA 1: RESUMEN TOTAL DEL EQUIPO & EFICIENCIA AVANZADA ====================
  drawHeader(
    doc,
    'Resumen Total del Equipo · Eficiencia Avanzada y Métricas Globales',
    `Partidos Computados: ${games.length} | Balance: ${teamTotals.wins}V - ${teamTotals.losses}D (${teamTotals.winPct}%)${filterDescription ? ` | Filtro: ${filterDescription}` : ''}`,
    1,
    2,
    crestImg
  );

  // 4 Top Cards
  const cardW = 66;
  const cardH = 23;
  const cardY = 28;

  // Card 1: Offensive Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFENSIVE RATING GLOBAL (ORtg)', 14, cardY + 6);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(`${teamTotals.offensiveRating} pts/100`, 14, cardY + 14);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`PPP: ${teamTotals.pointsPerPossession} | TS%: ${teamTotals.trueShootingPct}%`, 14, cardY + 20);

  // Card 2: Defensive Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(80, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('DEFENSIVE RATING GLOBAL (DRtg)', 84, cardY + 6);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text(`${teamTotals.defensiveRating} pts/100`, 84, cardY + 14);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Opp PPP: ${teamTotals.oppPointsPerPossession} | Recibidos: ${teamTotals.avgOpponentPoints}/pj`, 84, cardY + 20);

  // Card 3: Net Rating
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(150, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('NET RATING GLOBAL (+/- NETO)', 154, cardY + 6);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(teamTotals.netRating >= 0 ? 16 : 239, teamTotals.netRating >= 0 ? 185 : 68, teamTotals.netRating >= 0 ? 129 : 68);
  doc.text(teamTotals.netRating > 0 ? `+${teamTotals.netRating}` : String(teamTotals.netRating), 154, cardY + 14);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Récord: ${teamTotals.wins}V-${teamTotals.losses}D | Dif: ${teamTotals.pointDiff > 0 ? '+' : ''}${teamTotals.pointDiff} pts`, 154, cardY + 20);

  // Card 4: Pace & Ball Control
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(220, cardY, cardW, cardH, 3, 3, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PACE (RITMO) & CIRCULACIÓN', 224, cardY + 6);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 81, 0);
  doc.text(`${teamTotals.pace} pos/40m`, 224, cardY + 14);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`AST/PER: ${teamTotals.assistToTurnoverRatio} | AST%: ${teamTotals.assistedFGPct}%`, 224, cardY + 20);

  // Four Factors Section Header
  doc.setFillColor(0, 32, 91);
  doc.rect(10, 55, 276, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER) · ACUMULADO DE LA MUESTRA', 14, 59.5);

  const factorTableY = 63;
  const factorRows = [
    { factor: '1. Tiro Efectivo (eFG%)', weight: '40% del resultado', somisa: `${teamTotals.eFGPct}%`, rival: `${teamTotals.oppEFGPct}%`, diff: `${(teamTotals.eFGPct - teamTotals.oppEFGPct).toFixed(1)}%`, desc: 'Efectividad ponderada de tiros dobles y triples.' },
    { factor: '2. Cuidado de Balón (ToV%)', weight: '25% del resultado', somisa: `${teamTotals.tovPct}%`, rival: `${teamTotals.oppTovPct}%`, diff: `${(teamTotals.tovPct - teamTotals.oppTovPct).toFixed(1)}%`, desc: '% de posesiones que terminan en pérdida.' },
    { factor: '3. Rebote Ofensivo (ORB%)', weight: '20% del resultado', somisa: `${teamTotals.orbPct}%`, rival: `${100 - teamTotals.drbPct}%`, diff: `${(teamTotals.orbPct - (100 - teamTotals.drbPct)).toFixed(1)}%`, desc: '% de rebotes ofensivos disponibles atrapados.' },
    { factor: '4. Frecuencia de Libres (FTr)', weight: '15% del resultado', somisa: `${teamTotals.ftRate}%`, rival: `${teamTotals.oppFtRate}%`, diff: `${(teamTotals.ftRate - teamTotals.oppFtRate).toFixed(1)}%`, desc: 'Capacidad de ir a la línea de tiros libres.' }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, factorTableY, 276, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Factor / Fundamento', 14, factorTableY + 4.3);
  doc.text('Importancia', 75, factorTableY + 4.3);
  doc.text('SOMISA', 125, factorTableY + 4.3, { align: 'center' });
  doc.text('Rivales', 160, factorTableY + 4.3, { align: 'center' });
  doc.text('Diferencia', 195, factorTableY + 4.3, { align: 'center' });
  doc.text('Definición e Impacto', 225, factorTableY + 4.3);

  let fY = factorTableY + 7;
  doc.setFont('helvetica', 'normal');
  factorRows.forEach((fr, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, fY - 3.5, 276, 7.5, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.text(fr.factor, 14, fY + 1.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(fr.weight, 75, fY + 1.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fr.somisa, 125, fY + 1.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(fr.rival, 160, fY + 1.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(fr.diff, 195, fY + 1.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.2);
    doc.text(fr.desc, 225, fY + 1.5);
    doc.setFontSize(8);
    fY += 7.5;
  });

  // Totales Colectivos Compactos
  const pBreakY = 102;
  doc.setFillColor(0, 32, 91);
  doc.rect(10, pBreakY, 276, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VOLUMEN DE JUEGO Y EVOLUCIÓN DE EFICIENCIA POR PARTIDO', 14, pBreakY + 4.3);

  doc.setFillColor(248, 250, 252);
  doc.rect(10, pBreakY + 6.5, 276, 14, 'F');
  doc.setFontSize(7.8);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`• Dobles (2P): ${teamTotals.tc}/${teamTotals.ti} (${teamTotals.tiPct}%) | Triples (3P): ${teamTotals.c3p}/${teamTotals.i3p} (${teamTotals.pct3p}%) | Libres (TL): ${teamTotals.tlc}/${teamTotals.tli} (${teamTotals.tlPct}%) | True Shooting: ${teamTotals.trueShootingPct}%`, 14, pBreakY + 12);
  doc.text(`• Rebotes: ${teamTotals.rt} (${teamTotals.avgRebounds}/pj) | Asistencias: ${teamTotals.as} (${teamTotals.avgAssists}/pj) | Recuperos: ${teamTotals.rec} (${teamTotals.avgSteals}/pj) | Pérdidas: ${teamTotals.per} (${teamTotals.avgTurnovers}/pj) | Valoración: ${teamTotals.avgValuation}/pj`, 14, pBreakY + 18);

  // Match-by-Match Efficiency Table
  const mTableY = pBreakY + 23;
  const mCols = [12, 34, 85, 138, 160, 182, 202, 222, 242, 260, 276];
  const mHeaders = ['Fecha', 'Rival', 'Competencia', 'Cond.', 'Resultado', 'Pace', 'ORtg', 'DRtg', 'NetRtg', 'eFG%', 'TS%'];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, mTableY, 276, 6, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  mHeaders.forEach((h, idx) => {
    doc.text(h, mCols[idx], mTableY + 4.2, { align: idx <= 2 ? 'left' : 'center' });
  });

  let mY = mTableY + 10;
  doc.setFont('helvetica', 'normal');
  games.slice(0, 11).forEach((g, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, mY - 3.8, 276, 5.5, 'F');
    }
    const rTot = calculateTeamRowTotals(g.rows);
    const f = calculateFourFactors(rTot, g.opponentStats);
    doc.setTextColor(30, 41, 59);
    doc.text(g.date, mCols[0], mY);
    doc.setFont('helvetica', 'bold');
    doc.text(g.opponentName.slice(0, 22), mCols[1], mY);
    doc.setFont('helvetica', 'normal');
    doc.text((g.competition || '').slice(0, 24), mCols[2], mY);
    doc.text(g.homeAway === 'home' ? 'Local' : 'Visit.', mCols[3], mY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${g.scoreMyTeam}-${g.scoreOpponent}`, mCols[4], mY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(String(f.pace), mCols[5], mY, { align: 'center' });
    doc.text(String(f.offensiveRating), mCols[6], mY, { align: 'center' });
    doc.text(String(f.defensiveRating), mCols[7], mY, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(f.netRating > 0 ? `+${f.netRating}` : String(f.netRating), mCols[8], mY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${f.eFGPct}%`, mCols[9], mY, { align: 'center' });
    doc.text(`${rTot.tsPct}%`, mCols[10], mY, { align: 'center' });
    mY += 5.5;
  });

  drawFooter(doc);

  // ==================== PÁGINA 2: RESUMEN TOTAL INDIVIDUAL ====================
  doc.addPage('a4', 'landscape');
  drawHeader(
    doc,
    'Resumen Total Individual · Estadísticas Acumuladas de Jugadores',
    `Plantilla Oficial de Club SOMISA · Total Partidos Computados: ${gp}${filterDescription ? ` | Filtro: ${filterDescription}` : ''}`,
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

  // Resumen de Eficiencia Avanzada del Partido al pie de la planilla
  const singleFactors = calculateFourFactors(teamTotals, game.opponentStats);
  const singlePoss = (teamTotals.ti + teamTotals.i3p) + 0.44 * teamTotals.tli - teamTotals.ro + teamTotals.per || 1;
  const singlePpp = Number((game.scoreMyTeam / singlePoss).toFixed(2));
  const singleAstTo = teamTotals.per > 0 ? Number((teamTotals.as / teamTotals.per).toFixed(2)) : teamTotals.as;
  const singleFgm = teamTotals.tc + teamTotals.c3p;
  const singleAstPct = singleFgm > 0 ? Number(((teamTotals.as / singleFgm) * 100).toFixed(1)) : 0;

  const effBoxY = Math.min(currentY + 5, 189);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(8, effBoxY, 281, 10, 1.5, 1.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(
    `EFICIENCIA AVANZADA DEL PARTIDO:   ORtg: ${singleFactors.offensiveRating} (${singlePpp} PPP)   |   DRtg: ${singleFactors.defensiveRating}   |   Net Rating: ${singleFactors.netRating > 0 ? '+' : ''}${singleFactors.netRating}   |   Pace: ${singleFactors.pace} pos   |   TS%: ${teamTotals.tsPct}%   |   eFG%: ${singleFactors.eFGPct}%   |   ToV%: ${singleFactors.tovPct}%   |   ORB%: ${singleFactors.orbPct}%   |   FTr: ${singleFactors.ftRate}%   |   AST/PER: ${singleAstTo} (${singleAstPct}%)`,
    12,
    effBoxY + 6.2
  );

  drawFooter(doc);
  doc.save(`SOMISA_Planilla_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.pdf`);
}

