import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AnimatedDropdown from '../../../components/common/AnimatedDropdown';

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => {
      const Tag = typeof tag === 'string' ? tag : 'div';
      return ({ children, initial, animate, exit, transition, variants, whileTap, ...rest }) =>
        <Tag {...rest}>{children}</Tag>;
    },
  }),
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

  it('does not show "Try a different search term" when query is empty in empty state', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Search..."
        options={[]}
        searchable
        emptyMessage="No options"
      />
    );
    fireEvent.click(screen.getByText('Search...'));
    expect(screen.getByText('No options')).toBeInTheDocument();
    expect(screen.queryByText('Try a different search term')).not.toBeInTheDocument();
  });

  it('filters grouped options by search', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Search..."
        options={GROUPED_OPTIONS}
        grouped
        searchable
        emptyMessage="Nothing found"
      />
    );
    fireEvent.click(screen.getByText('Search...'));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'a1' } });
    expect(screen.getByText('A1')).toBeInTheDocument();
    expect(screen.queryByText('A2')).not.toBeInTheDocument();
    expect(screen.queryByText('B1')).not.toBeInTheDocument();
  });

  it('filters flat object options by label', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Search..."
        options={[{ value: 'x', label: 'Extra' }]}
        searchable
        emptyMessage="Nothing"
      />
    );
    fireEvent.click(screen.getByText('Search...'));
    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'ext' } });
    expect(screen.getByText('Extra')).toBeInTheDocument();
  });

  it('supports hideCheckmark', () => {
    const onChange = vi.fn();
    render(
      <AnimatedDropdown
        value=""
        onChange={onChange}
        placeholder="Select"
        options={OPTIONS}
        hideCheckmark
      />
    );
    fireEvent.click(screen.getByText('Select'));
    fireEvent.click(screen.getAllByText('Option A2')[0]);
    expect(onChange).toHaveBeenCalledWith('a2');
  });

  it('supports customTrigger', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select"
        options={OPTIONS}
        customTrigger={<span data-testid="custom-trigger">Custom</span>}
      />
    );
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('custom-trigger'));
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('controlled closed state hides options', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select"
      options={OPTIONS} isOpen={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText('Option A1')).not.toBeInTheDocument();
  });

  it('controlled open state shows options and calls onOpenChange on select', () => {
    const onOpenChange = vi.fn();
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select"
      options={OPTIONS} isOpen={true} onOpenChange={onOpenChange} />);
    expect(screen.getByText('Option A1')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Option A1'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('opens on hover when openOnHover', () => {
    const { container } = render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select"
        options={OPTIONS}
        openOnHover
      />
    );
    fireEvent.mouseEnter(container.firstChild);
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('does not open on click when openOnHover', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select"
        options={OPTIONS}
        openOnHover
      />
    );
    fireEvent.click(screen.getByText('Select'));
    expect(screen.queryByText('Option A1')).toBeNull();
  });

  it('closes menu when clicking outside', () => {
    const { container } = render(
      <div>
        <AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} />
        <div data-testid="outside">Outside</div>
      </div>
    );
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByText('Option A1')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Option A1')).not.toBeInTheDocument();
  });

  it('supports menuMaxHeight', () => {
    const { container } = render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select"
        options={OPTIONS}
        menuMaxHeight={200}
      />
    );
    fireEvent.click(screen.getByText('Select'));
    const menu = container.querySelector('[class*="dropdownMenu"]') || container.querySelector('[style*="maxHeight"]');
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select"
        options={OPTIONS}
        className="my-dropdown"
      />
    );
    expect(container.firstChild.className).toContain('my-dropdown');
  });

  it('search input stopPropagation does not close menu on click', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Search"
        options={OPTIONS}
        searchable
      />
    );
    fireEvent.click(screen.getByText('Search'));
    const input = screen.getByPlaceholderText('Search...');
    fireEvent.click(input);
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('closes on mouse leave when openOnHover', () => {
    vi.useFakeTimers();
    const { container } = render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Select"
        options={OPTIONS}
        openOnHover
      />
    );
    fireEvent.mouseEnter(container.firstChild);
    expect(screen.getByText('Option A1')).toBeInTheDocument();
    fireEvent.mouseLeave(container.firstChild);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText('Option A1')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
