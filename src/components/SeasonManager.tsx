import React, { useState } from 'react';
import { Trophy, Plus, Trash2, Calendar, Shield, ArrowRight, Home, Plane, Filter, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Game } from '../types/basketball';
import { calculateTeamRowTotals } from '../utils/calculations';
import { formatToInputDate } from '../utils/storage';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface SeasonManagerProps {
  games: Game[];
  currentGameId: string;
  onSelectGame: (gameId: string) => void;
  onCreateGame: (newGame: Game) => void;
  onDeleteGame: (gameId: string) => void;
  onImportBackup?: (games: Game[]) => void;
  onUpdateGame?: (gameId: string, updated: Partial<Game>) => void;
  onOpenAllMatchesReportModal?: () => void;
}

export const SeasonManager: React.FC<SeasonManagerProps> = ({
  games,
  currentGameId,
  onSelectGame,
  onDeleteGame,
  onUpdateGame,
  onOpenAllMatchesReportModal,
}) => {
  const [filterSeason, setFilterSeason] = useState('all');
  const [filterVenue, setFilterVenue] = useState<'all' | 'home' | 'away'>('all');
  const [savedNoticeId, setSavedNoticeId] = useState<string | null>(null);

  const seasons = Array.from(new Set(games.map(g => g.season || '2026')));
  
  const filtered = games.filter(g => {
    if (filterSeason !== 'all' && (g.season || '2026') !== filterSeason) return false;
    if (filterVenue !== 'all' && (g.homeAway || 'home') !== filterVenue) return false;
    return true;
  });

  // Season record calculation
  const wins = games.filter(g => g.scoreMyTeam > g.scoreOpponent).length;
  const losses = games.filter(g => g.scoreMyTeam < g.scoreOpponent).length;

  return (
    <div className="space-y-6">
      {/* Season Summary Banner with SOMISA Crest */}
      <div className="p-6 rounded-2xl bg-[#00205B] dark:bg-[#0A327E] text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ClubSomisaLogo size={52} className="drop-shadow-md bg-white/10 p-0.5 rounded-full" />
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-blue-200">Temporada Oficial</span>
            <h2 className="text-2xl font-black tracking-tight">Club SOMISA San Nicolás</h2>
            <p className="text-xs text-white/80 mt-1">
              Registro total: <span className="font-bold font-mono text-emerald-300">{wins} Victorias</span> - <span className="font-bold font-mono text-red-300">{losses} Derrotas</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/80 font-medium">Condición:</span>
            <div className="inline-flex items-center rounded-lg p-0.5 bg-white/10 border border-white/20">
              <button
                type="button"
                onClick={() => setFilterVenue('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  filterVenue === 'all'
                    ? 'bg-white text-[#00205B] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFilterVenue('home')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  filterVenue === 'home'
                    ? 'bg-white text-[#00205B] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Home className="w-3 h-3" />
                <span>Local</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterVenue('away')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  filterVenue === 'away'
                    ? 'bg-amber-400 text-[#00205B] shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                <Plane className="w-3 h-3" />
                <span>Visitante</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/80 font-medium">Temporada:</span>
            <select
              value={filterSeason}
              onChange={(e) => setFilterSeason(e.target.value)}
              className="text-xs font-bold py-1.5 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-hidden cursor-pointer"
            >
              <option value="all" className="text-slate-900">Todas las Temporadas</option>
              {seasons.map(s => (
                <option key={s} value={s} className="text-slate-900">Temporada {s}</option>
              ))}
            </select>
          </div>

          {onOpenAllMatchesReportModal && (
            <button
              type="button"
              onClick={onOpenAllMatchesReportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all cursor-pointer shadow-xs active:scale-95 whitespace-nowrap"
              title="Abrir reporte integral: Estadísticas de todos los partidos separados y resumen general acumulado"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Reporte Completo (Todos los Partidos)</span>
            </button>
          )}
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(g => {
          const isSelected = g.id === currentGameId;
          const isWin = g.scoreMyTeam > g.scoreOpponent;
          const isLoss = g.scoreMyTeam < g.scoreOpponent;
          const isHome = (g.homeAway || 'home') === 'home';

          return (
            <div
              key={g.id}
              onClick={() => onSelectGame(g.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-[#00205B] dark:border-[#93C5FD] bg-blue-50/30 dark:bg-blue-950/30 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1526] hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2 gap-2">
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={formatToInputDate(g.date)}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (e.target.value && onUpdateGame) {
                        onUpdateGame(g.id, { date: e.target.value });
                        setSavedNoticeId(g.id);
                        setTimeout(() => setSavedNoticeId(null), 2500);
                      }
                    }}
                    className="bg-slate-100/70 hover:bg-slate-200/80 dark:bg-slate-800/70 dark:hover:bg-slate-700/80 px-2 py-0.5 rounded text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer focus:outline-hidden"
                    title="Editar fecha del partido (se guarda automáticamente)"
                  />
                  {savedNoticeId === g.id && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold animate-pulse">
                      ✓ Guardado
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Botón interactivo para alternar condición Local / Visitante */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUpdateGame) {
                        onUpdateGame(g.id, { homeAway: isHome ? 'away' : 'home' });
                        setSavedNoticeId(g.id);
                        setTimeout(() => setSavedNoticeId(null), 2500);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-extrabold uppercase tracking-wider border transition-colors cursor-pointer ${
                      isHome
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-[#00205B] dark:text-[#93C5FD] border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                        : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 hover:bg-amber-100'
                    }`}
                    title="Hacer clic para alternar entre Local y Visitante (se guarda automáticamente)"
                  >
                    {isHome ? <Home className="w-3 h-3" /> : <Plane className="w-3 h-3" />}
                    <span>{isHome ? 'Local' : 'Visitante'}</span>
                  </button>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isWin ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                    isLoss ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {isWin ? 'Victoria' : isLoss ? 'Derrota' : 'Empate'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between my-3">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{g.myTeamName}</h4>
                  <p className="text-xs text-slate-500">{g.opponentName}</p>
                </div>
                <div className="text-right font-mono font-black text-xl text-slate-900 dark:text-white">
                  {g.scoreMyTeam} - {g.scoreOpponent}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
                <span className="truncate max-w-[180px]">{g.competition}</span>
                <span className="flex items-center gap-1 text-[#00205B] dark:text-[#93C5FD] font-semibold">
                  <span>Ver Planilla</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
