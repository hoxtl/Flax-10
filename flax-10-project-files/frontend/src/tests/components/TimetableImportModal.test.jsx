import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import TimetableImportModal from '../../components/TimetableImportModal';

vi.mock('../../components/TimetableImportModal.module.css', () => ({
    default: { overlay: 'overlay', modal: 'modal', header: 'header', closeBtn: 'closeBtn',
               form: 'form', instructions: 'instructions', input: 'input', error: 'error',
               actions: 'actions', cancelBtn: 'cancelBtn', importBtn: 'importBtn' }
}));

const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImport: vi.fn(),
};

const getForm = (container) => container.querySelector('form');
const getUrlInput = () => screen.getByPlaceholderText(/timetable.ics/i);

const setUrl = async (value) => {
    await act(async () => {
        fireEvent.change(getUrlInput(), { target: { value } });
    });
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
        fireEvent.click(screen.getByText('✕'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('closes when overlay background clicked', () => {
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        fireEvent.click(container.querySelector('.overlay'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('does not close when modal content clicked', () => {
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        fireEvent.click(container.querySelector('.modal'));
        expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('shows error when submitting empty URL', async () => {
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        await act(async () => { fireEvent.submit(getForm(container)); });
        await waitFor(() => expect(screen.getByText('Please enter a URL')).toBeTruthy());
    });

    it('calls onImport and onClose on successful submit', async () => {
        defaultProps.onImport.mockResolvedValue(undefined);
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        await setUrl('https://example.com/timetable.ics');
        await act(async () => { fireEvent.submit(getForm(container)); });
        await waitFor(() => expect(defaultProps.onClose).toHaveBeenCalled());
        expect(defaultProps.onImport).toHaveBeenCalledWith('https://example.com/timetable.ics');
    });

    it('shows loading state during import', async () => {
        let resolveImport;
        defaultProps.onImport.mockImplementation(() => new Promise(resolve => { resolveImport = resolve; }));
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        await setUrl('https://example.com/timetable.ics');
        act(() => { fireEvent.submit(getForm(container)); });
        await waitFor(() => expect(screen.getByText('Importing...')).toBeTruthy());
        await act(async () => { resolveImport(); });
    });

    it('shows error message when onImport throws', async () => {
        defaultProps.onImport.mockRejectedValue(new Error('Bad URL'));
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        await setUrl('https://bad.com/file.ics');
        await act(async () => { fireEvent.submit(getForm(container)); });
        await waitFor(() => expect(screen.getByText('Bad URL')).toBeTruthy());
    });

    it('shows fallback error when thrown error has no message', async () => {
        defaultProps.onImport.mockRejectedValue({});
        const { container } = render(<TimetableImportModal {...defaultProps} />);
        await setUrl('https://bad.com/file.ics');
        await act(async () => { fireEvent.submit(getForm(container)); });
        await waitFor(() => expect(screen.getByText('Import failed')).toBeTruthy());
    });

    it('closes when cancel button clicked', () => {
        render(<TimetableImportModal {...defaultProps} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(defaultProps.onClose).toHaveBeenCalled();
    });
});
