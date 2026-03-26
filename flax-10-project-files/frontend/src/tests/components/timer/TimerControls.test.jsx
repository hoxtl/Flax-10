import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimerControls } from '../../../components/Timer/TimerComponents';

const testButtons = () => {
    const onToggle = vi.fn();
    const onReset = vi.fn();
    const onEndEarly = vi.fn();

    // Test inactive state
    const { rerender } = render(<TimerControls isActive={false} isPaused={false} onToggle={onToggle} onReset={onReset} onEndEarly={onEndEarly} />);
    fireEvent.click(screen.getByText('Start'));
    expect(onToggle).toHaveBeenCalled();
    expect(screen.queryByText('Reset')).not.toBeInTheDocument();
    expect(screen.queryByText('End Early')).not.toBeInTheDocument();

    // Test active state
    rerender(<TimerControls isActive={true} isPaused={false} onToggle={onToggle} onReset={onReset} onEndEarly={onEndEarly} />);
    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalled();
    fireEvent.click(screen.getByText('End Early'));
    expect(onEndEarly).toHaveBeenCalled();
};

const testPause = () => {
    render(<TimerControls isActive={true} onToggle={() => { }} onReset={() => { }} />);
    expect(screen.getByText('Pause')).toBeInTheDocument();
};

const testResume = () => {
    const onPause = vi.fn();
    render(<TimerControls isActive={true} isPaused={true} onToggle={() => { }} onPause={onPause} onReset={() => { }} onEndEarly={() => { }} />);
    expect(screen.getByText('Resume')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Resume'));
    expect(onPause).toHaveBeenCalled();
};

const testPauseIndicator = () => {
    render(<TimerControls isActive={true} isPaused={true} totalPaused={90} onToggle={() => { }} onPause={() => { }} onReset={() => { }} onEndEarly={() => { }} />);
    expect(screen.getByText(/Paused:/)).toBeInTheDocument();
    expect(screen.getByText(/01:30/)).toBeInTheDocument();
};

describe('TimerControls', () => {
    it('renders correct buttons', testButtons);
    it('shows Pause when active', testPause);
    it('shows Resume when active and paused', testResume);
    it('shows PauseIndicator when paused with totalPaused > 0', testPauseIndicator);
});
