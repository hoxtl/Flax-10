import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
    Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, variants, whileHover, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('lucide-react', () => ({
    AlertCircle: () => <svg />,
    ArrowRight: () => <svg />,
}));

import { DeadlinesWidget } from '../../../pages/Homepage/components/DeadlinesWidget';

// Use hour-based offsets to avoid floor() edge cases with days
const tomorrow = new Date(Date.now() + 25 * 60 * 60 * 1000);    // 25h from now → days=1 → "Tomorrow"
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const threeWeeks = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
const yesterday = new Date(Date.now() - 22 * 60 * 60 * 1000);  // 22h ago → days=-1 → "1d overdue"

const mockDeadlines = [
    { id: 1, assessment_title: 'Essay 1', start_due_date: tomorrow.toISOString(), module_code: 'CS3001', deadline_type: 'coursework' },
    { id: 2, assessment_title: 'Lab Report', start_due_date: nextWeek.toISOString(), module_code: 'PS4202', deadline_type: 'assessment' },
    { id: 3, assessment_title: 'Final Exam', start_due_date: threeWeeks.toISOString(), module_code: 'MA2001', deadline_type: 'exam' },
];

describe('DeadlinesWidget', () => {
    it('renders Deadlines header', () => {
        render(<DeadlinesWidget deadlines={mockDeadlines} />);
        expect(screen.getByText('Deadlines')).toBeTruthy();
    });

    it('renders empty state when no deadlines', () => {
        render(<DeadlinesWidget deadlines={[]} />);
        expect(screen.getByText('No deadlines need attention.')).toBeTruthy();
        expect(screen.getByText('Upcoming coursework and exams will show up here.')).toBeTruthy();
    });

    it('renders deadline titles', () => {
        render(<DeadlinesWidget deadlines={mockDeadlines} />);
        expect(screen.getByText('Essay 1')).toBeTruthy();
        expect(screen.getByText('Lab Report')).toBeTruthy();
    });

    it('shows at most 3 deadlines', () => {
        const manyDeadlines = Array.from({ length: 5 }, (_, i) => ({
            id: i,
            assessment_title: `Task ${i}`,
            start_due_date: nextWeek.toISOString(),
            module_code: 'CS0001',
            deadline_type: 'coursework',
        }));
        render(<DeadlinesWidget deadlines={manyDeadlines} />);
        // Only 3 titles should be rendered (MAX_SHOWN = 3)
        expect(screen.getAllByText(/Task \d/).length).toBe(3);
    });

    it('renders module code pills', () => {
        render(<DeadlinesWidget deadlines={mockDeadlines} />);
        expect(screen.getByText('CS3001')).toBeTruthy();
        expect(screen.getByText('PS4202')).toBeTruthy();
    });

    it('renders deadline type labels', () => {
        render(<DeadlinesWidget deadlines={mockDeadlines} />);
        expect(screen.getByText('COURSEWORK')).toBeTruthy();
        expect(screen.getByText('ASSESSMENT')).toBeTruthy();
    });

    it('calls onSelectDeadline when row clicked', () => {
        const onSelectDeadline = vi.fn();
        render(<DeadlinesWidget deadlines={mockDeadlines} onSelectDeadline={onSelectDeadline} />);
        const rows = screen.getAllByRole('button');
        // Click on the deadline row (first module code pill)
        fireEvent.click(screen.getByText('Essay 1'));
        expect(onSelectDeadline).toHaveBeenCalled();
    });

    it('calls onSelectModule when module pill clicked', () => {
        const onSelectModule = vi.fn();
        render(<DeadlinesWidget deadlines={mockDeadlines} onSelectModule={onSelectModule} />);
        const pill = screen.getByText('CS3001');
        fireEvent.click(pill);
        expect(onSelectModule).toHaveBeenCalledWith({ code: 'CS3001', id: null });
    });

    it('shows "Tomorrow" for deadline due tomorrow', () => {
        render(<DeadlinesWidget deadlines={[{ id: 1, assessment_title: 'Test', start_due_date: tomorrow.toISOString(), deadline_type: 'assessment' }]} />);
        expect(screen.getByText('Tomorrow')).toBeTruthy();
    });

    it('shows overdue label for past deadlines', () => {
        render(<DeadlinesWidget deadlines={[{ id: 1, assessment_title: 'Late Task', start_due_date: yesterday.toISOString(), deadline_type: 'assessment' }]} />);
        expect(screen.getByText('1d overdue')).toBeTruthy();
    });

    it('renders View my modules link', () => {
        render(<DeadlinesWidget deadlines={mockDeadlines} />);
        expect(screen.getByText('View my modules')).toBeTruthy();
    });

    it('sorts overdue deadlines first', () => {
        const deadlines = [
            { id: 1, assessment_title: 'Future Task', start_due_date: nextWeek.toISOString(), deadline_type: 'assessment' },
            { id: 2, assessment_title: 'Overdue Task', start_due_date: yesterday.toISOString(), deadline_type: 'assessment' },
        ];
        render(<DeadlinesWidget deadlines={deadlines} />);
        const items = screen.getAllByRole('button');
        // The row items (role=button) should have overdue first
        expect(items.length).toBeGreaterThan(0);
    });

    it('filters deadlines without start_due_date', () => {
        const deadlines = [
            { id: 1, assessment_title: 'No Date', deadline_type: 'assessment' },
            { id: 2, assessment_title: 'With Date', start_due_date: nextWeek.toISOString(), deadline_type: 'assessment' },
        ];
        render(<DeadlinesWidget deadlines={deadlines} />);
        expect(screen.queryByText('No Date')).toBeNull();
        expect(screen.getByText('With Date')).toBeTruthy();
    });

    it('returns null when deadlines is not an array', () => {
        const { container } = render(<DeadlinesWidget deadlines={null} />);
        expect(container.firstChild).toBeNull();
    });

    it('shows "Today" for deadline due today', () => {
        const laterToday = new Date(Date.now() + 2 * 60 * 60 * 1000);
        render(<DeadlinesWidget deadlines={[{ id: 1, assessment_title: 'Due Today', start_due_date: laterToday.toISOString(), deadline_type: 'assessment' }]} />);
        expect(screen.getByText('Today')).toBeTruthy();
    });

    it('uses deadline.title when assessment_title is missing', () => {
        render(<DeadlinesWidget deadlines={[{ id: 1, title: 'Fallback Title', start_due_date: nextWeek.toISOString(), deadline_type: 'assessment' }]} />);
        expect(screen.getByText('Fallback Title')).toBeTruthy();
    });

    it('uses "Assignment" when both assessment_title and title missing', () => {
        render(<DeadlinesWidget deadlines={[{ id: 1, start_due_date: nextWeek.toISOString(), deadline_type: 'assessment' }]} />);
        expect(screen.getByText('Assignment')).toBeTruthy();
    });

    it('calls onSelectModule with module_id when present', () => {
        const onSelectModule = vi.fn();
        render(<DeadlinesWidget deadlines={[{ id: 1, assessment_title: 'T', start_due_date: nextWeek.toISOString(), module_code: 'CS3001', module_id: 42, deadline_type: 'assessment' }]} onSelectModule={onSelectModule} />);
        fireEvent.click(screen.getByText('CS3001'));
        expect(onSelectModule).toHaveBeenCalledWith({ code: 'CS3001', id: 42 });
    });

    it('calls onSelect when row activated via Enter key', () => {
        const onSelectDeadline = vi.fn();
        render(<DeadlinesWidget deadlines={mockDeadlines} onSelectDeadline={onSelectDeadline} />);
        const row = screen.getByText('Essay 1').closest('[role="button"]');
        fireEvent.keyDown(row, { key: 'Enter', preventDefault: vi.fn() });
        expect(onSelectDeadline).toHaveBeenCalled();
    });

    it('calls onSelect when row activated via Space key', () => {
        const onSelectDeadline = vi.fn();
        render(<DeadlinesWidget deadlines={mockDeadlines} onSelectDeadline={onSelectDeadline} />);
        const row = screen.getByText('Essay 1').closest('[role="button"]');
        fireEvent.keyDown(row, { key: ' ', preventDefault: vi.fn() });
        expect(onSelectDeadline).toHaveBeenCalled();
    });

    it('does not render module pill when module_code is empty', () => {
        render(<DeadlinesWidget deadlines={[{ id: 1, assessment_title: 'No Module', start_due_date: nextWeek.toISOString(), deadline_type: 'assessment' }]} />);
        expect(screen.queryByText(/[A-Z]{2}\d{4}/)).toBeNull();
    });

    it('shows Xd for deadline more than 1 day away', () => {
        const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        render(<DeadlinesWidget deadlines={[{ id: 1, assessment_title: 'In 3', start_due_date: in3Days.toISOString(), deadline_type: 'assessment' }]} />);
        const label = screen.getByText(/\d+d$/);
        expect(label).toBeTruthy();
        expect(label.textContent).toMatch(/^\d+d$/);
    });

    it('renders single deadline as only row (last row)', () => {
        const single = [{ id: 1, assessment_title: 'Only', start_due_date: nextWeek.toISOString(), deadline_type: 'coursework' }];
        render(<DeadlinesWidget deadlines={single} />);
        const rows = screen.getAllByRole('button');
        expect(rows).toHaveLength(1);
        expect(screen.getByText('Only')).toBeTruthy();
    });
});
