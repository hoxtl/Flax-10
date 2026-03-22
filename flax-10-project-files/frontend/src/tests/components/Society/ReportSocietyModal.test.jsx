import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportSocietyModal from '../../../components/Society/SocietyDetail/ReportSocietyModal';
import * as societyApi from '../../../api/social/societyApi';

vi.mock('../../../api/social/societyApi', () => ({
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
        expect(screen.getByText('Report "Test Society"')).toBeTruthy();
        expect(screen.getByPlaceholderText('Reason...')).toBeTruthy();
    });

    it('calls onClose when Cancel is clicked', () => {
        render(<ReportSocietyModal society={society} onClose={onClose} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(onClose).toHaveBeenCalled();
    });

    it('submit button is disabled when reason is empty', () => {
        render(<ReportSocietyModal society={society} onClose={onClose} />);
        expect(screen.getByText('Submit Report').closest('button')).toBeDisabled();
    });

    it('calls reportSociety and onReportSuccess on success', async () => {
        vi.mocked(societyApi.reportSociety).mockResolvedValue({});
        render(<ReportSocietyModal society={society} onClose={onClose} onReportSuccess={onReportSuccess} />);
        fireEvent.change(screen.getByPlaceholderText('Reason...'), { target: { value: 'Spam' } });
        fireEvent.click(screen.getByText('Submit Report'));
        await waitFor(() => expect(societyApi.reportSociety).toHaveBeenCalledWith(1, 'Spam'));
        expect(onReportSuccess).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });

    it('shows error message when reportSociety rejects', async () => {
        vi.mocked(societyApi.reportSociety).mockRejectedValue(new Error('fail'));
        render(<ReportSocietyModal society={society} onClose={onClose} />);
        fireEvent.change(screen.getByPlaceholderText('Reason...'), { target: { value: 'Spam' } });
        fireEvent.click(screen.getByText('Submit Report'));
        expect(await screen.findByText('Failed to submit report.')).toBeTruthy();
    });
});
