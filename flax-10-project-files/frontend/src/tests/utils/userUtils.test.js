import { describe, it, expect } from 'vitest';
import { getInitials } from '../../utils/userUtils';

describe('getInitials', () => {
  it('returns empty string for default empty name', () => {
    expect(getInitials()).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('returns single initial for single word', () => {
    expect(getInitials('Kausar')).toBe('K');
  });

  it('returns two initials for two words', () => {
    expect(getInitials('Kausar Khan')).toBe('KK');
  });

  it('returns only first two initials for more than two words', () => {
    expect(getInitials('Kausar Ali Khan')).toBe('KA');
  });
  
  it('handles extra spaces', () => {
    expect(getInitials('  Kausar   Khan  ')).toBe('KK');
  });
});