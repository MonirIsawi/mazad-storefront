import { describe, expect, it } from 'vitest';
import { joinList } from './locale';

describe('joinList', () => {
  it('uses the Arabic comma in Arabic and a Latin comma in English', () => {
    expect(joinList(['الكرادة', 'بغداد'], 'ar')).toBe('الكرادة، بغداد');
    expect(joinList(['Karrada', 'Baghdad'], 'en')).toBe('Karrada, Baghdad');
  });

  it('skips empty parts', () => {
    expect(joinList(['Karrada', null, '', undefined, 'Baghdad'], 'en')).toBe('Karrada, Baghdad');
  });
});
