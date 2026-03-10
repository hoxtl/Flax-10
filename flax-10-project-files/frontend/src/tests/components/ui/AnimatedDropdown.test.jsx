import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnimatedDropdown from '../../../components/ui/AnimatedDropdown';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, tag) => {
        const Tag = typeof tag === 'string' ? tag : 'div';
        return ({ children, ...props }) => {
          const { initial, animate, exit, transition, variants, whileTap, ...rest } = props;
          return <Tag {...rest}>{children}</Tag>;
        };
      },
    }
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const OPTIONS = [
  { value: 'a1', label: 'Option A1' },
  { value: 'a2', label: 'Option A2' },
  { value: 'b1', label: 'Option B1' },
];

const GROUPED_OPTIONS = [
  { label: 'Group A', options: [{ value: 'a1', label: 'A1' }, { value: 'a2', label: 'A2' }] },
  { label: 'Group B', options: [{ value: 'b1', label: 'B1' }] },
];

describe('AnimatedDropdown', () => {
  it('renders with placeholder when no value', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select..."
        options={OPTIONS}
      />
    );
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('renders selected label when value is set', () => {
    render(
      <AnimatedDropdown
        value="a1"
        onChange={vi.fn()}
        placeholder="Select..."
        options={OPTIONS}
      />
    );
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('opens menu on trigger click', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select..."
        options={OPTIONS}
      />
    );
    fireEvent.click(screen.getByText('Select...'));
    expect(screen.getByText('Option A1')).toBeInTheDocument();
    expect(screen.getByText('Option A2')).toBeInTheDocument();
    expect(screen.getByText('Option B1')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(
      <AnimatedDropdown
        value=""
        onChange={onChange}
        placeholder="Select..."
        options={OPTIONS}
      />
    );
    fireEvent.click(screen.getByText('Select...'));
    fireEvent.click(screen.getByText('Option A2'));
    expect(onChange).toHaveBeenCalledWith('a2');
  });

  it('closes menu after selection', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select..."
        options={OPTIONS}
      />
    );
    fireEvent.click(screen.getByText('Select...'));
    expect(screen.getByText('Option A2')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Option A1'));
    expect(screen.queryByText('Option A2')).not.toBeInTheDocument();
  });

  it('supports flat string options', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Choose"
        options={['One', 'Two', 'Three']}
      />
    );
    fireEvent.click(screen.getByText('Choose'));
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
  });

  it('supports grouped options', () => {
    const onChange = vi.fn();
    render(
      <AnimatedDropdown
        value=""
        onChange={onChange}
        placeholder="Choose"
        options={GROUPED_OPTIONS}
        grouped
      />
    );
    fireEvent.click(screen.getByText('Choose'));
    expect(screen.getByText('Group A')).toBeInTheDocument();
    expect(screen.getByText('Group B')).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.getByText('A2')).toBeInTheDocument();
    expect(screen.getByText('B1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('B1'));
    expect(onChange).toHaveBeenCalledWith('b1');
  });

  it('shows search input when searchable', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Search..."
        options={GROUPED_OPTIONS}
        grouped
        searchable
        searchPlaceholder="Type to search"
        emptyMessage="Nothing found"
      />
    );
    fireEvent.click(screen.getByText('Search...'));
    expect(screen.getByPlaceholderText('Type to search')).toBeInTheDocument();
  });

  it('filters options when searchable and query entered', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Search..."
        options={OPTIONS}
        searchable
        emptyMessage="Nothing found"
      />
    );
    fireEvent.click(screen.getByText('Search...'));
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'a1' } });
    expect(screen.getByText('Option A1')).toBeInTheDocument();
    expect(screen.queryByText('Option A2')).not.toBeInTheDocument();
    expect(screen.queryByText('Option B1')).not.toBeInTheDocument();
  });

  it('shows empty state when search matches nothing', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Search..."
        options={OPTIONS}
        searchable
        emptyMessage="Nothing found"
      />
    );
    fireEvent.click(screen.getByText('Search...'));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'xyz' } });
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });
});
