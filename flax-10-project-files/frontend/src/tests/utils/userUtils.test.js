import { describe, it, expect } from 'vitest';
import { getInitials } from '../../components/Auth/utils/userUtils';

describe('getInitials', () => {
  it('returns empty string for default empty name', () => {
    expect(getInitials()).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('returns single initial for single word', () => {
    expect(getInitials('Jane')).toBe('J');
  });

  it('returns two initials for two words', () => {
    expect(getInitials('Jane Doe')).toBe('JD');
  });

  it('returns only first two initials for more than two words', () => {
    expect(getInitials('Jane Smith Doe')).toBe('JS');
  });
  
  it('handles extra spaces', () => {
    expect(getInitials('  Jane   Doe  ')).toBe('JD');
  });
});
