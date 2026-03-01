import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WarningBox from '../../../components/Onboarding/WarningBox';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div>{children}</div>,
  },
}));

describe('WarningBox', () => {
  it('renders the course name', () => {
    render(<WarningBox major="Physics" confirmed={false} onConfirm={vi.fn()} />);
    expect(screen.getByText(/Physics/)).toBeTruthy();
  });

  it('renders the "Just so you know" heading', () => {
    render(<WarningBox major="Physics" confirmed={false} onConfirm={vi.fn()} />);
    expect(screen.getByText(/just so you know/i)).toBeTruthy();
  });

  it('renders unchecked checkbox by default', () => {
    render(<WarningBox major="Physics" confirmed={false} onConfirm={vi.fn()} />);
    expect(screen.getByRole('checkbox').checked).toBe(false);
  });

  it('renders checked checkbox when confirmed=true', () => {
    render(<WarningBox major="Physics" confirmed={true} onConfirm={vi.fn()} />);
    expect(screen.getByRole('checkbox').checked).toBe(true);
  });

  it('calls onConfirm(true) when checkbox is checked', () => {
    const onConfirm = vi.fn();
    render(<WarningBox major="Physics" confirmed={false} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it('calls onConfirm(false) when checkbox is unchecked', () => {
    const onConfirm = vi.fn();
    render(<WarningBox major="Physics" confirmed={true} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it('shows confirmation label text', () => {
    render(<WarningBox major="Physics" confirmed={false} onConfirm={vi.fn()} />);
    expect(screen.getByText(/yes, this is my course/i)).toBeTruthy();
  });
});
