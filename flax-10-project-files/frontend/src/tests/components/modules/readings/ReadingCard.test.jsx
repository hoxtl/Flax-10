/*
 * Tests for ReadingCard component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingCard from '@/components/modules/readings/ReadingCard';
import { readingFixture } from './readingTestUtils';

vi.mock('@/components/calendar/utils/dateUtils', () => ({
    formatDate: vi.fn(() => '13 Apr 2026'),
}));

vi.mock('@/components/modules/shared/moduleCardActions', () => ({
    ModuleItemCardActions: ({ onEdit, onDelete }) => (
        <div>
            <button onClick={onEdit}>Edit reading</button>
            <button onClick={onDelete}>Delete reading</button>
        </div>
    ),
    ModuleItemDeleteDialog: ({ itemTitle, onConfirm, onCancel }) => (
        <div>
            <span>Delete {itemTitle}</span>
            <button onClick={onConfirm}>Confirm delete</button>
            <button onClick={onCancel}>Cancel delete</button>
        </div>
    ),
}));

const renderCard = (overrides = {}) => {
    const props = {
        reading: { ...readingFixture, ...overrides.reading },
        isTeacher: overrides.isTeacher ?? true,
        onEdit: overrides.onEdit ?? vi.fn(),
        onDelete: overrides.onDelete ?? vi.fn(),
    };
    return render(<ReadingCard {...props} />);
};

describe('ReadingCard', () => {
    it('renders the reading metadata and due date', () => {
        renderCard({ isTeacher: false });
        expect(screen.getByText('Module Handbook')).toBeVisible();
        expect(screen.getByText('Ch.1')).toBeVisible();
        expect(screen.getByText(/pp 10-30/)).toBeVisible();
        expect(screen.getByText(/35 mins/)).toBeVisible();
        expect(screen.getByText('Due 13 Apr 2026')).toBeVisible();
    });

    it('omits the chapter label when the value is empty', () => {
        renderCard({ isTeacher: false, reading: { chapter: '' } });
        expect(screen.queryByText('Ch.1')).not.toBeInTheDocument();
    });

    it('shows teacher controls only for teachers', () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        const { rerender } = render(<ReadingCard reading={readingFixture} isTeacher onEdit={onEdit} onDelete={onDelete} />);
        expect(screen.getByText('Edit reading')).toBeVisible();
        rerender(<ReadingCard reading={readingFixture} isTeacher={false} onEdit={onEdit} onDelete={onDelete} />);
        expect(screen.queryByText('Edit reading')).toBeNull();
    });

    it('forwards edit clicks to the provided handler', () => {
        const onEdit = vi.fn();
        renderCard({ onEdit });
        fireEvent.click(screen.getByText('Edit reading'));
        expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('confirms deletions and invokes onDelete', () => {
        const onDelete = vi.fn();
        renderCard({ onDelete });
        fireEvent.click(screen.getByText('Delete reading'));
        fireEvent.click(screen.getByText('Confirm delete'));
        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(screen.queryByText(/Delete Module Handbook/)).toBeNull();
    });

    it('allows canceling the delete confirmation dialog', () => {
        renderCard();
        fireEvent.click(screen.getByText('Delete reading'));
        fireEvent.click(screen.getByText('Cancel delete'));
        expect(screen.queryByText(/Delete Module Handbook/)).toBeNull();
    });
});
