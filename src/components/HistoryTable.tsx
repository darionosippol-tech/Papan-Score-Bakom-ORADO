/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ConfirmedRound, MatchIdentity, TeamId } from '../types/orado';
import { CalculationBreakdownPanel } from './CalculationBreakdownPanel';
import {
  FileText,
  Edit3,
  Trash2,
  Eye,
  X,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  History
} from 'lucide-react';

interface HistoryTableProps {
  history: ConfirmedRound[];
  identity: MatchIdentity;
  operatorName: string;
  onEditRoundScore: (roundId: string, newScoreA: number, newScoreB: number, reason: string, refereeName: string) => void;
  onDeleteRound: (roundId: string, reason: string, refereeName: string) => void;
}

export const HistoryTable: React.FC<HistoryTableProps> = ({
  history,
  identity,
  operatorName,
  onEditRoundScore,
  onDeleteRound,
}) => {
  const [selectedRound, setSelectedRound] = useState<ConfirmedRound | null>(null);
  const [editingRound, setEditingRound] = useState<ConfirmedRound | null>(null);
  const [editScoreA, setEditScoreA] = useState<number>(0);
  const [editScoreB, setEditScoreB] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>('');
  const [editReferee, setEditReferee] = useState<string>(operatorName || 'Wasit Utama');

  const [deletingRoundId, setDeletingRoundId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('');

  const openEditModal = (round: ConfirmedRound) => {
    setEditingRound(round);
    setEditScoreA(round.calculation.totalRoundPointsA);
    setEditScoreB(round.calculation.totalRoundPointsB);
    setEditReason('');
    setEditReferee(operatorName || 'Wasit Utama');
  };

  const handleSaveEdit = () => {
    if (!editingRound) return;
    if (!editReason.trim()) {
      alert('Alasan koreksi skor wajib diisi sesuai regulasi audit wasit ORADO.');
      return;
    }
    if (!editReferee.trim()) {
      alert('Nama wasit pengoreksi wajib diisi.');
      return;
    }

    onEditRoundScore(editingRound.id, editScoreA, editScoreB, editReason, editReferee);
    setEditingRound(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingRoundId) return;
    if (!deleteReason.trim()) {
      alert('Alasan penghapusan ronde wajib diisi untuk rekam jejak audit.');
      return;
    }
    onDeleteRound(deletingRoundId, deleteReason, operatorName || 'Wasit Utama');
    setDeletingRoundId(null);
    setDeleteReason('');
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-400" />
          <h3 className="font-extrabold text-base text-stone-100">
            Riwayat Pertandingan & Rekap Ronde ({history.length} Ronde)
          </h3>
        </div>
        <span className="text-xs text-stone-400 font-mono">
          Urutan Kronologis Resmi
        </span>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 text-stone-500">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Belum ada ronde yang dikonfirmasi dalam pertandingan ini.</p>
          <p className="text-xs text-stone-600 mt-1">Gunakan panel input di atas untuk mencatat ronde pertama.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Ronde</th>
                <th className="py-2.5 px-3">Set</th>
                <th className="py-2.5 px-3">Hasil / Kondisi</th>
                <th className="py-2.5 px-3">Pemenang</th>
                <th className="py-2.5 px-3">Sisa Titik</th>
                <th className="py-2.5 px-3 text-right">Poin {identity.teamAName}</th>
                <th className="py-2.5 px-3 text-right">Poin {identity.teamBName}</th>
                <th className="py-2.5 px-3 text-right">Skor Kumulatif</th>
                <th className="py-2.5 px-3 text-center">Aksi Wasit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-mono">
              {history.map((r) => {
                const isWinnerA = r.calculation.winnerTeam === 'A';
                const isWinnerB = r.calculation.winnerTeam === 'B';

                return (
                  <tr key={r.id} className="hover:bg-stone-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-stone-200">
                      R{r.roundNumber}
                    </td>
                    <td className="py-3 px-3 text-stone-400">
                      Set {r.setNumber}
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <div className="font-semibold text-stone-200">
                        {r.inputSnapshot.resultType === 'normal_finish'
                          ? 'Kemenangan Normal'
                          : r.inputSnapshot.resultType === 'beradu'
                          ? 'Permainan Beradu'
                          : r.inputSnapshot.resultType === 'round_invalid'
                          ? 'Ronde Dibatalkan'
                          : 'Sanksi Khusus'}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {r.inputSnapshot.bothEndsMatched && (
                          <span className="text-amber-400 font-bold mr-1">[2 Ujung]</span>
                        )}
                        {r.inputSnapshot.isBalak && (
                          <span className="text-amber-500 font-bold mr-1">[Balak]</span>
                        )}
                        {r.calculation.isApollo && (
                          <span className="text-rose-400 font-black mr-1">[APOLLO]</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {isWinnerA ? (
                        <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[11px] font-bold">
                          Tim A ({r.calculation.winnerPlayer || 'A'})
                        </span>
                      ) : isWinnerB ? (
                        <span className="bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[11px] font-bold">
                          Tim B ({r.calculation.winnerPlayer || 'B'})
                        </span>
                      ) : (
                        <span className="text-stone-500 text-[11px] font-semibold">
                          {r.calculation.needsRefereeConfirmation ? 'Perlu Wasit' : 'Seri / Batal'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-stone-400">
                      A: {r.calculation.totalRemainingA} | B: {r.calculation.totalRemainingB}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-blue-400">
                      +{r.calculation.totalRoundPointsA}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-red-400">
                      +{r.calculation.totalRoundPointsB}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-stone-200">
                      {r.calculation.scoreAfterA} — {r.calculation.scoreAfterB}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-sans">
                        <button
                          type="button"
                          onClick={() => setSelectedRound(r)}
                          className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                          title="Lihat Detail Rumus & Bukti"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(r)}
                          className="p-1 rounded-md text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
                          title="Koreksi Skor Ronde"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRoundId(r.id)}
                          className="p-1 rounded-md text-stone-400 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                          title="Hapus Ronde Ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <span>Rincian Ronde {selectedRound.roundNumber} (Set {selectedRound.setNumber})</span>
              </h4>
              <button
                onClick={() => setSelectedRound(null)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CalculationBreakdownPanel
              calculation={selectedRound.calculation}
              identity={identity}
              isSimulated={false}
            />

            <div className="text-[11px] text-stone-400 font-mono bg-stone-950 p-3 rounded-xl border border-stone-800 flex justify-between">
              <span>Waktu Konfirmasi: {selectedRound.timestamp}</span>
              <span>Operator / Wasit: {selectedRound.operatorName}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRound(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold rounded-xl"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction / Edit Modal (Rule E.14 requirement) */}
      {editingRound && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-stone-900 border border-amber-600/70 rounded-2xl w-full max-w-lg p-6 text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                <span>Koreksi Skor Resmi Ronde {editingRound.roundNumber}</span>
              </h4>
              <button
                onClick={() => setEditingRound(null)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-stone-300">
              Sesuai Pasal Audit ORADO, setiap perubahan manual wajib mencatat nilai sebelum, nilai sesudah, alasan, dan nama wasit.
            </div>

            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2 text-xs font-mono">
              <div className="text-stone-400 font-bold">NILAI SEBELUM KOREKSI:</div>
              <div className="flex justify-between">
                <span>Poin Ronde {identity.teamAName}:</span>
                <span className="text-blue-300 font-bold">+{editingRound.calculation.totalRoundPointsA}</span>
              </div>
              <div className="flex justify-between">
                <span>Poin Ronde {identity.teamBName}:</span>
                <span className="text-red-300 font-bold">+{editingRound.calculation.totalRoundPointsB}</span>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Poin Baru {identity.teamAName}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editScoreA}
                    onChange={(e) => setEditScoreA(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-300 block mb-1">
                    Poin Baru {identity.teamBName}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editScoreB}
                    onChange={(e) => setEditScoreB(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Nama Wasit / Pengguna yang Mengubah: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={editReferee}
                  onChange={(e) => setEditReferee(e.target.value)}
                  placeholder="Contoh: Wasit Utama Budi S."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Alasan Koreksi Resmi: <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Contoh: Koreksi titik sisa pemain B2 setelah pengecekan ulang wasit meja."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingRound(null)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-5 py-2 rounded-xl text-xs shadow-md"
              >
                Simpan Koreksi & Catat Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRoundId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-stone-900 border border-rose-600/70 rounded-2xl w-full max-w-md p-6 text-stone-100 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>Hapus Ronde dari Pertandingan</span>
            </h4>

            <p className="text-xs text-stone-300">
              Tindakan ini akan membatalkan poin yang tercatat pada ronde ini dan memperbarui akumulasi skor set.
            </p>

            <div>
              <label className="text-xs font-semibold text-stone-300 block mb-1">
                Alasan Penghapusan: <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Contoh: Kesalahan input ronde ganda oleh pencatat."
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRoundId(null)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-md"
              >
                Hapus & Perbarui Skor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
