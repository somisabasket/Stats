import React, { useState, useMemo } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Trophy, 
  Calendar, 
  ChevronRight, 
  Home, 
  Plane, 
  Check, 
  Sparkles,
  BarChart3,
  TrendingUp,
  Shield,
  Layers,
  ArrowUpRight,
  Download
} from 'lucide-react';
import { Game } from '../types/basketball';
import { exportAllGamesExcel, exportSingleGameExcel, computeAggregatedPlayers, computeAggregatedTeamTotals } from '../utils/exportCsv';
import { exportAllMatchesComprehensivePdf, exportSingleGamePdf } from '../utils/exportPdf';
import { calculateTeamRowTotals, calculateFourFactors } from '../utils/calculations';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface AllMatchesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
}

export const AllMatchesReportModal: React.FC<AllMatchesReportModalProps> = ({
  isOpen,
  onClose,
  games,
}) => {
  // 'summary' for General Cumulative Summary, or match ID for a specific game
  const [activeTab, setActiveTab] = useState<string>('summary');
  const [notification, setNotification] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const sortedGames = useMemo(() => {
    return [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [games]);

  const teamTotalsGlobal = useMemo(() => {
    return computeAggregatedTeamTotals(sortedGames);
  }, [sortedGames]);

  const aggPlayers = useMemo(() => {
    return computeAggregatedPlayers(sortedGames);
  }, [sortedGames]);

  const activeGame = useMemo(() => {
    if (activeTab === 'summary') return null;
    return sortedGames.find(g => g.id === activeTab) || null;
  }, [activeTab, sortedGames]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-6xl max-h-[92vh] bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white flex flex-wrap items-center justify-between gap-3 shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ClubSomisaLogo size={44} className="bg-white/10 p-0.5 rounded-full drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide">CLUB SOMISA SAN NICOLÁS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  Reporte Integral
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Estadísticas de todos los partidos separados y resumen general acumulado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón Descargar Excel Completo */}
            <button
              onClick={() => {
                exportAllGamesExcel(sortedGames);
                showFeedback(`Excel completo generado: Resumen General + ${sortedGames.length} hojas de partidos`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Descargar libro Excel (.xlsx) con 1 hoja de resumen general + 1 hoja por cada partido jugado"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Descargar Excel (.xlsx)</span>
            </button>

            {/* Botón Descargar PDF Completo */}
            <button
              onClick={async () => {
                await exportAllMatchesComprehensivePdf(sortedGames);
                showFeedback(`Reporte PDF generado: ${2 + sortedGames.length} páginas oficiales`);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
              title="Descargar PDF oficial con portada, resumen colectivo, plantilla y cada partido individual"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {notification && (
          <div className="flex items-center gap-2 px-5 py-2 bg-emerald-50 dark:bg-emerald-950/70 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in shrink-0">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Horizontal Navigation Pills (Summary + Each Match) */}
        <div className="px-5 py-2.5 bg-slate-100/80 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 overflow-x-auto flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'summary'
                ? 'bg-[#00205B] text-white shadow-xs dark:bg-[#0A327E]'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
            <span>Resumen General Acumulado</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {sortedGames.length} PJ
            </span>
          </button>

          <span className="text-slate-300 dark:text-slate-700 text-xs font-bold px-1">|</span>

          {sortedGames.map((g, idx) => {
            const isSelected = activeTab === g.id;
            const isWin = g.scoreMyTeam > g.scoreOpponent;
            const isHome = (g.homeAway || 'home') === 'home';

            return (
              <button
                key={g.id}
                onClick={() => setActiveTab(g.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#00205B] text-white shadow-xs dark:bg-[#0A327E]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isWin ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span>P{idx + 1}: vs {g.opponentName}</span>
                <span className="text-[10px] font-mono opacity-80">
                  ({g.scoreMyTeam}-{g.scoreOpponent})
                </span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* =========================================================================
              VISTA 1: RESUMEN GENERAL ACUMULADO
             ========================================================================= */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Season Key Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Récord Global</span>
                  <div className="text-lg font-black text-[#00205B] dark:text-white mt-0.5">
                    {teamTotalsGlobal.wins}V - {teamTotalsGlobal.losses}D
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    {teamTotalsGlobal.winPct}% de Victorias
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntos por Partido</span>
                  <div className="text-lg font-black text-[#00205B] dark:text-white mt-0.5">
                    {teamTotalsGlobal.avgPoints} PTS
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Total: {teamTotalsGlobal.totalPoints} pts
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Puntos Recibidos</span>
                  <div className="text-lg font-black text-slate-700 dark:text-slate-300 mt-0.5">
                    {teamTotalsGlobal.avgOpponentPoints} PTS
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Dif: {teamTotalsGlobal.pointDiff > 0 ? `+${teamTotalsGlobal.pointDiff}` : teamTotalsGlobal.pointDiff}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Offensive Rating</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {teamTotalsGlobal.offensiveRating}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {teamTotalsGlobal.pointsPerPossession} Pts / Posesión
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Defensive Rating</span>
                  <div className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {teamTotalsGlobal.defensiveRating}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Net: {teamTotalsGlobal.netRating > 0 ? `+${teamTotalsGlobal.netRating}` : teamTotalsGlobal.netRating}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pace (Ritmo)</span>
                  <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5">
                    {teamTotalsGlobal.pace}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    TS%: {teamTotalsGlobal.trueShootingPct}%
                  </span>
                </div>
              </div>

              {/* Four Factors Dean Oliver Summary */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 font-bold text-xs text-[#00205B] dark:text-[#93C5FD] mb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Los 4 Factores de la Victoria (Dean Oliver) - Balance Acumulado de Torneo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Tiro Efectivo (eFG% - 40%)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-black text-slate-900 dark:text-white">{teamTotalsGlobal.eFGPct}%</span>
                      <span className="text-xs text-slate-500">vs Rival: {teamTotalsGlobal.oppEFGPct}%</span>
                    </div>
                    <span className={`text-[10px] font-bold ${teamTotalsGlobal.eFGPct >= teamTotalsGlobal.oppEFGPct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {teamTotalsGlobal.eFGPct >= teamTotalsGlobal.oppEFGPct ? '✓ Ventaja SOMISA' : '✗ Ventaja Rival'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Cuidado Balón (ToV% - 25%)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-black text-slate-900 dark:text-white">{teamTotalsGlobal.tovPct}%</span>
                      <span className="text-xs text-slate-500">vs Rival: {teamTotalsGlobal.oppTovPct}%</span>
                    </div>
                    <span className={`text-[10px] font-bold ${teamTotalsGlobal.tovPct <= teamTotalsGlobal.oppTovPct ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {teamTotalsGlobal.tovPct <= teamTotalsGlobal.oppTovPct ? '✓ Menos Pérdidas SOMISA' : '✗ Más Pérdidas'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Rebote Ofensivo (ORB% - 20%)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-black text-slate-900 dark:text-white">{teamTotalsGlobal.orbPct}%</span>
                      <span className="text-xs text-slate-500">Rival Def: {teamTotalsGlobal.drbPct}%</span>
                    </div>
                    <span className={`text-[10px] font-bold ${teamTotalsGlobal.orbPct >= (100 - teamTotalsGlobal.drbPct) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {teamTotalsGlobal.orbPct >= (100 - teamTotalsGlobal.drbPct) ? '✓ Ventaja en Segundas Opciones' : '✗ Rival Controla Rebote'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">4. Frecuencia TL (FTr - 15%)</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-black text-slate-900 dark:text-white">{teamTotalsGlobal.ftRate}%</span>
                      <span className="text-xs text-slate-500">vs Rival: {teamTotalsGlobal.oppFtRate}%</span>
                    </div>
                    <span className={`text-[10px] font-bold ${teamTotalsGlobal.ftRate >= teamTotalsGlobal.oppFtRate ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {teamTotalsGlobal.ftRate >= teamTotalsGlobal.oppFtRate ? '✓ Mayor Frecuencia a la Línea' : '✗ Rival Va Más a la Línea'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Comprehensive Plantilla Individual Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-[#00205B] dark:text-[#93C5FD] uppercase tracking-wider">
                    Plantilla Individual - Totales y Promedios Acumulados ({aggPlayers.length} Jugadores)
                  </h3>
                  <span className="text-[11px] text-slate-500">Ordenado por Promedio de Puntos (PTS/PJ)</span>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#00205B] text-white text-[11px] font-bold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3 min-w-[150px]">Jugador</th>
                        <th className="py-2.5 px-2">Pos</th>
                        <th className="py-2.5 px-2 text-center">PJ</th>
                        <th className="py-2.5 px-2 text-center bg-blue-900/60 font-black">PTS Tot</th>
                        <th className="py-2.5 px-2 text-center bg-blue-900/60 font-black">PTS/PJ</th>
                        <th className="py-2.5 px-2 text-center">2P%</th>
                        <th className="py-2.5 px-2 text-center">3P%</th>
                        <th className="py-2.5 px-2 text-center">TL%</th>
                        <th className="py-2.5 px-2 text-center">REB Tot</th>
                        <th className="py-2.5 px-2 text-center">REB/PJ</th>
                        <th className="py-2.5 px-2 text-center">AST Tot</th>
                        <th className="py-2.5 px-2 text-center">AST/PJ</th>
                        <th className="py-2.5 px-2 text-center">REC</th>
                        <th className="py-2.5 px-2 text-center">PER</th>
                        <th className="py-2.5 px-2 text-center bg-emerald-900/60 font-black">VAL Tot</th>
                        <th className="py-2.5 px-2 text-center bg-emerald-900/60 font-black">VAL/PJ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0E1526]">
                      {aggPlayers.map((p, idx) => (
                        <tr key={p.name} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                          <td className="py-2 px-3 font-mono font-bold text-slate-500">{p.number ?? '-'}</td>
                          <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                          <td className="py-2 px-2 text-slate-500 text-[11px]">{p.position || '-'}</td>
                          <td className="py-2 px-2 text-center font-bold text-slate-700 dark:text-slate-300">{p.gamesPlayed}</td>
                          <td className="py-2 px-2 text-center font-black text-[#00205B] dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20">{p.totalPoints}</td>
                          <td className="py-2 px-2 text-center font-black text-[#00205B] dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20">{p.avgPoints}</td>
                          <td className="py-2 px-2 text-center">{p.pct2p}%</td>
                          <td className="py-2 px-2 text-center">{p.pct3p}%</td>
                          <td className="py-2 px-2 text-center">{p.pctFt}%</td>
                          <td className="py-2 px-2 text-center">{p.totalRebounds}</td>
                          <td className="py-2 px-2 text-center font-semibold text-slate-800 dark:text-slate-200">{p.avgRebounds}</td>
                          <td className="py-2 px-2 text-center">{p.totalAssists}</td>
                          <td className="py-2 px-2 text-center font-semibold text-slate-800 dark:text-slate-200">{p.avgAssists}</td>
                          <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-400">{p.rec}</td>
                          <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-400">{p.per}</td>
                          <td className="py-2 px-2 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">{p.totalValuation}</td>
                          <td className="py-2 px-2 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">{p.avgValuation}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[#00205B] text-white font-bold text-xs">
                        <td className="py-2.5 px-3">∑</td>
                        <td className="py-2.5 px-3">TOTALES SOMISA</td>
                        <td className="py-2.5 px-2"></td>
                        <td className="py-2.5 px-2 text-center">{sortedGames.length}</td>
                        <td className="py-2.5 px-2 text-center font-black">{teamTotalsGlobal.totalPoints}</td>
                        <td className="py-2.5 px-2 text-center font-black">{teamTotalsGlobal.avgPoints}</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.tiPct}%</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.pct3p}%</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.tlPct}%</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.rt}</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.avgRebounds}</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.as}</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.avgAssists}</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.rec}</td>
                        <td className="py-2.5 px-2 text-center">{teamTotalsGlobal.per}</td>
                        <td className="py-2.5 px-2 text-center font-black">{teamTotalsGlobal.totalValuation}</td>
                        <td className="py-2.5 px-2 text-center font-black">{teamTotalsGlobal.avgValuation}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Evolution Match-by-Match Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-[#00205B] dark:text-[#93C5FD] uppercase tracking-wider">
                  Evolución y Rendimiento Partido a Partido ({sortedGames.length} Encuentros)
                </h3>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Fecha</th>
                        <th className="py-2.5 px-3">Rival</th>
                        <th className="py-2.5 px-3">Condición</th>
                        <th className="py-2.5 px-3">Resultado</th>
                        <th className="py-2.5 px-3 text-center">Marcador</th>
                        <th className="py-2.5 px-3 text-center">Dif</th>
                        <th className="py-2.5 px-3 text-center">Pace</th>
                        <th className="py-2.5 px-3 text-center">ORtg</th>
                        <th className="py-2.5 px-3 text-center">DRtg</th>
                        <th className="py-2.5 px-3 text-center">NetRtg</th>
                        <th className="py-2.5 px-3 text-center">eFG%</th>
                        <th className="py-2.5 px-3 text-center">TS%</th>
                        <th className="py-2.5 px-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0E1526]">
                      {sortedGames.map((g, idx) => {
                        const rTot = calculateTeamRowTotals(g.rows);
                        const f = calculateFourFactors(rTot, g.opponentStats);
                        const diff = g.scoreMyTeam - g.scoreOpponent;
                        const isWin = diff > 0;

                        return (
                          <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300">{g.date}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{g.opponentName}</td>
                            <td className="py-2.5 px-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                (g.homeAway || 'home') === 'home'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}>
                                {(g.homeAway || 'home') === 'home' ? <Home className="w-2.5 h-2.5" /> : <Plane className="w-2.5 h-2.5" />}
                                {(g.homeAway || 'home') === 'home' ? 'Local' : 'Visitante'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isWin
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                  : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                              }`}>
                                {isWin ? 'Victoria' : 'Derrota'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono font-black text-slate-900 dark:text-white">
                              {g.scoreMyTeam} - {g.scoreOpponent}
                            </td>
                            <td className={`py-2.5 px-3 text-center font-bold ${isWin ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">{f.pace}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400 font-bold">{f.offensiveRating}</td>
                            <td className="py-2.5 px-3 text-center font-mono text-blue-600 dark:text-blue-400">{f.defensiveRating}</td>
                            <td className={`py-2.5 px-3 text-center font-mono font-bold ${f.netRating >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                              {f.netRating > 0 ? `+${f.netRating}` : f.netRating}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">{f.eFGPct}%</td>
                            <td className="py-2.5 px-3 text-center font-mono">{rTot.tsPct}%</td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => setActiveTab(g.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00205B] dark:text-[#93C5FD] hover:underline cursor-pointer"
                              >
                                <span>Ver Partido</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
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

          {/* =========================================================================
              VISTA 2: PARTIDO INDIVIDUAL SELECCIONADO
             ========================================================================= */}
          {activeGame && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Match Header Card */}
              {(() => {
                const teamTotals = calculateTeamRowTotals(activeGame.rows);
                const factors = calculateFourFactors(teamTotals, activeGame.opponentStats);
                const diff = activeGame.scoreMyTeam - activeGame.scoreOpponent;
                const isWin = diff > 0;
                const isHome = (activeGame.homeAway || 'home') === 'home';

                return (
                  <>
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#00205B] dark:bg-[#0A327E] text-white flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <ClubSomisaLogo size={46} className="bg-white/10 p-0.5 rounded-full" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                              isWin ? 'bg-emerald-400 text-slate-950' : 'bg-red-400 text-slate-950'
                            }`}>
                              {isWin ? 'Victoria' : 'Derrota'}
                            </span>
                            <span className="text-xs text-blue-200 font-bold">
                              {activeGame.date} · {activeGame.competition}
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-black mt-1">
                            {activeGame.myTeamName} vs {activeGame.opponentName}
                          </h2>
                          <div className="flex items-center gap-2 text-xs text-blue-200 mt-0.5">
                            <span className="flex items-center gap-1">
                              {isHome ? <Home className="w-3.5 h-3.5 text-blue-300" /> : <Plane className="w-3.5 h-3.5 text-amber-300" />}
                              Condición: {isHome ? 'Local' : 'Visitante'}
                            </span>
                            <span>·</span>
                            <span>Temporada {activeGame.season}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                          <span className="text-[10px] uppercase font-bold text-blue-200 block">Marcador Final</span>
                          <span className="text-2xl font-black font-mono tracking-tight">
                            {activeGame.scoreMyTeam} - {activeGame.scoreOpponent}
                          </span>
                          <span className={`text-[10px] font-bold block ${isWin ? 'text-emerald-300' : 'text-red-300'}`}>
                            {diff > 0 ? `+${diff} puntos` : `${diff} puntos`}
                          </span>
                        </div>

                        {/* Individual match download options */}
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => {
                              exportSingleGameExcel(activeGame);
                              showFeedback(`Planilla Excel de vs ${activeGame.opponentName} descargada`);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer whitespace-nowrap"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Excel Partido</span>
                          </button>
                          <button
                            onClick={async () => {
                              await exportSingleGamePdf(activeGame);
                              showFeedback(`Planilla PDF de vs ${activeGame.opponentName} descargada`);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/15 hover:bg-white/25 text-white transition-all cursor-pointer whitespace-nowrap"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-300" />
                            <span>PDF Partido</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick Tactical Efficiency Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Pace</span>
                        <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">{factors.pace}</span>
                        <span className="text-[9px] text-slate-500 block">Posesiones</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">ORtg (Ataque)</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{factors.offensiveRating}</span>
                        <span className="text-[9px] text-slate-500 block">Pts/100 pos</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">DRtg (Defensa)</span>
                        <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">{factors.defensiveRating}</span>
                        <span className="text-[9px] text-slate-500 block">Pts rec/100 pos</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Net Rating</span>
                        <span className={`text-sm font-black font-mono ${factors.netRating >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                          {factors.netRating > 0 ? `+${factors.netRating}` : factors.netRating}
                        </span>
                        <span className="text-[9px] text-slate-500 block">Diferencial</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">eFG% (Tiro Ef.)</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{factors.eFGPct}%</span>
                        <span className="text-[9px] text-slate-500 block">Rival: {factors.oppEFGPct}%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">ToV% (Pérdidas)</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{factors.tovPct}%</span>
                        <span className="text-[9px] text-slate-500 block">Rival: {factors.oppTovPct}%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">ORB% (Reb Of)</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{factors.orbPct}%</span>
                        <span className="text-[9px] text-slate-500 block">Segundas opc.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">True Shooting</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{teamTotals.tsPct}%</span>
                        <span className="text-[9px] text-slate-500 block">Tiro real</span>
                      </div>
                    </div>

                    {/* Official Boxscore Table */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-[#00205B] dark:text-[#93C5FD] uppercase tracking-wider">
                          Planilla Oficial del Partido (Box Score Completo)
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {activeGame.rows.length} jugadores en nómina
                        </span>
                      </div>

                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#00205B] text-white text-[11px] font-bold">
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3 min-w-[150px]">Jugador</th>
                              <th className="py-2.5 px-2">Pos</th>
                              <th className="py-2.5 px-2 text-center">MIN</th>
                              <th className="py-2.5 px-2 text-center">2PC/I</th>
                              <th className="py-2.5 px-2 text-center">2P%</th>
                              <th className="py-2.5 px-2 text-center">3PC/I</th>
                              <th className="py-2.5 px-2 text-center">3P%</th>
                              <th className="py-2.5 px-2 text-center">TLC/I</th>
                              <th className="py-2.5 px-2 text-center">TL%</th>
                              <th className="py-2.5 px-2 text-center">REB</th>
                              <th className="py-2.5 px-2 text-center">AST</th>
                              <th className="py-2.5 px-2 text-center">REC</th>
                              <th className="py-2.5 px-2 text-center">PER</th>
                              <th className="py-2.5 px-2 text-center">TAP</th>
                              <th className="py-2.5 px-2 text-center">FC/FR</th>
                              <th className="py-2.5 px-2 text-center bg-blue-900/60 font-black">PTS</th>
                              <th className="py-2.5 px-2 text-center bg-emerald-900/60 font-black">VAL</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-[#0E1526]">
                            {activeGame.rows.map((r) => (
                              <tr key={r.playerName} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="py-2 px-3 font-mono font-bold text-slate-500">{r.playerNumber ?? '-'}</td>
                                <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{r.playerName}</td>
                                <td className="py-2 px-2 text-slate-500 text-[11px]">{r.playerPosition || '-'}</td>
                                <td className="py-2 px-2 text-center font-mono">{r.min}</td>
                                <td className="py-2 px-2 text-center">{r.tc}/{r.ti}</td>
                                <td className="py-2 px-2 text-center">{r.tiPct}%</td>
                                <td className="py-2 px-2 text-center">{r.c3p}/{r.i3p}</td>
                                <td className="py-2 px-2 text-center">{r.pct3p}%</td>
                                <td className="py-2 px-2 text-center">{r.tlc}/{r.tli}</td>
                                <td className="py-2 px-2 text-center">{r.tlPct}%</td>
                                <td className="py-2 px-2 text-center font-semibold">{r.rt}</td>
                                <td className="py-2 px-2 text-center font-semibold">{r.as}</td>
                                <td className="py-2 px-2 text-center">{r.rec}</td>
                                <td className="py-2 px-2 text-center">{r.per}</td>
                                <td className="py-2 px-2 text-center">{r.tap}</td>
                                <td className="py-2 px-2 text-center">{r.fpc}/{r.fpr}</td>
                                <td className="py-2 px-2 text-center font-black text-[#00205B] dark:text-blue-300 bg-blue-50/40 dark:bg-blue-950/20">{r.pt}</td>
                                <td className="py-2 px-2 text-center font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">{r.ptsTot}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-[#00205B] text-white font-bold text-xs">
                              <td className="py-2.5 px-3">∑</td>
                              <td className="py-2.5 px-3">TOTALES SOMISA</td>
                              <td className="py-2.5 px-2"></td>
                              <td className="py-2.5 px-2 text-center font-mono">{teamTotals.min}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.tc}/{teamTotals.ti}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.tiPct}%</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.c3p}/{teamTotals.i3p}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.pct3p}%</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.tlc}/{teamTotals.tli}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.tlPct}%</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.rt}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.as}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.rec}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.per}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.tap}</td>
                              <td className="py-2.5 px-2 text-center">{teamTotals.fpc}/{teamTotals.fpr}</td>
                              <td className="py-2.5 px-2 text-center font-black">{teamTotals.pt}</td>
                              <td className="py-2.5 px-2 text-center font-black">{teamTotals.ptsTot}</td>
                            </tr>
                            {activeGame.opponentStats && (
                              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                                <td className="py-2 px-3">∑</td>
                                <td className="py-2 px-3">TOTALES {activeGame.opponentName}</td>
                                <td className="py-2 px-2"></td>
                                <td className="py-2 px-2 text-center font-mono">{teamTotals.min}</td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.tc}/{activeGame.opponentStats.ti}</td>
                                <td className="py-2 px-2 text-center">
                                  {activeGame.opponentStats.ti > 0 ? ((activeGame.opponentStats.tc / activeGame.opponentStats.ti) * 100).toFixed(0) : 0}%
                                </td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.c3p}/{activeGame.opponentStats.i3p}</td>
                                <td className="py-2 px-2 text-center">
                                  {activeGame.opponentStats.i3p > 0 ? ((activeGame.opponentStats.c3p / activeGame.opponentStats.i3p) * 100).toFixed(0) : 0}%
                                </td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.tlc}/{activeGame.opponentStats.tli}</td>
                                <td className="py-2 px-2 text-center">
                                  {activeGame.opponentStats.tli > 0 ? ((activeGame.opponentStats.tlc / activeGame.opponentStats.tli) * 100).toFixed(0) : 0}%
                                </td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.rd + activeGame.opponentStats.ro}</td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.as}</td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.rec}</td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.per}</td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.tap}</td>
                                <td className="py-2 px-2 text-center">{activeGame.opponentStats.fpc}</td>
                                <td className="py-2 px-2 text-center font-black">{activeGame.opponentStats.pts}</td>
                                <td className="py-2 px-2 text-center">-</td>
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ClubSomisaLogo size={20} showBorder={false} />
            <span>Club SOMISA San Nicolás · Reporte Oficial de Temporada ({sortedGames.length} Partidos)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                exportAllGamesExcel(sortedGames);
                showFeedback('Descargando libro Excel con todas las hojas...');
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Exportar Excel Completo</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
