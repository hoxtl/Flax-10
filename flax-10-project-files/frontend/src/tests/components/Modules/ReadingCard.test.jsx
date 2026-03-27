/*
 * Tests for ReadingCard component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReadingCard from '../../../components/modules/Readings/ReadingCard';

vi.mock('../../../components/calendar/utils/dateUtils', () => ({
    formatDate: vi.fn(() => '13 Apr 2026'),
}));

vi.mock('../../../components/modules/Deadlines/DeadlineCard.module.css', () => ({ default: { } }));

const reading = {
    id: 1, title: 'Module Handbook', chapter: 'Ch.1',
    start_page: 13, end_page: 63, page_count: 50,
    duration_minutes: 60, deadline: '2026-04-13T00:00:00',
};

describe('ReadingCard', () => {
    it('should render title', () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} />);
        expect(screen.getByText('Module Handbook')).toBeInTheDocument();
    });

    it('should render chapter if available', () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('Ch.1')).toBeInTheDocument();
    });

    it('should render page range', () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText(/pp 13-63/)).toBeInTheDocument();
    });

    it('should render estimated minutes', () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} onDelete={vi.fn()}  />);
        expect(screen.getByText(/60 mins/)).toBeInTheDocument();
    });

    it('should display edit and delete buttons for teacher', async () => {
        render(<ReadingCard reading={reading} isTeacher={true} onEdit={vi.fn()} onDelete={vi.fn()}  />);
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should not display edit and delete buttons for teacher', async () => {
        render(<ReadingCard reading={reading} isTeacher={false} onEdit={vi.fn()} onDelete={vi.fn()}  />);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
        expect(screen.queryByText('Delete')).not.toBeInTheDocument();
    });

    it('should call onEdit when edit is clicked', () => {
        const onEdit = vi.fn();
        render(<ReadingCard reading={reading} isTeacher={true} onEdit={onEdit} onDelete={vi.fn()}  />);
        fireEvent.click(screen.getByText('Edit'));
        expect(onEdit).toHaveBeenCalled();
    });

    it('calls onDelete when delete button is clicked', () => {
        const onDelete = vi.fn();
        render(<ReadingCard reading={reading} isTeacher={true} onEdit={vi.fn()} onDelete={onDelete}  />);
        fireEvent.click(screen.getByText('Delete'));
        fireEvent.click(screen.getAllByText('Delete')[1]);
        expect(onDelete).toHaveBeenCalled();
    });
});
