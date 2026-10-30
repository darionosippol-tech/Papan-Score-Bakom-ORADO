/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { SoundConfig, SoundType } from '../types/orado';
import {
  Volume2,
  VolumeX,
  X,
  Play,
  Square,
  Upload,
  Trash2,
  RotateCcw,
  Sparkles,
  Check,
  ShieldCheck,
  Mic,
  MessageSquare
} from 'lucide-react';
import { playVictorySound, stopVictorySound } from '../utils/audio';

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  canEdit: boolean; // Only Host and Referee
  soundConfig: SoundConfig;
  onSaveSoundConfig: (config: SoundConfig) => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  isOpen,
  onClose,
  canEdit,
  soundConfig: initialConfig,
  onSaveSoundConfig,
}) => {
  const [config, setConfig] = useState<SoundConfig>({ ...initialConfig });
  const [isPlaying, setIsPlaying] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTestSound = () => {
    setIsPlaying(true);
    playVictorySound(config).finally(() => {
      setIsPlaying(false);
    });
  };

  const handleStopSound = () => {
    stopVictorySound();
    setIsPlaying(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|mp4)$/i)) {
      setFeedbackMsg('Format file harus berupa audio (MP3, WAV, M4A, OGG).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setFeedbackMsg('Ukuran file maksimal 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setConfig({
        ...config,
        soundType: 'custom_upload',
        customAudioDataUrl: dataUrl,
        customAudioName: file.name,
      });
      setFeedbackMsg(`File "${file.name}" berhasil dimuat.`);
    };
    reader.readAsDataURL(file);
  };

  const handleResetToDefault = () => {
    setConfig({
      enabled: true,
      soundType: 'default_audio',
      customText: 'Selamat! Tim memenangkan set kejuaraan ORADO!',
      customAudioDataUrl: '',
      customAudioName: '',
      volume: 1.0,
    });
    setFeedbackMsg('Pengaturan suara berhasil direset ke suara kemenangan resmi terbaru.');
  };

  const handleDeleteSound = () => {
    setConfig({
      ...config,
      enabled: false,
      soundType: 'muted',
      customAudioDataUrl: '',
      customAudioName: '',
    });
    setFeedbackMsg('Suara kemenangan dinonaktifkan / dihapus.');
  };

  const handleSave = () => {
    onSaveSoundConfig(config);
    setFeedbackMsg('Pengaturan suara tersimpan dan disinkronkan ke seluruh Live Score!');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-amber-400">
                Pengaturan Suara Kemenangan
              </h3>
              <p className="text-xs text-stone-400">
                Atur, ubah, atau hapus suara pemenang game 101 ORADO
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStopSound();
              onClose();
            }}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Warning if not authorized */}
        {!canEdit && (
          <div className="bg-rose-950/60 border-b border-rose-800/80 px-6 py-2.5 text-xs text-rose-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Mode Lihat: Hanya Wasit & Host yang berwenang mengubah pengaturan suara.</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Master Enable / Disable Toggle */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-stone-200 text-sm block">Status Efek Suara</span>
              <span className="text-stone-400 text-xs">
                {config.enabled ? 'Suara aktif saat tim memenangkan set / mencapai 101 poin' : 'Suara dimatikan / senyap total'}
              </span>
            </div>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                config.enabled
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              } ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {config.enabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{config.enabled ? 'Suara ON' : 'Suara MUTE'}</span>
            </button>
          </div>

          {/* Sound Type Selection */}
          <div className="space-y-3">
            <label className="font-bold text-stone-300 uppercase tracking-wider block">
              Pilih Sumber / Jenis Suara
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Default Audio */}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setConfig({ ...config, soundType: 'default_audio', enabled: true })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.soundType === 'default_audio'
                    ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400/40 text-white'
                    : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700'
                } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-amber-300 text-xs">Suara Kemenangan Terbaru (Resmi)</span>
                  {config.soundType === 'default_audio' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <div className="text-[11px] text-stone-300 font-medium">
                  Efek suara resmi kejuaraan ORADO (mix audio)
                </div>
                <div className="text-[10px] text-stone-500 mt-1">Audio MP3 resmi terbaru</div>
              </button>

              {/* 2. Custom Text to Speech (TTS) */}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setConfig({ ...config, soundType: 'tts_custom', enabled: true })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.soundType === 'tts_custom'
                    ? 'bg-blue-500/15 border-blue-400 ring-1 ring-blue-400/40 text-white'
                    : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700'
                } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Kustom Teks Suara (TTS)
                  </span>
                  {config.soundType === 'tts_custom' && <Check className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="text-[11px] text-stone-300 font-medium">
                  Ucapkan teks bahasa Indonesia yang diketik bebas
                </div>
                <div className="text-[10px] text-stone-500 mt-1">Sintesis suara otomatis</div>
              </button>

              {/* 3. Upload Custom Audio File */}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setConfig({ ...config, soundType: 'custom_upload', enabled: true })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.soundType === 'custom_upload'
                    ? 'bg-purple-500/15 border-purple-400 ring-1 ring-purple-400/40 text-white'
                    : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700'
                } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    Upload File Audio Sendiri
                  </span>
                  {config.soundType === 'custom_upload' && <Check className="w-4 h-4 text-purple-400" />}
                </div>
                <div className="text-[11px] text-stone-300 font-medium truncate">
                  {config.customAudioName || 'Upload file MP3 / WAV'}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">File audio dari HP / Laptop</div>
              </button>

              {/* 4. Synthesizer Fanfare */}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setConfig({ ...config, soundType: 'preset_fanfare', enabled: true })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.soundType === 'preset_fanfare'
                    ? 'bg-emerald-500/15 border-emerald-400 ring-1 ring-emerald-400/40 text-white'
                    : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700'
                } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Terompet Kemenangan (Fanfare)
                  </span>
                  {config.soundType === 'preset_fanfare' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-[11px] text-stone-300 font-medium">
                  Harmoni melodi nada juara
                </div>
                <div className="text-[10px] text-stone-500 mt-1">Preset synthesizer jernih</div>
              </button>

              {/* 5. Referee Whistle */}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setConfig({ ...config, soundType: 'preset_whistle', enabled: true })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.soundType === 'preset_whistle'
                    ? 'bg-orange-500/15 border-orange-400 ring-1 ring-orange-400/40 text-white'
                    : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700'
                } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-orange-300 text-xs">Peluit Wasit Domino</span>
                  {config.soundType === 'preset_whistle' && <Check className="w-4 h-4 text-orange-400" />}
                </div>
                <div className="text-[11px] text-stone-300 font-medium">
                  Bunyi peluit wasit penanda game selesai
                </div>
              </button>

              {/* 6. Deep Gong ORADO */}
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setConfig({ ...config, soundType: 'preset_gong', enabled: true })}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  config.soundType === 'preset_gong'
                    ? 'bg-rose-500/15 border-rose-400 ring-1 ring-rose-400/40 text-white'
                    : 'bg-stone-950/70 border-stone-800 text-stone-400 hover:border-stone-700'
                } ${!canEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-rose-300 text-xs">Gong Kejuaraan ORADO</span>
                  {config.soundType === 'preset_gong' && <Check className="w-4 h-4 text-rose-400" />}
                </div>
                <div className="text-[11px] text-stone-300 font-medium">
                  Dentuman gong penutup set
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Detail: TTS Input Field */}
          {config.soundType === 'tts_custom' && (
            <div className="bg-blue-950/40 border border-blue-900/60 p-4 rounded-2xl space-y-2 animate-in fade-in">
              <label className="font-bold text-blue-300 block text-xs">
                Kalimat Kemenangan yang Diucapkan Wasit/Host:
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={config.customText || ''}
                onChange={(e) => setConfig({ ...config, customText: e.target.value })}
                placeholder="Contoh: Selamat kepada Tim Biru yang berhasil memenangkan set kejuaraan ORADO 101!"
                className="w-full bg-stone-950 border border-stone-700 rounded-xl p-3 text-stone-100 text-xs focus:ring-1 focus:ring-blue-400"
              />
              <span className="text-[11px] text-stone-400 block">
                Teks ini akan dibacakan otomatis melalui Speech Synthesis saat salah satu tim menyentuh 101 poin.
              </span>
            </div>
          )}

          {/* Conditional Detail: Upload File Controls */}
          {config.soundType === 'custom_upload' && (
            <div className="bg-purple-950/40 border border-purple-900/60 p-4 rounded-2xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-300 block text-xs">File Audio Kustom:</span>
                  <span className="text-stone-300 text-xs font-mono">
                    {config.customAudioName || 'Belum ada file dipilih'}
                  </span>
                </div>
                {canEdit && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File Audio</span>
                    </button>
                  </div>
                )}
              </div>
              {config.customAudioDataUrl && (
                <div className="flex items-center gap-2 pt-1 border-t border-purple-900/40">
                  <span className="text-emerald-400 font-bold text-[11px]">✓ File audio tersimpan</span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setConfig({
                          ...config,
                          customAudioDataUrl: '',
                          customAudioName: '',
                          soundType: 'default_audio',
                        });
                        setFeedbackMsg('File audio kustom dihapus.');
                      }}
                      className="text-rose-400 hover:text-rose-300 text-[11px] underline ml-auto cursor-pointer"
                    >
                      Hapus File Ini
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Volume Slider */}
          <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-300">Volume Suara</span>
              <span className="text-amber-400 font-mono font-bold">
                {Math.round((config.volume || 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              disabled={!canEdit}
              value={config.volume !== undefined ? config.volume : 1.0}
              onChange={(e) => setConfig({ ...config, volume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Feedback message banner */}
          {feedbackMsg && (
            <div className="p-3 bg-stone-800 border border-amber-400/40 rounded-xl text-amber-300 text-xs font-medium">
              {feedbackMsg}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Test Play / Stop */}
            <button
              type="button"
              onClick={isPlaying ? handleStopSound : handleTestSound}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${
                isPlaying
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
              }`}
            >
              {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Hentikan' : 'Tes Putar Suara'}</span>
            </button>

            {/* Reset to Default */}
            {canEdit && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="flex items-center gap-1 text-stone-400 hover:text-stone-200 px-2 py-1.5 text-xs font-medium cursor-pointer"
                title="Kembalikan ke suara kemenangan resmi bawaan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Bawaan</span>
              </button>
            )}

            {/* Delete / Mute */}
            {canEdit && (
              <button
                type="button"
                onClick={handleDeleteSound}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 px-2 py-1.5 text-xs font-medium cursor-pointer"
                title="Hapus / Matikan suara sepenuhnya"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus / Mute</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleStopSound();
                onClose();
              }}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer transition-transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Pengaturan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
