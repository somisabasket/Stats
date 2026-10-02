import React, { useState, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  Clipboard, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Calendar, 
  Trophy, 
  Users, 
  Sparkles,
  RefreshCw,
  PlusCircle
} from 'lucide-react';
import { Game, PlayerProfile } from '../types/basketball';
import { parseExcelFile, parseExcelClipboardText, ParsedExcelGame } from '../utils/excelImport';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGame: Game;
  onUpdateCurrentGame: (updated: Partial<Game>) => void;
  onCreateNewGameWithData: (gameData: Partial<Game>) => void;
  masterRoster: PlayerProfile[];
  onUpdateMasterRoster: (roster: PlayerProfile[]) => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  currentGame,
  onUpdateCurrentGame,
  onCreateNewGameWithData,
  masterRoster,
  onUpdateMasterRoster,
}) => {
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState<string>('');
  const [parsedResult, setParsedResult] = useState<ParsedExcelGame | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [syncWithRoster, setSyncWithRoster] = useState<boolean>(true);

  // Editable fields for detected match
  const [editMyTeam, setEditMyTeam] = useState<string>('SOMISA (San Nicolas)');
  const [editOpponent, setEditOpponent] = useState<string>('GIMNASIA (Pergamino)');
  const [editCompetition, setEditCompetition] = useState<string>('LIGA PCIAL FBB (Masculino 2026) - CABB');
  const [editDate, setEditDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    try {
      setErrorMessage(null);
      setFileName(file.name);
      const parsed = await parseExcelFile(file, masterRoster);

      if (parsed.rows.length === 0) {
        setErrorMessage('No se encontraron filas de estadísticas de jugadores en el archivo. Verifica que contenga la planilla oficial con las columnas Num, Nombre, MIN, PTS, etc.');
        setParsedResult(null);
        return;
      }

      setParsedResult(parsed);
      setEditMyTeam(parsed.myTeamName || 'SOMISA (San Nicolas)');
      setEditOpponent(parsed.opponentName !== 'Rival' ? parsed.opponentName : currentGame.opponentName || 'GIMNASIA (Pergamino)');
      setEditCompetition(parsed.competition || 'LIGA PCIAL FBB (Masculino 2026) - CABB');
      setEditDate(parsed.date || new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setErrorMessage(`Error al leer el archivo Excel: ${err.message || 'Formato no compatible'}`);
      setParsedResult(null);
    }
  };

  const handlePasteProcess = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Pega el contenido copiado desde Excel primero.');
      return;
    }

    try {
      setErrorMessage(null);
      const parsed = parseExcelClipboardText(pastedText, masterRoster);

      if (parsed.rows.length === 0) {
        setErrorMessage('No se reconocieron jugadores en los datos pegados. Asegúrate de copiar las celdas de la tabla desde Excel.');
        setParsedResult(null);
        return;
      }

      setParsedResult(parsed);
      setEditMyTeam(parsed.myTeamName || 'SOMISA (San Nicolas)');
      setEditOpponent(parsed.opponentName !== 'Rival' ? parsed.opponentName : currentGame.opponentName || 'GIMNASIA (Pergamino)');
      setEditCompetition(parsed.competition || 'LIGA PCIAL FBB (Masculino 2026) - CABB');
      setEditDate(parsed.date || new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      console.error('Error parsing text:', err);
      setErrorMessage('Error al procesar el texto pegado.');
      setParsedResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyImport = (mode: 'replace' | 'new_game') => {
    if (!parsedResult) return;

    // Optional: Synchronize any new players into master roster
    if (syncWithRoster) {
      const updatedRoster = [...masterRoster];
      let rosterModified = false;

      parsedResult.rows.forEach(row => {
        if (!row.playerName) return;
        const exists = updatedRoster.some(
          p => p.name.toUpperCase() === row.playerName.toUpperCase() || (row.playerNumber && p.number === row.playerNumber)
        );

        if (!exists) {
          updatedRoster.push({
            id: `player_${Date.now()}_${Math.random()}`,
            name: row.playerName,
            number: row.playerNumber || 0,
            position: row.playerPosition || 'Alero',
            active: true
          });
          rosterModified = true;
        }
      });

      if (rosterModified) {
        onUpdateMasterRoster(updatedRoster);
      }
    }

    const gamePayload: Partial<Game> = {
      title: `${editMyTeam} vs ${editOpponent}`,
      myTeamName: editMyTeam,
      opponentName: editOpponent,
      competition: editCompetition,
      date: editDate,
      scoreMyTeam: parsedResult.scoreMyTeam,
      scoreOpponent: parsedResult.scoreOpponent || currentGame.scoreOpponent || 0,
      rows: parsedResult.rows,
      opponentStats: parsedResult.opponentStats || currentGame.opponentStats
    };

    if (mode === 'replace') {
      onUpdateCurrentGame(gamePayload);
    } else {
      onCreateNewGameWithData({
        ...gamePayload,
        season: parsedResult.season || '2026',
        homeAway: 'home',
        shots: []
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#00205B] dark:bg-[#0A327E] text-white shrink-0">
          <div className="flex items-center gap-3">
            <ClubSomisaLogo size={36} className="bg-white/10 p-0.5 rounded-full" />
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Importar Estadísticas desde Excel
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Formato Oficial CABB / FBB
                </span>
              </h3>
              <p className="text-xs text-white/80">
                Club SOMISA · Carga directa desde planillas oficiales de la Liga Provincial y Federal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-6 pt-3 shrink-0">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'border-[#00205B] dark:border-[#93C5FD] text-[#00205B] dark:text-[#93C5FD]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Subir Archivo Excel (.xlsx / .xls / .csv)</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'paste'
                ? 'border-[#00205B] dark:border-[#93C5FD] text-[#00205B] dark:text-[#93C5FD]'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            <span>Copiar y Pegar Celdas (Ctrl + V)</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* Tab 1: Upload Excel File */}
          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#00205B] bg-blue-50/50 dark:border-[#93C5FD] dark:bg-blue-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/40'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Arrastra aquí tu planilla de Excel o haz clic para seleccionarla
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-3">
                  Soporta archivos oficiales de estadísticas CABB / FBB / FIBA con dobles, triples, libres, rebotes, asistencias y valoración.
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  Examinar archivos (.xlsx, .xls, .csv)
                </span>
                {fileName && (
                  <p className="mt-3 text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    Archivo seleccionado: {fileName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Paste from Clipboard */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Selecciona las celdas en tu archivo de Excel, presiona <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[11px]">Ctrl + C</kbd> y pégalas aquí con <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded font-mono text-[11px]">Ctrl + V</kbd>:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Num.	Nombre	MIN	PTS	TC 2P	%	TC 3P	%	TL	%	DEF	OF	Tot.	AST	REC	PER	TC	TR	FC	FR	VAL	+/-
1	PAEZ, FELIPE	00:00	0	0/0	0	0/0	0	0/0	0	0	0	0	0	0	0	0	0	0	0	0	0
2	PEDEMONTE, JUAN PABLO	34:20	25	4/4	100	5/9	56	2/2	100	3	0	3	0	0	2	0	1	2	2	21	0
5	GONZALEZ ROVEDA, LUCIO	36:13	20	6/9	67	2/4	50	2/2	100	7	0	7	5	3	0	0	1	3	4	30	0..."
                className="w-full h-36 p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-mono focus:ring-2 focus:ring-[#00205B] outline-hidden leading-relaxed resize-y"
              />
              <button
                onClick={handlePasteProcess}
                disabled={!pastedText.trim()}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>Procesar Celdas Pegadas</span>
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Parsed Preview Card */}
          {parsedResult && (
            <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-200">
              
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      ¡Planilla Oficial Detectada con Éxito!
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Se identificaron <strong>{parsedResult.rows.length} jugadores</strong> con sus estadísticas completas y <strong>{parsedResult.scoreMyTeam} puntos</strong> de SOMISA.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncWithRoster}
                      onChange={(e) => setSyncWithRoster(e.target.checked)}
                      className="rounded border-slate-300 text-[#00205B] focus:ring-[#00205B]"
                    />
                    <span>Sincronizar dorsales con Plantilla SOMISA</span>
                  </label>
                </div>
              </div>

              {/* Match Metadata Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Mi Equipo
                  </label>
                  <input
                    type="text"
                    value={editMyTeam}
                    onChange={(e) => setEditMyTeam(e.target.value)}
                    className="w-full text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Equipo Rival
                  </label>
                  <input
                    type="text"
                    value={editOpponent}
                    onChange={(e) => setEditOpponent(e.target.value)}
                    className="w-full text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Torneo / Competición
                  </label>
                  <input
                    type="text"
                    value={editCompetition}
                    onChange={(e) => setEditCompetition(e.target.value)}
                    className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Fecha del Encuentro
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Player rows preview table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead className="bg-[#00205B] text-white font-mono sticky top-0 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2 px-2.5 text-center">#</th>
                        <th className="py-2 px-3">Nombre</th>
                        <th className="py-2 px-2 text-center">MIN</th>
                        <th className="py-2 px-2 text-center">PTS</th>
                        <th className="py-2 px-2 text-center">2P (A/I)</th>
                        <th className="py-2 px-2 text-center">3P (A/I)</th>
                        <th className="py-2 px-2 text-center">TL (A/I)</th>
                        <th className="py-2 px-2 text-center">REB</th>
                        <th className="py-2 px-2 text-center">AST</th>
                        <th className="py-2 px-2 text-center">REC</th>
                        <th className="py-2 px-2 text-center">PER</th>
                        <th className="py-2 px-2 text-center">FAL</th>
                        <th className="py-2 px-2.5 text-center">VAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {parsedResult.rows.map((r, i) => (
                        <tr 
                          key={r.id || i}
                          className={i % 2 === 0 ? 'bg-white dark:bg-[#0E1526]' : 'bg-slate-50 dark:bg-slate-900/40'}
                        >
                          <td className="py-1.5 px-2.5 text-center font-bold text-[#00205B] dark:text-[#93C5FD]">
                            {r.playerNumber ?? '-'}
                          </td>
                          <td className="py-1.5 px-3 font-sans font-semibold text-slate-900 dark:text-white">
                            {r.playerName}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-600 dark:text-slate-400">
                            {r.min}
                          </td>
                          <td className="py-1.5 px-2 text-center font-bold text-slate-900 dark:text-white">
                            {r.pt}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {r.tc}/{r.ti}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {r.c3p}/{r.i3p}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {r.tlc}/{r.tli}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {r.rt}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {r.as}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {r.rec}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {r.per}
                          </td>
                          <td className="py-1.5 px-2 text-center text-slate-700 dark:text-slate-300">
                            {r.fpc}
                          </td>
                          <td className="py-1.5 px-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                            {r.ptsTot}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>

          {parsedResult && (
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleApplyImport('replace')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-[#00205B] dark:text-[#93C5FD] bg-blue-100 dark:bg-blue-950/80 hover:bg-blue-200 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-colors"
                title="Actualiza la planilla del partido que tienes abierto actualmente"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reemplazar en Partido Actual</span>
              </button>

              <button
                onClick={() => handleApplyImport('new_game')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] shadow-sm transition-all"
                title="Crea un nuevo partido en tu temporada con estos datos"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Crear como Nuevo Partido</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
