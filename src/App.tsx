import React, { useState, useEffect } from 'react';
import { Game, Shot, ShotType, ShotZone, PlayerProfile } from './types/basketball';
import {
  loadSavedGames,
  saveGames,
  loadMasterRoster,
  saveMasterRoster,
  getDarkModePreference,
  saveDarkModePreference,
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

  const handleDeleteShot = (shotId: string) => {
    if (!currentGame) return;
    handleUpdateCurrentGame({
      shots: currentGame.shots.filter((s) => s.id !== shotId),
    });
  };

  const handleCreateGame = (newGame: Game) => {
    // Ensure rows also pick up latest roster numbers if undefined
    const enrichedRows = newGame.rows.map(row => {
      const match = roster.find(
        p => p.name.trim().toUpperCase() === row.playerName.trim().toUpperCase()
      );
      if (match) {
        return {
          ...row,
          playerNumber: row.playerNumber ?? match.number,
          playerPosition: row.playerPosition ?? match.position,
        };
      }
      return row;
    });

    const enrichedGame = { ...newGame, rows: enrichedRows };
    setGames((prev) => [enrichedGame, ...prev]);
    setCurrentGameId(enrichedGame.id);
    setActiveTab('grid');
  };

  const handleDeleteGame = (gameId: string) => {
    const remaining = games.filter((g) => g.id !== gameId);
    if (remaining.length === 0) {
      // Recreate a clean blank game with SOMISA roster
      const freshRows = roster.map((r) =>
        calculateRowMetrics({
          id: `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          playerNumber: r.number,
          playerName: r.name,
          playerPosition: r.position,
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
        title: 'Club SOMISA vs Nuevo Rival',
        date: new Date().toISOString().split('T')[0],
        competition: 'Liga Federal de Básquet',
        season: '2026',
        homeAway: 'home',
        myTeamName: 'Club SOMISA',
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
    setGames(importedGames);
    if (importedGames.length > 0) {
      setCurrentGameId(importedGames[0].id);
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
      setGames(imported.games);
      setCurrentGameId(imported.games[0].id);
    }
    if (imported.roster && imported.roster.length > 0) {
      setRoster(imported.roster);
    }
  };

  if (!currentGame) {
    return <div className="p-8 text-center text-slate-500">Cargando aplicación...</div>;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${darkMode ? 'dark bg-[#080C14] text-slate-100' : 'bg-slate-50/70 text-slate-900'}`}>
      
      {/* Top Bar Header with Pantone 281 C branding, Dar de Alta Partido, Plantilla and GitHub */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenCreateMatchModal={() => setIsCreateMatchModalOpen(true)}
        onOpenRosterModal={() => setIsRosterModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        currentGameTitle={currentGame.title}
      />

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
            />
          </div>
        )}

        {/* Tab 3: Resumen Individual (Player Averages & Profiles with Dorsal Numbers) */}
        {activeTab === 'player' && (
          <div className="animate-in fade-in duration-150">
            <PlayerSummary games={games} />
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
            <span>Liga Federal de Básquet</span>
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
      />

    </div>
  );
}
