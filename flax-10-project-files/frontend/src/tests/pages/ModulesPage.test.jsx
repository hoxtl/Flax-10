/*
 * Tests for ModulesPage component.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ModulesPage from '../../pages/modules/ModulesPage';

const mockHook = {
    loading: false,
    modules: [],
    enrollments: [],
    handleModuleCreated: vi.fn(),
    handleModuleUpdated: vi.fn(),
    handleDeleteModule: vi.fn(),
    handleEnrollment: vi.fn(),
    handleDisenrol: vi.fn(),
    toggleEnrollment: vi.fn(),
};

vi.mock('../../components/modules/hooks/useModules', () => ({ default: () => mockHook }));
vi.mock('../../components/modules/utils/moduleUtils', () => ({
    isEnrolledIn: vi.fn(() => false),
    filterModules: vi.fn((modules) => modules),
    applyFiltersAndSort: vi.fn((modules) => modules),
    getDepartments: vi.fn(() => []),
    normaliseModuleCode: vi.fn((code) => String(code || '').toUpperCase().replace(/\s+/g, '')),
}));
vi.mock('../../components/modules/modules/ModuleGrid', () => ({
    default: ({ onManageDeadlines, onEdit }) => (
        <div>
            <span>ModuleGrid</span>
            <button onClick={() => onManageDeadlines({ id: 1, module_code: '5CCS2SEG' })}>Manage Deadlines</button>
            <button onClick={() => onEdit({ id: 1 })}>Edit</button>
        </div>
    ),
}));
vi.mock('../../components/modules/modules/ModuleForm', () => ({
    default: ({ onCancel, onSuccess }) => (
        <div>
            <span>ModuleForm</span>
            <button onClick={onCancel}>Cancel</button>
            <button onClick={() => onSuccess({ id: 99 }, true)}>SaveNew</button>
            <button onClick={() => onSuccess({ id: 99 }, false)}>SaveExisting</button>
        </div>
    ),
}));
vi.mock('../../components/modules/modules/ModuleDetails', () => ({
    default: ({ onBack }) => <div><button onClick={onBack}>Back</button></div>,
}));
vi.mock('../../components/modules/deadlines/DeadlineModal', () => ({
    default: ({ onClose }) => <div><button onClick={onClose}>CloseModal</button></div>,
}));
vi.mock('../../pages/modules/ModulesPage.module.css', () => ({ default: {} }));
vi.mock('../../pages/modules/MyModulesDashboard', () => ({
    default: () => <div>Upcoming assignment deadlines</div>,
}));

vi.mock('../../components/common/animated_dropdown', () => ({
    default: ({ value, onChange, options, className }) => (
        <select
            data-testid={className || 'animated-dd'}
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    ),
}));

vi.mock('../../components/modules/hooks/useModuleSorting', () => ({
    default: (modules) => ({
        results: modules || [],
        pageModules: (modules || []).slice(0, 9),
        currentPage: 1,
        totalPages: Math.ceil((modules?.length || 0) / 9) || 1,
        setCurrentPage: vi.fn(),
        department: 'all',
        sortBy: 'name',
        handleNewDepartment: vi.fn(),
        handleNewSort: vi.fn(),
    }),
}));

vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => JSON.stringify({ role: 'teacher' })),
});

describe('ModulesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHook.loading = false;
        mockHook.modules = [];
        localStorage.getItem.mockReturnValue(JSON.stringify({ role: 'teacher' }));
    });

    it('should render the loading state', () => {
        mockHook.loading = true;
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.getByTestId('modules-skeleton')).toBeInTheDocument();
    });

    it('should render the empty state when no modules', () => {
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.getByText(/no modules yet/i)).toBeInTheDocument();
    });

    it('should render module grid when modules exist', async () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.getByText('ModuleGrid')).toBeInTheDocument();
    });

    it('should render create button if user is teacher', async () => {
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.getByText('+ Create Module')).toBeInTheDocument();
    });

    it('should open modal when Manage Deadlines is clicked', async () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('Manage Deadlines'));
        expect(screen.getByText('CloseModal')).toBeInTheDocument();
    });

    it('should close deadline modal when onClose called', async () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('Manage Deadlines'));
        fireEvent.click(screen.getByText('CloseModal'));
        expect(screen.queryByText('CloseModal')).not.toBeInTheDocument();
    });

    it('should filter modules by search query', async () => {
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        const input = screen.getByPlaceholderText(/search/i);
        fireEvent.change(input, { target: { value: 'CS' } });
        expect(input.value).toBe('CS');
    });

    it('should open form when create clicked', async () => {
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('+ Create Module'));
        expect(screen.getByText('ModuleForm')).toBeInTheDocument();
    });

    it('should close form when cancel clicked', async () => {
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('+ Create Module'));
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('ModuleForm')).not.toBeInTheDocument();
    });

    it('should handle saving new and existing modules via ModuleForm', async () => {
        // new module path (is_new = true)
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('+ Create Module'));
        fireEvent.click(screen.getByText('SaveNew'));
        expect(mockHook.handleModuleCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 99 }));
        expect(screen.queryByText('ModuleForm')).not.toBeInTheDocument();

        // existing module path (is_new = false)
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('Edit'));
        expect(screen.getByText('ModuleForm')).toBeInTheDocument();
        fireEvent.click(screen.getByText('SaveExisting'));
        expect(mockHook.handleModuleUpdated).toHaveBeenCalledWith(expect.objectContaining({ id: 99 }));
        expect(screen.queryByText('ModuleForm')).not.toBeInTheDocument();
    });

    it('uses filter from URL and lets students switch into browse modules controls', () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        localStorage.getItem.mockReturnValue(JSON.stringify({ role: 'student' }));
        render(
            <MemoryRouter initialEntries={['/modules?filter=enrolled']}>
                <ModulesPage />
            </MemoryRouter>
        );
        expect(screen.getByRole('heading', { name: 'My Modules' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Browse Modules' }));
        expect(screen.getByRole('heading', { name: 'Browse Modules' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
        fireEvent.click(screen.getByText('Deadlines'));
    });

    it('renders DetailsView when moduleId is present and returns to main view on back', () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        render(
            <MemoryRouter initialEntries={['/modules?moduleId=1']}>
                <ModulesPage />
            </MemoryRouter>
        );
        expect(screen.getByText('Back')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Back'));
        expect(screen.getByText('ModuleGrid')).toBeInTheDocument();
    });

    it('uses code param to open DetailsView when module code matches (case/space insensitive)', () => {
        mockHook.modules = [{ id: 2, module_code: '5CCS 2seg', module_name: 'Intro' }];
        render(
            <MemoryRouter initialEntries={['/modules?code=5ccs2seg']}>
                <ModulesPage />
            </MemoryRouter>
        );
        expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('falls back to search when code param has no matching module', () => {
        mockHook.modules = [{ id: 3, module_code: 'DIFF', module_name: 'Other' }];
        render(
            <MemoryRouter initialEntries={['/modules?code=UNKNOWN']}>
                <ModulesPage />
            </MemoryRouter>
        );
        const input = screen.getByPlaceholderText(/search king's modules by name or code/i);
        expect(input.value).toBe('UNKNOWN');
    });

    it('shows student subtitle and hides create button when user is not teacher', () => {
        localStorage.getItem.mockReturnValue(JSON.stringify({ role: 'student' }));
        const { container } = render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.queryByText('+ Create Module')).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'My Modules' })).toBeInTheDocument();
        const subtitle = container.querySelector('p[class*="subtitle"]');
        expect(subtitle?.textContent).toContain("See your enrolled modules, readings, and deadlines in one place.");
    });

    it('shows the shared overview dashboard by default for students', () => {
        localStorage.getItem.mockReturnValue(JSON.stringify({ role: 'student' }));
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.getByRole('heading', { name: 'My Modules' })).toBeInTheDocument();
        expect(screen.getByText('Overview')).toBeInTheDocument();
        expect(screen.getByText('My Enrolments')).toBeInTheDocument();
        expect(screen.getByText('Upcoming assignment deadlines')).toBeInTheDocument();
    });
});
