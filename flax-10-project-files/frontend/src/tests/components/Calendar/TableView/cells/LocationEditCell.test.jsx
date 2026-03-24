import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { LocationEditCell } from '../../../../../components/Calendar/TableView/cells/LocationEditCell';

vi.mock('../../../../../components/Calendar/EventModal/components/LocationAutoComplete', () => ({
  LocationAutocomplete: ({ value, onChange, placeholder }) => (
    <input
      data-testid="location-autocomplete"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('LocationEditCell', () => {
  it('renders the plain location value when not editing', () => {
    render(<LocationEditCell value="Library" isEditing={false} onChange={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders an empty string for falsy display values', () => {
    const { container } = render(<LocationEditCell value="" isEditing={false} onChange={vi.fn()} onSave={vi.fn()} />);
    expect(container.textContent).toBe('');
  });

  it('renders the editor, forwards changes, and saves on blur', () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    render(<LocationEditCell value={null} isEditing onChange={onChange} onSave={onSave} />);

    const input = screen.getByTestId('location-autocomplete');
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', 'Enter location');

    fireEvent.change(input, { target: { value: 'Campus library' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('Campus library');
    expect(onSave).toHaveBeenCalled();
  });
});
