import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaveTimerModal, EndEarlyModal } from '../../../components/Timer/TimerPopups';

describe('LeaveTimerModal', () => {
    it('renders title and message', () => {
        render(<LeaveTimerModal onCancel={vi.fn()} onPause={vi.fn()} onExit={vi.fn()} />);
        expect(screen.getByText('Leave focus time?')).toBeInTheDocument();
        expect(screen.getByText('Your timer is still running.')).toBeInTheDocument();
    });

    it('calls onPause when Pause Timer clicked', () => {
        const onPause = vi.fn();
        render(<LeaveTimerModal onCancel={vi.fn()} onPause={onPause} onExit={vi.fn()} />);
        fireEvent.click(screen.getByText('Pause Timer'));
        expect(onPause).toHaveBeenCalled();
    });

    it('calls onExit when Exit clicked', () => {
        const onExit = vi.fn();
        render(<LeaveTimerModal onCancel={vi.fn()} onPause={vi.fn()} onExit={onExit} />);
        fireEvent.click(screen.getByText('Exit'));
        expect(onExit).toHaveBeenCalled();
    });

    it('calls onCancel when Cancel clicked', () => {
        const onCancel = vi.fn();
        render(<LeaveTimerModal onCancel={onCancel} onPause={vi.fn()} onExit={vi.fn()} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
    });
});

describe('EndEarlyModal', () => {
    it('renders title and message', () => {
        render(<EndEarlyModal onConfirm={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('End Session Early?')).toBeInTheDocument();
        expect(screen.getByText(/won't count as a completed session/)).toBeInTheDocument();
    });

    it('calls onConfirm when End Session clicked', () => {
        const onConfirm = vi.fn();
        render(<EndEarlyModal onConfirm={onConfirm} onCancel={vi.fn()} />);
        fireEvent.click(screen.getByText('End Session'));
        expect(onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when Cancel clicked', () => {
        const onCancel = vi.fn();
        render(<EndEarlyModal onConfirm={vi.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalled();
    });
});
