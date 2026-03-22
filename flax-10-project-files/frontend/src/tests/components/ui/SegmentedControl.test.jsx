import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from '../../../components/Common/SegmentedControl/SegmentedControl';

const MockIcon = () => <svg data-testid="icon" />;

describe('SegmentedControl', () => {
  it('renders options as buttons', () => {
    const options = [
      { value: 'a', label: 'Option A' },
      { value: 'b', label: 'Option B' },
    ];
    render(<SegmentedControl options={options} value="a" onChange={vi.fn()} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('calls onChange when option is clicked', () => {
    const onChange = vi.fn();
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];
    render(<SegmentedControl options={options} value="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('applies className', () => {
    const options = [{ value: 'x', label: 'X' }];
    const { container } = render(
      <SegmentedControl options={options} value="x" onChange={vi.fn()} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders icon-only option when label is empty', () => {
    const options = [
      { value: 'icon', label: '', icon: MockIcon, title: 'Icon option' },
    ];
    render(<SegmentedControl options={options} value="icon" onChange={vi.fn()} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTitle('Icon option')).toBeInTheDocument();
  });

  it('renders option with both icon and label', () => {
    const options = [
      { value: 'both', label: 'Both', icon: MockIcon, title: 'Both' },
    ];
    render(<SegmentedControl options={options} value="both" onChange={vi.fn()} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText('Both')).toBeInTheDocument();
  });
});
