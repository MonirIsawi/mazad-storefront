'use client';

import { forwardRef } from 'react';
import { Input, type InputProps } from '@shared/components/ui';
import { IRAQ_DIAL_CODE } from '../../lib/phone-prefix';

/**
 * The phone field of the sign-in flows: the Iraqi +964 fixed in front, so the number is typed once
 * and right (design `.input.cred`). Reads left to right in both languages.
 */
export const PhoneField = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'leading'>>(
  function PhoneField(props, ref) {
    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        isLatin
        leading={<span dir="ltr">{IRAQ_DIAL_CODE}</span>}
        {...props}
      />
    );
  },
);
