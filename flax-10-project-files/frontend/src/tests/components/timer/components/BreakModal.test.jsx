import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/timer/BreakModal.test.jsx
import { BreakModal, getSelectedBreakLabel } from '../../../components/timer/popups/BreakModal';
=======
import { BreakModal } from '../../../../components/timer/components/TimerPopups';

const testRender = () => {
    const onAction = vi.fn();
    render(<BreakModal onAction={onAction} />);
    expect(screen.getByText('Focus session complete')).toBeInTheDocument();
    expect(screen.getByText('Start 5m Stretch')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Start 5m Stretch'));
    expect(onAction).toHaveBeenCalled();
};
>>>>>>> origin:flax-10-project-files/frontend/src/tests/components/timer/components/BreakModal.test.jsx

describe('BreakModal', () => {
    it('starts the default break and closes from the header', () => {
        const onAction = vi.fn();
        render(<BreakModal onAction={onAction} />);
        expect(screen.getByText('Focus session complete')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Start 5m Stretch'));
        expect(onAction).toHaveBeenCalled();
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onAction).toHaveBeenCalledTimes(2);
    });

    it('updates the CTA when a different break option is chosen', () => {
        render(<BreakModal onAction={vi.fn()} />);
        fireEvent.click(screen.getByText('Hydrate'));
        expect(screen.getByText('Start Hydrate')).toBeInTheDocument();
    });

    it('falls back to a generic label for unknown selections', () => {
        expect(getSelectedBreakLabel('missing-id')).toBe('Break');
    });
});
