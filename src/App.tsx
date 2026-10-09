import React, { useState, useEffect } from 'react';
import { Game, Shot, ShotType, ShotZone, PlayerProfile } from './types/basketball';
import {
  loadSavedGames,
  saveGames,
  loadMasterRoster,
  saveMasterRoster,
  getDarkModePreference,
  saveDarkModePreference,
  fetchRemoteSharedData,
  mergeGamesList,
  deduplicateGamesList,
  loadGitHubSyncConfig,
  pushDataToGitHubRepo,
} from './utils/storage';
import { calculateRowMetrics } from './utils/calculations';
import { Header, ActiveTab } from './components/Header';
import { ExcelBoxScoreGrid } from './components/ExcelBoxScoreGrid';
import { TeamSummary } from './components/TeamSummary';
import { PlayerSummary } from './components/PlayerSummary';
import { ShotChart } from './components/ShotChart';
import { SeasonManager } from './components/SeasonManager';
import { ReportExportModal } from './components/ReportExportModal';
import { CreateMatchModal } from './components/CreateMatchModal';
import { RosterManagerModal } from './components/RosterManagerModal';
import { GitHubExportModal } from './components/GitHubExportModal';
import { ImportExcelModal } from './components/ImportExcelModal';

export default function App() {
  const [games, setGames] = useState<Game[]>(() => loadSavedGames());
  const [roster, setRoster] = useState<PlayerProfile[]>(() => loadMasterRoster());
  const [currentGameId, setCurrentGameId] = useState<string>(() => {
    const saved = loadSavedGames();
    return saved[0]?.id || '';
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('grid');
  const [darkMode, setDarkMode] = useState<boolean>(() => getDarkModePreference());
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isCreateMatchModalOpen, setIsCreateMatchModalOpen] = useState<boolean>(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);
  const [isImportExcelModalOpen, setIsImportExcelModalOpen] = useState<boolean>(false);

  // Sync dark mode
  useEffect(() => {
    saveDarkModePreference(darkMode);
  }, [darkMode]);

  // Sync games to localStorage
  useEffect(() => {
    if (games.length > 0) {
      saveGames(games);
    }
  }, [games]);

  // Sync master roster to localStorage
  useEffect(() => {
    if (roster.length > 0) {
      saveMasterRoster(roster);
    }
  }, [roster]);

  // Al abrir la app en cualquier navegador, consultar ./somisa_data.json del repositorio GitHub
  // para incorporar automáticamente los partidos publicados desde otros navegadores/dispositivos.
  useEffect(() => {
    let mounted = true;
    fetchRemoteSharedData().then((remote) => {
      if (!mounted || !remote) return;
      if (remote.games && remote.games.length > 0) {
        setGames((prevLocal) => {
          const merged = mergeGamesList(prevLocal, remote.games!);
          saveGames(merged);
          return merged;
        });
      }
      if (remote.roster && remote.roster.length > 0) {
        setRoster(remote.roster);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const triggerAutoGitHubSync = (updatedGames: Game[], updatedRoster: PlayerProfile[] = roster) => {
    const cfg = loadGitHubSyncConfig();
    if (cfg.autoSync && cfg.owner && cfg.repo && cfg.token) {
      pushDataToGitHubRepo(cfg, updatedGames, updatedRoster).catch(() => {});
    }
  };

  const currentGame = games.find((g) => g.id === currentGameId) || games[0];

  // Update current game
  const handleUpdateCurrentGame = (partial: Partial<Game>) => {
    setGames((prev) =>
      prev.map((g) => {
        if (g.id === currentGame.id) {
          return { ...g, ...partial };
        }
        return g;
      })
    );
  };

  // Add shot in ShotChart post-game analysis
  const handleAddShot = (shotData: {
    playerId: string;
    playerName: string;
    playerNumber?: number;
    made: boolean;
    shotType: ShotType;
    zone: ShotZone;
    x: number;
    y: number;
  }) => {
    if (!currentGame) return;

    const newShot: Shot = {
      id: `shot_${Date.now()}`,
      gameId: currentGame.id,
      playerId: shotData.playerId,
      playerName: shotData.playerName,
      playerNumber: shotData.playerNumber,
      quarter: 1,
      x: shotData.x,
      y: shotData.y,
      made: shotData.made,
      shotType: shotData.shotType,
      zone: shotData.zone,
      timestamp: Date.now(),
    };

    handleUpdateCurrentGame({
      shots: [newShot, ...currentGame.shots],
    });
  };

  // Delete shot from shot chart
  const handleDeleteShot = (shotId: string) => {
    if (!currentGame) return;
    handleUpdateCurrentGame({
      shots: currentGame.shots.filter((s) => s.id !== shotId),
    });
  };

  // Create game
  const handleCreateGame = (newGame: Game) => {
    setGames((prev) => {
      const next = [newGame, ...prev];
      triggerAutoGitHubSync(next);
      return next;
    });
    setCurrentGameId(newGame.id);
    setActiveTab('grid');
  };

  // Delete game
  const handleDeleteGame = (gameId: string) => {
    const remaining = games.filter((g) => g.id !== gameId);
    if (remaining.length === 0) {
      const freshRows = roster.map((p) =>
        calculateRowMetrics({
          playerNumber: p.number,
          playerName: p.name,
          playerPosition: p.position,
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
          ptsTot: 0,
        })
      );

      const newBlankGame: Game = {
        id: `somisa_match_${Date.now()}`,
        title: 'SOMISA (San Nicolas) vs Nuevo Rival',
        date: new Date().toISOString().split('T')[0],
        competition: 'LIGA PCIAL FBB (Masculino 2026) - CABB',
        season: '2026',
        homeAway: 'home',
        myTeamName: 'SOMISA (San Nicolas)',
        opponentName: 'Nuevo Rival',
        scoreMyTeam: 0,
        scoreOpponent: 0,
        notes: 'Partido nuevo en blanco.',
        rows: freshRows,
        shots: [],
      };

      setGames([newBlankGame]);
      setCurrentGameId(newBlankGame.id);
    } else {
      setGames(remaining);
      if (currentGameId === gameId) {
        setCurrentGameId(remaining[0].id);
      }
    }
  };

  const handleImportBackup = (importedGames: Game[]) => {
    const clean = deduplicateGamesList(importedGames);
    setGames(clean);
    if (clean.length > 0) {
      setCurrentGameId(clean[0].id);
    }
  };

  const handleSyncRosterToGames = (newRoster: PlayerProfile[]) => {
    setRoster(newRoster);
    setGames((prevGames) =>
      prevGames.map((g) => {
        const updatedRows = g.rows.map((row) => {
          const match = newRoster.find(
            (p) => p.name.trim().toUpperCase() === row.playerName.trim().toUpperCase()
          );
          if (match) {
            return {
              ...row,
              playerNumber: match.number,
              playerPosition: match.position,
            };
          }
          return row;
        });
        return { ...g, rows: updatedRows };
      })
    );
  };

  const handleImportFullData = (imported: { games: Game[]; roster?: PlayerProfile[] }) => {
    if (imported.games && imported.games.length > 0) {
      const clean = deduplicateGamesList(imported.games);
      setGames(clean);
      setCurrentGameId(clean[0].id);
    }
    if (imported.roster && imported.roster.length > 0) {
      setRoster(imported.roster);
    }
  };

  const handleCreateNewGameWithData = (gameData: Partial<Game>) => {
    const newGame: Game = {
      id: `match_excel_${Date.now()}`,
      title: gameData.title || `${gameData.myTeamName || 'SOMISA'} vs ${gameData.opponentName || 'Rival'}`,
      date: gameData.date || new Date().toISOString().split('T')[0],
      competition: gameData.competition || 'LIGA PCIAL FBB (Masculino 2026) - CABB',
      season: gameData.season || '2026',
      homeAway: gameData.homeAway || 'home',
      myTeamName: gameData.myTeamName || 'SOMISA (San Nicolas)',
      opponentName: gameData.opponentName || 'Rival',
      scoreMyTeam: gameData.scoreMyTeam || 0,
      scoreOpponent: gameData.scoreOpponent || 0,
      notes: gameData.notes || 'Importado desde planilla Excel oficial.',
      rows: gameData.rows || [],
      opponentStats: gameData.opponentStats,
      shots: [],
    };

    setGames((prev) => {
      const next = deduplicateGamesList([newGame, ...prev]);
      triggerAutoGitHubSync(next);
      return next;
    });
    setCurrentGameId(newGame.id);
    setActiveTab('grid');
  };

  if (!currentGame) {
    return <div className="p-8 text-center text-slate-500">Cargando aplicación...</div>;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${darkMode ? 'dark bg-[#080C14] text-slate-100' : 'bg-slate-50/70 text-slate-900'}`}>
      
      {/* Top Bar Header with Pantone 281 C branding, Dar de Alta Partido, Importar Excel, Plantilla and GitHub */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenCreateMatchModal={() => setIsCreateMatchModalOpen(true)}
        onOpenRosterModal={() => setIsRosterModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onOpenImportExcelModal={() => setIsImportExcelModalOpen(true)}
        currentGameTitle={currentGame.title}
      />

      {/* BARRA DESTACADA GLOBAL DE PARTIDOS CARGADOS (Visible en todas las vistas) */}
      <div className="w-full bg-[#001845] dark:bg-[#0B132B] border-b border-blue-900/60 dark:border-slate-800 text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-[#00205B] text-[11px] font-black uppercase tracking-wider shadow-xs">
              {games.length} Partidos en Temporada
            </span>
            <span className="text-xs text-blue-200 font-medium hidden md:inline">
              Selecciona un encuentro activo:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 flex-1 justify-end overflow-x-auto">
            {games.map((g) => {
              const isSelected = g.id === currentGame.id;
              const isWin = g.scoreMyTeam > g.scoreOpponent;
              return (
                <button
                  key={g.id}
                  onClick={() => setCurrentGameId(g.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-[#00205B] border-white shadow-sm scale-[1.02]'
                      : 'bg-white/10 text-blue-100 border-white/15 hover:bg-white/20'
                  }`}
                >
                  <span>vs {g.opponentName}</span>
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-extrabold ${
                      isSelected
                        ? isWin
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                        : isWin
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : 'bg-rose-500/30 text-rose-200'
                    }`}
                  >
                    {g.scoreMyTeam}-{g.scoreOpponent}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Viewport Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Tab 1: Carga de Partido en Grilla (Exact Excel Schema with dorsal numbers) */}
        {activeTab === 'grid' && (
          <div className="animate-in fade-in duration-150">
            <ExcelBoxScoreGrid
              game={currentGame}
              onUpdateGame={handleUpdateCurrentGame}
              allGames={games}
              onSelectGame={setCurrentGameId}
              onOpenCreateMatchModal={() => setIsCreateMatchModalOpen(true)}
              onOpenRosterModal={() => setIsRosterModalOpen(true)}
              onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
              onOpenImportExcelModal={() => setIsImportExcelModalOpen(true)}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              onDeleteGame={handleDeleteGame}
            />
          </div>
        )}

        {/* Tab 2: Resumen del Equipo (Team Summary & 4 Factors) */}
        {activeTab === 'team' && (
          <div className="animate-in fade-in duration-150">
            <TeamSummary
              games={games}
              currentGameId={currentGameId}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 3: Resumen Individual (Player Averages & Profiles with Dorsal Numbers) */}
        {activeTab === 'player' && (
          <div className="animate-in fade-in duration-150">
            <PlayerSummary 
              games={games} 
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          </div>
        )}

        {/* Tab 4: Mapa de Tiro & Zonas de Calor (Post-Game Shot Chart) */}
        {activeTab === 'shotchart' && (
          <div className="animate-in fade-in duration-150">
            <ShotChart
              game={currentGame}
              onAddShot={handleAddShot}
              onDeleteShot={handleDeleteShot}
            />
          </div>
        )}

        {/* Tab 5: Partidos de Temporada (Match Manager & JSON Backup) */}
        {activeTab === 'matches' && (
          <div className="animate-in fade-in duration-150">
            <SeasonManager
              games={games}
              currentGameId={currentGameId}
              onSelectGame={(id) => {
                setCurrentGameId(id);
                setActiveTab('grid');
              }}
              onCreateGame={handleCreateGame}
              onDeleteGame={handleDeleteGame}
              onImportBackup={handleImportBackup}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-4 px-6 bg-white dark:bg-[#090D16] text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00205B] dark:bg-[#3B82F6]"></span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Club SOMISA</span>
            <span>·</span>
            <span>San Nicolás de los Arroyos</span>
            <span>·</span>
            <span>Liga Provincial FBB / Liga Federal de Básquet</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRosterModalOpen(true)}
              className="hover:text-[#00205B] dark:hover:text-blue-300 transition-colors font-medium"
            >
              Plantilla de Jugadores (#{roster.length})
            </button>
            <span>·</span>
            <button
              onClick={() => setIsGitHubModalOpen(true)}
              className="hover:text-[#00205B] dark:hover:text-blue-300 transition-colors font-medium"
            >
              Respaldo JSON / GitHub
            </button>
            <span>·</span>
            <span>Exportación automática a PDF y CSV</span>
          </div>
        </div>
      </footer>

      {/* Modal: Dar de Alta Partido */}
      <CreateMatchModal
        isOpen={isCreateMatchModalOpen}
        onClose={() => setIsCreateMatchModalOpen(false)}
        existingGames={games}
        onCreateGame={handleCreateGame}
      />

      {/* Modal: Plantilla y Dorsales de Club SOMISA */}
      <RosterManagerModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        roster={roster}
        onSaveRoster={setRoster}
        onSyncRosterToGames={handleSyncRosterToGames}
        games={games}
      />

      {/* Modal: Respaldo y Persistencia para GitHub */}
      <GitHubExportModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        games={games}
        roster={roster}
        onImportFullData={handleImportFullData}
      />

      {/* Automated PDF & CSV Export Modal */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        game={currentGame}
        allGames={games}
      />

      {/* Modal: Importar Estadísticas desde Excel Oficial (CABB / FBB / FIBA) */}
      <ImportExcelModal
        isOpen={isImportExcelModalOpen}
        onClose={() => setIsImportExcelModalOpen(false)}
        currentGame={currentGame}
        onUpdateCurrentGame={handleUpdateCurrentGame}
        onCreateNewGameWithData={handleCreateNewGameWithData}
        masterRoster={roster}
        onUpdateMasterRoster={setRoster}
      />

    </div>
  );
}
