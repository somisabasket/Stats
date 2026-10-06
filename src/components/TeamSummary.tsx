import React, { useState, useMemo } from 'react';
import { Game } from '../types/basketball';
import { calculateTeamRowTotals, calculateFourFactors } from '../utils/calculations';
import { exportSeasonTotalsPdf } from '../utils/exportPdf';
import { exportSeasonTotalsExcel, exportSeasonTotalsCsv } from '../utils/exportCsv';
import { 
  Shield, 
  Zap, 
  Target, 
  Activity, 
  Award, 
  TrendingUp, 
  TrendingDown,
  Download, 
  PieChart,
  Filter,
  Calendar,
  Trophy,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Gauge,
  CheckCircle2,
  MapPin,
  ChevronRight,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface TeamSummaryProps {
  games: Game[];
  currentGameId: string;
  onOpenExportModal?: () => void;
}

export interface AdvancedEfficiencyMetrics {
  gamesCount: number;
  wins: number;
  losses: number;
  winPct: number;
  totalPointsSomisa: number;
  totalPointsOpponent: number;
  avgPointsSomisa: number;
  avgPointsOpponent: number;
  pointDifferential: number;
  avgPointDifferential: number;
  totalPossessionsSomisa: number;
  totalPossessionsOpponent: number;
  avgPossessionsPerGame: number;
  pace: number;
  offensiveRating: number;
  defensiveRating: number;
  netRating: number;
  pointsPerPossession: number;
  oppPointsPerPossession: number;
  trueShootingPct: number;
  effectiveFgPct: number;
  oppEffectiveFgPct: number;
  turnoverPct: number;
  oppTurnoverPct: number;
  offensiveReboundPct: number;
  defensiveReboundPct: number;
  freeThrowRate: number;
  oppFreeThrowRate: number;
  assistToTurnoverRatio: number;
  assistedFGPct: number;
  pctPts2p: number;
  pctPts3p: number;
  pctPtsFt: number;
  fgm: number;
  fga: number;
  fgPct: number;
  tc: number;
  ti: number;
  tiPct: number;
  c3p: number;
  i3p: number;
  pct3p: number;
  tlc: number;
  tli: number;
  tlPct: number;
  rebDef: number;
  rebOf: number;
  rebTot: number;
  avgRebTot: number;
  astTot: number;
  avgAstTot: number;
  stlTot: number;
  avgStlTot: number;
  tovTot: number;
  avgTovTot: number;
  blkTot: number;
  avgBlkTot: number;
}

export function computeAdvancedTeamEfficiency(games: Game[]): AdvancedEfficiencyMetrics {
  if (games.length === 0) {
    return {
      gamesCount: 0,
      wins: 0,
      losses: 0,
      winPct: 0,
      totalPointsSomisa: 0,
      totalPointsOpponent: 0,
      avgPointsSomisa: 0,
      avgPointsOpponent: 0,
      pointDifferential: 0,
      avgPointDifferential: 0,
      totalPossessionsSomisa: 0,
      totalPossessionsOpponent: 0,
      avgPossessionsPerGame: 0,
      pace: 0,
      offensiveRating: 0,
      defensiveRating: 0,
      netRating: 0,
      pointsPerPossession: 0,
      oppPointsPerPossession: 0,
      trueShootingPct: 0,
      effectiveFgPct: 0,
      oppEffectiveFgPct: 0,
      turnoverPct: 0,
      oppTurnoverPct: 0,
      offensiveReboundPct: 0,
      defensiveReboundPct: 0,
      freeThrowRate: 0,
      oppFreeThrowRate: 0,
      assistToTurnoverRatio: 0,
      assistedFGPct: 0,
      pctPts2p: 0,
      pctPts3p: 0,
      pctPtsFt: 0,
      fgm: 0,
      fga: 0,
      fgPct: 0,
      tc: 0,
      ti: 0,
      tiPct: 0,
      c3p: 0,
      i3p: 0,
      pct3p: 0,
      tlc: 0,
      tli: 0,
      tlPct: 0,
      rebDef: 0,
      rebOf: 0,
      rebTot: 0,
      avgRebTot: 0,
      astTot: 0,
      avgAstTot: 0,
      stlTot: 0,
      avgStlTot: 0,
      tovTot: 0,
      avgTovTot: 0,
      blkTot: 0,
      avgBlkTot: 0
    };
  }

  let wins = 0;
  let losses = 0;
  let totalPtsSomisa = 0;
  let totalPtsOpponent = 0;
  let tc = 0, ti = 0, c3p = 0, i3p = 0, tlc = 0, tli = 0;
  let rd = 0, ro = 0, as = 0, rec = 0, per = 0, tap = 0, fpc = 0, fpr = 0;
  let oppTc = 0, oppTi = 0, oppC3p = 0, oppI3p = 0, oppTlc = 0, oppTli = 0;
  let oppRd = 0, oppRo = 0, oppPer = 0;

  games.forEach(g => {
    if (g.scoreMyTeam > g.scoreOpponent) wins++;
    else if (g.scoreMyTeam < g.scoreOpponent) losses++;

    totalPtsSomisa += g.scoreMyTeam;
    totalPtsOpponent += g.scoreOpponent;

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

  const gp = games.length;
  const fga = ti + i3p;
  const fgm = tc + c3p;
  const oppFga = oppTi + oppI3p;
  const oppFgm = oppTc + oppC3p;

  // FIBA possession estimate: FGA + 0.44 * FTA - OREB + TOV
  const somisaPoss = fga + 0.44 * tli - ro + per || 1;
  const oppPoss = oppFga + 0.44 * oppTli - oppRo + oppPer || somisaPoss;
  const avgPoss = (somisaPoss + oppPoss) / 2;

  const pace = Number((avgPoss / gp).toFixed(1));
  const offensiveRating = Number(((totalPtsSomisa / somisaPoss) * 100).toFixed(1));
  const defensiveRating = Number(((totalPtsOpponent / oppPoss) * 100).toFixed(1));
  const netRating = Number((offensiveRating - defensiveRating).toFixed(1));

  const pointsPerPossession = Number((totalPtsSomisa / somisaPoss).toFixed(2));
  const oppPointsPerPossession = Number((totalPtsOpponent / oppPoss).toFixed(2));

  const tsDenom = 2 * (fga + 0.44 * tli);
  const trueShootingPct = tsDenom > 0 ? Number(((totalPtsSomisa / tsDenom) * 100).toFixed(1)) : 0;

  const effectiveFgPct = fga > 0 ? Number((((fgm + 0.5 * c3p) / fga) * 100).toFixed(1)) : 0;
  const oppEffectiveFgPct = oppFga > 0 ? Number((((oppFgm + 0.5 * oppC3p) / oppFga) * 100).toFixed(1)) : 0;

  const turnoverPct = Number(((per / somisaPoss) * 100).toFixed(1));
  const oppTurnoverPct = Number(((oppPer / oppPoss) * 100).toFixed(1));

  const orbPct = (ro + oppRd) > 0 ? Number(((ro / (ro + oppRd)) * 100).toFixed(1)) : 0;
  const drbPct = (rd + oppRo) > 0 ? Number(((rd / (rd + oppRo)) * 100).toFixed(1)) : 0;

  const freeThrowRate = fga > 0 ? Number(((tlc / fga) * 100).toFixed(1)) : 0;
  const oppFreeThrowRate = oppFga > 0 ? Number(((oppTlc / oppFga) * 100).toFixed(1)) : 0;

  const assistToTurnoverRatio = per > 0 ? Number((as / per).toFixed(2)) : as;
  const assistedFGPct = fgm > 0 ? Number(((as / fgm) * 100).toFixed(1)) : 0;

  const pts2 = tc * 2;
  const pts3 = c3p * 3;
  const ptsFt = tlc;
  const denomPts = totalPtsSomisa || 1;

  return {
    gamesCount: gp,
    wins,
    losses,
    winPct: Number(((wins / gp) * 100).toFixed(1)),
    totalPointsSomisa: totalPtsSomisa,
    totalPointsOpponent: totalPtsOpponent,
    avgPointsSomisa: Number((totalPtsSomisa / gp).toFixed(1)),
    avgPointsOpponent: Number((totalPtsOpponent / gp).toFixed(1)),
    pointDifferential: totalPtsSomisa - totalPtsOpponent,
    avgPointDifferential: Number(((totalPtsSomisa - totalPtsOpponent) / gp).toFixed(1)),
    totalPossessionsSomisa: Math.round(somisaPoss),
    totalPossessionsOpponent: Math.round(oppPoss),
    avgPossessionsPerGame: Number((avgPoss / gp).toFixed(1)),
    pace,
    offensiveRating,
    defensiveRating,
    netRating,
    pointsPerPossession,
    oppPointsPerPossession,
    trueShootingPct,
    effectiveFgPct,
    oppEffectiveFgPct,
    turnoverPct,
    oppTurnoverPct,
    offensiveReboundPct: orbPct,
    defensiveReboundPct: drbPct,
    freeThrowRate,
    oppFreeThrowRate,
    assistToTurnoverRatio,
    assistedFGPct,
    pctPts2p: Number(((pts2 / denomPts) * 100).toFixed(1)),
    pctPts3p: Number(((pts3 / denomPts) * 100).toFixed(1)),
    pctPtsFt: Number(((ptsFt / denomPts) * 100).toFixed(1)),
    fgm,
    fga,
    fgPct: fga > 0 ? Number(((fgm / fga) * 100).toFixed(1)) : 0,
    tc,
    ti,
    tiPct: ti > 0 ? Number(((tc / ti) * 100).toFixed(1)) : 0,
    c3p,
    i3p,
    pct3p: i3p > 0 ? Number(((c3p / i3p) * 100).toFixed(1)) : 0,
    tlc,
    tli,
    tlPct: tli > 0 ? Number(((tlc / tli) * 100).toFixed(1)) : 0,
    rebDef: rd,
    rebOf: ro,
    rebTot: rd + ro,
    avgRebTot: Number(((rd + ro) / gp).toFixed(1)),
    astTot: as,
    avgAstTot: Number((as / gp).toFixed(1)),
    stlTot: rec,
    avgStlTot: Number((rec / gp).toFixed(1)),
    tovTot: per,
    avgTovTot: Number((per / gp).toFixed(1)),
    blkTot: tap,
    avgBlkTot: Number((tap / gp).toFixed(1))
  };
}

export const TeamSummary: React.FC<TeamSummaryProps> = ({ 
  games, 
  currentGameId,
  onOpenExportModal 
}) => {
  const currentGame = games.find(g => g.id === currentGameId) || games[0];

  // ---------------- FILTER STATES FOR ADVANCED EFFICIENCY ----------------
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [selectedVenue, setSelectedVenue] = useState<'all' | 'home' | 'away'>('all');
  const [selectedPreset, setSelectedPreset] = useState<'all' | 'last3' | 'last5' | 'custom'>('all');

  // Distinct competitions list
  const competitionOptions = useMemo(() => {
    const set = new Set<string>();
    games.forEach(g => {
      if (g.competition && g.competition.trim()) {
        set.add(g.competition.trim());
      }
    });
    return Array.from(set);
  }, [games]);

  // Apply filters to games
  const filteredGames = useMemo(() => {
    let list = [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Preset filter
    if (selectedPreset === 'last3') {
      list = list.slice(-3);
    } else if (selectedPreset === 'last5') {
      list = list.slice(-5);
    }

    return list.filter(g => {
      // Date start
      if (startDate && g.date < startDate) return false;
      // Date end
      if (endDate && g.date > endDate) return false;
      // Competition
      if (selectedCompetition !== 'all' && g.competition !== selectedCompetition) return false;
      // Venue
      if (selectedVenue !== 'all' && g.homeAway !== selectedVenue) return false;

      return true;
    });
  }, [games, startDate, endDate, selectedCompetition, selectedVenue, selectedPreset]);

  // Compute Advanced Efficiency Metrics on filtered games
  const advancedMetrics = useMemo(() => {
    return computeAdvancedTeamEfficiency(filteredGames);
  }, [filteredGames]);

  // Calculations for current game (single match view)
  const currentTotals = currentGame ? calculateTeamRowTotals(currentGame.rows) : null;
  const currentFactors = currentTotals && currentGame ? calculateFourFactors(currentTotals, currentGame.opponentStats) : null;

  const currentPts2 = currentTotals ? currentTotals.tc * 2 : 0;
  const currentPts3 = currentTotals ? currentTotals.c3p * 3 : 0;
  const currentPtsFt = currentTotals ? currentTotals.tlc : 0;
  const currentTotalPts = (currentTotals && currentTotals.pt) || 1;

  const currentPctPts2 = ((currentPts2 / currentTotalPts) * 100).toFixed(1);
  const currentPctPts3 = ((currentPts3 / currentTotalPts) * 100).toFixed(1);
  const currentPctPtsFt = ((currentPtsFt / currentTotalPts) * 100).toFixed(1);

  // Quick preset handler
  const handleApplyPreset = (preset: 'all' | 'last3' | 'last5') => {
    setSelectedPreset(preset);
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      setSelectedCompetition('all');
      setSelectedVenue('all');
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCompetition('all');
    setSelectedVenue('all');
    setSelectedPreset('all');
  };

  const hasActiveFilters = startDate !== '' || endDate !== '' || selectedCompetition !== 'all' || selectedVenue !== 'all' || selectedPreset !== 'all';

  const currentFilterDescription = useMemo(() => {
    const parts: string[] = [];
    if (selectedPreset === 'last3') parts.push('Últimos 3 partidos');
    if (selectedPreset === 'last5') parts.push('Últimos 5 partidos');
    if (startDate || endDate) parts.push(`Fechas: ${startDate || 'Inicio'} a ${endDate || 'Actual'}`);
    if (selectedCompetition !== 'all') parts.push(`Competencia: ${selectedCompetition}`);
    if (selectedVenue !== 'all') parts.push(`Condición: ${selectedVenue === 'home' ? 'Solo Local' : 'Solo Visitante'}`);
    return parts.length > 0 ? parts.join(' | ') : 'Temporada Completa';
  }, [selectedPreset, startDate, endDate, selectedCompetition, selectedVenue]);

  return (
    <div className="space-y-6">
      {/* Institutional Club Somisa Header Banner with Crest */}
      <div className="bg-white dark:bg-[#0E1526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ClubSomisaLogo size={50} className="drop-shadow-md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#00205B] dark:text-white tracking-tight">
                CLUB SOMISA · RESUMEN DEL EQUIPO
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#00205B] dark:text-[#93C5FD] border border-blue-200 dark:border-blue-800">
                Oficial CABB / FBB
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Análisis Táctico, Eficiencia Avanzada Colectiva y Desglose de Rendimiento
            </p>
          </div>
        </div>

        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Exportar Apartados (PDF / Excel / CSV)</span>
          </button>
        )}
      </div>

      {/* =========================================================================
          NUEVA SECCIÓN: EFICIENCIA AVANZADA (ADVANCED EFFICIENCY & RATINGS)
          ========================================================================= */}
      <div className="bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Section Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#00205B] via-[#0A327E] to-[#154294] text-white flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shadow-inner">
              <Gauge className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black tracking-tight">
                  Eficiencia Avanzada & Métricas de Rendimiento
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Analytics Dean Oliver
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Cálculo dinámico de Offensive Rating, Defensive Rating, Pace y factores de impacto filtrados
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/10 text-white/90 border border-white/15">
              Partidos analizados: <strong className="text-white font-mono">{filteredGames.length}</strong> de {games.length}
            </span>
            {filteredGames.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportSeasonTotalsPdf(filteredGames, currentFilterDescription)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/90 hover:bg-red-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  title="Exportar Reporte PDF con los datos de Eficiencia Avanzada filtrados"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF Eficiencia</span>
                </button>
                <button
                  onClick={() => exportSeasonTotalsExcel(filteredGames, currentFilterDescription)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/90 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                  title="Exportar Libro Excel (.xlsx) con Eficiencia Avanzada y Evolución filtrada"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => exportSeasonTotalsCsv(filteredGames, currentFilterDescription)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
                  title="Exportar CSV con Eficiencia Avanzada filtrada"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Filter Bar */}
        <div className="p-5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00205B] dark:text-[#93C5FD]">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtros Dinámicos de Muestra:</span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1 hidden sm:inline">Preajustes:</span>
              <button
                onClick={() => handleApplyPreset('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                  selectedPreset === 'all' && !startDate && !endDate && selectedCompetition === 'all' && selectedVenue === 'all'
                    ? 'bg-[#00205B] text-white dark:bg-[#93C5FD] dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Todos ({games.length})
              </button>
              <button
                onClick={() => handleApplyPreset('last3')}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                  selectedPreset === 'last3'
                    ? 'bg-[#00205B] text-white dark:bg-[#93C5FD] dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Últimos 3
              </button>
              <button
                onClick={() => handleApplyPreset('last5')}
                className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                  selectedPreset === 'last5'
                    ? 'bg-[#00205B] text-white dark:bg-[#93C5FD] dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                Últimos 5
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/60 transition-colors ml-1 cursor-pointer"
                  title="Restablecer todos los filtros"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Filter Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter: Fecha Desde */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Fecha Desde:
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs focus:ring-2 focus:ring-[#00205B] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Filter: Fecha Hasta */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Fecha Hasta:
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedPreset('custom');
                  }}
                  className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs focus:ring-2 focus:ring-[#00205B] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Filter: Tipo de Competencia */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tipo de Competencia:
              </label>
              <select
                value={selectedCompetition}
                onChange={(e) => {
                  setSelectedCompetition(e.target.value);
                  setSelectedPreset('custom');
                }}
                className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs focus:ring-2 focus:ring-[#00205B] focus:outline-hidden cursor-pointer"
              >
                <option value="all">-- Todas las Competencias --</option>
                {competitionOptions.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter: Condición (Local / Visitante) */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Condición de Juego:
              </label>
              <select
                value={selectedVenue}
                onChange={(e) => {
                  setSelectedVenue(e.target.value as any);
                  setSelectedPreset('custom');
                }}
                className="w-full text-xs font-semibold py-2 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs focus:ring-2 focus:ring-[#00205B] focus:outline-hidden cursor-pointer"
              >
                <option value="all">Local & Visitante</option>
                <option value="home">Solo Local</option>
                <option value="away">Solo Visitante</option>
              </select>
            </div>
          </div>

          {/* Active sample indicator badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Muestra analizada: <strong className="text-slate-900 dark:text-white">{filteredGames.length} encuentros</strong>
                {filteredGames.length > 0 && (
                  <span className="ml-2 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    ({advancedMetrics.wins}V - {advancedMetrics.losses}D · {advancedMetrics.winPct}% victorias)
                  </span>
                )}
              </span>
            </div>

            {filteredGames.length > 0 && (
              <span className="text-slate-500 text-[11px]">
                Promedio anotador: <strong>{advancedMetrics.avgPointsSomisa} pts</strong> vs rivales <strong>{advancedMetrics.avgPointsOpponent} pts</strong> (Dif: {advancedMetrics.avgPointDifferential > 0 ? `+${advancedMetrics.avgPointDifferential}` : advancedMetrics.avgPointDifferential})
              </span>
            )}
          </div>
        </div>

        {/* Results Container */}
        {filteredGames.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No hay partidos que coincidan con estos filtros
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Prueba modificando el rango de fechas o seleccionando "Todas las competencias" para ver las estadísticas de eficiencia.
            </p>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00205B] text-white text-xs font-bold hover:bg-[#0A327E] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Filtros</span>
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* The 4 Hero Efficiency Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Offensive Rating (ORtg) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00205B] dark:text-[#93C5FD]">
                    Offensive Rating (ORtg)
                  </span>
                  <Flame className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black font-mono text-[#00205B] dark:text-white">
                    {advancedMetrics.offensiveRating}
                  </p>
                  <span className="text-xs text-slate-400 font-semibold">pts/100 pos</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                    {advancedMetrics.offensiveRating >= 110 ? 'Ataque Élite' : advancedMetrics.offensiveRating >= 102 ? 'Alta Eficiencia' : 'Estándar'}
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {advancedMetrics.pointsPerPossession} PPP
                  </span>
                </div>
              </div>

              {/* Card 2: Defensive Rating (DRtg) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Defensive Rating (DRtg)
                  </span>
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black font-mono text-blue-900 dark:text-blue-200">
                    {advancedMetrics.defensiveRating}
                  </p>
                  <span className="text-xs text-slate-400 font-semibold">permitidos</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                    {advancedMetrics.defensiveRating <= 95 ? 'Defensa de Élite' : advancedMetrics.defensiveRating <= 102 ? 'Defensa Sólida' : 'Ajustable'}
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    {advancedMetrics.oppPointsPerPossession} Opp PPP
                  </span>
                </div>
              </div>

              {/* Card 3: Net Rating */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    Net Rating (NetRtg)
                  </span>
                  {advancedMetrics.netRating >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <p className={`text-3xl font-black font-mono ${
                    advancedMetrics.netRating > 0 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : advancedMetrics.netRating < 0 
                      ? 'text-red-500' 
                      : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    {advancedMetrics.netRating > 0 ? `+${advancedMetrics.netRating}` : advancedMetrics.netRating}
                  </p>
                  <span className="text-xs text-slate-400 font-semibold">diferencial</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    advancedMetrics.netRating >= 8 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                      : advancedMetrics.netRating >= 0 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                  }`}>
                    {advancedMetrics.netRating > 0 ? 'Ventaja SOMISA (+)' : 'Déficit (-)'}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Dif Pts: {advancedMetrics.pointDifferential > 0 ? `+${advancedMetrics.pointDifferential}` : advancedMetrics.pointDifferential}
                  </span>
                </div>
              </div>

              {/* Card 4: Pace (Ritmo) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    Ritmo de Juego (Pace)
                  </span>
                  <Activity className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {advancedMetrics.pace}
                  </p>
                  <span className="text-xs text-slate-400 font-semibold">pos/40 min</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                    {advancedMetrics.pace >= 76 ? 'Ritmo Alto' : advancedMetrics.pace >= 70 ? 'Ritmo Controlado' : 'Posesión Lenta'}
                  </span>
                  <span className="text-slate-500 text-[11px] font-mono">
                    ~{(2400 / (advancedMetrics.pace || 1) / 2).toFixed(1)}s/pos
                  </span>
                </div>
              </div>
            </div>

            {/* Complementary Advanced Metrics Matrix */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Desglose Avanzado de Eficiencia & Control de Balón
                </h4>
                <span className="text-[11px] text-slate-400 font-mono">
                  Muestra consolidada: {filteredGames.length} partido(s)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {/* True Shooting % */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">True Shooting (TS%)</span>
                  <p className="text-lg font-black font-mono text-[#00205B] dark:text-white mt-0.5">{advancedMetrics.trueShootingPct}%</p>
                  <span className="text-[10px] text-slate-500">Tiro real + libres</span>
                </div>

                {/* Effective FG% */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tiro Efectivo (eFG%)</span>
                  <p className="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">{advancedMetrics.effectiveFgPct}%</p>
                  <span className="text-[10px] text-slate-500">Rival: {advancedMetrics.oppEffectiveFgPct}%</span>
                </div>

                {/* AST / TO */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Relación AST / PER</span>
                  <p className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">{advancedMetrics.assistToTurnoverRatio}</p>
                  <span className="text-[10px] text-slate-500">{advancedMetrics.astTot} ast / {advancedMetrics.tovTot} per</span>
                </div>

                {/* Canastas Asistidas % */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Canastas Asistidas</span>
                  <p className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{advancedMetrics.assistedFGPct}%</p>
                  <span className="text-[10px] text-slate-500">Circulación de balón</span>
                </div>

                {/* Turnover % */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pérdidas (ToV%)</span>
                  <p className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 mt-0.5">{advancedMetrics.turnoverPct}%</p>
                  <span className="text-[10px] text-slate-500">Rival: {advancedMetrics.oppTurnoverPct}%</span>
                </div>

                {/* Free Throw Rate */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Frecuencia TL (FTr)</span>
                  <p className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5">{advancedMetrics.freeThrowRate}%</p>
                  <span className="text-[10px] text-slate-500">Rival: {advancedMetrics.oppFreeThrowRate}%</span>
                </div>
              </div>
            </div>

            {/* Match-by-Match Breakdown Table in the Filtered Sample */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#00205B] dark:text-[#93C5FD]" />
                    <span>Evolución y Rendimiento por Partido Filtrado</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Comparativa de ritmo y ratings en los {filteredGames.length} encuentros seleccionados
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#00205B] text-white">
                      <th className="py-2.5 px-3 font-bold">Fecha / Rival</th>
                      <th className="py-2.5 px-3 font-bold">Competencia</th>
                      <th className="py-2.5 px-3 font-bold text-center">Condición</th>
                      <th className="py-2.5 px-3 font-bold text-center">Resultado</th>
                      <th className="py-2.5 px-3 font-bold text-center">Pace</th>
                      <th className="py-2.5 px-3 font-bold text-center">ORtg (Ataque)</th>
                      <th className="py-2.5 px-3 font-bold text-center">DRtg (Defensa)</th>
                      <th className="py-2.5 px-3 font-bold text-center">Net Rating</th>
                      <th className="py-2.5 px-3 font-bold text-center">eFG%</th>
                      <th className="py-2.5 px-3 font-bold text-center">ToV%</th>
                      <th className="py-2.5 px-3 font-bold text-center">TS%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-[#0E1526]">
                    {filteredGames.map((g) => {
                      const rowTot = calculateTeamRowTotals(g.rows);
                      const f = calculateFourFactors(rowTot, g.opponentStats);
                      const isWin = g.scoreMyTeam > g.scoreOpponent;

                      return (
                        <tr 
                          key={g.id} 
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                            g.id === currentGameId ? 'bg-blue-50/60 dark:bg-blue-950/30' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              {g.id === currentGameId && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              )}
                              <span>vs {g.opponentName}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{g.date}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-[180px] truncate" title={g.competition}>
                            {g.competition}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              g.homeAway === 'home'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            }`}>
                              {g.homeAway === 'home' ? 'Local' : 'Visitante'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded ${
                              isWin 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                                : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                            }`}>
                              {g.scoreMyTeam} - {g.scoreOpponent}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-700 dark:text-slate-300">
                            {f.pace}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-[#00205B] dark:text-[#93C5FD]">
                            {f.offensiveRating}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                            {f.defensiveRating}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">
                            <span className={f.netRating > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                              {f.netRating > 0 ? `+${f.netRating}` : f.netRating}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-amber-600 dark:text-amber-400 font-semibold">
                            {f.eFGPct}%
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-purple-600 dark:text-purple-400">
                            {f.tovPct}%
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                            {rowTot.tsPct}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          ANÁLISIS DEL PARTIDO SELECCIONADO (CURRENT GAME OVERVIEW & 4 FACTORS)
          ========================================================================= */}
      {currentTotals && currentFactors && (
        <>
          {/* Overview Cards for Current Selected Match */}
          <div className="bg-white dark:bg-[#0E1526] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Ficha Táctica Individual del Partido
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  SOMISA ({currentGame.scoreMyTeam}) vs {currentGame.opponentName} ({currentGame.scoreOpponent})
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {currentGame.date} · {currentGame.competition}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider">Puntos SOMISA</span>
                  <Target className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-black font-mono text-[#00205B] dark:text-white">{currentTotals.pt}</p>
                <p className="text-xs text-slate-500 mt-0.5">vs {currentGame.scoreOpponent} ({currentGame.opponentName})</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider">Tiro Efectivo (eFG%)</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{currentFactors.eFGPct}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Rival: {currentFactors.oppEFGPct}%</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider">Rebote Ofensivo (ORB%)</span>
                  <Shield className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{currentFactors.orbPct}%</p>
                <p className="text-xs text-slate-500 mt-0.5">Defensivo: {currentFactors.drbPct}%</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-slate-500 mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider">Rating Neto Partido</span>
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                </div>
                <p className={`text-2xl font-black font-mono ${currentFactors.netRating >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {currentFactors.netRating > 0 ? `+${currentFactors.netRating}` : currentFactors.netRating}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Off: {currentFactors.offensiveRating} | Def: {currentFactors.defensiveRating}</p>
              </div>
            </div>

            {/* Dean Oliver 4 Factors Comparison for current game */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Los 4 Factores de la Victoria (Dean Oliver en este partido)
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-[#00205B] dark:text-[#93C5FD]">
                  Ritmo: {currentFactors.pace} posesiones
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Tiro Efectivo (40%)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOMISA:</span>
                    <span className="text-base font-black font-mono text-[#00205B] dark:text-[#93C5FD]">{currentFactors.eFGPct}%</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500">Rival:</span>
                    <span className="text-xs font-bold font-mono text-slate-500">{currentFactors.oppEFGPct}%</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Cuidado de Balón (25%)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOMISA ToV%:</span>
                    <span className="text-base font-black font-mono text-[#00205B] dark:text-[#93C5FD]">{currentFactors.tovPct}%</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500">Rival ToV%:</span>
                    <span className="text-xs font-bold font-mono text-slate-500">{currentFactors.oppTovPct}%</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Rebote Ofensivo (20%)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOMISA ORB%:</span>
                    <span className="text-base font-black font-mono text-[#00205B] dark:text-[#93C5FD]">{currentFactors.orbPct}%</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500">Rival DRB%:</span>
                    <span className="text-xs font-bold font-mono text-slate-500">{currentFactors.drbPct}%</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. Frecuencia TL (15%)</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOMISA FTr:</span>
                    <span className="text-base font-black font-mono text-[#00205B] dark:text-[#93C5FD]">{currentFactors.ftRate}%</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500">Rival FTr:</span>
                    <span className="text-xs font-bold font-mono text-slate-500">{currentFactors.oppFtRate}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Points Breakdown Section */}
          <div className="bg-white dark:bg-[#0E1526] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-[#00205B] dark:text-[#93C5FD]" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Distribución y Origen de los Puntos de SOMISA en este partido
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">Tiros de 2 (Dobles)</span>
                <p className="text-2xl font-black font-mono text-[#00205B] dark:text-white mt-1">{currentPts2} pts</p>
                <p className="text-xs text-slate-500 mt-1">{currentPctPts2}% de la anotación ({currentTotals.tc}/{currentTotals.ti} - {currentTotals.tiPct}%)</p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">Tiros de 3 (Triples)</span>
                <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">{currentPts3} pts</p>
                <p className="text-xs text-slate-500 mt-1">{currentPctPts3}% de la anotación ({currentTotals.c3p}/{currentTotals.i3p} - {currentTotals.pct3p}%)</p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">Tiros Libres (TL)</span>
                <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{currentPtsFt} pts</p>
                <p className="text-xs text-slate-500 mt-1">{currentPctPtsFt}% de la anotación ({currentTotals.tlc}/{currentTotals.tli} - {currentTotals.tlPct}%)</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
