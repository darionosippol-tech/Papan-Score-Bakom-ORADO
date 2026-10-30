/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MatchConfig, MatchFormat, MatchIdentity, ApolloEffect } from '../types/orado';
import { Settings, X, Save, RefreshCw } from 'lucide-react';

interface MatchSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  identity: MatchIdentity;
  config: MatchConfig;
  operatorName: string;
  onSaveSettings: (newIdentity: MatchIdentity, newConfig: MatchConfig, newOperator: string, reason: string) => void;
  onResetMatch: (reason: string) => void;
}

export const MatchSettingsModal: React.FC<MatchSettingsModalProps> = ({
  isOpen,
  onClose,
  identity: initialIdentity,
  config: initialConfig,
  operatorName: initialOperator,
  onSaveSettings,
  onResetMatch,
}) => {
  const [identity, setIdentity] = useState<MatchIdentity>({ ...initialIdentity });
  const [config, setConfig] = useState<MatchConfig>({ ...initialConfig });
  const [operator, setOperator] = useState<string>(initialOperator);
  const [reason, setReason] = useState<string>('Pembaruan konfigurasi pertandingan');

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetReason, setResetReason] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(identity, config, operator, reason);
    onClose();
  };

  const handleConfirmReset = () => {
    if (!resetReason.trim()) {
      alert('Alasan reset pertandingan wajib diisi untuk rekam jejak audit.');
      return;
    }
    onResetMatch(resetReason);
    setShowResetConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div>
            <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              <span>Pengaturan Pertandingan & Konfigurasi Regulasi</span>
            </h3>
            <p className="text-xs text-stone-400">
              Ubah identitas meja, nama tim/pemain, format best-of, dan opsi aturan ORADO 101.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Tournament & Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-300 uppercase tracking-wider">Identitas Turnamen & Meja</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-stone-400 block mb-1">Nama Turnamen:</label>
                <input
                  type="text"
                  value={identity.tournamentName}
                  onChange={(e) => setIdentity({ ...identity, tournamentName: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-medium"
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Nomor Pertandingan:</label>
                <input
                  type="text"
                  value={identity.matchNumber}
                  onChange={(e) => setIdentity({ ...identity, matchNumber: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Nomor Meja:</label>
                <input
                  type="text"
                  value={identity.tableNumber}
                  onChange={(e) => setIdentity({ ...identity, tableNumber: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Teams & Players */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <h4 className="font-bold text-stone-300 uppercase tracking-wider">Susunan Tim & Pemain (4 Pemain Aktif)</h4>
            
            {/* Team A */}
            <div className="bg-stone-950/70 p-3.5 rounded-2xl border border-blue-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300">Tim A</span>
                <input
                  type="text"
                  value={identity.teamAName}
                  onChange={(e) => setIdentity({ ...identity, teamAName: e.target.value })}
                  placeholder="Nama Tim A"
                  className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-white text-xs font-bold w-48 text-right"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-0.5 text-[11px]">Pemain A1:</label>
                  <input
                    type="text"
                    value={identity.playerNames.A1}
                    onChange={(e) => setIdentity({
                      ...identity,
                      playerNames: { ...identity.playerNames, A1: e.target.value }
                    })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-0.5 text-[11px]">Pemain A2:</label>
                  <input
                    type="text"
                    value={identity.playerNames.A2}
                    onChange={(e) => setIdentity({
                      ...identity,
                      playerNames: { ...identity.playerNames, A2: e.target.value }
                    })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-stone-200"
                  />
                </div>
              </div>
            </div>

            {/* Team B */}
            <div className="bg-stone-950/70 p-3.5 rounded-2xl border border-red-900/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-300">Tim B (TIM MERAH)</span>
                <input
                  type="text"
                  value={identity.teamBName}
                  onChange={(e) => setIdentity({ ...identity, teamBName: e.target.value })}
                  placeholder="Nama Tim B"
                  className="bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1 text-white text-xs font-bold w-48 text-right"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-stone-400 block mb-0.5 text-[11px]">Pemain B1:</label>
                  <input
                    type="text"
                    value={identity.playerNames.B1}
                    onChange={(e) => setIdentity({
                      ...identity,
                      playerNames: { ...identity.playerNames, B1: e.target.value }
                    })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-stone-200"
                  />
                </div>
                <div>
                  <label className="text-stone-400 block mb-0.5 text-[11px]">Pemain B2:</label>
                  <input
                    type="text"
                    value={identity.playerNames.B2}
                    onChange={(e) => setIdentity({
                      ...identity,
                      playerNames: { ...identity.playerNames, B2: e.target.value }
                    })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-stone-200"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Match Rules & Target */}
          <div className="space-y-3 pt-2 border-t border-stone-800">
            <h4 className="font-bold text-stone-300 uppercase tracking-wider">Format Pertandingan & Parameter Regulasi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-stone-400 block mb-1">Target Poin Per Set:</label>
                <input
                  type="number"
                  value={config.targetSetPoints}
                  onChange={(e) => setConfig({ ...config, targetSetPoints: parseInt(e.target.value, 10) || 101 })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Format Pertandingan:</label>
                <select
                  value={config.matchFormat}
                  onChange={(e) => setConfig({ ...config, matchFormat: e.target.value as MatchFormat })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="best_of_3">Best of 3 (2 Set Kemenangan - Reguler)</option>
                  <option value="best_of_5">Best of 5 (3 Set Kemenangan - Final)</option>
                </select>
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Aturan Apollo (101 vs 0):</label>
                <select
                  value={config.apolloEffect}
                  onChange={(e) => setConfig({ ...config, apolloEffect: e.target.value as ApolloEffect })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="double_set">Menang 2 Set Langsung (Standar ORADO)</option>
                  <option value="instant_match">Kemenangan Pertandingan Seketika</option>
                  <option value="standard_flag">Tandai Saja (1 Set Biasa)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-stone-400 block mb-1">Pengali Bonus Dua Ujung (Pasal 12):</label>
                <input
                  type="number"
                  value={config.doubleEndMultiplier}
                  onChange={(e) => setConfig({ ...config, doubleEndMultiplier: parseInt(e.target.value, 10) || 2 })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Bonus Balak Dua Ujung (Pasal 13):</label>
                <input
                  type="number"
                  value={config.balakBonusPoints}
                  onChange={(e) => setConfig({ ...config, balakBonusPoints: parseInt(e.target.value, 10) || 50 })}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Referee Operator Name */}
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <h4 className="font-bold text-stone-300 uppercase tracking-wider">Operator / Wasit Meja Aktif</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-stone-400 block mb-1">Nama Wasit / Pencatat:</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-stone-400 block mb-1">Alasan Perubahan Pengaturan:</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Dicatat di log audit"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Reset Match Danger Zone */}
          <div className="pt-3 border-t border-stone-800">
            <div className="bg-rose-950/20 border border-rose-900/60 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="font-bold text-rose-300">Mulai Ulang / Reset Pertandingan</div>
                <div className="text-[11px] text-stone-400">Kosongkan seluruh riwayat ronde dan kembalikan skor ke 0 - 0.</div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="bg-rose-900/80 hover:bg-rose-800 text-rose-200 px-3.5 py-1.5 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Reset Pertandingan...
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <span className="text-[11px] text-stone-500 font-mono">
            {config.rulesVersion}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-5 py-2 rounded-xl text-xs shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Konfigurasi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-stone-900 border border-rose-600 rounded-2xl max-w-sm w-full p-5 text-stone-100 shadow-2xl space-y-3">
            <h4 className="font-bold text-sm text-rose-400">Konfirmasi Reset Pertandingan</h4>
            <p className="text-xs text-stone-300">
              Apakah Anda yakin ingin menghapus semua ronde dan memulai pertandingan baru?
            </p>
            <div>
              <label className="text-[11px] text-stone-400 block mb-1">Alasan Reset (Wajib):</label>
              <input
                type="text"
                value={resetReason}
                onChange={(e) => setResetReason(e.target.value)}
                placeholder="Contoh: Memulai pertandingan baru babak semifinal."
                className="w-full bg-stone-950 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs text-stone-400"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
