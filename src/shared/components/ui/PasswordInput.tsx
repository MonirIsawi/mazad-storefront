'use client';

import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@shared/lib';
import { Icon } from './Icon';
import { Input, type InputProps } from './Input';

/** A password field with a show/hide toggle; the value never leaves the field. Reads LTR. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'trailing'>>(
  function PasswordInput(props, ref) {
    const { t } = useTranslation('common');
    const [isVisible, setIsVisible] = useState(false);
    return (
      <Input
        ref={ref}
        isLatin
        {...props}
        // Edge draws its own reveal eye inside password fields, beside this one.
        className={cn('[&::-ms-reveal]:hidden', props.className)}
        type={isVisible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setIsVisible((v) => !v)}
            aria-label={t(isVisible ? 'password.hide' : 'password.show')}
            aria-pressed={isVisible}
            className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
          >
            <Icon name={isVisible ? 'eye-off' : 'eye'} size={20} />
          </button>
        }
      />
    );
  },
);
