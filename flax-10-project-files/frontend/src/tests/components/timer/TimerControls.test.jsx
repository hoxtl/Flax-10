import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerControls } from '../../../components/Timer/TimerComponents';

const testButtons = () => {
    const onToggle = vi.fn();
    const onReset = vi.fn();
    render(<TimerControls isActive={false} onToggle={onToggle} onReset={onReset} />);
    fireEvent.click(screen.getByText('Start'));
    expect(onToggle).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalled();
};

const testPause = () => {
    render(<TimerControls isActive={true} onToggle={() => { }} onReset={() => { }} />);
    expect(screen.getByText('Pause')).toBeInTheDocument();
};

describe('TimerControls', () => {
    it('renders correct buttons', testButtons);
    it('shows Pause when active', testPause);
});
