'use client';

import { forwardRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { Input, type InputProps } from './Input';

/** A password field with a show/hide toggle (as in the app); the value never leaves the field. */
export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'trailing'>>(
  function PasswordInput(props, ref) {
    const { t } = useTranslation('common');
    const [isVisible, setIsVisible] = useState(false);
    return (
      <Input
        ref={ref}
        {...props}
        type={isVisible ? 'text' : 'password'}
        trailing={
          <button
            type="button"
            onClick={() => setIsVisible((v) => !v)}
            aria-label={t(isVisible ? 'password.hide' : 'password.show')}
            aria-pressed={isVisible}
            className="inline-flex size-10 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <Icon name="eye" size={20} />
          </button>
        }
      />
    );
  },
);
