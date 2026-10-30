/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuditLogEntry } from '../types/orado';
import { ShieldCheck, X, FileClock, User, Clock, AlertCircle } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogEntry[];
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose, auditLogs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div>
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Buku Catatan Audit Wasit & Integritas Skor</span>
            </h3>
            <p className="text-xs text-stone-400">
              Rekam jejak setiap perubahan skor, konfirmasi ronde, koreksi, dan intervensi wasit (Pasal Audit ORADO).
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {auditLogs.length === 0 ? (
            <div className="text-center py-12 text-stone-500">
              <FileClock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada catatan audit dalam pertandingan ini.</p>
            </div>
          ) : (
            auditLogs.slice().reverse().map((log) => {
              const isCorrection = log.action === 'EDIT_ROUND' || log.action === 'MANUAL_SCORE_ADJUST';
              const isDelete = log.action === 'DELETE_ROUND';

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl border p-4 space-y-2 text-xs ${
                    isDelete
                      ? 'bg-rose-950/20 border-rose-800/60'
                      : isCorrection
                      ? 'bg-amber-950/20 border-amber-800/60'
                      : 'bg-stone-950/60 border-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-stone-400">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono uppercase ${
                        isDelete
                          ? 'bg-rose-900 text-rose-200'
                          : isCorrection
                          ? 'bg-amber-900 text-amber-200'
                          : 'bg-blue-900 text-blue-200'
                      }`}>
                        {log.action}
                      </span>
                      {log.roundNumber && (
                        <span className="font-semibold text-stone-300">
                          Ronde {log.roundNumber} (Set {log.setNumber})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-stone-500" />
                      <span>{log.timestamp}</span>
                    </div>
                  </div>

                  <div className="text-stone-300">
                    <strong>Alasan / Keterangan:</strong> {log.reason}
                  </div>

                  {(log.previousValue || log.newValue) && (
                    <div className="bg-stone-900/90 rounded-xl p-2.5 border border-stone-800 text-[11px] font-mono grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-stone-500 block">Nilai Sebelumnya:</span>
                        <span className="text-rose-400">{log.previousValue || '-'}</span>
                      </div>
                      <div>
                        <span className="text-stone-500 block">Nilai Sesudah:</span>
                        <span className="text-emerald-400">{log.newValue || '-'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-stone-400 text-[11px] pt-1">
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span>Operator / Wasit: <strong className="text-stone-200">{log.operatorName}</strong></span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-400">
          <span>Total {auditLogs.length} kejadian tercatat dalam buku audit.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold transition-colors"
          >
            Tutup Buku Audit
          </button>
        </div>
      </div>
    </div>
  );
};
