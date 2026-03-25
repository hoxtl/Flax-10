import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PageHeader from '../../../components/common/PageHeader/PageHeader';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => {
      const rest = { ...props };
      delete rest.initial;
      delete rest.animate;
      delete rest.transition;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('../../../components/common/BackButton/BackButton.jsx', () => ({
  default: ({ onClick, className }) => (
    <button type="button" onClick={onClick} className={className}>Back</button>
  ),
}));

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="My Page" />);
    expect(screen.getByRole('heading', { name: 'My Page' })).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Title" subtitle="A subtitle" />);
    expect(screen.getByText('A subtitle')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<PageHeader title="Title" />);
    expect(screen.queryByText('A subtitle')).not.toBeInTheDocument();
  });

  it('renders details when provided', () => {
    render(<PageHeader title="Title" details={<span>Detail info</span>} />);
    expect(screen.getByText('Detail info')).toBeInTheDocument();
  });

  it('does not render details section when not provided', () => {
    const { container } = render(<PageHeader title="Title" />);
    expect(container.querySelector('[class*="details"]')).toBeNull();
  });

  it('renders action slot when provided', () => {
    render(<PageHeader title="Title" action={<button>Action</button>} />);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('does not render action slot when not provided', () => {
    const { container } = render(<PageHeader title="Title" />);
    expect(container.querySelector('[class*="action"]')).toBeNull();
  });

  it('renders back button when onBack is provided', () => {
    const onBack = vi.fn();
    render(<PageHeader title="Title" onBack={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('does not render back button when onBack is not provided', () => {
    render(<PageHeader title="Title" />);
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument();
  });

  it('applies compact class when compact is true', () => {
    const { container } = render(<PageHeader title="Title" compact />);
    expect(container.firstChild.className).toContain('headerCompact');
  });

  it('does not apply compact class by default', () => {
    const { container } = render(<PageHeader title="Title" />);
    expect(container.firstChild.className).not.toContain('headerCompact');
  });
});
