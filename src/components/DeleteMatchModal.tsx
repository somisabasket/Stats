import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Game } from '../types/basketball';

interface DeleteMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
  onConfirmDelete: (gameId: string) => void;
}

export const DeleteMatchModal: React.FC<DeleteMatchModalProps> = ({
  isOpen,
  onClose,
  game,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-red-50/50 dark:bg-red-950/20">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Eliminar Partido</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            ¿Estás seguro de que deseas eliminar permanentemente el partido:
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-medium text-xs text-slate-800 dark:text-slate-200">
            <p className="font-bold text-[#00205B] dark:text-[#93C5FD]">{game.title}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Fecha: {game.date} | Torneo: {game.competition}</p>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
            Esta acción no se puede deshacer. Se borrarán todas las estadísticas y mapa de tiros de este juego.
          </p>
        </div>

        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirmDelete(game.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Definitivamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
