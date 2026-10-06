import React, { useState } from 'react';
import { Github, Download, Upload, Copy, Check, X, FileCode, HelpCircle, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Game, PlayerProfile } from '../types/basketball';
import { ClubSomisaLogo } from './ClubSomisaLogo';

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
  const [copied, setCopied] = useState(false);
  const [importText, setImportText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showDeploymentHelp, setShowDeploymentHelp] = useState(true);

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
    a.download = `somisa_basketball_backup_${new Date().toISOString().split('T')[0]}.json`;
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
        className="w-full max-w-xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-3 font-bold text-sm">
            <ClubSomisaLogo size={32} className="bg-white/10 p-0.5 rounded-full" />
            <span>GitHub & Respaldo de Base de Datos</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* GitHub Pages Solution Box */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>¿Por qué salía en blanco en GitHub Pages?</span>
              </div>
              <button
                onClick={() => setShowDeploymentHelp(!showDeploymentHelp)}
                className="text-[11px] text-amber-800 dark:text-amber-400 font-semibold underline cursor-pointer"
              >
                {showDeploymentHelp ? 'Ocultar' : 'Ver solución'}
              </button>
            </div>

            {showDeploymentHelp && (
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 pt-1">
                <p>
                  Una pantalla en blanco en GitHub Pages ocurre por 2 razones habituales:
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px]">
                  <li>
                    <strong>Configuración de origen (Source) en GitHub</strong>: En tu repositorio ve a <strong>Settings → Pages → Build and deployment → Source</strong>:
                    <ul className="list-disc pl-4 mt-1 text-slate-600 dark:text-slate-400">
                      <li>Si seleccionas <em>Deploy from a branch</em>: la rama DEBE ser <strong>gh-pages</strong> (carpeta <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">/ (root)</code>), <strong>nunca</strong> la rama <em>main</em> (ya que <em>main</em> contiene el código fuente sin compilar).</li>
                      <li>O bien, selecciona <strong>GitHub Actions</strong> para que use el flujo automatizado <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">.github/workflows/static.yml</code>.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Error de build previo corregido</strong>: El commit anterior tenía un error al exportar PDF que detenía la compilación en GitHub Actions. Ese error ya fue resuelto y la compilación ahora finaliza con <strong>0 errores</strong>.
                  </li>
                  <li>
                    <strong>Archivos .nojekyll y 404.html agregados</strong>: Ya incluimos estos archivos en <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">public/</code> para evitar que GitHub filtre las rutas relativas de los scripts.
                  </li>
                </ol>
              </div>
            )}
          </div>

          {/* Backup Controls */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Respaldo de Datos (Temporada y Plantilla):
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadFile}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] transition-colors shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Descargar Archivo JSON</span>
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '¡Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Restaurar Respaldo (Pegar JSON):
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Pega aquí el contenido de un respaldo .json previamente descargado..."
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
              Restaurar Base de Datos
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
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
