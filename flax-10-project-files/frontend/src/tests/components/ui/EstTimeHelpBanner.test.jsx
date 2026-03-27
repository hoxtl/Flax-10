import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EstTimeHelpBanner from '../../../components/ui/components/EstTimeHelpBanner';

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...props }) => <div {...props}>{children}</div> },
}));

describe('EstTimeHelpBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('dispatches flax-open-chat with trimmed initialMessage', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<EstTimeHelpBanner initialMessage="  help me estimate  " />);

    fireEvent.click(screen.getByRole('button', { name: 'Ask Flax' }));

    expect(dispatchSpy).toHaveBeenCalled();
    const evt = dispatchSpy.mock.calls[0][0];
    expect(evt.type).toBe('flax-open-chat');
    expect(evt.detail).toEqual({ initialMessage: 'help me estimate' });
    dispatchSpy.mockRestore();
  });

  it('dismisses and persists when persistDismiss is true', () => {
    const { rerender } = render(<EstTimeHelpBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(localStorage.getItem('flax-est-time-banner-dismissed-v2')).toBe('1');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    rerender(<EstTimeHelpBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not persist dismiss when persistDismiss is false', () => {
    render(<EstTimeHelpBanner persistDismiss={false} ctaLabel="Open" message="m" />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(localStorage.getItem('flax-est-time-banner-dismissed-v2')).toBeNull();
  });

  it('dispatches with empty detail when initial message is not usable', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    render(<EstTimeHelpBanner initialMessage={null} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ask Flax' }));

    const evt = dispatchSpy.mock.calls[0][0];
    expect(evt.detail).toEqual({});
    dispatchSpy.mockRestore();
  });

  it('handles localStorage read/write failures gracefully', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('read fail');
    });
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('write fail');
    });

    render(<EstTimeHelpBanner />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    getItemSpy.mockRestore();
    setItemSpy.mockRestore();
  });

  it('starts dismissed when persisted value exists', () => {
    localStorage.setItem('flax-est-time-banner-dismissed-v2', '1');
    render(<EstTimeHelpBanner />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
