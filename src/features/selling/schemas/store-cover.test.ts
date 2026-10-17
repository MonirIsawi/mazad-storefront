import { describe, expect, it } from 'vitest';
import { storeSchema } from './selling.schema';

const row = {
  id: 's1',
  nameEn: 'Store',
  nameAr: 'متجر',
  city: 'Baghdad',
  area: null,
  street: null,
  details: null,
  contactPhone: null,
  deliveryFee: '5000',
  isDefault: true,
};

describe('storeSchema: store covers are detected, never assumed', () => {
  it('an API without covers (no coverUrl key): the cover upload stays hidden', () => {
    expect(storeSchema.parse(row).supportsCover).toBe(false);
  });

  it('an API with covers sends the key, even as null', () => {
    expect(storeSchema.parse({ ...row, coverUrl: null }).supportsCover).toBe(true);
    const withCover = storeSchema.parse({
      ...row,
      coverUrl: 'https://a.test/c.webp',
      coverImageKey: 'k',
    });
    expect(withCover).toMatchObject({ supportsCover: true, coverUrl: 'https://a.test/c.webp' });
  });
});
