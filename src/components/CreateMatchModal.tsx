import React, { useState } from 'react';
import { PlusCircle, X, Calendar, Trophy, Users, Shield } from 'lucide-react';
import { Game } from '../types/basketball';
import { getSampleGameRows } from '../utils/storage';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGames: Game[];
  onCreateGame: (newGame: Game) => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  onCreateGame,
}) => {
  const [myTeam, setMyTeam] = useState('SOMISA (San Nicolas)');
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [competition, setCompetition] = useState('LIGA PCIAL FBB (Masculino 2026) - CABB');
  const [season, setSeason] = useState('2026');
  const [homeAway, setHomeAway] = useState<'home' | 'away'>('home');
  const [scoreOpponent, setScoreOpponent] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim()) return;

    const freshRows = getSampleGameRows().map(r => ({
      ...r,
      min: '00:00',
      minSeconds: 0,
      tc: 0,
      ti: 0,
      tiPct: 0,
      c3p: 0,
      i3p: 0,
      pct3p: 0,
      ar3p: 0,
      tlc: 0,
      tli: 0,
      tlPct: 0,
      ftr: 0,
      efgPct: 0,
      tsPct: 0,
      tovPct: 0,
      rd: 0,
      ro: 0,
      rt: 0,
      as: 0,
      rec: 0,
      per: 0,
      tap: 0,
      fpc: 0,
      fpr: 0,
      pt: 0,
      ptsTot: 0
    }));

    const newGame: Game = {
      id: `game_${Date.now()}`,
      title: `${myTeam} vs ${opponent}`,
      date,
      competition,
      season,
      homeAway,
      myTeamName: myTeam,
      opponentName: opponent,
      scoreMyTeam: 0,
      scoreOpponent: Number(scoreOpponent) || 0,
      notes: 'Partido registrado en la temporada.',
      rows: freshRows,
      shots: []
    };

    onCreateGame(newGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-3 font-bold text-sm">
            <ClubSomisaLogo size={32} className="bg-white/10 p-0.5 rounded-full" />
            <span>Dar de Alta Nuevo Partido · SOMISA</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Mi Equipo
              </label>
              <input
                type="text"
                value={myTeam}
                onChange={(e) => setMyTeam(e.target.value)}
                required
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Equipo Rival
              </label>
              <input
                type="text"
                placeholder="Ej. GIMNASIA (Pergamino)"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                required
                className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-xs font-medium py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Condición
              </label>
              <select
                value={homeAway}
                onChange={(e) => setHomeAway(e.target.value as any)}
                className="w-full text-xs font-medium py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="home">Local (San Nicolás)</option>
                <option value="away">Visitante</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Torneo / Liga
              </label>
              <input
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                className="w-full text-xs font-medium py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Puntos Rival (opcional)
              </label>
              <input
                type="number"
                min="0"
                value={scoreOpponent}
                onChange={(e) => setScoreOpponent(parseInt(e.target.value) || 0)}
                className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] rounded-lg shadow-sm"
            >
              Crear Partido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
