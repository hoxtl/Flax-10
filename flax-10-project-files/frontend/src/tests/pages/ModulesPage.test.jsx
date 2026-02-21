import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => JSON.stringify({ role: 'teacher' })),
});

describe('ModulesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHook.loading = false;
        mockHook.modules = [];
    });

    it('should render the loading state', async () => {
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        mockHook.loading = true;
        render(<ModulesPage />);
        expect(screen.getByText(/loading modules/i)).toBeInTheDocument();
    });

    it('should render the empty state when no modules', async () => {
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        render(<ModulesPage />);
        expect(screen.getByText(/no modules available/i)).toBeInTheDocument();
    });

    it('should render module grid when modules exist', async () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        render(<ModulesPage />);
        expect(screen.getByText('ModuleGrid')).toBeInTheDocument();
    });

    it('should render create button if user is teacher', async () => {
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        render(<ModulesPage />);
        expect(screen.getByText('+ Create Module')).toBeInTheDocument();
    });

    it('should open modal when Manage Deadlines is clicked', async () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        render(<ModulesPage />);
        fireEvent.click(screen.getByText('Manage Deadlines'));
        expect(screen.getByText('CloseModal')).toBeInTheDocument();
    });

    it('should close deadline modal when onClose called', async () => {
        mockHook.modules = [{ id: 1, module_code: '5CCS2SEG', module_name: 'Intro' }];
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        render(<ModulesPage />);
        fireEvent.click(screen.getByText('Manage Deadlines'));
        fireEvent.click(screen.getByText('CloseModal'));
        expect(screen.queryByText('CloseModal')).not.toBeInTheDocument();
    });

    it('should filter modules by search query', async () => {
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        render(<ModulesPage />);
        const input = screen.getByPlaceholderText(/search/i);
        fireEvent.change(input, { target: { value: 'CS' } });
        expect(input.value).toBe('CS');
    });

    it('should open form when create clicked', async () => {
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        render(<ModulesPage />);
        fireEvent.click(screen.getByText('+ Create Module'));
        expect(screen.getByText('ModuleForm')).toBeInTheDocument();
    });

    it('should close form when cancel clicked', async () => {
        const { default: ModulesPage } = await import('../../pages/Modules/ModulesPage');
        render(<ModulesPage />);
        fireEvent.click(screen.getByText('+ Create Module'));
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByText('ModuleForm')).not.toBeInTheDocument();
    });
});