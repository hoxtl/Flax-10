import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScrollClose } from '../../components/calendar/event_detail_popup/useScrollClose';

describe('useScrollClose', () => {
  const addSpy = vi.spyOn(window, 'addEventListener');
  const removeSpy = vi.spyOn(window, 'removeEventListener');

  beforeEach(() => {
    addSpy.mockClear();
    removeSpy.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('does not register when anchorRect is null', () => {
    renderHook(() => useScrollClose(null, vi.fn()));
    expect(addSpy).not.toHaveBeenCalledWith('scroll', expect.any(Function), true);
  });

  it('registers and closes when rect is out of view above', () => {
    const onClose = vi.fn();
    renderHook(() => useScrollClose({ top: -100, bottom: 50 }, onClose));

    const scrollCall = addSpy.mock.calls.find(([type]) => type === 'scroll');
    expect(scrollCall).toBeTruthy();
    const handler = scrollCall[1];

    handler();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when rect is in view and removes listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useScrollClose({ top: 10, bottom: 100 }, onClose));

    const scrollCall = addSpy.mock.calls.find(([type]) => type === 'scroll');
    const handler = scrollCall[1];
    handler();
    expect(onClose).not.toHaveBeenCalled();

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', handler, true);
  });

  it('closes when rect is out of view below', () => {
    const onClose = vi.fn();
    const bottom = window.innerHeight + 100;
    renderHook(() => useScrollClose({ top: 10, bottom }, onClose));

    const scrollCall = addSpy.mock.calls.find(([type]) => type === 'scroll');
    scrollCall[1]();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
