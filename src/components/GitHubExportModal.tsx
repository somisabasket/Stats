import React, { useState, useEffect } from 'react';
import { 
  Github, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  X, 
  RefreshCw, 
  CloudUpload, 
  KeyRound, 
  CheckCircle2, 
  AlertTriangle,
  Globe,
  HelpCircle
} from 'lucide-react';
import { Game, PlayerProfile } from '../types/basketball';
import { ClubSomisaLogo } from './ClubSomisaLogo';
import { 
  GitHubSyncConfig, 
  loadGitHubSyncConfig, 
  saveGitHubSyncConfig, 
  pushDataToGitHubRepo,
  fetchRemoteSharedData
} from '../utils/storage';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  roster: PlayerProfile[];
  onImportFullData: (data: { games: Game[]; roster?: PlayerProfile[] }) => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
  games,
  roster,
  onImportFullData,
}) => {
  const [activeMode, setActiveMode] = useState<'cloud' | 'manual'>('cloud');
  const [syncConfig, setSyncConfig] = useState<GitHubSyncConfig>(() => loadGitHubSyncConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showTokenGuide, setShowTokenGuide] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSyncConfig(loadGitHubSyncConfig());
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const exportPayload = {
    appName: 'Club SOMISA Básquetbol',
    version: '4.0.0',
    exportDate: new Date().toISOString(),
    totalGames: games.length,
    roster,
    games
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);

  const handleUpdateConfig = (partial: Partial<GitHubSyncConfig>) => {
    const next = { ...syncConfig, ...partial };
    setSyncConfig(next);
    saveGitHubSyncConfig(next);
  };

  const handleSyncToGitHubNow = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const res = await pushDataToGitHubRepo(syncConfig, games, roster);
    if (res.ok) {
      handleUpdateConfig({ lastSyncedAt: new Date().toLocaleString() });
    }
    setSyncResult(res);
    setIsSyncing(false);
  };

  const handlePullFromGitHubNow = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    const remote = await fetchRemoteSharedData();
    if (remote && remote.games && remote.games.length > 0) {
      onImportFullData({
        games: remote.games,
        roster: remote.roster
      });
      setSyncResult({
        ok: true,
        message: `¡Se descargaron ${remote.games.length} partido(s) publicados en el repositorio de GitHub!`
      });
    } else {
      setSyncResult({
        ok: false,
        message: 'Aún no hay partidos guardados en somisa_data.json dentro del repositorio o son idénticos.'
      });
    }
    setIsSyncing(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `somisa_data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    try {
      const parsed = JSON.parse(importText);
      if (parsed.games && Array.isArray(parsed.games)) {
        onImportFullData({
          games: parsed.games,
          roster: Array.isArray(parsed.roster) ? parsed.roster : undefined
        });
        setStatusMessage('¡Datos restaurados con éxito!');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage('El archivo no contiene un formato de partidos válido.');
      }
    } catch {
      setStatusMessage('Error: formato JSON inválido.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-3">
            <ClubSomisaLogo size={36} className="bg-white/10 p-0.5 rounded-full" />
            <div>
              <h3 className="font-extrabold text-sm tracking-wide">
                SINCRONIZACIÓN EN TODOS LOS NAVEGADORES (GITHUB)
              </h3>
              <p className="text-[11px] text-blue-200">
                Publica los partidos cargados para que se vean en cualquier PC o celular
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Why browsers don't sync by default */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00205B] dark:text-[#93C5FD]">
              <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>¿Por qué los partidos cargados en un navegador no aparecían en otro?</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              GitHub Pages es un servidor estático: cuando cargas un partido, se guarda en la memoria interna (<code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800">localStorage</code>) de <strong>ese navegador</strong>. Para que todos los demás navegadores y celulares vean los partidos nuevos, ahora la app lee automáticamente el archivo compartido <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">public/somisa_data.json</code> de tu GitHub.
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setActiveMode('cloud')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all cursor-pointer ${
                activeMode === 'cloud'
                  ? 'bg-white dark:bg-[#0E1526] text-[#00205B] dark:text-[#93C5FD] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CloudUpload className="w-4 h-4 text-emerald-500" />
              <span>Opción 1: Sincronización Directa a GitHub (1 Clic)</span>
            </button>
            <button
              onClick={() => setActiveMode('manual')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg transition-all cursor-pointer ${
                activeMode === 'manual'
                  ? 'bg-white dark:bg-[#0E1526] text-[#00205B] dark:text-[#93C5FD] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Opción 2: Subir Archivo somisa_data.json / Respaldo</span>
            </button>
          </div>

          {activeMode === 'cloud' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    <span>Configuración de tu Repositorio GitHub</span>
                  </span>
                  <button
                    onClick={() => setShowTokenGuide(!showTokenGuide)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 underline flex items-center gap-1 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showTokenGuide ? 'Ocultar guía de Token' : '¿Cómo obtener mi Token de GitHub?'}</span>
                  </button>
                </div>

                {showTokenGuide && (
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <p className="font-bold text-amber-900 dark:text-amber-300">Pasos para crear tu Token en 30 segundos:</p>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>En GitHub ve a tu foto de perfil (arriba a la derecha) → <strong>Settings</strong>.</li>
                      <li>Baja del todo a <strong>Developer settings</strong> → <strong>Personal access tokens</strong> → <strong>Tokens (classic)</strong>.</li>
                      <li>Haz clic en <strong>Generate new token (classic)</strong>, marca la casilla <strong>repo</strong> y dale a Generate.</li>
                      <li>Pega ese código (<code className="font-mono">ghp_...</code>) aquí abajo. Quedará guardado en tu navegador para publicar partidos con 1 clic.</li>
                    </ol>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Usuario de GitHub
                    </label>
                    <input
                      type="text"
                      value={syncConfig.owner}
                      onChange={(e) => handleUpdateConfig({ owner: e.target.value })}
                      placeholder="Ej: dperez"
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Nombre del Repositorio
                    </label>
                    <input
                      type="text"
                      value={syncConfig.repo}
                      onChange={(e) => handleUpdateConfig({ repo: e.target.value })}
                      placeholder="Ej: club-somisa-basquet"
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Rama Principal
                    </label>
                    <input
                      type="text"
                      value={syncConfig.branch}
                      onChange={(e) => handleUpdateConfig({ branch: e.target.value })}
                      placeholder="main"
                      className="w-full text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-amber-500" />
                    <span>GitHub Personal Access Token (con permiso 'repo')</span>
                  </label>
                  <input
                    type="password"
                    value={syncConfig.token}
                    onChange={(e) => handleUpdateConfig({ token: e.target.value })}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full text-xs font-mono py-2 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={syncConfig.autoSync}
                    onChange={(e) => handleUpdateConfig({ autoSync: e.target.checked })}
                    className="rounded text-[#00205B] focus:ring-[#00205B]"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sincronizar automáticamente con GitHub cada vez que creo o importo un partido nuevo
                  </span>
                </label>
              </div>

              {syncResult && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs font-semibold ${
                  syncResult.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                }`}>
                  {syncResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{syncResult.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleSyncToGitHubNow}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-sm transition-all cursor-pointer"
                >
                  <CloudUpload className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
                  <span>
                    {isSyncing ? 'Publicando en GitHub...' : `Publicar ${games.length} Partido(s) en GitHub Ahora`}
                  </span>
                </button>

                <button
                  onClick={handlePullFromGitHubNow}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-[#00205B] dark:text-[#93C5FD] bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Descargar Partidos del Repositorio</span>
                </button>
              </div>

              {syncConfig.lastSyncedAt && (
                <p className="text-[11px] text-center text-slate-400">
                  Última publicación en GitHub: <strong>{syncConfig.lastSyncedAt}</strong>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                <p className="font-bold text-amber-900 dark:text-amber-300">
                  ¿Cómo actualizar el repositorio sin usar Token?
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                  <li>Haz clic abajo en <strong>Descargar somisa_data.json</strong>.</li>
                  <li>Sube ese archivo a la carpeta <code className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-bold">public/somisa_data.json</code> (y/o raíz) de tu repositorio en GitHub.</li>
                  <li>¡Listo! Cualquier navegador, celular o PC que abra tu enlace de GitHub cargará automáticamente todos esos partidos.</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDownloadFile}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Descargar somisa_data.json ({games.length} partidos)</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar JSON'}</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  O pegar contenido JSON manualmente en este navegador:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Pega aquí el contenido de somisa_data.json..."
                  className="w-full h-24 p-2.5 text-[11px] font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                />
                {statusMessage && (
                  <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {statusMessage}
                  </p>
                )}
                <button
                  onClick={handleImport}
                  disabled={!importText.trim()}
                  className="mt-2 w-full py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  Cargar Partidos en este Navegador
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            Partidos actuales en memoria: <strong>{games.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
