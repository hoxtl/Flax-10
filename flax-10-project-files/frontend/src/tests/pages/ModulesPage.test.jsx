import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { getDepartments } from '../../components/Modules/utils/moduleUtils';
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
            <button onClick={() => onSuccess({ id: 99 }, true)}>Save</button>
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
});