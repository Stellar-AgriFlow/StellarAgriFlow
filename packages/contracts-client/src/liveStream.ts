export type StreamCallback = (payload: any) => void;

export interface StreamOptions {
  autoReconnect?: boolean;
  reconnectIntervalMs?: number;
  heartbeatIntervalMs?: number;
}

export class LiveContractStream {
  private endpointUrl: string;
  private options: Required<StreamOptions>;
  private isConnected: boolean = false;
  private subscribers: Set<StreamCallback> = new Set();
  private timer: NodeJS.Timeout | null = null;

  constructor(endpointUrl: string, options: StreamOptions = {}) {
    this.endpointUrl = endpointUrl;
    this.options = {
      autoReconnect: options.autoReconnect ?? true,
      reconnectIntervalMs: options.reconnectIntervalMs ?? 5000,
      heartbeatIntervalMs: options.heartbeatIntervalMs ?? 30000,
    };
  }

  /**
   * Connects to live streaming event channel
   */
  connect(): void {
    if (this.isConnected) return;
    this.isConnected = true;

    // Simulate connection heartbeat
    this.timer = setInterval(() => {
      if (this.isConnected) {
        this.emit({ type: 'HEARTBEAT', timestamp: Date.now() });
      }
    }, this.options.heartbeatIntervalMs);
  }

  subscribe(callback: StreamCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  emit(data: any): void {
    for (const sub of this.subscribers) {
      try {
        sub(data);
      } catch (err) {
        console.error('Error dispatching live stream message', err);
      }
    }
  }

  disconnect(): void {
    this.isConnected = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  getStatus(): { isConnected: boolean; subscriberCount: number } {
    return {
      isConnected: this.isConnected,
      subscriberCount: this.subscribers.size,
    };
  }
}
