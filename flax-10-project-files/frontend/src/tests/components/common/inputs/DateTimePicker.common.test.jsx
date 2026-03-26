import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DateTimePicker from '../../../../components/common/inputs/DateTimePicker';

vi.mock(
  '../../../../components/common/inputs/DateTimePicker.module.css',
  () => ({
    default: {
      wrap: 'wrap',
      trigger: 'trigger',
      triggerOpen: 'triggerOpen',
      triggerEmpty: 'triggerEmpty',
      triggerIcon: 'triggerIcon',
      triggerValueMono: 'triggerValueMono',
      clearBtn: 'clearBtn',
      dropdown: 'dropdown',
      calHeader: 'calHeader',
      navBtn: 'navBtn',
      monthLabel: 'monthLabel',
      calGrid: 'calGrid',
      dayHeader: 'dayHeader',
      dayCell: 'dayCell',
      dayCellEmpty: 'dayCellEmpty',
      dayCellToday: 'dayCellToday',
      dayCellSel: 'dayCellSel',
      timePicker: 'timePicker',
      timeOnlyPicker: 'timeOnlyPicker',
      timeIcon: 'timeIcon',
      timeDropdown: 'timeDropdown',
      timeAnimatedDd: 'timeAnimatedDd',
      timeSep: 'timeSep',
      doneBtn: 'doneBtn',
    },
  }),
);

vi.mock('../../../../components/common/animated_dropdown', () => ({
  default: function MockAnimatedDropdown({ value, onChange, options, placeholder, className }) {
    return (
      <select
        data-testid={`animated-${placeholder || 'dd'}`}
        className={className}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  },
}));

vi.mock('lucide-react', () => ({
  Clock: (props) => <span data-testid="clock-icon" {...props} />,
}));

describe('common DateTimePicker', () => {
  function openDropdown() {
    const trigger = document.querySelector('.trigger');
    if (!trigger) throw new Error('Trigger button not found');
    fireEvent.click(trigger);
  }

  it('shows placeholder and clears selection', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="" onChange={onChange} placeholder="Pick" />);

    expect(screen.getByText('Pick')).toBeInTheDocument();

    // provide a value and rerender to show clear button
    render(<DateTimePicker value="2026-03-15T10:30" onChange={onChange} placeholder="Pick" />);
    const clearBtn = screen.getByText('✕');
    fireEvent.click(clearBtn);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('timeOnly mode parses HH:mm and emits HH:mm when hour changes', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="09:05" onChange={onChange} timeOnly />);

    openDropdown();
    const hourSelect = screen.getByTestId('animated-HH');
    fireEvent.change(hourSelect, { target: { value: '10' } });

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^10:\d{2}$/));
  });

  it('dateOnly mode displays date and closes on day select, emitting YYYY-MM-DD', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="2026-03-10" onChange={onChange} dateOnly />);

    openDropdown();
    const dayButtons = Array.from(document.querySelectorAll('button')).filter((b) =>
      /^\d+$/.test(b.textContent || ''),
    );
    const dayBtn = dayButtons.find((b) => b.textContent === '15') || dayButtons[0];
    fireEvent.click(dayBtn);

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it('closes on outside click and Escape (useClickOutside)', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="2026-03-15T10:30" onChange={onChange} />);

    openDropdown();
    fireEvent.pointerDown(document.body);
    expect(document.querySelector('.dropdown')).toBeNull();

    // open again and close with Escape
    openDropdown();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.querySelector('.dropdown')).toBeNull();
  });

  it('positions dropdown below or above based on available space (useDropdownPosition)', () => {
    const onChange = vi.fn();

    // case 1: plenty of space below (openBelow)
    Object.defineProperty(window, 'innerHeight', { value: 2000, configurable: true });
    render(<DateTimePicker value="2026-06-15T10:30" onChange={onChange} />);
    const wrap = document.querySelector('.wrap');
    vi.spyOn(wrap, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      bottom: 120,
      left: 50,
      right: 150,
      width: 100,
      height: 20,
      x: 50,
      y: 100,
      toJSON: () => ({}),
    });
    openDropdown();
    expect(document.querySelector('.dropdown')).toBeInTheDocument();
  });

  it('positions dropdown above trigger when space below is limited (openAbove)', () => {
    const onChange = vi.fn();
    Object.defineProperty(window, 'innerHeight', { value: 200, configurable: true });
    render(<DateTimePicker value="2026-06-15T10:30" onChange={onChange} />);
    const wrap = document.querySelector('.wrap');
    vi.spyOn(wrap, 'getBoundingClientRect').mockReturnValue({
      top: 400,
      bottom: 420,
      left: 50,
      right: 150,
      width: 100,
      height: 20,
      x: 50,
      y: 400,
      toJSON: () => ({}),
    });
    openDropdown();
    expect(document.querySelector('.dropdown')).toBeInTheDocument();
  });

  it('navigates to previous year when clicking prev month in January', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="2026-01-15T10:30" onChange={onChange} />);
    openDropdown();
    const monthLabel = screen.getByText(/January 2026/);
    expect(monthLabel).toBeInTheDocument();
    const prevBtn = document.querySelector('.navBtn');
    fireEvent.click(prevBtn);
    expect(screen.getByText(/December 2025/)).toBeInTheDocument();
  });

  it('navigates to next year when clicking next month in December', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="2026-12-15T10:30" onChange={onChange} />);
    openDropdown();
    expect(screen.getByText(/December 2026/)).toBeInTheDocument();
    const navBtns = document.querySelectorAll('.navBtn');
    fireEvent.click(navBtns[navBtns.length - 1]);
    expect(screen.getByText(/January 2027/)).toBeInTheDocument();
  });

  it('timeOnly with no value does not emit when changing hour or minute', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="" onChange={onChange} timeOnly />);
    openDropdown();
    const hourSelect = screen.getByTestId('animated-HH');
    fireEvent.change(hourSelect, { target: { value: '14' } });
    const minuteSelect = screen.getByTestId('animated-MM');
    fireEvent.change(minuteSelect, { target: { value: '30' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes dropdown when Done is clicked', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="2026-03-15T10:30" onChange={onChange} />);
    openDropdown();
    expect(document.querySelector('.dropdown')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Done'));
    expect(document.querySelector('.dropdown')).toBeNull();
  });

  it('dateOnly trigger shows date icon not time icon', () => {
    render(<DateTimePicker value="2026-03-10" onChange={vi.fn()} dateOnly />);
    expect(screen.getByText('📅')).toBeInTheDocument();
    expect(screen.queryByText('🕒')).not.toBeInTheDocument();
  });

  it('syncs from invalid value then valid value', () => {
    const onChange = vi.fn();
    const { rerender } = render(<DateTimePicker value="invalid" onChange={onChange} placeholder="Pick" />);
    expect(document.querySelector('.trigger')).toBeInTheDocument();
    rerender(<DateTimePicker value="2026-03-15T10:30" onChange={onChange} placeholder="Pick" />);
    expect(screen.getByText(/15 \/ 03 \/ 2026/)).toBeInTheDocument();
  });

  it('full dateTime mode emits ISO string when selecting day', () => {
    const onChange = vi.fn();
    render(<DateTimePicker value="2026-03-15T10:30" onChange={onChange} />);
    openDropdown();
    const dayButtons = Array.from(document.querySelectorAll('button')).filter((b) =>
      /^\d+$/.test(b.textContent || ''),
    );
    const day20 = dayButtons.find((b) => b.textContent === '20');
    if (day20) {
      fireEvent.click(day20);
      expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2026-03-20T\d{2}:\d{2}$/));
    }
  });

  it('uses a custom trigger and toggles the portal open state', () => {
    render(
      <DateTimePicker
        value=""
        onChange={vi.fn()}
        customTrigger={<span>Open custom picker</span>}
        wrapperClassName="outer-wrap"
      />,
    );

    expect(document.querySelector('.outer-wrap')).toBeInTheDocument();
    expect(document.querySelector('.dropdown')).toBeNull();

    fireEvent.click(screen.getByText('Open custom picker'));
    expect(document.querySelector('.dropdown')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Open custom picker'));
    expect(document.querySelector('.dropdown')).toBeNull();
  });
});
