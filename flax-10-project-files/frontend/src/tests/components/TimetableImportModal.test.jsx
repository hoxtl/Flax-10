import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimetableImportModal from '../../components/TimetableImportModal';

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
};

describe('TimetableImportModal', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders nothing when isOpen is false', () => {
        const { container } = render(<TimetableImportModal {...defaultProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('renders modal when isOpen is true', () => {
        render(<TimetableImportModal {...defaultProps} />);
        expect(screen.getByText('Import Timetable')).toBeTruthy();
    });

    it('closes when close button clicked', () => {
        render(<TimetableImportModal {...defaultProps} />);
        fireEvent.click(screen.getByText('×'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('closes when overlay background clicked', () => {
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        fireEvent.mouseDown(container.firstChild);
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('does not close when modal content clicked', () => {
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        fireEvent.mouseDown(container.firstChild.firstChild);
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('shows error when submitting empty URL', async () => {
        render(<TimetableImportModal {...defaultProps} />);
        fireEvent.submit(document.querySelector('form'));
        await waitFor(() => {
            expect(screen.getByText('Please enter a URL')).toBeTruthy();
        });
    });

    it('calls onImport and onClose on successful submit', async () => {
        defaultProps.onImport.mockResolvedValue(undefined);
        render(<TimetableImportModal {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText(/timetable.ics/i), {
            target: { value: 'https://example.com/timetable.ics' },
        });
        fireEvent.submit(document.querySelector('form'));
        await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalled());
        expect(defaultProps.onImport).toHaveBeenCalledWith('https://example.com/timetable.ics');
    });

    it('shows error message when onImport throws', async () => {
        defaultProps.onImport.mockRejectedValue(new Error('Bad URL'));
        render(<TimetableImportModal {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText(/timetable.ics/i), {
            target: { value: 'https://bad.com/file.ics' },
        });
        fireEvent.submit(document.querySelector('form'));
        await waitFor(() => expect(screen.getByText('Bad URL')).toBeTruthy());
    });

    it('shows Import failed when onImport throws without message', async () => {
        defaultProps.onImport.mockRejectedValue({});
        render(<TimetableImportModal {...defaultProps} />);
        fireEvent.change(screen.getByPlaceholderText(/timetable.ics/i), {
            target: { value: 'https://example.com/file.ics' },
        });
        fireEvent.submit(document.querySelector('form'));
        await waitFor(() => expect(screen.getByText('Import failed')).toBeTruthy());
    });

    it('closes when cancel button clicked', () => {
        render(<TimetableImportModal {...defaultProps} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
