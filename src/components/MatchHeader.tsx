/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MatchConfig, MatchIdentity } from '../types/orado';
import {
  Layers,
  Settings,
  ShieldCheck,
  BookOpen,
  Download,
  ShieldAlert,
  User,
  Sparkles,
  Share2,
  Radio,
  Volume2,
  LogOut,
  Users
} from 'lucide-react';
import { playVictorySound } from '../utils/audio';

interface MatchHeaderProps {
  identity: MatchIdentity;
  config: MatchConfig;
  operatorName: string;
  connectedClients?: number;
  userEmail?: string;
  userRole?: string;
  onLogout?: () => void;
  onOpenSettings: () => void;
  onOpenRules: () => void;
  onOpenAudit: () => void;
  onOpenTests: () => void;
  onOpenExport: () => void;
  onOpenShare?: () => void;
  onOpenMemberManagement?: () => void;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  identity,
  config,
  operatorName,
  connectedClients = 1,
  userEmail,
  userRole = 'referee',
  onLogout,
  onOpenSettings,
  onOpenRules,
  onOpenAudit,
  onOpenTests,
  onOpenExport,
  onOpenShare,
  onOpenMemberManagement,
}) => {
  return (
    <header className="bg-stone-950 border-b border-stone-800 sticky top-0 z-40 backdrop-blur-md bg-stone-950/90 px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center p-1 shadow-lg ring-1 ring-amber-400/20 overflow-hidden">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-10-29_at_11.30.18-removebg-preview_755d6aba.png"
              alt="Bakom Domino Club"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-base md:text-lg text-white tracking-tight">
                ORADO <span className="text-amber-400">Score Calculator 101</span>
              </h1>
              <span className="hidden sm:inline-block bg-stone-800 text-stone-300 text-[10px] font-mono px-2 py-0.5 rounded-full border border-stone-700">
                Revisi 2026
              </span>
            </div>
            <div className="text-xs text-stone-400 flex items-center gap-2">
              <span className="font-semibold text-stone-300">{identity.tournamentName}</span>
              <span>•</span>
              <span className="font-mono">Meja {identity.tableNumber}</span>
              <span>•</span>
              <span className="font-mono">Match #{identity.matchNumber}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Sync Indicator */}
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs px-2.5 py-1.5 rounded-xl font-bold font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE ({connectedClients})</span>
          </div>

          {/* Share Live Link Button */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Bagikan Link Akses Real-Time Live Score"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bagikan Link Akses</span>
            </button>
          )}

          {/* Kelola Member & Token Button (Host & Referee) */}
          {onOpenMemberManagement && (
            <button
              onClick={onOpenMemberManagement}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
              title="Kelola Daftar Member, Token Akses, dan Izin Masuk/Keluar"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Kelola Member</span>
            </button>
          )}

          {/* Share Live Link Button */}
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="Bagikan Link Akses Real-Time Live Score"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bagikan Link</span>
            </button>
          )}

          {/* Active User / Role Badge */}
          <div className="hidden lg:flex items-center gap-1.5 bg-stone-900 border border-stone-800 text-stone-300 text-xs px-3 py-1.5 rounded-xl font-medium max-w-xs truncate">
            <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-stone-400 truncate">
              {userEmail ? userEmail.split('@')[0] : operatorName}
            </span>
            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
              userRole === 'host'
                ? 'bg-amber-500 text-stone-950'
                : userRole === 'referee'
                ? 'bg-blue-600 text-white'
                : userRole === 'viewer'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {userRole === 'host' ? 'Host' : userRole === 'referee' ? 'Wasit' : userRole === 'viewer' ? 'Live' : 'Member'}
            </span>
          </div>

          {/* Test Runner */}
          <button
            onClick={onOpenTests}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-emerald-400 border border-emerald-900/60 hover:border-emerald-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Jalankan Pengujian Otomatis 5 Kasus Wajib"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Uji Otomatis</span>
          </button>

          {/* Rules Reference */}
          <button
            onClick={onOpenRules}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-900/50 hover:border-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Buka Daftar Pasal & Regulasi ORADO 2026"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Regulasi</span>
          </button>

          {/* Audit Log */}
          <button
            onClick={onOpenAudit}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Buka Catatan Audit Wasit"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Audit</span>
          </button>

          {/* Export */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Ekspor CSV / JSON / Cetak Lembar Skor"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Ekspor</span>
          </button>

          {/* Test Sound Button */}
          <button
            type="button"
            onClick={() => playVictorySound()}
            className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
            title="Tes Efek Suara Kemenangan Resmi"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Tes Suara</span>
          </button>

          {/* Settings (Only Host / Wasit) */}
          {(userRole === 'host' || userRole === 'referee') && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Buka Pengaturan Pertandingan"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Pengaturan</span>
            </button>
          )}

          {/* Logout / Switch User */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              title="Keluar dari Papan Skor (Kembali ke Gerbang Akses)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

