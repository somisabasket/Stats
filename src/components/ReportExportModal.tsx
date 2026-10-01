import React, { useState } from 'react';
import { FileText, Download, Table, Check, X } from 'lucide-react';
import { Game } from '../types/basketball';
import { exportGameReportToPdf } from '../utils/exportPdf';
import { exportBoxscoreToCsv } from '../utils/exportCsv';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  game: Game;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  game,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePdfExport = () => {
    exportGameReportToPdf(game);
    triggerSuccess('PDF oficial generado y descargado');
  };

  const handleBoxscoreCsv = () => {
    exportBoxscoreToCsv(game);
    triggerSuccess('Planilla CSV descargada (compatible con Excel)');
  };

  const triggerSuccess = (msg: string) => {
    setDownloadSuccess(msg);
    setTimeout(() => {
      setDownloadSuccess(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-white/90" />
            <div>
              <h3 className="text-base font-bold">Exportación Automática de Reportes</h3>
              <p className="text-[11px] text-white/80">Formatos oficiales para cuerpo técnico y análisis</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Success Banner */}
          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Current Game Details */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Partido</span>
              <span className="font-bold text-[#00205B] dark:text-white text-sm">
                {game.myTeamName} vs {game.opponentName}
              </span>
            </div>
            <div className="text-right font-mono">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Resultado</span>
              <span className="font-bold text-sm text-[#00205B] dark:text-[#93C5FD]">
                {game.scoreMyTeam} - {game.scoreOpponent}
              </span>
            </div>
          </div>

          {/* Export Options List */}
          <div className="space-y-3">
            
            {/* 1. Official PDF Match Report */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-[#00205B] dark:hover:border-blue-500 transition-all flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Planilla Oficial Post-Partido (PDF)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Formato apaisado de alta resolución con todas las columnas de la grilla y 4 factores.
                  </p>
                </div>
              </div>
              <button
                onClick={handlePdfExport}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] text-white shadow-xs whitespace-nowrap active:scale-[0.98] transition-all"
              >
                Descargar PDF
              </button>
            </div>

            {/* 2. Standard Boxscore CSV */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-[#00205B] dark:hover:border-blue-500 transition-all flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Archivo Excel / CSV de Estadísticas
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Compatible 100% con Microsoft Excel y Google Sheets con separación regional.
                  </p>
                </div>
              </div>
              <button
                onClick={handleBoxscoreCsv}
                className="px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-xs whitespace-nowrap active:scale-[0.98] transition-all"
              >
                Descargar CSV
              </button>
            </div>

          </div>

          <div className="pt-2 text-center text-[11px] text-slate-400">
            Descargas instantáneas sin tiempos de espera.
          </div>

        </div>
      </div>
    </div>
  );
};
