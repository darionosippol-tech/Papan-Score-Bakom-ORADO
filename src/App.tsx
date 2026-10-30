/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  AuditLogEntry,
  CalculationBreakdown,
  ConfirmedRound,
  MatchConfig,
  MatchIdentity,
  MatchState,
  RoundInput,
  TeamId
} from './types/orado';
import { Scoreboard } from './components/Scoreboard';
import { SimpleScoreBoard, SimpleRoundEntry } from './components/SimpleScoreBoard';
import { MatchHeader } from './components/MatchHeader';
import { RoundInputForm } from './components/RoundInputForm';
import { CalculationBreakdownPanel } from './components/CalculationBreakdownPanel';
import { HistoryTable } from './components/HistoryTable';
import { TestRunnerModal } from './components/TestRunnerModal';
import { AuditLogModal } from './components/AuditLogModal';
import { RulesReferenceModal } from './components/RulesReferenceModal';
import { ExportModal } from './components/ExportModal';
import { MatchSettingsModal } from './components/MatchSettingsModal';
import { AccessGateModal } from './components/AccessGateModal';
import { MemberManagementModal } from './components/MemberManagementModal';
import { ShareLiveLinkModal } from './components/ShareLiveLinkModal';
import { LiveScoreView } from './components/LiveScoreView';
import { playVictorySound } from './utils/audio';
import { liveSync } from './services/liveSync';
import { Trophy, ArrowRight, RotateCcw, AlertTriangle, ShieldCheck, LayoutGrid, Calculator, Radio, Users } from 'lucide-react';

const STORAGE_KEY = 'orado_101_match_state_v1';

const DEFAULT_IDENTITY: MatchIdentity = {
  matchNumber: 'M-101',
  tournamentName: 'Kejuaraan Nasional Domino ORADO 2026',
  tableNumber: '01',
  teamAName: 'TIM BIRU',
  teamBName: 'TIM MERAH',
  playerNames: {
    A1: 'Pemain Biru 1',
    A2: 'Pemain Biru 2',
    B1: 'Pemain Merah 1',
    B2: 'Pemain Merah 2',
  },
  setNumber: 1,
  roundNumber: 1,
  rulesVersion: 'The Law of Domino 101 ORADO (Revisi 2026)',
};

const DEFAULT_CONFIG: MatchConfig = {
  targetSetPoints: 101,
  matchFormat: 'best_of_3',
  apolloEffect: 'double_set',
  doubleEndMultiplier: 2,
  balakBonusPoints: 50,
  allowCombineBalakAndDoubleEnd: false,
  standardPenaltyPoints: 11,
  rulesVersion: 'The Law of Domino 101 ORADO (Revisi 2026)',
};

export default function App() {
  // Main Match State
  const [identity, setIdentity] = useState<MatchIdentity>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.identity) {
          const id = { ...DEFAULT_IDENTITY, ...parsed.identity };
          if (!id.teamAName || id.teamAName.includes('GARUDA')) id.teamAName = 'TIM BIRU';
          if (!id.teamBName || id.teamBName.includes('RAJAWALI')) id.teamBName = 'TIM MERAH';
          return id;
        }
      } catch (e) {}
    }
    return DEFAULT_IDENTITY;
  });

  const [config, setConfig] = useState<MatchConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).config; } catch (e) {}
    }
    return DEFAULT_CONFIG;
  });

  const [operatorName, setOperatorName] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).operatorName || 'Wasit Utama Meja 01'; } catch (e) {}
    }
    return 'Wasit Utama Meja 01';
  });

  const [currentSet, setCurrentSet] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).currentSet || 1; } catch (e) {}
    }
    return 1;
  });

  const [currentRound, setCurrentRound] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).currentRound || 1; } catch (e) {}
    }
    return 1;
  });

  const [scoreA, setScoreA] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).scoreA || 0; } catch (e) {}
    }
    return 0;
  });

  const [scoreB, setScoreB] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).scoreB || 0; } catch (e) {}
    }
    return 0;
  });

  const [setsWonA, setSetsWonA] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).setsWonA || 0; } catch (e) {}
    }
    return 0;
  });

  const [setsWonB, setSetsWonB] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).setsWonB || 0; } catch (e) {}
    }
    return 0;
  });

  const [isMatchCompleted, setIsMatchCompleted] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).isMatchCompleted || false; } catch (e) {}
    }
    return false;
  });

  const [winner, setWinner] = useState<TeamId | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).winner || null; } catch (e) {}
    }
    return null;
  });

  const [roundHistory, setRoundHistory] = useState<ConfirmedRound[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).roundHistory || []; } catch (e) {}
    }
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { return JSON.parse(saved).auditLogs || []; } catch (e) {}
    }
    return [
      {
        id: 'log-init',
        timestamp: new Date().toLocaleTimeString('id-ID'),
        action: 'CONFIG_CHANGE',
        operatorName: 'Sistem Wasit ORADO',
        reason: 'Inisialisasi aplikasi pertandingan ORADO 101 revisi 2026',
      }
    ];
  });

  const [lastRoundApollo, setLastRoundApollo] = useState<boolean>(false);
  const [previewCalculation, setPreviewCalculation] = useState<CalculationBreakdown | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'live' | 'advanced'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'live' || params.get('view') === 'live') {
        return 'live';
      }
    }
    return 'simple';
  });

  // Authorization & Access Control (Developer: darionosippol@gmail.com)
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orado_user_role_v1') || 'member';
    }
    return 'member';
  });
  const [userLabel, setUserLabel] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orado_user_label_v1') || localStorage.getItem('orado_user_email_v1') || '';
    }
    return '';
  });
  const [userDescription, setUserDescription] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orado_user_desc_v1') || '';
    }
    return '';
  });
  const [connectedClients, setConnectedClients] = useState<number>(1);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [simpleRows, setSimpleRows] = useState<SimpleRoundEntry[]>([]);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isTestsOpen, setIsTestsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const canEditScore = userRole === 'host' || userRole === 'developer' || userRole === 'referee';

  const handleLogout = () => {
    // 1. Remove all stored tokens and sessions
    localStorage.removeItem('orado_access_token_v1');
    localStorage.removeItem('orado_user_email_v1');
    localStorage.removeItem('orado_user_role_v1');
    localStorage.removeItem('orado_user_label_v1');
    localStorage.removeItem('orado_user_desc_v1');

    // 2. Mark explicit logout in sessionStorage so AccessGateModal doesn't auto-login
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('orado_explicit_logout', 'true');
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // 3. Reset user identity states
    setUserRole('viewer');
    setUserLabel('');
    setUserDescription('');

    // 4. Close all open popups/modals
    setIsSettingsOpen(false);
    setIsRulesOpen(false);
    setIsAuditOpen(false);
    setIsTestsOpen(false);
    setIsExportOpen(false);
    setIsShareModalOpen(false);
    setIsMemberModalOpen(false);

    // 5. Automatically lock and return to ORADO access gate
    setIsAuthorized(false);
  };

  // Initial fetch of match state over HTTP to guarantee all devices receive the latest updates immediately
  useEffect(() => {
    fetch('/api/match-state')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.state) {
          const st = data.state;
          if (st.identity) {
            const syncedId = { ...st.identity };
            if (!syncedId.teamAName || syncedId.teamAName.includes('GARUDA')) syncedId.teamAName = 'TIM BIRU';
            if (!syncedId.teamBName || syncedId.teamBName.includes('RAJAWALI')) syncedId.teamBName = 'TIM MERAH';
            setIdentity(syncedId);
          }
          if (st.config) setConfig(st.config);
          if (st.scoreA !== undefined) setScoreA(st.scoreA);
          if (st.scoreB !== undefined) setScoreB(st.scoreB);
          if (st.setsWonA !== undefined) setSetsWonA(st.setsWonA);
          if (st.setsWonB !== undefined) setSetsWonB(st.setsWonB);
          if (st.currentSet !== undefined) setCurrentSet(st.currentSet);
          if (st.currentRound !== undefined) setCurrentRound(st.currentRound);
          if (st.simpleRows && st.simpleRows.length > 0) setSimpleRows(st.simpleRows);
          if (st.lastRoundApollo !== undefined) setLastRoundApollo(st.lastRoundApollo);
          if (st.isMatchCompleted !== undefined) setIsMatchCompleted(st.isMatchCompleted);
          if (st.winner !== undefined) setWinner(st.winner);
        }
      })
      .catch((e) => console.warn('Match state HTTP initial sync notice:', e));
  }, []);

  // Subscribe to real-time live synchronization over WebSocket & sound triggers
  useEffect(() => {
    const unsubscribeState = liveSync.onStateUpdate((remoteState, clients) => {
      if (typeof clients === 'number') {
        setConnectedClients(clients);
      }
      if (remoteState) {
        if (remoteState.identity) {
          const syncedId = { ...remoteState.identity };
          if (!syncedId.teamAName || syncedId.teamAName.includes('GARUDA')) syncedId.teamAName = 'TIM BIRU';
          if (!syncedId.teamBName || syncedId.teamBName.includes('RAJAWALI')) syncedId.teamBName = 'TIM MERAH';
          setIdentity(syncedId);
        }
        if (remoteState.config) setConfig(remoteState.config);
        if (remoteState.scoreA !== undefined) setScoreA(remoteState.scoreA);
        if (remoteState.scoreB !== undefined) setScoreB(remoteState.scoreB);
        if (remoteState.setsWonA !== undefined) setSetsWonA(remoteState.setsWonA);
        if (remoteState.setsWonB !== undefined) setSetsWonB(remoteState.setsWonB);
        if (remoteState.currentSet !== undefined) setCurrentSet(remoteState.currentSet);
        if (remoteState.currentRound !== undefined) setCurrentRound(remoteState.currentRound);
        if (remoteState.simpleRows && remoteState.simpleRows.length > 0) {
          setSimpleRows(remoteState.simpleRows);
        }
        if (remoteState.lastRoundApollo !== undefined) setLastRoundApollo(remoteState.lastRoundApollo);
        if (remoteState.isMatchCompleted !== undefined) setIsMatchCompleted(remoteState.isMatchCompleted);
        if (remoteState.winner !== undefined) setWinner(remoteState.winner);
      }
    });

    const unsubscribeSound = liveSync.onSoundEvent((soundType) => {
      if (soundType === 'victory') {
        playVictorySound();
      }
    });

    return () => {
      unsubscribeState();
      unsubscribeSound();
    };
  }, []);

  // SimpleScoreBoard round handler
  const handleSimpleRoundSaved = (entry: any, newTotalBiru: number, newTotalMerah: number, allRows?: SimpleRoundEntry[]) => {
    setScoreA(newTotalBiru);
    setScoreB(newTotalMerah);
    if (allRows) {
      setSimpleRows(allRows);
    }

    const isCurrentApollo = (newTotalBiru >= 101 && newTotalMerah === 0) || (newTotalMerah >= 101 && newTotalBiru === 0);
    setLastRoundApollo(isCurrentApollo);

    const roundId = 'simple-round-' + entry.id;
    const isWinnerBiru = entry.winner === 'BIRU';
    const isWinnerMerah = entry.winner === 'MERAH';
    const roundPtsBiru = entry.scoreBiru || 0;
    const roundPtsMerah = entry.scoreMerah || 0;

    const roundObj: ConfirmedRound = {
      id: roundId,
      roundNumber: entry.id,
      setNumber: currentSet,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      inputSnapshot: {
        mode: 'quick',
        resultType: entry.isPenalty ? 'special_penalty' : 'normal_finish',
        finishingPlayer: isWinnerBiru ? 'A1' : isWinnerMerah ? 'B1' : undefined,
        remainingPoints: {
          A1: isWinnerBiru ? 0 : roundPtsMerah,
          A2: 0,
          B1: isWinnerMerah ? 0 : roundPtsBiru,
          B2: 0,
        },
        remainingTiles: { A1: [], A2: [], B1: [], B2: [] },
        bothEndsMatched: !!entry.isTwoEndsBonus,
        isBalak: !!entry.isBalakBonus,
        noSameSuitLeft: !!entry.isBalakBonus,
        beraduResolution: 'needs_referee_confirmation',
        penalties: [],
      },
      calculation: {
        isValid: true,
        validationErrors: [],
        winnerTeam: isWinnerBiru ? 'A' : isWinnerMerah ? 'B' : null,
        remainingA1: 0,
        remainingA2: 0,
        remainingB1: 0,
        remainingB2: 0,
        totalRemainingA: isWinnerMerah ? roundPtsMerah : 0,
        totalRemainingB: isWinnerBiru ? roundPtsBiru : 0,
        basePointsA: roundPtsBiru,
        basePointsB: roundPtsMerah,
        bonusPointsA: 0,
        bonusPointsB: 0,
        penaltyPointsA: 0,
        penaltyPointsB: 0,
        totalRoundPointsA: roundPtsBiru,
        totalRoundPointsB: roundPtsMerah,
        scoreBeforeA: scoreA,
        scoreBeforeB: scoreB,
        scoreAfterA: newTotalBiru,
        scoreAfterB: newTotalMerah,
        setsBeforeA: setsWonA,
        setsBeforeB: setsWonB,
        setsAfterA: setsWonA,
        setsAfterB: setsWonB,
        isApollo: isCurrentApollo,
        isSetWon: newTotalBiru >= 101 || newTotalMerah >= 101,
        setWinner: newTotalBiru >= 101 ? 'A' : newTotalMerah >= 101 ? 'B' : null,
        isMatchWon: false,
        matchWinner: null,
        needsRefereeConfirmation: false,
        formulaExplanation: [
          `Poin Papan Balak ${entry.balakNumber}: Tim ${entry.winner || 'Seri'} memperoleh ${roundPtsBiru || roundPtsMerah} poin`
        ],
        rulesCited: [],
      },
      operatorName,
      verifiedByReferee: true,
    };

    setRoundHistory((prev) => {
      const filtered = prev.filter(r => r.id !== roundId);
      return [...filtered, roundObj];
    });

    const auditEntry: AuditLogEntry = {
      id: 'audit-simple-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      action: 'CONFIRM_ROUND',
      operatorName,
      roundNumber: entry.id,
      setNumber: currentSet,
      reason: `Pencatatan Papan Skor Simpel Balak ${entry.balakNumber} -> ${entry.winner}: +${roundPtsBiru || roundPtsMerah} Poin`,
      previousValue: `${scoreA} - ${scoreB}`,
      newValue: `${newTotalBiru} - ${newTotalMerah}`,
    };
    setAuditLogs((prev) => [...prev, auditEntry]);

    // Broadcast live sync to all other users / devices immediately!
    liveSync.sendStateUpdate({
      scoreA: newTotalBiru,
      scoreB: newTotalMerah,
      simpleRows: allRows || simpleRows,
      lastRoundApollo: isCurrentApollo,
      currentSet,
      setsWonA,
      setsWonB,
    }, operatorName, newTotalBiru >= 101 || newTotalMerah >= 101);
  };

  // Save to localStorage
  useEffect(() => {
    const stateToSave = {
      identity,
      config,
      operatorName,
      currentSet,
      currentRound,
      scoreA,
      scoreB,
      setsWonA,
      setsWonB,
      isMatchCompleted,
      winner,
      roundHistory,
      auditLogs,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving state:', e);
    }
  }, [
    identity,
    config,
    operatorName,
    currentSet,
    currentRound,
    scoreA,
    scoreB,
    setsWonA,
    setsWonB,
    isMatchCompleted,
    winner,
    roundHistory,
    auditLogs,
  ]);

  // Is current set finished?
  const isCurrentSetWon = scoreA >= config.targetSetPoints || scoreB >= config.targetSetPoints;

  // Confirm round callback
  const handleConfirmRound = (input: RoundInput, calc: CalculationBreakdown) => {
    const newRound: ConfirmedRound = {
      id: 'round-' + Date.now(),
      roundNumber: currentRound,
      setNumber: currentSet,
      timestamp: new Date().toLocaleTimeString('id-ID'),
      inputSnapshot: input,
      calculation: calc,
      operatorName,
      verifiedByReferee: true,
    };

    const newHistory = [...roundHistory, newRound];
    setRoundHistory(newHistory);

    // Update Scores
    const newScoreA = calc.scoreAfterA;
    const newScoreB = calc.scoreAfterB;
    setScoreA(newScoreA);
    setScoreB(newScoreB);

    if (calc.isApollo) {
      setLastRoundApollo(true);
    } else {
      setLastRoundApollo(false);
    }

    // Update Sets
    let newSetsA = calc.setsAfterA;
    let newSetsB = calc.setsAfterB;
    setSetsWonA(newSetsA);
    setSetsWonB(newSetsB);

    // Update Match completion
    if (calc.isMatchWon && calc.matchWinner) {
      setIsMatchCompleted(true);
      setWinner(calc.matchWinner);
    }

    // Next round number
    const nextRoundNumber = currentRound + 1;
    setCurrentRound(nextRoundNumber);

    // Record Audit
    const auditEntry: AuditLogEntry = {
      id: 'audit-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      action: 'CONFIRM_ROUND',
      operatorName,
      roundNumber: currentRound,
      setNumber: currentSet,
      reason: `Konfirmasi skor resmi ronde ${currentRound}: ${calc.winnerTeam ? 'Menang Tim ' + calc.winnerTeam : 'Beradu/Penalti'} (A: +${calc.totalRoundPointsA}, B: +${calc.totalRoundPointsB})`,
      previousValue: `${scoreA} - ${scoreB}`,
      newValue: `${newScoreA} - ${newScoreB}`,
      details: calc,
    };
    setAuditLogs((prev) => [...prev, auditEntry]);

    // Update identity
    setIdentity((prev) => ({
      ...prev,
      roundNumber: nextRoundNumber,
    }));
  };

  // Next Set Action
  const handleStartNextSet = () => {
    const nextSetNumber = currentSet + 1;
    setCurrentSet(nextSetNumber);
    setScoreA(0);
    setScoreB(0);
    setLastRoundApollo(false);

    setIdentity((prev) => ({
      ...prev,
      setNumber: nextSetNumber,
    }));

    const auditEntry: AuditLogEntry = {
      id: 'audit-set-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      action: 'CONFIG_CHANGE',
      operatorName,
      setNumber: nextSetNumber,
      reason: `Memulai Set ${nextSetNumber}. Skor direset ke 0 - 0 untuk set baru.`,
    };
    setAuditLogs((prev) => [...prev, auditEntry]);
  };

  // Edit round score with mandatory referee reason
  const handleEditRoundScore = (
    roundId: string,
    newRoundPtsA: number,
    newRoundPtsB: number,
    reason: string,
    refereeName: string
  ) => {
    const targetRound = roundHistory.find((r) => r.id === roundId);
    if (!targetRound) return;

    const oldA = targetRound.calculation.totalRoundPointsA;
    const oldB = targetRound.calculation.totalRoundPointsB;

    const updatedHistory = roundHistory.map((r) => {
      if (r.id === roundId) {
        return {
          ...r,
          calculation: {
            ...r.calculation,
            totalRoundPointsA: newRoundPtsA,
            totalRoundPointsB: newRoundPtsB,
          },
        };
      }
      return r;
    });

    setRoundHistory(updatedHistory);

    // Recalculate scores for current set
    const currentSetRounds = updatedHistory.filter((r) => r.setNumber === currentSet);
    const sumA = currentSetRounds.reduce((s, r) => s + r.calculation.totalRoundPointsA, 0);
    const sumB = currentSetRounds.reduce((s, r) => s + r.calculation.totalRoundPointsB, 0);
    setScoreA(sumA);
    setScoreB(sumB);

    const auditEntry: AuditLogEntry = {
      id: 'audit-edit-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      action: 'EDIT_ROUND',
      operatorName: refereeName,
      roundNumber: targetRound.roundNumber,
      setNumber: targetRound.setNumber,
      reason,
      previousValue: `Poin Ronde R${targetRound.roundNumber}: A=+${oldA}, B=+${oldB}`,
      newValue: `Poin Ronde R${targetRound.roundNumber}: A=+${newRoundPtsA}, B=+${newRoundPtsB}`,
    };
    setAuditLogs((prev) => [...prev, auditEntry]);
  };

  // Delete round
  const handleDeleteRound = (roundId: string, reason: string, refereeName: string) => {
    const targetRound = roundHistory.find((r) => r.id === roundId);
    if (!targetRound) return;

    const updatedHistory = roundHistory.filter((r) => r.id !== roundId);
    setRoundHistory(updatedHistory);

    // Recalculate scores
    const currentSetRounds = updatedHistory.filter((r) => r.setNumber === currentSet);
    const sumA = currentSetRounds.reduce((s, r) => s + r.calculation.totalRoundPointsA, 0);
    const sumB = currentSetRounds.reduce((s, r) => s + r.calculation.totalRoundPointsB, 0);
    setScoreA(sumA);
    setScoreB(sumB);

    const auditEntry: AuditLogEntry = {
      id: 'audit-del-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      action: 'DELETE_ROUND',
      operatorName: refereeName,
      roundNumber: targetRound.roundNumber,
      setNumber: targetRound.setNumber,
      reason,
      previousValue: `Ronde ${targetRound.roundNumber} tercatat`,
      newValue: `Ronde ${targetRound.roundNumber} dihapus`,
    };
    setAuditLogs((prev) => [...prev, auditEntry]);
  };

  // Save settings
  const handleSaveSettings = (
    newIdentity: MatchIdentity,
    newConfig: MatchConfig,
    newOperator: string,
    reason: string
  ) => {
    setIdentity(newIdentity);
    setConfig(newConfig);
    setOperatorName(newOperator);

    const auditEntry: AuditLogEntry = {
      id: 'audit-config-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      action: 'CONFIG_CHANGE',
      operatorName: newOperator,
      reason,
      details: { identity: newIdentity, config: newConfig },
    };
    setAuditLogs((prev) => [...prev, auditEntry]);
  };

  // Reset Match
  const handleResetMatch = (reason: string) => {
    setScoreA(0);
    setScoreB(0);
    setSetsWonA(0);
    setSetsWonB(0);
    setCurrentSet(1);
    setCurrentRound(1);
    setIsMatchCompleted(false);
    setWinner(null);
    setRoundHistory([]);
    setLastRoundApollo(false);

    setIdentity((prev) => ({
      ...prev,
      setNumber: 1,
      roundNumber: 1,
    }));

    const auditEntry: AuditLogEntry = {
      id: 'audit-reset-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('id-ID'),
      action: 'RESET_MATCH',
      operatorName,
      reason,
    };
    setAuditLogs([auditEntry]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Full state object for exports
  const matchState: MatchState = {
    identity,
    config,
    currentSet,
    currentRound,
    scoreA,
    scoreB,
    setsWonA,
    setsWonB,
    isMatchCompleted,
    winner,
    roundHistory,
    auditLogs,
  };

  // STRICT ACCESS GATE: If not authenticated or token not verified, block entire scoreboard!
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 relative overflow-hidden">
        {/* Ambient Page Watermark (5% opacity) */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0" style={{ opacity: 0.05 }}>
          <img
            src="/assets/aistudio/WhatsApp_Image_2026-10-29_at_11.30.18-removebg-preview_755d6aba.png"
            alt="Bakom Domino Club Ambient Background"
            className="w-[650px] max-w-[90vw] object-contain filter drop-shadow-2xl select-none"
          />
        </div>

        <AccessGateModal
          isAuthorized={isAuthorized}
          onAuthorized={(token, role, label, desc, name) => {
            setIsAuthorized(true);
            setUserRole(role);
            setUserLabel(name || label);
            setUserDescription(desc || '');
            if (role === 'viewer') {
              setViewMode('live');
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 relative overflow-hidden">
      {/* Ambient Page Watermark (5% opacity) */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0" style={{ opacity: 0.05 }}>
        <img
          src="/assets/aistudio/WhatsApp_Image_2026-10-29_at_11.30.18-removebg-preview_755d6aba.png"
          alt="Bakom Domino Club Ambient Background"
          className="w-[650px] max-w-[90vw] object-contain filter drop-shadow-2xl select-none"
        />
      </div>

      {/* Top Navigation Bar */}
      <MatchHeader
        identity={identity}
        config={config}
        operatorName={operatorName}
        connectedClients={connectedClients}
        userEmail={userLabel}
        userRole={userRole}
        onLogout={handleLogout}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onOpenAudit={() => setIsAuditOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenMemberManagement={() => setIsMemberModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 space-y-4">
        {/* User Greeting & Access Banner */}
        {userDescription && (
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-stone-300">
                Akses Terverifikasi: <strong className="text-white">{userLabel}</strong> ({userRole.toUpperCase()})
              </span>
              <span className="text-stone-500">•</span>
              <span className="text-amber-300 italic">"{userDescription}"</span>
            </div>
            {!canEditScore && (
              <span className="text-[11px] bg-red-950 text-red-300 border border-red-800 px-2.5 py-0.5 rounded-full font-bold">
                Mode Hanya Lihat (Scoreboard dikunci oleh Wasit)
              </span>
            )}
          </div>
        )}

        {/* View Mode Switcher Bar */}
        <div className="flex items-center justify-between bg-stone-900 border border-stone-800 p-1.5 rounded-2xl max-w-2xl mx-auto shadow-md gap-1">
          <button
            type="button"
            onClick={() => setViewMode('simple')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'simple'
                ? 'bg-amber-500 text-stone-950 shadow-md scale-102'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="truncate">Papan 14 Balak</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('live')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'live'
                ? 'bg-red-600 text-white shadow-md scale-102 ring-1 ring-red-400'
                : 'text-red-400 hover:text-red-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping shrink-0" />
            <Radio className="w-4 h-4 shrink-0" />
            <span className="truncate">LIVE SCORE</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('advanced')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'advanced'
                ? 'bg-amber-500 text-stone-950 shadow-md scale-102'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calculator className="w-4 h-4 shrink-0" />
            <span className="truncate">Kalkulator Batu</span>
          </button>
        </div>

        {/* VIEW MODE: LIVE SCORE SPECTATOR VIEW */}
        {viewMode === 'live' && (
          <LiveScoreView
            identity={identity}
            config={config}
            scoreA={scoreA}
            scoreB={scoreB}
            setsWonA={setsWonA}
            setsWonB={setsWonB}
            currentSet={currentSet}
            currentRound={currentRound}
            simpleRows={simpleRows}
            connectedClients={connectedClients}
            lastRoundApollo={lastRoundApollo}
            onLogout={handleLogout}
          />
        )}

        {/* VIEW MODE 1: SIMPLE SCOREBOARD */}
        {viewMode === 'simple' && (
          <div className="space-y-6">
            <SimpleScoreBoard
              teamAName={identity.teamAName || 'TIM BIRU'}
              teamBName={identity.teamBName || 'TIM MERAH'}
              setBiru={setsWonA}
              setMerah={setsWonB}
              canEdit={canEditScore}
              externalRows={simpleRows}
              onUpdateSets={(b, m) => {
                if (!canEditScore) {
                  alert('Hanya Wasit atau Host resmi yang dapat merubah set.');
                  return;
                }
                setSetsWonA(b);
                setSetsWonB(m);
                liveSync.sendStateUpdate({ setsWonA: b, setsWonB: m }, operatorName);
              }}
              onRoundSaved={handleSimpleRoundSaved}
              onResetBoard={() => {
                if (!canEditScore) {
                  alert('Hanya Wasit atau Host resmi yang dapat mereset papan.');
                  return;
                }
                setScoreA(0);
                setScoreB(0);
                setSimpleRows([]);
                liveSync.sendReset(operatorName);
              }}
            />


            {/* Quick Helper Banner */}
            <div className="max-w-xl mx-auto bg-stone-900/60 border border-stone-800 rounded-2xl p-3.5 text-xs text-stone-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Klik baris balak mana pun untuk memasukkan skor ronde (+11 penalti, +20 normal, +40 2-ujung, +50 balak).</span>
              </div>
              <button
                onClick={() => setIsExportOpen(true)}
                className="text-amber-400 hover:underline font-bold shrink-0"
              >
                Unduh Rekap CSV
              </button>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: ADVANCED WORKSTATION (Complete 28-Domino Picker, Rules, Formulas) */}
        {viewMode === 'advanced' && (
          <div className="space-y-6">
            {/* Scoreboard */}
            <Scoreboard
              identity={identity}
              config={config}
              scoreA={scoreA}
              scoreB={scoreB}
              setsWonA={setsWonA}
              setsWonB={setsWonB}
              currentSet={currentSet}
              currentRound={currentRound}
              isMatchCompleted={isMatchCompleted}
              winner={winner}
              lastRoundApollo={lastRoundApollo}
            />

            {/* Set Won Action Alert Banner */}
            {isCurrentSetWon && !isMatchCompleted && (
              <div className="bg-amber-950/60 border border-amber-500/70 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-pulse">
                <div className="flex items-center gap-3">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <div>
                    <div className="font-extrabold text-sm text-amber-200">
                      SET {currentSet} SELESAI — TARGET 101 POIN TELAH DICAPAI!
                    </div>
                    <div className="text-xs text-amber-300/80">
                      Skor akhir Set {currentSet}: {scoreA} (Tim A) vs {scoreB} (Tim B). Klik tombol di samping untuk memulai set berikutnya.
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartNextSet}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Lanjut ke Set {currentSet + 1}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Main Workstation Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left / Input Section (8 Cols) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                <RoundInputForm
                  identity={identity}
                  config={config}
                  currentScoreState={{
                    scoreA,
                    scoreB,
                    setsA: setsWonA,
                    setsB: setsWonB,
                  }}
                  isSetAlreadyCompleted={isCurrentSetWon}
                  operatorName={operatorName}
                  onConfirmRound={handleConfirmRound}
                  onPreviewCalculation={setPreviewCalculation}
                />
              </div>

              {/* Right / Live Calculation Breakdown Panel (4-5 Cols) */}
              <div className="lg:col-span-5 xl:col-span-4 space-y-4">
                <div className="sticky top-20">
                  <CalculationBreakdownPanel
                    calculation={previewCalculation}
                    identity={identity}
                    isSimulated={true}
                  />
                </div>
              </div>
            </div>

            {/* History & Rekap Table */}
            <HistoryTable
              history={roundHistory}
              identity={identity}
              operatorName={operatorName}
              onEditRoundScore={handleEditRoundScore}
              onDeleteRound={handleDeleteRound}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 border-t border-stone-800 text-stone-500 text-xs py-4 px-6 mt-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 font-mono">
          <div>
            ORADO Score Calculator 101 • Standar Olahraga Domino Indonesia (The Law of Domino 101 Revisi 2026)
          </div>
          <div className="flex items-center gap-3">
            <span>Target: 101 Poin</span>
            <span>•</span>
            <span>Double-Six (28 Batu)</span>
            <span>•</span>
            <button
              onClick={() => setIsRulesOpen(true)}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Panduan Pasal
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TestRunnerModal
        isOpen={isTestsOpen}
        onClose={() => setIsTestsOpen(false)}
      />

      <RulesReferenceModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <AuditLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        auditLogs={auditLogs}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        matchState={matchState}
      />

      <MatchSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        identity={identity}
        config={config}
        operatorName={operatorName}
        onSaveSettings={handleSaveSettings}
        onResetMatch={handleResetMatch}
      />

      {/* Member & Token Access Control Modal (Host & Developer) */}
      <MemberManagementModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        currentUserRole={userRole}
        connectedClients={connectedClients}
      />

      {/* Share Live Link Modal (Generate and copy WhatsApp access links for multi-user sync) */}
      <ShareLiveLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        connectedClients={connectedClients}
        currentRole={userRole}
      />
    </div>
  );
}

