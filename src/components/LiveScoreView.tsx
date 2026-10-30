/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MatchIdentity, MatchConfig, DominoTile, PlayerId } from '../types/orado';
import { SimpleRoundEntry } from './SimpleScoreBoard';
import {
  Trophy,
  Volume2,
  VolumeX,
  Radio,
  Users,
  Sparkles,
  Shield,
  Flame,
  Play,
  Settings,
  Layers,
  CheckCircle2,
  Clock,
  CircleDot,
  User,
  Info,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playVictorySound, toggleAudioMuted, getIsAudioMuted } from '../utils/audio';

interface LiveScoreViewProps {
  identity: MatchIdentity;
  config: MatchConfig;
  scoreA: number;
  scoreB: number;
  setsWonA: number;
  setsWonB: number;
  currentSet: number;
  currentRound: number;
  simpleRows: SimpleRoundEntry[];
  connectedClients: number;
  lastRoundApollo?: boolean;
  canEdit?: boolean;
  onOpenSoundSettings?: () => void;
  onLogout?: () => void;
}

// Domino dots component for realistic double-six tiles
const DominoTileDisplay: React.FC<{ top: number; bottom: number; isLarge?: boolean }> = ({
  top,
  bottom,
  isLarge = false,
}) => {
  const renderDots = (count: number) => {
    const dotClasses = isLarge ? 'w-2.5 h-2.5' : 'w-1.5 h-1.5';
    const positions: Record<number, number[][]> = {
      0: [],
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
    };

    const activeDots = positions[count] || [];

    return (
      <div className={`grid grid-cols-3 grid-rows-3 gap-0.5 ${isLarge ? 'w-8 h-8 p-1' : 'w-5 h-5 p-0.5'}`}>
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const hasDot = activeDots.some(([dr, dc]) => dr === r && dc === c);
            return (
              <div key={`${r}-${c}`} className="flex items-center justify-center">
                {hasDot ? (
                  <div className={`${dotClasses} rounded-full bg-stone-900 shadow-inner`} />
                ) : (
                  <div className={dotClasses} />
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  return (
    <div
      className={`bg-stone-50 border-2 border-stone-300 rounded-lg flex flex-col items-center justify-between shadow-md select-none ${
        isLarge ? 'w-10 h-18 p-1' : 'w-6 h-12 p-0.5'
      }`}
    >
      <div className="flex items-center justify-center">{renderDots(top)}</div>
      <div className="w-full h-0.5 bg-stone-400 my-0.5" />
      <div className="flex items-center justify-center">{renderDots(bottom)}</div>
    </div>
  );
};

export const LiveScoreView: React.FC<LiveScoreViewProps> = ({
  identity,
  config,
  scoreA,
  scoreB,
  setsWonA,
  setsWonB,
  currentSet,
  currentRound,
  simpleRows,
  connectedClients,
  lastRoundApollo,
  canEdit = false,
  onOpenSoundSettings,
  onLogout,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => getIsAudioMuted());
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [hasPlayedSetWinSound, setHasPlayedSetWinSound] = useState<boolean>(false);
  const [selectedCycleTab, setSelectedCycleTab] = useState<'all' | 'cycle1' | 'cycle2'>('all');

  const target = config.targetSetPoints || 101;
  const setsNeeded = config.matchFormat === 'best_of_5' ? 3 : 2;

  const progressA = Math.min(100, Math.round((scoreA / target) * 100));
  const progressB = Math.min(100, Math.round((scoreB / target) * 100));

  const hasWonSet = scoreA >= target || scoreB >= target;
  const leadingTeam = scoreA > scoreB ? 'BIRU' : scoreB > scoreA ? 'MERAH' : null;

  // Find active row and current active balak
  const activeRow =
    simpleRows.find((r) => r.scoreBiru === null && r.scoreMerah === null) ||
    simpleRows[simpleRows.length - 1] || { balakNumber: 0, id: 1, cycle: 1 };
  const currentBalakNumber = activeRow.balakNumber;

  // Determine official referee rotational assignment for 14 balak
  // In ORADO 101: 4 players rotate opening the balak (A1 -> B1 -> A2 -> B2)
  const getAssignedPlayerForRound = (roundId: number): { id: PlayerId; name: string; team: 'BIRU' | 'MERAH' } => {
    const rotationIndex = (roundId - 1) % 4;
    switch (rotationIndex) {
      case 0:
        return { id: 'A1', name: identity.playerNames.A1 || 'Pemain Biru 1', team: 'BIRU' };
      case 1:
        return { id: 'B1', name: identity.playerNames.B1 || 'Pemain Merah 1', team: 'MERAH' };
      case 2:
        return { id: 'A2', name: identity.playerNames.A2 || 'Pemain Biru 2', team: 'BIRU' };
      case 3:
      default:
        return { id: 'B2', name: identity.playerNames.B2 || 'Pemain Merah 2', team: 'MERAH' };
    }
  };

  const activeAssigned = getAssignedPlayerForRound(activeRow.id || 1);

  // Stats calculation
  const balakWonBiru = simpleRows.filter((r) => (r.scoreBiru || 0) > 0).length;
  const balakWonMerah = simpleRows.filter((r) => (r.scoreMerah || 0) > 0).length;
  const balakPlayed = simpleRows.filter((r) => r.scoreBiru !== null || r.scoreMerah !== null).length;
  const balakRemaining = Math.max(0, 14 - balakPlayed);

  // Trigger celebration and victory audio automatically when target 101 reached
  useEffect(() => {
    if (hasWonSet && !hasPlayedSetWinSound) {
      setHasPlayedSetWinSound(true);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (e) {}

      if (!isMuted) {
        setIsPlayingAudio(true);
        playVictorySound().finally(() => setIsPlayingAudio(false));
      }
    } else if (!hasWonSet && hasPlayedSetWinSound) {
      setHasPlayedSetWinSound(false);
    }
  }, [hasWonSet, hasPlayedSetWinSound, isMuted]);

  const handleToggleMute = () => {
    const updated = toggleAudioMuted();
    setIsMuted(updated);
  };

  const handleTestSound = () => {
    setIsPlayingAudio(true);
    playVictorySound().finally(() => setIsPlayingAudio(false));
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 select-none pb-12 font-sans">
      {/* Top Live Status Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-3 md:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-red-950/80 border border-red-700/80 text-red-400 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
            <Radio className="w-3.5 h-3.5" />
            <span>LIVE SCORE REAL-TIME</span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>{connectedClients} Perangkat Terhubung</span>
          </div>
        </div>

        {/* Audio & Sound Settings Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Settings Button */}
          {onOpenSoundSettings && (
            <button
              type="button"
              onClick={onOpenSoundSettings}
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 hover:border-amber-400/50 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Buka pengaturan suara (Wasit / Host)"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Pengaturan Suara</span>
            </button>
          )}

          {/* Test Sound Button */}
          <button
            type="button"
            onClick={handleTestSound}
            disabled={isPlayingAudio}
            className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            title="Dengarkan efek suara kemenangan resmi"
          >
            <Play className={`w-3.5 h-3.5 text-amber-400 ${isPlayingAudio ? 'animate-spin' : ''}`} />
            <span>{isPlayingAudio ? 'Memutar...' : 'Tes Suara'}</span>
          </button>

          {/* Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isMuted
                ? 'bg-stone-800 text-stone-400 border-stone-700'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-700/70'
            }`}
            title="Nyalakan atau matikan efek suara kemenangan otomatis"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Senyap' : 'Aktif'}</span>
          </button>

          {/* Dedicated Keluar Button in Live Score */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white border border-rose-500 px-3 py-1.5 rounded-xl text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
              title="Keluar dari Papan Skor (Kembali ke Gerbang Akses)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          )}
        </div>
      </div>

      {/* Target 101 Win Celebration Banner */}
      {hasWonSet && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-stone-950 p-4 md:p-5 rounded-3xl shadow-2xl animate-pulse flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="w-12 h-12 rounded-2xl bg-stone-950/40 flex items-center justify-center shrink-0 border border-white/20">
              <Trophy className="w-7 h-7 text-amber-200" />
            </div>
            <div>
              <div className="text-xs uppercase font-extrabold tracking-widest text-amber-200">
                🎉 HASIL SET {currentSet}
              </div>
              <div className="text-xl md:text-2xl font-black text-white leading-tight">
                PEMENANG: TIM {scoreA >= target ? 'BIRU' : 'MERAH'}!
              </div>
              <div className="text-xs text-white/90 font-medium">
                Skor Akhir: {scoreA} (BIRU) vs {scoreB} (MERAH)
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestSound}
            className="flex items-center gap-2 bg-stone-950 hover:bg-stone-900 text-amber-300 border border-amber-400/50 px-4 py-2.5 rounded-2xl text-xs font-black shadow-xl cursor-pointer transition-transform active:scale-95"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>Putar Ulang Suara</span>
          </button>
        </div>
      )}

      {/* Main Duel Scoreboard - TIM BIRU vs TIM MERAH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TIM BIRU CARD */}
        <div
          className={`rounded-3xl p-5 md:p-6 border-2 transition-all shadow-xl relative overflow-hidden ${
            scoreA >= target
              ? 'bg-gradient-to-b from-blue-950 via-[#1E75C8]/30 to-stone-950 border-blue-400 ring-2 ring-blue-400/50'
              : 'bg-stone-900/90 border-[#1E75C8]/60'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-[#1E75C8] shadow-md border-2 border-white" />
              <div>
                <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider block">Tim A</span>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {identity.teamAName || 'TIM BIRU'}
                </h3>
              </div>
            </div>

            {/* Set Badges */}
            <div className="flex items-center gap-1.5 bg-stone-950/80 px-3 py-1.5 rounded-2xl border border-blue-900/60">
              <span className="text-[11px] text-stone-400 font-bold uppercase mr-1">Set:</span>
              {Array.from({ length: setsNeeded }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    idx < setsWonA
                      ? 'bg-[#1E75C8] text-white shadow-md ring-1 ring-blue-300'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  {idx < setsWonA ? '✓' : idx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="text-xs text-blue-200/80 mb-5 flex items-center gap-2 font-semibold bg-[#1E75C8]/10 px-3 py-1.5 rounded-xl border border-blue-800/40">
            <span>{identity.playerNames.A1 || 'Pemain Biru 1'}</span>
            <span className="text-blue-500">•</span>
            <span>{identity.playerNames.A2 || 'Pemain Biru 2'}</span>
          </div>

          {/* Big Score Number */}
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl md:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
                {scoreA}
              </span>
              <span className="text-sm text-stone-400 font-mono font-bold">/ {target}</span>
            </div>
            {leadingTeam === 'BIRU' && (
              <span className="text-xs font-black text-blue-200 bg-blue-600/80 border border-blue-400 px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                Memimpin +{scoreA - scoreB}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-stone-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-stone-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 transition-all duration-500 shadow-sm"
              style={{ width: `${progressA}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-stone-400 font-mono mt-2 font-semibold">
            <span>Progres Set {currentSet}</span>
            <span className="text-blue-300 font-black">{progressA}% ({Math.max(0, target - scoreA)} poin lagi)</span>
          </div>
        </div>

        {/* TIM MERAH CARD */}
        <div
          className={`rounded-3xl p-5 md:p-6 border-2 transition-all shadow-xl relative overflow-hidden ${
            scoreB >= target
              ? 'bg-gradient-to-b from-red-950 via-[#EA1D24]/30 to-stone-950 border-red-400 ring-2 ring-red-400/50'
              : 'bg-stone-900/90 border-[#EA1D24]/60'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded-full bg-[#EA1D24] shadow-md border-2 border-white" />
              <div>
                <span className="text-[10px] text-red-300 font-bold uppercase tracking-wider block">Tim B</span>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  {identity.teamBName || 'TIM MERAH'}
                </h3>
              </div>
            </div>

            {/* Set Badges */}
            <div className="flex items-center gap-1.5 bg-stone-950/80 px-3 py-1.5 rounded-2xl border border-red-900/60">
              <span className="text-[11px] text-stone-400 font-bold uppercase mr-1">Set:</span>
              {Array.from({ length: setsNeeded }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                    idx < setsWonB
                      ? 'bg-[#EA1D24] text-white shadow-md ring-1 ring-red-300'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  {idx < setsWonB ? '✓' : idx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="text-xs text-red-200/80 mb-5 flex items-center gap-2 font-semibold bg-[#EA1D24]/10 px-3 py-1.5 rounded-xl border border-red-800/40">
            <span>{identity.playerNames.B1 || 'Pemain Merah 1'}</span>
            <span className="text-red-500">•</span>
            <span>{identity.playerNames.B2 || 'Pemain Merah 2'}</span>
          </div>

          {/* Big Score Number */}
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-6xl md:text-7xl font-black font-mono tracking-tight text-white drop-shadow-md">
                {scoreB}
              </span>
              <span className="text-sm text-stone-400 font-mono font-bold">/ {target}</span>
            </div>
            {leadingTeam === 'MERAH' && (
              <span className="text-xs font-black text-red-200 bg-red-600/80 border border-red-400 px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                Memimpin +{scoreB - scoreA}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-stone-950 rounded-full h-3.5 overflow-hidden p-0.5 border border-stone-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 transition-all duration-500 shadow-sm"
              style={{ width: `${progressB}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-xs text-stone-400 font-mono mt-2 font-semibold">
            <span>Progres Set {currentSet}</span>
            <span className="text-red-300 font-black">{progressB}% ({Math.max(0, target - scoreB)} poin lagi)</span>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* INFORMASI BALAK RESMI ORADO (Ditentukan Wasit atau Host)       */}
      {/* ============================================================== */}
      <div className="bg-stone-900 border-2 border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm md:text-base font-black text-amber-400 uppercase tracking-wide">
                Informasi Balak Papan Skor (Ditentukan Wasit / Host)
              </h4>
              <p className="text-xs text-stone-400">
                Rotasi resmi 14 Balak double-six sesuai ketetapan Meja {identity.tableNumber}
              </p>
            </div>
          </div>

          {/* Balak stats badges */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="bg-blue-950/80 border border-blue-700 text-blue-300 px-2.5 py-1 rounded-xl">
              Biru: {balakWonBiru} Balak
            </span>
            <span className="bg-red-950/80 border border-red-700 text-red-300 px-2.5 py-1 rounded-xl">
              Merah: {balakWonMerah} Balak
            </span>
            <span className="bg-stone-800 border border-stone-700 text-stone-400 px-2.5 py-1 rounded-xl">
              Sisa: {balakRemaining}
            </span>
          </div>
        </div>

        {/* ACTIVE BALAK HIGHLIGHT CARD (With Visual Domino Tile) */}
        <div className="bg-gradient-to-r from-amber-600 via-[#F48B00] to-amber-600 text-stone-950 rounded-2xl p-4 md:p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border-2 border-amber-300/40">
          <div className="flex items-center gap-4">
            {/* 3D Visual Domino Tile */}
            <div className="p-1 bg-amber-950/30 rounded-xl shadow-inner shrink-0">
              <DominoTileDisplay top={currentBalakNumber} bottom={currentBalakNumber} isLarge />
            </div>

            <div>
              <div className="text-[11px] font-black uppercase tracking-widest text-stone-950/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-stone-950 animate-ping" />
                <span>BALAK AKTIF SAAT INI</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-stone-950 leading-tight">
                Balak {currentBalakNumber} ({currentBalakNumber} - {currentBalakNumber})
              </div>
              <div className="text-xs font-bold text-stone-900 mt-1 flex items-center gap-2">
                <span>Ronde {activeRow.id || currentRound} dari 14</span>
                <span>•</span>
                <span>{activeRow.id <= 7 ? 'Putaran 1 (Siklus 1)' : 'Putaran 2 (Siklus 2)'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Player according to referee rotation */}
          <div className="bg-stone-950/30 backdrop-blur-xs px-4 py-3 rounded-2xl border border-stone-950/20 text-xs text-stone-950 font-bold space-y-1">
            <div className="flex items-center gap-1.5 text-stone-950 font-extrabold text-[11px] uppercase tracking-wider">
              <User className="w-3.5 h-3.5 text-stone-900" />
              <span>Pemegang Balak Ditugaskan Wasit:</span>
            </div>
            <div className="text-stone-950 text-sm font-black">
              {activeAssigned.name} ({activeAssigned.id})
            </div>
            <div className="text-[11px] text-stone-900 font-semibold">
              Tim: <span className="uppercase font-black">{activeAssigned.team}</span>
            </div>
          </div>
        </div>

        {/* 14-BALAK ROTATION LIST / BOARD DETAILS */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-stone-300 uppercase tracking-wider">
              Daftar Lengkap 14 Balak (Putaran 1 & 2)
            </span>
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
              <button
                type="button"
                onClick={() => setSelectedCycleTab('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  selectedCycleTab === 'all' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                Semua (14)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycleTab('cycle1')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  selectedCycleTab === 'cycle1' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                Putaran 1 (0-6)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycleTab('cycle2')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] cursor-pointer transition-colors ${
                  selectedCycleTab === 'cycle2' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-white'
                }`}
              >
                Putaran 2 (0-6)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {simpleRows
              .filter((row) => {
                if (selectedCycleTab === 'cycle1') return row.cycle === 1;
                if (selectedCycleTab === 'cycle2') return row.cycle === 2;
                return true;
              })
              .map((row) => {
                const isCurrent = activeRow.id === row.id;
                const isCompleted = row.scoreBiru !== null || row.scoreMerah !== null;
                const isBiruWin = (row.scoreBiru || 0) > 0;
                const isMerahWin = (row.scoreMerah || 0) > 0;
                const assigned = getAssignedPlayerForRound(row.id);

                return (
                  <div
                    key={row.id}
                    className={`rounded-2xl p-2.5 border flex flex-col items-center justify-between text-center transition-all ${
                      isCurrent
                        ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50 shadow-md scale-102'
                        : isCompleted
                        ? isBiruWin
                          ? 'bg-blue-950/40 border-blue-800/80 text-blue-200'
                          : 'bg-red-950/40 border-red-800/80 text-red-200'
                        : 'bg-stone-950/70 border-stone-800 text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1 text-[10px] font-bold text-stone-400">
                      <span>R{row.id}</span>
                      <span>{row.cycle === 1 ? 'P1' : 'P2'}</span>
                    </div>

                    {/* Small Domino Tile */}
                    <DominoTileDisplay top={row.balakNumber} bottom={row.balakNumber} />

                    <div className="mt-1.5 font-black text-xs text-white">
                      Balak {row.balakNumber}
                    </div>

                    <div className="text-[10px] text-stone-400 font-medium truncate w-full" title={assigned.name}>
                      {assigned.id} ({assigned.name.split(' ')[0]})
                    </div>

                    {/* Status badge */}
                    <div className="mt-1.5 w-full pt-1 border-t border-stone-800">
                      {isCurrent ? (
                        <span className="text-[10px] font-black text-amber-400 animate-pulse flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Aktif
                        </span>
                      ) : isCompleted ? (
                        <span
                          className={`text-[10px] font-black block truncate ${
                            isBiruWin ? 'text-blue-400' : 'text-red-400'
                          }`}
                        >
                          {isBiruWin ? `BIRU +${row.scoreBiru}` : `MERAH +${row.scoreMerah}`}
                        </span>
                      ) : (
                        <span className="text-[10px] text-stone-600 block">Belum</span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TABEL PAPAN SKOR 14 BALAK ASLI (Replika Foto Referensi Pengguna) */}
      {/* ============================================================== */}
      <div className="w-full rounded-3xl overflow-hidden shadow-2xl border-2 border-stone-700 bg-stone-900 flex flex-col relative">
        {/* Watermark Logo Baru Disamarkan 5% */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 overflow-hidden">
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-10-29_at_11.30.18-removebg-preview_755d6aba.png"
            alt="Watermark Logo"
            style={{ opacity: 0.05 }}
            className="w-[88%] max-w-[420px] object-contain filter drop-shadow-2xl select-none"
          />
        </div>

        {/* Top Sets Header: "0" vs "2" */}
        <div className="w-full grid grid-cols-12 bg-stone-900 text-white font-mono font-bold text-center border-b border-stone-800">
          <div className="col-span-3 bg-stone-900 py-1.5 text-xs text-stone-400" />
          <div className="col-span-4 bg-stone-900 py-1 text-2xl font-black text-white flex items-center justify-center">
            <span>{setsWonA}</span>
          </div>
          <div className="col-span-1 bg-stone-900 py-1 text-xs text-stone-500 flex items-center justify-center font-sans font-bold" />
          <div className="col-span-4 bg-stone-900 py-1 text-2xl font-black text-white flex items-center justify-center">
            <span>{setsWonB}</span>
          </div>
        </div>

        {/* Column Headers: BALAK (GAME) | point team BIRU | VS | point team MERAH */}
        <div className="w-full grid grid-cols-12 text-center font-bold tracking-tight border-b-2 border-stone-800">
          {/* Kolom Balak */}
          <div className="col-span-3 bg-[#F8EED8] text-stone-900 py-3 flex flex-col items-center justify-center border-r border-stone-800">
            <span className="font-black text-sm tracking-wide">BALAK</span>
            <span className="text-xs font-bold text-stone-700">(GAME)</span>
          </div>

          {/* Kolom Tim Biru */}
          <div className="col-span-4 bg-[#1E75C8] text-white py-3 flex flex-col items-center justify-center border-r border-stone-800">
            <span className="text-[11px] font-semibold tracking-wider text-blue-100 uppercase">point team</span>
            <span className="text-2xl font-black tracking-tight">{identity.teamAName || 'BIRU'}</span>
          </div>

          {/* Kolom VS */}
          <div className="col-span-1 bg-[#4A4D52] text-white py-3 flex items-center justify-center border-r border-stone-800">
            <span className="text-base font-black tracking-wider">VS</span>
          </div>

          {/* Kolom Tim Merah */}
          <div className="col-span-4 bg-[#EA1D24] text-white py-3 flex flex-col items-center justify-center">
            <span className="text-[11px] font-semibold tracking-wider text-red-100 uppercase">point team</span>
            <span className="text-2xl font-black tracking-tight">{identity.teamBName || 'MERAH'}</span>
          </div>
        </div>

        {/* 14 Baris Balak (Putaran 1 & Putaran 2) */}
        <div className="w-full divide-y divide-stone-800/80 bg-stone-900 relative z-20">
          {simpleRows.map((row) => {
            const isBiru = row.scoreBiru !== null && row.scoreBiru > 0;
            const isMerah = row.scoreMerah !== null && row.scoreMerah > 0;
            const isCurrent = activeRow.id === row.id;

            return (
              <div
                key={row.id}
                className={`w-full grid grid-cols-12 text-center items-center font-mono font-bold transition-colors ${
                  isCurrent ? 'bg-amber-400/15 ring-2 ring-inset ring-amber-400/50' : 'hover:bg-stone-800/30'
                }`}
                style={{ height: '38px' }}
              >
                {/* Kolom Balak */}
                <div className="col-span-3 bg-[#F8EED8]/95 text-stone-900 font-extrabold text-sm h-full flex items-center justify-center border-r border-stone-800">
                  <span className="font-mono text-base">{row.balakNumber}</span>
                  {isCurrent && <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />}
                </div>

                {/* Kolom Biru */}
                <div className="col-span-4 bg-[#1E75C8]/90 text-white font-mono font-black text-sm h-full flex items-center justify-center border-r border-stone-800">
                  {isBiru ? (
                    <span className="text-base drop-shadow-sm">+{row.scoreBiru}</span>
                  ) : (
                    <span className="text-white/30 text-xs font-normal">-</span>
                  )}
                </div>

                {/* Kolom VS / Putaran */}
                <div className="col-span-1 bg-[#4A4D52]/90 text-stone-400 font-bold text-[11px] h-full flex items-center justify-center border-r border-stone-800">
                  -
                </div>

                {/* Kolom Merah */}
                <div className="col-span-4 bg-[#EA1D24]/90 text-white font-mono font-black text-sm h-full flex items-center justify-center">
                  {isMerah ? (
                    <span className="text-base drop-shadow-sm">+{row.scoreMerah}</span>
                  ) : (
                    <span className="text-white/30 text-xs font-normal">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Skor Bawah & Logo Domino (Exact Replica) */}
        <div className="w-full grid grid-cols-12 text-center items-center border-t-2 border-stone-700 bg-stone-900 relative z-20 min-h-[96px]">
          <div className="col-span-3 bg-stone-900 h-full flex items-center justify-center border-r border-stone-800" />

          {/* Angka Total Biru */}
          <div className="col-span-4 bg-[#1E75C8] h-full py-4 flex items-center justify-center border-r border-stone-800">
            <span className="text-5xl md:text-6xl font-black font-mono text-white tracking-tighter">
              {scoreA}
            </span>
          </div>

          {/* Logo Tengah Bakom */}
          <div className="col-span-1 bg-stone-900 h-full relative flex items-center justify-center overflow-visible border-r border-stone-800">
            <div className="absolute z-30 w-16 h-16 md:w-20 md:h-20 -my-2 flex items-center justify-center">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-10-29_at_11.30.18-removebg-preview_755d6aba.png"
                alt="Bakom Domino Club Logo"
                className="w-full h-full object-contain filter drop-shadow-xl"
              />
            </div>
          </div>

          {/* Angka Total Merah */}
          <div className="col-span-4 bg-[#EA1D24] h-full py-4 flex items-center justify-center">
            <span className="text-5xl md:text-6xl font-black font-mono text-white tracking-tighter">
              {scoreB}
            </span>
          </div>
        </div>

        {/* Kotak Oranye Khas di Bagian Bawah: "BALAK" dan angka balak aktif */}
        <div className="w-full bg-[#F48B00] text-stone-950 py-3.5 px-4 flex flex-col items-center justify-center border-t-2 border-amber-600 relative z-20">
          <span className="text-xs font-black tracking-widest uppercase">BALAK</span>
          <span className="text-4xl md:text-5xl font-black font-mono leading-none mt-1">
            {currentBalakNumber}
          </span>
          <span className="text-[11px] font-bold text-stone-900 mt-1">
            Ditentukan Wasit / Host • Ronde {activeRow.id || currentRound}
          </span>
        </div>
      </div>
    </div>
  );
};
