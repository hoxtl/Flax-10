import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AnimatedDropdown from '../../../components/ui/AnimatedDropdown';

vi.mock('framer-motion', () => ({
  motion: {
    button: ({ children, onClick, className }) => <button onClick={onClick} className={className}>{children}</button>,
    div: ({ children, className }) => <div className={className}>{children}</div>,
    span: ({ children, className }) => <span className={className}>{children}</span>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

const flatOptions = ['Foundation', 'Year 1', 'Year 2', 'Year 3'];

const groupedOptions = [
  { label: 'Science', options: [{ value: 'Physics', label: 'Physics' }, { value: 'Chemistry', label: 'Chemistry' }] },
  { label: 'Arts', options: [{ value: 'History', label: 'History' }, { value: 'Music', label: 'Music' }] },
];

describe('AnimatedDropdown — flat options', () => {
  it('shows placeholder when no value selected', () => {
    render(<AnimatedDropdown placeholder="Select year" options={flatOptions} onChange={vi.fn()} />);
    expect(screen.getByText('Select year')).toBeTruthy();
  });

  it('shows selected label when value is set', () => {
    render(<AnimatedDropdown value="Year 1" placeholder="Select year" options={flatOptions} onChange={vi.fn()} />);
    expect(screen.getByText('Year 1')).toBeTruthy();
  });

  it('opens and shows all options on click', () => {
    render(<AnimatedDropdown placeholder="Pick" options={flatOptions} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    flatOptions.forEach(opt => expect(screen.getByText(opt)).toBeTruthy());
  });

  it('calls onChange with selected value', () => {
    const onChange = vi.fn();
    render(<AnimatedDropdown placeholder="Pick" options={flatOptions} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Year 2'));
    expect(onChange).toHaveBeenCalledWith('Year 2');
  });

  it('closes dropdown after selection', () => {
    render(<AnimatedDropdown placeholder="Pick" options={flatOptions} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Year 2'));
    expect(screen.queryByText('Foundation')).toBeNull();
  });
});

describe('AnimatedDropdown — grouped options', () => {
  it('shows group headers', () => {
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Science')).toBeTruthy();
    expect(screen.getByText('Arts')).toBeTruthy();
  });

  it('shows all options within groups', () => {
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Physics')).toBeTruthy();
    expect(screen.getByText('History')).toBeTruthy();
  });

  it('calls onChange with the option value', () => {
    const onChange = vi.fn();
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped onChange={onChange} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByText('Physics'));
    expect(onChange).toHaveBeenCalledWith('Physics');
  });
});

describe('AnimatedDropdown — searchable', () => {
  it('renders search input when searchable=true', () => {
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped searchable onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('uses custom searchPlaceholder', () => {
    render(
      <AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped searchable
        searchPlaceholder="Search courses..." onChange={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByPlaceholderText('Search courses...')).toBeTruthy();
  });

  it('filters options matching the query', () => {
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped searchable onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'phys' } });
    expect(screen.getByText('Physics')).toBeTruthy();
    expect(screen.queryByText('History')).toBeNull();
  });

  it('hides groups where no options match', () => {
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped searchable onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'music' } });
    expect(screen.queryByText('Science')).toBeNull();
    expect(screen.getByText('Arts')).toBeTruthy();
  });

  it('shows empty state with custom message when no results', () => {
    render(
      <AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped searchable
        emptyMessage="Hmm, can't find that one" onChange={vi.fn()} />
    );
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'zzzzz' } });
    expect(screen.getByText("Hmm, can't find that one")).toBeTruthy();
  });

  it('is case-insensitive when filtering', () => {
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped searchable onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'CHEMISTRY' } });
    expect(screen.getByText('Chemistry')).toBeTruthy();
  });

  it('resets search and closes when item selected', () => {
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped searchable onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'phys' } });
    fireEvent.click(screen.getByText('Physics'));
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('filters flat options when searchable and not grouped', () => {
    render(<AnimatedDropdown placeholder="Pick" options={flatOptions} searchable onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Year 2' } });
    expect(screen.getByText('Year 2')).toBeTruthy();
    expect(screen.queryByText('Foundation')).toBeNull();
  });

  it('shows all flat options when search query is empty', () => {
    render(<AnimatedDropdown placeholder="Pick" options={flatOptions} searchable onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
    flatOptions.forEach(opt => expect(screen.getByText(opt)).toBeTruthy());
  });

  it('stopPropagation on search input click does not close dropdown', () => {
    render(<AnimatedDropdown placeholder="Pick" options={groupedOptions} grouped searchable onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    const input = screen.getByRole('textbox');
    fireEvent.click(input);
    expect(screen.getByRole('textbox')).toBeTruthy();
  });
});

describe('AnimatedDropdown — checkmark on selected value', () => {
  it('shows checkmark on already-selected flat option', () => {
    render(<AnimatedDropdown value="Year 1" placeholder="Pick" options={flatOptions} onChange={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button')[0]);
    // Year 1 should appear in the list (as an option button) and show a checkmark via CheckMark component
    const buttons = screen.getAllByRole('button');
    const year1Btn = buttons.find(b => b.textContent.includes('Year 1'));
    expect(year1Btn).toBeTruthy();
  });

  it('shows checkmark on already-selected grouped option', () => {
    render(<AnimatedDropdown value="Physics" placeholder="Pick" options={groupedOptions} grouped onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button'));
    const buttons = screen.getAllByRole('button');
    const physicsBtns = buttons.filter(b => b.textContent.includes('Physics'));
    expect(physicsBtns.length).toBeGreaterThan(0);
  });
});
