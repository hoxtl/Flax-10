import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreakModal } from '../../../components/Timer/TimerPopups';
import { getSelectedBreakLabel } from '../../../components/Timer/popups/BreakModal';

const testRender = () => {
    const onAction = vi.fn();
    render(<BreakModal onAction={onAction} />);
    expect(screen.getByText('Focus session complete')).toBeInTheDocument();
    expect(screen.getByText('Start 5m Stretch')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Start 5m Stretch'));
    expect(onAction).toHaveBeenCalled();
};

describe('BreakModal', () => {
    it('renders correctly and handles action', testRender);

    it('switches break options and covers the fallback label branch', () => {
        const onAction = vi.fn();
        render(<BreakModal onAction={onAction} />);

        fireEvent.click(screen.getByText('Hydrate'));
        expect(screen.getByText('Start Hydrate')).toBeInTheDocument();
        expect(getSelectedBreakLabel('unknown')).toBe('Break');
    });
});
