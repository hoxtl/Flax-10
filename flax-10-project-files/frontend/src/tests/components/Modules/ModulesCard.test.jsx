import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModulesCard from '../../../components/Modules/ModulesCard';

vi.mock('../../../components/Modules/utils/moduleUtils', () => ({
    isEnrolledIn: vi.fn(() => false),
    formatWeekdayTime: vi.fn(() => 'Mondays at 09:00'),
    formatTime: vi.fn(() => '09:00'),
    formatDuration: vi.fn(() => '1h'),
    getDepartment: vi.fn(() => "King's College London"),
    getCourse: vi.fn(() => null),
}));

vi.mock('../../../components/Modules/ModulesCard.module.css', () => ({ default: { card: 'card', enrolled: 'enrolled', clickable: 'clickable' } }));

const module = {
    id: 1, module_code: '5CCS2SEG', module_name: 'Software Engineering',
    description: null, location: null,
    start_time: '2026-03-01T09:00:00', end_time: '2026-03-01T10:00:00',
};

const mockParameters = {
    module, enrollments: [], isTeacher: false,
    onViewModule: vi.fn(), onEnrollmentToggle: vi.fn(),
    onEdit: vi.fn(), onDelete: vi.fn(), onManageDeadlines: vi.fn(),
};

describe('ModulesCard', () => {
    it('should render module name and code', () => {
        render(<ModulesCard {...mockParameters} />);
        expect(screen.getByText(/5CCS2SEG/)).toBeInTheDocument();
        expect(screen.getByText(/Software Engineering/)).toBeInTheDocument();
    });

    it('should render enroll button for student', () => {
        render(<ModulesCard {...mockParameters} />);
        expect(screen.getByText('+ Enroll')).toBeInTheDocument();
    });

    it('should render teacher actions for teacher', () => {
        render(<ModulesCard {...mockParameters} isTeacher={true} />);
        expect(screen.getByText('✎ Edit')).toBeInTheDocument();
        expect(screen.getByText('× Delete')).toBeInTheDocument();
        expect(screen.getByText('Assignments')).toBeInTheDocument();
    });

    it('should call onManageDeadlines when assignments button is clicked', () => {
        const onManageDeadlines = vi.fn();
        render(<ModulesCard {...mockParameters} isTeacher={true} onManageDeadlines={onManageDeadlines} />);
        fireEvent.click(screen.getByText('Assignments'));
        expect(onManageDeadlines).toHaveBeenCalled();
    });

    it('should call onViewModule when card is clicked by student', () => {
        const onViewModule = vi.fn();
        render(<ModulesCard {...mockParameters} onViewModule={onViewModule} />);
        const title = screen.getByRole('heading', { level: 3, name: /Software Engineering/i });
        fireEvent.click(title.closest('div'));
        expect(onViewModule).toHaveBeenCalled();
    });

    it('should render leave button when enrolled', async () => {
        const { isEnrolledIn } = await import('../../../components/Modules/utils/moduleUtils');
        isEnrolledIn.mockReturnValueOnce(true);
        render(<ModulesCard {...mockParameters} />);
        expect(screen.getByText('× Leave Module')).toBeInTheDocument();
    });

    it('should call onEdit when edit is clicked', () => {
        const onEdit = vi.fn();
        render(<ModulesCard {...mockParameters} isTeacher={true} onEdit={onEdit} />);
        fireEvent.click(screen.getByText('✎ Edit'));
        expect(onEdit).toHaveBeenCalled();
    });

    it('should call onDelete when delete is clicked', () => {
        const onDelete = vi.fn();
        render(<ModulesCard {...mockParameters} isTeacher={true} onDelete={onDelete} />);
        fireEvent.click(screen.getByText('× Delete'));
        expect(onDelete).toHaveBeenCalled();
    });

    it('shows Core badge when enrolled in core module', async () => {
        const { isEnrolledIn } = await import('../../../components/Modules/utils/moduleUtils');
        isEnrolledIn.mockReturnValueOnce(true);
        render(<ModulesCard {...mockParameters} enrollments={[{ module: 1, is_core: true }]} />);
        expect(screen.getByText('📌 Core')).toBeInTheDocument();
    });

    it('shows Core module tag in actions when enrolled in core', async () => {
        const { isEnrolledIn } = await import('../../../components/Modules/utils/moduleUtils');
        isEnrolledIn.mockReturnValueOnce(true);
        render(<ModulesCard {...mockParameters} enrollments={[{ module: 1, is_core: true }]} />);
        expect(screen.getByText('📌 Core module')).toBeInTheDocument();
    });

    it('renders long description text directly', () => {
        render(<ModulesCard {...mockParameters} module={{ ...module, description: 'A'.repeat(200) }} />);
        expect(screen.getByText(/A{20}/)).toBeInTheDocument();
    });
});