import React, { useState } from 'react';
import { Target, X, Check, Shield } from 'lucide-react';
import { ShotType, ShotZone, ExcelRowStats } from '../types/basketball';

interface ShotModalProps {
  isOpen: boolean;
  onClose: () => void;
  x: number;
  y: number;
  players: ExcelRowStats[];
  onSaveShot: (shotData: {
    playerId: string;
    playerName: string;
    playerNumber?: number;
    made: boolean;
    shotType: ShotType;
    zone: ShotZone;
  }) => void;
}

export const ShotModal: React.FC<ShotModalProps> = ({
  isOpen,
  onClose,
  x,
  y,
  players,
  onSaveShot,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState(players[0]?.id || '');
  const [made, setMade] = useState(true);

  if (!isOpen) return null;

  // Infer shot type and zone from coordinates
  const is3pt = (x < 8 || x > 92) || Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 12, 2)) > 38;
  const shotType: ShotType = is3pt ? '3pt' : '2pt';

  let zone: ShotZone = 'mid_center';
  const distFromRim = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 12, 2));

  if (is3pt) {
    if (x <= 15) zone = 'corner3_left';
    else if (x >= 85) zone = 'corner3_right';
    else if (x < 40) zone = 'arc3_left';
    else if (x > 60) zone = 'arc3_right';
    else zone = 'arc3_center';
  } else {
    if (distFromRim <= 12) zone = 'restricted';
    else if (x >= 35 && x <= 65 && y <= 35) zone = 'paint';
    else if (x < 35) zone = 'mid_left';
    else if (x > 65) zone = 'mid_right';
    else zone = 'mid_center';
  }

  const handleSave = () => {
    const player = players.find(p => p.id === selectedPlayerId) || players[0];
    if (!player) return;

    onSaveShot({
      playerId: player.id,
      playerName: player.playerName,
      playerNumber: player.playerNumber,
      made,
      shotType,
      zone
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-sm bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
            <Target className="w-4 h-4 text-blue-500" />
            <span>Registrar Tiro ({shotType.toUpperCase()})</span>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Jugador Tirador
            </label>
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full py-2 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
            >
              {players.filter(p => p.playerName !== 'TOTALES').map(p => (
                <option key={p.id} value={p.id}>
                  #{p.playerNumber ?? '-'} {p.playerName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Resultado del Lanzamiento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMade(true)}
                className={`py-2 px-3 rounded-lg font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  made
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Convertido</span>
              </button>

              <button
                type="button"
                onClick={() => setMade(false)}
                className={`py-2 px-3 rounded-lg font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                  !made
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <X className="w-4 h-4" />
                <span>Errado</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] rounded-lg shadow-sm"
          >
            Guardar Tiro
          </button>
        </div>
      </div>
    </div>
  );
};
