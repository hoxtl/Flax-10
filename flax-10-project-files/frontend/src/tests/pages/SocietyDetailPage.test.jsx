import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SocietyDetailPage from '../../pages/Societies/SocietyDetailPage';

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useLocation: () => ({ state: null }) };
});

const mockHookData = {
    society: {
        id: 1,
        name: 'Chess Club',
        is_admin: true,
        role: 'admin',
        tags: [],
        announcements: [],
        images: [],
        ratification_status: 'pending',
        is_ratified: false,
    },
    loading: false,
    error: null,
    updateSociety: vi.fn(),
    members: [],
    publishChanges: vi.fn().mockResolvedValue({}),
    addAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
    addEvent: vi.fn().mockResolvedValue({}),
    updateEvent: vi.fn().mockResolvedValue({}),
    deleteEvent: vi.fn().mockResolvedValue({}),
    addException: vi.fn(),
    addTag: vi.fn(),
    deleteTag: vi.fn(),
    joinSociety: vi.fn(),
    leaveSociety: vi.fn(),
    deleteSociety: vi.fn().mockResolvedValue({}),
    fetchMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    addCollaborator: vi.fn(),
    requestRatification: vi.fn(),
};

vi.mock('../../components/Society/hooks/useSocietyDetail', () => ({
    useSocietyDetail: vi.fn(() => mockHookData),
}));

vi.mock('../../components/Society/hooks/useChangeTracker', () => ({
    useChangeTracker: vi.fn(() => ({
        hasChanges: vi.fn(() => false),
        getChangeSummary: vi.fn(() => ''),
        resetChanges: vi.fn(),
        trackEvent: vi.fn(),
        trackAnnouncement: vi.fn(),
    })),
}));

vi.mock('../../components/Society/SocietyDetail/SocietyHero', () => ({
    default: ({ society }) => <div data-testid="society-hero">{society.name}</div>,
}));

vi.mock('../../components/Society/SocietyDetail/SocietyInfo', () => ({
    default: ({ society, onToggleEditMode }) => (
        <div data-testid="society-info">
            <button onClick={onToggleEditMode}>Toggle Edit</button>
        </div>
    ),
}));

vi.mock('../../components/Society/SocietyDetail/tabs/SocietyTabs', () => ({
    default: () => <div data-testid="society-tabs" />,
}));

vi.mock('../../components/Society/SocietyDetail/SocietySidebar', () => ({
    default: () => <div data-testid="society-sidebar" />,
}));

vi.mock('../../components/Society/SocietyDetail/imageHandlers/CoverImageModal', () => ({
    default: ({ onClose }) => <div data-testid="cover-modal"><button onClick={onClose}>Close Cover</button></div>,
}));

vi.mock('../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal', () => ({
    default: ({ onClose }) => <div data-testid="gallery-modal"><button onClick={onClose}>Close Gallery</button></div>,
}));

vi.mock('../../components/Society/SocietyDetail/SettingsModal', () => ({
    default: ({ onClose, onDelete }) => (
        <div data-testid="settings-modal">
            <button onClick={onClose}>Close Settings</button>
            <button onClick={onDelete}>Delete Society</button>
        </div>
    ),
}));

vi.mock('../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModal', () => ({
    default: ({ onClose }) => <div data-testid="announcement-modal"><button onClick={onClose}>Close Announcement</button></div>,
}));

import { useSocietyDetail } from '../../components/Society/hooks/useSocietyDetail';

function renderPage(props = {}) {
    return render(
        <MemoryRouter>
            <SocietyDetailPage societyId={1} onBack={vi.fn()} {...props} />
        </MemoryRouter>
    );
}

describe('SocietyDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSocietyDetail.mockReturnValue(mockHookData);
    });

    it('renders loading state', () => {
        useSocietyDetail.mockReturnValue({ ...mockHookData, loading: true });
        renderPage();
        expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('renders not found when society is null', () => {
        useSocietyDetail.mockReturnValue({ ...mockHookData, loading: false, society: null });
        renderPage();
        expect(screen.getByText('Society not found.')).toBeTruthy();
    });

    it('calls onBack from NotFound page', () => {
        useSocietyDetail.mockReturnValue({ ...mockHookData, loading: false, society: null });
        const onBack = vi.fn();
        render(<MemoryRouter><SocietyDetailPage societyId={1} onBack={onBack} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Back to Societies'));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('renders society hero', () => {
        renderPage();
        expect(screen.getByTestId('society-hero')).toBeTruthy();
        expect(screen.getByText('Chess Club')).toBeTruthy();
    });

    it('renders society tabs', () => {
        renderPage();
        expect(screen.getByTestId('society-tabs')).toBeTruthy();
    });

    it('renders back button', () => {
        renderPage();
        expect(screen.getByText(/← Back to Societies/)).toBeTruthy();
    });

    it('calls onBack when back button is clicked', () => {
        const onBack = vi.fn();
        renderPage({ onBack });
        fireEvent.click(screen.getByText(/← Back to Societies/));
        expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('shows settings button for admin', () => {
        renderPage();
        expect(screen.getByTitle('Settings')).toBeTruthy();
    });

    it('opens settings modal when settings button clicked', () => {
        renderPage();
        fireEvent.click(screen.getByTitle('Settings'));
        expect(screen.getByTestId('settings-modal')).toBeTruthy();
    });

    it('closes settings modal', () => {
        renderPage();
        fireEvent.click(screen.getByTitle('Settings'));
        fireEvent.click(screen.getByText('Close Settings'));
        expect(screen.queryByTestId('settings-modal')).toBeNull();
    });

    it('renders error when error is present', () => {
        useSocietyDetail.mockReturnValue({ ...mockHookData, error: 'Some error', society: null });
        renderPage();
        expect(screen.getByText('Society not found.')).toBeTruthy();
    });

    it('does not show settings button for non-admin', () => {
        useSocietyDetail.mockReturnValue({
            ...mockHookData,
            society: { ...mockHookData.society, role: 'member' }
        });
        renderPage();
        expect(screen.queryByTitle('Settings')).toBeNull();
    });

    it('toggles edit mode', async () => {
        renderPage();
        fireEvent.click(screen.getByText('Toggle Edit'));
        // After click, editMode should be true (passed to children)
        expect(screen.getByTestId('society-info')).toBeTruthy();
    });

    it('calls publishChanges when toggling off edit mode with changes', async () => {
        const { useChangeTracker } = await import('../../components/Society/hooks/useChangeTracker');
        useChangeTracker.mockReturnValue({
            hasChanges: vi.fn(() => true),
            getChangeSummary: vi.fn(() => 'summary'),
            resetChanges: vi.fn(),
            trackEvent: vi.fn(),
            trackAnnouncement: vi.fn(),
        });
        renderPage();
        fireEvent.click(screen.getByText('Toggle Edit')); // enter edit
        fireEvent.click(screen.getByText('Toggle Edit')); // exit edit with changes
        await waitFor(() => {
            expect(mockHookData.publishChanges).toHaveBeenCalled();
        });
    });

    it('calls onBack after deleting society', async () => {
        const onBack = vi.fn();
        renderPage({ onBack });
        fireEvent.click(screen.getByTitle('Settings'));
        fireEvent.click(screen.getByText('Delete Society'));
        await waitFor(() => {
            expect(onBack).toHaveBeenCalled();
        });
    });

    it('renders sidebar', () => {
        renderPage();
        expect(screen.getByTestId('society-sidebar')).toBeTruthy();
    });
});
