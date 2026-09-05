/**
 * CivicPulse Phase 7 — Singleton Real-Time Event Bus
 * Backed by Node.js EventEmitter with an in-memory circular buffer (max 200 events).
 * Zero external infrastructure; preserves hot-reloading state across Next.js invocations.
 */

import { EventEmitter } from "events";
import { RealtimeEvent, RealtimeEventType } from "./eventTypes";

const MAX_BUFFER_SIZE = 200;

export class RealtimeEventBus {
  private emitter: EventEmitter;
  private buffer: RealtimeEvent[] = [];

  constructor() {
    this.emitter = new EventEmitter();
    // Allow up to 100 concurrent SSE subscribers without warning
    this.emitter.setMaxListeners(100);
  }

  /**
   * Publish a real-time event to all subscribers and append to circular buffer
   */
  public publish(event: RealtimeEvent): void {
    // Append to circular buffer
    this.buffer.push(event);
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }

    // Broadcast globally and by event type
    this.emitter.emit("event", event);
    this.emitter.emit(event.eventType, event);
  }

  /**
   * Subscribe to all events. Returns an unsubscribe cleanup function.
   */
  public subscribe(listener: (event: RealtimeEvent) => void): () => void {
    this.emitter.on("event", listener);
    return () => {
      this.emitter.off("event", listener);
    };
  }

  /**
   * Subscribe to a specific event type. Returns an unsubscribe cleanup function.
   */
  public subscribeToType(
    eventType: RealtimeEventType,
    listener: (event: RealtimeEvent) => void
  ): () => void {
    this.emitter.on(eventType, listener);
    return () => {
      this.emitter.off(eventType, listener);
    };
  }

  /**
   * Retrieve cached events for delta polling or initial client sync.
   * If `since` ISO timestamp is provided, returns events newer than that.
   */
  public getRecentEvents(since?: string, limit: number = 50): RealtimeEvent[] {
    let filtered = this.buffer;
    if (since) {
      const sinceMs = new Date(since).getTime();
      if (!isNaN(sinceMs)) {
        filtered = this.buffer.filter(
          (e) => new Date(e.timestamp).getTime() > sinceMs
        );
      }
    }
    return filtered.slice(-Math.min(limit, MAX_BUFFER_SIZE));
  }

  /**
   * Retrieve total retained event count
   */
  public getBufferCount(): number {
    return this.buffer.length;
  }

  /**
   * Clear buffer (used for testing and simulation resets)
   */
  public clearBuffer(): void {
    this.buffer = [];
  }
}

// Preserve singleton across Next.js dev server hot-reloads
const globalForEventBus = global as unknown as {
  realtimeEventBusInstance?: RealtimeEventBus;
};

export const realtimeEventBus =
  globalForEventBus.realtimeEventBusInstance ?? new RealtimeEventBus();

if (process.env.NODE_ENV !== "production") {
  globalForEventBus.realtimeEventBusInstance = realtimeEventBus;
}
