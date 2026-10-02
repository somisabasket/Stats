import React, { useState } from 'react';
import { Users, Plus, Trash2, Check, X, Shield } from 'lucide-react';
import { PlayerProfile, Game } from '../types/basketball';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface RosterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  roster: PlayerProfile[];
  onSaveRoster: (roster: PlayerProfile[]) => void;
  onSyncRosterToGames?: (roster: PlayerProfile[]) => void;
  games?: Game[];
}

export const RosterManagerModal: React.FC<RosterManagerModalProps> = ({
  isOpen,
  onClose,
  roster,
  onSaveRoster,
  onSyncRosterToGames,
}) => {
  const [localRoster, setLocalRoster] = useState<PlayerProfile[]>(() => [...roster]);
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [newPosition, setNewPosition] = useState('Alero');

  if (!isOpen) return null;

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const num = parseInt(newNumber) || 0;
    const newPlayer: PlayerProfile = {
      id: `player_${Date.now()}_${Math.random()}`,
      name: newName.trim().toUpperCase(),
      number: num,
      position: newPosition,
      active: true
    };

    const updated = [...localRoster, newPlayer].sort((a, b) => a.number - b.number);
    setLocalRoster(updated);
    setNewName('');
    setNewNumber('');
  };

  const handleDeletePlayer = (id: string) => {
    setLocalRoster(localRoster.filter(p => p.id !== id));
  };

  const handleUpdateField = (id: string, field: keyof PlayerProfile, value: any) => {
    setLocalRoster(localRoster.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleSave = () => {
    onSaveRoster(localRoster);
    if (onSyncRosterToGames) {
      onSyncRosterToGames(localRoster);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white shrink-0">
          <div className="flex items-center gap-3 font-bold text-sm">
            <ClubSomisaLogo size={32} className="bg-white/10 p-0.5 rounded-full" />
            <span>Plantilla Oficial y Dorsales · Club SOMISA</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Add new player form */}
          <form onSubmit={handleAddPlayer} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end">
            <div className="sm:col-span-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Dorsal (#)</label>
              <input
                type="number"
                placeholder="#"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                required
                className="w-full text-xs font-mono py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej. PEDEMONTE, JUAN PABLO"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-1 flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Posición</label>
                <select
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full text-xs py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Base">Base</option>
                  <option value="Escolta">Escolta</option>
                  <option value="Alero">Alero</option>
                  <option value="Ala-Pívot">Ala-Pívot</option>
                  <option value="Pívot">Pívot</option>
                </select>
              </div>
              <button
                type="submit"
                className="p-2 rounded-lg bg-[#00205B] text-white hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] shrink-0 self-end"
                title="Agregar Jugador"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Roster table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#00205B] text-white font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 text-center w-16"># Dorsal</th>
                  <th className="py-2.5 px-4">Jugador</th>
                  <th className="py-2.5 px-3 w-32">Posición</th>
                  <th className="py-2.5 px-3 text-center w-12">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {localRoster.map((p, i) => (
                  <tr key={p.id} className={i % 2 === 0 ? 'bg-white dark:bg-[#0E1526]' : 'bg-slate-50 dark:bg-slate-900/40'}>
                    <td className="py-2 px-3 text-center font-mono font-bold text-[#00205B] dark:text-[#93C5FD]">
                      <input
                        type="number"
                        value={p.number}
                        onChange={(e) => handleUpdateField(p.id, 'number', parseInt(e.target.value) || 0)}
                        className="w-12 text-center py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-transparent font-mono font-bold"
                      />
                    </td>
                    <td className="py-2 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => handleUpdateField(p.id, 'name', e.target.value.toUpperCase())}
                        className="w-full py-0.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-transparent font-semibold uppercase"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={p.position}
                        onChange={(e) => handleUpdateField(p.id, 'position', e.target.value)}
                        className="text-xs py-0.5 px-1.5 rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 bg-transparent text-slate-700 dark:text-slate-300"
                      >
                        <option value="Base">Base</option>
                        <option value="Escolta">Escolta</option>
                        <option value="Alero">Alero</option>
                        <option value="Ala-Pívot">Ala-Pívot</option>
                        <option value="Pívot">Pívot</option>
                      </select>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleDeletePlayer(p.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] rounded-lg shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Guardar y Sincronizar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
