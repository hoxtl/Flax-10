import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SleepWarningModal } from '../../components/common/SleepWarningModal';

describe('SleepWarningModal', () => {
    const defaultProps = {
        sleepTime: '23:00',
        wakeTime: '07:00',
        onConfirm: vi.fn(),
        onCancel: vi.fn(),
    };

    it('renders the title', () => {
        render(<SleepWarningModal {...defaultProps} />);
        expect(screen.getByText('You should be resting!')).toBeTruthy();
    });

    it('formats and displays sleep time correctly', () => {
        render(<SleepWarningModal {...defaultProps} sleepTime="23:00" wakeTime="07:00" />);
        expect(screen.getByText('11:00 PM')).toBeTruthy();
        expect(screen.getByText('7:00 AM')).toBeTruthy();
    });

    it('formats noon correctly (12:00)', () => {
        render(<SleepWarningModal {...defaultProps} sleepTime="12:00" wakeTime="00:00" />);
        expect(screen.getByText('12:00 PM')).toBeTruthy();
        expect(screen.getByText('12:00 AM')).toBeTruthy();
    });

    it('renders cancel button', () => {
        render(<SleepWarningModal {...defaultProps} />);
        expect(screen.getByText(/Cancel/)).toBeTruthy();
    });

    it('renders confirm button', () => {
        render(<SleepWarningModal {...defaultProps} />);
        expect(screen.getByText('Add anyway')).toBeTruthy();
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<SleepWarningModal {...defaultProps} onCancel={onCancel} />);
        fireEvent.click(screen.getByText(/Cancel/));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn();
        render(<SleepWarningModal {...defaultProps} onConfirm={onConfirm} />);
        fireEvent.click(screen.getByText('Add anyway'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('handles missing sleepTime gracefully', () => {
        render(<SleepWarningModal {...defaultProps} sleepTime={null} wakeTime="07:00" />);
        expect(screen.getByText('You should be resting!')).toBeTruthy();
    });

    it('renders question text', () => {
        render(<SleepWarningModal {...defaultProps} />);
        expect(screen.getByText(/Are you sure you want to work at this hour\?/i)).toBeTruthy();
    });
});
