import React, { useState } from 'react';
import { Game, ExcelRowStats } from '../types/basketball';
import { Users, Award, TrendingUp, Search, Download } from 'lucide-react';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface PlayerSummaryProps {
  games: Game[];
  onOpenExportModal?: () => void;
}

interface AggregatedPlayer {
  number?: number;
  name: string;
  position?: string;
  gamesPlayed: number;
  totalPoints: number;
  avgPoints: number;
  totalRebounds: number;
  avgRebounds: number;
  totalAssists: number;
  avgAssists: number;
  totalValuation: number;
  avgValuation: number;
  tc: number;
  ti: number;
  pct2p: number;
  c3p: number;
  i3p: number;
  pct3p: number;
  tlc: number;
  tli: number;
  pctFt: number;
}

export const PlayerSummary: React.FC<PlayerSummaryProps> = ({ 
  games, 
  onOpenExportModal 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Aggregate stats across all games for each player
  const playerMap = new Map<string, AggregatedPlayer>();

  games.forEach(g => {
    g.rows.forEach(r => {
      const key = r.playerName.trim().toUpperCase();
      if (!key || key === 'TOTALES') return;

      const existing = playerMap.get(key) || {
        number: r.playerNumber,
        name: r.playerName,
        position: r.playerPosition,
        gamesPlayed: 0,
        totalPoints: 0,
        avgPoints: 0,
        totalRebounds: 0,
        avgRebounds: 0,
        totalAssists: 0,
        avgAssists: 0,
        totalValuation: 0,
        avgValuation: 0,
        tc: 0,
        ti: 0,
        pct2p: 0,
        c3p: 0,
        i3p: 0,
        pct3p: 0,
        tlc: 0,
        tli: 0,
        pctFt: 0
      };

      existing.gamesPlayed += 1;
      existing.totalPoints += r.pt;
      existing.totalRebounds += r.rt;
      existing.totalAssists += r.as;
      existing.totalValuation += r.ptsTot;
      existing.tc += r.tc;
      existing.ti += r.ti;
      existing.c3p += r.c3p;
      existing.i3p += r.i3p;
      existing.tlc += r.tlc;
      existing.tli += r.tli;

      if (r.playerNumber !== undefined) {
        existing.number = r.playerNumber;
      }
      if (r.playerPosition) {
        existing.position = r.playerPosition;
      }

      playerMap.set(key, existing);
    });
  });

  const players: AggregatedPlayer[] = Array.from(playerMap.values()).map(p => ({
    ...p,
    avgPoints: Number((p.totalPoints / (p.gamesPlayed || 1)).toFixed(1)),
    avgRebounds: Number((p.totalRebounds / (p.gamesPlayed || 1)).toFixed(1)),
    avgAssists: Number((p.totalAssists / (p.gamesPlayed || 1)).toFixed(1)),
    avgValuation: Number((p.totalValuation / (p.gamesPlayed || 1)).toFixed(1)),
    pct2p: p.ti > 0 ? Number(((p.tc / p.ti) * 100).toFixed(1)) : 0,
    pct3p: p.i3p > 0 ? Number(((p.c3p / p.i3p) * 100).toFixed(1)) : 0,
    pctFt: p.tli > 0 ? Number(((p.tlc / p.tli) * 100).toFixed(1)) : 0
  })).sort((a, b) => b.avgPoints - a.avgPoints);

  const filtered = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.number !== undefined && String(p.number).includes(searchTerm))
  );

  return (
    <div className="space-y-4">
      {/* Header filter with SOMISA Crest */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <ClubSomisaLogo size={46} className="drop-shadow-md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Rendimiento Individual Acumulado</span>
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#00205B] dark:text-[#93C5FD] border border-blue-200 dark:border-blue-800">
                Plantilla SOMISA
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Promedios y estadísticas globales de la plantilla de Club SOMISA en la temporada ({games.length} partido(s))
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por jugador o dorsal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden w-60"
            />
          </div>

          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Exportar Apartados</span>
            </button>
          )}
        </div>
      </div>

      {/* Players table */}
      <div className="bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#00205B] text-white font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-3 text-center w-12">#</th>
                <th className="py-3 px-4">Jugador</th>
                <th className="py-3 px-2 text-center">PJ</th>
                <th className="py-3 px-2 text-center font-bold bg-[#001744]">PTS / PJ</th>
                <th className="py-3 px-2 text-center">REB / PJ</th>
                <th className="py-3 px-2 text-center">AST / PJ</th>
                <th className="py-3 px-2 text-center">2P%</th>
                <th className="py-3 px-2 text-center">3P%</th>
                <th className="py-3 px-2 text-center">TL%</th>
                <th className="py-3 px-3 text-center font-bold bg-emerald-700">VAL / PJ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filtered.map((p, i) => (
                <tr 
                  key={p.name}
                  className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors ${
                    i % 2 === 0 ? 'bg-white dark:bg-[#0E1526]' : 'bg-slate-50/60 dark:bg-slate-900/40'
                  }`}
                >
                  <td className="py-2.5 px-3 text-center font-bold text-[#00205B] dark:text-[#93C5FD]">
                    {p.number ?? '-'}
                  </td>
                  <td className="py-2.5 px-4 font-sans font-semibold text-slate-900 dark:text-white">
                    {p.name}
                    {p.position && (
                      <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {p.position}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400">
                    {p.gamesPlayed}
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900/60">
                    {p.avgPoints}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                    {p.avgRebounds}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                    {p.avgAssists}
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                    {p.pct2p}% <span className="text-[10px] text-slate-400">({p.tc}/{p.ti})</span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                    {p.pct3p}% <span className="text-[10px] text-slate-400">({p.c3p}/{p.i3p})</span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-slate-700 dark:text-slate-300">
                    {p.pctFt}% <span className="text-[10px] text-slate-400">({p.tlc}/{p.tli})</span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                    {p.avgValuation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
