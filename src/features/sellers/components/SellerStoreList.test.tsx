import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SellerStoreList } from './SellerStoreList';

describe('SellerStoreList', () => {
  it("links each of the seller's stores by the store's own id", () => {
    render(
      <SellerStoreList
        stores={[
          { id: 'st-a', nameEn: 'Store A', nameAr: 'Store A', city: 'Baghdad', isDefault: true },
          { id: 'st-b', nameEn: 'Store B', nameAr: 'Store B', city: 'Basra', isDefault: false },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /Store A/ }).getAttribute('href')).toBe('/stores/st-a');
    expect(screen.getByRole('link', { name: /Store B/ }).getAttribute('href')).toBe('/stores/st-b');
  });
});
