import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  X, 
  Layers, 
  Users, 
  TrendingUp, 
  Table, 
  Check, 
  Sparkles,
  Calendar,
  Trophy
} from 'lucide-react';
import { Game } from '../types/basketball';
import { 
  exportComprehensivePdf, 
  exportSeasonTotalsPdf,
  exportSingleGamePdf,
  exportTeamSummaryPdf, 
  exportPlayerSummaryPdf 
} from '../utils/exportPdf';
import { 
  exportComprehensiveExcel, 
  exportSeasonTotalsExcel,
  exportSeasonTotalsCsv,
  exportSingleGameExcel,
  exportAllGamesExcel,
  exportSingleGameCsv,
  exportGameToCsv, 
  exportTeamSummaryExcel, 
  exportPlayerSummaryExcel, 
  exportTeamSummaryCsv, 
  exportPlayerSummaryCsv 
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
  // Main mode: 'totals' (Resumen Total Individual y del Equipo) vs 'matches' (Por Partidos) vs 'full' (Reporte 3 en 1)
  const [activeTab, setActiveTab] = useState<'totals' | 'matches' | 'full'>('totals');
  const [selectedGameId, setSelectedGameId] = useState<string>(game.id || (allGames[0]?.id ?? ''));
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const triggerFeedback = (label: string) => {
    setDownloadSuccess(label);
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const selectedGame = allGames.find(g => g.id === selectedGameId) || game;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with SOMISA Crest and Pantone 281 C branding */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-3">
            <ClubSomisaLogo size={40} className="bg-white/10 p-0.5 rounded-full drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide">CLUB SOMISA SAN NICOLÁS</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Exportación de Datos
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Elige exportar el Resumen Total de la temporada o planillas por partidos
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

        <div className="p-6 space-y-6">
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
              <span>Resumen Total (Equipo + Individual)</span>
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

          {/* TAB 1: RESUMEN TOTAL (INDIVIDUAL Y DEL EQUIPO) */}
          {activeTab === 'totals' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900 dark:text-amber-300 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Archivo Acumulado: Resumen Total Individual y del Equipo</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Exporta un archivo completo con el consolidado acumulado de toda la temporada ({allGames.length} partido(s)):
                  incluye el <strong>Resumen Total del Equipo</strong> (Récord de victorias/derrotas, 4 factores de Dean Oliver, Posesiones, Ratings de eficiencia y desglose de puntos) y el <strong>Resumen Total Individual</strong> (Tabla de todos los jugadores de SOMISA con dorsales, partidos jugados, promedios PTS/REB/AST/VAL por partido, porcentajes 2P%, 3P%, TL% y totales).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Excel Resumen Total */}
                <button
                  onClick={() => {
                    exportSeasonTotalsExcel(allGames);
                    triggerFeedback('Libro Excel (.xlsx) con Resumen de Equipo e Individual');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-emerald-400 dark:border-emerald-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:shadow-md transition-all text-center group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Excel Total (.xlsx)</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">2 Hojas Completas</span>
                  <span className="text-[10px] text-slate-500 mt-1">Hoja 1: Resumen Equipo · Hoja 2: Resumen Jugadores</span>
                </button>

                {/* PDF Resumen Total */}
                <button
                  onClick={async () => {
                    await exportSeasonTotalsPdf(allGames);
                    triggerFeedback('Reporte PDF Oficial con Escudo SOMISA (2 páginas)');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md transition-all text-center group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">PDF Total (A4)</span>
                  <span className="text-[10px] text-red-600 dark:text-red-400 font-bold mt-0.5">Con Escudo Oficial</span>
                  <span className="text-[10px] text-slate-500 mt-1">Pág 1: Equipo · Pág 2: Jugadores</span>
                </button>

                {/* CSV Resumen Total */}
                <button
                  onClick={() => {
                    exportSeasonTotalsCsv(allGames);
                    triggerFeedback('Archivo CSV con Resumen de Equipo e Individual');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all text-center group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
                    <Download className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CSV Total (.csv)</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">Multi-sección</span>
                  <span className="text-[10px] text-slate-500 mt-1">Datos estructurados de equipo e individual</span>
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
                    Elige el encuentro del cual deseas descargar la planilla oficial CABB / FBB:
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
                    Genera un único libro de Excel donde cada partido de la temporada cuenta con su propia pestaña y planilla técnica oficial.
                  </p>
                  <button
                    onClick={() => {
                      exportAllGamesExcel(allGames);
                      triggerFeedback(`Libro Excel con ${allGames.length} partidos (una hoja por partido)`);
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
                        triggerFeedback(`Planilla Excel de ${selectedGame.opponentName}`);
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-all text-center group cursor-pointer"
                    >
                      <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Planilla Excel (.xlsx)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Planilla oficial del partido</span>
                    </button>

                    <button
                      onClick={async () => {
                        await exportSingleGamePdf(selectedGame);
                        triggerFeedback(`Planilla PDF de ${selectedGame.opponentName} con Escudo`);
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 transition-all text-center group cursor-pointer"
                    >
                      <FileText className="w-8 h-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Planilla PDF (A4)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Con Escudo Oficial SOMISA</span>
                    </button>

                    <button
                      onClick={() => {
                        exportSingleGameCsv(selectedGame);
                        triggerFeedback(`Planilla CSV de ${selectedGame.opponentName}`);
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-all text-center group cursor-pointer"
                    >
                      <Download className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Planilla CSV (.csv)</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">Datos delimitados por comas</span>
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
                  <span>Reporte Consolidado Técnico (Planilla + Factores + Jugadores)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Exporta en un solo archivo los 3 apartados del encuentro <strong>{game.myTeamName} vs {game.opponentName}</strong>: Planilla Oficial del partido, Análisis de los 4 Factores de Dean Oliver, y la plantilla con sus promedios acumulados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => {
                    exportComprehensiveExcel(game, allGames);
                    triggerFeedback('Libro Excel (.xlsx) con 3 hojas');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:border-emerald-300 transition-all text-center group cursor-pointer"
                >
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Excel Consolidado (.xlsx)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">3 Hojas independientes</span>
                </button>

                <button
                  onClick={async () => {
                    await exportComprehensivePdf(game, allGames);
                    triggerFeedback('PDF Técnico Consolidado (3 páginas con escudo)');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-300 transition-all text-center group cursor-pointer"
                >
                  <FileText className="w-8 h-8 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">PDF Consolidado (A4)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">3 Páginas con Escudo SOMISA</span>
                </button>

                <button
                  onClick={() => {
                    exportGameToCsv(game, allGames);
                    triggerFeedback('CSV Consolidado');
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-300 transition-all text-center group cursor-pointer"
                >
                  <Download className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">CSV Consolidado (.csv)</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Multi-sección estructurado</span>
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
