import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { productFormSchema } from '../schemas/selling.schema';
import { canRelistAuction, productAuctionState } from './auction-permissions';
import { buildAuctionPayload, parseDinars, type AuctionFormState } from './auction-payload';
import { toDateTimeInputValue } from './datetime-input';

const NOW = new Date('2026-10-07T09:00:00.000Z');
const at = (iso: string) => toDateTimeInputValue(iso);
const state = (overrides: Partial<AuctionFormState> = {}): AuctionFormState => ({
  productId: 'p1',
  startingPrice: '100000',
  startMode: 'later',
  startsAt: at('2026-10-07T10:00:00.000Z'),
  endsAt: at('2026-10-10T10:00:00.000Z'),
  buyNowPrice: '',
  minIncrement: '',
  antiSnipingMinutes: '5',
  maxExtensions: '10',
  ...overrides,
});
const build = (overrides: Partial<AuctionFormState> = {}) =>
  buildAuctionPayload(state(overrides), NOW);

describe('buildAuctionPayload (mazad-api listing rules)', () => {
  it('sends whole dinars; an empty step sends the suggested one', () => {
    const result = build({ startingPrice: '٩١٠٬٠٠٠' });
    expect(result.ok && result.payload).toMatchObject({
      productId: 'p1',
      startingPrice: 910000,
      minIncrement: 5000,
      antiSnipingMinutes: 5,
      maxExtensions: 10,
    });
  });

  it("sends the seller's step, from 250 IQD up to the opening price", () => {
    const ok = build({ minIncrement: '2,500' });
    expect(ok.ok && ok.payload.minIncrement).toBe(2500);
    expect(build({ minIncrement: '100000' }).ok).toBe(true);
    for (const minIncrement of ['249', '100001', 'abc']) {
      expect(build({ minIncrement })).toEqual({
        ok: false,
        errors: { minIncrement: 'errors.field.minIncrementInvalid' },
      });
    }
    expect(build({ minIncrement: '1000.5' })).toEqual({
      ok: false,
      errors: { minIncrement: 'errors.field.wholeDinars' },
    });
  });

  it('bounds the extension: 1 to 10 minutes, 1 to 20 times', () => {
    const ok = build({ antiSnipingMinutes: '10', maxExtensions: '20' });
    expect(ok.ok && ok.payload).toMatchObject({ antiSnipingMinutes: 10, maxExtensions: 20 });
    expect(build({ antiSnipingMinutes: '0', maxExtensions: '21' })).toEqual({
      ok: false,
      errors: {
        antiSnipingMinutes: 'errors.field.extensionMinutesInvalid',
        maxExtensions: 'errors.field.maxExtensionsInvalid',
      },
    });
    expect(build({ antiSnipingMinutes: '' }).ok).toBe(false);
  });

  it('requires whole dinars and an opening bid of at least 1,000 IQD', () => {
    expect(build({ startingPrice: '999' })).toEqual({
      ok: false,
      errors: { startingPrice: 'errors.field.startingPriceMin' },
    });
    expect(build({ startingPrice: '1500.5' })).toEqual({
      ok: false,
      errors: { startingPrice: 'errors.field.wholeDinars' },
    });
    expect(build({ startingPrice: '1000' }).ok).toBe(true);
  });

  it('wants buy-now above the opening bid', () => {
    expect(build({ buyNowPrice: '100000' })).toEqual({
      ok: false,
      errors: { buyNowPrice: 'errors.field.buyNowNotAboveStart' },
    });
    const ok = build({ buyNowPrice: '150,000' });
    expect(ok.ok && ok.payload.buyNowPrice).toBe(150000);
  });

  it('"start now" starts at publishing; schedule rules match the API', () => {
    const now = build({ startMode: 'now', startsAt: '' });
    expect(now.ok && now.payload.startsAt).toBe(NOW.toISOString());
    expect(build({ startsAt: at('2026-10-07T08:00:00.000Z') })).toEqual({
      ok: false,
      errors: { startsAt: 'errors.field.startInPast' },
    });
    expect(build({ endsAt: at('2026-10-07T10:30:00.000Z') })).toEqual({
      ok: false,
      errors: { endsAt: 'errors.field.durationTooShort' },
    });
    expect(build({ endsAt: at('2026-10-22T10:00:00.000Z') })).toEqual({
      ok: false,
      errors: { endsAt: 'errors.field.durationTooLong' },
    });
  });

  it('sends only fields CreateAuctionDto / UpdateAuctionDto accept (contracts/)', () => {
    const contract = JSON.parse(
      readFileSync(join(process.cwd(), 'contracts', 'mazad-api.openapi.json'), 'utf8'),
    ) as { components: { schemas: Record<string, { properties: Record<string, unknown> }> } };
    const result = build({ buyNowPrice: '150000', minIncrement: '2500' });
    if (!result.ok) throw new Error('expected a payload');
    const update = Object.keys(result.payload).filter((key) => key !== 'productId');
    const accepted = (name: string) =>
      Object.keys(contract.components.schemas[name]?.properties ?? {});
    expect(accepted('CreateAuctionDto')).toEqual(
      expect.arrayContaining(Object.keys(result.payload)),
    );
    expect(accepted('UpdateAuctionDto')).toEqual(expect.arrayContaining(update));
  });

  it('reads typed amounts', () => {
    expect(parseDinars('1,250,000')).toEqual({ value: 1250000 });
    expect(parseDinars('1500.00')).toEqual({ value: 1500 });
    expect(parseDinars('abc')).toEqual({ error: 'invalid' });
  });
});

describe('product form: one language, explicit condition', () => {
  const base = {
    storeId: 's1',
    categoryId: 'c1',
    nameAr: 'كاميرا',
    nameEn: '',
    descriptionAr: 'وصف',
    descriptionEn: '',
    condition: 'USED',
  };

  it('fills the empty language from the other', () => {
    const parsed = productFormSchema.parse(base);
    expect(parsed).toMatchObject({ nameEn: 'كاميرا', descriptionEn: 'وصف' });
  });

  it('needs a name and a description in some language', () => {
    const result = productFormSchema.safeParse({ ...base, nameAr: '', descriptionAr: '' });
    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual([
      'errors.field.nameOneLanguage',
      'errors.field.descriptionOneLanguage',
    ]);
  });

  it('asks for the condition instead of assuming one', () => {
    const result = productFormSchema.safeParse({ ...base, condition: undefined });
    const messages = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(messages).toEqual(['errors.field.conditionRequired']);
  });
});

describe('relisting', () => {
  it('offers it for unsold, cancelled and cancelled sales, never a standing sale', () => {
    expect(canRelistAuction({ status: 'UNSOLD' })).toBe(true);
    expect(canRelistAuction({ status: 'CANCELLED' })).toBe(true);
    expect(canRelistAuction({ status: 'SOLD', saleCancelled: true })).toBe(true);
    expect(canRelistAuction({ status: 'SOLD' })).toBe(false);
  });

  it('a cancelled sale no longer marks the product sold', () => {
    const product = { id: 'p1', nameEn: 'x', nameAr: 'x' };
    expect(
      productAuctionState('p1', [{ status: 'SOLD', product, saleCancelled: true }]).canAuction,
    ).toBe(true);
    expect(productAuctionState('p1', [{ status: 'SOLD', product }]).canAuction).toBe(false);
  });
});
