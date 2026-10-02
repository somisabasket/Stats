import React, { useState } from 'react';
import { Github, Download, Upload, Copy, Check, X, FileCode } from 'lucide-react';
import { Game, PlayerProfile } from '../types/basketball';

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
        className="w-full max-w-xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-2.5 font-bold text-sm">
            <Github className="w-5 h-5" />
            <span>Respaldo de Base de Datos para GitHub / Local</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex gap-2">
            <button
              onClick={handleDownloadFile}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] transition-colors shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Descargar Archivo JSON</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'Copiar JSON'}</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Restaurar Respaldo (Pegar JSON):
            </label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Pega aquí el contenido de un respaldo .json previamente descargado..."
              className="w-full h-32 p-2.5 text-[11px] font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />
            {statusMessage && (
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {statusMessage}
              </p>
            )}
            <button
              onClick={handleImport}
              disabled={!importText.trim()}
              className="mt-2 w-full py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-xs"
            >
              Restaurar Base de Datos
            </button>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
