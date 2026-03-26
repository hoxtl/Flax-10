/*
 * Tests for ReadingModal component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReadingModal from '../../../components/Modules/Readings/ReadingModal';
import { useReadingModal } from '../../../components/Modules/hooks/useReadingModal';

vi.mock('../../../components/Modules/hooks/useReadingModal', () => ({
    useReadingModal: vi.fn(),
}));

vi.mock('../../../components/Modules/Readings/ReadingForm', () => ({
    default: ({ onCancel}) => (
        <div>
            <span>ReadingForm</span>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));

vi.mock('../../../components/Modules/Readings/ReadingCard', () => ({
    default: ({ reading }) => (
        <div> {reading.title} </div>
    ),
}));

vi.mock('../../../components/common/standard_modal/StandardModal', () => ({
    default: ({title, children, onClose}) => (
        <div> 
            <span>{title}</span>
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));

vi.mock('../../../components/Modules/DeadlineModal.module.css', () => ({ default: {} }));

const module = { id: 1, module_code: '5CCS2SEG', module_name: 'Software Engineering' };

function mockModal(overrides = {}) {
    useReadingModal.mockReturnValue({
        readings: [],
        showForm: false,
        editing: null,
        openCreate: vi.fn(),
        openEdit: vi.fn(), 
        close: vi.fn(),
        handleSubmit: vi.fn(),
        handleDelete: vi.fn(),
        ...overrides,
    });
}

describe('ReadingModal', () => {
    it('renders module code in title', () => {
        mockModal();
        render(<ReadingModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText(/5CCS2SEG/)).toBeInTheDocument();
    });

    it('should render empty message when there are no readings', () => {
        mockModal({ readings: []});
        render(<ReadingModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText('No readings yet.')).toBeInTheDocument();
    });

    it('should show add reading button', () => {
        mockModal();
        render(<ReadingModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText('+ Add Reading')).toBeInTheDocument();
    });

    it('should call openCreate when add reading is clicked', () => {
        const openCreate = vi.fn();
        mockModal({openCreate})
        render(<ReadingModal module={module} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add Reading'));
        expect(openCreate).toHaveBeenCalled();
    });
    
    it('show ReadingForm when showForm is true', () => {
        mockModal({showForm: true});
        render(<ReadingModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText('ReadingForm')).toBeInTheDocument();
    });

    it('should render reading list when readings exist', () => {
        mockModal({readings : [ {id:1, title: 'Module Handbook', start_page: 13, end_page:63, deadline:'2026-04-01'}, ]});
        render(<ReadingModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText('Module Handbook')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
        const onClose = vi.fn();
        mockModal();
        render(<ReadingModal module={module} onClose={onClose} />);
        fireEvent.click(screen.getByText('Close'));
        expect(onClose).toHaveBeenCalled();
    });

    it('should call modal.close when form cancel is clicked', () => {
        const close = vi.fn();
        mockModal({ showForm: true, close });
        render(<ReadingModal module={module} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('Cancel'));
        expect(close).toHaveBeenCalled();
    });

    it('renders multiple readings in the list', () => {
        mockModal({
            readings: [
                { id: 1, title: 'Handbook' },
                { id: 2, title: 'Chapter 5' },
            ],
        });
        render(<ReadingModal module={module} onClose={vi.fn()} />);
        expect(screen.getByText('Handbook')).toBeInTheDocument();
        expect(screen.getByText('Chapter 5')).toBeInTheDocument();
    });
});
