/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { runAllAutomatedTests, TestCaseResult } from '../engine/tests';
import { CheckCircle2, XCircle, Play, ShieldAlert, X, RefreshCw } from 'lucide-react';

interface TestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TestRunnerModal: React.FC<TestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [testResults, setTestResults] = useState<TestCaseResult[]>(() => runAllAutomatedTests());
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setTestResults(runAllAutomatedTests());
      setIsRunning(false);
    }, 250);
  };

  const totalTests = testResults.length;
  const passedTests = testResults.filter((t) => t.passed).length;
  const allPassed = passedTests === totalTests;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div>
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Verifikasi & Pengujian Otomatis Mesin Poin ORADO 101</span>
            </h3>
            <p className="text-xs text-stone-400">
              Validasi deterministik mencakup 5 Kasus Uji Wajib (Bagian G) dan kondisi batas regulasi 2026.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Summary Banner */}
        <div className="px-6 py-3.5 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-xl text-xs font-bold font-mono ${
              allPassed
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}>
              {passedTests} / {totalTests} Tes Lolos ({Math.round((passedTests / totalTests) * 100)}%)
            </div>
            <span className="text-xs text-stone-400">
              Status Mesin: <strong className={allPassed ? 'text-emerald-400' : 'text-rose-400'}>
                {allPassed ? '100% Sesuai Regulasi Terverifikasi' : 'Ada Ketidaksesuaian'}
              </strong>
            </span>
          </div>

          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3.5 py-1.5 rounded-xl text-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>Jalankan Ulang Semua Tes</span>
          </button>
        </div>

        {/* Test Cases List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {testResults.map((t) => (
            <div
              key={t.id}
              className={`rounded-2xl border p-4 transition-all ${
                t.passed
                  ? 'bg-stone-950/60 border-stone-800 hover:border-emerald-800/80'
                  : 'bg-rose-950/30 border-rose-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {t.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h5 className="font-bold text-sm text-stone-200">{t.name}</h5>
                    <p className="text-[11px] text-stone-400 font-sans">{t.inputDescription}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                  t.category === 'wajib'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-stone-800 text-stone-400'
                }`}>
                  {t.category === 'wajib' ? 'Kasus Wajib' : 'Uji Batas'}
                </span>
              </div>

              {/* Expectations vs Actual */}
              <div className="bg-stone-900/90 rounded-xl p-3 border border-stone-800/80 text-xs font-mono space-y-1 mt-2">
                <div className="flex items-start gap-2">
                  <span className="text-stone-500 font-bold w-18 shrink-0">Ekspektasi:</span>
                  <span className="text-stone-300">{t.expected}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-stone-500 font-bold w-18 shrink-0">Aktual:</span>
                  <span className={t.passed ? 'text-emerald-300 font-semibold' : 'text-rose-400 font-semibold'}>
                    {t.actual}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between text-xs text-stone-400">
          <span>Determinisme diverifikasi: input yang sama selalu menghasilkan output yang sama.</span>
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
