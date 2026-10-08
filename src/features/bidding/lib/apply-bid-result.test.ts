import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants';
import { applyBidResult } from './apply-bid-result';

const pricingKey = QUERY_KEYS.bidding.auctionPricing('a1');
const detailKey = QUERY_KEYS.catalog.auction('a1');
const result = {
  currentPrice: '950000.00',
  bidCount: 2,
  endsAt: '2030-01-02T00:00:00.000Z',
  status: 'LIVE',
};

function seeded(detail: Record<string, unknown>, pricing: Record<string, unknown>) {
  const client = new QueryClient();
  client.setQueryData(detailKey, detail);
  client.setQueryData(pricingKey, pricing);
  return client;
}

describe('applyBidResult', () => {
  const before = { currentPrice: '925000.00', endsAt: '2030-01-01T00:00:00.000Z', status: 'LIVE' };

  it("shows the server's post-bid price, count and end time in both cached copies at once", () => {
    const client = seeded(
      { id: 'a1', title: 'x', bidCount: 1, ...before },
      { id: 'a1', minIncrement: '25000.00', ...before },
    );
    applyBidResult(client, 'a1', result);
    expect(client.getQueryData(detailKey)).toEqual({
      id: 'a1',
      title: 'x',
      ...result,
    });
    // The pricing copy has no bid count; nothing is invented for it.
    expect(client.getQueryData(pricingKey)).toEqual({
      id: 'a1',
      minIncrement: '25000.00',
      currentPrice: '950000.00',
      endsAt: '2030-01-02T00:00:00.000Z',
      status: 'LIVE',
    });
  });

  it('never steps back past a newer state a refetch already brought (another bidder)', () => {
    const newer = {
      currentPrice: '1000000.00',
      endsAt: '2030-01-03T00:00:00.000Z',
      status: 'LIVE',
    };
    const client = seeded({ id: 'a1', bidCount: 3, ...newer }, { id: 'a1', ...newer });
    applyBidResult(client, 'a1', result);
    expect(client.getQueryData(detailKey)).toEqual({ id: 'a1', bidCount: 3, ...newer });
    expect(client.getQueryData(pricingKey)).toEqual({ id: 'a1', ...newer });
  });

  it('carries a status change (buy now sells the auction)', () => {
    const client = seeded({ id: 'a1', bidCount: 1, ...before }, { id: 'a1', ...before });
    applyBidResult(client, 'a1', { ...result, currentPrice: '1350000.00', status: 'SOLD' });
    expect(client.getQueryData<{ status: string }>(detailKey)?.status).toBe('SOLD');
    expect(client.getQueryData<{ status: string }>(pricingKey)?.status).toBe('SOLD');
  });

  it('leaves an auction that was never loaded alone (nothing to fake)', () => {
    const client = new QueryClient();
    applyBidResult(client, 'a1', result);
    expect(client.getQueryData(detailKey)).toBeUndefined();
    expect(client.getQueryData(pricingKey)).toBeUndefined();
  });
});
