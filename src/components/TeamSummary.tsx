import React from 'react';
import { Game } from '../types/basketball';
import { calculateTeamRowTotals } from '../utils/calculations';
import { BarChart3, TrendingUp, ShieldCheck, Zap, Award, Target } from 'lucide-react';

interface TeamSummaryProps {
  games: Game[];
  currentGameId: string;
}

export const TeamSummary: React.FC<TeamSummaryProps> = ({ games, currentGameId }) => {
  const currentGame = games.find(g => g.id === currentGameId) || games[0];
  const currentTotals = calculateTeamRowTotals(currentGame.rows);

  // Calculate season-wide totals and averages
  const seasonGameTotals = games.map(g => ({
    game: g,
    totals: calculateTeamRowTotals(g.rows)
  }));

  const numGames = Math.max(1, games.length);

  const seasonSum = seasonGameTotals.reduce(
    (acc, curr) => {
      acc.pt += curr.totals.pt;
      acc.oppPt += curr.game.scoreOpponent;
      acc.tc += curr.totals.tc;
      acc.ti += curr.totals.ti;
      acc.c3p += curr.totals.c3p;
      acc.i3p += curr.totals.i3p;
      acc.tlc += curr.totals.tlc;
      acc.tli += curr.totals.tli;
      acc.rt += curr.totals.rt;
      acc.ro += curr.totals.ro;
      acc.rd += curr.totals.rd;
      acc.as += curr.totals.as;
      acc.rec += curr.totals.rec;
      acc.per += curr.totals.per;
      acc.tap += curr.totals.tap;
      acc.fpc += curr.totals.fpc;
      acc.fpr += curr.totals.fpr;
      acc.ptsTot += curr.totals.ptsTot;
      return acc;
    },
    {
      pt: 0,
      oppPt: 0,
      tc: 0,
      ti: 0,
      c3p: 0,
      i3p: 0,
      tlc: 0,
      tli: 0,
      rt: 0,
      ro: 0,
      rd: 0,
      as: 0,
      rec: 0,
      per: 0,
      tap: 0,
      fpc: 0,
      fpr: 0,
      ptsTot: 0
    }
  );

  const avgPt = (seasonSum.pt / numGames).toFixed(1);
  const avgOppPt = (seasonSum.oppPt / numGames).toFixed(1);
  const avgRt = (seasonSum.rt / numGames).toFixed(1);
  const avgAs = (seasonSum.as / numGames).toFixed(1);
  const avgRec = (seasonSum.rec / numGames).toFixed(1);
  const avgPer = (seasonSum.per / numGames).toFixed(1);
  const avgTap = (seasonSum.tap / numGames).toFixed(1);

  const seasonFga = seasonSum.ti + seasonSum.i3p;
  const seasonTiPct = seasonSum.ti > 0 ? ((seasonSum.tc / seasonSum.ti) * 100).toFixed(1) : '0.0';
  const seasonPct3p = seasonSum.i3p > 0 ? ((seasonSum.c3p / seasonSum.i3p) * 100).toFixed(1) : '0.0';
  const seasonTlPct = seasonSum.tli > 0 ? ((seasonSum.tlc / seasonSum.tli) * 100).toFixed(1) : '0.0';
  const seasonAr3p = seasonFga > 0 ? ((seasonSum.i3p / seasonFga) * 100).toFixed(1) : '0.0';
  const seasonEfgPct = seasonFga > 0 ? (((seasonSum.tc + 1.5 * seasonSum.c3p) / seasonFga) * 100).toFixed(1) : '0.0';
  const seasonTsDenom = 2 * (seasonFga + 0.44 * seasonSum.tli);
  const seasonTsPct = seasonTsDenom > 0 ? ((seasonSum.pt / seasonTsDenom) * 100).toFixed(1) : '0.0';
  const seasonTovDenom = seasonFga + 0.44 * seasonSum.tli + seasonSum.per;
  const seasonTovPct = seasonTovDenom > 0 ? ((seasonSum.per / seasonTovDenom) * 100).toFixed(1) : '0.0';

  // Points breakdown for current match
  const currentPtsFrom2 = currentTotals.tc * 2;
  const currentPtsFrom3 = currentTotals.c3p * 3;
  const currentPtsFromFt = currentTotals.tlc;
  const currentPtsTotal = Math.max(1, currentTotals.pt);

  const pct2 = ((currentPtsFrom2 / currentPtsTotal) * 100).toFixed(1);
  const pct3 = ((currentPtsFrom3 / currentPtsTotal) * 100).toFixed(1);
  const pctFt = ((currentPtsFromFt / currentPtsTotal) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      
      {/* Top Cards: Team Season Averages */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Puntos por Partido (PPG)</span>
          <div className="text-2xl font-black font-mono text-[#00205B] dark:text-white mt-1">
            {avgPt}
          </div>
          <span className="text-xs text-slate-500 font-mono">Permitidos: {avgOppPt} ppg</span>
        </div>

        <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Tiro Efectivo (eFG%)</span>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {seasonEfgPct}%
          </div>
          <span className="text-xs text-slate-500 font-mono">True Shooting: {seasonTsPct}%</span>
        </div>

        <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Rebotes por Partido</span>
          <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1">
            {avgRt}
          </div>
          <span className="text-xs text-slate-500 font-mono">{seasonSum.ro} Ofensivos · {seasonSum.rd} Defensivos</span>
        </div>

        <div className="bg-white dark:bg-[#0E1526] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Pérdidas vs Asistencias</span>
          <div className="text-2xl font-black font-mono text-[#00205B] dark:text-[#93C5FD] mt-1">
            {avgAs} / {avgPer}
          </div>
          <span className="text-xs text-slate-500 font-mono">Ratio AST/TO: {(parseFloat(avgAs) / Math.max(1, parseFloat(avgPer))).toFixed(2)}</span>
        </div>

      </div>

      {/* Dean Oliver's 4 Factors of Success Comparison */}
      <div className="bg-white dark:bg-[#0E1526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-[#00205B] dark:text-white">
              Cuatro Factores de Victoria del Equipo (Dean Oliver)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluación de tiro efectivo, pérdidas, rebote y agresividad en tiros libres
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Partido Actual: {currentGame.myTeamName} vs {currentGame.opponentName}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Factor 1: eFG% */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Tiro Efectivo (eFG%)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {currentTotals.efgPct.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">Temporada: {seasonEfgPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, currentTotals.efgPct)}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block">Ref. Élite &gt; 52.0%</span>
          </div>

          {/* Factor 2: TOV% */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">2. Cuidado de Balón (ToV%)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-[#00205B] dark:text-[#93C5FD]">
                {currentTotals.tovPct.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">Temporada: {seasonTovPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, currentTotals.tovPct * 3)}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block">Menor es mejor (&lt; 14.0%)</span>
          </div>

          {/* Factor 3: 3PAr */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">3. Frecuencia de Triples (3PAr)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-red-600 dark:text-red-400">
                {currentTotals.ar3p.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">Temporada: {seasonAr3p}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, currentTotals.ar3p)}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block">{currentTotals.i3p} triples de {currentTotals.ti + currentTotals.i3p} tiros</span>
          </div>

          {/* Factor 4: FTr */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">4. Tasa de Tiros Libres (FTr)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {currentTotals.ftr.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">Temporada: {((seasonSum.tli / Math.max(1, seasonFga)) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, currentTotals.ftr * 2)}%` }} />
            </div>
            <span className="text-[10px] text-slate-400 block">{currentTotals.tli} libres intentados</span>
          </div>

        </div>
      </div>

      {/* Points Distribution & Game-by-Game Comparison Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Origen de los Puntos */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0E1526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#00205B] dark:text-white uppercase tracking-wider">
            Origen de los Puntos (Partido Actual)
          </h3>

          <div className="h-5 w-full rounded-lg overflow-hidden flex shadow-xs">
            <div style={{ width: `${pct2}%` }} className="bg-[#00205B] dark:bg-[#1E428A]" title={`Dobles: ${currentPtsFrom2} pts (${pct2}%)`} />
            <div style={{ width: `${pct3}%` }} className="bg-sky-500" title={`Triples: ${currentPtsFrom3} pts (${pct3}%)`} />
            <div style={{ width: `${pctFt}%` }} className="bg-amber-400" title={`Tiros Libres: ${currentPtsFromFt} pts (${pctFt}%)`} />
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00205B] dark:bg-[#1E428A]"></span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tiros de 2 Puntos (TC)</span>
              </div>
              <span className="font-mono font-bold">{currentPtsFrom2} pts ({pct2}%)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-sky-500"></span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Triples (3PC)</span>
              </div>
              <span className="font-mono font-bold">{currentPtsFrom3} pts ({pct3}%)</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Tiros Libres (TLC)</span>
              </div>
              <span className="font-mono font-bold">{currentPtsFromFt} pts ({pctFt}%)</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900 text-[11px] text-slate-700 dark:text-blue-200">
            <strong>Efectividad del Partido:</strong> TC: {currentTotals.tiPct.toFixed(1)}% · 3P: {currentTotals.pct3p.toFixed(1)}% · TL: {currentTotals.tlPct.toFixed(1)}%
          </div>
        </div>

        {/* Game by Game Comparison Table */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0E1526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-[#00205B] dark:text-white uppercase tracking-wider">
            Comparativa de Rendimiento Partido a Partido
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold text-center">
                  <th className="py-2 px-3 text-left">Partido / Rival</th>
                  <th className="py-2 px-2">Resultado</th>
                  <th className="py-2 px-2">2P (M/A/%)</th>
                  <th className="py-2 px-2">3P (M/A/%)</th>
                  <th className="py-2 px-2">TL (M/A/%)</th>
                  <th className="py-2 px-2">RT</th>
                  <th className="py-2 px-2">AS</th>
                  <th className="py-2 px-2">PER</th>
                  <th className="py-2 px-2">eFG%</th>
                  <th className="py-2 px-2">TS%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-center">
                {seasonGameTotals.map(({ game, totals }) => (
                  <tr key={game.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-2.5 px-3 text-left font-sans font-semibold text-slate-900 dark:text-white">
                      <div>{game.opponentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{game.date} · {game.homeAway === 'home' ? 'Local' : 'Visitante'}</div>
                    </td>
                    <td className="py-2.5 px-2 font-bold text-slate-900 dark:text-white">
                      {totals.pt} - {game.scoreOpponent}
                    </td>
                    <td className="py-2.5 px-2">
                      {totals.tc}/{totals.ti} ({totals.tiPct.toFixed(0)}%)
                    </td>
                    <td className="py-2.5 px-2">
                      {totals.c3p}/{totals.i3p} ({totals.pct3p.toFixed(0)}%)
                    </td>
                    <td className="py-2.5 px-2">
                      {totals.tlc}/{totals.tli} ({totals.tlPct.toFixed(0)}%)
                    </td>
                    <td className="py-2.5 px-2 font-bold">{totals.rt}</td>
                    <td className="py-2.5 px-2">{totals.as}</td>
                    <td className="py-2.5 px-2 text-red-500">{totals.per}</td>
                    <td className="py-2.5 px-2 text-emerald-600 font-bold">{totals.efgPct.toFixed(1)}%</td>
                    <td className="py-2.5 px-2 text-emerald-600 font-bold">{totals.tsPct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
