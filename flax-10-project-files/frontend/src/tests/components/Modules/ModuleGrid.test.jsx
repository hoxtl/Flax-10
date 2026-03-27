/*
 * Tests for ModuleGrid component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModuleGrid from '../../../components/modules/Modules/ModuleGrid';

const modulesCardMock = vi.fn();

vi.mock('../../../components/modules/Modules/ModulesCard.jsx', () => ({
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

    it('passes module and enrollment props to each card', () => {
        const modules = [{ id: 7, module_name: 'C' }];
        render(<ModuleGrid {...mockParameters} modules={modules} />);
        expect(modulesCardMock).toHaveBeenCalledWith(expect.objectContaining({ module: modules[0], isTeacher: false }));
    });

    it('passes task counts and reading handlers to each card', () => {
        const counts = { 7: 3 };
        render(<ModuleGrid {...mockParameters} modules={[{ id: 7, module_name: 'C' }]} taskCountsByModule={counts} onManageReadings={mockParameters.onManageDeadlines} />);
        expect(modulesCardMock).toHaveBeenCalledWith(expect.objectContaining({ taskCountsByModule: counts, onManageReadings: mockParameters.onManageDeadlines }));
    });
});
