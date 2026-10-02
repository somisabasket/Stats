import React, { useState } from 'react';
import { Trophy, Plus, Trash2, Calendar, Shield, ArrowRight } from 'lucide-react';
import { Game } from '../types/basketball';
import { calculateTeamRowTotals } from '../utils/calculations';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface SeasonManagerProps {
  games: Game[];
  currentGameId: string;
  onSelectGame: (gameId: string) => void;
  onCreateGame: (newGame: Game) => void;
  onDeleteGame: (gameId: string) => void;
  onImportBackup?: (games: Game[]) => void;
}

export const SeasonManager: React.FC<SeasonManagerProps> = ({
  games,
  currentGameId,
  onSelectGame,
  onDeleteGame,
}) => {
  const [filterSeason, setFilterSeason] = useState('all');

  const seasons = Array.from(new Set(games.map(g => g.season || '2026')));
  const filtered = filterSeason === 'all' ? games : games.filter(g => g.season === filterSeason);

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

        <div className="flex items-center gap-2">
          <span className="text-xs text-white/80 font-medium">Filtrar Temporada:</span>
          <select
            value={filterSeason}
            onChange={(e) => setFilterSeason(e.target.value)}
            className="text-xs font-bold py-1.5 px-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-hidden"
          >
            <option value="all" className="text-slate-900">Todas las Temporadas</option>
            {seasons.map(s => (
              <option key={s} value={s} className="text-slate-900">Temporada {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(g => {
          const isSelected = g.id === currentGameId;
          const isWin = g.scoreMyTeam > g.scoreOpponent;
          const isLoss = g.scoreMyTeam < g.scoreOpponent;

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
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{g.date}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isWin ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                  isLoss ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {isWin ? 'Victoria' : isLoss ? 'Derrota' : 'Empate'}
                </span>
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
