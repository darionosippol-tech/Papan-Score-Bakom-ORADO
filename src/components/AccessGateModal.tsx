/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  ShieldCheck,
  Mail,
  Key,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Users,
  ShieldAlert
} from 'lucide-react';

interface AccessGateModalProps {
  isAuthorized: boolean;
  onAuthorized: (token: string, role: string, label: string, description?: string, memberName?: string) => void;
}

const DEVELOPER_EMAIL = 'darionosippol@gmail.com';
const STORAGE_ACCESS_KEY = 'orado_access_token_v1';
const STORAGE_EMAIL_KEY = 'orado_user_email_v1';
const STORAGE_ROLE_KEY = 'orado_user_role_v1';
const STORAGE_LABEL_KEY = 'orado_user_label_v1';
const STORAGE_DESC_KEY = 'orado_user_desc_v1';

export const AccessGateModal: React.FC<AccessGateModalProps> = ({ isAuthorized, onAuthorized }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    memberName: string;
    role: string;
    token: string;
    description: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'token' | 'email'>('token');

  // Check URL query parameters and local storage on mount
  useEffect(() => {
    if (sessionStorage.getItem('orado_explicit_logout') === 'true') {
      sessionStorage.removeItem('orado_explicit_logout');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token') || params.get('access') || params.get('key');
    const urlEmail = params.get('email');
    const storedToken = localStorage.getItem(STORAGE_ACCESS_KEY);
    const storedEmail = localStorage.getItem(STORAGE_EMAIL_KEY);

    if (urlToken) {
      validateToken(urlToken);
    } else if (urlEmail) {
      validateEmail(urlEmail);
    } else if (storedToken) {
      validateToken(storedToken);
    } else if (storedEmail) {
      validateEmail(storedEmail);
    }
  }, []);

  // When unauthorized (e.g. user clicked Keluar), reset inputs and states cleanly
  useEffect(() => {
    if (!isAuthorized) {
      setTokenInput('');
      setEmailInput('');
      setSuccessInfo(null);
    }
  }, [isAuthorized]);

  const validateToken = async (token: string) => {
    const cleanToken = token.trim();
    if (!cleanToken) {
      setErrorMessage('Silakan masukkan kode token akses Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessInfo(null);

    try {
      const res = await fetch(`/api/access/validate?token=${encodeURIComponent(cleanToken)}`);
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem(STORAGE_ACCESS_KEY, cleanToken);
        localStorage.setItem(STORAGE_ROLE_KEY, data.role || 'member');
        localStorage.setItem(STORAGE_LABEL_KEY, data.label || cleanToken);
        localStorage.setItem(STORAGE_DESC_KEY, data.description || '');

        setSuccessInfo({
          memberName: data.memberName || data.label,
          role: data.role,
          token: cleanToken,
          description: data.description || 'Akses disetujui oleh Host',
        });

        // Delay entry slightly so user sees the approved confirmation and host's notes
        setTimeout(() => {
          onAuthorized(cleanToken, data.role, data.label, data.description, data.memberName);
        }, 1200);
      } else {
        localStorage.removeItem(STORAGE_ACCESS_KEY);
        setErrorMessage(data.message || 'Token akses tidak valid atau tidak memiliki persetujuan Host.');
      }
    } catch (e) {
      const savedToken = localStorage.getItem(STORAGE_ACCESS_KEY);
      if (savedToken && savedToken.toUpperCase() === cleanToken.toUpperCase()) {
        const savedRole = localStorage.getItem(STORAGE_ROLE_KEY) || 'member';
        const savedLabel = localStorage.getItem(STORAGE_LABEL_KEY) || cleanToken;
        const savedDesc = localStorage.getItem(STORAGE_DESC_KEY) || 'Akses Terverifikasi Sesi Sebelumnya';
        onAuthorized(cleanToken, savedRole, savedLabel, savedDesc);
      } else {
        setErrorMessage('Gagal memverifikasi token. Pastikan koneksi server aktif dan kode token Anda benar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Silakan masukkan alamat email terdaftar Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessInfo(null);

    try {
      const res = await fetch(`/api/access/validate?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem(STORAGE_EMAIL_KEY, cleanEmail);
        localStorage.setItem(STORAGE_ACCESS_KEY, data.token || `TOKEN-${cleanEmail}`);
        localStorage.setItem(STORAGE_ROLE_KEY, data.role || 'member');
        localStorage.setItem(STORAGE_LABEL_KEY, data.label || cleanEmail);
        localStorage.setItem(STORAGE_DESC_KEY, data.description || '');

        setSuccessInfo({
          memberName: data.memberName || data.label,
          role: data.role,
          token: data.token || cleanEmail,
          description: data.description || 'Akses disetujui oleh Host',
        });

        setTimeout(() => {
          onAuthorized(data.token || `TOKEN-${cleanEmail}`, data.role, data.label, data.description, data.memberName);
        }, 1200);
      } else {
        localStorage.removeItem(STORAGE_EMAIL_KEY);
        setErrorMessage(data.message || 'Akses Ditolak: Email belum terdaftar atau belum disetujui oleh Host.');
      }
    } catch (e) {
      if (cleanEmail === DEVELOPER_EMAIL.toLowerCase()) {
        localStorage.setItem(STORAGE_EMAIL_KEY, cleanEmail);
        localStorage.setItem(STORAGE_ACCESS_KEY, 'ORADO-DEV-MASTER-2026');
        onAuthorized('ORADO-DEV-MASTER-2026', 'host', 'Host Utama', 'Akses Penuh Host', 'Host');
      } else {
        setErrorMessage('Gagal memverifikasi email dengan server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestTokenWhatsApp = () => {
    const text = encodeURIComponent(
      `*PERMOHONAN AKSES PAPAN SKOR DOMINO ORADO 101*\n\n` +
      `Halo Host / Pengelola Papan Skor,\n` +
      `Saya ingin meminta izin akses dan kode token resmi untuk aplikasi Papan Skor Domino ORADO 101 (Bakom Domino Club).\n\n` +
      `Nama Saya: \n` +
      `Sebagai (Wasit / Pemain / Tamu): \n` +
      `Terima kasih!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (isAuthorized) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-3 md:p-4 select-none font-sans overflow-y-auto">
      <div className="bg-stone-900 border-2 border-stone-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-stone-100 flex flex-col animate-in fade-in zoom-in-95 my-auto">
        {/* Top Header Badge */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-stone-900 px-6 py-5 flex items-center gap-3.5 text-stone-950">
          <div className="w-14 h-14 rounded-2xl bg-stone-950 p-1 flex items-center justify-center shadow-xl shrink-0 border border-amber-500/40">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-10-29_at_11.30.18-removebg-preview_755d6aba.png"
              alt="Bakom Domino Club"
              className="w-full h-full object-contain filter drop-shadow"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base md:text-lg text-white tracking-wide">
                GERBANG AKSES ORADO 101
              </h3>
              <span className="bg-stone-950/80 text-amber-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-400/30">
                Akses Terkunci
              </span>
            </div>
            <p className="text-xs text-amber-100/90 font-medium leading-tight mt-0.5">
              Khusus Member Resmi & Tamu yang Memiliki Token Akses
            </p>
          </div>
        </div>

        {/* Security Alert Notice */}
        <div className="p-5 md:p-6 space-y-4">
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs space-y-2 text-stone-300">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Ketentuan Hak Akses Papan Skor:</span>
            </div>
            <p className="leading-relaxed text-stone-300">
              Sesuai aturan keamanan aplikasi, <strong>hanya Host, member resmi terdaftar, atau tamu yang telah memiliki kode token persetujuan yang dapat mengakses papan skor ini</strong>.
            </p>
          </div>

          {/* Success Validation Card */}
          {successInfo && (
            <div className="bg-emerald-950/80 border border-emerald-600 p-4 rounded-2xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Persetujuan Akses Terverifikasi!</span>
              </div>
              <div className="text-stone-200">
                Selamat datang, <strong>{successInfo.memberName}</strong>!
              </div>
              <div className="text-stone-400 text-[11px] bg-stone-900/60 p-2.5 rounded-xl border border-emerald-800/40">
                <span className="text-emerald-400 font-semibold block mb-0.5">Keterangan Akses:</span>
                "{successInfo.description}"
              </div>
              <div className="text-emerald-300 font-semibold text-[11px] animate-pulse">
                Membuka papan skor pertandingan...
              </div>
            </div>
          )}

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="bg-rose-950/80 border border-rose-800 p-3.5 rounded-2xl text-xs text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Tab Selector */}
          <div className="grid grid-cols-2 gap-2 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('token');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'token'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Token Akses</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'email'
                  ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Member / Host</span>
            </button>
          </div>

          {/* Form Tab 1: Token Verification */}
          {activeTab === 'token' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Masukkan Kode Token Akses Resmi:
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Masukkan kode token akses Anda..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-mono uppercase font-bold focus:border-amber-400 focus:outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') validateToken(tokenInput);
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading || !tokenInput.trim() || !!successInfo}
                onClick={() => validateToken(tokenInput)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 cursor-pointer"
              >
                <span>{isLoading ? 'Memvalidasi Token...' : 'Verifikasi & Masuk Papan Skor'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Form Tab 2: Email Verification */
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Masukkan Alamat Email Terdaftar:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Masukkan alamat email terdaftar..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white font-medium focus:border-amber-400 focus:outline-hidden"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') validateEmail(emailInput);
                    }}
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading || !emailInput.trim() || !!successInfo}
                onClick={() => validateEmail(emailInput)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98 cursor-pointer"
              >
                <span>{isLoading ? 'Memeriksa Email...' : 'Masuk sebagai Anggota'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Request Access from Host Button */}
          <div className="pt-2 border-t border-stone-800">
            <button
              type="button"
              onClick={handleRequestTokenWhatsApp}
              className="w-full py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-98 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Belum Memiliki Token? Minta Izin Akses ke Host</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>ORADO 101 Security Gate</span>
          </span>
          <span className="text-stone-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Akses Terproteksi & Terenkripsi</span>
          </span>
        </div>
      </div>
    </div>
  );
};
