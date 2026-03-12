import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ModulesPage from '../../pages/Modules/ModulesPage';

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

vi.mock('../../components/Modules/hooks/useModules', () => ({ default: () => mockHook }));
vi.mock('../../components/Modules/utils/moduleUtils', () => ({
    isEnrolledIn: vi.fn(() => false),
    filterModules: vi.fn((modules) => modules),
    applyFiltersAndSort: vi.fn((modules) => modules),
    getDepartments: vi.fn(() => []),
}));
vi.mock('../../components/Modules/ModuleGrid', () => ({
    default: ({ onManageDeadlines, onEdit }) => (
        <div>
            <span>ModuleGrid</span>
            <button onClick={() => onManageDeadlines({ id: 1, module_code: '5CCS2SEG' })}>Manage Deadlines</button>
            <button onClick={() => onEdit({ id: 1 })}>Edit</button>
        </div>
    ),
}));
vi.mock('../../components/Modules/ModuleForm', () => ({
    default: ({ onCancel, onSuccess }) => (
        <div>
            <span>ModuleForm</span>
            <button onClick={onCancel}>Cancel</button>
            <button onClick={() => onSuccess({ id: 99 }, true)}>SaveNew</button>
            <button onClick={() => onSuccess({ id: 99 }, false)}>SaveExisting</button>
        </div>
    ),
}));
vi.mock('../../components/Modules/ModuleDetails', () => ({
    default: ({ onBack }) => <div><button onClick={onBack}>Back</button></div>,
}));
vi.mock('../../components/Modules/DeadlineModal', () => ({
    default: ({ onClose }) => <div><button onClick={onClose}>CloseModal</button></div>,
}));
vi.mock('../../pages/Modules/ModulesPage.module.css', () => ({ default: {} }));

vi.mock('../../components/common/AnimatedDropdown', () => ({
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

vi.mock('../../components/Modules/hooks/useModuleSorting', () => ({
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
    });

    it('should render the loading state', () => {
        mockHook.loading = true;
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.getByText(/loading modules/i)).toBeInTheDocument();
    });

    it('should render the empty state when no modules', () => {
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.getByText(/no modules found/i)).toBeInTheDocument();
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

    it('uses filter from URL and allows changing filters and sort', () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        render(
            <MemoryRouter initialEntries={['/modules?filter=enrolled']}>
                <ModulesPage />
            </MemoryRouter>
        );
        const selects = screen.getAllByTestId('animated-dd');
        // first select corresponds to filter (All / Enrolled)
        fireEvent.change(selects[0], { target: { value: 'enrolled' } });
        // change department and sort
        fireEvent.change(selects[1], { target: { value: 'all' } });
        fireEvent.change(selects[2], { target: { value: 'deadlines' } });
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
        const input = screen.getByPlaceholderText(/search by module name or code/i);
        expect(input.value).toBe('UNKNOWN');
    });

    it('shows student subtitle and hides create button when user is not teacher', () => {
        localStorage.getItem.mockReturnValueOnce(JSON.stringify({ role: 'student' }));
        render(<MemoryRouter><ModulesPage /></MemoryRouter>);
        expect(screen.queryByText('+ Create Module')).not.toBeInTheDocument();
        expect(screen.getByText(/browse and enroll into available modules/i)).toBeInTheDocument();
    });
});