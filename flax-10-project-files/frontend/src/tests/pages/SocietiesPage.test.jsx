import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock CSS modules
vi.mock('../../pages/Societies/SocietiesPage.module.css', () => ({ default: {} }));

// Mock useSocieties hook
const mockUseSocieties = {
    societies: [],
    loading: false,
    handleCreate: vi.fn(),
    refresh: vi.fn(),
};

vi.mock('../../components/Society/hooks/useSocieties', () => ({
    useSocieties: () => mockUseSocieties,
}));

// Mock child components
vi.mock('../../pages/Societies/AllSocieties', () => ({
    default: ({ onBack, onSelect, societies }) => (
        <div data-testid="all-societies">
            <button onClick={onBack}>BackFromAll</button>
            <button onClick={() => onSelect({ id: 'soc-1' })}>SelectSociety</button>
        </div>
    ),
}));

vi.mock('../../pages/Societies/SocietySection', () => ({
    default: ({ title, onAction, onSelect, items }) => (
        <div data-testid={`section-${title.replace(/\s+/g, '-').toLowerCase()}`}>
            <span>{title}</span>
            <button onClick={onAction}>{`Action-${title}`}</button>
            {items.map(s => (
                <button key={s.id} onClick={() => onSelect(s)}>{s.name}</button>
            ))}
        </div>
    ),
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
        expect(mockUseSocieties.refresh).toHaveBeenCalled();
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
});
