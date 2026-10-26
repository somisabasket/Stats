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

function getMatchTacticalLeaders(rows: Game['rows']) {
  if (!rows || rows.length === 0) return null;
  const sortedPts = [...rows].sort((a, b) => (b.pt || 0) - (a.pt || 0));
  const sortedVal = [...rows].sort((a, b) => (b.ptsTot || 0) - (a.ptsTot || 0));
  const sortedReb = [...rows].sort((a, b) => (b.rt || 0) - (a.rt || 0));
  const sortedAst = [...rows].sort((a, b) => (b.as || 0) - (a.as || 0));

  return {
    topScorer: sortedPts[0] || null,
    topVal: sortedVal[0] || null,
    topReb: sortedReb[0] || null,
    topAst: sortedAst[0] || null
  };
}

/**
 * PÁGINA DE ANÁLISIS TÁCTICO INDIVIDUAL DEL PARTIDO:
 * 1. Ficha Táctica Individual del Partido (Hero Cards & Marcador Oficial)
 * 2. Los 4 Factores de la Victoria (Dean Oliver en este partido vs Rival)
 * 3. Distribución y Origen de los Puntos de SOMISA en este partido (Dobles, Triples, TL)
 * 4. Líderes Tácticos Individuales del Partido (SOMISA)
 * 5. Síntesis Táctica y Balance Técnico del Encuentro
 */
export function drawTacticalMatchPage(
  doc: jsPDF,
  game: Game,
  pageNum: number,
  totalPages: number,
  crestImg: HTMLImageElement | null
): void {
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

  const pts2 = teamTotals.tc * 2;
  const pts3 = teamTotals.c3p * 3;
  const ptsFt = teamTotals.tlc;
  const totalPts = teamTotals.pt || 1;

  const pctPts2 = ((pts2 / totalPts) * 100).toFixed(1);
  const pctPts3 = ((pts3 / totalPts) * 100).toFixed(1);
  const pctPtsFt = ((ptsFt / totalPts) * 100).toFixed(1);

  // Top header with official SOMISA branding
  drawHeader(
    doc,
    `Ficha Táctica Individual · ${game.myTeamName} vs ${game.opponentName}`,
    `Fecha: ${game.date} | Torneo: ${game.competition} | Condición: ${game.homeAway === 'home' ? 'Local' : 'Visitante'} | Temporada: ${game.season}`,
    pageNum,
    totalPages,
    crestImg
  );

  // Score Badge in Top Header
  doc.setFillColor(238, 243, 250);
  doc.roundedRect(216, 4, 52, 16, 2, 2, 'F');
  doc.setTextColor(0, 32, 91);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`${game.scoreMyTeam} - ${game.scoreOpponent}`, 242, 11, { align: 'center' });
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  const isWin = game.scoreMyTeam >= game.scoreOpponent;
  doc.setTextColor(isWin ? 16 : 220, isWin ? 185 : 38, isWin ? 129 : 38);
  doc.text(isWin ? 'VICTORIA SOMISA' : 'DERROTA SOMISA', 242, 16.5, { align: 'center' });

  // =========================================================================
  // SECCIÓN 1: FICHA TÁCTICA INDIVIDUAL DEL PARTIDO (4 HERO CARDS)
  // =========================================================================
  const cardW = 66;
  const cardH = 21;
  const cardY = 27;

  // Card 1: Puntos SOMISA
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(10, cardY, cardW, cardH, 2.5, 2.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('PUNTOS SOMISA', 14, cardY + 5.5);
  doc.setFontSize(14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(String(teamTotals.pt), 14, cardY + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const diffPts = game.scoreMyTeam - game.scoreOpponent;
  doc.text(`vs ${game.scoreOpponent} (${game.opponentName.slice(0, 14)}) · Dif: ${diffPts > 0 ? '+' : ''}${diffPts}`, 14, cardY + 18);

  // Card 2: Tiro Efectivo (eFG%)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(80, cardY, cardW, cardH, 2.5, 2.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TIRO EFECTIVO (eFG%)', 84, cardY + 5.5);
  doc.setFontSize(14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text(`${factors.eFGPct}%`, 84, cardY + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const diffEfg = (factors.eFGPct - factors.oppEFGPct).toFixed(1);
  doc.text(`Rival: ${factors.oppEFGPct}% · Ventaja: ${Number(diffEfg) > 0 ? '+' : ''}${diffEfg}%`, 84, cardY + 18);

  // Card 3: Rebote Ofensivo (ORB%)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(150, cardY, cardW, cardH, 2.5, 2.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('REBOTE OFENSIVO (ORB%)', 154, cardY + 5.5);
  doc.setFontSize(14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text(`${factors.orbPct}%`, 154, cardY + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Defensivo: ${factors.drbPct}% | ORB atrapados: ${teamTotals.ro}`, 154, cardY + 18);

  // Card 4: Rating Neto Partido
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(220, cardY, cardW, cardH, 2.5, 2.5, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RATING NETO PARTIDO (+/-)', 224, cardY + 5.5);
  doc.setFontSize(14.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(factors.netRating >= 0 ? 16 : 220, factors.netRating >= 0 ? 185 : 38, factors.netRating >= 0 ? 129 : 38);
  doc.text(factors.netRating > 0 ? `+${factors.netRating}` : String(factors.netRating), 224, cardY + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Off: ${factors.offensiveRating} | Def: ${factors.defensiveRating} | Pace: ${factors.pace}`, 224, cardY + 18);

  // =========================================================================
  // SECCIÓN 2: LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER EN ESTE PARTIDO)
  // =========================================================================
  const sec2Y = 51;
  doc.setFillColor(0, 32, 91);
  doc.rect(10, sec2Y, 276, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('LOS 4 FACTORES DE LA VICTORIA (DEAN OLIVER EN ESTE PARTIDO)', 14, sec2Y + 4.2);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(219, 234, 254);
  doc.text(`Ritmo: ${factors.pace} posesiones (40 min) · Eficiencia: ${singlePpp} PPP (SOMISA) vs ${singleOppPpp} PPP (Rival)`, 282, sec2Y + 4.2, { align: 'right' });

  const factorTableY = sec2Y + 6.5;
  const factorRows = [
    {
      factor: '1. Tiro Efectivo (eFG%)',
      weight: '40% del resultado',
      somisa: `${factors.eFGPct}%`,
      rival: `${factors.oppEFGPct}%`,
      diff: `${(factors.eFGPct - factors.oppEFGPct) > 0 ? '+' : ''}${(factors.eFGPct - factors.oppEFGPct).toFixed(1)}%`,
      isAdv: factors.eFGPct >= factors.oppEFGPct,
      desc: 'Pondera el 50% adicional del triple: (2PC + 1.5*3PC) / TCI.'
    },
    {
      factor: '2. Cuidado de Balón (ToV%)',
      weight: '25% del resultado',
      somisa: `${factors.tovPct}%`,
      rival: `${factors.oppTovPct}%`,
      diff: `${(factors.tovPct - factors.oppTovPct) > 0 ? '+' : ''}${(factors.tovPct - factors.oppTovPct).toFixed(1)}%`,
      isAdv: factors.tovPct <= factors.oppTovPct,
      desc: '% de posesiones finalizadas en pérdida de posesión.'
    },
    {
      factor: '3. Rebote Ofensivo (ORB%)',
      weight: '20% del resultado',
      somisa: `${factors.orbPct}%`,
      rival: `${100 - factors.drbPct}%`,
      diff: `${(factors.orbPct - (100 - factors.drbPct)) > 0 ? '+' : ''}${(factors.orbPct - (100 - factors.drbPct)).toFixed(1)}%`,
      isAdv: factors.orbPct >= (100 - factors.drbPct),
      desc: 'Segundas oportunidades: rebotes ofensivos disponibles atrapados.'
    },
    {
      factor: '4. Frecuencia de Libres (FTr)',
      weight: '15% del resultado',
      somisa: `${factors.ftRate}%`,
      rival: `${factors.oppFtRate}%`,
      diff: `${(factors.ftRate - factors.oppFtRate) > 0 ? '+' : ''}${(factors.ftRate - factors.oppFtRate).toFixed(1)}%`,
      isAdv: factors.ftRate >= factors.oppFtRate,
      desc: 'Capacidad de atacar el aro y conseguir tiros libres por tiro de campo.'
    }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, factorTableY, 276, 5.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Factor / Fundamento', 14, factorTableY + 4);
  doc.text('Importancia', 75, factorTableY + 4);
  doc.text('SOMISA', 125, factorTableY + 4, { align: 'center' });
  doc.text(`Rival (${game.opponentName.slice(0, 16)})`, 160, factorTableY + 4, { align: 'center' });
  doc.text('Diferencia', 195, factorTableY + 4, { align: 'center' });
  doc.text('Definición e Impacto Táctico Clave', 222, factorTableY + 4);

  let fY = factorTableY + 6;
  doc.setFont('helvetica', 'normal');
  factorRows.forEach((fr, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(10, fY - 3.5, 276, 6.8, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.setFontSize(7.5);
    doc.text(fr.factor, 14, fY + 1.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.2);
    doc.text(fr.weight, 75, fY + 1.2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(fr.somisa, 125, fY + 1.2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(fr.rival, 160, fY + 1.2, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    if (fr.isAdv) {
      doc.setTextColor(16, 185, 129);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.text(fr.diff, 195, fY + 1.2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6.8);
    doc.text(fr.desc, 222, fY + 1.2);

    fY += 6.8;
  });

  // =========================================================================
  // SECCIÓN 3: DISTRIBUCIÓN Y ORIGEN DE LOS PUNTOS DE SOMISA EN ESTE PARTIDO
  // =========================================================================
  const sec3Y = 93;
  doc.setFillColor(0, 32, 91);
  doc.rect(10, sec3Y, 276, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DISTRIBUCIÓN Y ORIGEN DE LOS PUNTOS DE SOMISA EN ESTE PARTIDO', 14, sec3Y + 4.2);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(219, 234, 254);
  const totalFgAttempts = teamTotals.ti + teamTotals.i3p;
  const totalFgPct = totalFgAttempts > 0 ? (((teamTotals.tc + teamTotals.c3p) / totalFgAttempts) * 100).toFixed(1) : '0';
  doc.text(`Total: ${teamTotals.pt} pts | True Shooting: ${teamTotals.tsPct}% | Tiros Campo: ${teamTotals.tc + teamTotals.c3p}/${totalFgAttempts} (${totalFgPct}%)`, 282, sec3Y + 4.2, { align: 'right' });

  const card3W = 89;
  const card3H = 22;
  const card3Y = sec3Y + 7;

  // Card 3A: Dobles (2P)
  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(10, card3Y, card3W, card3H, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('TIROS DE 2 PUNTOS (DOBLES)', 14, card3Y + 5.5);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(`${pts2} pts`, 14, card3Y + 13);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${pctPts2}% del total · ${teamTotals.tc}/${teamTotals.ti} convertidos (${teamTotals.tiPct}% acierto)`, 14, card3Y + 18.5);

  // Card 3B: Triples (3P)
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(103.5, card3Y, card3W, card3H, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('TIROS DE 3 PUNTOS (TRIPLES)', 107.5, card3Y + 5.5);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(`${pts3} pts`, 107.5, card3Y + 13);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${pctPts3}% del total · ${teamTotals.c3p}/${teamTotals.i3p} convertidos (${teamTotals.pct3p}% acierto)`, 107.5, card3Y + 18.5);

  // Card 3C: Tiros Libres (TL)
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(197, card3Y, card3W, card3H, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text('TIROS LIBRES (TL)', 201, card3Y + 5.5);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(4, 120, 87);
  doc.text(`${ptsFt} pts`, 201, card3Y + 13);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`${pctPtsFt}% del total · ${teamTotals.tlc}/${teamTotals.tli} convertidos (${teamTotals.tlPct}% acierto)`, 201, card3Y + 18.5);

  // Horizontal Point Origin Stacked Bar
  const barY = card3Y + 24.5;
  const barW = 276;
  const barH = 5;

  const w2 = Math.max(0, (pts2 / totalPts) * barW);
  const w3 = Math.max(0, (pts3 / totalPts) * barW);
  const wFt = Math.max(0, barW - w2 - w3);

  // Segment 2P (Pantone 281 C Blue)
  doc.setFillColor(0, 32, 91);
  doc.rect(10, barY, w2, barH, 'F');
  // Segment 3P (Amber)
  doc.setFillColor(217, 119, 6);
  doc.rect(10 + w2, barY, w3, barH, 'F');
  // Segment TL (Emerald)
  doc.setFillColor(5, 150, 105);
  doc.rect(10 + w2 + w3, barY, wFt, barH, 'F');

  // Legend under bar
  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text(`■ Dobles (2P): ${pts2} pts (${pctPts2}%)`, 14, barY + 8.8);
  doc.setTextColor(180, 83, 9);
  doc.text(`■ Triples (3P): ${pts3} pts (${pctPts3}%)`, 105, barY + 8.8);
  doc.setTextColor(4, 120, 87);
  doc.text(`■ Tiros Libres (TL): ${ptsFt} pts (${pctPtsFt}%)`, 198, barY + 8.8);

  // =========================================================================
  // SECCIÓN 4: LÍDERES TÁCTICOS INDIVIDUALES DEL PARTIDO (SOMISA)
  // =========================================================================
  const sec4Y = 142;
  doc.setFillColor(0, 32, 91);
  doc.rect(10, sec4Y, 276, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('LÍDERES TÁCTICOS INDIVIDUALES DEL PARTIDO (SOMISA)', 14, sec4Y + 3.8);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(219, 234, 254);
  doc.text('Rendimiento individual destacado del plantel en este encuentro', 282, sec4Y + 3.8, { align: 'right' });

  const leadCards = getMatchTacticalLeaders(game.rows);
  const leadCardY = sec4Y + 7;
  const leadCardH = 24;

  if (leadCards) {
    const { topScorer, topVal, topReb, topAst } = leadCards;

    // Leader 1: Scorer
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, leadCardY, cardW, leadCardH, 2, 2, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('MÁXIMO ANOTADOR', 14, leadCardY + 4.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.text(topScorer ? `${topScorer.playerName} (#${topScorer.playerNumber ?? '-'})` : '-', 14, leadCardY + 10);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(230, 81, 0);
    doc.text(topScorer ? `${topScorer.pt} PTS` : '0 PTS', 14, leadCardY + 17);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(topScorer ? `2P: ${topScorer.tc}/${topScorer.ti} | 3P: ${topScorer.c3p}/${topScorer.i3p} | TL: ${topScorer.tlc}/${topScorer.tli}` : '-', 14, leadCardY + 21.5);

    // Leader 2: Valuation
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(80, leadCardY, cardW, leadCardH, 2, 2, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('MÁXIMA VALORACIÓN FIBA', 84, leadCardY + 4.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.text(topVal ? `${topVal.playerName} (#${topVal.playerNumber ?? '-'})` : '-', 84, leadCardY + 10);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text(topVal ? `${topVal.ptsTot} VAL` : '0 VAL', 84, leadCardY + 17);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(topVal ? `${topVal.min} MIN | ${topVal.pt} PTS | ${topVal.rt} REB | ${topVal.as} AST` : '-', 84, leadCardY + 21.5);

    // Leader 3: Rebounds
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(150, leadCardY, cardW, leadCardH, 2, 2, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('LÍDER EN REBOTES', 154, leadCardY + 4.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.text(topReb ? `${topReb.playerName} (#${topReb.playerNumber ?? '-'})` : '-', 154, leadCardY + 10);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(topReb ? `${topReb.rt} REBOTES` : '0 REB', 154, leadCardY + 17);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(topReb ? `Defensivos: ${topReb.rd} | Ofensivos: ${topReb.ro}` : '-', 154, leadCardY + 21.5);

    // Leader 4: Assists
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(220, leadCardY, cardW, leadCardH, 2, 2, 'FD');
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('LÍDER EN ASISTENCIAS', 224, leadCardY + 4.5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 32, 91);
    doc.text(topAst ? `${topAst.playerName} (#${topAst.playerNumber ?? '-'})` : '-', 224, leadCardY + 10);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 58, 237);
    doc.text(topAst ? `${topAst.as} ASISTENCIAS` : '0 AST', 224, leadCardY + 17);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(topAst ? `Recuperos: ${topAst.rec} | Pérdidas: ${topAst.per} | ${topAst.min} MIN` : '-', 224, leadCardY + 21.5);
  }

  // =========================================================================
  // SECCIÓN 5: SÍNTESIS TÁCTICA & CLAVES DE EFICIENCIA
  // =========================================================================
  const sec5Y = 175.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(10, sec5Y, 276, 22.5, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 32, 91);
  doc.text('SÍNTESIS TÁCTICA Y BALANCE TÉCNICO DEL PARTIDO (STAFF SOMISA)', 14, sec5Y + 5);

  doc.setFontSize(6.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(
    `• Ritmo & Circulación: Pace estimado de ${factors.pace} posesiones a 40 minutos. Relación Asistencias/Pérdidas (AST/PER) de ${singleAstTo} con ${singleAstPct}% de canastas asistidas (${teamTotals.as} asistencias en ${singleFgm} conversiones).`,
    14,
    sec5Y + 10
  );
  doc.text(
    `• Factores de Victoria: eFG% SOMISA ${factors.eFGPct}% vs ${factors.oppEFGPct}% Rival | Pérdidas (ToV%): ${factors.tovPct}% | Rebote Ofensivo (ORB%): ${factors.orbPct}% (${teamTotals.ro} segundas opciones) | Frecuencia de TL (FTr): ${factors.ftRate}%.`,
    14,
    sec5Y + 14.5
  );
  doc.text(
    `• Marcador y Eficiencia Neta: ${game.scoreMyTeam} - ${game.scoreOpponent} (Diferencial: ${diffPts > 0 ? '+' : ''}${diffPts} pts). Rating Ofensivo: ${factors.offensiveRating} (${singlePpp} PPP) | Rating Defensivo: ${factors.defensiveRating} (${singleOppPpp} Opp PPP) | Rating Neto: ${factors.netRating > 0 ? '+' : ''}${factors.netRating} pts/100 posesiones.`,
    14,
    sec5Y + 19
  );

  drawFooter(doc);
}

/**
 * EXPORTACIÓN COMPLETA (TODOS LOS APARTADOS):
 * Página 1: Planilla Oficial de Partido (Box Score)
 * Página 2: Ficha Táctica Individual, 4 Factores de Dean Oliver & Distribución de Puntos
 * Página 3: Resumen Individual de la Plantilla (Promedios y Totales de Temporada)
 */
export async function exportComprehensivePdf(game: Game, allGames: Game[] = [game]): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const teamTotals = calculateTeamRowTotals(game.rows);
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
  // PÁGINA 2: FICHA TÁCTICA INDIVIDUAL, 4 FACTORES DE DEAN OLIVER & DISTRIBUCIÓN
  // =========================================================================
  doc.addPage('a4', 'landscape');
  drawTacticalMatchPage(doc, game, 2, 3, crestImg);

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
 * EXPORTACIÓN INDIVIDUAL: Ficha Táctica Individual, 4 Factores de Dean Oliver & Distribución de Puntos
 */
export async function exportTeamSummaryPdf(game: Game): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  drawTacticalMatchPage(doc, game, 1, 1, crestImg);

  doc.save(`SOMISA_Ficha_Tactica_y_Resumen_Equipo_${game.opponentName.replace(/\s+/g, '_')}_${game.date}.pdf`);
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
 * Página 2: Ficha Táctica Individual del Partido, 4 Factores de Dean Oliver & Distribución de Puntos
 * Página 3: Resumen Total Individual (Plantilla de jugadores) con escudo oficial
 */
export async function exportSeasonTotalsPdf(
  games: Game[],
  filterDescription?: string,
  targetGame?: Game
): Promise<void> {
  const crestImg = await loadCrestImage();
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const teamTotals = computeAggregatedTeamTotals(games);
  const aggPlayers = computeAggregatedPlayers(games);
  const gp = games.length || 1;
  const matchToAnalyze = targetGame || games[0];
  const totalPages = matchToAnalyze ? 3 : 2;

  // ==================== PÁGINA 1: RESUMEN TOTAL DEL EQUIPO & EFICIENCIA AVANZADA ====================
  drawHeader(
    doc,
    'Resumen Total del Equipo · Eficiencia Avanzada y Métricas Globales',
    `Partidos Computados: ${games.length} | Balance: ${teamTotals.wins}V - ${teamTotals.losses}D (${teamTotals.winPct}%)${filterDescription ? ` | Filtro: ${filterDescription}` : ''}`,
    1,
    totalPages,
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

  // ==================== PÁGINA 2: FICHA TÁCTICA INDIVIDUAL, 4 FACTORES & DISTRIBUCIÓN ====================
  if (matchToAnalyze) {
    doc.addPage('a4', 'landscape');
    drawTacticalMatchPage(doc, matchToAnalyze, 2, totalPages, crestImg);
  }

  // ==================== PÁGINA 3 (O 2): RESUMEN TOTAL INDIVIDUAL ====================
  doc.addPage('a4', 'landscape');
  drawHeader(
    doc,
    'Resumen Total Individual · Estadísticas Acumuladas de Jugadores',
    `Plantilla Oficial de Club SOMISA · Total Partidos Computados: ${gp}${filterDescription ? ` | Filtro: ${filterDescription}` : ''}`,
    totalPages,
    totalPages,
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

