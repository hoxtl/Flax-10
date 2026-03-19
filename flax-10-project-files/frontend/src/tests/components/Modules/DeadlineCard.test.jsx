import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeadlineCard from '../../../components/Modules/Deadlines/DeadlineCard';

vi.mock('../../../components/Modules/utils/deadlineUtils', () => ({
    getDeadlineCountdown: vi.fn(() => '5 days remaining'),
    DEADLINE_LABELS: { exam: 'Exam', coursework: 'Coursework', quiz: 'Quiz', presentation: 'Presentation' },
}));

vi.mock('../../../components/Modules/utils/moduleUtils', () => ({
    formatFullDateTime: vi.fn(() => 'Friday, 6 March 2026, 10:00'),
}));

vi.mock('../../../components/Modules/Deadlines/DeadlineCard.module.css', () => ({ default: { card: 'card', past: 'past' } }));

import { getDeadlineCountdown } from '../../../components/Modules/utils/deadlineUtils';

const deadline = {
    id: 1, title: 'Small Group Project', deadline_type: 'coursework',
    start_due_date: '2026-03-06T10:00:00', location: null, description: null,
};

describe('DeadlineCard', () => {
    it('should render the title and type of deadline', () => {
        render(<DeadlineCard deadline={deadline} is_teacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('Small Group Project')).toBeInTheDocument();
        expect(screen.getByText('Coursework')).toBeInTheDocument();
    });

    it('should correctly render the deadline countdown', () => {
        render(<DeadlineCard deadline={deadline} is_teacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('5 days remaining')).toBeInTheDocument();
    });

    it('should correctly render edit and delete buttons', () => {
        render(<DeadlineCard deadline={deadline} is_teacher={true} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('Edit')).toBeInTheDocument();
        expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render the card without certain actions for students', () => {
        render(<DeadlineCard deadline={deadline} is_teacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.queryByText('Edit')).not.toBeInTheDocument(); //since user is a student, should not be able to edit
    });

    it('should call onEdit when edit button is clicked', () => {
        const onEdit = vi.fn();
        render(<DeadlineCard deadline={deadline} is_teacher={true} onEdit={onEdit} onDelete={vi.fn()} />);
        fireEvent.click(screen.getByText('Edit'));
        expect(onEdit).toHaveBeenCalled();
    });

    it('should call onDelete when delete is clicked', () => {
        const onDelete = vi.fn();
        render(<DeadlineCard deadline={deadline} is_teacher={true} onEdit={vi.fn()} onDelete={onDelete} />);
        fireEvent.click(screen.getByText('Delete'));
        expect(onDelete).toHaveBeenCalled();
    });

    it('should render the location if it has been filled in', () => {
        render(<DeadlineCard deadline={{ ...deadline, location: 'Bush House, 2.01' }} is_teacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText(/Bush House, 2.01/)).toBeInTheDocument();
    });

    it('should render the description if it has been filled in', () => {
        render(<DeadlineCard deadline={{ ...deadline, description: 'Submit via KEATS' }} is_teacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText(/Submit via KEATS/)).toBeInTheDocument();
    });

    it('applies past class when countdown is Past due', () => {
        getDeadlineCountdown.mockReturnValueOnce('Past due');
        const { container } = render(<DeadlineCard deadline={deadline} is_teacher={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(container.querySelector('.past')).toBeInTheDocument();
    });
});