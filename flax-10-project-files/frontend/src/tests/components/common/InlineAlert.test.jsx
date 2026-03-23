/*
 * Tests for the InlineAlert component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import InlineAlert from '../../../components/Common/InlineAlert/InlineAlert';

vi.mock('../../../components/Common/InlineAlert/InlineAlert.module.css', () => ({
  default: {
    alert: 'alert', success: 'success', error: 'error', warning: 'warning', info: 'info',
    icon: 'icon', message: 'message',
  },
}));

describe('InlineAlert', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders nothing when message is falsy', () => {
    const { container } = render(<InlineAlert message="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the message text when message is provided', () => {
    render(<InlineAlert message="All saved!" />);
    expect(screen.getByText('All saved!')).toBeInTheDocument();
  });

  it('shows the success icon by default', () => {
    render(<InlineAlert message="Done" />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows the error icon for the error variant', () => {
    render(<InlineAlert message="Failed" variant="error" />);
    expect(screen.getByText('✕')).toBeInTheDocument();
  });

  it('shows the warning icon for the warning variant', () => {
    render(<InlineAlert message="Take care" variant="warning" />);
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('shows the info icon for the info variant', () => {
    render(<InlineAlert message="Note" variant="info" />);
    expect(screen.getByText('i')).toBeInTheDocument();
  });

  it('uses role="alert" for error variant', () => {
    render(<InlineAlert message="Error!" variant="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('uses role="status" for non-error variants', () => {
    render(<InlineAlert message="OK" variant="success" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('auto-dismisses after the autoDismiss duration and calls onDismiss', () => {
    const onDismiss = vi.fn();
    render(<InlineAlert message="Bye" autoDismiss={1000} onDismiss={onDismiss} />);
    expect(screen.getByText('Bye')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1350); });
    expect(onDismiss).toHaveBeenCalled();
  });

  it('becomes invisible after the exit animation when message is cleared', () => {
    const { rerender } = render(<InlineAlert message="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
    act(() => { rerender(<InlineAlert message="" />); });
    act(() => { vi.advanceTimersByTime(350); });
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('applies an extra className to the alert element', () => {
    render(<InlineAlert message="Note" className="myClass" />);
    const el = screen.getByRole('status');
    expect(el.className).toContain('myClass');
  });
});
