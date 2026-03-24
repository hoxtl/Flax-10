import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import {
  STORAGE_KEY,
  buildChatDetail,
  openFlaxChat,
  readDismissedState,
  persistDismissedState,
} from '../../../components/ui/est-time-help-banner/estTimeHelpBannerUtils';

describe('estTimeHelpBannerUtils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds chat detail only for non-empty trimmed strings', () => {
    expect(buildChatDetail('  estimate this  ')).toEqual({ initialMessage: 'estimate this' });
    expect(buildChatDetail('   ')).toEqual({});
    expect(buildChatDetail(null)).toEqual({});
  });

  it('dispatches the open-chat event and swallows dispatch failures', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    expect(openFlaxChat(' hello ')).toBeUndefined();
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'flax-open-chat',
        detail: { initialMessage: 'hello' },
      }),
    );

    dispatchSpy.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    expect(openFlaxChat('again')).toBeUndefined();
  });

  it('reads dismissed state only when persistence is enabled', () => {
    localStorage.setItem(STORAGE_KEY, '1');
    expect(readDismissedState(false)).toBe(false);
    expect(readDismissedState(true)).toBe(true);
    localStorage.setItem(STORAGE_KEY, '0');
    expect(readDismissedState(true)).toBe(false);
  });

  it('returns false when reading from storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('read fail');
    });

    expect(readDismissedState(true)).toBe(false);
  });

  it('persists dismissal only when enabled and ignores storage errors', () => {
    persistDismissedState(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    persistDismissedState(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('write fail');
    });

    expect(persistDismissedState(true)).toBeUndefined();
  });
});
