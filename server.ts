/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DEVELOPER_EMAIL = 'darionosippol@gmail.com';

app.use(express.json());

// In-Memory Authoritative Store for Live Match State
interface StoredMatchState {
  identity: {
    matchNumber: string;
    tournamentName: string;
    tableNumber: string;
    teamAName: string;
    teamBName: string;
    playerNames: Record<string, string>;
    setNumber: number;
    roundNumber: number;
    rulesVersion: string;
  };
  config: any;
  currentSet: number;
  currentRound: number;
  scoreA: number;
  scoreB: number;
  setsWonA: number;
  setsWonB: number;
  isMatchCompleted: boolean;
  winner: string | null;
  roundHistory: any[];
  simpleRows: any[];
  lastRoundApollo: boolean;
  soundConfig?: any;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_STATE: StoredMatchState = {
  identity: {
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
  },
  config: {
    targetSetPoints: 101,
    matchFormat: 'best_of_3',
    apolloEffect: 'double_set',
    doubleEndMultiplier: 2,
    balakBonusPoints: 50,
    allowCombineBalakAndDoubleEnd: false,
    standardPenaltyPoints: 11,
    rulesVersion: 'The Law of Domino 101 ORADO (Revisi 2026)',
  },
  currentSet: 1,
  currentRound: 1,
  scoreA: 0,
  scoreB: 0,
  setsWonA: 0,
  setsWonB: 0,
  isMatchCompleted: false,
  winner: null,
  roundHistory: [],
  simpleRows: [
    { id: 1, balakNumber: 0, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 2, balakNumber: 1, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 3, balakNumber: 2, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 4, balakNumber: 3, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 5, balakNumber: 4, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 6, balakNumber: 5, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 7, balakNumber: 6, cycle: 1, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 8, balakNumber: 0, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 9, balakNumber: 1, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 10, balakNumber: 2, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 11, balakNumber: 3, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 12, balakNumber: 4, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 13, balakNumber: 5, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
    { id: 14, balakNumber: 6, cycle: 2, scoreBiru: null, scoreMerah: null, winner: null },
  ],
  lastRoundApollo: false,
  soundConfig: {
    enabled: true,
    soundType: 'default_audio',
    customText: 'Kejepit nih! Tim Biru memenangkan ronde!',
    customAudioDataUrl: '',
    customAudioName: '',
    volume: 1.0,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'Sistem Wasit ORADO',
};

let currentMatchState: StoredMatchState = { ...DEFAULT_STATE };

import fs from 'fs';

// Whitelist of Registered Member Tokens authorized by Host / Developer
export interface MemberRecord {
  id: string;
  name: string;
  email?: string;
  role: 'host' | 'referee' | 'member' | 'viewer';
  token: string;
  description: string; // Keterangan yang diberikan oleh Host/Developer
  status: 'active' | 'revoked';
  addedAt: string;
  addedBy: string;
  lastActive?: string;
}

const DATA_DIR = path.join(__dirname, 'data');
const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');

const INITIAL_MEMBERS: MemberRecord[] = [
  {
    id: 'mem-host-dariono',
    name: 'Dariono (Host / Pembuat Aplikasi)',
    email: DEVELOPER_EMAIL,
    role: 'host',
    token: 'ORADO-DEV-MASTER-2026',
    description: 'Akses Penuh Host & Developer Pembuat Aplikasi',
    status: 'active',
    addedAt: '2026-10-30T00:00:00.000Z',
    addedBy: 'SYSTEM_INIT',
  },
  {
    id: 'mem-referee-1',
    name: 'Wasit Utama Meja 01',
    role: 'referee',
    token: 'ORADO-LIVE-2026',
    description: 'Persetujuan Host untuk Wasit Pertandingan & Kontrol Papan Skor',
    status: 'active',
    addedAt: '2026-10-30T00:00:00.000Z',
    addedBy: DEVELOPER_EMAIL,
  },
  {
    id: 'mem-bakom-vip',
    name: 'Member Bakom Domino Club',
    email: 'member@bakom.org',
    role: 'member',
    token: 'BAKOM-MEMBER-VIP',
    description: 'Anggota Resmi Bakom Domino Club (Papan Skor & Rekap)',
    status: 'active',
    addedAt: '2026-10-30T00:00:00.000Z',
    addedBy: DEVELOPER_EMAIL,
  },
  {
    id: 'mem-viewer-live',
    name: 'Penonton / Live Score Publik',
    role: 'viewer',
    token: 'LIVE-SCORE-2026',
    description: 'Akses Khusus Pantau Skor & Balak Real-Time',
    status: 'active',
    addedAt: '2026-10-30T00:00:00.000Z',
    addedBy: DEVELOPER_EMAIL,
  },
];

let registeredMembersList: MemberRecord[] = [];

// Helper to load members from disk
function loadMembersFromDisk(): MemberRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(MEMBERS_FILE)) {
      const data = fs.readFileSync(MEMBERS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading members from disk:', err);
  }
  // If not found or error, save initial members
  saveMembersToDisk(INITIAL_MEMBERS);
  return INITIAL_MEMBERS;
}

// Helper to save members to disk
function saveMembersToDisk(members: MemberRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(MEMBERS_FILE, JSON.stringify(members, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving members to disk:', err);
  }
}

registeredMembersList = loadMembersFromDisk();

// Broadcast helper to all connected WebSockets
function broadcastState(senderSocket?: WebSocket, customEvent?: any) {
  const payload = JSON.stringify({
    type: customEvent ? customEvent.type : 'STATE_UPDATE',
    state: currentMatchState,
    event: customEvent || null,
    connectedClients: wss.clients.size,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: wss.clients.size,
    developer: DEVELOPER_EMAIL,
    totalMembers: registeredMembersList.length,
    timestamp: new Date().toISOString(),
  });
});

// Get current match state
app.get('/api/match-state', (req, res) => {
  res.json({
    state: currentMatchState,
    connectedClients: wss.clients.size,
  });
});

// Update match state
app.post('/api/match-state', (req, res) => {
  const { state, updatedBy, triggerVictorySound } = req.body;
  if (!state) {
    return res.status(400).json({ error: 'Missing state' });
  }

  currentMatchState = {
    ...currentMatchState,
    ...state,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || currentMatchState.updatedBy,
  };

  const customEvent = triggerVictorySound ? { type: 'PLAY_VICTORY_SOUND' } : undefined;
  broadcastState(undefined, customEvent);
  res.json({ success: true, state: currentMatchState });
});

// Reset match state
app.post('/api/match-reset', (req, res) => {
  currentMatchState = {
    ...DEFAULT_STATE,
    updatedAt: new Date().toISOString(),
    updatedBy: req.body.operator || 'Reset Wasit',
  };
  broadcastState();
  res.json({ success: true, state: currentMatchState });
});

// Sound configuration endpoints (Wasit / Host managed)
app.get('/api/sound-config', (req, res) => {
  res.json({
    soundConfig: currentMatchState.soundConfig,
  });
});

app.post('/api/sound-config', (req, res) => {
  const { soundConfig, updatedBy } = req.body;
  if (soundConfig) {
    currentMatchState = {
      ...currentMatchState,
      soundConfig,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Wasit/Host',
    };
    broadcastState(undefined, { type: 'SOUND_CONFIG_UPDATED', soundConfig });
    return res.json({ success: true, soundConfig });
  }
  res.status(400).json({ error: 'Missing soundConfig' });
});

// Get list of registered members (Host / Developer view)
app.get('/api/members', (req, res) => {
  res.json({
    success: true,
    host: DEVELOPER_EMAIL,
    totalMembers: registeredMembersList.length,
    activeCount: registeredMembersList.filter(m => m.status === 'active').length,
    members: registeredMembersList,
  });
});

// Add new member & issue token (by Host / Developer)
app.post('/api/members', (req, res) => {
  const { name, email, role, description, customToken } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Nama member wajib diisi.' });
  }

  const cleanName = name.trim();
  const cleanEmail = email && typeof email === 'string' ? email.trim().toLowerCase() : undefined;
  const cleanRole = ['host', 'referee', 'member', 'viewer'].includes(role) ? role : 'member';
  const cleanDesc = description && typeof description === 'string' && description.trim()
    ? description.trim()
    : 'Akses disetujui oleh Host & Developer';

  let tokenToUse = '';
  if (customToken && typeof customToken === 'string' && customToken.trim()) {
    tokenToUse = customToken.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '-');
  } else {
    // Generate clean token like ORD-A7B2-9F1C
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    tokenToUse = `ORD-${part1}-${part2}`;
  }

  // Check if token already exists
  const existingToken = registeredMembersList.find(m => m.token.toUpperCase() === tokenToUse.toUpperCase());
  if (existingToken) {
    return res.status(400).json({ error: `Token ${tokenToUse} sudah digunakan oleh member lain (${existingToken.name}).` });
  }

  const newMember: MemberRecord = {
    id: 'mem-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    name: cleanName,
    email: cleanEmail,
    role: cleanRole,
    token: tokenToUse,
    description: cleanDesc,
    status: 'active',
    addedAt: new Date().toISOString(),
    addedBy: DEVELOPER_EMAIL,
  };

  registeredMembersList = [newMember, ...registeredMembersList];
  saveMembersToDisk(registeredMembersList);

  res.json({
    success: true,
    message: `Akses member '${cleanName}' berhasil disetujui dengan Token: ${tokenToUse}`,
    member: newMember,
    members: registeredMembersList,
  });
});

// Update member (Edit details, toggle active/revoked)
app.put('/api/members/:id', (req, res) => {
  const targetId = req.params.id;
  const { name, email, role, description, status } = req.body;

  const index = registeredMembersList.findIndex(m => m.id === targetId || m.token === targetId);
  if (index === -1) {
    return res.status(404).json({ error: 'Member tidak ditemukan.' });
  }

  const existing = registeredMembersList[index];

  // Protect master host
  if (existing.email === DEVELOPER_EMAIL && status === 'revoked') {
    return res.status(403).json({ error: 'Akses Host / Developer utama tidak dapat dicabut.' });
  }

  const updated: MemberRecord = {
    ...existing,
    name: name !== undefined ? String(name).trim() : existing.name,
    email: email !== undefined ? (email ? String(email).trim().toLowerCase() : undefined) : existing.email,
    role: role && ['host', 'referee', 'member', 'viewer'].includes(role) ? role : existing.role,
    description: description !== undefined ? String(description).trim() : existing.description,
    status: status === 'revoked' ? 'revoked' : 'active',
  };

  registeredMembersList[index] = updated;
  saveMembersToDisk(registeredMembersList);

  res.json({
    success: true,
    message: `Data member '${updated.name}' berhasil diperbarui.`,
    member: updated,
    members: registeredMembersList,
  });
});

// Delete member (Menghapus member yang keluar dari aplikasi)
app.delete('/api/members/:id', (req, res) => {
  const targetId = decodeURIComponent(req.params.id).trim();

  const memberToDelete = registeredMembersList.find(
    m => m.id === targetId || m.token.toUpperCase() === targetId.toUpperCase() || (m.email && m.email.toLowerCase() === targetId.toLowerCase())
  );

  if (!memberToDelete) {
    return res.status(404).json({ error: 'Member tidak ditemukan dalam sistem.' });
  }

  if (memberToDelete.email && memberToDelete.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()) {
    return res.status(403).json({ error: 'Host utama (pembuat aplikasi) tidak dapat dihapus.' });
  }

  registeredMembersList = registeredMembersList.filter(m => m.id !== memberToDelete.id);
  saveMembersToDisk(registeredMembersList);

  res.json({
    success: true,
    message: `Member '${memberToDelete.name}' (Token: ${memberToDelete.token}) berhasil dihapus dari sistem.`,
    members: registeredMembersList,
  });
});

// Validate Access Token or Email
app.get('/api/access/validate', (req, res) => {
  const token = (req.query.token as string || '').trim().toUpperCase();
  const email = (req.query.email as string || '').trim().toLowerCase();

  // If user enters developer/host email directly, give full master host access!
  if (email && email === DEVELOPER_EMAIL.toLowerCase()) {
    return res.json({
      valid: true,
      role: 'host',
      label: 'Host / Pembuat Aplikasi (Dariono)',
      memberName: 'Dariono',
      token: 'ORADO-DEV-MASTER-2026',
      description: 'Host & Developer Pembuat Aplikasi Domino ORADO 101',
    });
  }

  // 1. Check by Token
  if (token) {
    const foundByToken = registeredMembersList.find(m => m.token.toUpperCase() === token);
    if (foundByToken) {
      if (foundByToken.status === 'revoked') {
        return res.json({
          valid: false,
          message: `Akses Ditolak: Token '${token}' untuk '${foundByToken.name}' telah dinonaktifkan / dicabut oleh Host.`,
        });
      }

      // Update last active
      foundByToken.lastActive = new Date().toISOString();
      saveMembersToDisk(registeredMembersList);

      return res.json({
        valid: true,
        role: foundByToken.role,
        label: `${foundByToken.name} (${foundByToken.role.toUpperCase()})`,
        memberName: foundByToken.name,
        token: foundByToken.token,
        description: foundByToken.description,
      });
    }
  }

  // 2. Check by Email
  if (email) {
    const foundByEmail = registeredMembersList.find(m => m.email && m.email.toLowerCase() === email);
    if (foundByEmail) {
      if (foundByEmail.status === 'revoked') {
        return res.json({
          valid: false,
          message: `Akses Ditolak: Akun email '${email}' telah dinonaktifkan oleh Host.`,
        });
      }

      foundByEmail.lastActive = new Date().toISOString();
      saveMembersToDisk(registeredMembersList);

      return res.json({
        valid: true,
        role: foundByEmail.role,
        label: `${foundByEmail.name} (Anggota Terdaftar)`,
        memberName: foundByEmail.name,
        token: foundByEmail.token,
        description: foundByEmail.description,
      });
    }
  }

  res.json({
    valid: false,
    message: 'Akses Ditolak: Token atau email tidak terdaftar atau belum disetujui oleh Host. Silakan hubungi Host untuk mendapatkan izin akses.',
  });
});


// WebSocket Connection Management
wss.on('connection', (ws: WebSocket) => {
  // Send current state immediately on connect
  ws.send(JSON.stringify({
    type: 'INIT_STATE',
    state: currentMatchState,
    connectedClients: wss.clients.size,
    timestamp: new Date().toISOString(),
  }));

  // Notify all of connected clients count update
  broadcastState();

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'UPDATE_STATE') {
        currentMatchState = {
          ...currentMatchState,
          ...data.state,
          updatedAt: new Date().toISOString(),
          updatedBy: data.updatedBy || currentMatchState.updatedBy,
        };
        const customEvent = data.triggerVictorySound ? { type: 'PLAY_VICTORY_SOUND' } : undefined;
        broadcastState(ws, customEvent);
      } else if (data.type === 'TRIGGER_SOUND') {
        broadcastState(undefined, { type: 'PLAY_VICTORY_SOUND' });
      } else if (data.type === 'UPDATE_SOUND_CONFIG') {
        currentMatchState = {
          ...currentMatchState,
          soundConfig: data.soundConfig,
          updatedAt: new Date().toISOString(),
          updatedBy: data.updatedBy || 'Wasit/Host',
        };
        broadcastState(undefined, { type: 'SOUND_CONFIG_UPDATED', soundConfig: data.soundConfig });
      } else if (data.type === 'RESET_MATCH') {
        currentMatchState = {
          ...DEFAULT_STATE,
          updatedAt: new Date().toISOString(),
          updatedBy: data.updatedBy || 'Reset Wasit',
        };
        broadcastState();
      } else if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    // Notify clients count
    broadcastState();
  });
});

// Vite Middleware mounting
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ORADO Score 101 Full-Stack Server running on http://localhost:${PORT}`);
    console.log(`Developer Access Email: ${DEVELOPER_EMAIL}`);
  });
}

startServer();
