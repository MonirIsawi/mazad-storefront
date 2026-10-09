import { describe, expect, it } from 'vitest';
import type { SellerAuctionStatus } from '../types/selling.types';
import { productAuctionState } from './auction-permissions';

describe('productAuctionState (PRODUCT_FROZEN / PRODUCT_ALREADY_AUCTIONED)', () => {
  const on = (status: SellerAuctionStatus, id = 'p1') => ({
    status,
    product: { id, nameEn: 'x', nameAr: 'x' },
  });

  it('offers everything for a product never auctioned, or only in other products auctions', () => {
    expect(productAuctionState('p1', [on('LIVE', 'p2')])).toEqual({
      status: null,
      canEdit: true,
      canDelete: true,
      canAuction: true,
    });
  });

  it.each(['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'SCHEDULED', 'LIVE'] as const)(
    'freezes a product whose auction is %s',
    (status) => {
      expect(productAuctionState('p1', [on('UNSOLD'), on(status)])).toEqual({
        status,
        canEdit: false,
        canDelete: false,
        canAuction: false,
      });
    },
  );

  it('lets an unsold or cancelled product be put up again', () => {
    for (const status of ['UNSOLD', 'CANCELLED'] as const) {
      expect(productAuctionState('p1', [on(status)])).toMatchObject({
        status: null,
        canAuction: true,
      });
    }
  });

  it('marks a sold product as sold and never offers it again', () => {
    expect(productAuctionState('p1', [on('SOLD')])).toEqual({
      status: 'SOLD',
      canEdit: false,
      canDelete: true,
      canAuction: false,
    });
  });
});
