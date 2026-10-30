/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ALL_DOMINO_TILES, DominoTile, getTileDots, getTileId, isBalakTile, PlayerId } from '../types/orado';
import { DominoTileView } from './DominoTileView';
import { X, Check, Trash2, Info } from 'lucide-react';

interface DominoTileSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePlayer: PlayerId;
  playerNames: Record<PlayerId, string>;
  allPlayerTiles: Record<PlayerId, DominoTile[]>;
  onUpdatePlayerTiles: (player: PlayerId, tiles: DominoTile[]) => void;
}

export const DominoTileSelectorModal: React.FC<DominoTileSelectorModalProps> = ({
  isOpen,
  onClose,
  activePlayer: initialPlayer,
  playerNames,
  allPlayerTiles,
  onUpdatePlayerTiles,
}) => {
  const [currentPlayer, setCurrentPlayer] = useState<PlayerId>(initialPlayer);

  if (!isOpen) return null;

  // Build a lookup of which tile belongs to which player
  const tileOwnership = new Map<string, PlayerId>();
  (['A1', 'A2', 'B1', 'B2'] as PlayerId[]).forEach((p) => {
    (allPlayerTiles[p] || []).forEach((tile) => {
      tileOwnership.set(getTileId(tile), p);
    });
  });

  const currentTiles = allPlayerTiles[currentPlayer] || [];
  const currentTotalDots = currentTiles.reduce((sum, t) => sum + getTileDots(t), 0);

  const toggleTile = (tile: DominoTile) => {
    const id = getTileId(tile);
    const owner = tileOwnership.get(id);

    if (owner && owner !== currentPlayer) {
      // Tile already owned by another player!
      return;
    }

    if (owner === currentPlayer) {
      // Remove tile from current player
      const updated = currentTiles.filter((t) => getTileId(t) !== id);
      onUpdatePlayerTiles(currentPlayer, updated);
    } else {
      // Add tile to current player (max 7)
      if (currentTiles.length >= 7) {
        alert(`Pemain ${currentPlayer} sudah mencapai batas maksimal 7 batu domino.`);
        return;
      }
      const updated = [...currentTiles, tile];
      onUpdatePlayerTiles(currentPlayer, updated);
    }
  };

  const clearCurrentPlayerTiles = () => {
    onUpdatePlayerTiles(currentPlayer, []);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div>
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <span>Batu Domino Sisa — Mode Lengkap (28 Batu)</span>
            </h3>
            <p className="text-xs text-stone-400">
              Pilih batu domino yang masih tersisa di tangan pemain untuk menghitung total titik otomatis.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Tabs */}
        <div className="flex bg-stone-950/70 border-b border-stone-800 px-6 py-2 gap-2 overflow-x-auto">
          {(['A1', 'A2', 'B1', 'B2'] as PlayerId[]).map((p) => {
            const isTeamA = p.startsWith('A');
            const pTiles = allPlayerTiles[p] || [];
            const pDots = pTiles.reduce((s, t) => s + getTileDots(t), 0);
            const isSelected = p === currentPlayer;

            return (
              <button
                key={p}
                onClick={() => setCurrentPlayer(p)}
                className={`flex-1 min-w-[140px] px-3 py-2 rounded-xl text-left border transition-all ${
                  isSelected
                    ? isTeamA
                      ? 'bg-blue-950/80 border-blue-500 text-blue-200 ring-1 ring-blue-400'
                      : 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-1 ring-emerald-400'
                    : 'bg-stone-900/60 border-stone-800 text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{p} ({isTeamA ? 'Tim A' : 'Tim B'})</span>
                  <span className="font-mono bg-stone-800 px-1.5 py-0.5 rounded text-[10px]">
                    {pTiles.length}/7 batu
                  </span>
                </div>
                <div className="text-xs truncate font-medium text-stone-300">
                  {playerNames[p]}
                </div>
                <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                  Total: {pDots} titik
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Active Player Status Bar */}
          <div className="flex items-center justify-between bg-stone-800/60 rounded-xl p-3 border border-stone-700/60">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Mengedit Pemain:
              </span>
              <span className="text-sm font-bold text-amber-400">
                {currentPlayer} — {playerNames[currentPlayer]}
              </span>
              <span className="bg-stone-900 border border-stone-700 px-2 py-0.5 rounded text-xs font-mono text-emerald-400">
                {currentTiles.length} batu ({currentTotalDots} titik)
              </span>
            </div>
            {currentTiles.length > 0 && (
              <button
                onClick={clearCurrentPlayerTiles}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1 rounded-lg border border-rose-800/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan ({currentPlayer})</span>
              </button>
            )}
          </div>

          {/* 28 Domino Tiles Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-medium text-stone-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Klik batu untuk menambah/menghapus dari {currentPlayer}. Batu berwarna menunjukkan pemain lain.</span>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3 justify-items-center">
              {ALL_DOMINO_TILES.map((tile) => {
                const id = getTileId(tile);
                const owner = tileOwnership.get(id);
                const isOwnedByCurrent = owner === currentPlayer;
                const isOwnedByOther = owner && owner !== currentPlayer;
                const isBalak = isBalakTile(tile);

                return (
                  <div key={id} className="relative flex flex-col items-center">
                    <DominoTileView
                      tile={tile}
                      size="sm"
                      isSelected={isOwnedByCurrent}
                      onClick={() => toggleTile(tile)}
                      highlightBalak={isBalak}
                    />
                    {isOwnedByOther && (
                      <span className={`mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        owner.startsWith('A') ? 'bg-blue-900 text-blue-200' : 'bg-emerald-900 text-emerald-200'
                      }`}>
                        {owner}
                      </span>
                    )}
                    {isOwnedByCurrent && (
                      <span className="mt-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-black">
                        {currentPlayer}
                      </span>
                    )}
                    {!owner && (
                      <span className="mt-1 text-[10px] font-mono text-stone-500">
                        {tile[0]}-{tile[1]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="text-xs text-stone-400 font-mono">
            Total Batu Digunakan: {tileOwnership.size} / 28 batu double-six
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-5 py-2 rounded-xl text-sm transition-all shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Selesai & Simpan Batu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
