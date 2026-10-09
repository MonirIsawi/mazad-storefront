import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import type { Socket } from 'socket.io-client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuctionChannel, realtimeUrl } from './auction-channel';
import {
  EVENT_REFETCH_THROTTLE_MS,
  liveRefetchInterval,
  useAuctionLiveUpdates,
} from './useAuctionLiveUpdates';

type Ack = (response: unknown) => void;

/** Minimal stand-in for a socket.io-client Socket: records emits, lets the test drive events. */
class FakeSocket {
  connected = false;
  emitted: { event: string; payload: unknown }[] = [];
  disconnected = false;
  ackWith: (payload: { auctionId: string }) => unknown = (payload) => ({
    subscribed: payload.auctionId,
  });
  private handlers = new Map<string, ((...args: unknown[]) => void)[]>();

  on(event: string, handler: (...args: unknown[]) => void) {
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
    return this;
  }
  emit(event: string, payload: { auctionId: string }, ack?: Ack) {
    this.emitted.push({ event, payload });
    if (ack) ack(this.ackWith(payload));
    return this;
  }
  removeAllListeners() {
    this.handlers.clear();
    return this;
  }
  connects = 0;
  disconnect() {
    this.disconnected = true;
    this.connected = false;
    return this;
  }
  connect() {
    this.connects += 1;
    return this;
  }
  /** Server side happenings. */
  serverConnect() {
    this.connected = true;
    this.fire('connect');
  }
  serverDisconnect() {
    this.connected = false;
    this.fire('disconnect');
  }
  fire(event: string, payload?: unknown) {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }
  joins() {
    return this.emitted.filter((e) => e.event === 'subscribe_auction').length;
  }
}

/** The browser's online/offline events, fired by hand. */
function fakeNetwork() {
  const listeners = { online: new Set<() => void>(), offline: new Set<() => void>() };
  const on = (kind: 'online' | 'offline') => (listener: () => void) => {
    listeners[kind].add(listener);
    return () => listeners[kind].delete(listener);
  };
  return {
    signals: { onOnline: on('online'), onOffline: on('offline') },
    goOnline: () => listeners.online.forEach((l) => l()),
    goOffline: () => listeners.offline.forEach((l) => l()),
    count: () => listeners.online.size + listeners.offline.size,
  };
}

function setup() {
  const socket = new FakeSocket();
  const connect = vi.fn(() => socket as unknown as Socket);
  const network = fakeNetwork();
  const channel = createAuctionChannel(connect, 'http://api.test/realtime', network.signals);
  return { socket, connect, channel, network };
}

afterEach(() => {
  vi.useRealTimers();
});

describe('auction channel', () => {
  it('derives the gateway URL from the API base URL', () => {
    expect(realtimeUrl('https://api.mazad.example/api/v1')).toBe(
      'https://api.mazad.example/realtime',
    );
    expect(realtimeUrl('not a url')).toBeNull();
    expect(realtimeUrl('')).toBeNull();
  });

  it('defaults to NEXT_PUBLIC_API_URL, and to no realtime when it is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.mazad.example/api/v1');
    expect(realtimeUrl()).toBe('https://api.mazad.example/realtime');
    vi.stubEnv('NEXT_PUBLIC_API_URL', '');
    expect(realtimeUrl()).toBeNull();
    vi.unstubAllEnvs();
  });

  it('joins once connected and again after every reconnect', () => {
    const { socket, connect, channel } = setup();
    const live = vi.fn();
    channel.subscribe('a1', vi.fn(), live);

    expect(connect).toHaveBeenCalledOnce();
    expect(live).toHaveBeenLastCalledWith(false);
    socket.serverConnect();
    expect(socket.joins()).toBe(1);
    expect(live).toHaveBeenLastCalledWith(true);

    socket.serverDisconnect();
    expect(live).toHaveBeenLastCalledWith(false);
    socket.serverConnect();
    expect(socket.joins()).toBe(2);
    expect(live).toHaveBeenLastCalledWith(true);
  });

  it('shares one room between components and leaves it with the last one', () => {
    const { socket, channel } = setup();
    socket.serverConnect();
    const first = channel.subscribe('a1', vi.fn(), vi.fn());
    const second = channel.subscribe('a1', vi.fn(), vi.fn());
    expect(socket.joins()).toBe(1); // one room join for both components

    first();
    first(); // releasing twice is harmless
    expect(socket.emitted.some((e) => e.event === 'unsubscribe_auction')).toBe(false);
    second();
    expect(socket.emitted.at(-1)).toEqual({
      event: 'unsubscribe_auction',
      payload: { auctionId: 'a1' },
    });
    expect(socket.disconnected).toBe(true);
  });

  it('stays not-live when the gateway refuses the room', () => {
    const { socket, channel } = setup();
    socket.ackWith = () => ({ error: 'AUCTION_NOT_VISIBLE' });
    const live = vi.fn();
    channel.subscribe('a1', vi.fn(), live);
    socket.serverConnect();
    expect(live).not.toHaveBeenCalledWith(true);
  });

  it('routes events only to listeners of that auction and ignores malformed ones', () => {
    const { socket, channel } = setup();
    const a1 = vi.fn();
    const a2 = vi.fn();
    channel.subscribe('a1', a1, vi.fn());
    channel.subscribe('a2', a2, vi.fn());
    socket.serverConnect();

    socket.fire('auction:bid_placed', { auctionId: 'a1', amount: '130000.00' });
    socket.fire('auction:closed', { auctionId: 42 });
    socket.fire('auction:extended');
    expect(a1).toHaveBeenCalledExactlyOnceWith('auction:bid_placed');
    expect(a2).not.toHaveBeenCalled();
  });
});

describe('auction channel: network drops', () => {
  it('stops trusting the socket the moment the browser goes offline', () => {
    const { socket, channel, network } = setup();
    const live: boolean[] = [];
    channel.subscribe(
      'a1',
      () => {},
      (v) => live.push(v),
    );
    socket.serverConnect();
    expect(live.at(-1)).toBe(true);
    // The socket still "looks" connected (no ping timeout yet), but the network is gone.
    network.goOffline();
    expect(live.at(-1)).toBe(false);
  });

  it('back online: refetches at once and opens a fresh connection that re-joins', () => {
    const { socket, channel, network } = setup();
    const signals: string[] = [];
    channel.subscribe(
      'a1',
      (e) => signals.push(e),
      () => {},
    );
    socket.serverConnect();
    const joinsBefore = socket.joins();
    network.goOffline();
    network.goOnline();
    expect(signals).toContain('realtime:resync');
    expect(socket.disconnected).toBe(true);
    expect(socket.connects).toBe(1);
    socket.serverConnect();
    expect(socket.joins()).toBe(joinsBefore + 1);
  });

  it('refetches after any reconnect (events were missed), but not on the first connect', () => {
    const { socket, channel } = setup();
    const signals: string[] = [];
    channel.subscribe(
      'a1',
      (e) => signals.push(e),
      () => {},
    );
    socket.serverConnect();
    expect(signals).toEqual([]);
    socket.serverDisconnect();
    socket.serverConnect();
    expect(signals).toEqual(['realtime:resync']);
  });

  it('stops listening to the network once nothing is followed', () => {
    const { socket, channel, network } = setup();
    const release = channel.subscribe(
      'a1',
      () => {},
      () => {},
    );
    socket.serverConnect();
    expect(network.count()).toBe(2);
    release();
    expect(network.count()).toBe(0);
  });
});

describe('useAuctionLiveUpdates', () => {
  function renderLive() {
    const { socket, channel } = setup();
    const queryClient = new QueryClient();
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children);
    const hook = renderHook(
      () => useAuctionLiveUpdates('a1', ['catalog', 'auction', 'a1'], channel),
      { wrapper },
    );
    return { socket, invalidate, hook };
  }

  it('turns a burst of bids into one refetch and relaxes polling only while live', () => {
    vi.useFakeTimers();
    const { socket, invalidate, hook } = renderLive();
    expect(hook.result.current).toBe(false);
    expect(liveRefetchInterval(hook.result.current)).toBe(5_000);

    act(() => socket.serverConnect());
    expect(hook.result.current).toBe(true);
    expect(liveRefetchInterval(hook.result.current)).toBe(30_000);

    act(() => {
      for (let i = 0; i < 5; i++) socket.fire('auction:bid_placed', { auctionId: 'a1' });
      vi.advanceTimersByTime(EVENT_REFETCH_THROTTLE_MS);
    });
    expect(invalidate).toHaveBeenCalledExactlyOnceWith({ queryKey: ['catalog', 'auction', 'a1'] });

    // Socket lost: back to 5 s polling until it reconnects.
    act(() => socket.serverDisconnect());
    expect(hook.result.current).toBe(false);
  });

  it('cleans up on unmount', () => {
    const { socket, hook } = renderLive();
    act(() => socket.serverConnect());
    hook.unmount();
    expect(socket.disconnected).toBe(true);
  });
});
