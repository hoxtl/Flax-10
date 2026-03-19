import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModuleDetails from '../../../components/Modules/ModuleDetails';

vi.mock('../../../utils/moduleUtils', () => ({
    formatTime: vi.fn(() => '09:00'),
    formatDuration: vi.fn(() => '1h'),
}));

vi.mock('../ModuleDetails.module.css', () => ({ default: {} }));

const module = { //values for mock module
    id: 1, module_code: '5CCS2SEG', module_name: 'Software Engineering',
    description: 'A great module', location: 'Bush House, 2.06',
    start_time: '2026-03-01T09:00:00', end_time: '2026-03-01T10:00:00',
    created_by_name: 'Dr John', recurrence_rule: null,
};

describe('ModuleDetails', () => {
    it('should successfully render module name and code', () => {
        render(<ModuleDetails module={module} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText('5CCS2SEG')).toBeInTheDocument();
        expect(screen.getByText('Software Engineering')).toBeInTheDocument();
    });

    it('should render enrollment badge when enrolled', () => {
        render(<ModuleDetails module={module} is_enrolled={true} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText('✓ Enrolled')).toBeInTheDocument();
    });

    it('should hide enrollment badge when not enrolled', () => {
        render(<ModuleDetails module={module} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.queryByText('✓ Enrolled')).not.toBeInTheDocument();
    });

    it('should render enroll button when not enrolled', () => {
        render(<ModuleDetails module={module} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText('Enroll in module')).toBeInTheDocument();
    });

    it('should render leave button when enrolled', () => {
        render(<ModuleDetails module={module} is_enrolled={true} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText('Leave module')).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', () => {
        const onBack = vi.fn();
        render(<ModuleDetails module={module} is_enrolled={false} onBack={onBack} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        // Use a more flexible selector for the back button
        fireEvent.click(screen.getByRole('button', { name: /Back to all modules/i }));
        expect(onBack).toHaveBeenCalled();
    });

    it('should call onEnroll when enroll button is clicked', () => {
        const onEnroll = vi.fn();
        render(<ModuleDetails module={module} is_enrolled={false} onBack={vi.fn()} onEnroll={onEnroll} onUnenroll={vi.fn()} />);
        fireEvent.click(screen.getByText('Enroll in module'));
        expect(onEnroll).toHaveBeenCalled();
    });

    it('should call onUnenroll when leave button is clicked', () => {
        const onUnenroll = vi.fn();
        render(<ModuleDetails module={module} is_enrolled={true} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={onUnenroll} />);
        fireEvent.click(screen.getByText('Leave module'));
        expect(onUnenroll).toHaveBeenCalled();
    });

    it('shows No description provided when description is null', () => {
        render(<ModuleDetails module={{ ...module, description: null }} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText('No module summary available yet.')).toBeInTheDocument();
    });

    it('shows Unknown when created_by_name is missing', () => {
        render(<ModuleDetails module={{ ...module, created_by_name: null }} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('shows No deadlines assigned yet when deadlines empty', () => {
        render(<ModuleDetails module={{ ...module, deadlines: [] }} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText('No assignments yet.')).toBeInTheDocument();
    });

    it('renders deadlines list when deadlines exist', () => {
        const modWithDeadlines = { ...module, deadlines: [{ id: 1, title: 'CW1', deadline_type: 'coursework', start_due_date: '2026-04-01' }] };
        render(<ModuleDetails module={modWithDeadlines} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText('CW1')).toBeInTheDocument();
    });

    it('shows created_by_email link when present', () => {
        render(<ModuleDetails module={{ ...module, created_by_email: 'j@kcl.ac.uk' }} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByRole('link', { name: 'j@kcl.ac.uk' })).toHaveAttribute('href', 'mailto:j@kcl.ac.uk');
    });

    it('shows recurring badge when recurrence_rule is set', () => {
        render(<ModuleDetails module={{ ...module, recurrence_rule: 'FREQ=WEEKLY' }} is_enrolled={false} onBack={vi.fn()} onEnroll={vi.fn()} onUnenroll={vi.fn()} />);
        expect(screen.getByText(/repeats weekly/)).toBeInTheDocument();
    });
});