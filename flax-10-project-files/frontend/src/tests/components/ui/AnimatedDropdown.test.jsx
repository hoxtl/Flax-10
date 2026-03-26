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

describe('AnimatedDropdown', () => {
  it('renders with placeholder when no value', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select..." options={OPTIONS} />);
    expect(screen.getByText('Select...')).toBeInTheDocument();
  });

  it('renders selected label when value is set', () => {
    render(<AnimatedDropdown value="a1" onChange={vi.fn()} placeholder="Select..." options={OPTIONS} />);
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('opens menu on trigger click', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select..." options={OPTIONS} />);
    fireEvent.click(screen.getByText('Select...'));
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(<AnimatedDropdown value="" onChange={onChange} placeholder="Select..." options={OPTIONS} />);
    fireEvent.click(screen.getByText('Select...'));
    fireEvent.click(screen.getByText('Option A2'));
    expect(onChange).toHaveBeenCalledWith('a2');
  });

  it('closes menu after selection', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select..." options={OPTIONS} />);
    fireEvent.click(screen.getByText('Select...'));
    fireEvent.click(screen.getByText('Option A1'));
    expect(screen.queryByText('Option A2')).not.toBeInTheDocument();
  });

  it('supports flat string options', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Choose" options={['One', 'Two']} />);
    fireEvent.click(screen.getByText('Choose'));
    expect(screen.getByText('One')).toBeInTheDocument();
  });

  it('supports hideCheckmark', () => {
    const onChange = vi.fn();
    render(<AnimatedDropdown value="" onChange={onChange} placeholder="Select" options={OPTIONS} hideCheckmark />);
    fireEvent.click(screen.getByText('Select'));
    fireEvent.click(screen.getAllByText('Option A2')[0]);
    expect(onChange).toHaveBeenCalledWith('a2');
  });

  it('supports customTrigger', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS}
      customTrigger={<span data-testid="custom-trigger">Custom</span>} />);
    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('custom-trigger'));
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('supports portal rendering and hover-style custom triggers', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Portal" options={OPTIONS} usePortal
      customTrigger={<span data-testid="portal-trigger">Portal trigger</span>} openOnHover />);
    const trigger = screen.getByTestId('portal-trigger').parentElement;
    fireEvent.mouseEnter(trigger);
    expect(document.body).toHaveTextContent('Option A1');
  });

  it('controlled closed state hides options', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} isOpen={false} onOpenChange={vi.fn()} />);
    expect(screen.queryByText('Option A1')).not.toBeInTheDocument();
  });

  it('controlled open state shows options and calls onOpenChange on select', () => {
    const onOpenChange = vi.fn();
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} isOpen={true} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByText('Option A1'));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('opens on hover when openOnHover', () => {
    const { container } = render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} openOnHover />);
    fireEvent.mouseEnter(container.firstChild);
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('does not open on click when openOnHover', () => {
    render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} openOnHover />);
    fireEvent.click(screen.getByText('Select'));
    expect(screen.queryByText('Option A1')).toBeNull();
  });

  it('closes menu when clicking outside', () => {
    const { container } = render(<div><AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} /><div data-testid="outside">Outside</div></div>);
    fireEvent.click(screen.getByText('Select'));
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Option A1')).not.toBeInTheDocument();
  });

  it('supports menuMaxHeight', () => {
    const { container } = render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} menuMaxHeight={200} />);
    fireEvent.click(screen.getByText('Select'));
    expect(screen.getByText('Option A1')).toBeInTheDocument();
  });

  it('applies className', () => {
    const { container } = render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} className="my-dropdown" />);
    expect(container.firstChild.className).toContain('my-dropdown');
  });

  it('closes on mouse leave when openOnHover', () => {
    vi.useFakeTimers();
    const { container } = render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Select" options={OPTIONS} openOnHover />);
    fireEvent.mouseEnter(container.firstChild);
    fireEvent.mouseLeave(container.firstChild);
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText('Option A1')).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renders right-aligned flat options even when an option value is missing', () => {
    const { container } = render(<AnimatedDropdown value="" onChange={vi.fn()} placeholder="Aligned" options={[{ label: 'Missing' }]} align="right" />);
    fireEvent.click(screen.getByText('Aligned'));
    expect(screen.getByText('Missing')).toBeInTheDocument();
    expect(container.querySelector('[class*="alignRight"]')).not.toBeNull();
  });

  it('shows searchable empty state and focuses the search box', () => {
    render(
      <AnimatedDropdown
        value=""
        onChange={vi.fn()}
        placeholder="Search"
        options={OPTIONS}
        searchable
        isOpen={true}
      />,
    );

    const input = screen.getByPlaceholderText('Search...');
    expect(input).toHaveFocus();

    fireEvent.change(input, { target: { value: 'zzz' } });
    expect(screen.getByText('Nothing found')).toBeInTheDocument();
    expect(screen.getByText('Try a different search term')).toBeInTheDocument();
  });

  it('renders grouped options with the current item checked', () => {
    const grouped = [
      { label: 'Letters', options: [{ value: 'a1', label: 'Alpha' }, { value: 'a2', label: 'Beta' }] },
      { label: 'Numbers', options: [{ value: 'n1', label: 'One' }] },
    ];

    render(<AnimatedDropdown value="a2" onChange={vi.fn()} placeholder="Grouped" options={grouped} grouped isOpen={true} />);

    expect(screen.getByText('Letters')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Beta').closest('button')).toHaveClass(expect.stringContaining('dropdownItemActive'));
  });
});
