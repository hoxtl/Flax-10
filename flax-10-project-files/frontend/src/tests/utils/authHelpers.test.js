import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validatePasswords, getErrorMessage, saveUserData, clearUserData } from '../../components/Authentication/utils/authHelpers';

const WELCOME_KEY = 'flax_welcome_seen_v1';

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('validatePasswords', () => {
  it('returns null when passwords match', () => {
    expect(validatePasswords('abc123', 'abc123')).toBeNull();
  });

  it('returns error string when passwords do not match', () => {
    expect(validatePasswords('abc123', 'xyz')).toBe('The two passwords do not match');
  });
});

describe('getErrorMessage', () => {
  it('returns first_name array error', () => {
    expect(getErrorMessage({ first_name: ['Too short'] })).toBe('Too short');
  });

  it('returns username string error', () => {
    expect(getErrorMessage({ username: 'Already taken' })).toBe('Already taken');
  });

  it('returns email error', () => {
    expect(getErrorMessage({ email: ['Invalid'] })).toBe('Invalid');
  });

  it('returns fallback when no field errors', () => {
    expect(getErrorMessage({})).toBe('Unable to register the account, try again...');
  });

  it('returns null for missing field (branch: !data[field])', () => {
    expect(getErrorMessage({ last_name: null })).toBe('Unable to register the account, try again...');
  });
});

describe('saveUserData', () => {
  it('saves token and user to localStorage and dispatches event', () => {
    const user = { username: 'jane' };
    saveUserData('tok123', user);
    expect(localStorage.getItem('token')).toBe('tok123');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
    expect(localStorage.getItem(WELCOME_KEY)).toBeNull();
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
});

describe('clearUserData', () => {
  it('removes token, user, and welcome key, then dispatches event', () => {
    localStorage.setItem('token', 'tok');
    localStorage.setItem('user', '{}');
    localStorage.setItem(WELCOME_KEY, '1');
    clearUserData();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem(WELCOME_KEY)).toBeNull();
    expect(window.dispatchEvent).toHaveBeenCalled();
  });
});