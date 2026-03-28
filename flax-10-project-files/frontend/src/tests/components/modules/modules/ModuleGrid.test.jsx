/*
 * Tests for ModuleGrid component.
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import ModuleGrid from '../../../../components/modules/modules/ModuleGrid';

const modulesCardMock = vi.fn();

vi.mock('../../../../components/modules/modules/ModulesCard.jsx', () => ({
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

    afterEach(() => {
        modulesCardMock.mockClear();
    });

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

    it('falls back to module_code and index when id is missing', () => {
        const modules = [
            { module_code: 'NO-ID', module_name: 'Code Only' },
            { module_name: 'Index Fallback' },
        ];

        render(<ModuleGrid {...mockParameters} modules={modules} />);

        expect(screen.getByText('Code Only')).toBeInTheDocument();
        expect(screen.getByText('Index Fallback')).toBeInTheDocument();
        expect(modulesCardMock).toHaveBeenCalledTimes(2);
    });

    it('uses numeric index when neither id nor module_code exists', () => {
        render(<ModuleGrid {...mockParameters} modules={[{ module_name: 'Anonymous' }]} />);
        expect(screen.getByText('Anonymous')).toBeInTheDocument();
        expect(modulesCardMock).toHaveBeenCalledTimes(1);
    });

    it('uses id 0 as a valid key when provided', () => {
        render(<ModuleGrid {...mockParameters} modules={[{ id: 0, module_name: 'Zero id' }]} />);
        expect(screen.getByText('Zero id')).toBeInTheDocument();
    });

    it('prefers module_code when id is explicitly null', () => {
        render(<ModuleGrid {...mockParameters} modules={[{ id: null, module_code: 'ZED', module_name: 'Null id' }]} />);
        expect(screen.getByText('Null id')).toBeInTheDocument();
    });
});
