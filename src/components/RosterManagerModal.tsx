import React, { useState } from 'react';
import { X, Plus, Trash2, Shield, User, Check, RefreshCw, Hash } from 'lucide-react';
import { PlayerProfile, Game } from '../types/basketball';
import { DEFAULT_SOMISA_ROSTER } from '../utils/storage';

interface RosterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: PlayerProfile[];
  onSaveRoster: (newRoster: PlayerProfile[]) => void;
  onSyncRosterToGames?: (roster: PlayerProfile[]) => void;
  games: Game[];
}

const POSITIONS = ['Base', 'Escolta', 'Alero', 'Ala-Pívot', 'Pívot'];

export const RosterManagerModal: React.FC<RosterManagerModalProps> = ({
  isOpen,
  onClose,
  roster,
  onSaveRoster,
  onSyncRosterToGames,
}) => {
  const [localRoster, setLocalRoster] = useState<PlayerProfile[]>(roster);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<number | ''>('');
  const [newPlayerPosition, setNewPlayerPosition] = useState('Base');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNumberChange = (index: number, val: string) => {
    const updated = [...localRoster];
    updated[index] = {
      ...updated[index],
      number: Math.max(0, parseInt(val) || 0)
    };
    setLocalRoster(updated);
  };

  const handleNameChange = (index: number, val: string) => {
    const updated = [...localRoster];
    updated[index] = {
      ...updated[index],
      name: val.toUpperCase()
    };
    setLocalRoster(updated);
  };

  const handlePositionChange = (index: number, val: string) => {
    const updated = [...localRoster];
    updated[index] = {
      ...updated[index],
      position: val
    };
    setLocalRoster(updated);
  };

  const handleDeletePlayer = (index: number) => {
    if (localRoster.length <= 1) {
      alert('Debe haber al menos un jugador en la plantilla.');
      return;
    }
    const updated = localRoster.filter((_, i) => i !== index);
    setLocalRoster(updated);
  };

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const newPlayer: PlayerProfile = {
      id: `som_p_${Date.now()}`,
      name: newPlayerName.trim().toUpperCase(),
      number: typeof newPlayerNumber === 'number' ? newPlayerNumber : localRoster.length + 4,
      position: newPlayerPosition,
      active: true
    };

    setLocalRoster([...localRoster, newPlayer]);
    setNewPlayerName('');
    setNewPlayerNumber('');
  };

  const handleSaveAndSync = () => {
    onSaveRoster(localRoster);
    if (onSyncRosterToGames) {
      onSyncRosterToGames(localRoster);
    }
    setSaveMessage('¡Plantilla y dorsales guardados con éxito!');
    setTimeout(() => {
      setSaveMessage(null);
      onClose();
    }, 1200);
  };

  const handleResetDefault = () => {
    if (window.confirm('¿Restablecer a la plantilla oficial de Club SOMISA?')) {
      setLocalRoster(DEFAULT_SOMISA_ROSTER);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Plantilla Oficial de Jugadores</h3>
              <p className="text-[11px] text-white/80">Club SOMISA San Nicolás · Nombres y Dorsales (#)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
            <span>
              Configura los dorsales y nombres que se conservarán en todos los partidos y estadísticas.
            </span>
            <button
              onClick={handleResetDefault}
              className="text-[#00205B] dark:text-[#93C5FD] hover:underline font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Restablecer oficial
            </button>
          </div>

          {/* Form to add player */}
          <form onSubmit={handleAddPlayer} className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
            <div className="w-20">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Dorsal (#)</label>
              <input
                type="number"
                min="0"
                max="99"
                placeholder="#"
                value={newPlayerNumber}
                onChange={(e) => setNewPlayerNumber(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full text-xs font-mono font-bold p-2 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
              />
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Nombre y Apellido *</label>
              <input
                type="text"
                placeholder="Ej. APELLIDO, NOMBRE"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                className="w-full text-xs uppercase p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
                required
              />
            </div>

            <div className="w-32">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Posición</label>
              <select
                value={newPlayerPosition}
                onChange={(e) => setNewPlayerPosition(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
              >
                {POSITIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-[#00205B] text-white hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
          </form>

          {/* Player table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">Dorsal</th>
                  <th className="py-2.5 px-3">Jugador</th>
                  <th className="py-2.5 px-3 w-32">Posición</th>
                  <th className="py-2.5 px-2 w-12 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {localRoster.map((player, idx) => (
                  <tr key={player.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={player.number ?? ''}
                          onChange={(e) => handleNumberChange(idx, e.target.value)}
                          className="w-12 text-center text-xs font-mono font-black py-1 px-1 rounded-md bg-[#00205B]/10 dark:bg-blue-500/20 text-[#00205B] dark:text-blue-300 border border-[#00205B]/20 dark:border-blue-500/30 focus:ring-1 focus:ring-[#00205B]"
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => handleNameChange(idx, e.target.value)}
                        className="w-full text-xs font-bold uppercase py-1 px-2 rounded-md bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={player.position || 'Base'}
                        onChange={(e) => handlePositionChange(idx, e.target.value)}
                        className="w-full text-xs py-1 px-2 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                      >
                        {POSITIONS.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleDeletePlayer(idx)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Eliminar jugador de plantilla"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {saveMessage && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Total en Plantilla: <strong>{localRoster.length}</strong> jugadores
          </span>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveAndSync}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] text-white shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Plantilla y Sincronizar</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
