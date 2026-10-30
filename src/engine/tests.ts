/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchConfig, RoundInput } from '../types/orado';
import { calculateRoundPoints } from './calculator';
import { validateRoundInput } from './validator';

export interface TestCaseResult {
  id: string;
  name: string;
  category: 'wajib' | 'batas';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
  inputDescription: string;
}

const DEFAULT_CONFIG: MatchConfig = {
  targetSetPoints: 101,
  matchFormat: 'best_of_3',
  apolloEffect: 'double_set',
  doubleEndMultiplier: 2,
  balakBonusPoints: 50,
  allowCombineBalakAndDoubleEnd: false,
  standardPenaltyPoints: 11,
  rulesVersion: 'The Law of Domino 101 ORADO (Revisi 2026)'
};

export function runAllAutomatedTests(): TestCaseResult[] {
  const results: TestCaseResult[] = [];

  // ==========================================
  // KASUS 1: Kemenangan Normal
  // ==========================================
  {
    const scoreBefore = { scoreA: 75, scoreB: 80, setsA: 0, setsB: 0 };
    const input: RoundInput = {
      mode: 'quick',
      resultType: 'normal_finish',
      finishingPlayer: 'A1',
      remainingPoints: { A1: 0, A2: 0, B1: 8, B2: 12 }, // Total B = 20
      remainingTiles: { A1: [], A2: [], B1: [], B2: [] },
      bothEndsMatched: false,
      isBalak: false,
      noSameSuitLeft: false,
      beraduResolution: 'needs_referee_confirmation',
      penalties: []
    };

    const res = calculateRoundPoints(scoreBefore, input, DEFAULT_CONFIG);
    const passed =
      res.totalRoundPointsA === 20 &&
      res.totalRoundPointsB === 0 &&
      res.scoreAfterA === 95 &&
      res.scoreAfterB === 80 &&
      res.isSetWon === false;

    results.push({
      id: 'KASUS-1',
      name: 'Kasus 1 — Kemenangan Normal',
      category: 'wajib',
      passed,
      expected: 'Poin ronde A: 20, Skor baru A: 95, Skor baru B: 80, Set belum selesai',
      actual: `Poin ronde A: ${res.totalRoundPointsA}, Skor baru A: ${res.scoreAfterA}, Skor baru B: ${res.scoreAfterB}, Set selesai: ${res.isSetWon}`,
      inputDescription: 'Skor 75 - 80, A1 habiskan batu, sisa B: 20 (8+12), tanpa bonus/penalti.'
    });
  }

  // ==========================================
  // KASUS 2: Bonus Dua Ujung Cocok
  // ==========================================
  {
    const scoreBefore = { scoreA: 75, scoreB: 80, setsA: 0, setsB: 0 };
    const input: RoundInput = {
      mode: 'quick',
      resultType: 'normal_finish',
      finishingPlayer: 'A1',
      remainingPoints: { A1: 0, A2: 0, B1: 10, B2: 10 }, // Total B = 20
      remainingTiles: { A1: [], A2: [], B1: [], B2: [] },
      bothEndsMatched: true, // Bonus 2 ujung terverifikasi
      isBalak: false,
      noSameSuitLeft: false,
      beraduResolution: 'needs_referee_confirmation',
      penalties: []
    };

    const res = calculateRoundPoints(scoreBefore, input, DEFAULT_CONFIG);
    const passed =
      res.basePointsA === 20 &&
      res.totalRoundPointsA === 40 &&
      res.scoreAfterA === 115 &&
      res.scoreAfterB === 80 &&
      res.isSetWon === true &&
      res.setWinner === 'A';

    results.push({
      id: 'KASUS-2',
      name: 'Kasus 2 — Bonus Dua Ujung Cocok',
      category: 'wajib',
      passed,
      expected: 'Poin dasar: 20, Total poin ronde A: 40, Skor baru A: 115, Tim A menang set (>=101)',
      actual: `Poin dasar: ${res.basePointsA}, Total poin: ${res.totalRoundPointsA}, Skor baru A: ${res.scoreAfterA}, Set menang: ${res.isSetWon} (${res.setWinner})`,
      inputDescription: 'Skor 75 - 80, A1 habiskan batu, sisa B: 20, Bonus dua ujung terverifikasi (2x).'
    });
  }

  // ==========================================
  // KASUS 3: Penalti
  // ==========================================
  {
    const scoreBefore = { scoreA: 30, scoreB: 40, setsA: 0, setsB: 0 };
    const input: RoundInput = {
      mode: 'quick',
      resultType: 'special_penalty',
      remainingPoints: { A1: 0, A2: 0, B1: 0, B2: 0 },
      remainingTiles: { A1: [], A2: [], B1: [], B2: [] },
      bothEndsMatched: false,
      isBalak: false,
      noSameSuitLeft: false,
      beraduResolution: 'needs_referee_confirmation',
      penalties: [
        {
          id: 'pen-1',
          timestamp: new Date().toISOString(),
          playerId: 'A1',
          teamId: 'A',
          violationType: 'Melebihi Batas Waktu Berpikir',
          article: 'Pasal 15',
          penaltyPoints: 11,
          recipientTeam: 'B'
        }
      ]
    };

    const res = calculateRoundPoints(scoreBefore, input, DEFAULT_CONFIG);
    const passed =
      res.penaltyPointsB === 11 &&
      res.scoreAfterA === 30 &&
      res.scoreAfterB === 51;

    results.push({
      id: 'KASUS-3',
      name: 'Kasus 3 — Penalti 11 Poin',
      category: 'wajib',
      passed,
      expected: 'Tambahan B: +11, Skor baru A: 30, Skor baru B: 51',
      actual: `Tambahan B: +${res.penaltyPointsB}, Skor baru A: ${res.scoreAfterA}, Skor baru B: ${res.scoreAfterB}`,
      inputDescription: 'Skor 30 - 40, Tim A pelanggaran Pasal 15 sanksi 11 poin untuk B.'
    });
  }

  // ==========================================
  // KASUS 4: Beradu Belum Terverifikasi
  // ==========================================
  {
    const scoreBefore = { scoreA: 45, scoreB: 50, setsA: 0, setsB: 0 };
    const input: RoundInput = {
      mode: 'quick',
      resultType: 'beradu',
      remainingPoints: { A1: 8, A2: 10, B1: 12, B2: 10 }, // Total A = 18, Total B = 22
      remainingTiles: { A1: [], A2: [], B1: [], B2: [] },
      bothEndsMatched: false,
      isBalak: false,
      noSameSuitLeft: false,
      beraduResolution: 'needs_referee_confirmation', // Unverified!
      penalties: []
    };

    const res = calculateRoundPoints(scoreBefore, input, DEFAULT_CONFIG);
    const passed =
      res.totalRemainingA === 18 &&
      res.totalRemainingB === 22 &&
      res.winnerTeam === null &&
      res.scoreAfterA === 45 &&
      res.scoreAfterB === 50 &&
      res.needsRefereeConfirmation === true &&
      res.confirmationMessage?.includes('PERLU KONFIRMASI WASIT') === true;

    results.push({
      id: 'KASUS-4',
      name: 'Kasus 4 — Beradu yang Belum Terverifikasi',
      category: 'wajib',
      passed,
      expected: 'Sisa A: 18, Sisa B: 22, Tanpa pemenang otomatis, Skor tidak berubah (45 - 50), Pesan PERLU KONFIRMASI WASIT',
      actual: `Sisa A: ${res.totalRemainingA}, Sisa B: ${res.totalRemainingB}, Pemenang: ${res.winnerTeam ?? 'null'}, Skor A: ${res.scoreAfterA}, Skor B: ${res.scoreAfterB}, Konfirmasi: ${res.needsRefereeConfirmation ? 'YA' : 'TIDAK'}`,
      inputDescription: 'Permainan beradu, Sisa A=18, Sisa B=22, ketentuan blocker belum terverifikasi.'
    });
  }

  // ==========================================
  // KASUS 5: Apollo
  // ==========================================
  {
    const scoreBefore = { scoreA: 95, scoreB: 0, setsA: 0, setsB: 0 };
    const input: RoundInput = {
      mode: 'quick',
      resultType: 'normal_finish',
      finishingPlayer: 'A1',
      remainingPoints: { A1: 0, A2: 0, B1: 6, B2: 4 }, // Total B = 10
      remainingTiles: { A1: [], A2: [], B1: [], B2: [] },
      bothEndsMatched: false,
      isBalak: false,
      noSameSuitLeft: false,
      beraduResolution: 'needs_referee_confirmation',
      penalties: []
    };

    const res = calculateRoundPoints(scoreBefore, input, DEFAULT_CONFIG);
    const passed =
      res.scoreAfterA === 105 &&
      res.scoreAfterB === 0 &&
      res.isApollo === true &&
      res.isSetWon === true &&
      res.setWinner === 'A';

    results.push({
      id: 'KASUS-5',
      name: 'Kasus 5 — Kondisi Apollo (101 vs 0)',
      category: 'wajib',
      passed,
      expected: 'Skor A: 105, Skor B: 0, Kondisi Apollo terdeteksi, Tim A memenangkan set',
      actual: `Skor A: ${res.scoreAfterA}, Skor B: ${res.scoreAfterB}, Apollo: ${res.isApollo ? 'TERDETEKSI' : 'TIDAK'}, Pemenang Set: ${res.setWinner}`,
      inputDescription: 'Skor 95 - 0, Tim A memperoleh 10 poin sah -> 105 - 0.'
    });
  }

  // ==========================================
  // KASUS 6: Bonus Balak di Dua Ujung (+50 Poin)
  // ==========================================
  {
    const scoreBefore = { scoreA: 20, scoreB: 30, setsA: 0, setsB: 0 };
    const input: RoundInput = {
      mode: 'quick',
      resultType: 'normal_finish',
      finishingPlayer: 'B2',
      remainingPoints: { A1: 15, A2: 5, B1: 4, B2: 0 }, // Sisa A = 20
      remainingTiles: { A1: [], A2: [], B1: [], B2: [] },
      lastTile: [4, 4],
      isBalak: true,
      bothEndsMatched: true,
      noSameSuitLeft: true,
      beraduResolution: 'needs_referee_confirmation',
      penalties: []
    };

    const res = calculateRoundPoints(scoreBefore, input, DEFAULT_CONFIG);
    // Base B = 20, Balak bonus = +50 -> total = 70
    const passed =
      res.basePointsB === 20 &&
      res.bonusPointsB === 50 &&
      res.totalRoundPointsB === 70 &&
      res.scoreAfterB === 100;

    results.push({
      id: 'KASUS-6',
      name: 'Kasus 6 — Bonus Balak di Dua Ujung (+50 Poin)',
      category: 'batas',
      passed,
      expected: 'Poin dasar: 20, Bonus Balak: +50, Total ronde: 70, Skor baru B: 100',
      actual: `Poin dasar: ${res.basePointsB}, Bonus Balak: +${res.bonusPointsB}, Total: ${res.totalRoundPointsB}, Skor B: ${res.scoreAfterB}`,
      inputDescription: 'B2 menutup dengan Balak [4-4], cocok dua ujung, tidak ada sisa sejenis.'
    });
  }

  // ==========================================
  // KASUS 7: Validasi Duplikasi Batu (Mode Lengkap)
  // ==========================================
  {
    const input: RoundInput = {
      mode: 'complete',
      resultType: 'normal_finish',
      finishingPlayer: 'A1',
      remainingPoints: { A1: 0, A2: 6, B1: 6, B2: 0 },
      remainingTiles: {
        A1: [],
        A2: [[3, 3]], // 6 dots
        B1: [[3, 3]], // DUPLICATE TILE! [3-3] already in A2!
        B2: []
      },
      bothEndsMatched: false,
      isBalak: false,
      noSameSuitLeft: false,
      beraduResolution: 'needs_referee_confirmation',
      penalties: []
    };

    const validation = validateRoundInput(input, DEFAULT_CONFIG, 0, 0, false);
    const hasDuplicateError = validation.errors.some(err => err.includes('muncul lebih dari satu kali'));

    results.push({
      id: 'KASUS-7',
      name: 'Kasus 7 — Validasi Duplikasi Batu Domino',
      category: 'batas',
      passed: !validation.isValid && hasDuplicateError,
      expected: 'Validasi menolak input karena batu [3-3] muncul dua kali',
      actual: validation.isValid ? 'Validasi lolos keliru' : `Validasi berhasil menolak: "${validation.errors.find(e => e.includes('muncul'))}"`,
      inputDescription: 'Pemain A2 dan B1 sama-sama memegang batu [3-3] (duplikasi ilegal).'
    });
  }

  // ==========================================
  // KASUS 8: Beradu Terverifikasi (Total Titik Terendah Menang)
  // ==========================================
  {
    const scoreBefore = { scoreA: 50, scoreB: 50, setsA: 0, setsB: 0 };
    const input: RoundInput = {
      mode: 'quick',
      resultType: 'beradu',
      remainingPoints: { A1: 5, A2: 6, B1: 10, B2: 8 }, // Total A = 11, Total B = 18
      remainingTiles: { A1: [], A2: [], B1: [], B2: [] },
      bothEndsMatched: false,
      isBalak: false,
      noSameSuitLeft: false,
      beraduResolution: 'lowest_team_total_wins',
      penalties: []
    };

    const res = calculateRoundPoints(scoreBefore, input, DEFAULT_CONFIG);
    const passed =
      res.winnerTeam === 'A' &&
      res.basePointsA === 18 &&
      res.scoreAfterA === 68 &&
      res.scoreAfterB === 50;

    results.push({
      id: 'KASUS-8',
      name: 'Kasus 8 — Beradu Terverifikasi (Total Tim Terendah Menang)',
      category: 'batas',
      passed,
      expected: 'Tim A menang (11 < 18), Poin dasar A: +18 (sisa B), Skor baru A: 68, B: 50',
      actual: `Pemenang: Tim ${res.winnerTeam}, Poin dasar A: +${res.basePointsA}, Skor A: ${res.scoreAfterA}, B: ${res.scoreAfterB}`,
      inputDescription: 'Beradu terverifikasi, sisa A=11, sisa B=18 -> Tim A menang poin sisa B.'
    });
  }

  return results;
}
