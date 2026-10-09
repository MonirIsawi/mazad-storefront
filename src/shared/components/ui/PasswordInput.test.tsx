import { beforeAll, describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery } from '@/test/render';
import i18n from '@shared/i18n';
import { PasswordInput } from './PasswordInput';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('PasswordInput', () => {
  it('hides the password until the user asks to see it, and hides it again', async () => {
    renderWithQuery(<PasswordInput label="Password" />);
    const field = screen.getByLabelText('Password');
    await userEvent.type(field, 'secret-1');
    expect(field.getAttribute('type')).toBe('password');

    await userEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(field.getAttribute('type')).toBe('text');
    expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe(
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(field.getAttribute('type')).toBe('password');
    expect((field as HTMLInputElement).value).toBe('secret-1');
  });
});
