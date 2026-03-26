import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../../components/common/card/Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Content</Card>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders as div by default', () => {
    const { container } = render(<Card>Body</Card>);
    expect(container.querySelector('div')).toBeInTheDocument();
  });

  it('renders as a custom element via as prop', () => {
    const { container } = render(<Card as="section">Section body</Card>);
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('applies default variant class', () => {
    const { container } = render(<Card>Default</Card>);
    expect(container.firstChild.className).toContain('default');
  });

  it('applies custom variant class', () => {
    const { container } = render(<Card variant="subtle">Subtle</Card>);
    expect(container.firstChild.className).toContain('subtle');
  });

  it('applies default medium padding class', () => {
    const { container } = render(<Card>Padding</Card>);
    expect(container.firstChild.className).toContain('paddingMd');
  });

  it('applies custom padding class', () => {
    const { container } = render(<Card padding="lg">Large padding</Card>);
    expect(container.firstChild.className).toContain('paddingLg');
  });

  it('applies interactive class when interactive is true', () => {
    const { container } = render(<Card interactive>Interactive</Card>);
    expect(container.firstChild.className).toContain('interactive');
  });

  it('does not apply interactive class when interactive is false (default)', () => {
    const { container } = render(<Card>Non-interactive</Card>);
    expect(container.firstChild.className).not.toContain('interactive');
  });

  it('applies a custom className', () => {
    const { container } = render(<Card className="my-card">Custom</Card>);
    expect(container.firstChild.className).toContain('my-card');
  });

  it('passes extra props to the element', () => {
    render(<Card data-testid="card-el">Props</Card>);
    expect(screen.getByTestId('card-el')).toBeInTheDocument();
  });
});
