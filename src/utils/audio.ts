/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundConfig, SoundType } from '../types/orado';

export const DEFAULT_VICTORY_AUDIO_URL = '/assets/aistudio/mix_05s__audio-joiner.com__9ac03536.mp3';
export const SOUND_CONFIG_STORAGE_KEY = 'orado_sound_config_v3';

export const DEFAULT_SOUND_CONFIG: SoundConfig = {
  enabled: true,
  soundType: 'default_audio',
  customText: 'Selamat! Tim memenangkan set kejuaraan ORADO!',
  customAudioDataUrl: '',
  customAudioName: '',
  volume: 1.0,
};

let currentSoundConfig: SoundConfig = { ...DEFAULT_SOUND_CONFIG };
let victoryAudioInstance: HTMLAudioElement | null = null;
let customAudioInstance: HTMLAudioElement | null = null;

// Initialize config from localStorage
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem(SOUND_CONFIG_STORAGE_KEY);
    if (saved) {
      currentSoundConfig = { ...DEFAULT_SOUND_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Could not read sound config from storage:', e);
  }
}

/**
 * Returns the current sound configuration
 */
export function getSoundConfig(): SoundConfig {
  return { ...currentSoundConfig };
}

/**
 * Updates the sound configuration and persists to localStorage
 */
export function setSoundConfig(config: Partial<SoundConfig>): SoundConfig {
  currentSoundConfig = { ...currentSoundConfig, ...config };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SOUND_CONFIG_STORAGE_KEY, JSON.stringify(currentSoundConfig));
    } catch (e) {
      console.warn('Could not save sound config:', e);
    }
  }
  return { ...currentSoundConfig };
}

/**
 * Resets sound configuration back to factory default
 */
export function resetSoundConfigToDefault(): SoundConfig {
  currentSoundConfig = { ...DEFAULT_SOUND_CONFIG };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SOUND_CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_SOUND_CONFIG));
    } catch (e) {}
  }
  return { ...currentSoundConfig };
}

/**
 * Removes custom audio file and reverts to default audio
 */
export function removeCustomAudio(): SoundConfig {
  return setSoundConfig({
    soundType: 'default_audio',
    customAudioDataUrl: '',
    customAudioName: '',
  });
}

/**
 * Get or create audio element for default victory sound
 */
function getDefaultAudioInstance(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!victoryAudioInstance) {
    victoryAudioInstance = new Audio(DEFAULT_VICTORY_AUDIO_URL);
    victoryAudioInstance.preload = 'auto';
  }
  return victoryAudioInstance;
}

/**
 * Web Audio API synthesizer for sound presets
 */
function playSynthSound(preset: 'fanfare' | 'whistle' | 'cheer' | 'gong', volume: number = 1.0) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (preset === 'fanfare') {
      // Victory Fanfare: Triad chords (C5, E5, G5, C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.3 * volume, ctx.currentTime + i * 0.15 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.7);
      });
    } else if (preset === 'whistle') {
      // Referee Whistle: Dual modulated high frequencies
      [2800, 3100].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        // Vibrato
        const mod = ctx.createOscillator();
        const modGain = ctx.createGain();
        mod.frequency.value = 25;
        modGain.gain.value = 100;
        mod.connect(osc.frequency);
        mod.start();

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.25 * volume, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.25 * volume, ctx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        mod.stop(ctx.currentTime + 0.8);
      });
    } else if (preset === 'gong') {
      // Deep ORADO gong sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(82, ctx.currentTime + 2.5);

      gain.gain.setValueAtTime(0.4 * volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 2.6);
    } else if (preset === 'cheer') {
      // Crowd cheering burst simulation
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 1.2;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.05 * volume, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35 * volume, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(ctx.currentTime);
      noise.stop(ctx.currentTime + 1.6);
    }
  } catch (err) {
    console.warn('Synthesizer audio playback failed:', err);
  }
}

/**
 * Text-to-Speech synthesis in Indonesian
 */
function playTtsSound(text: string, volume: number = 1.0): Promise<boolean> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.volume = Math.max(0, Math.min(1, volume));
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'id-ID';

      // Pick Indonesian voice if available
      const voices = window.speechSynthesis.getVoices();
      const idVoice = voices.find((v) => v.lang.startsWith('id') || v.lang.startsWith('in'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
      resolve(false);
    }
  });
}

/**
 * Plays victory sound according to currently configured sound options
 */
export function playVictorySound(overrideConfig?: Partial<SoundConfig>): Promise<boolean> {
  const config = { ...currentSoundConfig, ...overrideConfig };

  if (!config.enabled || config.soundType === 'muted') {
    return Promise.resolve(false);
  }

  const vol = config.volume !== undefined ? config.volume : 1.0;

  // 1. Text-to-Speech Custom
  if (config.soundType === 'tts_custom') {
    const textToSpeak = config.customText?.trim() || 'Selamat! Tim memenangkan pertandingan kejuaraan ORADO!';
    return playTtsSound(textToSpeak, vol);
  }

  // 2. Custom Uploaded Audio (Data URL)
  if (config.soundType === 'custom_upload' && config.customAudioDataUrl) {
    try {
      if (customAudioInstance) {
        customAudioInstance.pause();
        customAudioInstance.currentTime = 0;
      }
      customAudioInstance = new Audio(config.customAudioDataUrl);
      customAudioInstance.volume = vol;
      return customAudioInstance.play()
        .then(() => true)
        .catch((err) => {
          console.warn('Custom audio playback failed, falling back to default:', err);
          return playDefaultAudio(vol);
        });
    } catch (e) {
      return playDefaultAudio(vol);
    }
  }

  // 3. Preset Synthesizer
  if (config.soundType === 'preset_fanfare') {
    playSynthSound('fanfare', vol);
    return Promise.resolve(true);
  }
  if (config.soundType === 'preset_whistle') {
    playSynthSound('whistle', vol);
    return Promise.resolve(true);
  }
  if (config.soundType === 'preset_cheer') {
    playSynthSound('cheer', vol);
    return Promise.resolve(true);
  }
  if (config.soundType === 'preset_gong') {
    playSynthSound('gong', vol);
    return Promise.resolve(true);
  }

  // 4. Default Victory Audio (mix_05s official victory sound)
  return playDefaultAudio(vol);
}

function playDefaultAudio(volume: number): Promise<boolean> {
  const audio = getDefaultAudioInstance();
  if (!audio) return Promise.resolve(false);

  audio.currentTime = 0;
  audio.volume = Math.max(0, Math.min(1, volume));

  return audio.play()
    .then(() => true)
    .catch((err) => {
      console.warn('Default audio play blocked:', err);
      // Fallback: try synth fanfare if browser blocked media playback
      playSynthSound('fanfare', volume);
      return false;
    });
}

/**
 * Stops any active audio playback
 */
export function stopVictorySound(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  const defaultAudio = getDefaultAudioInstance();
  if (defaultAudio) {
    defaultAudio.pause();
    defaultAudio.currentTime = 0;
  }
  if (customAudioInstance) {
    customAudioInstance.pause();
    customAudioInstance.currentTime = 0;
  }
}

/**
 * Mute toggle helper for quick status bar toggling
 */
export function getIsAudioMuted(): boolean {
  return !currentSoundConfig.enabled || currentSoundConfig.soundType === 'muted';
}

export function toggleAudioMuted(): boolean {
  const willBeMuted = !getIsAudioMuted();
  setSoundConfig({ enabled: !willBeMuted });
  if (willBeMuted) {
    stopVictorySound();
  }
  return willBeMuted;
}
