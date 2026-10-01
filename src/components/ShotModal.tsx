import React, { useState } from 'react';
import { Check, X, Target } from 'lucide-react';
import { ShotZone, ShotType } from '../types/basketball';
import { ZONE_METADATA } from '../utils/calculations';

interface SimplePlayer {
  id: string;
  name: string;
  number?: number;
}

interface ShotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveShot: (shotData: {
    playerId: string;
    playerName: string;
    playerNumber?: number;
    made: boolean;
    shotType: ShotType;
    zone: ShotZone;
    x: number;
    y: number;
  }) => void;
  players: SimplePlayer[];
  defaultX: number;
  defaultY: number;
  detectedZone: ShotZone;
  detectedShotType: ShotType;
}

export const ShotModal: React.FC<ShotModalProps> = ({
  isOpen,
  onClose,
  onSaveShot,
  players,
  defaultX,
  defaultY,
  detectedZone,
  detectedShotType,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.id || '');
  const [shotType, setShotType] = useState<ShotType>(detectedShotType);

  if (!isOpen) return null;

  const selectedPlayer = players.find(p => p.id === selectedPlayerId) || players[0];

  const handleShoot = (made: boolean) => {
    if (!selectedPlayer) return;
    onSaveShot({
      playerId: selectedPlayer.id,
      playerName: selectedPlayer.name,
      playerNumber: selectedPlayer.number,
      made,
      shotType,
      zone: detectedZone,
      x: defaultX,
      y: defaultY
    });
    onClose();
  };

  const zoneMeta = ZONE_METADATA[detectedZone];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-md bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-white/90" />
            <h3 className="text-base font-bold">Registrar Posición de Tiro</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Zona de Cancha</span>
              <span className="font-bold text-[#00205B] dark:text-[#93C5FD] text-sm">{zoneMeta.label}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-semibold">Coordenadas</span>
              <span className="font-mono text-xs text-slate-700 dark:text-slate-300">X: {defaultX.toFixed(1)}% · Y: {defaultY.toFixed(1)}%</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Valor del Tiro
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShotType('2pt')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  shotType === '2pt'
                    ? 'bg-[#00205B] text-white border-[#00205B] dark:bg-[#1E428A]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                Tiro de 2 Puntos (TC)
              </button>
              <button
                type="button"
                onClick={() => setShotType('3pt')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all ${
                  shotType === '3pt'
                    ? 'bg-[#00205B] text-white border-[#00205B] dark:bg-[#1E428A]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                Triple (3P)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Tirador
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-44 overflow-y-auto pr-1">
              {players.map((p) => {
                const isSelected = selectedPlayerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPlayerId(p.id)}
                    className={`flex items-center justify-between p-2 rounded-lg text-left border text-xs transition-all ${
                      isSelected
                        ? 'bg-[#00205B] text-white border-[#00205B] font-semibold shadow-xs dark:bg-[#0A327E]'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-6 h-5 rounded text-[10px] font-mono font-black flex items-center justify-center ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#00205B]/10 text-[#00205B] dark:bg-blue-500/20 dark:text-blue-300'
                      }`}>
                        #{p.number ?? '-'}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleShoot(false)}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <X className="w-4 h-4" />
              <span>FALLADO (ERRÓ)</span>
            </button>
            <button
              type="button"
              onClick={() => handleShoot(true)}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Check className="w-4 h-4" />
              <span>CONVERTIDO</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
