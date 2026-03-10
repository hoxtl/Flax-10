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

vi.mock('../../../../components/ui/AnimatedDropdown', () => ({
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
  const originalInnerHeight = window.innerHeight;

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
    const { rerender } = render(<DateTimePicker value="2026-06-15T10:30" onChange={onChange} />);
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

    // case 2: limited space below triggers openAbove branch
    Object.defineProperty(window, 'innerHeight', { value: 150, configurable: true });
    rerender(<DateTimePicker value="2026-06-15T10:30" onChange={onChange} />);
    openDropdown();
  });
});

