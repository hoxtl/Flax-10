import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreakModal } from '../../../components/Timer/TimerPopups';

const testRender = () => {
    const onAction = vi.fn();
    render(<BreakModal onAction={onAction} />);
    expect(screen.getByText('Time for a break')).toBeInTheDocument();
    expect(screen.getByText('Start Break')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Start Break'));
    expect(onAction).toHaveBeenCalled();
};

describe('BreakModal', () => {
    it('renders correctly and handles action', testRender);
});
