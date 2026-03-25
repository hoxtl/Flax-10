/*
 * Tests for ModuleGrid component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModuleGrid from '../../../components/Modules/Modules/ModuleGrid';

const modulesCardMock = vi.fn();

vi.mock('../../../components/Modules/Modules/ModulesCard.jsx', () => ({
    default: (props) => {
        modulesCardMock(props);
        return <div>{props.module.module_name}</div>;
    },
}));

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

    it('forwards module actions and task counts to each module card', () => {
        const modules = [{ id: 7, module_code: 'CS7', module_name: 'Compilers' }];
        const taskCountsByModule = { 7: 3 };

        render(
            <ModuleGrid
                {...mockParameters}
                modules={modules}
                taskCountsByModule={taskCountsByModule}
                onManageReadings={mockParameters.onManageDeadlines}
            />
        );

        expect(modulesCardMock).toHaveBeenCalledWith(expect.objectContaining({
            module: modules[0],
            enrollments: [],
            isTeacher: false,
            onViewModule: mockParameters.onViewModule,
            onEnrollmentToggle: mockParameters.onEnrollmentToggle,
            onEdit: mockParameters.onEdit,
            onDelete: mockParameters.onDelete,
            onManageDeadlines: mockParameters.onManageDeadlines,
            onManageReadings: mockParameters.onManageDeadlines,
            taskCountsByModule,
        }));
    });
});
