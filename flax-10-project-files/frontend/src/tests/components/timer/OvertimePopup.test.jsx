import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OvertimePopup, BreakStartedPopup } from '../../../components/timer/popups/OvertimePopup';

const testWorkMode = () => {
    const onAction = vi.fn();
    render(<OvertimePopup mode="work" time={65} onAction={onAction} />);
    expect(screen.getByText("Time's Up!")).toBeInTheDocument();
    expect(screen.getByText("You're in overtime mode.")).toBeInTheDocument();
    expect(screen.getByText("Start Break")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Start Break"));
    expect(onAction).toHaveBeenCalled();
};

const testBreakMode = () => {
    render(<OvertimePopup mode="break" time={120} onAction={() => { }} />);
    expect(screen.getByText("Break Over!")).toBeInTheDocument();
    expect(screen.getByText("Time to get back to work.")).toBeInTheDocument();
    expect(screen.getByText("Start Work")).toBeInTheDocument();
};

describe('OvertimePopup', () => {
    it('renders correctly for work mode', testWorkMode);
    it('renders correctly for break mode', testBreakMode);
    it('shows Finish Goal when work mode and isLastSession', () => {
        const onAction = vi.fn();
        render(<OvertimePopup mode="work" time={65} onAction={onAction} isLastSession={true} />);
        expect(screen.getByText("Finish Goal")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Finish Goal"));
        expect(onAction).toHaveBeenCalled();
    });

    it('dismisses overtime mode when the backdrop is pressed', () => {
        const onAction = vi.fn();
        render(<OvertimePopup mode="break" time={12} onAction={onAction} />);
        const backdrop = screen.getByLabelText('Close').closest('[class*="backdrop"]');
        fireEvent.mouseDown(backdrop);
        expect(onAction).toHaveBeenCalled();
    });

    it('renders the break-started popup actions', () => {
        const onAction = vi.fn();
        render(<BreakStartedPopup time={30} onAction={onAction} />);
        expect(screen.getByText('Break started')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Skip Break'));
        fireEvent.click(screen.getByLabelText('Close'));
        expect(onAction).toHaveBeenCalledTimes(2);
    });
});
