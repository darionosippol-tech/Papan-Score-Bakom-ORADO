/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DominoTile, isBalakTile } from '../types/orado';

interface DominoTileViewProps {
  tile: DominoTile;
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'vertical' | 'horizontal';
  isSelected?: boolean;
  onClick?: () => void;
  showDotsTotal?: boolean;
  highlightBalak?: boolean;
}

export const DominoTileView: React.FC<DominoTileViewProps> = ({
  tile,
  size = 'md',
  orientation = 'vertical',
  isSelected = false,
  onClick,
  showDotsTotal = false,
  highlightBalak = true,
}) => {
  const [top, bottom] = tile;
  const isBalak = isBalakTile(tile);

  const sizeClasses = {
    sm: orientation === 'vertical' ? 'w-8 h-16' : 'w-16 h-8',
    md: orientation === 'vertical' ? 'w-11 h-22' : 'w-22 h-11',
    lg: orientation === 'vertical' ? 'w-14 h-28' : 'w-28 h-14'
  }[size];

  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  }[size];

  // Render domino pips (0 to 6) in a 3x3 grid layout
  const renderHalf = (dots: number) => {
    // 3x3 grid positions:
    // [0, 1, 2]
    // [3, 4, 5]
    // [6, 7, 8]
    const pips: number[] = [];
    if (dots === 1) pips.push(4);
    else if (dots === 2) pips.push(0, 8);
    else if (dots === 3) pips.push(0, 4, 8);
    else if (dots === 4) pips.push(0, 2, 6, 8);
    else if (dots === 5) pips.push(0, 2, 4, 6, 8);
    else if (dots === 6) pips.push(0, 2, 3, 5, 6, 8);

    return (
      <div className="relative flex-1 grid grid-cols-3 grid-rows-3 p-1 place-items-center w-full h-full">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
          const hasDot = pips.includes(index);
          return (
            <div key={index} className="flex items-center justify-center w-full h-full">
              {hasDot && (
                <div
                  className={`${dotSizeClasses} rounded-full ${
                    isBalak && highlightBalak ? 'bg-amber-600 shadow-sm' : 'bg-slate-900'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`relative select-none transition-all duration-150 cursor-pointer rounded-lg border-2 flex ${
        orientation === 'vertical' ? 'flex-col' : 'flex-row'
      } ${sizeClasses} ${
        isSelected
          ? 'border-emerald-500 bg-amber-50 ring-2 ring-emerald-400 shadow-md scale-105'
          : 'border-stone-400 bg-stone-100 hover:border-stone-600 hover:bg-stone-50 shadow-sm'
      } ${isBalak && highlightBalak ? 'ring-1 ring-amber-400/50' : ''}`}
      title={`Batu Domino [${top}-${bottom}] (${top + bottom} titik)${isBalak ? ' - Balak' : ''}`}
    >
      {renderHalf(top)}
      {/* Divider Line */}
      <div
        className={`${
          orientation === 'vertical' ? 'w-4/5 h-[1.5px] mx-auto' : 'h-4/5 w-[1.5px] my-auto'
        } bg-stone-300 rounded-full`}
      />
      {renderHalf(bottom)}

      {/* Balak badge */}
      {isBalak && highlightBalak && size !== 'sm' && (
        <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full shadow-xs">
          B
        </span>
      )}

      {/* Dots total overlay if requested */}
      {showDotsTotal && (
        <span className="absolute -bottom-1 -left-1 bg-slate-800 text-white text-[9px] font-mono px-1 rounded-sm shadow-xs">
          {top + bottom}
        </span>
      )}
    </div>
  );
};
