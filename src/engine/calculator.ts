/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CalculationBreakdown,
  MatchConfig,
  PlayerId,
  RoundInput,
  RuleCitation,
  TeamId
} from '../types/orado';
import { RULES_CATALOG } from './rules';
import { validateRoundInput } from './validator';

export interface ScoreState {
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
}

export function calculateRoundPoints(
  scoreBefore: ScoreState,
  input: RoundInput,
  config: MatchConfig,
  isSetAlreadyCompleted: boolean = false
): CalculationBreakdown {
  const validation = validateRoundInput(
    input,
    config,
    scoreBefore.scoreA,
    scoreBefore.scoreB,
    isSetAlreadyCompleted
  );

  const remainingA1 = input.remainingPoints.A1 || 0;
  const remainingA2 = input.remainingPoints.A2 || 0;
  const remainingB1 = input.remainingPoints.B1 || 0;
  const remainingB2 = input.remainingPoints.B2 || 0;

  const totalRemainingA = remainingA1 + remainingA2;
  const totalRemainingB = remainingB1 + remainingB2;

  let winnerTeam: TeamId | null = null;
  let winnerPlayer: PlayerId | null = null;

  let basePointsA = 0;
  let basePointsB = 0;
  let bonusPointsA = 0;
  let bonusPointsB = 0;
  let penaltyPointsA = 0;
  let penaltyPointsB = 0;

  const formulaExplanation: string[] = [];
  const rulesCited: RuleCitation[] = [];
  let needsRefereeConfirmation = false;
  let confirmationMessage: string | undefined = undefined;

  // 1. Process Penalties first
  if (input.penalties && input.penalties.length > 0) {
    for (const pen of input.penalties) {
      if (pen.recipientTeam === 'A') {
        penaltyPointsA += pen.penaltyPoints;
      } else if (pen.recipientTeam === 'B') {
        penaltyPointsB += pen.penaltyPoints;
      }
      formulaExplanation.push(
        `Penalti [${pen.article}]: ${pen.violationType} oleh ${pen.playerId} (Tim ${pen.teamId}) -> Sanksi +${pen.penaltyPoints} poin untuk Tim ${pen.recipientTeam}`
      );
    }
    rulesCited.push(RULES_CATALOG.PASAL_15);
  }

  // 2. Evaluate Round Results
  if (input.resultType === 'normal_finish') {
    rulesCited.push(RULES_CATALOG.PASAL_7);
    winnerPlayer = input.finishingPlayer || null;

    if (winnerPlayer === 'A1' || winnerPlayer === 'A2') {
      winnerTeam = 'A';
      // Poin dasar A adalah total sisa titik lawan (Tim B)
      basePointsA = totalRemainingB;
      formulaExplanation.push(
        `Kemenangan Normal [Pasal 7]: Pemain ${winnerPlayer} (Tim A) menghabiskan batu. Poin Dasar Tim A = Sisa Tim B (B1: ${remainingB1} + B2: ${remainingB2} = ${totalRemainingB} titik).`
      );

      // Check Balak Bonus (Pasal 13) vs Two-Ends Bonus (Pasal 12)
      const hasBalakBonus = input.isBalak && input.bothEndsMatched && input.noSameSuitLeft;
      const hasTwoEndsBonus = input.bothEndsMatched;

      if (hasBalakBonus) {
        rulesCited.push(RULES_CATALOG.PASAL_13);
        bonusPointsA += config.balakBonusPoints;
        formulaExplanation.push(
          `Bonus Balak di Dua Ujung [Pasal 13]: Batu terakhir balak cocok pada kedua ujung tanpa sisa batu sejenis -> Tambahan +${config.balakBonusPoints} poin.`
        );

        if (config.allowCombineBalakAndDoubleEnd) {
          rulesCited.push(RULES_CATALOG.PASAL_12);
          bonusPointsA += basePointsA; // double base
          formulaExplanation.push(
            `Ketentuan Tambahan Penggabungan Bonus: Diberikan tambahan pengali 2x (+${basePointsA} poin).`
          );
        }
      } else if (hasTwoEndsBonus) {
        rulesCited.push(RULES_CATALOG.PASAL_12);
        // Pasal 12: Pengali 2 (Poin ronde = Poin dasar × 2)
        const multiplier = config.doubleEndMultiplier || 2;
        bonusPointsA += basePointsA * (multiplier - 1);
        formulaExplanation.push(
          `Bonus Dua Ujung Cocok [Pasal 12]: Batu terakhir cocok di kedua ujung terbuka -> Pengali ${multiplier}x (+${basePointsA * (multiplier - 1)} poin bonus). Total poin ronde = ${basePointsA * multiplier}.`
        );
      }
    } else if (winnerPlayer === 'B1' || winnerPlayer === 'B2') {
      winnerTeam = 'B';
      // Poin dasar B adalah total sisa titik lawan (Tim A)
      basePointsB = totalRemainingA;
      formulaExplanation.push(
        `Kemenangan Normal [Pasal 7]: Pemain ${winnerPlayer} (Tim B) menghabiskan batu. Poin Dasar Tim B = Sisa Tim A (A1: ${remainingA1} + A2: ${remainingA2} = ${totalRemainingA} titik).`
      );

      const hasBalakBonus = input.isBalak && input.bothEndsMatched && input.noSameSuitLeft;
      const hasTwoEndsBonus = input.bothEndsMatched;

      if (hasBalakBonus) {
        rulesCited.push(RULES_CATALOG.PASAL_13);
        bonusPointsB += config.balakBonusPoints;
        formulaExplanation.push(
          `Bonus Balak di Dua Ujung [Pasal 13]: Batu terakhir balak cocok pada kedua ujung tanpa sisa batu sejenis -> Tambahan +${config.balakBonusPoints} poin.`
        );

        if (config.allowCombineBalakAndDoubleEnd) {
          rulesCited.push(RULES_CATALOG.PASAL_12);
          bonusPointsB += basePointsB;
          formulaExplanation.push(
            `Ketentuan Tambahan Penggabungan Bonus: Diberikan tambahan pengali 2x (+${basePointsB} poin).`
          );
        }
      } else if (hasTwoEndsBonus) {
        rulesCited.push(RULES_CATALOG.PASAL_12);
        const multiplier = config.doubleEndMultiplier || 2;
        bonusPointsB += basePointsB * (multiplier - 1);
        formulaExplanation.push(
          `Bonus Dua Ujung Cocok [Pasal 12]: Batu terakhir cocok di kedua ujung terbuka -> Pengali ${multiplier}x (+${basePointsB * (multiplier - 1)} poin bonus). Total poin ronde = ${basePointsB * multiplier}.`
        );
      }
    }
  } else if (input.resultType === 'beradu') {
    rulesCited.push(RULES_CATALOG.PASAL_14);
    formulaExplanation.push(
      `Permainan Beradu [Pasal 14]: Rangkaian macet/deadlock. Total sisa titik: Tim A = ${totalRemainingA} (A1: ${remainingA1}, A2: ${remainingA2}) vs Tim B = ${totalRemainingB} (B1: ${remainingB1}, B2: ${remainingB2}).`
    );

    const res = input.beraduResolution;

    if (res === 'needs_referee_confirmation') {
      needsRefereeConfirmation = true;
      confirmationMessage = 'PERLU KONFIRMASI WASIT — aturan perhitungan poin beradu belum dapat ditentukan secara pasti.';
      formulaExplanation.push(
        'PERINGATAN WASIT: Kondisi beradu belum diverifikasi. Skor tidak diubah sampai wasit mengonfirmasi keputusan resmi.'
      );
    } else if (res === 'lowest_team_total_wins') {
      if (totalRemainingA < totalRemainingB) {
        winnerTeam = 'A';
        basePointsA = totalRemainingB;
        formulaExplanation.push(
          `Keputusan Beradu (Total Tim Terendah): Tim A (${totalRemainingA} titik) < Tim B (${totalRemainingB} titik). Tim A menang dan memperoleh sisa titik Tim B (+${totalRemainingB} poin).`
        );
      } else if (totalRemainingB < totalRemainingA) {
        winnerTeam = 'B';
        basePointsB = totalRemainingA;
        formulaExplanation.push(
          `Keputusan Beradu (Total Tim Terendah): Tim B (${totalRemainingB} titik) < Tim A (${totalRemainingA} titik). Tim B menang dan memperoleh sisa titik Tim A (+${totalRemainingA} poin).`
        );
      } else {
        formulaExplanation.push(
          `Keputusan Beradu (Seri/Draw): Total titik kedua tim sama (${totalRemainingA} vs ${totalRemainingB}). Tidak ada tim yang memperoleh poin dasar.`
        );
      }
    } else if (res === 'blocker_lowest_wins') {
      const closingTeam = (input.closingPlayer === 'A1' || input.closingPlayer === 'A2') ? 'A' : 'B';
      winnerTeam = closingTeam;
      if (closingTeam === 'A') {
        basePointsA = totalRemainingB;
        formulaExplanation.push(
          `Keputusan Beradu (Penutup Menang): Pemain penutup ${input.closingPlayer} (Tim A) terkonfirmasi memiliki titik terendah. Tim A memperoleh +${totalRemainingB} poin.`
        );
      } else {
        basePointsB = totalRemainingA;
        formulaExplanation.push(
          `Keputusan Beradu (Penutup Menang): Pemain penutup ${input.closingPlayer} (Tim B) terkonfirmasi memiliki titik terendah. Tim B memperoleh +${totalRemainingA} poin.`
        );
      }
    } else if (res === 'blocker_not_lowest_opponent_wins') {
      const closingTeam = (input.closingPlayer === 'A1' || input.closingPlayer === 'A2') ? 'A' : 'B';
      const opponentTeam = closingTeam === 'A' ? 'B' : 'A';
      winnerTeam = opponentTeam;
      if (opponentTeam === 'A') {
        basePointsA = totalRemainingB;
        formulaExplanation.push(
          `Keputusan Beradu (Lawan Penutup Menang): Pemain penutup ${input.closingPlayer} (Tim B) kalah titik. Tim lawan (Tim A) memperoleh +${totalRemainingB} poin.`
        );
      } else {
        basePointsB = totalRemainingA;
        formulaExplanation.push(
          `Keputusan Beradu (Lawan Penutup Menang): Pemain penutup ${input.closingPlayer} (Tim A) kalah titik. Tim lawan (Tim B) memperoleh +${totalRemainingA} poin.`
        );
      }
    } else if (res === 'tie_draw') {
      formulaExplanation.push(
        'Keputusan Beradu: Ronde dinyatakan Seri / Draw. Tidak ada poin dasar yang diberikan.'
      );
    } else if (res === 'custom_referee_decision') {
      winnerTeam = input.beraduWinnerOverride || null;
      if (winnerTeam === 'A') {
        basePointsA = totalRemainingB;
        formulaExplanation.push(
          `Keputusan Khusus Wasit: Kemenangan diberikan kepada Tim A (+${totalRemainingB} poin). Catatan: ${input.beraduNote || '-'}`
        );
      } else if (winnerTeam === 'B') {
        basePointsB = totalRemainingA;
        formulaExplanation.push(
          `Keputusan Khusus Wasit: Kemenangan diberikan kepada Tim B (+${totalRemainingA} poin). Catatan: ${input.beraduNote || '-'}`
        );
      } else {
        formulaExplanation.push(
          `Keputusan Khusus Wasit: Tanpa pemenang poin dasar. Catatan: ${input.beraduNote || '-'}`
        );
      }
    }
  } else if (input.resultType === 'round_invalid') {
    formulaExplanation.push(
      'Ronde Dibatalkan / Diulang: Tidak ada poin dasar atau bonus yang dicatat untuk ronde ini.'
    );
  } else if (input.resultType === 'special_penalty') {
    rulesCited.push(RULES_CATALOG.PASAL_16);
    formulaExplanation.push(
      'Ronde Berakhir Karena Sanksi Khusus [Pasal 16]: Skor ronde murni berasal dari penalti yang diterapkan.'
    );
  }

  // If referee confirmation needed, freeze round points to 0!
  let totalRoundPointsA = 0;
  let totalRoundPointsB = 0;

  if (needsRefereeConfirmation) {
    totalRoundPointsA = 0;
    totalRoundPointsB = 0;
    basePointsA = 0;
    basePointsB = 0;
    bonusPointsA = 0;
    bonusPointsB = 0;
    penaltyPointsA = 0;
    penaltyPointsB = 0;
    winnerTeam = null;
    formulaExplanation.push(
      'STATUS POIN DIBEKUKAN: Skor tidak berubah sampai konfirmasi wasit selesai.'
    );
  } else {
    totalRoundPointsA = basePointsA + bonusPointsA + penaltyPointsA;
    totalRoundPointsB = basePointsB + bonusPointsB + penaltyPointsB;
  }

  // Accumulation
  const scoreAfterA = scoreBefore.scoreA + totalRoundPointsA;
  const scoreAfterB = scoreBefore.scoreB + totalRoundPointsB;

  // Check Set Completion (Target 101)
  const target = config.targetSetPoints || 101;
  let isSetWon = false;
  let setWinner: TeamId | null = null;

  if (!needsRefereeConfirmation) {
    if (scoreAfterA >= target && scoreAfterB < target) {
      isSetWon = true;
      setWinner = 'A';
    } else if (scoreAfterB >= target && scoreAfterA < target) {
      isSetWon = true;
      setWinner = 'B';
    } else if (scoreAfterA >= target && scoreAfterB >= target) {
      // Both pass 101 in same round
      isSetWon = true;
      setWinner = scoreAfterA > scoreAfterB ? 'A' : scoreAfterB > scoreAfterA ? 'B' : null;
    }
  }

  // Apollo Check [Pasal 18]
  // Kasus 5: Tim A mencapai >= 101 poin sementara tim lawan masih 0 poin
  let isApollo = false;
  let apolloDetails: string | undefined = undefined;

  if (isSetWon && setWinner) {
    if (setWinner === 'A' && scoreAfterB === 0 && scoreAfterA >= target) {
      isApollo = true;
      apolloDetails = `KONDISI APOLLO [Pasal 18]! Tim A mencapai ${scoreAfterA} poin sementara Tim B masih 0 poin. Kemenangan mutlak terdeteksi.`;
      rulesCited.push(RULES_CATALOG.PASAL_18);
    } else if (setWinner === 'B' && scoreAfterA === 0 && scoreAfterB >= target) {
      isApollo = true;
      apolloDetails = `KONDISI APOLLO [Pasal 18]! Tim B mencapai ${scoreAfterB} poin sementara Tim A masih 0 poin. Kemenangan mutlak terdeteksi.`;
      rulesCited.push(RULES_CATALOG.PASAL_18);
    }
  }

  // Match progression
  let setsAfterA = scoreBefore.setsA;
  let setsAfterB = scoreBefore.setsB;
  let isMatchWon = false;
  let matchWinner: TeamId | null = null;

  const setsNeededToWin = config.matchFormat === 'best_of_5' ? 3 : 2;

  if (isSetWon && setWinner) {
    rulesCited.push(RULES_CATALOG.PASAL_4);
    if (isApollo && config.apolloEffect === 'double_set') {
      // Apollo awards 2 sets in one go
      if (setWinner === 'A') {
        setsAfterA += 2;
        formulaExplanation.push(
          'Efek Apollo [Regulasi ORADO]: Kemenangan 2 set langsung diberikan kepada Tim A.'
        );
      } else {
        setsAfterB += 2;
        formulaExplanation.push(
          'Efek Apollo [Regulasi ORADO]: Kemenangan 2 set langsung diberikan kepada Tim B.'
        );
      }
    } else if (isApollo && config.apolloEffect === 'instant_match') {
      // Instant match win
      if (setWinner === 'A') {
        setsAfterA = setsNeededToWin;
        formulaExplanation.push(
          'Efek Apollo [Regulasi Turnamen Khusus]: Kemenangan pertandingan langsung diberikan kepada Tim A.'
        );
      } else {
        setsAfterB = setsNeededToWin;
        formulaExplanation.push(
          'Efek Apollo [Regulasi Turnamen Khusus]: Kemenangan pertandingan langsung diberikan kepada Tim B.'
        );
      }
    } else {
      if (setWinner === 'A') setsAfterA += 1;
      if (setWinner === 'B') setsAfterB += 1;
    }

    if (setsAfterA >= setsNeededToWin) {
      isMatchWon = true;
      matchWinner = 'A';
      formulaExplanation.push(
        `Pertandingan Selesai: Tim A memenangkan pertandingan (${setsAfterA} set vs ${setsAfterB} set). Format: ${config.matchFormat.toUpperCase()}.`
      );
    } else if (setsAfterB >= setsNeededToWin) {
      isMatchWon = true;
      matchWinner = 'B';
      formulaExplanation.push(
        `Pertandingan Selesai: Tim B memenangkan pertandingan (${setsAfterB} set vs ${setsAfterA} set). Format: ${config.matchFormat.toUpperCase()}.`
      );
    }
  }

  // Deduplicate rules cited
  const uniqueRulesCited: RuleCitation[] = [];
  const seenArticles = new Set<string>();
  for (const r of rulesCited) {
    if (!seenArticles.has(r.article)) {
      seenArticles.add(r.article);
      uniqueRulesCited.push(r);
    }
  }

  return {
    isValid: validation.isValid,
    validationErrors: validation.errors,
    winnerTeam,
    winnerPlayer,
    remainingA1,
    remainingA2,
    remainingB1,
    remainingB2,
    totalRemainingA,
    totalRemainingB,
    basePointsA,
    basePointsB,
    bonusPointsA,
    bonusPointsB,
    penaltyPointsA,
    penaltyPointsB,
    totalRoundPointsA,
    totalRoundPointsB,
    scoreBeforeA: scoreBefore.scoreA,
    scoreBeforeB: scoreBefore.scoreB,
    scoreAfterA,
    scoreAfterB,
    setsBeforeA: scoreBefore.setsA,
    setsBeforeB: scoreBefore.setsB,
    setsAfterA,
    setsAfterB,
    isApollo,
    apolloDetails,
    isSetWon,
    setWinner,
    isMatchWon,
    matchWinner,
    needsRefereeConfirmation,
    confirmationMessage,
    formulaExplanation,
    rulesCited: uniqueRulesCited
  };
}
