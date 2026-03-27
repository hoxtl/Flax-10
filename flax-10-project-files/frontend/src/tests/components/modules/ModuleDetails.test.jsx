/*
 * Tests for ModuleDetails component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ModuleDetails from '../../../components/modules/modules/ModuleDetails';

const useAuthMock = vi.hoisted(() => vi.fn(() => ({ profile: null })));

vi.mock('../../../utils/moduleUtils', () => ({
    formatTime: vi.fn(() => '09:00'),
    formatDuration: vi.fn(() => '1h'),
}));

vi.mock('../../../components/modules/modules/ModuleDetails.module.css', () => ({ default: {} }));
vi.mock('../../../components/modules/styles/ModuleHero.module.css', () => ({ default: {} }));
vi.mock('../../../components/modules/styles/ModuleSchedule.module.css', () => ({ default: {} }));
vi.mock('../../../components/modules/styles/ModuleDeadlines.module.css', () => ({ default: {} }));
vi.mock('../../../context/AuthContext.jsx', () => ({
    useAuth: useAuthMock,
}));

const module = { //values for mock module
    id: 1, module_code: '5CCS2SEG', module_name: 'Software Engineering',
    description: 'A great module', location: 'Bush House, 2.06',
    start_time: '2026-03-01T09:00:00', end_time: '2026-03-01T10:00:00',
    created_by_name: 'Dr John', recurrence_rule: null,
};

describe('ModuleDetails', () => {
    beforeEach(() => {
        useAuthMock.mockReturnValue({ profile: null });
    });

    function renderDetails(props) {
        return render(
            <MemoryRouter>
                <ModuleDetails {...props} />
            </MemoryRouter>,
        );
    }

    it('should successfully render module name and code', () => {
        renderDetails({ module, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('5CCS2SEG')).toBeInTheDocument();
        expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    });

    it('should render enrollment badge when enrolled', () => {
        renderDetails({ module, is_enrolled: true, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('✓ Enrolled')).toBeInTheDocument();
    });

    it('should hide enrollment badge when not enrolled', () => {
        renderDetails({ module, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.queryByText('✓ Enrolled')).not.toBeInTheDocument();
    });

    it('should render enroll button when not enrolled', () => {
        renderDetails({ module, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('Enrol in module')).toBeInTheDocument();
    });

    it('should render leave button when enrolled', () => {
        renderDetails({ module, is_enrolled: true, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('Leave module')).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', () => {
        const onBack = vi.fn();
        renderDetails({ module, is_enrolled: false, onBack, onEnroll: vi.fn(), onUnenroll: vi.fn() });
        // Use a more flexible selector for the back button
        fireEvent.click(screen.getByRole('button', { name: /Back to all modules/i }));
        expect(onBack).toHaveBeenCalled();
    });

    it('should call onEnroll when enroll button is clicked', () => {
        const onEnroll = vi.fn();
        renderDetails({ module, is_enrolled: false, onBack: vi.fn(), onEnroll, onUnenroll: vi.fn() });
        fireEvent.click(screen.getByText('Enrol in module'));
        expect(onEnroll).toHaveBeenCalled();
    });

    it('hides the enroll button when the teacher owns the module', () => {
        useAuthMock.mockReturnValue({ profile: { id: 7, role: 'teacher' } });
        renderDetails({ module: { ...module, created_by: 7 }, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.queryByText('Enrol in module')).not.toBeInTheDocument();
    });

    it('should call onUnenroll when leave button is clicked', () => {
        const onUnenroll = vi.fn();
        renderDetails({ module, is_enrolled: true, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll });
        fireEvent.click(screen.getByText('Leave module'));
        expect(onUnenroll).toHaveBeenCalled();
    });

    it('shows No description provided when description is null', () => {
        renderDetails({ module: { ...module, description: null }, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('No module summary available yet.')).toBeInTheDocument();
    });

    it('shows Unknown when created_by_name is missing', () => {
        renderDetails({ module: { ...module, created_by_name: null }, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('shows No deadlines assigned yet when deadlines empty', () => {
        renderDetails({ module: { ...module, deadlines: [] }, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('No assignments yet.')).toBeInTheDocument();
    });

    it('shows No readings message when readings is empty', () => {
        renderDetails({ module: { ...module, readings: [] }, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('No readings assigned yet.')).toBeInTheDocument();
    });

    it('renders deadlines list when deadlines exist', () => {
        const modWithDeadlines = { ...module, deadlines: [{ id: 1, title: 'CW1', deadline_type: 'coursework', start_due_date: '2026-04-01' }] };
        renderDetails({ module: modWithDeadlines, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('CW1')).toBeInTheDocument();
    });

    it('renders readings list when readings exist', () => {
        const modWithReadings = { ...module, readings: [{ id: 1, title: 'Module Handbook', start_page: 13, end_page: 63, 'deadline': '2026-04-01T00:00:00' }] };
        renderDetails({ module: modWithReadings, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('Module Handbook')).toBeInTheDocument();
    });

    it('shows created_by_email link when present', () => {
        renderDetails({ module: { ...module, created_by_email: 'j@kcl.ac.uk' }, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByRole('link', { name: 'j@kcl.ac.uk' })).toHaveAttribute('href', 'mailto:j@kcl.ac.uk');
    });

    it('shows recurring badge when recurrence_rule is set', () => {
        renderDetails({ module: { ...module, recurrence_rule: 'FREQ=WEEKLY' }, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText(/repeats weekly/)).toBeInTheDocument();
    });

    it('shows disabled Leave button with tooltip when is_core is true', () => {
        renderDetails({ module, is_enrolled: true, is_core: true, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        const leaveBtn = screen.getByText('Leave module');
        expect(leaveBtn).toBeDisabled();
    });

    it('renders timeline progress when multiple deadlines exist', () => {
        const modWithDeadlines = {
            ...module,
            deadlines: [
                { id: 1, title: 'CW1', deadline_type: 'coursework', start_due_date: '2026-01-01' },
                { id: 2, title: 'CW2', deadline_type: 'coursework', start_due_date: '2026-06-01' },
            ],
        };
        renderDetails({ module: modWithDeadlines, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText(/through assignment timeline|hasn't started|will appear/)).toBeInTheDocument();
    });

    it('renders reading with stripped module prefix in title', () => {
        const modWithReading = {
            ...module,
            readings: [{
                id: 1,
                title: 'Software Engineering: Chapter 5',
                module_name: 'Software Engineering',
                start_page: 1,
                end_page: 20,
                deadline: '2026-04-01T00:00:00',
            }],
        };
        renderDetails({ module: modWithReading, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('Chapter 5')).toBeInTheDocument();
    });

    it('shows page_count when start_page and end_page are absent', () => {
        const modWithReading = {
            ...module,
            readings: [{
                id: 2,
                title: 'Extra Reading',
                module_name: null,
                start_page: null,
                end_page: null,
                page_count: 15,
                deadline: '2026-04-15T00:00:00',
            }],
        };
        renderDetails({ module: modWithReading, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('Extra Reading')).toBeInTheDocument();
        expect(screen.getByText(/15 pages/)).toBeInTheDocument();
    });

    it('renders different urgency labels for deadline states', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-03-24T12:00:00Z'));
        const modWithDeadlines = {
            ...module,
            deadlines: [
                { id: 1, title: 'Overdue CW', deadline_type: 'coursework', start_due_date: '2026-01-01' },
                { id: 2, title: 'Soon CW', deadline_type: 'exam', start_due_date: '2026-03-25' },
            ],
        };
        renderDetails({ module: modWithDeadlines, is_enrolled: false, onBack: vi.fn(), onEnroll: vi.fn(), onUnenroll: vi.fn() });
        expect(screen.getByText('Passed')).toBeInTheDocument();
        vi.useRealTimers();
    });
});
