import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SuccessScreen from '../../../components/Onboarding/SuccessScreen';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div>{children}</div>,
    h2: ({ children, ...props }) => <h2>{children}</h2>,
    p: ({ children, ...props }) => <p>{children}</p>,
    button: ({ children, onClick, ...props }) => <button onClick={onClick}>{children}</button>,
    span: ({ children, ...props }) => <span>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('SuccessScreen', () => {
  it('renders "You\'re all set!" heading', () => {
    render(<SuccessScreen major="Physics" onComplete={vi.fn()} />);
    const heading = screen.getByRole('heading');
    expect(heading.textContent).toMatch(/you.re all set/i);
  });

  it('does not show ✦ beside the heading', () => {
    render(<SuccessScreen major="Physics" onComplete={vi.fn()} />);
    const heading = screen.getByRole('heading');
    expect(heading.textContent).not.toContain('✦');
  });

  it('shows the major name', () => {
    render(<SuccessScreen major="English Literature" onComplete={vi.fn()} />);
    expect(screen.getByText(/English Literature/)).toBeTruthy();
  });

  it('button label is "Open my dashboard"', () => {
    render(<SuccessScreen major="Physics" onComplete={vi.fn()} />);
    expect(screen.getByRole('button', { name: /open my dashboard/i })).toBeTruthy();
  });

  it('calls onComplete when button is clicked', () => {
    const onComplete = vi.fn();
    render(<SuccessScreen major="Physics" onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /open my dashboard/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('shows enrolments hint', () => {
    render(<SuccessScreen major="Physics" onComplete={vi.fn()} />);
    expect(screen.getByText(/My Enrolments/)).toBeTruthy();
  });

  it('renders the party popper emoji', () => {
    const { container } = render(<SuccessScreen major="Physics" onComplete={vi.fn()} />);
    expect(container.textContent).toContain('🎉');
  });
});
