import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
<<<<<<< HEAD
import { ModeIndicator } from '../../../components/timer/components/TimerComponents';
=======
import { ModeIndicator } from '../../../components/timer/TimerComponents';
>>>>>>> main

const testModes = () => {
    const { rerender } = render(<ModeIndicator mode="work" isOvertime={false} />);
    expect(screen.getByText('Focus')).toBeInTheDocument();
    rerender(<ModeIndicator mode="break" isOvertime={false} />);
    expect(screen.getByText('Break')).toBeInTheDocument();
    rerender(<ModeIndicator mode="break" isOvertime={false} isBreakOvertime={true} />);
    expect(screen.getByText('Break Overtime')).toBeInTheDocument();
};

describe('ModeIndicator', () => {
    it('shows correct text for modes', testModes);

    it('shows Overtime for work mode when isOvertime is true', () => {
        render(<ModeIndicator mode="work" isOvertime={true} />);
        expect(screen.getByText('Overtime')).toBeInTheDocument();
    });
});
