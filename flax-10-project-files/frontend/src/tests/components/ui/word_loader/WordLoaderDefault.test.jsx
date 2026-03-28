import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import WordLoader from '../../../../components/ui/components/WordLoader';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }) => {
      const rest = { ...props };
      delete rest.custom;
      delete rest.variants;
      delete rest.initial;
      delete rest.animate;
      delete rest.exit;
      return <span {...rest}>{children}</span>;
    },
  },
}));

describe('WordLoader (default export)', () => {
  it('renders first word characters', () => {
    render(<WordLoader words={['Hello', 'World']} />);
    // "Hello" split into individual characters
    expect(screen.getByText('H')).toBeInTheDocument();
    expect(screen.getByText('e')).toBeInTheDocument();
  });

  it('applies a custom className to the wrapper', () => {
    const { container } = render(<WordLoader words={['Test']} className="my-loader" />);
    expect(container.firstChild.className).toContain('my-loader');
  });

  it('renders without a className when not provided', () => {
    const { container } = render(<WordLoader words={['Test']} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders a single word', () => {
    render(<WordLoader words={['Solo']} />);
    expect(screen.getByText('S')).toBeInTheDocument();
  });
});
