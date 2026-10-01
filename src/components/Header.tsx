import React from 'react';
import { Moon, Sun, Download, Trophy, Target, Table, BarChart2, Users, PlusCircle, Github } from 'lucide-react';
import { ClubSomisaLogo } from './ClubSomisaLogo';

export type ActiveTab = 'grid' | 'team' | 'player' | 'shotchart' | 'matches';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenExportModal: () => void;
  onOpenCreateMatchModal: () => void;
  onOpenRosterModal?: () => void;
  onOpenGitHubModal?: () => void;
  currentGameTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  darkMode,
  onToggleDarkMode,
  onOpenExportModal,
  onOpenCreateMatchModal,
  onOpenRosterModal,
  onOpenGitHubModal,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'grid', label: 'Carga de Partido', icon: <Table className="w-4 h-4" /> },
    { id: 'team', label: 'Resumen del Equipo', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'player', label: 'Resumen Individual', icon: <Users className="w-4 h-4" /> },
    { id: 'shotchart', label: 'Mapa de Tiro', icon: <Target className="w-4 h-4" /> },
    { id: 'matches', label: 'Temporada', icon: <Trophy className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#090D16] border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark with official Club SOMISA Logo */}
        <div className="flex items-center gap-3">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); onTabChange('grid'); }}
            className="flex items-center gap-2.5 group text-decoration-none"
          >
            <ClubSomisaLogo size={38} className="w-9 h-9" />
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#00205B] dark:text-white leading-none">
                Club SOMISA
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                BÁSQUET · SAN NICOLÁS
              </span>
            </div>
          </a>
        </div>

        {/* Zone 2: Clean 4-6 text navigation links */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/80 dark:border-slate-800">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00205B] text-white shadow-sm dark:bg-[#0A327E]'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#00205B] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary actions (Dar de alta partido, plantilla, GitHub, exportar, modo nocturno) */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* BOTÓN DAR DE ALTA PARTIDO */}
          <button
            onClick={onOpenCreateMatchModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] rounded-lg shadow-sm transition-all whitespace-nowrap active:scale-[0.98]"
            title="Dar de alta un nuevo partido para Club SOMISA"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Dar de Alta Partido</span>
          </button>

          {/* Plantilla y Dorsales de SOMISA */}
          {onOpenRosterModal && (
            <button
              onClick={onOpenRosterModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#00205B] dark:text-[#93C5FD] bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors whitespace-nowrap"
              title="Administrar plantilla oficial, nombres y números (#) de Club SOMISA"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Plantilla (#)</span>
            </button>
          )}

          {/* Respaldo GitHub */}
          {onOpenGitHubModal && (
            <button
              onClick={onOpenGitHubModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap"
              title="Respaldo de base de datos JSON para subir a GitHub"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
            </button>
          )}

          {/* Export Report CTA */}
          <button
            onClick={onOpenExportModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-all whitespace-nowrap active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar PDF/CSV</span>
          </button>

          {/* Dark Mode Night Match Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Cambiar a modo diurno' : 'Cambiar a modo nocturno (lectura nocturna)'}
            className="flex items-center gap-1.5 p-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
          >
            {darkMode ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#00205B]" />
            )}
          </button>
        </div>

      </div>

      {/* Mobile nav drawer strip */}
      <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-slate-200 dark:border-slate-800 gap-1.5 bg-slate-50 dark:bg-slate-900/90 items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#00205B] text-white dark:bg-[#0A327E]'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={onOpenExportModal}
          className="flex sm:hidden p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
