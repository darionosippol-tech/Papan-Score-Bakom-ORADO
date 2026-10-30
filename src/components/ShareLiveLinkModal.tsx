/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, X, Users, Shield, Plus, MessageCircle, UserPlus, Trash2, Mail, ExternalLink } from 'lucide-react';

interface ShareLiveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedClients: number;
  currentRole: string;
}

const DEVELOPER_EMAIL = 'darionosippol@gmail.com';

export const ShareLiveLinkModal: React.FC<ShareLiveLinkModalProps> = ({
  isOpen,
  onClose,
  connectedClients,
  currentRole,
}) => {
  const [activeTab, setActiveTab] = useState<'share' | 'members'>('share');
  const [selectedToken, setSelectedToken] = useState('ORADO-LIVE-2026');
  const [copied, setCopied] = useState(false);
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [newTokenRole, setNewTokenRole] = useState<'viewer' | 'referee'>('viewer');

  // Member Management State
  const [members, setMembers] = useState<Array<{ id?: string; email?: string; name: string; role: string; token?: string; addedAt?: string; description?: string }>>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [memberMessage, setMemberMessage] = useState('');

  const [createdTokens, setCreatedTokens] = useState<Array<{ token: string; label: string; role: string }>>([
    { token: 'ORADO-LIVE-2026', label: 'Link Akses Live Score Utama (Wasit & Anggota)', role: 'referee' },
    { token: 'BAKOM-MEMBER-VIP', label: 'Member Bakom Domino Club', role: 'viewer' },
  ]);

  const isHost = currentRole === 'developer' || localStorage.getItem('orado_user_email_v1') === DEVELOPER_EMAIL;

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  const loadMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (e) {
      console.warn('Failed to load members from server:', e);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim()) {
      setMemberMessage('Masukkan alamat email anggota.');
      return;
    }

    setIsAddingMember(true);
    setMemberMessage('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          name: newMemberName.trim() || undefined,
          role: 'member',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        setNewMemberEmail('');
        setNewMemberName('');
        setMemberMessage(`Sukses: Email ${newMemberEmail.trim()} berhasil didaftarkan!`);
        setTimeout(() => setMemberMessage(''), 3000);
      } else {
        setMemberMessage(data.error || 'Gagal menambahkan anggota.');
      }
    } catch (e) {
      setMemberMessage('Gagal menghubungi server.');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleDeleteMember = async (identifier?: string) => {
    if (!identifier) return;
    if (!confirm(`Hapus izin akses untuk ${identifier}?`)) return;

    try {
      const res = await fetch(`/api/members/${encodeURIComponent(identifier)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) =>
          prev.filter(
            (m) =>
              m.email?.toLowerCase() !== identifier.toLowerCase() &&
              m.token?.toLowerCase() !== identifier.toLowerCase() &&
              m.id !== identifier
          )
        );
      }
    } catch (e) {
      console.error('Failed to delete member:', e);
    }
  };

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareableLiveUrl = `${currentOrigin}/?mode=live&token=${encodeURIComponent(selectedToken)}`;
  const shareableRefereeUrl = `${currentOrigin}/?token=${encodeURIComponent(selectedToken)}`;

  const handleCopyLink = (urlToCopy: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = (urlToSend: string) => {
    const text = encodeURIComponent(
      `*LIVE SCORE DOMINO ORADO 101*\n\nSilakan buka link berikut untuk memantau papan skor pertandingan secara langsung (Real-Time Live Score):\n${urlToSend}\n\n_Izin Akses Resmi Developer: ${DEVELOPER_EMAIL}_`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleGenerateNew = async () => {
    if (!newTokenLabel.trim()) {
      alert('Masukkan keterangan nama penerima link akses.');
      return;
    }

    try {
      const res = await fetch('/api/access/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newTokenLabel, role: newTokenRole }),
      });
      const data = await res.json();
      if (data.success) {
        setCreatedTokens((prev) => [
          ...prev,
          { token: data.token, label: data.label, role: data.role },
        ]);
        setSelectedToken(data.token);
        setNewTokenLabel('');
      }
    } catch (e) {
      const fallbackToken = 'ORADO-' + Math.random().toString(36).substring(2, 7).toUpperCase();
      setCreatedTokens((prev) => [
        ...prev,
        { token: fallbackToken, label: newTokenLabel, role: newTokenRole },
      ]);
      setSelectedToken(fallbackToken);
      setNewTokenLabel('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none font-sans">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden text-stone-100 flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-amber-400">
                Pemberian Akses & Sinkronisasi Live Score
              </h3>
              <p className="text-xs text-stone-400">
                Sinkron realtime ke PC & Handphone seluruh anggota dan penonton.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 bg-stone-950 border-b border-stone-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`py-3 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'share'
                ? 'border-amber-400 text-amber-400 bg-stone-900/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Bagikan Link Live Score</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-3 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              activeTab === 'members'
                ? 'border-amber-400 text-amber-400 bg-stone-900/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Anggota Terdaftar ({members.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {activeTab === 'share' ? (
            <>
              {/* Real-time Status Card */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <div className="font-bold text-emerald-400">
                      Sinkronisasi WebSocket Aktif
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Perangkat terhubung: <strong className="text-white">{connectedClients} pengguna</strong>
                    </div>
                  </div>
                </div>

                <span className="text-[10px] bg-red-950 border border-red-800 text-red-300 font-bold px-2 py-1 rounded-lg">
                  🔴 LIVE REALTIME
                </span>
              </div>

              {/* Shareable Live Score Link (Spectator Mode) */}
              <div className="space-y-1.5 bg-stone-950/80 p-3.5 rounded-2xl border border-amber-500/30">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <span>🔴 Link Khusus Live Score (Penonton & Anggota):</span>
                  </label>
                  <span className="text-[10px] text-stone-400 bg-stone-900 px-2 py-0.5 rounded-md">
                    Hanya Lihat Skor & Balak
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-stone-900 border border-stone-700 rounded-2xl p-2 focus-within:border-amber-400">
                  <input
                    type="text"
                    readOnly
                    value={shareableLiveUrl}
                    className="w-full bg-transparent text-xs text-stone-200 font-mono px-2 outline-hidden select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyLink(shareableLiveUrl)}
                    className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shrink-0 transition-transform active:scale-95 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* WhatsApp Direct Share Button */}
              <button
                type="button"
                onClick={() => handleShareWhatsApp(shareableLiveUrl)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim Link Live Score ke WhatsApp Anggota</span>
              </button>

              {/* Token Selector & Management */}
              <div className="space-y-2 pt-2 border-t border-stone-800">
                <label className="font-bold text-stone-300 block text-[11px]">
                  Pilih / Buat Token Akses Baru:
                </label>

                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {createdTokens.map((item) => (
                    <div
                      key={item.token}
                      onClick={() => setSelectedToken(item.token)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        selectedToken === item.token
                          ? 'bg-amber-500/15 border-amber-500 text-amber-200'
                          : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-800'
                      }`}
                    >
                      <div>
                        <span className="font-mono font-bold text-stone-100">{item.token}</span>
                        <span className="block text-[10px] text-stone-400">{item.label}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.role === 'referee' ? 'bg-blue-900 text-blue-200' : 'bg-stone-800 text-stone-400'
                      }`}>
                        {item.role === 'referee' ? 'Wasit' : 'Penonton'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Create Token Form */}
                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama anggota penerima link..."
                    value={newTokenLabel}
                    onChange={(e) => setNewTokenLabel(e.target.value)}
                    className="flex-1 bg-stone-950 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                  <select
                    value={newTokenRole}
                    onChange={(e) => setNewTokenRole(e.target.value as any)}
                    className="bg-stone-950 border border-stone-700 rounded-xl px-2 py-1.5 text-xs text-stone-300"
                  >
                    <option value="viewer">Penonton</option>
                    <option value="referee">Wasit</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleGenerateNew}
                    className="bg-stone-800 hover:bg-stone-700 text-amber-400 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Buat Token</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* TAB 2: REGISTERED MEMBERS LIST & MANAGEMENT */
            <div className="space-y-4">
              <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 text-xs text-stone-300 leading-relaxed">
                <span className="text-amber-400 font-bold block mb-1">
                  Kontrol Akses Email Anggota:
                </span>
                Hanya email yang terdaftar di bawah ini atau Host (<strong>{DEVELOPER_EMAIL}</strong>) yang dapat membuka aplikasi ini.
              </div>

              {/* Form Add New Member */}
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
                <h5 className="font-bold text-stone-200 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Daftarkan Email Anggota Baru</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    placeholder="Alamat email anggota..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Nama anggota (opsional)..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">
                    Akan diberikan hak akses melihat Live Score & papan pertandingan.
                  </span>
                  <button
                    type="button"
                    disabled={isAddingMember || !newMemberEmail.trim()}
                    onClick={handleAddMember}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAddingMember ? 'Menyimpan...' : 'Tambah Anggota'}</span>
                  </button>
                </div>

                {memberMessage && (
                  <div className="text-[11px] text-amber-400 bg-stone-900 px-3 py-1.5 rounded-lg border border-amber-500/30">
                    {memberMessage}
                  </div>
                )}
              </div>

              {/* Member List Table */}
              <div className="space-y-2">
                <h5 className="font-bold text-stone-300">
                  Daftar Email yang Diizinkan ({members.length}):
                </h5>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {members.map((member) => {
                    const isDeveloper = (member.email || '').toLowerCase() === DEVELOPER_EMAIL.toLowerCase();

                    return (
                      <div
                        key={member.email || member.token || Math.random().toString()}
                        className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Mail className="w-4 h-4 text-stone-500 shrink-0" />
                          <div className="truncate">
                            <div className="font-bold text-stone-100 flex items-center gap-2">
                              <span>{member.name || member.email}</span>
                              {isDeveloper && (
                                <span className="bg-amber-500 text-stone-950 text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase">
                                  HOST UTAMA
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 truncate">
                              {member.token ? `Token: ${member.token}` : ''} {member.email ? `• ${member.email}` : ''}
                            </div>
                          </div>
                        </div>

                        {!isDeveloper && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMember(member.email || member.token)}
                            className="p-1.5 text-stone-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Cabut izin akses anggota ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          )}

          <div className="text-[11px] text-stone-500 bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-center">
            Host / Pembuat Aplikasi: <strong className="text-stone-300">{DEVELOPER_EMAIL}</strong>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950 flex justify-between items-center text-xs">
          <span className="text-stone-400">ORADO 101 Security & Live Score</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
