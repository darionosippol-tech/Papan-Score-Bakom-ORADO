/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalculationBreakdown, MatchIdentity } from '../types/orado';
import { AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, Trophy } from 'lucide-react';

interface CalculationBreakdownPanelProps {
  calculation: CalculationBreakdown | null;
  identity: MatchIdentity;
  isSimulated?: boolean;
}

export const CalculationBreakdownPanel: React.FC<CalculationBreakdownPanelProps> = ({
  calculation,
  identity,
  isSimulated = false,
}) => {
  if (!calculation) {
    return (
      <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 text-center text-stone-500">
        <HelpCircle className="w-8 h-8 mx-auto mb-2 text-stone-600" />
        <p className="text-sm">Silakan masukkan data ronde dan klik <strong className="text-stone-300">"Hitung Poin (Simulasi)"</strong> untuk melihat rincian rumus dan hasil sebelum konfirmasi.</p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-5 transition-all shadow-xl ${
      calculation.needsRefereeConfirmation
        ? 'bg-amber-950/20 border-amber-600/60'
        : calculation.isValid
        ? 'bg-stone-900 border-stone-800'
        : 'bg-rose-950/30 border-rose-700/60'
    }`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-800">
        <div className="flex items-center gap-2">
          {calculation.needsRefereeConfirmation ? (
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          ) : calculation.isValid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          )}
          <h4 className="font-bold text-sm text-stone-200">
            {isSimulated ? 'Simulasi Hasil Perhitungan Ronde' : 'Hasil Perhitungan Ronde Resmi'}
          </h4>
        </div>

        <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
          calculation.needsRefereeConfirmation
            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            : calculation.isValid
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
        }`}>
          {calculation.needsRefereeConfirmation
            ? 'Perlu Konfirmasi Wasit'
            : calculation.isValid
            ? 'Tervalidasi'
            : 'Input Tidak Valid'}
        </span>
      </div>

      {/* Validation Errors if any */}
      {!calculation.isValid && calculation.validationErrors.length > 0 && (
        <div className="mb-4 bg-rose-900/30 border border-rose-700/50 rounded-xl p-3 text-rose-200 text-xs space-y-1">
          <div className="font-bold text-rose-400">Kesalahan Validasi Input:</div>
          <ul className="list-disc list-inside space-y-0.5">
            {calculation.validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Referee Attention Banner for Beradu */}
      {calculation.needsRefereeConfirmation && (
        <div className="mb-4 bg-amber-900/30 border border-amber-600/70 rounded-xl p-3.5 text-amber-200 text-xs space-y-1">
          <div className="font-black text-amber-400 flex items-center gap-2 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            {calculation.confirmationMessage || 'PERLU KONFIRMASI WASIT'}
          </div>
          <p className="text-stone-300">
            Klausul penentuan pemenang beradu belum dapat dipastikan secara otomatis. Skor pertandingan <strong>tidak akan diubah</strong> sampai wasit menetapkan keputusan pada opsi resolusi beradu.
          </p>
        </div>
      )}

      {/* Apollo Banner */}
      {calculation.isApollo && (
        <div className="mb-4 bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 text-amber-200 text-xs flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-amber-300">Kondisi Apollo Terpenuhi! </span>
            {calculation.apolloDetails}
          </div>
        </div>
      )}

      {/* Points Summary Comparison Table */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Tim A Card */}
        <div className="bg-stone-950/70 border border-blue-900/40 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs font-bold text-blue-300 mb-2">
            <span>{identity.teamAName || 'TIM A'}</span>
            {calculation.winnerTeam === 'A' && (
              <span className="bg-blue-500 text-stone-950 text-[10px] px-1.5 py-0.2 rounded font-black">
                MENANG RONDE
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Poin Dasar:</span>
              <span className="font-mono text-stone-200">{calculation.basePointsA}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Bonus:</span>
              <span className="font-mono text-stone-200">+{calculation.bonusPointsA}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Penalti (Lawan):</span>
              <span className="font-mono text-stone-200">+{calculation.penaltyPointsA}</span>
            </div>
            <div className="border-t border-stone-800 pt-1 flex justify-between font-bold text-white text-sm">
              <span>Poin Ronde:</span>
              <span className="font-mono text-blue-400">+{calculation.totalRoundPointsA}</span>
            </div>
            <div className="pt-1 flex justify-between text-[11px] text-stone-400 font-mono">
              <span>Skor: {calculation.scoreBeforeA} →</span>
              <span className="font-bold text-blue-300">{calculation.scoreAfterA}</span>
            </div>
          </div>
        </div>

        {/* Tim B Card */}
        <div className="bg-stone-950/70 border border-red-900/40 rounded-xl p-3">
          <div className="flex items-center justify-between text-xs font-bold text-red-300 mb-2">
            <span>{identity.teamBName || 'TIM MERAH'}</span>
            {calculation.winnerTeam === 'B' && (
              <span className="bg-red-500 text-stone-950 text-[10px] px-1.5 py-0.2 rounded font-black">
                MENANG RONDE
              </span>
            )}
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Poin Dasar:</span>
              <span className="font-mono text-stone-200">{calculation.basePointsB}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Bonus:</span>
              <span className="font-mono text-stone-200">+{calculation.bonusPointsB}</span>
            </div>
            <div className="flex justify-between text-stone-400">
              <span>Penalti (Lawan):</span>
              <span className="font-mono text-stone-200">+{calculation.penaltyPointsB}</span>
            </div>
            <div className="border-t border-stone-800 pt-1 flex justify-between font-bold text-white text-sm">
              <span>Poin Ronde:</span>
              <span className="font-mono text-red-400">+{calculation.totalRoundPointsB}</span>
            </div>
            <div className="pt-1 flex justify-between text-[11px] text-stone-400 font-mono">
              <span>Skor: {calculation.scoreBeforeB} →</span>
              <span className="font-bold text-red-300">{calculation.scoreAfterB}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Explanation Section */}
      <div className="bg-stone-950/90 rounded-xl p-3.5 border border-stone-800 mb-4">
        <div className="text-xs font-bold text-stone-300 mb-2 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Penjelasan Rumus & Alur Logika Perhitungan:</span>
        </div>
        <div className="space-y-1.5 text-xs text-stone-300 font-mono">
          {calculation.formulaExplanation.map((line, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-stone-600 select-none">•</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rules Cited */}
      {calculation.rulesCited.length > 0 && (
        <div>
          <div className="text-xs font-bold text-stone-400 mb-2">
            Pasal Regulasi Terkait (The Law of Domino 101 ORADO 2026):
          </div>
          <div className="flex flex-wrap gap-2">
            {calculation.rulesCited.map((r, idx) => (
              <div
                key={idx}
                className="bg-stone-800/80 border border-stone-700 rounded-lg px-2.5 py-1 text-[11px] text-stone-300 flex items-center gap-2"
              >
                <span className="font-bold text-amber-400">{r.article}</span>
                <span className="text-stone-400 truncate max-w-[150px]">{r.title}</span>
                <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                  r.status === 'TERVERIFIKASI'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {r.status === 'TERVERIFIKASI' ? 'Terverifikasi' : 'Perlu Wasit'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
