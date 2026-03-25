/*
 * Tests for the FilterCheckbox component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterCheckbox from '../../../components/common/FilterCheckbox/FilterCheckbox';

vi.mock('../../../components/common/FilterCheckbox/FilterCheckbox.module.css', () => ({
  default: { filterCheckbox: 'filterCheckbox' },
}));

describe('FilterCheckbox', () => {
  it('renders a checkbox input', () => {
    render(<FilterCheckbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('applies the filterCheckbox CSS class by default', () => {
    render(<FilterCheckbox />);
    expect(screen.getByRole('checkbox').className).toContain('filterCheckbox');
  });

  it('merges an additional className with the default style', () => {
    render(<FilterCheckbox className="extra" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toContain('filterCheckbox');
    expect(checkbox.className).toContain('extra');
  });

  it('passes through standard checkbox props', () => {
    render(<FilterCheckbox checked={true} readOnly />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('calls onChange when the checkbox is toggled', () => {
    const onChange = vi.fn();
    render(<FilterCheckbox onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalled();
  });

  it('renders as unchecked by default', () => {
    render(<FilterCheckbox />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('respects a disabled prop', () => {
    render(<FilterCheckbox disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
