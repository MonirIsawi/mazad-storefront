import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { setSessionTokens } from '@shared/api';
import { STORAGE_KEYS } from '@shared/constants';
import { useFirstRunWelcome } from './useFirstRunWelcome';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

beforeEach(() => {
  replace.mockClear();
  window.localStorage.removeItem(STORAGE_KEYS.welcomeSeen);
});

afterEach(() => setSessionTokens(null));

describe('useFirstRunWelcome', () => {
  it('sends a first-time guest to the welcome once, remembering it before leaving', () => {
    renderHook(() => useFirstRunWelcome());
    expect(replace).toHaveBeenCalledExactlyOnceWith('/welcome');
    expect(window.localStorage.getItem(STORAGE_KEYS.welcomeSeen)).not.toBeNull();

    replace.mockClear();
    renderHook(() => useFirstRunWelcome());
    expect(replace).not.toHaveBeenCalled();
  });

  it('never sends a signed-in visitor, and counts them as having seen it', () => {
    setSessionTokens({ accessToken: 'a', refreshToken: 'r' });
    renderHook(() => useFirstRunWelcome());
    expect(replace).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(STORAGE_KEYS.welcomeSeen)).not.toBeNull();
  });
});
