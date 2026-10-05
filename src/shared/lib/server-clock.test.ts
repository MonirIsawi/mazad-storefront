import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { useCountdown } from '@shared/hooks';
import {
  SAMPLE_MAX_AGE_MS,
  getServerClockOffset,
  recordServerTime,
  recordServerTimeSample,
  resetServerClock,
  serverNow,
} from './server-clock';

const SERVER_NOW = Date.parse('2026-10-05T12:00:00.000Z');

/** Pins the device clock `skewMs` away from the server's (positive = device ahead). */
function deviceClock(skewMs: number) {
  vi.useFakeTimers();
  vi.setSystemTime(SERVER_NOW + skewMs);
}

beforeEach(() => resetServerClock());
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('server clock offset', () => {
  it.each([
    ['ahead by 90s', 90_000],
    ['behind by 2 minutes', -120_000],
  ])('corrects a device clock %s', (_label, skew) => {
    deviceClock(skew);
    recordServerTimeSample(SERVER_NOW, Date.now(), Date.now());

    expect(getServerClockOffset()).toBe(-skew);
    expect(serverNow()).toBe(SERVER_NOW);
  });

  it('compensates for half the round trip', () => {
    deviceClock(0);
    // The API stamped SERVER_NOW about halfway through a 200ms round trip, so on arrival the
    // server's clock has moved on another ~100ms: it is 100ms ahead of this device.
    recordServerTimeSample(SERVER_NOW, Date.now() - 200, Date.now());
    expect(getServerClockOffset()).toBe(100);
  });

  it('prefers the lowest-latency sample until it goes stale', () => {
    deviceClock(0);
    recordServerTimeSample(SERVER_NOW, Date.now() - 40, Date.now()); // rtt 40 -> offset +20
    recordServerTimeSample(SERVER_NOW + 5_000, Date.now() - 900, Date.now()); // slower: ignored
    expect(getServerClockOffset()).toBe(20);

    vi.setSystemTime(SERVER_NOW + SAMPLE_MAX_AGE_MS + 1);
    recordServerTimeSample(Date.now() + 3_000, Date.now() - 900, Date.now()); // best is stale now
    expect(getServerClockOffset()).toBe(3_000 + 450);
  });

  it("homepage's serverTime is used only when no fresh measured sample exists", () => {
    deviceClock(60_000);
    recordServerTime(new Date(SERVER_NOW).toISOString());
    expect(getServerClockOffset()).toBe(-60_000);

    recordServerTimeSample(SERVER_NOW, Date.now() - 10, Date.now());
    recordServerTime(new Date(SERVER_NOW + 30_000).toISOString()); // older-precision source: ignored
    expect(getServerClockOffset()).toBe(-60_000 + 5);
  });
});

describe('every API response anchors the clock (deep link to an auction)', () => {
  it('reads X-Server-Time from the first request a page makes', async () => {
    deviceClock(45_000); // device 45s fast, and this page never loaded /homepage
    const { httpClient } = await import('@shared/api');
    httpClient.defaults.adapter = async (config: InternalAxiosRequestConfig) =>
      ({
        status: 200,
        statusText: 'OK',
        headers: new AxiosHeaders({ 'x-server-time': String(SERVER_NOW) }),
        config,
        data: { id: 'auction-1' },
      }) as AxiosResponse;

    await httpClient.get('/auctions/auction-1');

    expect(getServerClockOffset()).toBe(-45_000);
  });
});

describe('countdown at the auction end boundary', () => {
  it('reaches zero at the server end time, not the device time', () => {
    deviceClock(30_000); // device 30s fast
    recordServerTimeSample(SERVER_NOW, Date.now(), Date.now());
    const endsAt = new Date(SERVER_NOW + 10_000).toISOString();

    const { result } = renderHook(() => useCountdown(endsAt));
    expect(result.current).toBe(10_000);

    act(() => void vi.advanceTimersByTime(9_000));
    expect(result.current).toBe(1_000);

    act(() => void vi.advanceTimersByTime(1_000));
    expect(result.current).toBe(0);

    act(() => void vi.advanceTimersByTime(1_000));
    expect(result.current).toBeLessThan(0); // ended: the caller decides what that means
  });

  it('has nothing to count while the deadline is unknown', () => {
    const { result } = renderHook(() => useCountdown(undefined));
    expect(result.current).toBe(0);
  });
});
