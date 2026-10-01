import React, { useState } from 'react';
import { Plus, Trash2, Clipboard, PlusCircle, ChevronDown, Users, CheckCircle2, Github, Shield } from 'lucide-react';
import { Game, ExcelRowStats } from '../types/basketball';
import { calculateRowMetrics, calculateTeamRowTotals } from '../utils/calculations';
import { DeleteMatchModal } from './DeleteMatchModal';

interface ExcelBoxScoreGridProps {
  game: Game;
  onUpdateGame: (updated: Partial<Game>) => void;
  allGames?: Game[];
  onSelectGame?: (gameId: string) => void;
  onOpenCreateMatchModal?: () => void;
  onOpenRosterModal?: () => void;
  onOpenGitHubModal?: () => void;
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

  // Paste from Excel parser
  const handleProcessPastedData = () => {
    if (!pastedText.trim()) return;

    try {
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
    } catch (e) {
      setPasteStatus('Error al procesar los datos pegados.');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Post-Game Match Header Card with Switcher and New Match Action */}
      <div className="bg-white dark:bg-[#0E1526] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="space-y-1.5 flex-1 min-w-[240px]">
            {/* Match selector dropdown if multiple games exist */}
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
              <span className="font-semibold text-[#00205B] dark:text-[#93C5FD]">{game.competition}</span>
              <span>·</span>
              <span>{game.date}</span>
              <span>·</span>
              <span>{game.homeAway === 'home' ? 'Local (Casa)' : 'Visitante (Fuera)'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#00205B] dark:text-white">
              {game.myTeamName} vs {game.opponentName}
            </h2>
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

          {/* Action Buttons: Dar de alta partido, Plantilla, Respaldo GitHub, Pegar, Agregar Jugador */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Botón Principal: Dar de alta partido */}
            {onOpenCreateMatchModal && (
              <button
                onClick={onOpenCreateMatchModal}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-[#00205B] hover:bg-[#001744] dark:bg-[#0A327E] dark:hover:bg-[#154294] text-white shadow-sm transition-all active:scale-[0.98]"
                title="Crear y registrar un nuevo partido en la temporada"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Dar de Alta Partido</span>
              </button>
            )}

            {/* Botón: Plantilla y Dorsales de SOMISA */}
            {onOpenRosterModal && (
              <button
                onClick={onOpenRosterModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-[#00205B] dark:text-[#93C5FD] transition-colors"
                title="Administrar plantilla de Club SOMISA, nombres y dorsales (#)"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Plantilla (#)</span>
              </button>
            )}

            {/* Botón: Guardado y Respaldo para GitHub */}
            {onOpenGitHubModal && (
              <button
                onClick={onOpenGitHubModal}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Exportar base de datos JSON o respaldar para GitHub"
              >
                <Github className="w-3.5 h-3.5" />
                <span>Respaldo GitHub</span>
              </button>
            )}

            <button
              onClick={() => setPasteModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 transition-colors"
              title="Pegar datos directamente copiados de Excel o Google Sheets"
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

            {/* Botón: Eliminar Partido */}
            {onDeleteGame && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-900 transition-colors"
                title="Eliminar este partido y sus datos"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Partido</span>
              </button>
            )}

            {/* Auto-save status reassurance */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-800 select-none">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Guardado auto.</span>
            </div>

          </div>

        </div>
      </div>

      {/* Main Excel-Style Spreadsheet Table */}
      <div className="w-full bg-white dark:bg-[#0E1526] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs select-none">
            <thead>
              {/* Excel Table Header matching image.png */}
              <tr className="bg-[#00205B] text-white dark:bg-[#071330] text-[11px] font-bold tracking-tight text-center">
                <th className="py-2.5 px-3 text-left whitespace-nowrap sticky left-0 z-20 bg-[#00205B] dark:bg-[#071330] min-w-[230px]">
                  # · JUGADOR
                </th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[60px]">Min.</th>
                
                {/* 2-Points */}
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px] bg-[#001b4d]">TC</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px] bg-[#001b4d]">TI</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[55px] bg-[#001b4d]">Ti%</th>
                
                {/* 3-Points */}
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">3PC</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">3PI</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[55px]">3P%</th>
                
                {/* 3PAr (Highlighted Red in user image) */}
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[60px] bg-red-600 text-white font-extrabold">
                  3PAr
                </th>
                
                {/* Free Throws */}
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px] bg-[#001b4d]">TLC</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px] bg-[#001b4d]">TLI</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[55px] bg-[#001b4d]">TL%</th>
                
                {/* Advanced Factors (Highlighted Green in user image) */}
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[60px] bg-emerald-700 text-white font-extrabold">
                  FTr
                </th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[60px] bg-emerald-700 text-white font-extrabold">
                  eFG%
                </th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[60px] bg-emerald-700 text-white font-extrabold">
                  TS%
                </th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[60px] bg-emerald-700 text-white font-extrabold">
                  ToV%
                </th>

                {/* Rebounds */}
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">RD</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">RO</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[50px] font-extrabold">RT</th>

                {/* Playmaking & Defense */}
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">AS</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">REC</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">PER</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">Tap</th>

                {/* Fouls */}
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">FPC</th>
                <th className="py-2.5 px-2 whitespace-nowrap min-w-[45px]">FPR</th>

                {/* Points & Pts Tot */}
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[55px] bg-[#001b4d] font-black text-amber-300">
                  Pt
                </th>
                <th className="py-2.5 px-2.5 whitespace-nowrap min-w-[65px] bg-[#001b4d] font-black text-amber-300">
                  Pts Tot
                </th>
                <th className="py-2.5 px-1.5 whitespace-nowrap w-8"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {game.rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors group"
                >
                  {/* Jugador (# and Name Editable) */}
                  <td className="py-1.5 px-2.5 sticky left-0 z-10 bg-white dark:bg-[#0E1526] font-semibold text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={row.playerNumber ?? ''}
                        placeholder="#"
                        onChange={(e) => handleCellChange(index, 'playerNumber', e.target.value)}
                        className="w-9 text-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-[#00205B] dark:text-[#93C5FD] font-mono font-black text-xs rounded py-0.5 focus:ring-1 focus:ring-[#00205B]"
                        title="Dorsal / Número de camiseta (#)"
                      />
                      <input
                        type="text"
                        value={row.playerName}
                        onChange={(e) => handleCellChange(index, 'playerName', e.target.value)}
                        className="flex-1 min-w-[130px] bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded px-1 py-0.5 font-bold uppercase text-xs truncate"
                        title="Nombre del jugador"
                      />
                    </div>
                  </td>

                  {/* Min. */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="text"
                      value={row.min}
                      onChange={(e) => handleCellChange(index, 'min', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* TC (2P Made) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.tc || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'tc', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono font-semibold"
                    />
                  </td>

                  {/* TI (2P Attempted) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.ti || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'ti', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* Ti% (Auto-Calculated) */}
                  <td className="py-1.5 px-2 text-center font-mono text-slate-600 dark:text-slate-300">
                    {row.ti > 0 ? `${row.tiPct.toFixed(2)}` : '0,00'}
                  </td>

                  {/* 3PC (3P Made) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.c3p || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'c3p', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono font-semibold"
                    />
                  </td>

                  {/* 3PI (3P Attempted) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.i3p || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'i3p', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* 3P% (Auto-Calculated) */}
                  <td className="py-1.5 px-2 text-center font-mono text-slate-600 dark:text-slate-300">
                    {row.i3p > 0 ? `${row.pct3p.toFixed(2)}` : '0,00'}
                  </td>

                  {/* 3PAr (Auto-Calculated) */}
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20">
                    {row.ti + row.i3p > 0 ? `${row.ar3p.toFixed(1)}` : '0,0'}
                  </td>

                  {/* TLC (FT Made) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.tlc || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'tlc', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono font-semibold"
                    />
                  </td>

                  {/* TLI (FT Attempted) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.tli || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'tli', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* TL% (Auto-Calculated) */}
                  <td className="py-1.5 px-2 text-center font-mono text-slate-600 dark:text-slate-300">
                    {row.tli > 0 ? `${row.tlPct.toFixed(2)}` : '0,00'}
                  </td>

                  {/* FTr (Auto-Calculated) */}
                  <td className="py-1.5 px-2 text-center font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                    {row.ti + row.i3p > 0 ? `${row.ftr.toFixed(2)}` : '0,00'}
                  </td>

                  {/* eFG% (Auto-Calculated) */}
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                    {row.ti + row.i3p > 0 ? `${row.efgPct.toFixed(2)}` : '0,00'}
                  </td>

                  {/* TS% (Auto-Calculated) */}
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                    {row.tsPct > 0 ? `${row.tsPct.toFixed(2)}` : '0,00'}
                  </td>

                  {/* ToV% (Auto-Calculated) */}
                  <td className="py-1.5 px-2 text-center font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20">
                    {row.tovPct > 0 ? `${row.tovPct.toFixed(2)}` : '0,00'}
                  </td>

                  {/* RD (Defensive Rebound) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.rd || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'rd', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* RO (Offensive Rebound) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.ro || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'ro', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* RT (Total Rebound = RD + RO) */}
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-900 dark:text-white">
                    {row.rt}
                  </td>

                  {/* AS (Assists) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.as || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'as', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono font-semibold"
                    />
                  </td>

                  {/* REC (Steals / Recuperos) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.rec || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'rec', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* PER (Turnovers / Perdidas) */}
                  <td className="py-1.5 px-1 text-center font-mono text-red-600">
                    <input
                      type="number"
                      min="0"
                      value={row.per || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'per', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono text-red-600 dark:text-red-400"
                    />
                  </td>

                  {/* Tap (Blocks / Tapones) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.tap || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'tap', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* FPC (Fouls Committed) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.fpc || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'fpc', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* FPR (Fouls Received) */}
                  <td className="py-1.5 px-1 text-center font-mono">
                    <input
                      type="number"
                      min="0"
                      value={row.fpr || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'fpr', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono"
                    />
                  </td>

                  {/* Pt (Points Scored Auto) */}
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-sm text-[#00205B] dark:text-[#93C5FD] bg-blue-50/50 dark:bg-blue-950/30">
                    {row.pt}
                  </td>

                  {/* Pts Tot (Valoración Total) */}
                  <td className="py-1.5 px-2 text-center font-mono font-black text-sm text-slate-900 dark:text-white bg-blue-50/30 dark:bg-blue-950/20">
                    <input
                      type="number"
                      value={row.ptsTot || ''}
                      placeholder="0"
                      onChange={(e) => handleCellChange(index, 'ptsTot', e.target.value)}
                      className="w-full text-center bg-transparent focus:bg-white dark:focus:bg-slate-800 border-none focus:ring-1 focus:ring-[#00205B] rounded py-0.5 text-xs font-mono font-bold"
                    />
                  </td>

                  {/* Row Delete Button */}
                  <td className="py-1.5 px-1 text-center">
                    <button
                      onClick={() => handleDeleteRow(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-opacity"
                      title="Eliminar fila"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* ========================================================= */}
              {/* TOTALS ROW (Exact matching Totales from image.png) */}
              {/* ========================================================= */}
              <tr className="bg-[#00205B] text-white dark:bg-[#071330] font-black text-xs border-t-2 border-slate-300 dark:border-slate-700 text-center">
                <td className="py-3 px-3 text-left sticky left-0 z-10 bg-[#00205B] dark:bg-[#071330] uppercase tracking-wider text-xs border-r border-blue-900">
                  Totales
                </td>
                <td className="py-3 px-2 font-mono">{teamTotals.min}</td>
                <td className="py-3 px-2 font-mono">{teamTotals.tc},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.ti},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.tiPct.toFixed(2)}%</td>
                <td className="py-3 px-2 font-mono">{teamTotals.c3p},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.i3p},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.pct3p.toFixed(2)}%</td>
                <td className="py-3 px-2 font-mono bg-red-600 text-white font-extrabold">{teamTotals.ar3p.toFixed(1)}%</td>
                <td className="py-3 px-2 font-mono">{teamTotals.tlc},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.tli},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.tlPct.toFixed(2)}%</td>
                <td className="py-3 px-2 font-mono bg-emerald-700 text-white font-extrabold">{teamTotals.ftr.toFixed(2)}%</td>
                <td className="py-3 px-2 font-mono bg-emerald-700 text-white font-extrabold">{teamTotals.efgPct.toFixed(2)}%</td>
                <td className="py-3 px-2 font-mono bg-emerald-700 text-white font-extrabold">{teamTotals.tsPct.toFixed(2)}%</td>
                <td className="py-3 px-2 font-mono bg-emerald-700 text-white font-extrabold">{teamTotals.tovPct.toFixed(2)}%</td>
                <td className="py-3 px-2 font-mono">{teamTotals.rd},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.ro},00</td>
                <td className="py-3 px-2 font-mono font-extrabold">{teamTotals.rt},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.as},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.rec},00</td>
                <td className="py-3 px-2 font-mono text-red-300">{teamTotals.per},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.tap},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.fpc},00</td>
                <td className="py-3 px-2 font-mono">{teamTotals.fpr},00</td>
                <td className="py-3 px-2.5 font-mono text-sm font-black text-amber-300">{teamTotals.pt},00</td>
                <td className="py-3 px-2.5 font-mono text-sm font-black text-amber-300">{teamTotals.ptsTot},00</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>Haz clic en cualquier número para editarlo directamente. Todos los porcentajes y totales se recalculan en tiempo real.</span>
        <span>Club SOMISA · 3PAr en Rojo · Factores de Dean Oliver en Verde</span>
      </div>

      {/* Modal: Paste from Excel */}
      {pasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-[#0E1526] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-[#00205B] dark:text-[#93C5FD]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Pegar datos directamente desde Excel
                </h3>
              </div>
              <button
                onClick={() => setPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Copia las celdas de tu hoja de Excel o Google Sheets (desde la columna Jugador hasta Pts Tot) y pégalas aquí con <strong>Ctrl + V</strong>:
            </p>

            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Pega aquí los datos copiados de Excel (filas separadas por tabulación)..."
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-1 focus:ring-[#00205B]"
            />

            {pasteStatus && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 text-xs rounded-lg text-blue-900 dark:text-blue-200 font-medium">
                {pasteStatus}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPasteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessPastedData}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-[#00205B] hover:bg-[#001744] text-white"
              >
                Cargar en la Planilla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Match Modal */}
      {onDeleteGame && (
        <DeleteMatchModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          game={game}
          onConfirmDelete={onDeleteGame}
          isLastGame={allGames.length <= 1}
        />
      )}

    </div>
  );
};
