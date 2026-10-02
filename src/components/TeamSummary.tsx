import React from 'react';
import { Game } from '../types/basketball';
import { calculateTeamRowTotals, calculateFourFactors } from '../utils/calculations';
import { Shield, Zap, Target, Activity, Award, TrendingUp, Download, PieChart } from 'lucide-react';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface TeamSummaryProps {
  games: Game[];
  currentGameId: string;
  onOpenExportModal?: () => void;
}

export const TeamSummary: React.FC<TeamSummaryProps> = ({ 
  games, 
  currentGameId,
  onOpenExportModal 
}) => {
  const currentGame = games.find(g => g.id === currentGameId) || games[0];
  if (!currentGame) return null;

  const totals = calculateTeamRowTotals(currentGame.rows);
  const factors = calculateFourFactors(totals, currentGame.opponentStats);

  const pts2 = totals.tc * 2;
  const pts3 = totals.c3p * 3;
  const ptsFt = totals.tlc;
  const totalPts = totals.pt || 1;

  const pctPts2 = ((pts2 / totalPts) * 100).toFixed(1);
  const pctPts3 = ((pts3 / totalPts) * 100).toFixed(1);
  const pctPtsFt = ((ptsFt / totalPts) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Institutional Club Somisa Header Banner with Crest */}
      <div className="bg-white dark:bg-[#0E1526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <ClubSomisaLogo size={50} className="drop-shadow-md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#00205B] dark:text-white tracking-tight">
                CLUB SOMISA · RESUMEN COLECTIVO
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#00205B] dark:text-[#93C5FD] border border-blue-200 dark:border-blue-800">
                Oficial CABB / FBB
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Partido: <strong>{currentGame.myTeamName} ({currentGame.scoreMyTeam})</strong> vs <strong>{currentGame.opponentName} ({currentGame.scoreOpponent})</strong> · {currentGame.date} · {currentGame.competition}
            </p>
          </div>
        </div>

        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] text-white shadow-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Exportar Apartados (PDF / Excel / CSV)</span>
          </button>
        )}
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Puntos SOMISA</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-black font-mono text-[#00205B] dark:text-white">{totals.pt}</p>
          <p className="text-xs text-slate-500 mt-1">vs {currentGame.scoreOpponent} ({currentGame.opponentName})</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tiro Efectivo (eFG%)</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">{factors.eFGPct}%</p>
          <p className="text-xs text-slate-500 mt-1">Rival: {factors.oppEFGPct}%</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rebote Ofensivo (ORB%)</span>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">{factors.orbPct}%</p>
          <p className="text-xs text-slate-500 mt-1">Defensivo: {factors.drbPct}%</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-[#0E1526] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rating Neto</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className={`text-3xl font-black font-mono ${factors.netRating >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {factors.netRating > 0 ? `+${factors.netRating}` : factors.netRating}
          </p>
          <p className="text-xs text-slate-500 mt-1">Off: {factors.offensiveRating} | Def: {factors.defensiveRating}</p>
        </div>
      </div>

      {/* Dean Oliver 4 Factors Comparison */}
      <div className="bg-white dark:bg-[#0E1526] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Los 4 Factores de la Victoria (Dean Oliver)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluación estadística avanzada de eficiencia entre SOMISA y {currentGame.opponentName}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-blue-50 dark:bg-blue-950/60 text-[#00205B] dark:text-[#93C5FD]">
            Ritmo: {factors.pace} posesiones
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Factor 1: Tiro */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">1. Tiro Efectivo (40%)</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOMISA:</span>
              <span className="text-lg font-black font-mono text-[#00205B] dark:text-[#93C5FD]">{factors.eFGPct}%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Rival:</span>
              <span className="text-sm font-bold font-mono text-slate-500">{factors.oppEFGPct}%</span>
            </div>
          </div>

          {/* Factor 2: Pérdidas */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">2. Cuidado de Balón (25%)</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOMISA ToV%:</span>
              <span className="text-lg font-black font-mono text-[#00205B] dark:text-[#93C5FD]">{factors.tovPct}%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Rival ToV%:</span>
              <span className="text-sm font-bold font-mono text-slate-500">{factors.oppTovPct}%</span>
            </div>
          </div>

          {/* Factor 3: Rebote */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">3. Rebote Ofensivo (20%)</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOMISA ORB%:</span>
              <span className="text-lg font-black font-mono text-[#00205B] dark:text-[#93C5FD]">{factors.orbPct}%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Rival DRB%:</span>
              <span className="text-sm font-bold font-mono text-slate-500">{factors.drbPct}%</span>
            </div>
          </div>

          {/* Factor 4: Tiros Libres */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">4. Frecuencia TL (15%)</span>
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">SOMISA FTr:</span>
              <span className="text-lg font-black font-mono text-[#00205B] dark:text-[#93C5FD]">{factors.ftRate}%</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-slate-500">Rival FTr:</span>
              <span className="text-sm font-bold font-mono text-slate-500">{factors.oppFtRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Points Breakdown Section */}
      <div className="bg-white dark:bg-[#0E1526] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-[#00205B] dark:text-[#93C5FD]" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Distribución y Origen de los Puntos de SOMISA
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-300 uppercase">Tiros de 2 (Dobles)</span>
            <p className="text-2xl font-black font-mono text-[#00205B] dark:text-white mt-1">{pts2} pts</p>
            <p className="text-xs text-slate-500 mt-1">{pctPts2}% de la anotación ({totals.tc}/{totals.ti} - {totals.tiPct}%)</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">Tiros de 3 (Triples)</span>
            <p className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">{pts3} pts</p>
            <p className="text-xs text-slate-500 mt-1">{pctPts3}% de la anotación ({totals.c3p}/{totals.i3p} - {totals.pct3p}%)</p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40">
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase">Tiros Libres (TL)</span>
            <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">{ptsFt} pts</p>
            <p className="text-xs text-slate-500 mt-1">{pctPtsFt}% de la anotación ({totals.tlc}/{totals.tli} - {totals.tlPct}%)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
