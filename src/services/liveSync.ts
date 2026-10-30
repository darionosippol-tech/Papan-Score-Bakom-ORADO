/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type StateUpdateHandler = (state: any, connectedClients: number) => void;
type SoundEventHandler = (soundType: string) => void;
type SoundConfigHandler = (soundConfig: any) => void;

class LiveSyncService {
  private ws: WebSocket | null = null;
  private updateHandlers: Set<StateUpdateHandler> = new Set();
  private soundHandlers: Set<SoundEventHandler> = new Set();
  private soundConfigHandlers: Set<SoundConfigHandler> = new Set();
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  public connectedClientsCount: number = 1;
  public isConnected: boolean = false;

  constructor() {
    this.connect();
  }

  public connect() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        // Start ping heartbeat
        if (this.pingTimer) clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'INIT_STATE' || data.type === 'STATE_UPDATE') {
            if (typeof data.connectedClients === 'number') {
              this.connectedClientsCount = data.connectedClients;
            }
            this.notifyHandlers(data.state, this.connectedClientsCount);
          }
          if (data.type === 'PLAY_VICTORY_SOUND' || data.event?.type === 'PLAY_VICTORY_SOUND') {
            this.notifySoundHandlers('victory');
          }
          if (data.type === 'SOUND_CONFIG_UPDATED' || data.event?.type === 'SOUND_CONFIG_UPDATED') {
            const cfg = data.soundConfig || data.event?.soundConfig;
            if (cfg) {
              this.notifySoundConfigHandlers(cfg);
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.pingTimer) clearInterval(this.pingTimer);
        // Try reconnecting in 3 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
          }, 3000);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('LiveSync WebSocket warning, falling back to HTTP sync if needed:', err);
      };
    } catch (e) {
      console.warn('Could not initialize WebSocket:', e);
    }
  }

  public onStateUpdate(handler: StateUpdateHandler) {
    this.updateHandlers.add(handler);
    return () => {
      this.updateHandlers.delete(handler);
    };
  }

  public onSoundEvent(handler: SoundEventHandler) {
    this.soundHandlers.add(handler);
    return () => {
      this.soundHandlers.delete(handler);
    };
  }

  public onSoundConfigUpdate(handler: SoundConfigHandler) {
    this.soundConfigHandlers.add(handler);
    return () => {
      this.soundConfigHandlers.delete(handler);
    };
  }

  private notifyHandlers(state: any, clientsCount: number) {
    this.updateHandlers.forEach((h) => h(state, clientsCount));
  }

  private notifySoundHandlers(soundType: string) {
    this.soundHandlers.forEach((h) => h(soundType));
  }

  private notifySoundConfigHandlers(config: any) {
    this.soundConfigHandlers.forEach((h) => h(config));
  }

  public sendSoundTrigger(sound: string = 'victory') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'TRIGGER_SOUND',
        sound
      }));
    }
  }

  public sendSoundConfigUpdate(soundConfig: any, updatedBy: string = 'Wasit/Host') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'UPDATE_SOUND_CONFIG',
        soundConfig,
        updatedBy
      }));
    } else {
      fetch('/api/sound-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundConfig, updatedBy })
      }).catch((e) => console.error('Failed to post sound config:', e));
    }
  }

  public sendStateUpdate(state: any, updatedBy: string, triggerVictorySound?: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'UPDATE_STATE',
        state,
        updatedBy,
        triggerVictorySound: !!triggerVictorySound
      }));
    } else {
      // Fallback to HTTP POST
      fetch('/api/match-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state, updatedBy, triggerVictorySound: !!triggerVictorySound })
      }).catch((e) => console.error('HTTP update fallback failed:', e));
    }
  }

  public sendReset(updatedBy: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'RESET_MATCH',
        updatedBy
      }));
    } else {
      fetch('/api/match-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operator: updatedBy })
      }).catch((e) => console.error('HTTP reset fallback failed:', e));
    }
  }
}

export const liveSync = new LiveSyncService();
