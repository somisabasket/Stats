import React, { useState } from 'react';
import { Plus, X, Calendar, Shield, Users } from 'lucide-react';
import { Game } from '../types/basketball';
import { getSampleGameRows } from '../utils/storage';
import { calculateRowMetrics } from '../utils/calculations';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingGames: Game[];
  onCreateGame: (newGame: Game) => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  existingGames,
  onCreateGame,
}) => {
  const [opponentName, setOpponentName] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [competition, setCompetition] = useState('Liga Federal de Básquet');
  const [homeAway, setHomeAway] = useState<'home' | 'away'>('home');
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [copyRoster, setCopyRoster] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentName.trim()) return;

    const newGameId = `somisa_match_${Date.now()}`;
    
    // Copy player names from existing game or default SOMISA roster
    let templateRows = existingGames[0]?.rows || getSampleGameRows();
    
    const newRows = templateRows.map((r) =>
      calculateRowMetrics({
        id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        playerNumber: r.playerNumber,
        playerName: r.playerName,
        playerPosition: r.playerPosition,
        min: '00:00',
        tc: 0,
        ti: 0,
        c3p: 0,
        i3p: 0,
        tlc: 0,
        tli: 0,
        rd: 0,
        ro: 0,
        as: 0,
        rec: 0,
        per: 0,
        tap: 0,
        fpc: 0,
        fpr: 0,
        ptsTot: 0,
      })
    );

    const newGame: Game = {
      id: newGameId,
      title: `Club SOMISA vs ${opponentName.trim()}`,
      date: matchDate,
      competition: competition.trim() || 'Liga Federal de Básquet',
      season: '2026',
      homeAway,
      myTeamName: 'Club SOMISA',
      opponentName: opponentName.trim(),
      scoreMyTeam: 0,
      scoreOpponent: opponentScore,
      notes: `Partido dado de alta el ${matchDate}.`,
      rows: newRows,
      shots: [],
    };

    onCreateGame(newGame);
    onClose();
    setOpponentName('');
    setOpponentScore(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Dar de Alta Partido</h3>
              <p className="text-[11px] text-white/80">Club SOMISA · Carga de Estadísticas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Rival Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Equipo Rival / Oponente *
            </label>
            <input
              type="text"
              placeholder="Ej. Regatas San Nicolás, Belgrano, etc."
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
              required
              autoFocus
            />
          </div>

          {/* Date & Competition Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha del Encuentro *
              </label>
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Puntos del Rival
              </label>
              <input
                type="number"
                min="0"
                value={opponentScore || ''}
                placeholder="0"
                onChange={(e) => setOpponentScore(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
              />
            </div>
          </div>

          {/* Competition */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Torneo / Competencia
            </label>
            <input
              type="text"
              value={competition}
              onChange={(e) => setCompetition(e.target.value)}
              placeholder="Liga Federal de Básquet"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
            />
          </div>

          {/* Home or Away */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Condición de Club SOMISA
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHomeAway('home')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  homeAway === 'home'
                    ? 'bg-[#00205B] text-white border-[#00205B] dark:bg-[#1E428A]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Local (En Casa)
              </button>
              <button
                type="button"
                onClick={() => setHomeAway('away')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  homeAway === 'away'
                    ? 'bg-[#00205B] text-white border-[#00205B] dark:bg-[#1E428A]'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                Visitante (Fuera)
              </button>
            </div>
          </div>

          {/* Checkbox: Copy Roster */}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800">
            <input
              type="checkbox"
              id="copyRosterModal"
              checked={copyRoster}
              onChange={(e) => setCopyRoster(e.target.checked)}
              className="rounded text-[#00205B] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="copyRosterModal" className="cursor-pointer font-medium leading-tight">
              Cargar automáticamente la plantilla de jugadores de SOMISA (Pedemonte, Calcaterra, Cognigni, Uranga, etc.)
            </label>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] text-white shadow-xs transition-colors"
            >
              Dar de Alta y Comenzar Carga
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
