import React, { useState, useMemo } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  X, 
  Layers, 
  Table, 
  Check, 
  Sparkles,
  Calendar,
  Trophy,
  SlidersHorizontal,
  RotateCcw,
  Gauge
} from 'lucide-react';
import { Game } from '../types/basketball';
import { 
  exportComprehensivePdf, 
  exportSeasonTotalsPdf,
  exportSingleGamePdf
} from '../utils/exportPdf';
import { 
  exportComprehensiveExcel, 
  exportSeasonTotalsExcel,
  exportSeasonTotalsCsv,
  exportSingleGameExcel,
  exportAllGamesExcel,
  exportSingleGameCsv,
  exportGameToCsv,
  computeAggregatedTeamTotals
} from '../utils/exportCsv';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  allGames?: Game[];
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  game,
  allGames = [game],
}) => {
  // Main mode: 'totals' (Resumen Total Individual y del Equipo + Eficiencia Avanzada) vs 'matches' (Por Partidos) vs 'full' (Reporte 3 en 1)
  const [activeTab, setActiveTab] = useState<'totals' | 'matches' | 'full'>('totals');
  const [selectedGameId, setSelectedGameId] = useState<string>(game.id || (allGames[0]?.id ?? ''));
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Filters for exported sample (Date range, Competition, Venue, Quick Presets)
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [selectedVenue, setSelectedVenue] = useState<'all' | 'home' | 'away'>('all');
  const [selectedPreset, setSelectedPreset] = useState<'all' | 'last3' | 'last5' | 'custom'>('all');

  const competitionOptions = useMemo(() => {
    const set = new Set<string>();
    allGames.forEach(g => {
      if (g.competition && g.competition.trim()) {
        set.add(g.competition.trim());
      }
    });
    return Array.from(set);
  }, [allGames]);

  const filteredExportGames = useMemo(() => {
    let list = [...allGames].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (selectedPreset === 'last3') {
      list = list.slice(-3);
    } else if (selectedPreset === 'last5') {
      list = list.slice(-5);
    }

    return list.filter(g => {
      if (startDate && g.date < startDate) return false;
      if (endDate && g.date > endDate) return false;
      if (selectedCompetition !== 'all' && g.competition !== selectedCompetition) return false;
      if (selectedVenue !== 'all' && g.homeAway !== selectedVenue) return false;
      return true;
    });
  }, [allGames, startDate, endDate, selectedCompetition, selectedVenue, selectedPreset]);

  const previewTotals = useMemo(() => {
    return computeAggregatedTeamTotals(filteredExportGames.length > 0 ? filteredExportGames : allGames);
  }, [filteredExportGames, allGames]);

  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (selectedPreset === 'last3') parts.push('Últimos 3 partidos');
    if (selectedPreset === 'last5') parts.push('Últimos 5 partidos');
    if (startDate || endDate) parts.push(`Rango: ${startDate || 'Inicio'} a ${endDate || 'Actual'}`);
    if (selectedCompetition !== 'all') parts.push(`Competencia: ${selectedCompetition}`);
    if (selectedVenue !== 'all') parts.push(`Condición: ${selectedVenue === 'home' ? 'Solo Local' : 'Solo Visitante'}`);
    return parts.length > 0 ? parts.join(' · ') : 'Temporada Completa (Todos los partidos)';
  }, [selectedPreset, startDate, endDate, selectedCompetition, selectedVenue]);

  if (!isOpen) return null;

  const triggerFeedback = (label: string) => {
    setDownloadSuccess(label);
    setTimeout(() => setDownloadSuccess(null), 2800);
  };

  const selectedGame = allGames.find(g => g.id === selectedGameId) || game;
  const exportSampleGames = filteredExportGames.length > 0 ? filteredExportGames : allGames;
  const hasActiveFilters = startDate !== '' || endDate !== '' || selectedCompetition !== 'all' || selectedVenue !== 'all' || selectedPreset !== 'all';

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCompetition('all');
    setSelectedVenue('all');
    setSelectedPreset('all');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with SOMISA Crest and Pantone 281 C branding */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-3">
            <ClubSomisaLogo size={42} className="bg-white/10 p-0.5 rounded-full drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide">CLUB SOMISA SAN NICOLÁS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Reporte & Eficiencia Avanzada
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Exporta Planillas Oficiales, 4 Factores, ORtg, DRtg, Pace, TS% y Evolución por Partido
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {downloadSuccess && (
          <div className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Descarga generada con éxito: <strong>{downloadSuccess}</strong></span>
          </div>
        )}

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Main Navigation Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveTab('totals')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'totals'
                  ? 'bg-white dark:bg-[#0E1526] text-[#00205B] dark:text-[#93C5FD] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Resumen Total + Eficiencia Avanzada</span>
            </button>

            <button
              onClick={() => setActiveTab('matches')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'matches'
                  ? 'bg-white dark:bg-[#0E1526] text-[#00205B] dark:text-[#93C5FD] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Table className="w-4 h-4 text-emerald-500" />
              <span>Por Partidos</span>
            </button>

            <button
              onClick={() => setActiveTab('full')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all cursor-pointer ${
                activeTab === 'full'
                  ? 'bg-white dark:bg-[#0E1526] text-[#00205B] dark:text-[#93C5FD] shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-500" />
              <span>Reporte Consolidado (3 en 1)</span>
            </button>
          </div>

          {/* ========================================================================
              FILTROS DE EFICIENCIA AVANZADA PARA EL REPORTE EXPORTADO
             ======================================================================== */}
          {(activeTab === 'totals' || activeTab === 'full') && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#00205B] dark:text-[#93C5FD]">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filtrar Rango de Fechas / Competencia para el Reporte Exportado:</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    onClick={() => {
                      setSelectedPreset('all');
                      setStartDate('');
                      setEndDate('');
                      setSelectedCompetition('all');
                      setSelectedVenue('all');
                    }}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      selectedPreset === 'all' && !hasActiveFilters
                        ? 'bg-[#00205B] text-white dark:bg-[#93C5FD] dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Todos ({allGames.length})
                  </button>
                  <button
                    onClick={() => setSelectedPreset('last3')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      selectedPreset === 'last3'
                        ? 'bg-[#00205B] text-white dark:bg-[#93C5FD] dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Últimos 3
                  </button>
                  <button
                    onClick={() => setSelectedPreset('last5')}
                    className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                      selectedPreset === 'last5'
                        ? 'bg-[#00205B] text-white dark:bg-[#93C5FD] dark:text-slate-900'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Últimos 5
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="flex items-center gap-1 px-2 py-0.5 rounded font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpiar</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Fecha Desde</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Fecha Hasta</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Competencia</label>
                  <select
                    value={selectedCompetition}
                    onChange={(e) => {
                      setSelectedCompetition(e.target.value);
                      setSelectedPreset('custom');
                    }}
                    className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Todas las competencias</option>
                    {competitionOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Condición</label>
                  <select
                    value={selectedVenue}
                    onChange={(e) => {
                      setSelectedVenue(e.target.value as any);
                      setSelectedPreset('custom');
                    }}
                    className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  >
                    <option value="all">Local y Visitante</option>
                    <option value="home">Solo Local</option>
                    <option value="away">Solo Visitante</option>
                  </select>
                </div>
              </div>

              {/* Live preview of the Advanced Efficiency stats that will be exported */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Gauge className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    Muestra a exportar: <strong>{exportSampleGames.length} partido(s)</strong> ({previewTotals.wins}V-{previewTotals.losses}D)
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#00205B] dark:text-[#93C5FD] font-bold">
                    ORtg: {previewTotals.offensiveRating}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    DRtg: {previewTotals.defensiveRating}
                  </span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    previewTotals.netRating >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                  }`}>
                    Net: {previewTotals.netRating > 0 ? `+${previewTotals.netRating}` : previewTotals.netRating}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold">
                    Pace: {previewTotals.pace}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                    TS%: {previewTotals.trueShootingPct}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: RESUMEN TOTAL (INDIVIDUAL Y DEL EQUIPO + EFICIENCIA AVANZADA) */}
          {activeTab === 'totals' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-300 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Archivo Acumulado: Resumen del Equipo, Eficiencia Avanzada y Plantilla Individual</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Incluye todos los datos nuevos de <strong>Eficiencia Avanzada</strong> ({exportSampleGames.length} partido(s)):
                  <strong> Offensive Rating (ORtg), Defensive Rating (DRtg), Net Rating, Pace, Puntos Por Posesión (PPP), True Shooting (TS%), Relación AST/PER, Canastas Asistidas (AST%), 4 Factores de Dean Oliver, Tabla de Evolución Partido a Partido</strong> y el <strong>Resumen Individual Completo</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Excel Resumen Total */}
                <button
                  onClick={() => {
                    exportSeasonTotalsExcel(exportSampleGames, filterDescription);
                    triggerFeedback('Libro Excel (.xlsx) con Eficiencia Avanzada, Evolución y Jugadores');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-emerald-400 dark:border-emerald-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:shadow-md transition-all text-center group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Excel Total (.xlsx)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Eficiencia + Jugadores</span>
                  <span className="text-[10px] text-slate-500 mt-1">ORtg, DRtg, Pace, TS%, Evolución y Plantilla</span>
                </button>

                {/* PDF Resumen Total */}
                <button
                  onClick={async () => {
                    await exportSeasonTotalsPdf(exportSampleGames, filterDescription);
                    triggerFeedback('Reporte PDF Oficial con Eficiencia Avanzada y Escudo SOMISA');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all text-center group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">PDF Total (A4)</span>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-0.5">Con Escudo Oficial</span>
                  <span className="text-[10px] text-slate-500 mt-1">Pág 1: Eficiencia & Evolución · Pág 2: Jugadores</span>
                </button>

                {/* CSV Resumen Total */}
                <button
                  onClick={() => {
                    exportSeasonTotalsCsv(exportSampleGames, filterDescription);
                    triggerFeedback('Archivo CSV con Eficiencia Avanzada, Evolución e Individual');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-center group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
                    <Download className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CSV Total (.csv)</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">Multi-sección</span>
                  <span className="text-[10px] text-slate-500 mt-1">Ratings, 4 Factores, Evolución y Plantilla</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: POR PARTIDOS */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 font-bold text-xs text-emerald-900 dark:text-emerald-300 mb-1">
                    <Table className="w-4 h-4 text-emerald-600" />
                    <span>Seleccionar Partido a Exportar</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Elige el encuentro del cual deseas descargar la planilla oficial con su Eficiencia Avanzada:
                  </p>
                </div>

                <div className="w-full sm:w-auto min-w-[240px]">
                  <select
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="w-full text-xs font-bold py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#00205B] dark:text-[#93C5FD] shadow-xs focus:ring-2 focus:ring-[#00205B] focus:outline-hidden"
                  >
                    <option value="ALL_GAMES">-- Todos los Partidos (Libro Unificado) --</option>
                    {allGames.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.myTeamName} ({g.scoreMyTeam}) vs {g.opponentName} ({g.scoreOpponent}) - {g.date}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedGameId === 'ALL_GAMES' ? (
                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span>Exportación Unificada de Todos los Partidos ({allGames.length} encuentros)</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Genera un único libro de Excel con una hoja inicial de <strong>Eficiencia Global & Evolución</strong> más una pestaña individual por cada partido jugado.
                  </p>
                  <button
                    onClick={() => {
                      exportAllGamesExcel(allGames);
                      triggerFeedback(`Libro Excel con Eficiencia Global + ${allGames.length} partidos`);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Descargar Libro con Todos los Partidos (.xlsx)</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Selected Match Details Preview */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Partido Seleccionado</span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                        {selectedGame.myTeamName} vs {selectedGame.opponentName}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {selectedGame.date} · {selectedGame.competition} · Condición: {selectedGame.homeAway === 'home' ? 'Local' : 'Visitante'}
                      </span>
                    </div>
                    <div className="text-right px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">
                      <span className="text-[10px] font-bold text-[#00205B] dark:text-[#93C5FD] block uppercase">Resultado</span>
                      <span className="text-base font-black font-mono text-[#00205B] dark:text-white">
                        {selectedGame.scoreMyTeam} - {selectedGame.scoreOpponent}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => {
                        exportSingleGameExcel(selectedGame);
                        triggerFeedback(`Planilla Excel + Eficiencia de ${selectedGame.opponentName}`);
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-all text-center group cursor-pointer"
                    >
                      <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Planilla Excel (.xlsx)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Planilla + Eficiencia Avanzada</span>
                    </button>

                    <button
                      onClick={async () => {
                        await exportSingleGamePdf(selectedGame);
                        triggerFeedback(`Planilla PDF de ${selectedGame.opponentName} con Escudo y Eficiencia`);
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 transition-all text-center group cursor-pointer"
                    >
                      <FileText className="w-8 h-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Planilla PDF (A4)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Con Escudo + ORtg/DRtg/Pace</span>
                    </button>

                    <button
                      onClick={() => {
                        exportSingleGameCsv(selectedGame);
                        triggerFeedback(`Planilla CSV + Eficiencia de ${selectedGame.opponentName}`);
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-all text-center group cursor-pointer"
                    >
                      <Download className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Planilla CSV (.csv)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Box Score + Eficiencia Avanzada</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPORTE CONSOLIDADO (3 EN 1) */}
          {activeTab === 'full' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
                <div className="flex items-center gap-2 font-bold text-xs text-purple-900 dark:text-purple-300 mb-1">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Reporte Consolidado Técnico (Planilla + Eficiencia Avanzada + Jugadores)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Exporta en un solo archivo los 3 apartados del encuentro <strong>{game.myTeamName} vs {game.opponentName}</strong>: Planilla Oficial del partido, <strong>Eficiencia Avanzada (ORtg, DRtg, Net Rating, Pace, PPP, TS%, AST/PER, 4 Factores y Evolución de los {exportSampleGames.length} partidos filtrados)</strong>, y la plantilla con sus promedios acumulados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    exportComprehensiveExcel(game, exportSampleGames);
                    triggerFeedback('Libro Excel (.xlsx) con 3 hojas y Eficiencia Avanzada');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-all text-center group cursor-pointer"
                >
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Excel Consolidado (.xlsx)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">3 Hojas + Eficiencia Avanzada</span>
                </button>

                <button
                  onClick={async () => {
                    await exportComprehensivePdf(game, exportSampleGames);
                    triggerFeedback('PDF Técnico Consolidado (3 páginas con Eficiencia Avanzada)');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 transition-all text-center group cursor-pointer"
                >
                  <FileText className="w-8 h-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">PDF Consolidado (A4)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">3 Páginas con Escudo y Ratings</span>
                </button>

                <button
                  onClick={() => {
                    exportGameToCsv(game, exportSampleGames);
                    triggerFeedback('CSV Consolidado con Eficiencia Avanzada');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-all text-center group cursor-pointer"
                >
                  <Download className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CSV Consolidado (.csv)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Planilla + Eficiencia + Plantilla</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ClubSomisaLogo size={18} showBorder={false} />
            <span>Sistema Oficial CABB / FBB · Club SOMISA San Nicolás</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
