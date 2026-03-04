import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerControls } from '../../../components/Timer/TimerComponents';

const testButtons = () => {
    const onToggle = vi.fn();
    const onReset = vi.fn();
    render(<TimerControls isActive={false} onToggle={onToggle} onReset={onReset} timeLeft={60} task="Focus" />);
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(onToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
    expect(onReset).toHaveBeenCalled();
};

const testPause = () => {
    render(<TimerControls isActive={true} onToggle={() => { }} onReset={() => { }} />);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
};

describe('TimerControls', () => {
    it('renders correct buttons', testButtons);
    it('shows Pause when active', testPause);
});
