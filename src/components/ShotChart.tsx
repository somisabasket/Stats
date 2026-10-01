import React, { useState } from 'react';
import { Target, Layers, Flame } from 'lucide-react';
import { Game, Shot, ShotZone, ShotType } from '../types/basketball';
import { getShotZoneAndType, calculateZoneEfficiency, ZONE_METADATA } from '../utils/calculations';
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
  onDeleteShot?: (shotId: string) => void;
}

export const ShotChart: React.FC<ShotChartProps> = ({ game, onAddShot, onDeleteShot }) => {
  const [viewMode, setViewMode] = useState<'scatter' | 'heatmap'>('scatter');
  const [selectedPlayerFilter, setSelectedPlayerFilter] = useState<string>('all');
  const [selectedResultFilter, setSelectedResultFilter] = useState<'all' | 'made' | 'missed'>('all');
  
  // Interactive Shot Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ x: number; y: number }>({ x: 50, y: 20 });
  const [detectedZone, setDetectedZone] = useState<ShotZone>('paint');
  const [detectedType, setDetectedType] = useState<ShotType>('2pt');

  // Filtered Shots
  const filteredShots = game.shots.filter(s => {
    if (selectedPlayerFilter !== 'all' && s.playerName !== selectedPlayerFilter) return false;
    if (selectedResultFilter === 'made' && !s.made) return false;
    if (selectedResultFilter === 'missed' && s.made) return false;
    return true;
  });

  const zoneEfficiencies = calculateZoneEfficiency(filteredShots);

  const handleCourtClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const x = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    const y = Math.max(0, Math.min(100, (clientY / rect.height) * 100));

    const { zone, shotType } = getShotZoneAndType(x, y);

    setClickedCoords({ x, y });
    setDetectedZone(zone);
    setDetectedType(shotType);
    setIsModalOpen(true);
  };

  const getZoneHeatColor = (zone: ShotZone) => {
    const data = zoneEfficiencies.find(z => z.zone === zone);
    if (!data || data.attempted === 0) {
      return 'rgba(148, 163, 184, 0.15)';
    }
    const diff = data.percentage - data.benchmarkPct;
    if (diff >= 5) {
      return 'rgba(34, 197, 94, 0.45)';
    } else if (diff >= 0) {
      return 'rgba(74, 222, 128, 0.35)';
    } else if (diff >= -6) {
      return 'rgba(234, 179, 8, 0.35)';
    } else {
      return 'rgba(239, 68, 68, 0.45)';
    }
  };

  const totalShots = filteredShots.length;
  const madeShots = filteredShots.filter(s => s.made).length;
  const overallFgPct = totalShots > 0 ? ((madeShots / totalShots) * 100).toFixed(1) : '0.0';

  const playersList = game.rows
    .filter(r => r.playerName.trim().toUpperCase() !== 'TOTALES')
    .map(r => ({ id: r.id, name: r.playerName, number: r.playerNumber }));

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors">
        
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setViewMode('scatter')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'scatter'
                ? 'bg-[#00205B] text-white shadow-xs dark:bg-[#0A327E]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tiros Individuales</span>
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'heatmap'
                ? 'bg-[#00205B] text-white shadow-xs dark:bg-[#0A327E]'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Mapa de Calor por Zonas</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPlayerFilter}
            onChange={(e) => setSelectedPlayerFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-[#00205B]"
          >
            <option value="all">Todos los Jugadores ({game.shots.length} tiros)</option>
            {playersList.map(p => {
              const pCount = game.shots.filter(s => s.playerName === p.name).length;
              return (
                <option key={p.id} value={p.name}>
                  {p.number !== undefined ? `#${p.number} - ` : ''}{p.name} ({pCount} tiros)
                </option>
              );
            })}
          </select>

          <select
            value={selectedResultFilter}
            onChange={(e: any) => setSelectedResultFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-[#00205B]"
          >
            <option value="all">Todos los Resultados</option>
            <option value="made">Solo Convertidos (Verde)</option>
            <option value="missed">Solo Fallados (Rojo)</option>
          </select>
        </div>

        <div className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
          <span>Efectividad:</span>
          <span className="font-mono font-bold text-sm text-[#00205B] dark:text-[#93C5FD]">
            {madeShots}/{totalShots} ({overallFgPct}%)
          </span>
        </div>

      </div>

      {/* Main Interactive Basketball Court & Zone Efficiency Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Basketball Court Canvas Area */}
        <div className="lg:col-span-7 bg-white dark:bg-[#0E1526] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
          
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium">
              <Target className="w-4 h-4 text-[#00205B] dark:text-[#93C5FD]" />
              <span>Haz clic en la cancha para agregar tiros al análisis</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>Convertido</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
                <span>Fallado</span>
              </span>
            </div>
          </div>

          <div className="w-full max-w-[540px] aspect-[1/0.95] relative select-none rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-[#F8FAFC] dark:bg-[#070B13] cursor-crosshair">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full"
              onClick={handleCourtClick}
            >
              {/* Heatmap Mode Polygons */}
              {viewMode === 'heatmap' && (
                <g className="transition-opacity duration-300">
                  <rect x="0" y="0" width="9" height="28" fill={getZoneHeatColor('corner3_left')} />
                  <rect x="91" y="0" width="9" height="28" fill={getZoneHeatColor('corner3_right')} />
                  <rect x="34" y="0" width="32" height="38" fill={getZoneHeatColor('paint')} />
                  <path d="M 41.5 8.5 A 8.5 8.5 0 0 1 58.5 8.5 L 58.5 0 L 41.5 0 Z" fill={getZoneHeatColor('restricted')} />
                  <path d="M 9 0 L 34 0 L 34 38 L 20 40 L 9 28 Z" fill={getZoneHeatColor('mid_left')} />
                  <path d="M 66 0 L 91 0 L 91 28 L 80 40 L 66 38 Z" fill={getZoneHeatColor('mid_right')} />
                  <path d="M 34 38 L 66 38 L 74 46 A 45 45 0 0 1 26 46 Z" fill={getZoneHeatColor('mid_center')} />
                  <path d="M 0 28 L 9 28 L 26 46 L 36 54 L 0 85 Z" fill={getZoneHeatColor('arc3_left')} />
                  <path d="M 36 54 A 45 45 0 0 1 64 54 L 75 100 L 25 100 Z" fill={getZoneHeatColor('arc3_center')} />
                  <path d="M 91 28 L 100 28 L 100 85 L 64 54 L 74 46 Z" fill={getZoneHeatColor('arc3_right')} />
                </g>
              )}

              {/* Vector Lines */}
              <g stroke="#00205B" strokeWidth="0.8" fill="none" className="dark:stroke-slate-500">
                <rect x="0" y="0" width="100" height="100" strokeWidth="1.2" />
                <line x1="0" y1="100" x2="100" y2="100" strokeWidth="1.2" />
                <path d="M 38 100 A 12 12 0 0 1 62 100" strokeWidth="0.9" />
                <rect x="34" y="0" width="32" height="38" strokeWidth="0.9" />
                <circle cx="50" cy="38" r="12" strokeWidth="0.9" strokeDasharray="3 3" />
                <path d="M 38 38 A 12 12 0 0 0 62 38" strokeWidth="0.9" />
                <path d="M 41.5 8.5 A 8.5 8.5 0 0 0 58.5 8.5" strokeWidth="0.8" />
                <line x1="44" y1="4" x2="56" y2="4" strokeWidth="1.5" />
                <circle cx="50" cy="8.5" r="3" stroke="#D97706" strokeWidth="1.2" />
                <line x1="50" y1="4" x2="50" y2="5.5" strokeWidth="1" />
                <line x1="9" y1="0" x2="9" y2="28" strokeWidth="1" />
                <line x1="91" y1="0" x2="91" y2="28" strokeWidth="1" />
                <path d="M 9 28 A 45 45 0 0 0 91 28" strokeWidth="1" />
              </g>

              {/* Heatmap Labels */}
              {viewMode === 'heatmap' && (
                <g className="text-center font-mono select-none pointer-events-none">
                  {zoneEfficiencies.map((z) => {
                    let labelX = 50;
                    let labelY = 50;
                    if (z.zone === 'restricted') { labelX = 50; labelY = 12; }
                    else if (z.zone === 'paint') { labelX = 50; labelY = 28; }
                    else if (z.zone === 'mid_left') { labelX = 22; labelY = 22; }
                    else if (z.zone === 'mid_center') { labelX = 50; labelY = 44; }
                    else if (z.zone === 'mid_right') { labelX = 78; labelY = 22; }
                    else if (z.zone === 'corner3_left') { labelX = 4.5; labelY = 16; }
                    else if (z.zone === 'corner3_right') { labelX = 95.5; labelY = 16; }
                    else if (z.zone === 'arc3_left') { labelX = 18; labelY = 62; }
                    else if (z.zone === 'arc3_center') { labelX = 50; labelY = 75; }
                    else if (z.zone === 'arc3_right') { labelX = 82; labelY = 62; }

                    return (
                      <g key={z.zone} transform={`translate(${labelX}, ${labelY})`}>
                        <rect x="-12" y="-7" width="24" height="14" rx="3" fill="rgba(15, 23, 42, 0.85)" />
                        <text x="0" y="-1" fill="#ffffff" fontSize="3.2" fontWeight="bold" textAnchor="middle">
                          {z.made}/{z.attempted}
                        </text>
                        <text x="0" y="4" fill={z.percentage >= z.benchmarkPct ? '#4ade80' : '#f87171'} fontSize="3" fontWeight="bold" textAnchor="middle">
                          {z.attempted > 0 ? `${z.percentage}%` : '0%'}
                        </text>
                      </g>
                    );
                  })}
                </g>
              )}

              {/* Scatter Mode Shots */}
              {viewMode === 'scatter' && (
                <g>
                  {filteredShots.map((shot) => (
                    <g
                      key={shot.id}
                      transform={`translate(${shot.x}, ${shot.y})`}
                      className="cursor-pointer hover:scale-125 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeleteShot && window.confirm(`¿Eliminar tiro de ${shot.playerName}?`)) {
                          onDeleteShot(shot.id);
                        }
                      }}
                    >
                      {shot.made ? (
                        <>
                          <circle cx="0" cy="0" r="2.2" fill="#10B981" stroke="#FFFFFF" strokeWidth="0.6" />
                          <text x="0" y="0.9" fill="#FFFFFF" fontSize="2.2" fontWeight="bold" textAnchor="middle">✓</text>
                        </>
                      ) : (
                        <>
                          <circle cx="0" cy="0" r="2.2" fill="#EF4444" stroke="#FFFFFF" strokeWidth="0.6" />
                          <line x1="-1.2" y1="-1.2" x2="1.2" y2="1.2" stroke="#FFFFFF" strokeWidth="0.7" strokeLinecap="round" />
                          <line x1="1.2" y1="-1.2" x2="-1.2" y2="1.2" stroke="#FFFFFF" strokeWidth="0.7" strokeLinecap="round" />
                        </>
                      )}
                      <title>{`${shot.playerName} · ${shot.shotType.toUpperCase()} ${shot.made ? 'Convertido' : 'Fallado'}`}</title>
                    </g>
                  ))}
                </g>
              )}
            </svg>
          </div>

          <p className="mt-3 text-[11px] text-slate-400 text-center">
            Haz clic en un tiro para eliminarlo · Pasa el cursor para ver el jugador
          </p>
        </div>

        {/* Zone Breakdown Stats Table */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0E1526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#00205B] dark:text-white uppercase tracking-wider">
              Efectividad por Zona
            </h3>
            <span className="text-xs text-slate-400 font-mono">10 Zonas FIBA</span>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {zoneEfficiencies.map((z) => {
              const meta = ZONE_METADATA[z.zone];
              const isAbove = z.percentage >= z.benchmarkPct;
              const hasAttempts = z.attempted > 0;

              return (
                <div
                  key={z.zone}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {meta.shortLabel}
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-slate-500">{z.made}/{z.attempted}</span>
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          !hasAttempts
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            : isAbove
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                        }`}
                      >
                        {z.percentage}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${isAbove ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, z.percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{z.points} pts anotados</span>
                    <span>Ref: {meta.benchmarkPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <ShotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveShot={onAddShot}
        players={playersList}
        defaultX={clickedCoords.x}
        defaultY={clickedCoords.y}
        detectedZone={detectedZone}
        detectedShotType={detectedType}
      />

    </div>
  );
};
