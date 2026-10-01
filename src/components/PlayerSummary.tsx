import React, { useState } from 'react';
import { Game, ExcelRowStats } from '../types/basketball';
import { formatSecondsToMinutes, parseMinutesToSeconds } from '../utils/calculations';
import { User, Award, TrendingUp, Target, Search } from 'lucide-react';

interface PlayerSummaryProps {
  games: Game[];
}

interface AggregatedPlayer {
  playerName: string;
  playerNumber?: number;
  playerPosition?: string;
  gamesPlayed: number;
  totalSeconds: number;
  avgMin: string;
  
  // Totals & Averages
  tc: number;
  ti: number;
  c3p: number;
  i3p: number;
  tlc: number;
  tli: number;
  rd: number;
  ro: number;
  rt: number;
  as: number;
  rec: number;
  per: number;
  tap: number;
  fpc: number;
  fpr: number;
  pt: number;
  ptsTot: number;

  ppg: number;
  rpg: number;
  apg: number;
  spg: number;
  tovpg: number;
  bpg: number;
  effpg: number;

  // Efficiency
  tiPct: number;
  pct3p: number;
  tlPct: number;
  ar3p: number;
  ftr: number;
  efgPct: number;
  tsPct: number;
  tovPct: number;

  gameLogs: {
    gameTitle: string;
    gameDate: string;
    stats: ExcelRowStats;
  }[];
}

export const PlayerSummary: React.FC<PlayerSummaryProps> = ({ games }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');

  // Aggregate stats across all games by player name
  const playerMap = new Map<string, AggregatedPlayer>();

  games.forEach(g => {
    g.rows.forEach(r => {
      const cleanName = r.playerName.trim().toUpperCase();
      if (!cleanName || cleanName === 'TOTALES' || cleanName === 'TOTAL') return;

      if (!playerMap.has(cleanName)) {
        playerMap.set(cleanName, {
          playerName: r.playerName,
          gamesPlayed: 0,
          totalSeconds: 0,
          avgMin: '00:00',
          tc: 0,
          ti: 0,
          c3p: 0,
          i3p: 0,
          tlc: 0,
          tli: 0,
          rd: 0,
          ro: 0,
          rt: 0,
          as: 0,
          rec: 0,
          per: 0,
          tap: 0,
          fpc: 0,
          fpr: 0,
          pt: 0,
          ptsTot: 0,
          ppg: 0,
          rpg: 0,
          apg: 0,
          spg: 0,
          tovpg: 0,
          bpg: 0,
          effpg: 0,
          tiPct: 0,
          pct3p: 0,
          tlPct: 0,
          ar3p: 0,
          ftr: 0,
          efgPct: 0,
          tsPct: 0,
          tovPct: 0,
          gameLogs: []
        });
      }

      const p = playerMap.get(cleanName)!;
      if (r.playerNumber !== undefined && p.playerNumber === undefined) {
        p.playerNumber = r.playerNumber;
      }
      if (r.playerPosition && !p.playerPosition) {
        p.playerPosition = r.playerPosition;
      }
      p.gamesPlayed += 1;
      p.totalSeconds += r.minSeconds;
      p.tc += r.tc;
      p.ti += r.ti;
      p.c3p += r.c3p;
      p.i3p += r.i3p;
      p.tlc += r.tlc;
      p.tli += r.tli;
      p.rd += r.rd;
      p.ro += r.ro;
      p.rt += r.rt;
      p.as += r.as;
      p.rec += r.rec;
      p.per += r.per;
      p.tap += r.tap;
      p.fpc += r.fpc;
      p.fpr += r.fpr;
      p.pt += r.pt;
      p.ptsTot += r.ptsTot;

      p.gameLogs.push({
        gameTitle: `${g.myTeamName} vs ${g.opponentName}`,
        gameDate: g.date,
        stats: r
      });
    });
  });

  // Calculate averages and derived percentages
  const aggregatedPlayers: AggregatedPlayer[] = Array.from(playerMap.values()).map(p => {
    const gp = Math.max(1, p.gamesPlayed);
    const avgSec = Math.round(p.totalSeconds / gp);
    const fga = p.ti + p.i3p;

    const ppg = Number((p.pt / gp).toFixed(1));
    const rpg = Number((p.rt / gp).toFixed(1));
    const apg = Number((p.as / gp).toFixed(1));
    const spg = Number((p.rec / gp).toFixed(1));
    const tovpg = Number((p.per / gp).toFixed(1));
    const bpg = Number((p.tap / gp).toFixed(1));
    const effpg = Number((p.ptsTot / gp).toFixed(1));

    const tiPct = p.ti > 0 ? Number(((p.tc / p.ti) * 100).toFixed(1)) : 0;
    const pct3p = p.i3p > 0 ? Number(((p.c3p / p.i3p) * 100).toFixed(1)) : 0;
    const tlPct = p.tli > 0 ? Number(((p.tlc / p.tli) * 100).toFixed(1)) : 0;
    const ar3p = fga > 0 ? Number(((p.i3p / fga) * 100).toFixed(1)) : 0;
    const ftr = fga > 0 ? Number(((p.tli / fga) * 100).toFixed(1)) : 0;
    const efgPct = fga > 0 ? Number((((p.tc + 1.5 * p.c3p) / fga) * 100).toFixed(1)) : 0;

    const tsDenom = 2 * (fga + 0.44 * p.tli);
    const tsPct = tsDenom > 0 ? Number(((p.pt / tsDenom) * 100).toFixed(1)) : 0;

    const tovDenom = fga + 0.44 * p.tli + p.per;
    const tovPct = tovDenom > 0 ? Number(((p.per / tovDenom) * 100).toFixed(1)) : 0;

    return {
      ...p,
      avgMin: formatSecondsToMinutes(avgSec),
      ppg,
      rpg,
      apg,
      spg,
      tovpg,
      bpg,
      effpg,
      tiPct,
      pct3p,
      tlPct,
      ar3p,
      ftr,
      efgPct,
      tsPct,
      tovPct
    };
  });

  // Filtered players
  const filtered = aggregatedPlayers.filter(p =>
    p.playerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Leaders
  const topScorer = [...aggregatedPlayers].sort((a, b) => b.ppg - a.ppg)[0];
  const topRebounder = [...aggregatedPlayers].sort((a, b) => b.rpg - a.rpg)[0];
  const topPasser = [...aggregatedPlayers].sort((a, b) => b.apg - a.apg)[0];
  const topEfficiency = [...aggregatedPlayers].sort((a, b) => b.effpg - a.effpg)[0];

  const selectedPlayer = selectedPlayerName
    ? aggregatedPlayers.find(p => p.playerName === selectedPlayerName)
    : null;

  return (
    <div className="space-y-6">
      
      {/* Team Leaders Banners */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Top Scorer */}
        <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="uppercase font-semibold tracking-wider">Máximo Anotador</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-bold text-sm text-[#00205B] dark:text-white truncate">
            {topScorer?.playerName || '-'}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-[#00205B] dark:text-white">
              {topScorer?.ppg || '0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">pts / partido</span>
          </div>
        </div>

        {/* Top Rebounder */}
        <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="uppercase font-semibold tracking-wider">Líder en Rebotes</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {topRebounder?.playerName || '-'}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {topRebounder?.rpg || '0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">reb / partido</span>
          </div>
        </div>

        {/* Top Passer */}
        <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="uppercase font-semibold tracking-wider">Líder en Asistencias</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {topPasser?.playerName || '-'}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">
              {topPasser?.apg || '0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ast / partido</span>
          </div>
        </div>

        {/* Top Efficiency */}
        <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="uppercase font-semibold tracking-wider">Mayor Valoración</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
            {topEfficiency?.playerName || '-'}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {topEfficiency?.effpg || '0'}
            </span>
            <span className="text-xs text-slate-400 font-mono">pts tot / partido</span>
          </div>
        </div>

      </div>

      {/* Main Aggregated Players Table */}
      <div className="bg-white dark:bg-[#0E1526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#00205B] dark:text-white uppercase tracking-wider">
              Resumen Acumulado y Promedios por Jugador
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Estadísticas calculadas automáticamente a lo largo de toda la temporada ({games.length} partidos)
            </p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar jugador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 w-52 focus:ring-1 focus:ring-[#00205B]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              <tr className="bg-[#00205B] text-white dark:bg-[#071330] text-[11px] font-bold text-center">
                <th className="py-2.5 px-3 text-left sticky left-0 z-10 bg-[#00205B] dark:bg-[#071330]"># · JUGADOR</th>
                <th className="py-2.5 px-2">PJ</th>
                <th className="py-2.5 px-2">Min/P</th>
                <th className="py-2.5 px-2.5 bg-[#001b4d] text-amber-300 font-black">PPG</th>
                <th className="py-2.5 px-2">2P%</th>
                <th className="py-2.5 px-2">3P%</th>
                <th className="py-2.5 px-2 bg-red-600 text-white font-extrabold">3PAr</th>
                <th className="py-2.5 px-2">TL%</th>
                <th className="py-2.5 px-2 bg-emerald-700 text-white font-extrabold">eFG%</th>
                <th className="py-2.5 px-2 bg-emerald-700 text-white font-extrabold">TS%</th>
                <th className="py-2.5 px-2 bg-emerald-700 text-white font-extrabold">ToV%</th>
                <th className="py-2.5 px-2">RPG</th>
                <th className="py-2.5 px-2">APG</th>
                <th className="py-2.5 px-2">SPG</th>
                <th className="py-2.5 px-2">BPG</th>
                <th className="py-2.5 px-2.5 bg-[#001b4d] text-amber-300 font-black">Pts Tot/P</th>
                <th className="py-2.5 px-2">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-center">
              {filtered.map(p => (
                <tr key={p.playerName} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="py-2.5 px-3 text-left font-sans font-bold text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-[#0E1526] border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-6 rounded bg-[#00205B]/10 dark:bg-blue-500/20 text-[#00205B] dark:text-[#93C5FD] font-mono font-black text-xs flex items-center justify-center shrink-0">
                        #{p.playerNumber ?? '-'}
                      </span>
                      <span className="truncate">{p.playerName}</span>
                      {p.playerPosition && (
                        <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                          ({p.playerPosition})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-2">{p.gamesPlayed}</td>
                  <td className="py-2.5 px-2">{p.avgMin}</td>
                  <td className="py-2.5 px-2.5 font-bold text-sm text-[#00205B] dark:text-[#93C5FD] bg-blue-50/50 dark:bg-blue-950/30">
                    {p.ppg}
                  </td>
                  <td className="py-2.5 px-2">{p.tiPct}%</td>
                  <td className="py-2.5 px-2">{p.pct3p}%</td>
                  <td className="py-2.5 px-2 font-bold text-red-600 bg-red-50/40 dark:bg-red-950/20">{p.ar3p}%</td>
                  <td className="py-2.5 px-2">{p.tlPct}%</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">{p.efgPct}%</td>
                  <td className="py-2.5 px-2 font-bold text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">{p.tsPct}%</td>
                  <td className="py-2.5 px-2 text-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20">{p.tovPct}%</td>
                  <td className="py-2.5 px-2 font-bold">{p.rpg}</td>
                  <td className="py-2.5 px-2">{p.apg}</td>
                  <td className="py-2.5 px-2">{p.spg}</td>
                  <td className="py-2.5 px-2">{p.bpg}</td>
                  <td className="py-2.5 px-2.5 font-black text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/20">
                    {p.effpg}
                  </td>
                  <td className="py-2.5 px-2 font-sans">
                    <button
                      onClick={() => setSelectedPlayerName(p.playerName === selectedPlayerName ? '' : p.playerName)}
                      className={`px-2 py-1 text-[10px] font-bold rounded ${
                        selectedPlayerName === p.playerName
                          ? 'bg-[#00205B] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {selectedPlayerName === p.playerName ? 'Ocultar' : 'Ver'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Individual Player Game-by-Game Detail Card */}
      {selectedPlayer && (
        <div className="bg-white dark:bg-[#0E1526] p-5 rounded-2xl border-2 border-[#00205B] dark:border-blue-500 shadow-md space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#00205B] text-white dark:bg-blue-600 font-mono font-black text-base flex items-center justify-center shadow-xs">
                #{selectedPlayer.playerNumber ?? '-'}
              </span>
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">
                  Ficha Individual · {selectedPlayer.playerPosition || 'Club SOMISA'}
                </span>
                <h3 className="text-lg font-bold text-[#00205B] dark:text-white">
                  {selectedPlayer.playerName}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>{selectedPlayer.gamesPlayed} partidos jugados</span>
              <span>·</span>
              <span>{selectedPlayer.ppg} PPG</span>
              <span>·</span>
              <span>{selectedPlayer.rpg} RPG</span>
              <span>·</span>
              <span>{selectedPlayer.apg} APG</span>
            </div>
          </div>

          <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">
            Desglose Partido a Partido de {selectedPlayer.playerName}
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold text-center">
                  <th className="py-2 px-3 text-left">Partido</th>
                  <th className="py-2 px-2">Min.</th>
                  <th className="py-2 px-2 font-bold text-[#00205B] dark:text-white">Pt</th>
                  <th className="py-2 px-2">2P (M/A)</th>
                  <th className="py-2 px-2">3P (M/A)</th>
                  <th className="py-2 px-2">3PAr</th>
                  <th className="py-2 px-2">TL (M/A)</th>
                  <th className="py-2 px-2">eFG%</th>
                  <th className="py-2 px-2">TS%</th>
                  <th className="py-2 px-2">ToV%</th>
                  <th className="py-2 px-2">RT (O/D)</th>
                  <th className="py-2 px-2">AS</th>
                  <th className="py-2 px-2">REC</th>
                  <th className="py-2 px-2">PER</th>
                  <th className="py-2 px-2">Tap</th>
                  <th className="py-2 px-2">FP</th>
                  <th className="py-2 px-2 font-black">Pts Tot</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-center">
                {selectedPlayer.gameLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-2.5 px-3 text-left font-sans font-semibold text-slate-900 dark:text-white">
                      <div>{log.gameTitle}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.gameDate}</div>
                    </td>
                    <td className="py-2.5 px-2">{log.stats.min}</td>
                    <td className="py-2.5 px-2 font-bold text-sm text-[#00205B] dark:text-[#93C5FD]">
                      {log.stats.pt}
                    </td>
                    <td className="py-2.5 px-2">{log.stats.tc}/{log.stats.ti} ({log.stats.tiPct}%)</td>
                    <td className="py-2.5 px-2">{log.stats.c3p}/{log.stats.i3p} ({log.stats.pct3p}%)</td>
                    <td className="py-2.5 px-2 font-bold text-red-600">{log.stats.ar3p}%</td>
                    <td className="py-2.5 px-2">{log.stats.tlc}/{log.stats.tli} ({log.stats.tlPct}%)</td>
                    <td className="py-2.5 px-2 text-emerald-600 font-bold">{log.stats.efgPct}%</td>
                    <td className="py-2.5 px-2 text-emerald-600 font-bold">{log.stats.tsPct}%</td>
                    <td className="py-2.5 px-2">{log.stats.tovPct}%</td>
                    <td className="py-2.5 px-2 font-bold">{log.stats.rt} ({log.stats.ro}/{log.stats.rd})</td>
                    <td className="py-2.5 px-2">{log.stats.as}</td>
                    <td className="py-2.5 px-2">{log.stats.rec}</td>
                    <td className="py-2.5 px-2 text-red-500">{log.stats.per}</td>
                    <td className="py-2.5 px-2">{log.stats.tap}</td>
                    <td className="py-2.5 px-2">{log.stats.fpc}</td>
                    <td className="py-2.5 px-2 font-black text-slate-900 dark:text-white">{log.stats.ptsTot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
