'use client';

import { AddressCard } from './AddressCard';
import type { Address } from '../types/addresses.types';

export interface AddressListProps {
  addresses: Address[];
}

/** The saved addresses, the default first as the API orders them. */
export function AddressList({ addresses }: AddressListProps) {
  if (addresses.length === 0) return null;
  return (
    <div className="grid gap-3">
      {addresses.map((address) => (
        <AddressCard key={address.id} address={address} />
      ))}
    </div>
  );
}
