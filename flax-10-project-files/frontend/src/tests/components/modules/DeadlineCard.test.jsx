/*
 * Tests for DeadlineCard component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DeadlineCard from '../../../components/modules/deadlines/DeadlineCard';

vi.mock('../../../components/modules/utils/deadlineUtils', () => ({
    getDeadlineCountdown: vi.fn(() => '5 days remaining'),
    DEADLINE_LABELS: { exam: 'Exam', coursework: 'Coursework', quiz: 'Quiz', presentation: 'Presentation' },
}));

vi.mock('../../../components/modules/utils/moduleUtils', () => ({
    formatFullDateTime: vi.fn(() => 'Friday, 6 March 2026, 10:00'),
}));

vi.mock('../../../components/modules/deadlines/DeadlineCard.module.css', () => ({ default: { card: 'card', past: 'past' } }));

import { getDeadlineCountdown } from '../../../components/modules/utils/deadlineUtils';

const deadline = {
    id: 1, title: 'Small Group Project', deadline_type: 'coursework',
    start_due_date: '2026-03-06T10:00:00', location: null, description: null,
};

function renderCard(props) {
    return render(
        <MemoryRouter>
            <DeadlineCard {...props} />
        </MemoryRouter>,
    );
}

describe('DeadlineCard', () => {
    it('should render the title and type of deadline', () => {
        renderCard({ deadline, is_teacher: false, onEdit: vi.fn(), onDelete: vi.fn() });
        expect(screen.getByText('Small Group Project')).toBeInTheDocument();
        expect(screen.getByText('Coursework')).toBeInTheDocument();
    });

    it('should correctly render the deadline countdown', () => {
        renderCard({ deadline, is_teacher: false, onEdit: vi.fn(), onDelete: vi.fn() });
        expect(screen.getByText('5 days remaining')).toBeInTheDocument();
    });

    it('should correctly render edit and delete buttons', () => {
        renderCard({ deadline, is_teacher: true, onEdit: vi.fn(), onDelete: vi.fn() });
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render the card without certain actions for students', () => {
        renderCard({ deadline, is_teacher: false, onEdit: vi.fn(), onDelete: vi.fn() });
        expect(screen.queryByText('Edit')).not.toBeInTheDocument(); //since user is a student, should not be able to edit
    });

    it('should call onEdit when edit button is clicked', () => {
        const onEdit = vi.fn();
        renderCard({ deadline, is_teacher: true, onEdit, onDelete: vi.fn() });
        fireEvent.click(screen.getByText('Edit'));
        expect(onEdit).toHaveBeenCalled();
    });

    it('should call onDelete when delete is clicked', () => {
        const onDelete = vi.fn();
        renderCard({ deadline, is_teacher: true, onEdit: vi.fn(), onDelete });
        fireEvent.click(screen.getByText('Delete'));
        fireEvent.click(screen.getAllByText('Delete')[1]);
        expect(onDelete).toHaveBeenCalled();
    });

    it('closes the delete confirmation without deleting when cancel is clicked', () => {
        const onDelete = vi.fn();
        renderCard({ deadline, is_teacher: true, onEdit: vi.fn(), onDelete });

        fireEvent.click(screen.getByText('Delete'));
        fireEvent.click(screen.getByText('Cancel'));

        expect(onDelete).not.toHaveBeenCalled();
        expect(screen.queryByText(`Are you sure you want to delete "${deadline.title}"? This action cannot be undone.`)).not.toBeInTheDocument();
    });

    it('should render the location if it has been filled in', () => {
        renderCard({ deadline: { ...deadline, location: 'Bush House, 2.01' }, is_teacher: false, onEdit: vi.fn(), onDelete: vi.fn() });
        expect(screen.getByText(/Bush House, 2.01/)).toBeInTheDocument();
    });

    it('should render the description if it has been filled in', () => {
        renderCard({ deadline: { ...deadline, description: 'Submit via KEATS' }, is_teacher: false, onEdit: vi.fn(), onDelete: vi.fn() });
        expect(screen.getByText(/Submit via KEATS/)).toBeInTheDocument();
    });

    it('applies past class when countdown is Past due', () => {
        getDeadlineCountdown.mockReturnValueOnce('Past due');
        const { container } = renderCard({ deadline, is_teacher: false, onEdit: vi.fn(), onDelete: vi.fn() });
        expect(container.querySelector('.past')).toBeInTheDocument();
    });
});
