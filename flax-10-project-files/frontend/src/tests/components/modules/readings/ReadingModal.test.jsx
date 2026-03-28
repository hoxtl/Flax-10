/*
 * Tests for ReadingModal component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingModal from '@/components/modules/readings/ReadingModal';
import { useReadingModal } from '@/components/modules/hooks/useReadingModal';
import { moduleFixture, readingFixture } from './readingTestUtils';

vi.mock('@/components/modules/hooks/useReadingModal', () => ({
    useReadingModal: vi.fn(),
}));

vi.mock('@/components/modules/readings/ReadingForm', () => ({
    default: ({ initial, onCancel}) => (
        <div>
            <span>ReadingForm {initial?.title || ''}</span>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));

vi.mock('@/components/modules/readings/ReadingCard', () => ({
    default: ({ reading, onEdit, onDelete }) => (
        <div>
            <span>{reading.title}</span>
            <button onClick={onEdit}>Edit {reading.title}</button>
            <button onClick={onDelete}>Delete {reading.title}</button>
        </div>
    ),
}));

vi.mock('@/components/common/standard_modal/StandardModal', () => ({
    default: ({title, children, onClose}) => (
        <div> 
            <span>{title}</span>
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));

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
        render(<ReadingModal module={moduleFixture} onClose={vi.fn()} />);
        expect(screen.getByText(/5CCS2SEG/)).toBeInTheDocument();
    });

    it('should render empty message when there are no readings', () => {
        mockModal({ readings: []});
        render(<ReadingModal module={moduleFixture} onClose={vi.fn()} />);
        expect(screen.getByText('No readings yet.')).toBeInTheDocument();
    });

    it('should show add reading button', () => {
        mockModal();
        render(<ReadingModal module={moduleFixture} onClose={vi.fn()} />);
        expect(screen.getByText('+ Add Reading')).toBeInTheDocument();
    });

    it('should call openCreate when add reading is clicked', () => {
        const openCreate = vi.fn();
        mockModal({openCreate})
        render(<ReadingModal module={moduleFixture} onClose={vi.fn()} />);
        fireEvent.click(screen.getByText('+ Add Reading'));
        expect(openCreate).toHaveBeenCalled();
    });
    
    it('show ReadingForm when showForm is true', () => {
        mockModal({showForm: true, editing: readingFixture});
        render(<ReadingModal module={moduleFixture} onClose={vi.fn()} />);
        expect(screen.getByText(/ReadingForm Module Handbook/)).toBeInTheDocument();
    });

    it('should render reading list when readings exist', () => {
        mockModal({readings : [ readingFixture ]});
        render(<ReadingModal module={moduleFixture} onClose={vi.fn()} />);
        expect(screen.getByText('Module Handbook')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', () => {
        const onClose = vi.fn();
        mockModal();
        render(<ReadingModal module={moduleFixture} onClose={onClose} />);
        fireEvent.click(screen.getByText('Close'));
        expect(onClose).toHaveBeenCalled();
    });

    it('routes ReadingCard edit callbacks through modal openEdit', () => {
        const openEdit = vi.fn();
        mockModal({ readings: [readingFixture], openEdit });
        render(<ReadingModal module={moduleFixture} onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /Edit Module Handbook/ }));
        expect(openEdit).toHaveBeenCalledWith(readingFixture);
    });

    it('routes ReadingCard delete callbacks through modal handleDelete', () => {
        const handleDelete = vi.fn();
        mockModal({ readings: [readingFixture], handleDelete });
        render(<ReadingModal module={moduleFixture} onClose={vi.fn()} />);
        fireEvent.click(screen.getByRole('button', { name: /Delete Module Handbook/ }));
        expect(handleDelete).toHaveBeenCalledWith(readingFixture.id);
    });
});
