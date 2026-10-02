import React, { useState } from 'react';
import { Plus, Trash2, Clipboard, PlusCircle, ChevronDown, Users, CheckCircle2, Github, Shield, FileSpreadsheet, Download } from 'lucide-react';
import { Game, ExcelRowStats } from '../types/basketball';
import { calculateRowMetrics, calculateTeamRowTotals } from '../utils/calculations';
import { parseExcelClipboardText } from '../utils/excelImport';
import { DeleteMatchModal } from './DeleteMatchModal';
import { ClubSomisaLogo } from './ClubSomisaLogo';

interface ExcelBoxScoreGridProps {
  game: Game;
  onUpdateGame: (updated: Partial<Game>) => void;
  allGames?: Game[];
  onSelectGame?: (gameId: string) => void;
  onOpenCreateMatchModal?: () => void;
  onOpenRosterModal?: () => void;
  onOpenGitHubModal?: () => void;
  onOpenImportExcelModal?: () => void;
  onOpenExportModal?: () => void;
  onDeleteGame?: (gameId: string) => void;
}

export const ExcelBoxScoreGrid: React.FC<ExcelBoxScoreGridProps> = ({
  game,
  onUpdateGame,
  allGames = [],
  onSelectGame,
  onOpenCreateMatchModal,
  onOpenRosterModal,
  onOpenGitHubModal,
  onOpenImportExcelModal,
  onOpenExportModal,
  onDeleteGame,
}) => {
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const teamTotals = calculateTeamRowTotals(game.rows);

  // Update a single cell in a row
  const handleCellChange = (rowIndex: number, field: keyof ExcelRowStats, value: any) => {
    const updatedRows = [...game.rows];
    const currentRow = { ...updatedRows[rowIndex] };

    if (field === 'playerName' || field === 'min' || field === 'playerPosition') {
      (currentRow as any)[field] = value;
    } else if (field === 'playerNumber') {
      currentRow.playerNumber = value === '' ? undefined : parseInt(value) || 0;
    } else {
      (currentRow as any)[field] = value === '' ? 0 : Number(value);
    }

    const recalculated = calculateRowMetrics(currentRow);
    updatedRows[rowIndex] = recalculated;

    const newTeamTotals = calculateTeamRowTotals(updatedRows);
    onUpdateGame({
      rows: updatedRows,
      scoreMyTeam: newTeamTotals.pt
    });
  };

  // Add new player row
  const handleAddRow = () => {
    const highestNum = game.rows.reduce((max, r) => Math.max(max, r.playerNumber || 0), 0);
    const newRow = calculateRowMetrics({
      id: `row_${Date.now()}`,
      playerNumber: highestNum + 1,
      playerName: 'NUEVO JUGADOR',
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
    });

    const updatedRows = [...game.rows, newRow];
    onUpdateGame({ rows: updatedRows });
  };

  // Remove player row
  const handleDeleteRow = (index: number) => {
    if (game.rows.length <= 1) {
      alert('Debe haber al menos un jugador en la planilla.');
      return;
    }
    const updatedRows = game.rows.filter((_, idx) => idx !== index);
    const newTeamTotals = calculateTeamRowTotals(updatedRows);
    onUpdateGame({
      rows: updatedRows,
      scoreMyTeam: newTeamTotals.pt
    });
  };

  // Paste from Excel parser (compatible with CABB/FBB and raw tables)
  const handleProcessPastedData = () => {
    if (!pastedText.trim()) return;

    try {
      const cabbParsed = parseExcelClipboardText(pastedText);
      if (cabbParsed.rows.length > 0) {
        const newTeamTotals = calculateTeamRowTotals(cabbParsed.rows);
        onUpdateGame({
          rows: cabbParsed.rows,
          scoreMyTeam: newTeamTotals.pt,
          opponentName: cabbParsed.opponentName !== 'Rival' ? cabbParsed.opponentName : game.opponentName,
          scoreOpponent: cabbParsed.scoreOpponent || game.scoreOpponent
        });
        setPasteStatus(`¡Se importaron ${cabbParsed.rows.length} jugadores con éxito (Formato CABB/FBB)!`);
        setTimeout(() => {
          setPasteModalOpen(false);
          setPastedText('');
          setPasteStatus(null);
        }, 1500);
        return;
      }

      const lines = pastedText.trim().split(/\r?\n/);
      const parsedRows: ExcelRowStats[] = [];

      for (const line of lines) {
        const cells = line.includes('\t') ? line.split('\t') : line.split(/[;,]/);
        if (cells.length < 5) continue;

        const firstCell = cells[0].trim().toUpperCase();
        if (firstCell === 'JUGADOR' || firstCell === 'TOTALES' || firstCell === 'TOTAL') continue;

        const cleanNum = (str: string | undefined) => {
          if (!str) return 0;
          const cleaned = str.replace(',', '.').replace('%', '').trim();
          return parseFloat(cleaned) || 0;
        };

        const parsed = calculateRowMetrics({
          playerName: cells[0]?.trim() || 'Jugador',
          min: cells[1]?.trim() || '00:00',
          tc: cleanNum(cells[2]),
          ti: cleanNum(cells[3]),
          c3p: cleanNum(cells[5]),
          i3p: cleanNum(cells[6]),
          tlc: cleanNum(cells[9]),
          tli: cleanNum(cells[10]),
          rd: cleanNum(cells[16]),
          ro: cleanNum(cells[17]),
          as: cleanNum(cells[19]),
          rec: cleanNum(cells[20]),
          per: cleanNum(cells[21]),
          tap: cleanNum(cells[22]),
          fpc: cleanNum(cells[23]),
          fpr: cleanNum(cells[24]),
          ptsTot: cleanNum(cells[26])
        });

        parsedRows.push(parsed);
      }

      if (parsedRows.length > 0) {
        const newTeamTotals = calculateTeamRowTotals(parsedRows);
        onUpdateGame({
          rows: parsedRows,
          scoreMyTeam: newTeamTotals.pt
        });
        setPasteStatus(`¡Se importaron ${parsedRows.length} jugadores con éxito!`);
        setTimeout(() => {
          setPasteModalOpen(false);
          setPastedText('');
          setPasteStatus(null);
        }, 1500);
      } else {
        setPasteStatus('No se encontraron filas con el formato esperado.');
      }
    } catch {
      setPasteStatus('Error al procesar los datos pegados.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Post-Game Match Header Card with Switcher and Actions */}
      <div className="bg-white dark:bg-[#0E1526] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="space-y-1.5 flex-1 min-w-[240px]">
            {allGames.length > 1 && onSelectGame && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Partido Activo:</span>
                <select
                  value={game.id}
                  onChange={(e) => onSelectGame(e.target.value)}
                  className="text-xs font-bold py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#00205B] dark:text-[#93C5FD] focus:ring-1 focus:ring-[#00205B]"
                >
                  {allGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.myTeamName} vs {g.opponentName} ({g.date})
                    </option>
                  ))}
                </select>
                {onDeleteGame && (
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    title="Eliminar este partido"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{game.competition}</span>
              <span>•</span>
              <span>{game.date}</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-[#00205B] dark:text-[#93C5FD]">
                {game.homeAway === 'home' ? 'Local' : 'Visitante'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <ClubSomisaLogo size={34} />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {game.myTeamName} <span className="text-slate-400 font-normal">vs</span> {game.opponentName}
              </h2>
            </div>
          </div>

          {/* Final Match Score Summary Banner */}
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{game.myTeamName}</span>
              <span className="text-2xl font-black font-mono text-[#00205B] dark:text-white">{teamTotals.pt}</span>
            </div>
            <span className="text-lg font-bold text-slate-300 dark:text-slate-700">-</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">{game.opponentName}</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={game.scoreOpponent}
                  onChange={(e) => onUpdateGame({ scoreOpponent: Math.max(0, parseInt(e.target.value) || 0) })}
                  className="w-16 text-2xl font-black font-mono text-slate-800 dark:text-slate-200 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-hidden text-center"
                  title="Puntos del rival (editable)"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {onOpenCreateMatchModal && (
              <button
                onClick={onOpenCreateMatchModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] text-white shadow-sm transition-all active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Dar de Alta Partido</span>
              </button>
            )}

            {onOpenImportExcelModal && (
              <button
                onClick={onOpenImportExcelModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-[0.98]"
                title="Importar estadísticas directamente desde archivo Excel oficial (.xlsx, .xls) o celdas CABB / FBB"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
                <span>Importar Excel</span>
              </button>
            )}

            {onOpenExportModal && (
              <button
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs transition-all active:scale-[0.98]"
                title="Exportar todos los apartados (Planilla de Partido, Resumen del Equipo y Resumen Individual) a PDF, Excel o CSV"
              >
                <Download className="w-4 h-4 text-[#00205B] dark:text-[#93C5FD]" />
                <span>Exportar Datos</span>
              </button>
            )}

            {onOpenRosterModal && (
              <button
                onClick={onOpenRosterModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-[#00205B] dark:text-[#93C5FD] transition-colors"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Plantilla (#)</span>
              </button>
            )}

            {onOpenGitHubModal && (
              <button
                onClick={onOpenGitHubModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Respaldo GitHub</span>
              </button>
            )}

            <button
              onClick={() => setPasteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Pegar desde Excel</span>
            </button>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar Jugador</span>
            </button>
          </div>

        </div>
      </div>

      {/* Main Stats Grid Table */}
      <div className="bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left border-collapse min-w-[1000px]">
            {/* Table Multi-Header */}
            <thead>
              <tr className="bg-[#00205B] text-white font-mono text-[10px] tracking-wider uppercase">
                <th className="py-2.5 px-2 text-center w-12 border-r border-blue-900">#</th>
                <th className="py-2.5 px-3 min-w-[160px] border-r border-blue-900">Jugador</th>
                <th className="py-2.5 px-2 text-center w-16 border-r border-blue-900">MIN</th>
                <th className="py-2.5 px-2 text-center w-12 border-r border-blue-900 bg-[#001744]">PTS</th>
                <th colSpan={3} className="py-1 px-2 text-center border-r border-blue-900 bg-[#071330]">
                  Dobles (2P)
                </th>
                <th colSpan={3} className="py-1 px-2 text-center border-r border-blue-900 bg-[#071330]">
                  Triples (3P)
                </th>
                <th colSpan={3} className="py-1 px-2 text-center border-r border-blue-900 bg-[#071330]">
                  Libres (TL)
                </th>
                <th colSpan={3} className="py-1 px-2 text-center border-r border-blue-900 bg-[#071330]">
                  Rebotes
                </th>
                <th className="py-2.5 px-2 text-center w-12 border-r border-blue-900">AST</th>
                <th className="py-2.5 px-2 text-center w-12 border-r border-blue-900">REC</th>
                <th className="py-2.5 px-2 text-center w-12 border-r border-blue-900">PER</th>
                <th className="py-2.5 px-2 text-center w-12 border-r border-blue-900">TAP</th>
                <th colSpan={2} className="py-1 px-2 text-center border-r border-blue-900 bg-[#071330]">
                  Faltas
                </th>
                <th className="py-2.5 px-2.5 text-center w-14 bg-emerald-700 text-white font-bold">VAL</th>
                <th className="py-2.5 px-2 text-center w-10"></th>
              </tr>
              <tr className="bg-[#0A327E] text-white/90 font-mono text-[9px] uppercase border-b border-blue-900">
                <th className="border-r border-blue-900"></th>
                <th className="border-r border-blue-900"></th>
                <th className="border-r border-blue-900"></th>
                <th className="border-r border-blue-900"></th>
                {/* 2P */}
                <th className="py-1 px-1 text-center w-10">Conv</th>
                <th className="py-1 px-1 text-center w-10">Int</th>
                <th className="py-1 px-1 text-center w-12 border-r border-blue-900">%</th>
                {/* 3P */}
                <th className="py-1 px-1 text-center w-10">Conv</th>
                <th className="py-1 px-1 text-center w-10">Int</th>
                <th className="py-1 px-1 text-center w-12 border-r border-blue-900">%</th>
                {/* TL */}
                <th className="py-1 px-1 text-center w-10">Conv</th>
                <th className="py-1 px-1 text-center w-10">Int</th>
                <th className="py-1 px-1 text-center w-12 border-r border-blue-900">%</th>
                {/* REB */}
                <th className="py-1 px-1 text-center w-10">Def</th>
                <th className="py-1 px-1 text-center w-10">Of</th>
                <th className="py-1 px-1 text-center w-12 border-r border-blue-900 font-bold">Tot</th>
                {/* AST, REC, PER, TAP */}
                <th className="border-r border-blue-900"></th>
                <th className="border-r border-blue-900"></th>
                <th className="border-r border-blue-900"></th>
                <th className="border-r border-blue-900"></th>
                {/* FAL */}
                <th className="py-1 px-1 text-center w-10">Com</th>
                <th className="py-1 px-1 text-center w-10 border-r border-blue-900">Rec</th>
                <th></th>
                <th></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {game.rows.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors ${
                    index % 2 === 0 ? 'bg-white dark:bg-[#0E1526]' : 'bg-slate-50/50 dark:bg-slate-900/30'
                  }`}
                >
                  {/* # Dorsal */}
                  <td className="py-1 px-1.5 text-center font-bold text-[#00205B] dark:text-[#93C5FD]">
                    <input
                      type="number"
                      value={row.playerNumber ?? ''}
                      onChange={(e) => handleCellChange(index, 'playerNumber', e.target.value)}
                      className="w-10 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden font-bold"
                    />
                  </td>

                  {/* Nombre */}
                  <td className="py-1 px-2.5 font-sans font-semibold text-slate-800 dark:text-slate-200">
                    <input
                      type="text"
                      value={row.playerName}
                      onChange={(e) => handleCellChange(index, 'playerName', e.target.value.toUpperCase())}
                      className="w-full py-1 px-1.5 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden font-semibold uppercase"
                    />
                  </td>

                  {/* MIN */}
                  <td className="py-1 px-1 text-center text-slate-600 dark:text-slate-400">
                    <input
                      type="text"
                      value={row.min}
                      onChange={(e) => handleCellChange(index, 'min', e.target.value)}
                      className="w-14 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>

                  {/* PTS */}
                  <td className="py-1 px-1 text-center font-bold text-slate-900 dark:text-white bg-slate-50/80 dark:bg-slate-900/60">
                    {row.pt}
                  </td>

                  {/* 2P Conv, Int, % */}
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.tc}
                      onChange={(e) => handleCellChange(index, 'tc', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.ti}
                      onChange={(e) => handleCellChange(index, 'ti', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden text-slate-500"
                    />
                  </td>
                  <td className="py-1 px-1 text-center text-slate-500 dark:text-slate-400 text-[10px]">
                    {row.tiPct}%
                  </td>

                  {/* 3P Conv, Int, % */}
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.c3p}
                      onChange={(e) => handleCellChange(index, 'c3p', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.i3p}
                      onChange={(e) => handleCellChange(index, 'i3p', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden text-slate-500"
                    />
                  </td>
                  <td className="py-1 px-1 text-center text-slate-500 dark:text-slate-400 text-[10px]">
                    {row.pct3p}%
                  </td>

                  {/* TL Conv, Int, % */}
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.tlc}
                      onChange={(e) => handleCellChange(index, 'tlc', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.tli}
                      onChange={(e) => handleCellChange(index, 'tli', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden text-slate-500"
                    />
                  </td>
                  <td className="py-1 px-1 text-center text-slate-500 dark:text-slate-400 text-[10px]">
                    {row.tlPct}%
                  </td>

                  {/* Rebotes DEF, OF, Tot */}
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.rd}
                      onChange={(e) => handleCellChange(index, 'rd', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden text-slate-600 dark:text-slate-400"
                    />
                  </td>
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.ro}
                      onChange={(e) => handleCellChange(index, 'ro', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden text-slate-600 dark:text-slate-400"
                    />
                  </td>
                  <td className="py-1 px-1 text-center font-bold text-slate-800 dark:text-slate-200">
                    {row.rt}
                  </td>

                  {/* AST, REC, PER, TAP */}
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.as}
                      onChange={(e) => handleCellChange(index, 'as', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.rec}
                      onChange={(e) => handleCellChange(index, 'rec', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.per}
                      onChange={(e) => handleCellChange(index, 'per', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden text-red-500"
                    />
                  </td>
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.tap}
                      onChange={(e) => handleCellChange(index, 'tap', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>

                  {/* FAL FC, FR */}
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.fpc}
                      onChange={(e) => handleCellChange(index, 'fpc', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>
                  <td className="py-1 px-0.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={row.fpr}
                      onChange={(e) => handleCellChange(index, 'fpr', e.target.value)}
                      className="w-9 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden"
                    />
                  </td>

                  {/* VAL */}
                  <td className="py-1 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    <input
                      type="number"
                      value={row.ptsTot}
                      onChange={(e) => handleCellChange(index, 'ptsTot', e.target.value)}
                      className="w-10 text-center py-1 rounded bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden font-bold"
                    />
                  </td>

                  {/* Eliminar fila */}
                  <td className="py-1 px-1 text-center">
                    <button
                      onClick={() => handleDeleteRow(index)}
                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Quitar jugador de la planilla"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totales Footer */}
            <tfoot className="bg-[#00205B] text-white font-mono text-[11px] font-bold border-t-2 border-blue-900">
              <tr>
                <td className="py-2.5 px-2 text-center text-blue-200">∑</td>
                <td className="py-2.5 px-3 uppercase tracking-wider font-bold">TOTALES SOMISA</td>
                <td className="py-2.5 px-2 text-center">{teamTotals.min}</td>
                <td className="py-2.5 px-2 text-center font-black bg-[#001744] text-amber-300 text-xs">{teamTotals.pt}</td>
                {/* 2P */}
                <td className="py-2.5 px-1 text-center">{teamTotals.tc}</td>
                <td className="py-2.5 px-1 text-center text-blue-200">{teamTotals.ti}</td>
                <td className="py-2.5 px-1 text-center text-emerald-300 text-[10px]">{teamTotals.tiPct}%</td>
                {/* 3P */}
                <td className="py-2.5 px-1 text-center">{teamTotals.c3p}</td>
                <td className="py-2.5 px-1 text-center text-blue-200">{teamTotals.i3p}</td>
                <td className="py-2.5 px-1 text-center text-emerald-300 text-[10px]">{teamTotals.pct3p}%</td>
                {/* TL */}
                <td className="py-2.5 px-1 text-center">{teamTotals.tlc}</td>
                <td className="py-2.5 px-1 text-center text-blue-200">{teamTotals.tli}</td>
                <td className="py-2.5 px-1 text-center text-emerald-300 text-[10px]">{teamTotals.tlPct}%</td>
                {/* REB */}
                <td className="py-2.5 px-1 text-center text-blue-200">{teamTotals.rd}</td>
                <td className="py-2.5 px-1 text-center text-blue-200">{teamTotals.ro}</td>
                <td className="py-2.5 px-1 text-center font-bold text-amber-300">{teamTotals.rt}</td>
                {/* AST, REC, PER, TAP */}
                <td className="py-2.5 px-1 text-center">{teamTotals.as}</td>
                <td className="py-2.5 px-1 text-center">{teamTotals.rec}</td>
                <td className="py-2.5 px-1 text-center text-red-300">{teamTotals.per}</td>
                <td className="py-2.5 px-1 text-center">{teamTotals.tap}</td>
                {/* FAL */}
                <td className="py-2.5 px-1 text-center">{teamTotals.fpc}</td>
                <td className="py-2.5 px-1 text-center">{teamTotals.fpr}</td>
                {/* VAL */}
                <td className="py-2.5 px-2 text-center text-emerald-400 font-black bg-emerald-950/60">{teamTotals.ptsTot}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Delete Match Modal */}
      {onDeleteGame && (
        <DeleteMatchModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          game={game}
          onConfirmDelete={onDeleteGame}
        />
      )}

      {/* Quick Paste Modal */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clipboard className="w-4 h-4 text-emerald-500" />
                Pegar Celdas desde Excel
              </h3>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Copia las celdas en tu Excel con Ctrl+C y pégalas aquí..."
              className="w-full h-40 p-3 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden"
            />

            {pasteStatus && (
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {pasteStatus}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPasteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleProcessPastedData}
                disabled={!pastedText.trim()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
