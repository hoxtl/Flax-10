import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageToolbar, { ToolbarSortControl } from '../../../components/common/PageToolbar/PageToolbar';

describe('PageToolbar', () => {
  it('renders search slot when provided', () => {
    render(<PageToolbar searchSlot={<input placeholder="Search" />} />);
    expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
  });

  it('does not render search slot when not provided', () => {
    const { container } = render(<PageToolbar />);
    expect(container.querySelector('[class*="searchSlot"]')).toBeNull();
  });

  it('renders controls slot when provided', () => {
    render(<PageToolbar controlsSlot={<button>Filter</button>} />);
    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument();
  });

  it('does not render controls slot when not provided', () => {
    const { container } = render(<PageToolbar />);
    expect(container.querySelector('[class*="controls"]')).toBeNull();
  });

  it('applies extra className to toolbar', () => {
    const { container } = render(<PageToolbar className="custom-toolbar" />);
    expect(container.firstChild.className).toContain('custom-toolbar');
  });

  it('renders without className when not provided', () => {
    const { container } = render(<PageToolbar />);
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe('ToolbarSortControl', () => {
  it('renders default SORT label', () => {
    render(<ToolbarSortControl><span>Options</span></ToolbarSortControl>);
    expect(screen.getByText('SORT')).toBeInTheDocument();
  });

  it('renders a custom label', () => {
    render(<ToolbarSortControl label="ORDER"><span>Options</span></ToolbarSortControl>);
    expect(screen.getByText('ORDER')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<ToolbarSortControl><button>Newest</button></ToolbarSortControl>);
    expect(screen.getByRole('button', { name: 'Newest' })).toBeInTheDocument();
  });

  it('applies extra className', () => {
    const { container } = render(<ToolbarSortControl className="extra">Children</ToolbarSortControl>);
    expect(container.firstChild.className).toContain('extra');
  });

  it('renders without extra className', () => {
    const { container } = render(<ToolbarSortControl>Children</ToolbarSortControl>);
    expect(container.firstChild).toBeInTheDocument();
  });
});
