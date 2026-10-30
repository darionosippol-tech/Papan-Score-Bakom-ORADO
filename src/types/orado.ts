/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PlayerId = 'A1' | 'A2' | 'B1' | 'B2';
export type TeamId = 'A' | 'B';

// Domino tile represented as a tuple of numbers [0..6, 0..6]
export type DominoTile = [number, number];

export interface MatchIdentity {
  matchNumber: string;
  tournamentName: string;
  tableNumber: string;
  teamAName: string;
  teamBName: string;
  playerNames: Record<PlayerId, string>;
  setNumber: number;
  roundNumber: number;
  rulesVersion: string;
}

export type MatchFormat = 'best_of_3' | 'best_of_5';
export type ApolloEffect = 'double_set' | 'instant_match' | 'standard_flag';

export interface MatchConfig {
  targetSetPoints: number; // default 101
  matchFormat: MatchFormat; // default 'best_of_3'
  apolloEffect: ApolloEffect; // default 'double_set'
  doubleEndMultiplier: number; // default 2
  balakBonusPoints: number; // default 50
  allowCombineBalakAndDoubleEnd: boolean; // default false
  standardPenaltyPoints: number; // default 11 (Pasal 15 revisi 2026)
  rulesVersion: string;
}

export type RoundResultType = 
  | 'normal_finish'    // Pemain menghabiskan seluruh batu
  | 'beradu'           // Permainan beradu atau macet (deadlock)
  | 'round_invalid'    // Ronde tidak valid / harus diulang
  | 'special_penalty'; // Ronde berakhir karena sanksi khusus

export type BeraduResolution =
  | 'needs_referee_confirmation'      // PERLU KONFIRMASI WASIT
  | 'lowest_team_total_wins'          // Tim dengan total titik terkecil menang
  | 'blocker_lowest_wins'             // Pemain penutup punya titik terkecil dibanding lawan -> Tim penutup menang
  | 'blocker_not_lowest_opponent_wins'// Pemain penutup kalah titik -> Tim lawan menang
  | 'tie_draw'                        // Seri / Draw (batu sama, poin 0 / diulang)
  | 'custom_referee_decision';        // Keputusan khusus wasit dengan poin manual

export interface PenaltyRecord {
  id: string;
  timestamp: string;
  playerId: PlayerId;
  teamId: TeamId;
  violationType: string;
  article: string;
  penaltyPoints: number;
  recipientTeam: TeamId;
  note?: string;
}

export interface RoundInput {
  mode: 'quick' | 'complete';
  resultType: RoundResultType;
  finishingPlayer?: PlayerId;
  
  // Point values (either direct in quick mode, or calculated from remainingTiles in complete mode)
  remainingPoints: Record<PlayerId, number>;
  
  // Only in complete mode
  remainingTiles: Record<PlayerId, DominoTile[]>;
  
  // Special condition data
  lastTile?: DominoTile;
  boardLeftEnd?: number;
  boardRightEnd?: number;
  bothEndsMatched: boolean;
  isBalak: boolean;
  noSameSuitLeft: boolean;
  
  // Beradu details
  closingPlayer?: PlayerId;
  beraduResolution: BeraduResolution;
  beraduWinnerOverride?: TeamId;
  beraduNote?: string;
  
  // Penalties
  penalties: PenaltyRecord[];
  
  notes?: string;
}

export interface RuleCitation {
  article: string;
  title: string;
  description: string;
  status: 'TERVERIFIKASI' | 'PERLU_KONFIRMASI_WASIT';
  details?: string;
}

export interface CalculationBreakdown {
  isValid: boolean;
  validationErrors: string[];
  winnerTeam: TeamId | null;
  winnerPlayer?: PlayerId | null;
  
  // Sisa titik
  remainingA1: number;
  remainingA2: number;
  remainingB1: number;
  remainingB2: number;
  totalRemainingA: number;
  totalRemainingB: number;

  // Breakdown poin ronde
  basePointsA: number;
  basePointsB: number;
  bonusPointsA: number;
  bonusPointsB: number;
  penaltyPointsA: number;
  penaltyPointsB: number;
  
  totalRoundPointsA: number;
  totalRoundPointsB: number;

  // Skor akumulasi
  scoreBeforeA: number;
  scoreBeforeB: number;
  scoreAfterA: number;
  scoreAfterB: number;
  
  // Sets & Match
  setsBeforeA: number;
  setsBeforeB: number;
  setsAfterA: number;
  setsAfterB: number;
  
  isApollo: boolean;
  apolloDetails?: string;
  
  isSetWon: boolean;
  setWinner: TeamId | null;
  
  isMatchWon: boolean;
  matchWinner: TeamId | null;
  
  needsRefereeConfirmation: boolean;
  confirmationMessage?: string;
  
  formulaExplanation: string[];
  rulesCited: RuleCitation[];
}

export interface ConfirmedRound {
  id: string;
  roundNumber: number;
  setNumber: number;
  timestamp: string;
  inputSnapshot: RoundInput;
  calculation: CalculationBreakdown;
  operatorName: string;
  verifiedByReferee: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'CONFIRM_ROUND' | 'DELETE_ROUND' | 'EDIT_ROUND' | 'MANUAL_SCORE_ADJUST' | 'RESET_MATCH' | 'CONFIG_CHANGE';
  operatorName: string;
  roundNumber?: number;
  setNumber?: number;
  reason: string;
  previousValue?: string;
  newValue?: string;
  details?: any;
}

export interface MatchState {
  identity: MatchIdentity;
  config: MatchConfig;
  currentSet: number;
  currentRound: number;
  scoreA: number;
  scoreB: number;
  setsWonA: number;
  setsWonB: number;
  isMatchCompleted: boolean;
  winner: TeamId | null;
  roundHistory: ConfirmedRound[];
  auditLogs: AuditLogEntry[];
}

// 28 unique double-six domino tiles
export const ALL_DOMINO_TILES: DominoTile[] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 1], [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
  [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
  [3, 3], [3, 4], [3, 5], [3, 6],
  [4, 4], [4, 5], [4, 6],
  [5, 5], [5, 6],
  [6, 6]
];

export function getTileId(tile: DominoTile): string {
  const [a, b] = tile;
  return a <= b ? `${a}-${b}` : `${b}-${a}`;
}

export function getTileDots(tile: DominoTile): number {
  return tile[0] + tile[1];
}

export function isBalakTile(tile: DominoTile): boolean {
  return tile[0] === tile[1];
}

export type SoundType = 
  | 'default_audio' 
  | 'tts_custom' 
  | 'custom_upload' 
  | 'preset_fanfare' 
  | 'preset_whistle' 
  | 'preset_cheer' 
  | 'preset_gong'
  | 'muted';

export interface SoundConfig {
  enabled: boolean;
  soundType: SoundType;
  customText: string;
  customAudioDataUrl?: string;
  customAudioName?: string;
  volume: number; // 0..1
}

export interface BalakItem {
  id: number;
  balakNumber: number; // 0..6
  cycle: 1 | 2;
  assignedPlayer: PlayerId;
  status: 'pending' | 'in_progress' | 'completed';
  winnerTeam?: 'BIRU' | 'MERAH' | null;
  points?: number | null;
  notes?: string;
}

export type MemberRole = 'host' | 'referee' | 'member' | 'viewer';

export interface RegisteredMember {
  id: string;
  name: string;
  email?: string;
  role: MemberRole;
  token: string;
  description: string; // Keterangan yang diberikan oleh Host / Developer
  status: 'active' | 'revoked';
  addedAt: string;
  addedBy: string;
  lastActive?: string;
}

export interface MemberSession {
  token: string;
  name: string;
  email?: string;
  role: MemberRole;
  description: string;
  approvedBy: string;
}

