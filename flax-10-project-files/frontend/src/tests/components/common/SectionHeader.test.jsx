import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionHeader from '../../../components/common/section_header/SectionHeader';

describe('SectionHeader', () => {
  it('renders the title', () => {
    render(<SectionHeader title="Section Title" />);
    expect(screen.getByRole('heading', { name: 'Section Title' })).toBeInTheDocument();
  });

  it('renders eyebrow when provided', () => {
    render(<SectionHeader title="Title" eyebrow="Step 1" />);
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('does not render eyebrow when not provided', () => {
    const { container } = render(<SectionHeader title="Title" />);
    expect(container.querySelector('[class*="eyebrow"]')).toBeNull();
  });

  it('renders subtitle when provided', () => {
    render(<SectionHeader title="Title" subtitle="A description" />);
    expect(screen.getByText('A description')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<SectionHeader title="Title" />);
    expect(screen.queryByText('A description')).not.toBeInTheDocument();
  });

  it('renders action slot when provided', () => {
    render(<SectionHeader title="Title" action={<button>Add</button>} />);
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('does not render action slot when not provided', () => {
    const { container } = render(<SectionHeader title="Title" />);
    expect(container.querySelector('[class*="action"]')).toBeNull();
  });

  it('applies custom className to the wrapper', () => {
    const { container } = render(<SectionHeader title="Title" className="custom-section" />);
    expect(container.firstChild.className).toContain('custom-section');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<SectionHeader title="Title" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
