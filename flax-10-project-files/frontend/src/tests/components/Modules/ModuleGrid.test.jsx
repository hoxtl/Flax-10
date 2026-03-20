import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModuleGrid from '../../../components/Modules/Modules/ModuleGrid';

vi.mock('../../../components/Modules/ModulesCard', () => ({
    default: ({ module }) => <div>{module.module_name}</div>,
}));

vi.mock('../ModuleGrid.module.css', () => ({ default: { grid: 'grid' } }));

describe('ModuleGrid', () => {
    const mockParameters = {
        enrollments: [], isTeacher: false,
        onViewModule: vi.fn(), onEnrollmentToggle: vi.fn(),
        onEdit: vi.fn(), onDelete: vi.fn(), onManageDeadlines: vi.fn(),
    };

    it('should render all module cards', () => {
        const modules = [
            { id: 1, module_code: '5CCS2SEG', module_name: 'Software Engineering' },
            { id: 2, module_code: '4CCS1DST', module_name: 'Data Structures' },
        ];
        render(<ModuleGrid {...mockParameters} modules={modules} />);
        expect(screen.getByText('Software Engineering')).toBeInTheDocument();
        expect(screen.getByText('Data Structures')).toBeInTheDocument();
    });

    it('should render nothing when module is empty', () => {
        const { container } = render(<ModuleGrid {...mockParameters} modules={[]} />);
        expect(container.firstChild.children).toHaveLength(0);
    });
});