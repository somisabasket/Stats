import React, { useRef, useState } from 'react';
import { X, Download, Upload, Check, FileCode, Github, Database, ShieldCheck, Copy } from 'lucide-react';
import { Game, PlayerProfile } from '../types/basketball';
import { downloadDatabaseJson } from '../utils/storage';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  roster: PlayerProfile[];
  onImportFullData: (imported: { games: Game[]; roster?: PlayerProfile[] }) => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
  games,
  roster,
  onImportFullData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);

  if (!isOpen) return null;

  const handleExportJson = () => {
    downloadDatabaseJson(games, roster);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json.games) || Array.isArray(json)) {
          const gamesToImport = Array.isArray(json.games) ? json.games : json;
          const rosterToImport = Array.isArray(json.roster) ? json.roster : undefined;

          onImportFullData({
            games: gamesToImport,
            roster: rosterToImport,
          });

          setImportStatus(`¡Copia restaurada con éxito! (${gamesToImport.length} partidos cargados)`);
          setTimeout(() => {
            setImportStatus(null);
            onClose();
          }, 1500);
        } else {
          setImportStatus('El formato del archivo no contiene partidos válidos.');
        }
      } catch (err) {
        setImportStatus('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const gitInstructions = `git add .
git commit -m "Estadisticas y plantilla Club SOMISA"
git push origin main`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(gitInstructions);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div 
        className="w-full max-w-xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">Guardado y Respaldo para GitHub</h3>
              <p className="text-[11px] text-white/80">Club SOMISA · Persistencia y Respaldo JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Card: Status indicator */}
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                ¡Tus datos están guardados automáticamente!
              </span>
              <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Todos los cambios (nombres, números de camiseta, estadísticas por partido y mapas de tiro) quedan almacenados en la memoria local de tu navegador (LocalStorage). Al subir la aplicación a GitHub, todo el código y la plantilla inicial quedan preservados.
              </p>
            </div>
          </div>

          {/* Backup Action 1: Export Complete JSON */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00205B] dark:text-[#93C5FD]" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Exportar Base de Datos Completa (.json)
                </span>
              </div>
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-[#00205B] dark:text-blue-200 px-2 py-0.5 rounded font-mono font-semibold">
                {games.length} partidos · {roster.length} jugadores
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Descarga un archivo JSON con todos los partidos, planillas y la lista de jugadores de Club SOMISA con sus dorsales. Puedes guardarlo en la carpeta de tu repositorio en GitHub para tener una copia exacta.
            </p>
            <button
              onClick={handleExportJson}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] rounded-lg shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Archivo JSON de Datos de SOMISA</span>
            </button>
          </div>

          {/* Backup Action 2: Import Backup JSON */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#00205B] dark:text-[#93C5FD]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Restaurar o Importar Respaldo (.json)
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Si cambias de computadora o clonas el proyecto desde GitHub en otro navegador, puedes cargar tu archivo JSON aquí para restaurar todas tus estadísticas al instante.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg shadow-xs transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Seleccionar Archivo JSON de Respaldo</span>
            </button>

            {importStatus && (
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-xs font-medium">
                {importStatus}
              </div>
            )}
          </div>

          {/* GitHub Pages Online Activation Guide */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-[#00205B] dark:text-[#93C5FD] font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span>¿Cómo ver la página publicada online en GitHub Pages? (100% Gratis)</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              El proyecto ya tiene configurado el archivo <code>.github/workflows/deploy.yml</code> y rutas relativas (<code>base: './'</code>) para que cualquier persona pueda abrir tu web desde su celular o computadora sin instalar nada:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-800 dark:text-slate-200 text-[11px] font-medium bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-blue-100 dark:border-blue-900/60">
              <li>Sube el proyecto a tu repositorio de GitHub (con los comandos de abajo).</li>
              <li>En GitHub, haz clic en la pestaña <strong>Settings</strong> (Configuración del repositorio).</li>
              <li>En la barra lateral izquierda, entra en <strong>Pages</strong>.</li>
              <li>En <strong>Build and deployment &gt; Source</strong>, selecciona: <strong>GitHub Actions</strong>.</li>
              <li>¡Listo! En unos segundos tendrás tu enlace público: <span className="font-mono text-blue-700 dark:text-blue-300 font-bold">https://tu-usuario.github.io/tu-repo/</span></li>
            </ol>
          </div>

          {/* Quick GitHub Terminal Steps */}
          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-white" /> Comandos para subir a GitHub
              </span>
              <button
                onClick={copyToClipboard}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded transition-colors"
              >
                {copiedGitCmd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedGitCmd ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <pre className="text-emerald-400 text-[11px] select-all overflow-x-auto p-2 bg-black/40 rounded">
              {gitInstructions}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
