import { describe, it, expect } from 'vitest';
import { getDisplayName, getPreferredFirstName } from '../../../components/Auth/utils/userDisplay';

describe('getDisplayName', () => {
  it('returns empty string for null user', () => {
    expect(getDisplayName(null)).toBe('');
  });

  it('returns first_name when present', () => {
    expect(getDisplayName({ first_name: 'Jane', username: 'JD' })).toBe('Jane');
  });

  it('returns username when first_name is empty', () => {
    expect(getDisplayName({ first_name: '', username: 'JD' })).toBe('JD');
  });

  it('returns username when first_name is whitespace', () => {
    expect(getDisplayName({ first_name: '   ', username: 'JD' })).toBe('JD');
  });

  it('returns empty string when both are empty', () => {
    expect(getDisplayName({ first_name: '', username: '' })).toBe('');
  });

  it('returns empty string when both are missing', () => {
    expect(getDisplayName({})).toBe('');
  });
});

describe('getPreferredFirstName', () => {
  it('returns first_name when present', () => {
    expect(getPreferredFirstName({ first_name: 'Jane' })).toBe('Jane');
  });

  it('returns username when first_name is empty', () => {
    expect(getPreferredFirstName({ first_name: '', username: 'JD' })).toBe('JD');
  });

  it('returns username when first_name is whitespace', () => {
    expect(getPreferredFirstName({ first_name: '  ', username: 'JD' })).toBe('JD');
  });

  it('returns empty string when both missing', () => {
    expect(getPreferredFirstName({})).toBe('');
  });
  
  it('handles null/undefined user', () => {
    expect(getPreferredFirstName(null)).toBe('');
    expect(getPreferredFirstName(undefined)).toBe('');
  });
});
