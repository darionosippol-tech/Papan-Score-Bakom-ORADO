/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DominoTile, getTileId, MatchConfig, PlayerId, RoundInput } from '../types/orado';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateRoundInput(
  input: RoundInput,
  config: MatchConfig,
  currentScoreA: number,
  currentScoreB: number,
  isSetAlreadyCompleted: boolean
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 12. Set yang sudah selesai
  if (isSetAlreadyCompleted) {
    errors.push('Set ini telah dinyatakan selesai. Tidak dapat menambah ronde baru tanpa prosedur koreksi wasit.');
  }

  // 1. Validasi nilai poin dasar (non-negatif, integer, no NaN)
  const players: PlayerId[] = ['A1', 'A2', 'B1', 'B2'];
  for (const p of players) {
    const pts = input.remainingPoints[p];
    if (typeof pts !== 'number' || isNaN(pts)) {
      errors.push(`Titik sisa pemain ${p} harus berupa angka valid.`);
    } else if (pts < 0) {
      errors.push(`Titik sisa pemain ${p} tidak boleh bernilai negatif (${pts}).`);
    } else if (!Number.isInteger(pts)) {
      errors.push(`Titik sisa pemain ${p} harus berupa bilangan bulat (${pts}).`);
    }
  }

  // Validasi mode lengkap (batu domino)
  if (input.mode === 'complete' && input.remainingTiles) {
    const seenTileIds = new Set<string>();
    let totalTilesCount = 0;

    for (const p of players) {
      const tiles = input.remainingTiles[p] || [];
      if (tiles.length > 7) {
        errors.push(`Pemain ${p} memiliki ${tiles.length} batu tersisa. Maksimal batu awal per pemain adalah 7.`);
      }
      totalTilesCount += tiles.length;

      let playerCalculatedDots = 0;
      for (const tile of tiles) {
        const [a, b] = tile;
        // 3. Angka 0 sampai 6
        if (a < 0 || a > 6 || b < 0 || b > 6 || !Number.isInteger(a) || !Number.isInteger(b)) {
          errors.push(`Batu [${a}, ${b}] pada pemain ${p} tidak valid. Angka harus antara 0 dan 6.`);
        }
        // 4. Tidak boleh ada duplikasi batu
        const tileId = getTileId(tile);
        if (seenTileIds.has(tileId)) {
          errors.push(`Batu domino [${tileId}] muncul lebih dari satu kali! Set double-six hanya memiliki 28 kombinasi unik.`);
        }
        seenTileIds.add(tileId);
        playerCalculatedDots += (a + b);
      }

      // 2. Jumlah titik harus sesuai komposisi batu
      if (input.remainingPoints[p] !== playerCalculatedDots) {
        errors.push(`Total titik pemain ${p} (${input.remainingPoints[p]}) tidak cocok dengan kalkulasi batu (${playerCalculatedDots}).`);
      }
    }

    // 5. Total sisa batu tidak boleh melebihi 28
    if (totalTilesCount > 28) {
      errors.push(`Total batu yang tercatat (${totalTilesCount}) melebihi kapasitas set double-six (28 batu).`);
    }
  }

  // 6. Normal finish checks
  if (input.resultType === 'normal_finish') {
    if (!input.finishingPlayer) {
      errors.push('Pemain yang menghabiskan batu (penutup ronde) harus dipilih pada hasil Kemenangan Normal.');
    } else {
      const finisherPts = input.remainingPoints[input.finishingPlayer];
      if (finisherPts !== 0) {
        errors.push(`Pemain ${input.finishingPlayer} dinyatakan menghabiskan batu, sehingga sisa titik harus bernilai 0 (tercatat: ${finisherPts}).`);
      }
      if (input.mode === 'complete' && input.remainingTiles) {
        const finisherTiles = input.remainingTiles[input.finishingPlayer] || [];
        if (finisherTiles.length !== 0) {
          errors.push(`Pemain ${input.finishingPlayer} masih memiliki ${finisherTiles.length} batu tersisa dalam mode lengkap.`);
        }
      }
    }
  }

  // 7. Beradu checks
  if (input.resultType === 'beradu') {
    // In deadlock, nobody has finished their stones
    if (input.finishingPlayer) {
      warnings.push('Pada kondisi beradu, tidak ada pemain yang menghabiskan seluruh batu.');
    }
    const totalRemainingAll = players.reduce((sum, p) => sum + (input.remainingPoints[p] || 0), 0);
    if (totalRemainingAll === 0) {
      errors.push('Pada kondisi beradu, tidak mungkin seluruh pemain memiliki 0 titik sisa.');
    }
  }

  // 8. Batu terakhir & kesesuaian ujung rangkaian
  if (input.lastTile) {
    const [l1, l2] = input.lastTile;
    if (l1 < 0 || l1 > 6 || l2 < 0 || l2 > 6) {
      errors.push(`Batu terakhir [${l1}, ${l2}] tidak valid.`);
    }

    if (input.bothEndsMatched) {
      if (input.boardLeftEnd !== undefined && input.boardRightEnd !== undefined) {
        const matchesLeft = l1 === input.boardLeftEnd || l2 === input.boardLeftEnd;
        const matchesRight = l1 === input.boardRightEnd || l2 === input.boardRightEnd;
        if (!matchesLeft || !matchesRight) {
          errors.push(`Batu terakhir [${l1}, ${l2}] diklaim cocok kedua ujung, namun ujung meja tercatat [${input.boardLeftEnd}] dan [${input.boardRightEnd}].`);
        }
      }
    }

    if (input.isBalak && l1 !== l2) {
      errors.push(`Batu terakhir [${l1}, ${l2}] ditandai sebagai Balak, namun kedua sisinya tidak kembar.`);
    }
  }

  // 9. Validasi bonus
  if (input.bothEndsMatched && input.resultType !== 'normal_finish') {
    warnings.push('Bonus dua ujung umumnya hanya berlaku bagi pemain yang menutup ronde secara sah.');
  }

  // 10. Validasi penalti duplikat
  const penaltySignatures = new Set<string>();
  for (const pen of input.penalties) {
    const signature = `${pen.playerId}-${pen.violationType}-${pen.penaltyPoints}-${pen.timestamp}`;
    if (penaltySignatures.has(signature)) {
      errors.push(`Terdapat input penalti ganda untuk kejadian yang sama: ${pen.violationType} (${pen.playerId}).`);
    }
    penaltySignatures.add(signature);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
