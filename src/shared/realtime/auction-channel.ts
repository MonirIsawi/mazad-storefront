import { io, type Socket } from 'socket.io-client';

/*
 * Live auction updates over mazad-api's Socket.IO gateway (namespace /realtime). Signals only: an
 * event never changes UI state directly, it makes the caller refetch from the HTTP API, and the
 * callers keep a slower reconciliation poll. A lost, duplicated or out-of-order event therefore
 * can only delay an update, never show a wrong price.
 *
 * Guest connection (no token): auction rooms are public and their events carry no private data
 * (bidder names are masked). Rooms the gateway refuses (e.g. a seller's own pending auction) just
 * stay on fast polling.
 */

export const AUCTION_EVENTS = [
  'auction:bid_placed',
  'auction:extended',
  'auction:closed',
  'auction:status_changed',
] as const;

export type AuctionEventName = (typeof AUCTION_EVENTS)[number];
type EventListener = (event: AuctionEventName) => void;
type LiveListener = (live: boolean) => void;

interface Room {
  refs: number;
  joined: boolean;
  onEvent: Set<EventListener>;
  onLive: Set<LiveListener>;
}

/** socket.io-client's `io`, injectable for tests. */
type Connect = (url: string, options: Parameters<typeof io>[1]) => Socket;

/** Origin of NEXT_PUBLIC_API_URL + the gateway namespace; null when unusable (no realtime then). */
export function realtimeUrl(apiUrl = process.env.NEXT_PUBLIC_API_URL): string | null {
  if (!apiUrl) return null;
  try {
    return `${new URL(apiUrl).origin}/realtime`;
  } catch {
    return null;
  }
}

export function createAuctionChannel(connect: Connect = io, url = realtimeUrl()) {
  const rooms = new Map<string, Room>();
  let socket: Socket | null = null;

  function setJoined(room: Room, joined: boolean) {
    if (room.joined === joined) return;
    room.joined = joined;
    room.onLive.forEach((listener) => listener(joined));
  }

  function join(auctionId: string) {
    const room = rooms.get(auctionId);
    if (!socket?.connected || !room) return;
    socket.emit('subscribe_auction', { auctionId }, (ack?: { subscribed?: string }) => {
      // The room may have been released while the acknowledgement was in flight.
      const current = rooms.get(auctionId);
      if (current) setJoined(current, ack?.subscribed === auctionId);
    });
  }

  function ensureSocket(): Socket | null {
    if (socket || !url || typeof window === 'undefined') return socket;
    socket = connect(url, {
      // Polling first, then upgrade: works behind proxies that block WebSockets.
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15_000,
      timeout: 10_000,
    });
    // Rooms do not survive a reconnect (new server-side socket): join them again every time.
    socket.on('connect', () => rooms.forEach((_room, auctionId) => join(auctionId)));
    socket.on('disconnect', () => rooms.forEach((room) => setJoined(room, false)));
    for (const name of AUCTION_EVENTS) {
      socket.on(name, (payload?: { auctionId?: unknown }) => {
        const auctionId = typeof payload?.auctionId === 'string' ? payload.auctionId : null;
        const room = auctionId ? rooms.get(auctionId) : undefined;
        room?.onEvent.forEach((listener) => listener(name));
      });
    }
    return socket;
  }

  /**
   * Follows an auction until the returned function is called. `onLive` reports whether the room
   * is currently joined (false while disconnected or refused).
   */
  function subscribe(auctionId: string, onEvent: EventListener, onLive: LiveListener): () => void {
    let room = rooms.get(auctionId);
    if (!room) {
      room = { refs: 0, joined: false, onEvent: new Set(), onLive: new Set() };
      rooms.set(auctionId, room);
    }
    room.refs += 1;
    room.onEvent.add(onEvent);
    room.onLive.add(onLive);
    onLive(room.joined);

    const active = ensureSocket();
    if (room.refs === 1 && active?.connected) join(auctionId);

    let released = false;
    return () => {
      if (released) return;
      released = true;
      const current = rooms.get(auctionId);
      if (!current) return;
      current.onEvent.delete(onEvent);
      current.onLive.delete(onLive);
      current.refs -= 1;
      if (current.refs > 0) return;
      rooms.delete(auctionId);
      if (socket?.connected) socket.emit('unsubscribe_auction', { auctionId });
      if (rooms.size === 0 && socket) {
        // Nothing left to follow: close the connection (and its reconnect attempts).
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
      }
    };
  }

  return { subscribe };
}

export type AuctionChannel = ReturnType<typeof createAuctionChannel>;

let shared: AuctionChannel | null = null;

/** The app-wide channel (one socket for every component that follows an auction). */
export function auctionChannel(): AuctionChannel {
  shared ??= createAuctionChannel();
  return shared;
}
