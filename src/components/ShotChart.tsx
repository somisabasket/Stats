import React, { useState, useRef } from 'react';
import { Target, Plus, Trash2, Filter } from 'lucide-react';
import { Game, Shot, ShotType, ShotZone } from '../types/basketball';
import { calculateZoneEfficiency } from '../utils/calculations';
import { ShotModal } from './ShotModal';

interface ShotChartProps {
  game: Game;
  onAddShot: (shotData: {
    playerId: string;
    playerName: string;
    playerNumber?: number;
    made: boolean;
    shotType: ShotType;
    zone: ShotZone;
    x: number;
    y: number;
  }) => void;
  onDeleteShot: (shotId: string) => void;
}

export const ShotChart: React.FC<ShotChartProps> = ({ game, onAddShot, onDeleteShot }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number }>({ x: 50, y: 25 });
  const courtRef = useRef<HTMLDivElement>(null);

  const filteredShots = selectedPlayer === 'all'
    ? game.shots
    : game.shots.filter(s => s.playerId === selectedPlayer);

  const zoneEff = calculateZoneEfficiency(filteredShots);

  const handleCourtClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!courtRef.current) return;
    const rect = courtRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setPendingCoords({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
    setModalOpen(true);
  };

  const totalMade = filteredShots.filter(s => s.made).length;
  const totalAtt = filteredShots.length;
  const totalPct = totalAtt > 0 ? Number(((totalMade / totalAtt) * 100).toFixed(1)) : 0;

  return (
    <div className="space-y-6">
      {/* Top Filter and Match Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span>Mapa de Tiro & Zonas de Calor</span>
          </h2>
          <p className="text-xs text-slate-500">
            Haz clic en cualquier punto de la cancha para registrar un tiro de campo con su posición y resultado
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedPlayer}
              onChange={(e) => setSelectedPlayer(e.target.value)}
              className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Todo el Equipo ({game.shots.length} tiros)</option>
              {game.rows.filter(r => r.playerName !== 'TOTALES').map(r => (
                <option key={r.id} value={r.id}>
                  #{r.playerNumber ?? '-'} {r.playerName}
                </option>
              ))}
            </select>
          </div>

          <div className="text-right font-mono text-xs">
            <span className="text-slate-400 font-sans block text-[10px] uppercase font-bold">Efectividad</span>
            <span className="font-bold text-slate-900 dark:text-white">{totalMade}/{totalAtt} ({totalPct}%)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Basketball Half-Court Interactive Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center">
          <div
            ref={courtRef}
            onClick={handleCourtClick}
            className="relative w-full max-w-[540px] aspect-[1/0.95] bg-[#F8FAFC] dark:bg-[#070B13] rounded-2xl border-2 border-[#00205B] dark:border-blue-500/30 overflow-hidden shadow-md cursor-crosshair select-none"
          >
            {/* Half-Court SVG Lines */}
            <svg viewBox="0 0 100 95" className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Backboard & Rim */}
              <line x1="42" y1="8" x2="58" y2="8" stroke="#00205B" strokeWidth="1.2" className="dark:stroke-blue-400" />
              <circle cx="50" cy="12" r="3.2" stroke="#EF4444" strokeWidth="1.2" fill="none" />
              {/* Restricted Area */}
              <path d="M 44 8 A 6 6 0 0 0 56 8" stroke="#00205B" strokeWidth="0.8" fill="none" strokeDasharray="1.5 1.5" className="dark:stroke-blue-400" />
              {/* Paint / Key */}
              <rect x="35" y="0" width="30" height="38" stroke="#00205B" strokeWidth="1" fill="#00205B" fillOpacity="0.03" className="dark:stroke-blue-400 dark:fill-blue-500/10" />
              {/* Free Throw Circle */}
              <circle cx="50" cy="38" r="12" stroke="#00205B" strokeWidth="1" fill="none" className="dark:stroke-blue-400" />
              <path d="M 38 38 A 12 12 0 0 1 62 38" stroke="#00205B" strokeWidth="0.8" fill="none" strokeDasharray="1.5 1.5" className="dark:stroke-blue-400" />
              {/* 3-Point Line */}
              <line x1="8" y1="0" x2="8" y2="28" stroke="#00205B" strokeWidth="1" className="dark:stroke-blue-400" />
              <line x1="92" y1="0" x2="92" y2="28" stroke="#00205B" strokeWidth="1" className="dark:stroke-blue-400" />
              <path d="M 8 28 A 43 43 0 0 0 92 28" stroke="#00205B" strokeWidth="1" fill="none" className="dark:stroke-blue-400" />
              {/* Half-court center circle */}
              <path d="M 38 95 A 12 12 0 0 1 62 95" stroke="#00205B" strokeWidth="1" fill="none" className="dark:stroke-blue-400" />
            </svg>

            {/* Shots Points Markers */}
            {filteredShots.map((s) => (
              <div
                key={s.id}
                style={{ left: `${s.x}%`, top: `${s.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteShot(s.id);
                }}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs cursor-pointer hover:scale-125 transition-transform ${
                    s.made
                      ? 'bg-emerald-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                  title={`${s.playerName} (#${s.playerNumber ?? '-'}): ${s.made ? 'Convertido' : 'Errado'} (${s.shotType}) - Haz clic para borrar`}
                >
                  {s.made ? '✓' : '✕'}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 mt-3 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Convertido ({totalMade})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>Errado ({totalAtt - totalMade})</span>
            </div>
            <span className="text-[11px] text-slate-400">Haz clic en cualquier punto para agregar o sobre un tiro para borrar</span>
          </div>
        </div>

        {/* Zones Efficiency Sidebar */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Efectividad por Zonas de Lanzamiento
            </h3>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {Object.values(zoneEff).map((z) => {
                const diff = z.attempted > 0 ? Number((z.percentage - z.benchmarkPct).toFixed(1)) : 0;
                return (
                  <div
                    key={z.zone}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{z.label}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {z.made}/{z.attempted} ({z.percentage}%) • {z.pps} PPS
                      </p>
                    </div>

                    {z.attempted > 0 ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        diff >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                      }`}>
                        {diff >= 0 ? `+${diff}%` : `${diff}%`}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin tiros</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal to add new shot on court click */}
      <ShotModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        x={pendingCoords.x}
        y={pendingCoords.y}
        players={game.rows}
        onSaveShot={(shotData) => {
          onAddShot({
            ...shotData,
            x: pendingCoords.x,
            y: pendingCoords.y
          });
        }}
      />
    </div>
  );
};
