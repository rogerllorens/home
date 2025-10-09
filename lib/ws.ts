'use client';

import { create } from 'zustand';

interface SignalState {
  status: 'disconnected' | 'connecting' | 'connected';
  lastError?: string;
  setStatus: (status: SignalState['status']) => void;
  setError: (message?: string) => void;
}

export const useSignalState = create<SignalState>((set) => ({
  status: 'disconnected',
  lastError: undefined,
  setStatus: (status) => set({ status, lastError: undefined }),
  setError: (message) => set({ lastError: message })
}));

export type SignalMessage = {
  type: string;
  payload?: unknown;
};

export type SignalListener = (message: SignalMessage) => void;

interface SignalIdentity {
  sessionId?: string;
  userId?: string;
  scope?: string;
}

interface SignalClientOptions {
  token?: string;
  identity?: SignalIdentity;
}

export class SignalClient {
  private socket: WebSocket | null = null;
  private listeners = new Set<SignalListener>();
  private heartbeatTimer?: ReturnType<typeof setInterval>;

  private identity?: SignalIdentity;
  private token?: string;

  constructor(private readonly url: string, options: SignalClientOptions = {}) {
    this.token = options.token;
    this.identity = options.identity;
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    useSignalState.getState().setStatus('connecting');
    const wsUrl = this.token ? `${this.url}?token=${encodeURIComponent(this.token)}` : this.url;
    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      useSignalState.getState().setStatus('connected');
      this.sendHello();
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as SignalMessage;
        this.listeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error('Invalid WS message', error);
      }
    };

    this.socket.onerror = () => {
      useSignalState.getState().setError('connection-error');
    };

    this.socket.onclose = () => {
      this.stopHeartbeat();
      useSignalState.getState().setStatus('disconnected');
      this.socket = null;
    };
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: SignalMessage) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  updateIdentity(identity: SignalIdentity) {
    this.identity = identity;
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.sendHello();
    }
  }

  private sendHello() {
    const payload = {
      clientVersion: 'web-1.0.0',
      intents: ['MATCH', 'CHAT', 'GIFT'],
      sessionId: this.identity?.sessionId,
      userId: this.identity?.userId,
      scope: this.identity?.scope
    };
    this.send({ type: 'HELLO', payload });
  }

  addListener(listener: SignalListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'PING' });
    }, 20_000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

export function createSignalClient(options: SignalClientOptions = {}) {
  const url = process.env.NEXT_PUBLIC_SIGNAL_URL ?? 'wss://signal.tuweb.com';
  return new SignalClient(url, options);
}
