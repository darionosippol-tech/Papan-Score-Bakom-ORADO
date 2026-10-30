/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DominoTile, PlayerId, TeamId } from '../types/orado';
import confetti from 'canvas-confetti';
import {
  Trophy,
  RotateCcw,
  Plus,
  Minus,
  Sparkles,
  AlertTriangle,
  Check,
  X,
  Edit2,
  Trash2,
  Zap,
  Info,
  Eye,
  Volume2,
  Lock
} from 'lucide-react';
import { playVictorySound } from '../utils/audio';

export interface SimpleRoundEntry {
  id: number;
  balakNumber: number; // 0..6
  cycle: 1 | 2;
  scoreBiru: number | null;
  scoreMerah: number | null;
  winner: 'BIRU' | 'MERAH' | null;
  note?: string;
  isTwoEndsBonus?: boolean;
  isBalakBonus?: boolean;
  isPenalty?: boolean;
}

interface SimpleScoreBoardProps {
  teamAName?: string; // TIM BIRU
  teamBName?: string; // TIM MERAH
  setBiru: number;
  setMerah: number;
  canEdit?: boolean;
  externalRows?: SimpleRoundEntry[];
  onUpdateSets: (biru: number, merah: number) => void;
  onRoundSaved?: (entry: SimpleRoundEntry, totalBiru: number, totalMerah: number, allRows: SimpleRoundEntry[]) => void;
  onResetBoard?: () => void;
  onOpenAdvancedEngine?: () => void;
}

const DEFAULT_ROWS: SimpleRoundEntry[] = [
  { id: 1, balakNumber: 0, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 2, balakNumber: 1, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 3, balakNumber: 2, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 4, balakNumber: 3, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 5, balakNumber: 4, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 6, balakNumber: 5, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 7, balakNumber: 6, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 8, balakNumber: 0, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 9, balakNumber: 1, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 10, balakNumber: 2, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 11, balakNumber: 3, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 12, balakNumber: 4, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 13, balakNumber: 5, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
  { id: 14, balakNumber: 6, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
];

export const SimpleScoreBoard: React.FC<SimpleScoreBoardProps> = ({
  teamAName = 'TIM BIRU',
  teamBName = 'TIM MERAH',
  setBiru,
  setMerah,
  canEdit = true,
  externalRows,
  onUpdateSets,
  onRoundSaved,
  onResetBoard,
  onOpenAdvancedEngine,
}) => {
  const [rows, setRows] = useState<SimpleRoundEntry[]>(externalRows || DEFAULT_ROWS);
  const [activeRowIndex, setActiveRowIndex] = useState<number>(0);
  const [editingRow, setEditingRow] = useState<SimpleRoundEntry | null>(null);

  // Sync with external updates from WebSocket
  useEffect(() => {
    if (externalRows && externalRows.length > 0) {
      setRows(externalRows);
    }
  }, [externalRows]);

  // Watermark background opacity state (default 5% per user request)
  const [bgOpacity, setBgOpacity] = useState<number>(0.05);

  // Quick modal input state
  const [inputWinner, setInputWinner] = useState<'BIRU' | 'MERAH'>('BIRU');
  const [inputPoints, setInputPoints] = useState<number>(0);
  const [inputNotes, setInputNotes] = useState<string>('');
  const [isTwoEnds, setIsTwoEnds] = useState<boolean>(false);
  const [isBalak, setIsBalak] = useState<boolean>(false);
  const [isPenalty, setIsPenalty] = useState<boolean>(false);

  // Calculate totals
  const totalBiru = rows.reduce((sum, r) => sum + (r.scoreBiru || 0), 0);
  const totalMerah = rows.reduce((sum, r) => sum + (r.scoreMerah || 0), 0);

  // Active balak number to show in bottom box
  const activeBalakNumber = rows[activeRowIndex]?.balakNumber ?? 0;

  // Check 101 win
  const hasWonSet = totalBiru >= 101 || totalMerah >= 101;
  const isApollo = (totalBiru >= 101 && totalMerah === 0) || (totalMerah >= 101 && totalBiru === 0);

  const [hasPlayed101Sound, setHasPlayed101Sound] = useState(false);

  useEffect(() => {
    if (hasWonSet && !hasPlayed101Sound) {
      setHasPlayed101Sound(true);
      playVictorySound();
    } else if (!hasWonSet && hasPlayed101Sound) {
      setHasPlayed101Sound(false);
    }
  }, [hasWonSet, hasPlayed101Sound]);

  const openScoringModal = (row: SimpleRoundEntry, index: number) => {
    if (!canEdit) return;
    setActiveRowIndex(index);
    setEditingRow(row);
    // Determine initial values
    if (row.winner) {
      setInputWinner(row.winner);
      setInputPoints(row.winner === 'BIRU' ? (row.scoreBiru || 0) : (row.scoreMerah || 0));
    } else {
      setInputWinner('BIRU');
      setInputPoints(0);
    }
    setInputNotes(row.note || '');
    setIsTwoEnds(!!row.isTwoEndsBonus);
    setIsBalak(!!row.isBalakBonus);
    setIsPenalty(!!row.isPenalty);
  };

  const saveRoundScore = () => {
    if (!editingRow) return;

    const finalPoints = Math.max(0, inputPoints);
    const updatedRows = rows.map((r) => {
      if (r.id === editingRow.id) {
        return {
          ...r,
          winner: finalPoints > 0 ? inputWinner : null,
          scoreBiru: inputWinner === 'BIRU' && finalPoints > 0 ? finalPoints : null,
          scoreMerah: inputWinner === 'MERAH' && finalPoints > 0 ? finalPoints : null,
          note: inputNotes,
          isTwoEndsBonus: isTwoEnds,
          isBalakBonus: isBalak,
          isPenalty: isPenalty,
        };
      }
      return r;
    });

    setRows(updatedRows);

    const newTotalBiru = updatedRows.reduce((sum, r) => sum + (r.scoreBiru || 0), 0);
    const newTotalMerah = updatedRows.reduce((sum, r) => sum + (r.scoreMerah || 0), 0);

    // Trigger confetti & victory sound if someone reaches 101
    if (newTotalBiru >= 101 || newTotalMerah >= 101) {
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}
      playVictorySound();
    }

    if (onRoundSaved) {
      const savedEntry = updatedRows.find((r) => r.id === editingRow.id)!;
      onRoundSaved(savedEntry, newTotalBiru, newTotalMerah, updatedRows);
    }

    // Move active cursor to next row if possible
    if (activeRowIndex < rows.length - 1) {
      setActiveRowIndex(activeRowIndex + 1);
    }

    setEditingRow(null);
  };

  const clearRowScore = (rowId: number) => {
    const updatedRows = rows.map((r) => {
      if (r.id === rowId) {
        return {
          ...r,
          winner: null,
          scoreBiru: null,
          scoreMerah: null,
          note: undefined,
          isTwoEndsBonus: false,
          isBalakBonus: false,
          isPenalty: false,
        };
      }
      return r;
    });
    setRows(updatedRows);
    setEditingRow(null);
  };

  const handleReset = () => {
    if (!canEdit) return;
    setRows(DEFAULT_ROWS.map(r => ({ ...r, scoreBiru: null, scoreMerah: null, winner: null })));
    setActiveRowIndex(0);
    if (onResetBoard) onResetBoard();
  };

  const handleFinishSet = (winnerTeam: 'BIRU' | 'MERAH') => {
    if (!canEdit) return;
    if (winnerTeam === 'BIRU') {
      onUpdateSets(setBiru + (isApollo ? 2 : 1), setMerah);
    } else {
      onUpdateSets(setBiru, setMerah + (isApollo ? 2 : 1));
    }
    // Clear rows for next set
    setRows(DEFAULT_ROWS.map(r => ({ ...r, scoreBiru: null, scoreMerah: null, winner: null })));
    setActiveRowIndex(0);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto select-none font-sans p-2">
      {/* Top Controls Bar */}
      <div className="w-full flex flex-wrap items-center justify-between mb-2 px-1 text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-amber-400 bg-stone-900 border border-stone-800 px-3 py-1 rounded-full uppercase tracking-wider text-[11px]">
            Papan Skor ORADO 101
          </span>
          <span className="text-stone-400 font-mono text-[11px]">
            Target: 101 Poin
          </span>

          {!canEdit && (
            <span className="flex items-center gap-1 bg-rose-950/80 border border-rose-800 text-rose-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              <Lock className="w-3 h-3 text-rose-400" />
              <span>Terkunci (Hanya Wasit & Host)</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => playVictorySound()}
            className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-amber-300 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
            title="Dengarkan efek suara kemenangan resmi"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Tes Suara</span>
          </button>

          <button
            type="button"
            onClick={() => setBgOpacity((prev) => (prev <= 0.05 ? 0.10 : prev <= 0.10 ? 0.15 : 0.05))}
            className="flex items-center gap-1.5 bg-stone-900 border border-stone-800 hover:border-amber-400/50 text-stone-300 hover:text-amber-400 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
            title="Klik untuk mengatur kejelasan background watermark"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Background: {Math.round(bgOpacity * 100)}%</span>
          </button>

          {canEdit && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 text-stone-300 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
              title="Reset Papan Skor (Hanya Wasit & Host)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Target 101 Alert with Reset Game Button */}
      {hasWonSet && (
        <div className="w-full mb-3 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-stone-950 p-3.5 rounded-2xl shadow-xl animate-pulse flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-white">
            <Trophy className="w-6 h-6 text-amber-200 shrink-0" />
            <div>
              <div className="font-black text-sm text-white">
                🎉 TARGET 101 TERCAPAI! PEMENANG: TIM {totalBiru >= 101 ? 'BIRU' : 'MERAH'} ({totalBiru} vs {totalMerah})
              </div>
              {isApollo ? (
                <div className="text-amber-200 font-bold text-[11px]">
                  🔥 KONDISI APOLLO TERCAPAI (101 vs 0)! Kemenangan 2 Set Langsung!
                </div>
              ) : (
                <div className="text-stone-200 text-[11px]">
                  Game 101 selesai. Anda dapat klaim set atau mereset game jika perlu pengulangan.
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tombol Putar Suara Kemenangan */}
            <button
              type="button"
              onClick={() => playVictorySound()}
              className="flex items-center gap-1.5 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-400/70 px-3 py-2 rounded-xl font-black text-xs cursor-pointer shadow-md transition-transform active:scale-95"
              title="Dengarkan efek suara kemenangan resmi terbaru"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Suara Kemenangan</span>
            </button>

            {/* Tombol Reset Game untuk pengulangan */}
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 bg-stone-950 hover:bg-stone-900 text-rose-300 border border-rose-800/80 px-3.5 py-2 rounded-xl font-black text-xs cursor-pointer shadow-md transition-transform active:scale-95"
              title="Ulangi game ini dan kosongkan semua baris ronde"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>Ulangi Game (Reset)</span>
            </button>

            {/* Tombol Klaim Set & Lanjut */}
            <button
              type="button"
              onClick={() => handleFinishSet(totalBiru >= 101 ? 'BIRU' : 'MERAH')}
              className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 px-4 py-2 rounded-xl font-black text-xs cursor-pointer shadow-md transition-transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Klaim Set & Lanjut</span>
            </button>
          </div>
        </div>
      )}

      {/* THE ICONIC SCOREBOARD CONTAINER (Exact Replica of Reference) */}
      <div className="w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-stone-700 bg-stone-900 flex flex-col relative">
        {/* Logo Baru (Transparent PNG tanpa background) sebagai Watermark Papan Tabel ORADO */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 overflow-hidden">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-10-29_at_11.30.18-removebg-preview_755d6aba.png"
            alt="Bakom Domino Club Logo Background"
            style={{ opacity: bgOpacity }}
            className="w-[88%] max-w-[440px] object-contain filter drop-shadow-2xl select-none transition-opacity duration-200"
          />
        </div>

        {/* Top Sets Header: "0" (Biru Sets) vs "2" (Merah Sets) */}
        <div className="w-full grid grid-cols-12 bg-stone-900 text-white font-mono font-bold text-center border-b border-stone-800">
          <div className="col-span-3 bg-stone-900 py-1.5 text-xs text-stone-400">
            {/* blank / balak header space */}
          </div>
          <div className="col-span-4 bg-stone-900 py-1 text-2xl font-black text-white flex items-center justify-center gap-2">
            <span>{setBiru}</span>
            <div className="flex flex-col text-[10px] text-stone-500">
              <button
                onClick={() => onUpdateSets(Math.max(0, setBiru + 1), setMerah)}
                className="hover:text-blue-400 px-1 font-bold"
                title="+1 Set Biru"
              >
                +
              </button>
              <button
                onClick={() => onUpdateSets(Math.max(0, setBiru - 1), setMerah)}
                className="hover:text-blue-400 px-1 font-bold"
                title="-1 Set Biru"
              >
                -
              </button>
            </div>
          </div>
          <div className="col-span-1 bg-stone-900 text-xs text-stone-600 flex items-center justify-center">
            {/* spacer */}
          </div>
          <div className="col-span-4 bg-stone-900 py-1 text-2xl font-black text-white flex items-center justify-center gap-2">
            <span>{setMerah}</span>
            <div className="flex flex-col text-[10px] text-stone-500">
              <button
                onClick={() => onUpdateSets(setBiru, Math.max(0, setMerah + 1))}
                className="hover:text-red-400 px-1 font-bold"
                title="+1 Set Merah"
              >
                +
              </button>
              <button
                onClick={() => onUpdateSets(setBiru, Math.max(0, setMerah - 1))}
                className="hover:text-red-400 px-1 font-bold"
                title="-1 Set Merah"
              >
                -
              </button>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="w-full grid grid-cols-12 text-center text-xs font-black uppercase tracking-wider border-b-2 border-stone-800">
          {/* BALAK (GAME) Header */}
          <div className="col-span-3 bg-[#F8EED8] text-stone-900 py-3 flex flex-col justify-center items-center border-r-2 border-stone-800">
            <span className="text-[11px] font-black leading-tight">BALAK</span>
            <span className="text-[9px] font-extrabold text-stone-700 leading-tight">(GAME)</span>
          </div>

          {/* BIRU Header */}
          <div className="col-span-4 bg-[#1E75C8] text-white py-2.5 flex flex-col justify-center items-center border-r-2 border-stone-800">
            <span className="text-[10px] font-bold tracking-normal opacity-90 leading-tight">point team</span>
            <span className="text-xl md:text-2xl font-black tracking-tight leading-none mt-0.5">{teamAName}</span>
          </div>

          {/* VS Header */}
          <div className="col-span-1 bg-[#4A4D52] text-white py-2 flex items-center justify-center font-black text-xs border-r-2 border-stone-800">
            VS
          </div>

          {/* MERAH Header */}
          <div className="col-span-4 bg-[#EA1D24] text-white py-2.5 flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold tracking-normal opacity-90 leading-tight">point team</span>
            <span className="text-xl md:text-2xl font-black tracking-tight leading-none mt-0.5">{teamBName}</span>
          </div>
        </div>

        {/* 14 Scoring Rows (0 to 6, then 0 to 6) */}
        <div className="w-full flex flex-col divide-y divide-stone-800">
          {rows.map((row, index) => {
            const isBiruScored = row.scoreBiru !== null && row.scoreBiru > 0;
            const isMerahScored = row.scoreMerah !== null && row.scoreMerah > 0;
            const isActive = activeRowIndex === index;

            return (
              <div
                key={row.id}
                onClick={() => openScoringModal(row, index)}
                className={`w-full grid grid-cols-12 text-center items-center cursor-pointer transition-all ${
                  isActive ? 'ring-2 ring-amber-400 z-10' : 'hover:opacity-95'
                }`}
                style={{ height: '36px' }}
                title={`Klik untuk mengisi skor Balak ${row.balakNumber} (Ronde ${row.id})`}
              >
                {/* Balak Number (Beige Column) */}
                <div className="col-span-3 bg-[#F8EED8] text-stone-900 font-extrabold text-sm h-full flex items-center justify-center border-r-2 border-stone-800">
                  {row.balakNumber}
                </div>

                {/* Biru Point Cell */}
                <div className="col-span-4 bg-[#1E75C8] text-white font-mono font-black text-base h-full flex items-center justify-center border-r-2 border-stone-800 relative z-10">
                  <div className="relative z-40 flex items-center gap-1">
                    {isBiruScored ? (
                      <>
                        <span className="drop-shadow-md">{row.scoreBiru}</span>
                        {row.isTwoEndsBonus && <span className="text-[8px] bg-amber-400 text-stone-950 font-bold px-1 rounded-sm shadow">2U</span>}
                        {row.isBalakBonus && <span className="text-[8px] bg-amber-300 text-stone-950 font-bold px-1 rounded-sm shadow">B50</span>}
                        {row.isPenalty && <span className="text-[8px] bg-rose-300 text-stone-950 font-bold px-1 rounded-sm shadow">P</span>}
                      </>
                    ) : (
                      <span className="text-blue-200/40 text-xs font-bold">-</span>
                    )}
                  </div>
                </div>

                {/* VS Divider Cell */}
                <div className="col-span-1 bg-[#4A4D52] text-stone-300 font-bold text-xs h-full flex items-center justify-center border-r-2 border-stone-800 relative z-10">
                  <span className="relative z-40">-</span>
                </div>

                {/* Merah Point Cell */}
                <div className="col-span-4 bg-[#EA1D24] text-white font-mono font-black text-base h-full flex items-center justify-center relative z-10">
                  <div className="relative z-40 flex items-center gap-1">
                    {isMerahScored ? (
                      <>
                        <span className="drop-shadow-md">{row.scoreMerah}</span>
                        {row.isTwoEndsBonus && <span className="text-[8px] bg-amber-400 text-stone-950 font-bold px-1 rounded-sm shadow">2U</span>}
                        {row.isBalakBonus && <span className="text-[8px] bg-amber-300 text-stone-950 font-bold px-1 rounded-sm shadow">B50</span>}
                        {row.isPenalty && <span className="text-[8px] bg-rose-300 text-stone-950 font-bold px-1 rounded-sm shadow">P</span>}
                      </>
                    ) : (
                      <span className="text-red-200/40 text-xs font-bold">-</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Big Totals Section */}
        <div className="w-full grid grid-cols-12 relative border-t-2 border-stone-800 min-h-[140px] z-10">
          {/* Left Side spacer under Balak column */}
          <div className="col-span-3 bg-[#F48B00] border-r-2 border-stone-800">
            {/* Orange background extending down left side */}
          </div>

          {/* BIRU Total Big Score */}
          <div className="col-span-4 bg-[#1E75C8] flex items-center justify-center text-white font-mono font-black text-7xl md:text-8xl py-4 border-r-2 border-stone-800 relative">
            <span className="relative z-40 drop-shadow-xl">{totalBiru}</span>
          </div>

          {/* Center divider area between BIRU and MERAH */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20">
            {/* Subtle dividing line / VS badge if needed */}
          </div>

          {/* MERAH Total Big Score */}
          <div className="col-span-5 bg-[#EA1D24] flex items-center justify-center text-white font-mono font-black text-7xl md:text-8xl py-4 relative">
            <span className="relative z-40 drop-shadow-xl">{totalMerah}</span>
          </div>
        </div>

        {/* Very Bottom Orange Footer: "BALAK" and Active Balak Number */}
        <div className="w-full bg-[#F48B00] text-stone-950 border-t-2 border-stone-800 py-2.5 flex flex-col items-center justify-center">
          <div className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-stone-900 leading-tight">
            BALAK
          </div>
          <div className="text-4xl md:text-5xl font-mono font-black text-stone-950 leading-none mt-1">
            {activeBalakNumber}
          </div>
          <div className="text-[10px] font-bold text-stone-800 mt-1">
            Game aktif saat ini: Ronde {activeRowIndex + 1} (Balak {activeBalakNumber})
          </div>
        </div>
      </div>

      {/* QUICK SCORING MODAL (Opens when clicking any row) */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-md p-5 text-stone-100 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div>
                <h4 className="text-base font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Isi Poin Ronde {editingRow.id} (Balak {editingRow.balakNumber})</span>
                </h4>
                <p className="text-xs text-stone-400">
                  Pilih tim pemenang dan masukkan jumlah poin ronde.
                </p>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Winner Team Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                Tim Penerima Poin:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInputWinner('BIRU')}
                  className={`py-3 rounded-2xl font-black text-sm transition-all border cursor-pointer ${
                    inputWinner === 'BIRU'
                      ? 'bg-[#1E75C8] text-white border-blue-400 ring-2 ring-blue-400 shadow-lg scale-102'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-800'
                  }`}
                >
                  TIM BIRU
                </button>
                <button
                  type="button"
                  onClick={() => setInputWinner('MERAH')}
                  className={`py-3 rounded-2xl font-black text-sm transition-all border cursor-pointer ${
                    inputWinner === 'MERAH'
                      ? 'bg-[#EA1D24] text-white border-red-400 ring-2 ring-red-400 shadow-lg scale-102'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:bg-stone-800'
                  }`}
                >
                  TIM MERAH
                </button>
              </div>
            </div>

            {/* Numeric Input & Quick Preset Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
                  Jumlah Poin Ronde:
                </label>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  {inputPoints} Poin
                </span>
              </div>

              {/* Big Number Input */}
              <input
                type="number"
                min="0"
                max="200"
                value={inputPoints === 0 ? '' : inputPoints}
                placeholder="0"
                onChange={(e) => setInputPoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full bg-stone-950 border border-stone-700 rounded-2xl py-3 text-center text-3xl font-mono font-black text-white focus:border-amber-400 focus:outline-hidden"
              />

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-5 gap-1.5 pt-1">
                {[5, 10, 11, 20, 40].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setInputPoints(val)}
                    className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs py-2 rounded-xl font-mono font-bold transition-colors cursor-pointer"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              {/* ORADO Special Presets */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setInputPoints(11);
                    setIsPenalty(true);
                  }}
                  className="bg-stone-800 hover:bg-stone-700 text-rose-300 text-[11px] py-1.5 rounded-xl font-bold border border-rose-900/60"
                >
                  Penalti 11 pt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputPoints(40);
                    setIsTwoEnds(true);
                  }}
                  className="bg-stone-800 hover:bg-stone-700 text-amber-300 text-[11px] py-1.5 rounded-xl font-bold border border-amber-900/60"
                >
                  2 Ujung (2x)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputPoints(50);
                    setIsBalak(true);
                  }}
                  className="bg-stone-800 hover:bg-stone-700 text-emerald-300 text-[11px] py-1.5 rounded-xl font-bold border border-emerald-900/60"
                >
                  Balak (+50)
                </button>
              </div>
            </div>

            {/* Special Badges Checkboxes */}
            <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isTwoEnds}
                  onChange={(e) => setIsTwoEnds(e.target.checked)}
                  className="rounded-sm border-stone-700 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-stone-300">Bonus Dua Ujung Cocok (Pasal 12)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBalak}
                  onChange={(e) => setIsBalak(e.target.checked)}
                  className="rounded-sm border-stone-700 text-amber-500 focus:ring-amber-400"
                />
                <span className="text-stone-300">Bonus Balak Dua Ujung (Pasal 13)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPenalty}
                  onChange={(e) => setIsPenalty(e.target.checked)}
                  className="rounded-sm border-stone-700 text-rose-500 focus:ring-rose-400"
                />
                <span className="text-stone-300">Poin Berasal dari Penalti / Pelanggaran Lawan</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => clearRowScore(editingRow.id)}
                className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 px-3 py-2 rounded-xl hover:bg-rose-950/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Ronde</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-3.5 py-2 text-xs text-stone-400 hover:text-stone-200"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={saveRoundScore}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-5 py-2 rounded-xl text-xs shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Skor</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
