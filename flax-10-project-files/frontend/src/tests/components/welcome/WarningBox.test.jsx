import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
}));

import WarningBox from '../../../components/Onboarding/WarningBox';

describe('WarningBox', () => {
    it('renders warning message with major name', () => {
        render(<WarningBox major="Computer Science" confirmed={false} onConfirm={vi.fn()} />);
        expect(screen.getByText('Computer Science')).toBeTruthy();
        expect(screen.getByText(/Just so you know/)).toBeTruthy();
    });

    it('renders "Yes, this is my course" checkbox', () => {
        render(<WarningBox major="Physics" confirmed={false} onConfirm={vi.fn()} />);
        expect(screen.getByText(/Yes, this is my course/)).toBeTruthy();
    });

    it('checkbox reflects confirmed state', () => {
        render(<WarningBox major="Math" confirmed={true} onConfirm={vi.fn()} />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox.checked).toBe(true);
    });

    it('checkbox unchecked when confirmed is false', () => {
        render(<WarningBox major="Math" confirmed={false} onConfirm={vi.fn()} />);
        expect(screen.getByRole('checkbox').checked).toBe(false);
    });

    it('calls onConfirm when checkbox clicked', () => {
        const onConfirm = vi.fn();
        render(<WarningBox major="Math" confirmed={false} onConfirm={onConfirm} />);
        fireEvent.click(screen.getByRole('checkbox'));
        expect(onConfirm).toHaveBeenCalledWith(true);
    });
});
