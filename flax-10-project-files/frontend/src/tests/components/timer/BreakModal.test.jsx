import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreakModal } from '../../../components/Timer/TimerPopups';

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
});
