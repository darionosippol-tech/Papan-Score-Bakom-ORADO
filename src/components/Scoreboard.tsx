/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { MatchConfig, MatchIdentity, TeamId } from '../types/orado';
import confetti from 'canvas-confetti';
import { Trophy, AlertTriangle, Flame, Shield, ArrowRight, Volume2 } from 'lucide-react';
import { playVictorySound } from '../utils/audio';

interface ScoreboardProps {
  identity: MatchIdentity;
  config: MatchConfig;
  scoreA: number;
  scoreB: number;
  setsWonA: number;
  setsWonB: number;
  currentSet: number;
  currentRound: number;
  isMatchCompleted: boolean;
  winner: TeamId | null;
  lastRoundApollo?: boolean;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  identity,
  config,
  scoreA,
  scoreB,
  setsWonA,
  setsWonB,
  currentSet,
  currentRound,
  isMatchCompleted,
  winner,
  lastRoundApollo,
}) => {
  const target = config.targetSetPoints || 101;
  const progressA = Math.min(100, Math.round((scoreA / target) * 100));
  const progressB = Math.min(100, Math.round((scoreB / target) * 100));
  const setsNeeded = config.matchFormat === 'best_of_5' ? 3 : 2;

  // Trigger celebration confetti & victory sound when match is won or 101 reached
  useEffect(() => {
    if (isMatchCompleted || lastRoundApollo || scoreA >= target || scoreB >= target) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Safe fallback if canvas not available
      }
      playVictorySound();
    }
  }, [isMatchCompleted, lastRoundApollo, scoreA, scoreB, target]);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5" />
            Set {currentSet} — Ronde {currentRound}
          </span>
          <span className="text-xs text-stone-400 font-mono">
            Format: {config.matchFormat === 'best_of_5' ? 'Best of 5 (Target 3 Set)' : 'Best of 3 (Target 2 Set)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400 font-medium">Target Set:</span>
          <span className="text-xs font-bold font-mono bg-stone-800 text-amber-400 px-2 py-0.5 rounded border border-stone-700">
            {target} POIN
          </span>
        </div>
      </div>

      {/* Apollo Banner if applicable */}
      {lastRoundApollo && (
        <div className="mb-4 bg-gradient-to-r from-amber-600 to-rose-600 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-200" />
            <div>
              <div className="font-extrabold text-sm tracking-wide">
                KEMENANGAN MUTLAK APOLLO TERCAPAI (101 vs 0)!
              </div>
              <div className="text-xs text-amber-100">
                Sesuai Pasal 18 Regulasi ORADO, tim pemenang memperoleh keunggulan kemenangan set langsung.
              </div>
            </div>
          </div>
          <span className="bg-black/30 text-xs px-2.5 py-1 rounded-lg font-mono font-bold">
            PASAL 18
          </span>
        </div>
      )}

      {/* Match Completed Banner */}
      {isMatchCompleted && winner && (
        <div className="mb-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-emerald-400" />
            <div>
              <div className="font-extrabold text-base">
                PERTANDINGAN SELESAI — PEMENANG: {winner === 'A' ? identity.teamAName : identity.teamBName} (TIM {winner})
              </div>
              <div className="text-xs text-emerald-400/80">
                Selamat kepada {winner === 'A' ? `${identity.playerNames.A1} & ${identity.playerNames.A2}` : `${identity.playerNames.B1} & ${identity.playerNames.B2}`}.
              </div>
            </div>
          </div>
          <span className="bg-emerald-500 text-stone-950 font-black text-xs px-3 py-1.5 rounded-xl uppercase">
            Juara Pertandingan
          </span>
        </div>
      )}

      {/* Main Duel Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
        {/* VS Divider in middle for desktop */}
        <div className="hidden md:flex absolute inset-y-0 left-1/2 -translate-x-1/2 items-center justify-center pointer-events-none z-10">
          <div className="w-9 h-9 rounded-full bg-stone-950 border border-stone-700 flex items-center justify-center text-xs font-black text-stone-400 shadow-md">
            VS
          </div>
        </div>

        {/* TEAM A CARD */}
        <div className={`relative rounded-2xl p-5 border transition-all ${
          scoreA >= target
            ? 'bg-blue-950/40 border-blue-500/80 ring-1 ring-blue-500'
            : 'bg-stone-950/60 border-stone-800/80'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-xs" />
              <h4 className="font-extrabold text-lg text-blue-200 truncate max-w-[200px]" title={identity.teamAName}>
                {identity.teamAName || 'TIM A'}
              </h4>
            </div>
            {/* Sets Won Badges */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400 font-semibold uppercase mr-1">Set:</span>
              {Array.from({ length: setsNeeded }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                    idx < setsWonA
                      ? 'bg-blue-500 text-stone-950 shadow-sm'
                      : 'bg-stone-800 text-stone-500 border border-stone-700'
                  }`}
                >
                  {idx < setsWonA ? '✓' : idx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="text-xs text-stone-400 mb-4 flex items-center gap-2 font-medium">
            <span className="truncate">{identity.playerNames.A1 || 'Pemain A1'}</span>
            <span className="text-stone-600">•</span>
            <span className="truncate">{identity.playerNames.A2 || 'Pemain A2'}</span>
          </div>

          {/* Big Score Display */}
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-black font-mono tracking-tight text-white">
                {scoreA}
              </span>
              <span className="text-xs text-stone-400 font-mono">/ {target}</span>
            </div>
            {scoreA > scoreB && (
              <span className="text-xs font-bold text-blue-400 bg-blue-950/80 border border-blue-800 px-2 py-0.5 rounded-full">
                Memimpin +{scoreA - scoreB}
              </span>
            )}
          </div>

          {/* Progress Bar towards 101 */}
          <div className="w-full bg-stone-800/90 rounded-full h-3 overflow-hidden p-0.5 border border-stone-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                scoreA >= target
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-400'
                  : 'bg-gradient-to-r from-blue-600 to-blue-400'
              }`}
              style={{ width: `${progressA}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-stone-400 font-mono mt-1.5">
            <span>Progres Set {currentSet}</span>
            <span className="font-semibold text-blue-300">{progressA}%</span>
          </div>
        </div>

        {/* TEAM B CARD */}
        <div className={`relative rounded-2xl p-5 border transition-all ${
          scoreB >= target
            ? 'bg-red-950/40 border-red-500/80 ring-1 ring-red-500'
            : 'bg-stone-950/60 border-stone-800/80'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-xs" />
              <h4 className="font-extrabold text-lg text-red-200 truncate max-w-[200px]" title={identity.teamBName}>
                {identity.teamBName || 'TIM MERAH'}
              </h4>
            </div>
            {/* Sets Won Badges */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-400 font-semibold uppercase mr-1">Set:</span>
              {Array.from({ length: setsNeeded }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                    idx < setsWonB
                      ? 'bg-red-500 text-stone-950 shadow-sm'
                      : 'bg-stone-800 text-stone-500 border border-stone-700'
                  }`}
                >
                  {idx < setsWonB ? '✓' : idx + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="text-xs text-stone-400 mb-4 flex items-center gap-2 font-medium">
            <span className="truncate">{identity.playerNames.B1 || 'Pemain Merah 1'}</span>
            <span className="text-stone-600">•</span>
            <span className="truncate">{identity.playerNames.B2 || 'Pemain Merah 2'}</span>
          </div>

          {/* Big Score Display */}
          <div className="flex items-baseline justify-between mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl md:text-6xl font-black font-mono tracking-tight text-white">
                {scoreB}
              </span>
              <span className="text-xs text-stone-400 font-mono">/ {target}</span>
            </div>
            {scoreB > scoreA && (
              <span className="text-xs font-bold text-red-400 bg-red-950/80 border border-red-800 px-2 py-0.5 rounded-full">
                Memimpin +{scoreB - scoreA}
              </span>
            )}
          </div>

          {/* Progress Bar towards 101 */}
          <div className="w-full bg-stone-800/90 rounded-full h-3 overflow-hidden p-0.5 border border-stone-700/50">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                scoreB >= target
                  ? 'bg-gradient-to-r from-red-500 to-rose-400'
                  : 'bg-gradient-to-r from-red-600 to-red-400'
              }`}
              style={{ width: `${progressB}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-stone-400 font-mono mt-1.5">
            <span>Progres Set {currentSet}</span>
            <span className="font-semibold text-red-300">{progressB}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
