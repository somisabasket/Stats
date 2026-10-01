import React, { useState } from 'react';
import { Trophy, Plus, ArrowRight, Download, Upload, Trash2 } from 'lucide-react';
import { Game } from '../types/basketball';
import { getSampleGameRows } from '../utils/storage';
import { calculateRowMetrics } from '../utils/calculations';
import { DeleteMatchModal } from './DeleteMatchModal';

interface SeasonManagerProps {
  games: Game[];
  currentGameId: string;
  onSelectGame: (gameId: string) => void;
  onCreateGame: (newGame: Game) => void;
  onDeleteGame: (gameId: string) => void;
  onImportBackup: (games: Game[]) => void;
}

export const SeasonManager: React.FC<SeasonManagerProps> = ({
  games,
  currentGameId,
  onSelectGame,
  onCreateGame,
  onDeleteGame,
  onImportBackup,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [opponentName, setOpponentName] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [competition, setCompetition] = useState('Liga Federal / Torneo Oficial');
  const [homeAway, setHomeAway] = useState<'home' | 'away'>('home');
  const [copyRoster, setCopyRoster] = useState(true);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  // Season statistics aggregated
  const totalGames = games.length;
  const wins = games.filter(g => g.scoreMyTeam > g.scoreOpponent).length;
  const losses = games.filter(g => g.scoreMyTeam < g.scoreOpponent).length;
  const winPct = games.length > 0 ? ((wins / games.length) * 100).toFixed(1) : '0.0';

  const totalPtsFor = games.reduce((acc, g) => acc + g.scoreMyTeam, 0);
  const totalPtsAgainst = games.reduce((acc, g) => acc + g.scoreOpponent, 0);
  const avgPtsFor = games.length > 0 ? (totalPtsFor / games.length).toFixed(1) : '0.0';
  const avgPtsAgainst = games.length > 0 ? (totalPtsAgainst / games.length).toFixed(1) : '0.0';

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentName.trim()) return;

    const newGameId = `game_${Date.now()}`;
    
    // Copy existing player names with 0 stats
    let newRows = [];
    if (copyRoster && games[0]?.rows) {
      newRows = games[0].rows.map(r => calculateRowMetrics({
        id: `row_${Date.now()}_${Math.random()}`,
        playerNumber: r.playerNumber,
        playerName: r.playerName,
        playerPosition: r.playerPosition,
        min: '00:00',
        tc: 0,
        ti: 0,
        c3p: 0,
        i3p: 0,
        tlc: 0,
        tli: 0,
        rd: 0,
        ro: 0,
        as: 0,
        rec: 0,
        per: 0,
        tap: 0,
        fpc: 0,
        fpr: 0,
        ptsTot: 0
      }));
    } else {
      newRows = getSampleGameRows().map(r => calculateRowMetrics({
        ...r,
        id: `row_${Date.now()}_${Math.random()}`,
        tc: 0,
        ti: 0,
        c3p: 0,
        i3p: 0,
        tlc: 0,
        tli: 0,
        rd: 0,
        ro: 0,
        as: 0,
        rec: 0,
        per: 0,
        tap: 0,
        fpc: 0,
        fpr: 0,
        ptsTot: 0
      }));
    }

    const newGame: Game = {
      id: newGameId,
      title: `${games[0]?.myTeamName || 'Club SOMISA'} vs ${opponentName.trim()}`,
      date: matchDate,
      competition,
      season: '2026',
      homeAway,
      myTeamName: games[0]?.myTeamName || 'Club SOMISA',
      opponentName: opponentName.trim(),
      scoreMyTeam: 0,
      scoreOpponent: 0,
      rows: newRows,
      shots: []
    };

    onCreateGame(newGame);
    setShowCreateModal(false);
    setOpponentName('');
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(games, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CopiaSeguridad_Temporada_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportBackup(parsed);
          alert('¡Temporada restaurada con éxito!');
        } else {
          alert('El archivo no contiene un formato de temporada válido.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      
      {/* Season Summary Statistics Banner */}
      <div className="bg-white dark:bg-[#0E1526] p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00205B] dark:bg-[#0A327E] text-white flex items-center justify-center shadow-xs">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#00205B] dark:text-white">
                Partidos de la Temporada 2026
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Historial de encuentros cargados y respaldo de base de datos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Descargar copia de seguridad en archivo JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Copia JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restaurar</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cargar Nuevo Partido</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Récord (V - D)</span>
            <div className="text-xl font-bold font-mono text-[#00205B] dark:text-white mt-0.5">
              {wins} - {losses}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">{winPct}% victorias</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Promedio Anotado (PPG)</span>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {avgPtsFor}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">pts por partido</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Promedio Recibido</span>
            <div className="text-xl font-bold font-mono text-slate-700 dark:text-slate-300 mt-0.5">
              {avgPtsAgainst}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">pts permitidos</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Diferencial Medio</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${
              parseFloat(avgPtsFor) - parseFloat(avgPtsAgainst) > 0 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {parseFloat(avgPtsFor) - parseFloat(avgPtsAgainst) > 0 ? `+${(parseFloat(avgPtsFor) - parseFloat(avgPtsAgainst)).toFixed(1)}` : (parseFloat(avgPtsFor) - parseFloat(avgPtsAgainst)).toFixed(1)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">margen medio</span>
          </div>
        </div>
      </div>

      {/* Games History List */}
      <div className="bg-white dark:bg-[#0E1526] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#00205B] dark:text-white uppercase tracking-wider">
          Partidos Guardados ({games.length})
        </h3>

        <div className="space-y-3">
          {games.map((g) => {
            const isCurrent = g.id === currentGameId;
            const isWinner = g.scoreMyTeam > g.scoreOpponent;

            return (
              <div
                key={g.id}
                onClick={() => onSelectGame(g.id)}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-[#00205B] bg-blue-50/40 dark:bg-blue-950/30 dark:border-[#3B82F6] ring-1 ring-[#00205B]'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-500 dark:text-slate-400">
                      {g.date} · {g.competition}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                      isWinner
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                    }`}>
                      {isWinner ? 'Victoria (W)' : 'Derrota (L)'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-[#00205B] dark:text-white">
                    {g.myTeamName} vs {g.opponentName} ({g.homeAway === 'home' ? 'Local' : 'Visitante'})
                  </h4>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {g.rows.length} jugadores en planilla · {g.shots.length} tiros registrados en mapa
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <span className="font-mono text-2xl font-extrabold text-[#00205B] dark:text-white">
                      {g.scoreMyTeam} - {g.scoreOpponent}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isCurrent ? (
                      <span className="px-2.5 py-1 text-xs font-bold text-[#00205B] dark:text-[#93C5FD] bg-blue-100 dark:bg-blue-900/60 rounded-lg">
                        Activo
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGame(g.id);
                        }}
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                        title="Cargar y editar este partido"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setGameToDelete(g);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Eliminar partido"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Delete Match Confirmation */}
      <DeleteMatchModal
        isOpen={!!gameToDelete}
        onClose={() => setGameToDelete(null)}
        game={gameToDelete}
        onConfirmDelete={(id) => {
          onDeleteGame(id);
          setGameToDelete(null);
        }}
        isLastGame={games.length <= 1}
      />

      {/* Modal: Create New Match */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-5 py-4 bg-[#00205B] text-white">
              <h3 className="text-base font-bold">Cargar Nuevo Partido</h3>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Equipo Rival
                </label>
                <input
                  type="text"
                  placeholder="Ej. Club Atlético Ferrocarril"
                  value={opponentName}
                  onChange={(e) => setOpponentName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Fecha del Encuentro
                </label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Competencia / Torneo
                </label>
                <input
                  type="text"
                  value={competition}
                  onChange={(e) => setCompetition(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Condición
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHomeAway('home')}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      homeAway === 'home'
                        ? 'bg-[#00205B] text-white border-[#00205B]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Local (Casa)
                  </button>
                  <button
                    type="button"
                    onClick={() => setHomeAway('away')}
                    className={`py-2 text-xs font-bold rounded-lg border ${
                      homeAway === 'away'
                        ? 'bg-[#00205B] text-white border-[#00205B]'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Visitante (Fuera)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  id="copyRoster"
                  checked={copyRoster}
                  onChange={(e) => setCopyRoster(e.target.checked)}
                  className="rounded text-[#00205B]"
                />
                <label htmlFor="copyRoster" className="cursor-pointer">
                  Copiar los nombres de jugadores de la plantilla actual
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-[#00205B] text-white hover:bg-[#001744]"
                >
                  Crear Planilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
