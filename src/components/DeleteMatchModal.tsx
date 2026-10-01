import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Game } from '../types/basketball';

interface DeleteMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game | null;
  onConfirmDelete: (gameId: string) => void;
  isLastGame?: boolean;
}

export const DeleteMatchModal: React.FC<DeleteMatchModalProps> = ({
  isOpen,
  onClose,
  game,
  onConfirmDelete,
  isLastGame = false,
}) => {
  if (!isOpen || !game) return null;

  const handleConfirm = () => {
    onConfirmDelete(game.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-red-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Eliminar Partido</h3>
              <p className="text-[11px] text-white/90">Club SOMISA · Confirmación de borrado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">¿Estás seguro de que deseas eliminar este partido?</span>
              <p className="text-red-700 dark:text-red-400">
                Esta acción borrará permanentemente la planilla de estadísticas y todos los tiros registrados en el mapa para este encuentro.
              </p>
            </div>
          </div>

          {/* Match summary card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="text-slate-400 font-medium text-[10px] uppercase tracking-wider">
              Partido a eliminar
            </div>
            <div className="font-bold text-sm text-slate-900 dark:text-white">
              {game.myTeamName} vs {game.opponentName}
            </div>
            <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-mono">
              <span>{game.date}</span>
              <span>·</span>
              <span>{game.competition}</span>
              <span>·</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {game.scoreMyTeam} - {game.scoreOpponent}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Contiene {game.rows.length} jugadores en planilla y {game.shots.length} tiros en el mapa.
            </div>
          </div>

          {isLastGame && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800">
              * Nota: Al ser el único partido cargado, el sistema creará automáticamente un nuevo partido en blanco para que puedas continuar registrando.
            </p>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sí, Eliminar Partido</span>
          </button>
        </div>

      </div>
    </div>
  );
};
