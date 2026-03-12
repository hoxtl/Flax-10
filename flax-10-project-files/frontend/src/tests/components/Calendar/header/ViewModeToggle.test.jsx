import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ViewModeToggle } from '../../../../components/Calendar/header/ViewModeToggle';

vi.mock('../../../../components/ui/AnimatedDropdown', () => ({
    default: function MockAnimatedDropdown({ value, onChange, options, placeholder }) {
        return (
            <div data-testid="view-mode-toggle">
                <span>{placeholder}</span>
                <span data-value={value}>{value}</span>
                {options.map(opt => (
                    <button key={opt.value} type="button" onClick={() => onChange(opt.value)}>
                        {opt.label}
                    </button>
                ))}
            </div>
        );
    },
}));

describe('ViewModeToggle', () => {
    it('renders with viewMode and dispatches SET_VIEW_MODE on change', () => {
        const dispatch = vi.fn();
        render(<ViewModeToggle viewMode="week" dispatch={dispatch} />);
        expect(screen.getByTestId('view-mode-toggle')).toBeInTheDocument();
        expect(screen.getByText('View')).toBeInTheDocument();
        expect(screen.getByText('week')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Day'));
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'day' });

        fireEvent.click(screen.getByText('Month'));
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'month' });

        fireEvent.click(screen.getByText('Year'));
        expect(dispatch).toHaveBeenCalledWith({ type: 'SET_VIEW_MODE', payload: 'year' });
    });
});
