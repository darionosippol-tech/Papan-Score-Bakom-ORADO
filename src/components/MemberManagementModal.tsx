/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  MessageCircle,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  X,
  RefreshCw,
  Info
} from 'lucide-react';
import { RegisteredMember, MemberRole } from '../types/orado';

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  connectedClients: number;
}

const DEVELOPER_EMAIL = 'darionosippol@gmail.com';

export const MemberManagementModal: React.FC<MemberManagementModalProps> = ({
  isOpen,
  onClose,
  currentUserRole,
  connectedClients,
}) => {
  const [members, setMembers] = useState<RegisteredMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Form New Member State
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [roleInput, setRoleInput] = useState<MemberRole>('member');
  const [descInput, setDescInput] = useState('');
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (data.members) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nameInput.trim()) {
      setFormErrorMessage('Nama member wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setFormErrorMessage(null);
    setFormSuccessMessage(null);

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          email: emailInput.trim() || undefined,
          role: roleInput,
          description: descInput.trim() || 'Akses resmi disetujui oleh Host',
          customToken: customTokenInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
        setFormSuccessMessage(`Sukses! Member "${data.member?.name}" berhasil ditambahkan dengan Token: ${data.member?.token}`);
        setNameInput('');
        setEmailInput('');
        setDescInput('');
        setCustomTokenInput('');
        // Switch back to list after short delay
        setTimeout(() => {
          setActiveTab('list');
          setFormSuccessMessage(null);
        }, 2200);
      } else {
        setFormErrorMessage(data.error || 'Gagal menambahkan member.');
      }
    } catch (err) {
      setFormErrorMessage('Gagal menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (member: RegisteredMember) => {
    if (member.email?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()) {
      alert('Akses Host utama tidak dapat dinonaktifkan.');
      return;
    }

    const nextStatus = member.status === 'active' ? 'revoked' : 'active';
    try {
      const res = await fetch(`/api/members/${encodeURIComponent(member.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === member.id ? { ...m, status: nextStatus } : m))
        );
      }
    } catch (err) {
      console.error('Failed to toggle member status:', err);
    }
  };

  const handleDeleteMember = async (member: RegisteredMember) => {
    if (member.email?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase()) {
      alert('Host utama pembuat aplikasi tidak dapat dihapus.');
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin MENGHAPUS member "${member.name}" (Token: ${member.token}) yang telah keluar?\n\nSetelah dihapus, member ini tidak akan bisa lagi mengakses aplikasi.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/members/${encodeURIComponent(member.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
      } else {
        alert(data.error || 'Gagal menghapus member.');
      }
    } catch (err) {
      alert('Gagal menghubungi server untuk menghapus member.');
    }
  };

  const copyTokenOnly = (token: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(token);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const copyFullLink = (token: string, memberRole: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const modeParam = memberRole === 'viewer' ? '&mode=live' : '';
    const fullUrl = `${origin}/?token=${encodeURIComponent(token)}${modeParam}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(token);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const shareViaWhatsApp = (member: RegisteredMember) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const modeParam = member.role === 'viewer' ? '&mode=live' : '';
    const fullUrl = `${origin}/?token=${encodeURIComponent(member.token)}${modeParam}`;

    const roleName =
      member.role === 'host'
        ? 'Host / Pembuat Aplikasi'
        : member.role === 'referee'
        ? 'Wasit Pertandingan'
        : member.role === 'viewer'
        ? 'Penonton Live Score'
        : 'Anggota / Pemain Resmi';

    const message =
      `*UNDANGAN AKSES RESMI PAPAN SKOR DOMINO ORADO 101*\n\n` +
      `Halo *${member.name}*,\n` +
      `Akses aplikasi papan skor Anda telah disetujui oleh Host:\n\n` +
      `📌 *Peran Hak Akses*: ${roleName}\n` +
      `📝 *Keterangan*: ${member.description}\n` +
      `🔑 *Token Akses*: ${member.token}\n\n` +
      `Silakan klik link berikut untuk langsung membuka aplikasi:\n` +
      `${fullUrl}\n\n` +
      `_Diverifikasi resmi oleh Host: ${DEVELOPER_EMAIL}_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isOpen) return null;

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = roleFilter === 'all' || m.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const activeCount = members.filter((m) => m.status === 'active').length;
  const revokedCount = members.filter((m) => m.status === 'revoked').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-3 md:p-4 select-none font-sans">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-3xl max-h-[92vh] shadow-2xl overflow-hidden text-stone-100 flex flex-col animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">
                  Kelola Member & Hak Akses Token
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Host & Developer Control
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Persetujuan akses, penerbitan token, dan penghapusan member yang masuk / keluar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-3 gap-2 px-6 py-2.5 bg-stone-950/70 border-b border-stone-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-stone-400">Total Member:</span>
            <strong className="text-white font-mono">{members.length}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-stone-400">Token Aktif:</span>
            <strong className="text-emerald-400 font-mono">{activeCount}</strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-stone-400">Dicabut / Nonaktif:</span>
            <strong className="text-rose-400 font-mono">{revokedCount}</strong>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="grid grid-cols-2 bg-stone-950 border-b border-stone-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`py-3 flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'list'
                ? 'border-amber-400 text-amber-400 bg-stone-900/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Member & Token Akses ({members.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('add')}
            className={`py-3 flex items-center justify-center gap-2 transition-colors border-b-2 cursor-pointer ${
              activeTab === 'add'
                ? 'border-amber-400 text-amber-400 bg-stone-900/40'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Member & Terbitkan Token</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 md:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {/* Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari member, token, atau keterangan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-300 focus:border-amber-400 focus:outline-hidden"
                  >
                    <option value="all">Semua Peran</option>
                    <option value="host">Host</option>
                    <option value="referee">Wasit</option>
                    <option value="member">Pemain / Anggota</option>
                    <option value="viewer">Penonton Live Score</option>
                  </select>

                  <button
                    type="button"
                    onClick={fetchMembers}
                    className="p-2 bg-stone-950 border border-stone-700 hover:bg-stone-800 rounded-xl text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Segarkan Data"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-10 bg-stone-950/40 rounded-2xl border border-stone-800 text-stone-500">
                    Tidak ada member yang cocok dengan pencarian Anda.
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const isDeveloper = member.email?.toLowerCase() === DEVELOPER_EMAIL.toLowerCase();
                    const isRevoked = member.status === 'revoked';

                    return (
                      <div
                        key={member.id}
                        className={`bg-stone-950 p-3.5 rounded-2xl border transition-all ${
                          isRevoked
                            ? 'border-rose-950/70 bg-stone-950/40 opacity-70'
                            : 'border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          {/* Member Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white">
                                {member.name}
                              </span>

                              {/* Role Badge */}
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  member.role === 'host'
                                    ? 'bg-amber-500 text-stone-950'
                                    : member.role === 'referee'
                                    ? 'bg-blue-600 text-white'
                                    : member.role === 'viewer'
                                    ? 'bg-red-950 text-red-300 border border-red-800'
                                    : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                }`}
                              >
                                {member.role === 'host'
                                  ? 'HOST / PEMBUAT'
                                  : member.role === 'referee'
                                  ? 'WASIT'
                                  : member.role === 'viewer'
                                  ? 'LIVE SCORE'
                                  : 'MEMBER'}
                              </span>

                              {/* Status Badge */}
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  isRevoked
                                    ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isRevoked ? 'bg-rose-400' : 'bg-emerald-400'
                                  }`}
                                />
                                <span>{isRevoked ? 'Dinonaktifkan' : 'Aktif'}</span>
                              </span>
                            </div>

                            {/* Keterangan Token dari Host */}
                            <div className="text-xs text-amber-300/90 flex items-center gap-1.5">
                              <span className="text-stone-400 font-medium">Keterangan:</span>
                              <span>{member.description}</span>
                            </div>

                            {/* Token Code Display */}
                            <div className="flex items-center gap-2 pt-1 font-mono text-[11px]">
                              <span className="text-stone-400">Token:</span>
                              <span className="bg-stone-900 border border-stone-800 text-amber-400 font-black px-2 py-0.5 rounded-md">
                                {member.token}
                              </span>
                              {member.email && (
                                <>
                                  <span className="text-stone-600">•</span>
                                  <span className="text-stone-400 truncate">{member.email}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center flex-wrap">
                            {/* Copy Token Button */}
                            <button
                              type="button"
                              onClick={() => copyTokenOnly(member.token)}
                              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-300 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Salin Kode Token Saja"
                            >
                              {copiedToken === member.token ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Key className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedToken === member.token ? 'Tersalin' : 'Token'}</span>
                            </button>

                            {/* Copy Full Link Button */}
                            <button
                              type="button"
                              onClick={() => copyFullLink(member.token, member.role)}
                              className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-300 hover:text-amber-300 rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer"
                              title="Salin Tautan Akses Lengkap Langsung Masuk"
                            >
                              {copiedLink === member.token ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>{copiedLink === member.token ? 'Link Tersalin!' : 'Salin Link'}</span>
                            </button>

                            {/* WhatsApp Share Button */}
                            <button
                              type="button"
                              onClick={() => shareViaWhatsApp(member)}
                              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                              title="Kirim Undangan Akses via WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>

                            {/* Toggle Active / Revoke Button */}
                            {!isDeveloper && (
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(member)}
                                className={`px-2 py-1.5 rounded-xl font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  isRevoked
                                    ? 'bg-stone-900 hover:bg-emerald-950 text-emerald-400 border-emerald-900/60'
                                    : 'bg-stone-900 hover:bg-amber-950 text-stone-400 hover:text-amber-300 border-stone-800'
                                }`}
                                title={isRevoked ? 'Aktifkan Kembali Izin Akses' : 'Nonaktifkan / Cabut Akses'}
                              >
                                {isRevoked ? (
                                  <>
                                    <ToggleLeft className="w-4 h-4 text-rose-400" />
                                    <span>Aktifkan</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="w-4 h-4 text-emerald-400" />
                                    <span>Cabut</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* Delete Member (Hapus member yang keluar) */}
                            {!isDeveloper && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMember(member)}
                                className="p-1.5 bg-stone-900 hover:bg-rose-950/60 border border-stone-800 hover:border-rose-800 text-stone-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                                title="Hapus Member Keluar dari Aplikasi"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: TAMBAH MEMBER & TERBITKAN TOKEN BARU */
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-1">
                <div className="font-bold text-amber-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Pemberian Izin Akses & Penerbitan Token Baru</span>
                </div>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Host / Developer memberikan persetujuan akses resmi kepada anggota dengan token dan keterangan khusus yang dicatat ke sistem.
                </p>
              </div>

              {formSuccessMessage && (
                <div className="bg-emerald-950/70 border border-emerald-700 p-3.5 rounded-2xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{formSuccessMessage}</span>
                </div>
              )}

              {formErrorMessage && (
                <div className="bg-rose-950/70 border border-rose-800 p-3.5 rounded-2xl text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{formErrorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Member */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-300 text-xs">
                    Nama Lengkap Member / Penerima <span className="text-rose-400">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Budi Santoso (Klub Bakom)"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                {/* Email (Opsional) */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-300 text-xs">
                    Alamat Email (Opsional):
                  </label>
                  <input
                    type="email"
                    placeholder="contoh: budi@bakom.org"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                  />
                </div>

                {/* Role / Peran */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-300 text-xs">
                    Hak Akses / Peran Member <span className="text-rose-400">*</span>:
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as MemberRole)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden"
                  >
                    <option value="referee">Wasit / Pengatur Skor (Bisa Ubah Skor & Balak)</option>
                    <option value="member">Pemain / Anggota Resmi (Papan Skor Lengkap)</option>
                    <option value="viewer">Penonton (Khusus Akses Live Score & Balak)</option>
                  </select>
                </div>

                {/* Custom Token (Optional) */}
                <div className="space-y-1">
                  <label className="font-bold text-stone-300 text-xs">
                    Kode Token Kustom (Kosongkan untuk otomatis):
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: ORD-WASIT-01 (otomatis jika kosong)"
                    value={customTokenInput}
                    onChange={(e) => setCustomTokenInput(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:border-amber-400 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Keterangan Token dari Host */}
              <div className="space-y-1">
                <label className="font-bold text-stone-300 text-xs flex items-center justify-between">
                  <span>Keterangan yang Diberikan oleh Host / Developer:</span>
                  <span className="text-stone-500 font-normal text-[11px]">(Muncul di layar member saat login)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Izin resmi Wasit Meja 01 Kejuaraan Nasional Domino ORADO 2026..."
                  value={descInput}
                  onChange={(e) => setDescInput(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-hidden resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !nameInput.trim()}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Setujui & Terbitkan Token Akses'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Developer / Host: <strong className="text-stone-300">{DEVELOPER_EMAIL}</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl font-bold cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
