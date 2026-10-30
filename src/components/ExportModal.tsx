/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ConfirmedRound, MatchConfig, MatchIdentity, MatchState } from '../types/orado';
import { Download, Printer, X, FileSpreadsheet, FileCode, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchState: MatchState;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, matchState }) => {
  if (!isOpen) return null;

  const { identity, config, roundHistory, scoreA, scoreB, setsWonA, setsWonB, currentSet, isMatchCompleted, winner } = matchState;

  // Generate CSV data
  const handleExportCSV = () => {
    const headers = [
      'Set',
      'Ronde',
      'Jenis Hasil',
      'Pemenang Ronde',
      'Pemain Penutup',
      'Sisa Titik A',
      'Sisa Titik B',
      `Poin ${identity.teamAName}`,
      `Poin ${identity.teamBName}`,
      `Skor Akhir ${identity.teamAName}`,
      `Skor Akhir ${identity.teamBName}`,
      'Bonus 2 Ujung',
      'Balak',
      'Apollo',
      'Operator',
      'Waktu'
    ];

    const rows = roundHistory.map((r) => [
      r.setNumber,
      r.roundNumber,
      r.inputSnapshot.resultType,
      r.calculation.winnerTeam || 'N/A',
      r.calculation.winnerPlayer || 'N/A',
      r.calculation.totalRemainingA,
      r.calculation.totalRemainingB,
      r.calculation.totalRoundPointsA,
      r.calculation.totalRoundPointsB,
      r.calculation.scoreAfterA,
      r.calculation.scoreAfterB,
      r.inputSnapshot.bothEndsMatched ? 'Ya' : 'Tidak',
      r.inputSnapshot.isBalak ? 'Ya' : 'Tidak',
      r.calculation.isApollo ? 'Ya' : 'Tidak',
      `"${r.operatorName}"`,
      `"${r.timestamp}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ORADO_Match_${identity.matchNumber || '101'}_Rekap.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate JSON Export
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(matchState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ORADO_Match_${identity.matchNumber || '101'}_Backup.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Print Match Sheet
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div>
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-400" />
              <span>Ekspor Rekap Pertandingan & Berita Acara ORADO 101</span>
            </h3>
            <p className="text-xs text-stone-400">
              Unduh rekap skor resmi dalam format CSV, berkas arsip JSON, atau cetak lembar berita acara pertandingan.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Match Summary Preview */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2 text-xs">
            <div className="flex justify-between font-bold text-stone-200">
              <span>{identity.tournamentName} — Meja {identity.tableNumber}</span>
              <span>No. Pertandingan: {identity.matchNumber}</span>
            </div>
            <div className="text-stone-400">
              Format: {config.matchFormat.toUpperCase()} • Target Set: {config.targetSetPoints} Poin
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
              <div className="bg-stone-900 p-2.5 rounded-xl border border-blue-900/40">
                <div className="font-bold text-blue-300">{identity.teamAName} (Tim A)</div>
                <div className="text-lg font-black text-white">{scoreA} Poin ({setsWonA} Set)</div>
                <div className="text-[11px] text-stone-400">{identity.playerNames.A1} & {identity.playerNames.A2}</div>
              </div>
              <div className="bg-stone-900 p-2.5 rounded-xl border border-emerald-900/40">
                <div className="font-bold text-emerald-300">{identity.teamBName} (Tim B)</div>
                <div className="text-lg font-black text-white">{scoreB} Poin ({setsWonB} Set)</div>
                <div className="text-[11px] text-stone-400">{identity.playerNames.B1} & {identity.playerNames.B2}</div>
              </div>
            </div>
            <div className="text-[11px] text-stone-400 pt-1">
              Total Ronde Selesai: {roundHistory.length} ronde
            </div>
          </div>

          {/* Export Options Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={handleExportCSV}
              className="flex flex-col items-center justify-center p-4 bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-emerald-600 rounded-2xl transition-all cursor-pointer text-center group"
            >
              <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-stone-200">Unduh Rekap CSV</div>
              <div className="text-[10px] text-stone-400 mt-1">Kompatibel Excel & Spreadsheet</div>
            </button>

            <button
              onClick={handleExportJSON}
              className="flex flex-col items-center justify-center p-4 bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-blue-600 rounded-2xl transition-all cursor-pointer text-center group"
            >
              <FileCode className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-stone-200">Cadangan JSON</div>
              <div className="text-[10px] text-stone-400 mt-1">Data lengkap & audit trail</div>
            </button>

            <button
              onClick={handlePrint}
              className="flex flex-col items-center justify-center p-4 bg-stone-950/70 hover:bg-stone-800 border border-stone-800 hover:border-amber-600 rounded-2xl transition-all cursor-pointer text-center group"
            >
              <Printer className="w-8 h-8 text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-bold text-xs text-stone-200">Cetak Berita Acara</div>
              <div className="text-[10px] text-stone-400 mt-1">Format cetak / PDF resmi</div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
