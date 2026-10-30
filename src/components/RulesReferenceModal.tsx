/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RULES_CATALOG, STANDARD_VIOLATIONS } from '../engine/rules';
import { BookOpen, X, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface RulesReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesReferenceModal: React.FC<RulesReferenceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div>
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>The Law of Domino 101 ORADO (Revisi 2026) — Panduan Regulasi Resmi</span>
            </h3>
            <p className="text-xs text-stone-400">
              Kompilasi pasal resmi, status verifikasi teknis, dan rumus poin pertandingan Olahraga Domino Indonesia.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Pasals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Daftar Pasal Regulasi & Status Verifikasi</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.values(RULES_CATALOG).map((rule, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 space-y-2 text-xs ${
                    rule.status === 'TERVERIFIKASI'
                      ? 'bg-stone-950/70 border-stone-800'
                      : 'bg-amber-950/20 border-amber-600/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400">{rule.article} — {rule.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      rule.status === 'TERVERIFIKASI'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      {rule.status === 'TERVERIFIKASI' ? 'TERVERIFIKASI' : 'PERLU KONFIRMASI WASIT'}
                    </span>
                  </div>

                  <p className="text-stone-300 leading-relaxed">
                    {rule.description}
                  </p>

                  {rule.details && (
                    <div className="text-[11px] text-stone-400 bg-stone-900/80 p-2.5 rounded-xl border border-stone-800">
                      <strong className="text-stone-300">Catatan Regulasi:</strong> {rule.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Standard Penalties Table */}
          <div className="space-y-3 pt-3 border-t border-stone-800">
            <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Katalog Pelanggaran & Sanksi Resmi (Pasal 15 & 16)</span>
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-stone-800 rounded-xl overflow-hidden">
                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Jenis Pelanggaran</th>
                    <th className="py-2.5 px-3">Pasal Rujukan</th>
                    <th className="py-2.5 px-3">Tingkat</th>
                    <th className="py-2.5 px-3 text-right">Sanksi Poin</th>
                    <th className="py-2.5 px-3">Deskripsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800 text-stone-300 font-sans">
                  {STANDARD_VIOLATIONS.map((v) => (
                    <tr key={v.code} className="hover:bg-stone-800/40">
                      <td className="py-2 px-3 font-semibold text-stone-100">{v.name}</td>
                      <td className="py-2 px-3 font-mono text-amber-400 text-[11px]">{v.article}</td>
                      <td className="py-2 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          v.severity === 'berat'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-stone-800 text-stone-400'
                        }`}>
                          {v.severity}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                        +{v.defaultPoints} poin
                      </td>
                      <td className="py-2 px-3 text-stone-400 text-[11px]">{v.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-400">
          <span>Kepatuhan naskah: The Law of Domino 101 ORADO (Revisi 2026).</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
