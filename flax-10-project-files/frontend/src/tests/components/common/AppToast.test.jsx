import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AppToast from '../../../components/common/AppToast/AppToast';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const rest = { ...props };
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      delete rest.transition;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('AppToast', () => {
  it('renders heading from message prop', () => {
    render(<AppToast message="Saved successfully" onClose={vi.fn()} />);
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });

  it('renders heading from title prop and message as subcopy', () => {
    render(<AppToast title="Done" message="Your changes were saved." onClose={vi.fn()} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Your changes were saved.')).toBeInTheDocument();
  });

  it('renders description as subcopy when title is absent', () => {
    render(<AppToast message="Heading" description="Extra detail" onClose={vi.fn()} />);
    expect(screen.getByText('Heading')).toBeInTheDocument();
    expect(screen.getByText('Extra detail')).toBeInTheDocument();
  });

  it('prefers description over message for subcopy when title is set', () => {
    render(<AppToast title="Title" message="msg" description="desc" onClose={vi.fn()} />);
    expect(screen.getByText('desc')).toBeInTheDocument();
    expect(screen.queryByText('msg')).not.toBeInTheDocument();
  });

  it('calls onClose when dismiss button is clicked', () => {
    const onClose = vi.fn();
    render(<AppToast message="Hello" onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss toast/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows default success icon when variant is success', () => {
    render(<AppToast message="OK" variant="success" onClose={vi.fn()} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('shows error icon when variant is error', () => {
    render(<AppToast message="Oops" variant="error" onClose={vi.fn()} />);
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('shows info icon when variant is info', () => {
    render(<AppToast message="FYI" variant="info" onClose={vi.fn()} />);
    expect(screen.getByText('i')).toBeInTheDocument();
  });

  it('renders custom icon when icon prop is passed', () => {
    render(<AppToast message="Custom" icon="🚀" onClose={vi.fn()} />);
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('renders action button and calls onAction then onClose when clicked', async () => {
    const onAction = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <AppToast message="msg" actionLabel="Undo" onAction={onAction} onClose={onClose} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render action button when actionLabel is absent', () => {
    render(<AppToast message="msg" onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('does not render action button when onAction is not a function', () => {
    render(<AppToast message="msg" actionLabel="Undo" onAction={null} onClose={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('has role status on the toast body', () => {
    render(<AppToast message="msg" onClose={vi.fn()} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('falls back to the success styling and omits subcopy when only a title is provided', () => {
    render(<AppToast title="Only title" variant="mystery" onClose={vi.fn()} />);

    expect(screen.getByText('Only title')).toBeInTheDocument();
    expect(screen.queryByText(/desc|msg/i)).not.toBeInTheDocument();
    expect(screen.getByRole('status').className).toContain('success');
  });
});
