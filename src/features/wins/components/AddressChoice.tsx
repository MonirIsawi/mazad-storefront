'use client';

import { Icon } from '@shared/components/ui';
import { cn } from '@shared/lib';
import { useWinsTranslation } from '../hooks/useWinsTranslation';
import type { WinAddressOption } from '../types/win-order';

/** The delivery address for confirmed wins, one choice of the saved ones. */
export function AddressChoice({
  addresses,
  value,
  onChange,
}: {
  addresses: WinAddressOption[];
  value: string | undefined;
  onChange: (id: string) => void;
}) {
  const { t } = useWinsTranslation();
  return (
    <fieldset className="grid gap-2">
      <legend className="sr-only">{t('confirm.address')}</legend>
      {addresses.map((address) => {
        const isOn = address.id === value;
        return (
          <label
            key={address.id}
            className={cn(
              'flex min-h-12 cursor-pointer items-center gap-3 rounded-[18px] border px-3.5 py-2.5',
              'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-gold',
              isOn ? 'border-gold-line bg-gold-soft' : 'border-border-strong',
            )}
          >
            <input
              type="radio"
              name="win-address"
              className="sr-only"
              checked={isOn}
              onChange={() => onChange(address.id)}
            />
            <Icon name="pin" size={18} className="text-gold" />
            <span className="grid min-w-0 flex-1">
              <span className="font-medium text-foreground">{address.label}</span>
              <span className="text-xs text-muted-foreground">{address.city}</span>
            </span>
            {isOn ? <Icon name="check" size={18} className="text-gold" /> : null}
          </label>
        );
      })}
    </fieldset>
  );
}
