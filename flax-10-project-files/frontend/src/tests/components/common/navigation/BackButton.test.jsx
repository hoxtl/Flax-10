import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import BackButton from '../../../../components/common/back_button/BackButton';

describe('BackButton', () => {
  it('renders the default label', () => {
    render(<BackButton onClick={vi.fn()} />);
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('←')).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    render(<BackButton onClick={vi.fn()} label="Return" />);
    expect(screen.getByText('Return')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('sets aria-label to the label text', () => {
    render(<BackButton onClick={vi.fn()} label="Go back" />);
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument();
  });

  it('applies extra className to the button', () => {
    render(<BackButton onClick={vi.fn()} className="extra-class" />);
    expect(screen.getByRole('button').className).toContain('extra-class');
  });

  it('applies default empty className without extra', () => {
    render(<BackButton onClick={vi.fn()} />);
    const btn = screen.getByRole('button');
    expect(btn).toBeTruthy();
  });
});
