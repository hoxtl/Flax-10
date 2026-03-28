import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaveTimerModal, EndEarlyModal } from '../../../../components/timer/components/TimerPopups';

describe('LeaveTimerModal', () => {
    it('renders title and message', () => {
        render(<LeaveTimerModal onCancel={vi.fn()} onPause={vi.fn()} onExit={vi.fn()} />);
        expect(screen.getByText("Hold on, you're doing great!")).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to end your focus session early?')).toBeInTheDocument();
    });

    it('calls onPause when Pause Timer clicked', () => {
        const onPause = vi.fn();
        render(<LeaveTimerModal onCancel={vi.fn()} onPause={onPause} onExit={vi.fn()} />);
        fireEvent.click(screen.getByText('Take a 5m Break instead'));
        expect(onPause).toHaveBeenCalled();
    });

    it('calls onExit when Exit clicked', () => {
        const onExit = vi.fn();
        render(<LeaveTimerModal onCancel={vi.fn()} onPause={vi.fn()} onExit={onExit} />);
        fireEvent.click(screen.getByText('Yes, end session'));
        expect(onExit).toHaveBeenCalled();
    });

    it('calls onCancel when Cancel clicked', () => {
        const onCancel = vi.fn();
        render(<LeaveTimerModal onCancel={onCancel} onPause={vi.fn()} onExit={vi.fn()} />);
        fireEvent.click(screen.getByText('Keep Focusing'));
        expect(onCancel).toHaveBeenCalled();
    });
});

describe('EndEarlyModal', () => {
    it('renders title and message', () => {
        render(<EndEarlyModal onConfirm={vi.fn()} onCancel={vi.fn()} />);
        expect(screen.getByText('Finish session now?')).toBeInTheDocument();
        expect(screen.getByText(/Session recap/)).toBeInTheDocument();
    });

    it('calls onConfirm when End Session clicked', () => {
        const onConfirm = vi.fn();
        render(<EndEarlyModal onConfirm={onConfirm} onCancel={vi.fn()} />);
        fireEvent.click(screen.getByText("Yes, I'm done for now"));
        expect(onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when Cancel clicked', () => {
        const onCancel = vi.fn();
        render(<EndEarlyModal onConfirm={vi.fn()} onCancel={onCancel} />);
        fireEvent.click(screen.getByText('Keep Going'));
        expect(onCancel).toHaveBeenCalled();
    });
});
