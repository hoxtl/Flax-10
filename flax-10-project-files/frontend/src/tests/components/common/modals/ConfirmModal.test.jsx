import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../../../../components/common/confirm_modal/ConfirmModal';

const defaultProps = {
    title: 'Delete item',
    message: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
};

describe('ConfirmModal', () => {
    it('renders title and message', () => {
        render(<ConfirmModal {...defaultProps} />);
        expect(screen.getByText('Delete item')).toBeTruthy();
        expect(screen.getByText('Are you sure?')).toBeTruthy();
    });

    it('renders default button text', () => {
        render(<ConfirmModal {...defaultProps} />);
        expect(screen.getByText('Confirm')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('renders custom button text', () => {
        render(<ConfirmModal {...defaultProps} confirmText="Delete" cancelText="Go back" />);
        expect(screen.getByText('Delete')).toBeTruthy();
        expect(screen.getByText('Go back')).toBeTruthy();
    });

    it('calls onConfirm when confirm button is clicked', () => {
        const onConfirm = vi.fn();
        render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);
        fireEvent.click(screen.getByText('Confirm'));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', () => {
        const onCancel = vi.fn();
        render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when backdrop is clicked', () => {
        const onCancel = vi.fn();
        render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
        const backdrop = document.body.querySelector('div[class*="_backdrop"]');
        expect(backdrop).toBeTruthy();
        fireEvent.mouseDown(backdrop);
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('does not propagate mouseDown from modal inner content', () => {
        const onCancel = vi.fn();
        render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);
        fireEvent.mouseDown(screen.getByText('Are you sure?'));
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('renders alternate button when alternateText is provided', () => {
        const onAlternate = vi.fn();
        render(<ConfirmModal {...defaultProps} alternateText="Maybe" onAlternate={onAlternate} />);
        expect(screen.getByText('Maybe')).toBeTruthy();
        fireEvent.click(screen.getByText('Maybe'));
        expect(onAlternate).toHaveBeenCalledTimes(1);
    });

    it('does not render alternate button when alternateText is not provided', () => {
        render(<ConfirmModal {...defaultProps} />);
        expect(screen.queryByRole('button', { name: /maybe/i })).toBeNull();
    });

    it('applies danger variant when isDanger is true', () => {
        render(<ConfirmModal {...defaultProps} isDanger={true} confirmText="Delete" />);
        const confirmBtn = screen.getByText('Delete');
        expect(confirmBtn.className).toContain('danger');
    });

    it('applies primary variant when isDanger is false', () => {
        render(<ConfirmModal {...defaultProps} isDanger={false} confirmText="OK" />);
        const confirmBtn = screen.getByText('OK');
        expect(confirmBtn.className).toContain('primary');
    });

    it('renders centered buttons plus the correct danger and info hints', () => {
        const { rerender } = render(
            <ConfirmModal
                {...defaultProps}
                isDanger
                centerText
                dangerHint="This action cannot be undone."
            />
        );

        expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
        expect(screen.queryByText('Helpful hint')).toBeNull();

        rerender(
            <ConfirmModal
                {...defaultProps}
                infoHint="Helpful hint"
            />
        );

        expect(screen.getByText('Helpful hint')).toBeInTheDocument();
        expect(screen.queryByText('This action cannot be undone.')).toBeNull();
    });
});
