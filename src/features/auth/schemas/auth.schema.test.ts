import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from './auth.schema';

describe('loginSchema', () => {
  it('accepts a valid phone and password', () => {
    const result = loginSchema.safeParse({ phone: '+9647701234567', password: '12345678' });
    expect(result.success).toBe(true);
  });

  it('rejects a short password', () => {
    const result = loginSchema.safeParse({ phone: '+9647701234567', password: '123' });
    expect(result.success).toBe(false);
  });

  it('rejects a malformed phone number', () => {
    const result = loginSchema.safeParse({ phone: 'not-a-phone', password: '12345678' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    phone: '+9647701234567',
    password: '12345678',
    fullName: 'Ali Hassan',
    code: '123456',
  };

  it('rejects a full name that is too short', () => {
    const result = registerSchema.safeParse({ ...valid, fullName: 'A' });
    expect(result.success).toBe(false);
  });

  it('accepts a fully valid payload', () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('requires the sign-up code', () => {
    const withoutCode = { phone: valid.phone, password: valid.password, fullName: valid.fullName };
    expect(registerSchema.safeParse(withoutCode).success).toBe(false);
  });

  it.each(['12345', '1234567', '12a456', ' ', ''])('rejects the malformed code %j', (code) => {
    expect(registerSchema.safeParse({ ...valid, code }).success).toBe(false);
  });

  it('trims the code before checking it', () => {
    const result = registerSchema.safeParse({ ...valid, code: ' 123456 ' });
    expect(result.success && result.data.code).toBe('123456');
  });
});
