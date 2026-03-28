import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '../../../../components/common/badge/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default tone class', () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText('Label').className).toContain('default');
  });

  it('applies a custom tone class', () => {
    render(<Badge tone="success">Good</Badge>);
    expect(screen.getByText('Good').className).toContain('success');
  });

  it('applies pill class when pill is true (default)', () => {
    render(<Badge>Pill badge</Badge>);
    expect(screen.getByText('Pill badge').className).toContain('pill');
  });

  it('does not apply pill class when pill is false', () => {
    render(<Badge pill={false}>Not pill</Badge>);
    expect(screen.getByText('Not pill').className).not.toContain('pill');
  });

  it('applies a custom className', () => {
    render(<Badge className="my-class">Custom</Badge>);
    expect(screen.getByText('Custom').className).toContain('my-class');
  });

  it('passes extra props to the span', () => {
    render(<Badge data-testid="badge-el">Extra</Badge>);
    expect(screen.getByTestId('badge-el')).toBeInTheDocument();
  });

  it('renders as a span element', () => {
    const { container } = render(<Badge>Tag</Badge>);
    expect(container.querySelector('span')).toBeInTheDocument();
  });
});
