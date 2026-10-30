/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CalculationBreakdown,
  DominoTile,
  getTileDots,
  MatchConfig,
  MatchIdentity,
  PenaltyRecord,
  PlayerId,
  RoundInput,
  RoundResultType,
  TeamId,
} from '../types/orado';
import { STANDARD_VIOLATIONS } from '../engine/rules';
import { calculateRoundPoints, ScoreState } from '../engine/calculator';
import { DominoTileSelectorModal } from './DominoTileSelectorModal';
import { DominoTileView } from './DominoTileView';
import {
  Calculator,
  CheckCircle,
  RotateCcw,
  Plus,
  Trash2,
  AlertTriangle,
  Sparkles,
  Layers,
  Zap,
  Info
} from 'lucide-react';

interface RoundInputFormProps {
  identity: MatchIdentity;
  config: MatchConfig;
  currentScoreState: ScoreState;
  isSetAlreadyCompleted: boolean;
  operatorName: string;
  onConfirmRound: (input: RoundInput, calculation: CalculationBreakdown) => void;
  onPreviewCalculation: (calc: CalculationBreakdown | null) => void;
}

export const RoundInputForm: React.FC<RoundInputFormProps> = ({
  identity,
  config,
  currentScoreState,
  isSetAlreadyCompleted,
  operatorName,
  onConfirmRound,
  onPreviewCalculation,
}) => {
  // Input states
  const [mode, setMode] = useState<'quick' | 'complete'>('quick');
  const [resultType, setResultType] = useState<RoundResultType>('normal_finish');
  const [finishingPlayer, setFinishingPlayer] = useState<PlayerId>('A1');

  // Points in Quick Mode
  const [pointsA1, setPointsA1] = useState<number>(0);
  const [pointsA2, setPointsA2] = useState<number>(0);
  const [pointsB1, setPointsB1] = useState<number>(10);
  const [pointsB2, setPointsB2] = useState<number>(10);

  // Tiles in Complete Mode
  const [playerTiles, setPlayerTiles] = useState<Record<PlayerId, DominoTile[]>>({
    A1: [],
    A2: [],
    B1: [],
    B2: [],
  });

  const [tileModalOpen, setTileModalOpen] = useState(false);
  const [activeModalPlayer, setActiveModalPlayer] = useState<PlayerId>('A1');

  // Special conditions
  const [lastTileLeft, setLastTileLeft] = useState<number>(4);
  const [lastTileRight, setLastTileRight] = useState<number>(4);
  const [boardLeftEnd, setBoardLeftEnd] = useState<string>('4');
  const [boardRightEnd, setBoardRightEnd] = useState<string>('4');
  const [bothEndsMatched, setBothEndsMatched] = useState<boolean>(false);
  const [isBalak, setIsBalak] = useState<boolean>(false);
  const [noSameSuitLeft, setNoSameSuitLeft] = useState<boolean>(false);

  // Beradu
  const [closingPlayer, setClosingPlayer] = useState<PlayerId>('A1');
  const [beraduResolution, setBeraduResolution] = useState<RoundInput['beraduResolution']>('needs_referee_confirmation');
  const [beraduWinnerOverride, setBeraduWinnerOverride] = useState<TeamId>('A');
  const [beraduNote, setBeraduNote] = useState<string>('');

  // Penalties
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [showAddPenalty, setShowAddPenalty] = useState(false);
  const [selectedViolator, setSelectedViolator] = useState<PlayerId>('A1');
  const [selectedViolationCode, setSelectedViolationCode] = useState<string>(STANDARD_VIOLATIONS[0].code);
  const [customPenaltyPts, setCustomPenaltyPts] = useState<number>(11);
  const [penaltyNote, setPenaltyNote] = useState<string>('');

  // Confirmation dialog
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [simulatedCalc, setSimulatedCalc] = useState<CalculationBreakdown | null>(null);

  // Auto-update balak checkbox if tile is equal
  useEffect(() => {
    if (lastTileLeft === lastTileRight) {
      setIsBalak(true);
    } else {
      setIsBalak(false);
    }
  }, [lastTileLeft, lastTileRight]);

  // Synchronize points when in complete mode
  useEffect(() => {
    if (mode === 'complete') {
      setPointsA1(playerTiles.A1.reduce((sum, t) => sum + getTileDots(t), 0));
      setPointsA2(playerTiles.A2.reduce((sum, t) => sum + getTileDots(t), 0));
      setPointsB1(playerTiles.B1.reduce((sum, t) => sum + getTileDots(t), 0));
      setPointsB2(playerTiles.B2.reduce((sum, t) => sum + getTileDots(t), 0));
    }
  }, [mode, playerTiles]);

  // If normal finish is selected, make sure finishing player has 0 points
  useEffect(() => {
    if (resultType === 'normal_finish' && finishingPlayer) {
      if (finishingPlayer === 'A1') setPointsA1(0);
      if (finishingPlayer === 'A2') setPointsA2(0);
      if (finishingPlayer === 'B1') setPointsB1(0);
      if (finishingPlayer === 'B2') setPointsB2(0);
    }
  }, [resultType, finishingPlayer]);

  // Build current input object
  const buildRoundInput = (): RoundInput => {
    return {
      mode,
      resultType,
      finishingPlayer: resultType === 'normal_finish' ? finishingPlayer : undefined,
      remainingPoints: {
        A1: pointsA1,
        A2: pointsA2,
        B1: pointsB1,
        B2: pointsB2,
      },
      remainingTiles: playerTiles,
      lastTile: [lastTileLeft, lastTileRight],
      boardLeftEnd: boardLeftEnd !== '' ? parseInt(boardLeftEnd, 10) : undefined,
      boardRightEnd: boardRightEnd !== '' ? parseInt(boardRightEnd, 10) : undefined,
      bothEndsMatched,
      isBalak,
      noSameSuitLeft,
      closingPlayer: resultType === 'beradu' ? closingPlayer : undefined,
      beraduResolution,
      beraduWinnerOverride: beraduResolution === 'custom_referee_decision' ? beraduWinnerOverride : undefined,
      beraduNote,
      penalties,
    };
  };

  // Run simulation
  const handleSimulate = () => {
    const input = buildRoundInput();
    const calc = calculateRoundPoints(currentScoreState, input, config, isSetAlreadyCompleted);
    setSimulatedCalc(calc);
    onPreviewCalculation(calc);
  };

  // Auto-simulate on major changes
  useEffect(() => {
    handleSimulate();
  }, [
    mode,
    resultType,
    finishingPlayer,
    pointsA1,
    pointsA2,
    pointsB1,
    pointsB2,
    playerTiles,
    bothEndsMatched,
    isBalak,
    noSameSuitLeft,
    closingPlayer,
    beraduResolution,
    beraduWinnerOverride,
    penalties,
  ]);

  // Open tile picker
  const openTileModalFor = (player: PlayerId) => {
    setActiveModalPlayer(player);
    setTileModalOpen(true);
  };

  // Add penalty
  const handleAddPenalty = () => {
    const violation = STANDARD_VIOLATIONS.find((v) => v.code === selectedViolationCode);
    if (!violation) return;

    const violatorTeam: TeamId = selectedViolator.startsWith('A') ? 'A' : 'B';
    const recipientTeam: TeamId = violatorTeam === 'A' ? 'B' : 'A';
    const pts = customPenaltyPts > 0 ? customPenaltyPts : violation.defaultPoints;

    const newPenalty: PenaltyRecord = {
      id: 'pen-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      playerId: selectedViolator,
      teamId: violatorTeam,
      violationType: violation.name,
      article: violation.article,
      penaltyPoints: pts,
      recipientTeam,
      note: penaltyNote,
    };

    setPenalties([...penalties, newPenalty]);
    setShowAddPenalty(false);
    setPenaltyNote('');
  };

  const removePenalty = (id: string) => {
    setPenalties(penalties.filter((p) => p.id !== id));
  };

  // Reset form
  const handleResetForm = () => {
    setMode('quick');
    setResultType('normal_finish');
    setFinishingPlayer('A1');
    setPointsA1(0);
    setPointsA2(0);
    setPointsB1(10);
    setPointsB2(10);
    setPlayerTiles({ A1: [], A2: [], B1: [], B2: [] });
    setBothEndsMatched(false);
    setIsBalak(false);
    setNoSameSuitLeft(false);
    setBeraduResolution('needs_referee_confirmation');
    setPenalties([]);
    setSimulatedCalc(null);
    onPreviewCalculation(null);
  };

  // Preset loaders for the 5 mandatory test cases
  const loadTestCase = (caseNumber: 1 | 2 | 3 | 4 | 5) => {
    setMode('quick');
    if (caseNumber === 1) {
      // Kasus 1: Kemenangan Normal
      setResultType('normal_finish');
      setFinishingPlayer('A1');
      setPointsA1(0);
      setPointsA2(0);
      setPointsB1(8);
      setPointsB2(12); // Total B = 20
      setBothEndsMatched(false);
      setIsBalak(false);
      setNoSameSuitLeft(false);
      setPenalties([]);
    } else if (caseNumber === 2) {
      // Kasus 2: Bonus Dua Ujung (Pengali 2x)
      setResultType('normal_finish');
      setFinishingPlayer('A1');
      setPointsA1(0);
      setPointsA2(0);
      setPointsB1(10);
      setPointsB2(10); // Total B = 20
      setBothEndsMatched(true);
      setLastTileLeft(4);
      setLastTileRight(4);
      setBoardLeftEnd('4');
      setBoardRightEnd('4');
      setIsBalak(true);
      setNoSameSuitLeft(false);
      setPenalties([]);
    } else if (caseNumber === 3) {
      // Kasus 3: Penalti 11 Poin
      setResultType('special_penalty');
      setPointsA1(0);
      setPointsA2(0);
      setPointsB1(0);
      setPointsB2(0);
      setBothEndsMatched(false);
      setPenalties([
        {
          id: 'pen-demo-1',
          timestamp: new Date().toLocaleTimeString('id-ID'),
          playerId: 'A1',
          teamId: 'A',
          violationType: 'Melebihi Batas Waktu Berpikir',
          article: 'Pasal 15',
          penaltyPoints: 11,
          recipientTeam: 'B',
        },
      ]);
    } else if (caseNumber === 4) {
      // Kasus 4: Beradu Belum Terverifikasi
      setResultType('beradu');
      setPointsA1(8);
      setPointsA2(10); // Total A = 18
      setPointsB1(12);
      setPointsB2(10); // Total B = 22
      setBothEndsMatched(false);
      setBeraduResolution('needs_referee_confirmation');
      setPenalties([]);
    } else if (caseNumber === 5) {
      // Kasus 5: Apollo
      setResultType('normal_finish');
      setFinishingPlayer('A1');
      setPointsA1(0);
      setPointsA2(0);
      setPointsB1(6);
      setPointsB2(4); // Total B = 10
      setBothEndsMatched(false);
      setIsBalak(false);
      setNoSameSuitLeft(false);
      setPenalties([]);
    }
  };

  // Confirm and submit
  const handleInitiateConfirm = () => {
    const input = buildRoundInput();
    const calc = calculateRoundPoints(currentScoreState, input, config, isSetAlreadyCompleted);
    setSimulatedCalc(calc);

    if (!calc.isValid) {
      alert(`Validasi gagal:\n${calc.validationErrors.join('\n')}`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleFinalConfirm = () => {
    if (!simulatedCalc) return;
    const input = buildRoundInput();
    onConfirmRound(input, simulatedCalc);
    setShowConfirmModal(false);
    handleResetForm();
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-800">
        <div>
          <h3 className="text-base font-extrabold text-stone-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <span>Panel Input Ronde {identity.roundNumber} (Set {identity.setNumber})</span>
          </h3>
          <p className="text-xs text-stone-400">
            Pencatatan skor ronde resmi — wasit: <strong className="text-stone-200">{operatorName}</strong>
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'quick'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Mode Cepat (Total Titik)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('complete')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'complete'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mode Lengkap (Pilih Batu)</span>
          </button>
        </div>
      </div>

      {/* Preset Kasus Uji Wajib */}
      <div className="bg-stone-950/80 p-2.5 rounded-2xl border border-stone-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-stone-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Preset Kasus Uji Wajib (Bagian G):</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => loadTestCase(1)}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Kasus 1: Kemenangan Normal (Sisa B: 20 -> A: +20)"
          >
            Kasus 1 (Normal)
          </button>
          <button
            type="button"
            onClick={() => loadTestCase(2)}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Kasus 2: Bonus Dua Ujung (Sisa B: 20 x 2 = +40)"
          >
            Kasus 2 (Bonus 2 Ujung)
          </button>
          <button
            type="button"
            onClick={() => loadTestCase(3)}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Kasus 3: Penalti 11 Poin (Pasal 15)"
          >
            Kasus 3 (Penalti 11 pt)
          </button>
          <button
            type="button"
            onClick={() => loadTestCase(4)}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Kasus 4: Beradu Belum Terverifikasi (PERLU KONFIRMASI WASIT)"
          >
            Kasus 4 (Beradu)
          </button>
          <button
            type="button"
            onClick={() => loadTestCase(5)}
            className="text-[11px] bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 border border-stone-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            title="Kasus 5: Apollo (101 vs 0)"
          >
            Kasus 5 (Apollo)
          </button>
        </div>
      </div>

      {/* 1. Hasil Ronde Selector */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
          1. Hasil Akhir Ronde
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => setResultType('normal_finish')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              resultType === 'normal_finish'
                ? 'bg-amber-500/15 border-amber-500 text-amber-200 ring-1 ring-amber-400'
                : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
            }`}
          >
            <div className="text-xs font-bold">Kemenangan Normal</div>
            <div className="text-[11px] text-stone-400">Pemain habiskan batu</div>
          </button>

          <button
            type="button"
            onClick={() => setResultType('beradu')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              resultType === 'beradu'
                ? 'bg-amber-500/15 border-amber-500 text-amber-200 ring-1 ring-amber-400'
                : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
            }`}
          >
            <div className="text-xs font-bold">Permainan Beradu</div>
            <div className="text-[11px] text-stone-400">Deadlock / batu macet</div>
          </button>

          <button
            type="button"
            onClick={() => setResultType('round_invalid')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              resultType === 'round_invalid'
                ? 'bg-rose-500/15 border-rose-500 text-rose-200 ring-1 ring-rose-400'
                : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
            }`}
          >
            <div className="text-xs font-bold">Ronde Batal / Diulang</div>
            <div className="text-[11px] text-stone-400">Batu cacat / salah bagi</div>
          </button>

          <button
            type="button"
            onClick={() => setResultType('special_penalty')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              resultType === 'special_penalty'
                ? 'bg-purple-500/15 border-purple-500 text-purple-200 ring-1 ring-purple-400'
                : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800/80 hover:text-stone-200'
            }`}
          >
            <div className="text-xs font-bold">Sanksi Khusus</div>
            <div className="text-[11px] text-stone-400">Pasal 16 / Diskualifikasi</div>
          </button>
        </div>
      </div>

      {/* 2. Finisher Selector (Normal Finish) */}
      {resultType === 'normal_finish' && (
        <div className="space-y-2 bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
          <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>2. Pemain Penutup Ronde (Habiskan Batu)</span>
            <span className="text-[11px] text-amber-400 font-normal">Sisa titik pemain penutup otomatis 0</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['A1', 'A2', 'B1', 'B2'] as PlayerId[]).map((p) => {
              const isSelected = finishingPlayer === p;
              const isTeamA = p.startsWith('A');
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFinishingPlayer(p)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? isTeamA
                        ? 'bg-blue-600 text-white border-blue-400 ring-2 ring-blue-400 shadow-md'
                        : 'bg-red-600 text-white border-red-400 ring-2 ring-red-400 shadow-md'
                      : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
                  }`}
                >
                  <div className="font-extrabold text-sm">{p}</div>
                  <div className="text-[11px] truncate opacity-90">{identity.playerNames[p]}</div>
                  <div className="text-[10px] mt-0.5 font-bold uppercase tracking-wider opacity-75">
                    {isTeamA ? identity.teamAName : identity.teamBName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Input Sisa Titik / Batu Pemain */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
            {mode === 'quick' ? '3. Sisa Titik Masing-Masing Pemain' : '3. Sisa Batu Domino Pemain (Double-Six)'}
          </label>
          {mode === 'complete' && (
            <span className="text-xs text-amber-400 font-mono">
              Klik nama pemain untuk membuka modal pemilih batu
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Player A1 */}
          <div className="bg-stone-950/80 border border-blue-900/40 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-300">Pemain A1</span>
              <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.2 rounded font-bold">
                TIM A
              </span>
            </div>
            <div className="text-xs font-semibold text-stone-300 truncate">
              {identity.playerNames.A1}
            </div>

            {mode === 'quick' ? (
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  max="42"
                  value={pointsA1}
                  disabled={resultType === 'normal_finish' && finishingPlayer === 'A1'}
                  onChange={(e) => setPointsA1(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center text-lg font-bold focus:border-amber-400 focus:outline-hidden disabled:opacity-40"
                />
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={resultType === 'normal_finish' && finishingPlayer === 'A1'}
                      onClick={() => setPointsA1(val)}
                      className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] py-1 rounded font-mono disabled:opacity-40"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
                  <span>{playerTiles.A1.length} batu</span>
                  <span>{pointsA1} titik</span>
                </div>
                <button
                  type="button"
                  onClick={() => openTileModalFor('A1')}
                  className="w-full py-2 bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-700/60 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Pilih Batu A1...
                </button>
              </div>
            )}
          </div>

          {/* Player A2 */}
          <div className="bg-stone-950/80 border border-blue-900/40 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-300">Pemain A2</span>
              <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-1.5 py-0.2 rounded font-bold">
                TIM A
              </span>
            </div>
            <div className="text-xs font-semibold text-stone-300 truncate">
              {identity.playerNames.A2}
            </div>

            {mode === 'quick' ? (
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  max="42"
                  value={pointsA2}
                  disabled={resultType === 'normal_finish' && finishingPlayer === 'A2'}
                  onChange={(e) => setPointsA2(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center text-lg font-bold focus:border-amber-400 focus:outline-hidden disabled:opacity-40"
                />
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={resultType === 'normal_finish' && finishingPlayer === 'A2'}
                      onClick={() => setPointsA2(val)}
                      className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] py-1 rounded font-mono disabled:opacity-40"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
                  <span>{playerTiles.A2.length} batu</span>
                  <span>{pointsA2} titik</span>
                </div>
                <button
                  type="button"
                  onClick={() => openTileModalFor('A2')}
                  className="w-full py-2 bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-700/60 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Pilih Batu A2...
                </button>
              </div>
            )}
          </div>

          {/* Player B1 */}
          <div className="bg-stone-950/80 border border-red-900/40 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-red-300">Pemain B1</span>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-bold">
                TIM B (MERAH)
              </span>
            </div>
            <div className="text-xs font-semibold text-stone-300 truncate">
              {identity.playerNames.B1}
            </div>

            {mode === 'quick' ? (
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  max="42"
                  value={pointsB1}
                  disabled={resultType === 'normal_finish' && finishingPlayer === 'B1'}
                  onChange={(e) => setPointsB1(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center text-lg font-bold focus:border-amber-400 focus:outline-hidden disabled:opacity-40"
                />
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={resultType === 'normal_finish' && finishingPlayer === 'B1'}
                      onClick={() => setPointsB1(val)}
                      className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] py-1 rounded font-mono disabled:opacity-40"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
                  <span>{playerTiles.B1.length} batu</span>
                  <span>{pointsB1} titik</span>
                </div>
                <button
                  type="button"
                  onClick={() => openTileModalFor('B1')}
                  className="w-full py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Pilih Batu B1...
                </button>
              </div>
            )}
          </div>

          {/* Player B2 */}
          <div className="bg-stone-950/80 border border-red-900/40 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-red-300">Pemain B2</span>
              <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.2 rounded font-bold">
                TIM B (MERAH)
              </span>
            </div>
            <div className="text-xs font-semibold text-stone-300 truncate">
              {identity.playerNames.B2}
            </div>

            {mode === 'quick' ? (
              <div className="space-y-2">
                <input
                  type="number"
                  min="0"
                  max="42"
                  value={pointsB2}
                  disabled={resultType === 'normal_finish' && finishingPlayer === 'B2'}
                  onChange={(e) => setPointsB2(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white font-mono text-center text-lg font-bold focus:border-amber-400 focus:outline-hidden disabled:opacity-40"
                />
                <div className="flex gap-1">
                  {[0, 5, 10, 15].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={resultType === 'normal_finish' && finishingPlayer === 'B2'}
                      onClick={() => setPointsB2(val)}
                      className="flex-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] py-1 rounded font-mono disabled:opacity-40"
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-400 font-mono">
                  <span>{playerTiles.B2.length} batu</span>
                  <span>{pointsB2} titik</span>
                </div>
                <button
                  type="button"
                  onClick={() => openTileModalFor('B2')}
                  className="w-full py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-700/60 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Pilih Batu B2...
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Summary of Subtotals */}
        <div className="flex items-center justify-between bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs font-mono">
          <div className="text-blue-300">
            Total Sisa Tim A: <strong>{pointsA1 + pointsA2} titik</strong> (A1: {pointsA1} + A2: {pointsA2})
          </div>
          <div className="text-red-300">
            Total Sisa Tim B: <strong>{pointsB1 + pointsB2} titik</strong> (B1: {pointsB1} + B2: {pointsB2})
          </div>
        </div>
      </div>

      {/* 4. Beradu Resolution Selector (When resultType === 'beradu') */}
      {resultType === 'beradu' && (
        <div className="space-y-3 bg-amber-950/20 border border-amber-600/40 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Resolusi Kondisi Beradu (Pasal 14)</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-stone-300 font-medium">
              Pilihan Ketentuan Verifikasi Beradu:
            </label>
            <select
              value={beraduResolution}
              onChange={(e) => setBeraduResolution(e.target.value as any)}
              className="w-full bg-stone-900 border border-stone-700 text-stone-100 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-amber-400 focus:outline-hidden"
            >
              <option value="needs_referee_confirmation">
                ⚠️ PERLU KONFIRMASI WASIT — Belum diverifikasi (Poin DIBEKUKAN)
              </option>
              <option value="lowest_team_total_wins">
                ✓ Tim dengan Total Titik Terendah Menang (Sisa A vs Sisa B)
              </option>
              <option value="blocker_lowest_wins">
                ✓ Pemain Penutup Terendah Menang (Tim Penutup Dapat Poin)
              </option>
              <option value="blocker_not_lowest_opponent_wins">
                ✓ Pemain Penutup Kalah Titik (Tim Lawan Dapat Poin)
              </option>
              <option value="tie_draw">
                ✓ Ronde Seri / Draw (Kedua Tim Imbang, 0 Poin)
              </option>
              <option value="custom_referee_decision">
                ⚖️ Keputusan Khusus Wasit Lapangan
              </option>
            </select>
          </div>

          {/* Closing player input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] text-stone-400 font-medium block mb-1">
                Pemain Penutup Rangkaian:
              </label>
              <select
                value={closingPlayer}
                onChange={(e) => setClosingPlayer(e.target.value as PlayerId)}
                className="w-full bg-stone-900 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
              >
                {(['A1', 'A2', 'B1', 'B2'] as PlayerId[]).map((p) => (
                  <option key={p} value={p}>
                    {p} — {identity.playerNames[p]} ({p.startsWith('A') ? 'Tim A' : 'Tim B'})
                  </option>
                ))}
              </select>
            </div>

            {beraduResolution === 'custom_referee_decision' && (
              <div>
                <label className="text-[11px] text-stone-400 font-medium block mb-1">
                  Pemenang yang Ditetapkan Wasit:
                </label>
                <select
                  value={beraduWinnerOverride}
                  onChange={(e) => setBeraduWinnerOverride(e.target.value as TeamId)}
                  className="w-full bg-stone-900 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="A">Tim A ({identity.teamAName})</option>
                  <option value="B">Tim B ({identity.teamBName})</option>
                </select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Special Conditions & Bonus (Pasal 12 & 13) */}
      <div className="space-y-3 bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>5. Kondisi Khusus & Bonus Ronde</span>
          </label>
          <span className="text-[11px] text-stone-400">Pasal 12 & Pasal 13</span>
        </div>

        {/* Last tile & board ends */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">Batu Terakhir (Sisi 1):</label>
            <select
              value={lastTileLeft}
              onChange={(e) => setLastTileLeft(parseInt(e.target.value, 10))}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">Batu Terakhir (Sisi 2):</label>
            <select
              value={lastTileRight}
              onChange={(e) => setLastTileRight(parseInt(e.target.value, 10))}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">Ujung Kiri Meja:</label>
            <input
              type="number"
              min="0"
              max="6"
              value={boardLeftEnd}
              onChange={(e) => setBoardLeftEnd(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
            />
          </div>
          <div>
            <label className="text-[11px] text-stone-400 block mb-1">Ujung Kanan Meja:</label>
            <input
              type="number"
              min="0"
              max="6"
              value={boardRightEnd}
              onChange={(e) => setBoardRightEnd(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2 py-1.5 text-xs font-mono text-white"
            />
          </div>
        </div>

        {/* Bonus Checkboxes */}
        <div className="space-y-2 pt-2 border-t border-stone-800">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={bothEndsMatched}
              onChange={(e) => setBothEndsMatched(e.target.checked)}
              className="mt-0.5 rounded-sm border-stone-700 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-200">Bonus Dua Ujung Cocok (Pasal 12 — Pengali 2x)</span>
              <p className="text-stone-400 text-[11px]">Batu terakhir yang dimainkan cocok pada kedua ujung rangkaian domino di meja.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBalak}
              onChange={(e) => setIsBalak(e.target.checked)}
              className="mt-0.5 rounded-sm border-stone-700 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-200">Batu Terakhir Merupakan Balak (Kembar)</span>
              <p className="text-stone-400 text-[11px]">Batu memiliki angka kembar (0-0 s/d 6-6).</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={noSameSuitLeft}
              onChange={(e) => setNoSameSuitLeft(e.target.checked)}
              className="mt-0.5 rounded-sm border-stone-700 text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-stone-200">Tidak Ada Batu Sejenis yang Tersisa (Bonus Balak Dua Ujung +50 Poin — Pasal 13)</span>
              <p className="text-stone-400 text-[11px]">Seluruh batu sejenis telah keluar dan balak menutup kedua ujung secara sah.</p>
            </div>
          </label>
        </div>
      </div>

      {/* 6. Pelanggaran & Penalti (Pasal 15 / 16) */}
      <div className="space-y-3 bg-stone-950/70 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>6. Pelanggaran & Penalti Ronde ({penalties.length} Tercatat)</span>
          </label>
          <button
            type="button"
            onClick={() => setShowAddPenalty(!showAddPenalty)}
            className="flex items-center gap-1 text-xs bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Penalti</span>
          </button>
        </div>

        {/* Penalty List */}
        {penalties.length > 0 ? (
          <div className="space-y-2">
            {penalties.map((pen) => (
              <div
                key={pen.id}
                className="flex items-center justify-between bg-stone-900 border border-rose-900/40 rounded-xl p-2.5 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-rose-300 flex items-center gap-2">
                    <span>{pen.violationType}</span>
                    <span className="text-[10px] bg-rose-950 text-rose-400 px-1.5 py-0.2 rounded font-mono">
                      {pen.article}
                    </span>
                  </div>
                  <div className="text-stone-400 text-[11px]">
                    Pelanggar: <strong>{pen.playerId} (Tim {pen.teamId})</strong> → Sanksi{' '}
                    <strong className="text-emerald-400">+{pen.penaltyPoints} poin</strong> untuk Tim {pen.recipientTeam}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removePenalty(pen.id)}
                  className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                  title="Hapus Penalti"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-stone-500 italic">
            Tidak ada pelanggaran yang dicatat untuk ronde ini.
          </p>
        )}

        {/* Add Penalty Sub-panel */}
        {showAddPenalty && (
          <div className="bg-stone-900 border border-rose-800/60 rounded-xl p-3.5 space-y-3 mt-2">
            <div className="text-xs font-bold text-rose-400">Formulir Pencatatan Pelanggaran Baru:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Pemain Pelanggar:</label>
                <select
                  value={selectedViolator}
                  onChange={(e) => setSelectedViolator(e.target.value as PlayerId)}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  {(['A1', 'A2', 'B1', 'B2'] as PlayerId[]).map((p) => (
                    <option key={p} value={p}>
                      {p} — {identity.playerNames[p]} ({p.startsWith('A') ? 'Tim A' : 'Tim B'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Jenis Pelanggaran:</label>
                <select
                  value={selectedViolationCode}
                  onChange={(e) => {
                    setSelectedViolationCode(e.target.value);
                    const v = STANDARD_VIOLATIONS.find((x) => x.code === e.target.value);
                    if (v) setCustomPenaltyPts(v.defaultPoints);
                  }}
                  className="w-full bg-stone-950 border border-stone-700 text-stone-200 rounded-lg px-2.5 py-1.5 text-xs"
                >
                  {STANDARD_VIOLATIONS.map((v) => (
                    <option key={v.code} value={v.code}>
                      {v.name} ({v.defaultPoints} pt - {v.article})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-stone-400 block mb-1">Poin Sanksi (Untuk Lawan):</label>
                <input
                  type="number"
                  min="1"
                  value={customPenaltyPts}
                  onChange={(e) => setCustomPenaltyPts(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-stone-950 border border-stone-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddPenalty(false)}
                className="px-3 py-1 text-xs text-stone-400 hover:text-stone-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleAddPenalty}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm"
              >
                Terapkan Penalti
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
        <button
          type="button"
          onClick={handleResetForm}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-200 px-3 py-2 rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Batalkan Perubahan</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSimulate}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors border border-stone-700 shadow-sm cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>Hitung Poin (Simulasi)</span>
          </button>

          <button
            type="button"
            onClick={handleInitiateConfirm}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-6 py-2.5 rounded-xl text-xs transition-transform active:scale-95 shadow-md cursor-pointer"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Konfirmasi Hasil Ronde</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && simulatedCalc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-2xl w-full max-w-md p-6 text-stone-100 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Konfirmasi Skor Resmi Ronde {identity.roundNumber}</span>
            </h4>

            <p className="text-xs text-stone-300">
              Apakah Anda yakin ingin menyimpan hasil ronde ini ke dalam buku pertandingan resmi?
            </p>

            <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-blue-300">{identity.teamAName}:</span>
                <span>
                  {simulatedCalc.scoreBeforeA} → <strong className="text-white">+{simulatedCalc.totalRoundPointsA}</strong> → {simulatedCalc.scoreAfterA}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-300">{identity.teamBName}:</span>
                <span>
                  {simulatedCalc.scoreBeforeB} → <strong className="text-white">+{simulatedCalc.totalRoundPointsB}</strong> → {simulatedCalc.scoreAfterB}
                </span>
              </div>
              {simulatedCalc.isSetWon && (
                <div className="text-amber-400 font-bold pt-1 border-t border-stone-800">
                  🎉 Tim {simulatedCalc.setWinner} Memenangkan Set {identity.setNumber}!
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs text-stone-400 hover:text-stone-200"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-5 py-2 rounded-xl text-xs shadow-md"
              >
                Ya, Konfirmasi Resmi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 28 Domino Tile Selector Modal (Mode Lengkap) */}
      <DominoTileSelectorModal
        isOpen={tileModalOpen}
        onClose={() => setTileModalOpen(false)}
        activePlayer={activeModalPlayer}
        playerNames={identity.playerNames}
        allPlayerTiles={playerTiles}
        onUpdatePlayerTiles={(p, tiles) => {
          setPlayerTiles((prev) => ({
            ...prev,
            [p]: tiles,
          }));
        }}
      />
    </div>
  );
};
