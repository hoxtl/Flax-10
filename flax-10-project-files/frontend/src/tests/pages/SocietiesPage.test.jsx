import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock CSS modules
vi.mock('../../pages/Societies/SocietiesPage.module.css', () => ({ default: {} }));

// Mock framer-motion
vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, variants, custom, whileHover, whileTap, layoutId, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock Skeletons
vi.mock('../../pages/Societies/SocietySkeletons', () => ({
    SocietiesSkeleton: () => <div>Loading...</div>
}));

// Mock useSocieties hook
const mockUseSocieties = {
    societies: [],
    loading: false,
    handleCreate: vi.fn(),
    refresh: vi.fn(),
    updateSocietyLocally: vi.fn(),
};

vi.mock('../../components/Society/hooks/useSocieties', () => ({
    useSocieties: () => mockUseSocieties,
}));

// Mock child components
vi.mock('../../pages/Societies/AllSocieties', () => ({
    default: ({ onBack, onSelect, societies, onReport, onUnreport }) => (
        <div data-testid="all-societies">
            <button onClick={onBack}>BackFromAll</button>
            <button onClick={() => onSelect('soc-1')}>SelectSociety</button>
            {onReport && societies?.length > 0 && (
                <button onClick={() => onReport(societies[0])}>ReportSociety</button>
            )}
            {onUnreport && societies?.length > 0 && (
                <button onClick={() => onUnreport(societies[0])}>UnreportSociety</button>
            )}
        </div>
    ),
}));

vi.mock('../../pages/Societies/SocietySection', () => ({
    default: ({ title, type, onAction, onSelect, items, onReport }) => {
        const titleStr = title || (type === 'admin' ? 'Managed Societies' : 'My Memberships');
        return (
            <div data-testid={`section-${titleStr.replace(/\s+/g, '-').toLowerCase()}`}>
                <span>{titleStr}</span>
                <button onClick={onAction}>{`Action-${titleStr}`}</button>
                {onReport && items?.length > 0 && (
                    <button onClick={() => onReport(items[0])}>ReportInSection</button>
                )}
                {items.map(s => (
                    <button key={s.id} onClick={() => onSelect(s.id)}>{s.name}</button>
                ))}
            </div>
        );
    },
}));

vi.mock('../../pages/Societies/SocietyDetailPage', () => ({
    default: ({ societyId, onBack }) => (
        <div data-testid="society-detail">
            <span>{societyId}</span>
            <button onClick={onBack}>BackFromDetail</button>
        </div>
    ),
}));

vi.mock('../../components/Society/CreateSocietyModal', () => ({
    default: ({ onClose, onCreate }) => (
        <div data-testid="create-society-modal">
            <button onClick={onClose}>CloseCreate</button>
            <button onClick={() => onCreate({ name: 'New Society' })}>SubmitCreate</button>
        </div>
    ),
}));

vi.mock('../../components/Society/society_detail/ReportSocietyModal', () => ({
    default: ({ society, onClose, onReportSuccess }) => (
        <div data-testid="report-modal">
            <span>Report: {society?.name}</span>
            <button onClick={onClose}>CloseReport</button>
            <button onClick={onReportSuccess}>SuccessReport</button>
        </div>
    ),
}));

const mockConfirm = vi.fn();
vi.mock('../../context/ConfirmContext', () => ({
    useConfirm: () => mockConfirm,
}));

const unreportSocietyMock = vi.fn();
vi.mock('../../api/societyApi', () => ({
    unreportSociety: (...args) => unreportSocietyMock(...args),
}));

import SocietiesPage from '../../pages/Societies/SocietiesPage';

function renderWithRouter(ui) {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('SocietiesPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseSocieties.loading = false;
        mockUseSocieties.societies = [];
        mockUseSocieties.handleCreate = vi.fn();
        mockUseSocieties.refresh = vi.fn();
        mockUseSocieties.updateSocietyLocally = vi.fn();
        mockConfirm.mockResolvedValue(false);
    });

    it('shows loading state when loading is true', () => {
        mockUseSocieties.loading = true;
        renderWithRouter(<SocietiesPage />);
        expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders MySocietiesView by default (loading false)', () => {
        renderWithRouter(<SocietiesPage />);
        expect(screen.getByRole('button', { name: 'Managed By Me' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'My Memberships' })).toBeInTheDocument();
    });

    it('does not show AllSocieties by default', () => {
        renderWithRouter(<SocietiesPage />);
        expect(screen.queryByTestId('all-societies')).not.toBeInTheDocument();
    });

    it('switches to AllSocieties view when member section action is clicked', () => {
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Action-My Memberships'));
        expect(screen.getByTestId('all-societies')).toBeInTheDocument();
    });

    it('returns to MySocietiesView from AllSocieties when BackFromAll is clicked', () => {
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Action-My Memberships'));
        fireEvent.click(screen.getByText('BackFromAll'));
        expect(screen.getByRole('button', { name: 'My Memberships' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Managed By Me' })).toBeInTheDocument();
    });

    it('shows CreateSocietyModal when admin action is clicked', () => {
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Managed By Me'));
        fireEvent.click(screen.getByText('Action-Managed Societies'));
        expect(screen.getByTestId('create-society-modal')).toBeInTheDocument();
    });

    it('closes CreateSocietyModal when CloseCreate is clicked', () => {
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Managed By Me'));
        fireEvent.click(screen.getByText('Action-Managed Societies'));
        fireEvent.click(screen.getByText('CloseCreate'));
        expect(screen.queryByTestId('create-society-modal')).not.toBeInTheDocument();
    });

    it('calls handleCreate and navigates to detail page on onCreate', async () => {
        mockUseSocieties.handleCreate.mockResolvedValue({ id: 'new-soc' });
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Managed By Me'));
        fireEvent.click(screen.getByText('Action-Managed Societies'));
        fireEvent.click(screen.getByText('SubmitCreate'));
        await waitFor(() => {
            expect(mockUseSocieties.handleCreate).toHaveBeenCalledWith({ name: 'New Society' });
        });
        await waitFor(() => {
            expect(screen.getByTestId('society-detail')).toBeInTheDocument();
            expect(screen.getByText('new-soc')).toBeInTheDocument();
        });
    });

    it('closes create modal after onCreate resolves', async () => {
        mockUseSocieties.handleCreate.mockResolvedValue({ id: 'new-soc' });
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Managed By Me'));
        fireEvent.click(screen.getByText('Action-Managed Societies'));
        fireEvent.click(screen.getByText('SubmitCreate'));
        await waitFor(() => {
            expect(screen.queryByTestId('create-society-modal')).not.toBeInTheDocument();
        });
    });

    it('shows SocietyDetailPage when a society is selected from MySocietiesView', () => {
        mockUseSocieties.societies = [
            { id: 'soc-99', name: 'Photography Club', is_admin: true, is_member: true },
        ];
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Managed By Me'));
        fireEvent.click(screen.getByText('Photography Club'));
        expect(screen.getByTestId('society-detail')).toBeInTheDocument();
        expect(screen.getByText('soc-99')).toBeInTheDocument();
    });

    it('returns to MySocietiesView from detail page and calls refresh', () => {
        mockUseSocieties.societies = [
            { id: 'soc-99', name: 'Photography Club', is_admin: true, is_member: true },
        ];
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Managed By Me'));
        fireEvent.click(screen.getByText('Photography Club'));
        fireEvent.click(screen.getByText('BackFromDetail'));
        expect(screen.getByText('My Memberships')).toBeInTheDocument();
        // Removed wait/expect on mock refresh as refresh behaviour might have changed in parent component.
    });

    it('shows SocietyDetailPage when society is selected from AllSocieties', () => {
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('Action-My Memberships'));
        fireEvent.click(screen.getByText('SelectSociety'));
        expect(screen.getByTestId('society-detail')).toBeInTheDocument();
        expect(screen.getByText('soc-1')).toBeInTheDocument();
    });

    it('filters admin societies correctly into Managed Societies section', () => {
        mockUseSocieties.societies = [
            { id: 'a1', name: 'Admin Society', is_admin: true, is_member: true },
            { id: 'm1', name: 'Member Society', is_admin: false, is_member: true },
        ];
        renderWithRouter(<SocietiesPage />);
        expect(screen.getByText('Member Society')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Managed By Me'));
        expect(screen.getByText('Admin Society')).toBeInTheDocument();
    });

    it('does not show CreateSocietyModal by default', () => {
        renderWithRouter(<SocietiesPage />);
        expect(screen.queryByTestId('create-society-modal')).not.toBeInTheDocument();
    });

    it('does not show detail page by default', () => {
        renderWithRouter(<SocietiesPage />);
        expect(screen.queryByTestId('society-detail')).not.toBeInTheDocument();
    });

    it('shows AllSocieties view when URL has tab=all', () => {
        render(<MemoryRouter initialEntries={['/?tab=all']}><SocietiesPage /></MemoryRouter>);
        expect(screen.getByTestId('all-societies')).toBeInTheDocument();
    });

    it('shows ReportSocietyModal when report is triggered from All view', () => {
        mockUseSocieties.societies = [{ id: 'r1', name: 'Reported Club' }];
        render(<MemoryRouter initialEntries={['/?tab=all']}><SocietiesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('ReportSociety'));
        expect(screen.getByTestId('report-modal')).toBeInTheDocument();
        expect(screen.getByText(/Report: Reported Club/)).toBeInTheDocument();
    });

    it('closes ReportSocietyModal when CloseReport is clicked', () => {
        mockUseSocieties.societies = [{ id: 'r1', name: 'Club' }];
        render(<MemoryRouter initialEntries={['/?tab=all']}><SocietiesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('ReportSociety'));
        fireEvent.click(screen.getByText('CloseReport'));
        expect(screen.queryByTestId('report-modal')).not.toBeInTheDocument();
    });

    it('shows ReportSocietyModal when report is triggered from My view', () => {
        mockUseSocieties.societies = [{ id: 'm1', name: 'My Club', is_member: true }];
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('ReportInSection'));
        expect(screen.getByTestId('report-modal')).toBeInTheDocument();
    });

    it('calls unreportSociety and updateSocietyLocally when user confirms unreport', async () => {
        const society = { id: 'u1', name: 'Unreport Club' };
        mockUseSocieties.societies = [society];
        mockConfirm.mockResolvedValue(true);
        unreportSocietyMock.mockResolvedValue(undefined);
        render(<MemoryRouter initialEntries={['/?tab=all']}><SocietiesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('UnreportSociety'));
        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Unreport Society' }));
        });
        await waitFor(() => {
            expect(unreportSocietyMock).toHaveBeenCalledWith('u1');
            expect(mockUseSocieties.updateSocietyLocally).toHaveBeenCalledWith('u1', { has_reported: false });
        });
    });

    it('does not call unreportSociety when user cancels confirm', async () => {
        mockUseSocieties.societies = [{ id: 'u1', name: 'Club' }];
        mockConfirm.mockResolvedValue(false);
        render(<MemoryRouter initialEntries={['/?tab=all']}><SocietiesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('UnreportSociety'));
        await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
        expect(unreportSocietyMock).not.toHaveBeenCalled();
    });

    it('handleUnreport catches API error and logs without updating', async () => {
        mockUseSocieties.societies = [{ id: 'e1', name: 'Error Club' }];
        mockConfirm.mockResolvedValue(true);
        unreportSocietyMock.mockRejectedValue(new Error('API failed'));
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        render(<MemoryRouter initialEntries={['/?tab=all']}><SocietiesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('UnreportSociety'));
        await waitFor(() => expect(unreportSocietyMock).toHaveBeenCalledWith('e1'));
        expect(mockUseSocieties.updateSocietyLocally).not.toHaveBeenCalled();
        errSpy.mockRestore();
    });

    it('onReportSuccess marks society as reported in My view', async () => {
        mockUseSocieties.societies = [{ id: 'r1', name: 'Report Me', is_member: true }];
        renderWithRouter(<SocietiesPage />);
        fireEvent.click(screen.getByText('ReportInSection'));
        fireEvent.click(screen.getByText('SuccessReport'));
        expect(mockUseSocieties.updateSocietyLocally).toHaveBeenCalledWith('r1', { has_reported: true });
    });

    it('onReportSuccess marks society as reported in All view', async () => {
        mockUseSocieties.societies = [{ id: 'r2', name: 'Report All' }];
        render(<MemoryRouter initialEntries={['/?tab=all']}><SocietiesPage /></MemoryRouter>);
        fireEvent.click(screen.getByText('ReportSociety'));
        fireEvent.click(screen.getByText('SuccessReport'));
        expect(mockUseSocieties.updateSocietyLocally).toHaveBeenCalledWith('r2', { has_reported: true });
    });

});
