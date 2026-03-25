import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

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

const mockLocationLinkClick = vi.fn();
vi.mock('../../../../../components/common/LocationLink/LocationLink', () => ({
  default: ({ location, onClick }) => (
    <button
      type="button"
      data-testid="location-link"
      onClick={() => {
        const event = { stopPropagation: vi.fn() };
        mockLocationLinkClick(event);
        onClick(event);
      }}
    >
      {location}
    </button>
  ),
}));

describe('LocationEditCell', () => {
  function renderCell(ui) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  }

  it('renders the plain location value when not editing', () => {
    renderCell(<LocationEditCell value="Library" isEditing={false} onChange={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Library')).toBeInTheDocument();
  });

  it('renders an empty string for falsy display values', () => {
    const { container } = renderCell(<LocationEditCell value="" isEditing={false} onChange={vi.fn()} onSave={vi.fn()} />);
    expect(container.textContent).toBe('');
  });

  it('renders the editor, forwards changes, and saves on blur', () => {
    const onChange = vi.fn();
    const onSave = vi.fn();
    renderCell(<LocationEditCell value={null} isEditing onChange={onChange} onSave={onSave} />);

    const input = screen.getByTestId('location-autocomplete');
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('placeholder', 'Enter location');

    fireEvent.change(input, { target: { value: 'Campus library' } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledWith('Campus library');
    expect(onSave).toHaveBeenCalled();
  });

  it('renders a populated location link and stops propagation on click', () => {
    renderCell(<LocationEditCell value="Lecture Hall" isEditing={false} onChange={vi.fn()} onSave={vi.fn()} />);

    fireEvent.click(screen.getByTestId('location-link'));

    expect(mockLocationLinkClick).toHaveBeenCalled();
    expect(mockLocationLinkClick.mock.calls[0][0].stopPropagation).toHaveBeenCalled();
  });
});
