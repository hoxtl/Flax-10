import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportSocietyModal from '../../../components/Society/SocietyDetail/ReportSocietyModal';
import * as societyApi from '../../../api/societyApi';

vi.mock('../../../api/societyApi', () => ({
    reportSociety: vi.fn(),
}));

vi.mock('../../../components/Society/SocietyDetail/ReportSocietyModal.module.css', () => ({
    default: { container: 'container', textarea: 'textarea', error: 'error', actions: 'actions', cancelButton: 'cancelButton', submitButton: 'submitButton' },
}));

describe('ReportSocietyModal', () => {
    const society = { id: 1, name: 'Test Society' };
    let onClose, onReportSuccess;

    beforeEach(() => {
        onClose = vi.fn();
        onReportSuccess = vi.fn();
        vi.mocked(societyApi.reportSociety).mockReset();
    });

    it('renders modal with title and textarea', () => {
        render(<ReportSocietyModal society={society} onClose={onClose} />);
        expect(screen.getByText('Report "Test Society"')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter the reason for reporting...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Submit Report' })).toBeInTheDocument();
    });

    it('calls onClose when Cancel is clicked', () => {
        render(<ReportSocietyModal society={society} onClose={onClose} />);
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalled();
    });

    it('submit button is disabled when reason is empty', () => {
        render(<ReportSocietyModal society={society} onClose={onClose} />);
        expect(screen.getByRole('button', { name: 'Submit Report' })).toBeDisabled();
        expect(societyApi.reportSociety).not.toHaveBeenCalled();
    });

    it('shows error when form is submitted with empty reason', () => {
        render(<ReportSocietyModal society={society} onClose={onClose} />);
        const form = screen.getByTestId('report-form');
        fireEvent.submit(form);
        expect(screen.getByText('Please provide a reason to report this society.')).toBeInTheDocument();
        expect(societyApi.reportSociety).not.toHaveBeenCalled();
    });

    it('calls reportSociety, onReportSuccess and onClose on success', async () => {
        vi.mocked(societyApi.reportSociety).mockResolvedValue(undefined);
        render(<ReportSocietyModal society={society} onClose={onClose} onReportSuccess={onReportSuccess} />);
        fireEvent.change(screen.getByPlaceholderText('Enter the reason for reporting...'), { target: { value: 'Spam' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));
        await waitFor(() => {
            expect(societyApi.reportSociety).toHaveBeenCalledWith(1, 'Spam');
        });
        await waitFor(() => {
            expect(onReportSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('shows error message when reportSociety rejects', async () => {
        vi.mocked(societyApi.reportSociety).mockRejectedValue(new Error('Network error'));
        render(<ReportSocietyModal society={society} onClose={onClose} />);
        fireEvent.change(screen.getByPlaceholderText('Enter the reason for reporting...'), { target: { value: 'Spam' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit Report' }));
        await waitFor(() => {
            expect(screen.getByText('Failed to submit the report. Please try again later.')).toBeInTheDocument();
        });
        expect(onClose).not.toHaveBeenCalled();
    });
});
