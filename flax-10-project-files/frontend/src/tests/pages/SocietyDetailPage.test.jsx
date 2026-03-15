import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SocietyDetailPage from '../../pages/Societies/SocietyDetailPage';

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useLocation: () => locationState };
});
let locationState = { state: null };

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

const mockConfirm = vi.fn();
vi.mock('../../context/ConfirmContext', () => ({
    useConfirm: () => mockConfirm,
}));

const unreportSocietyApiMock = vi.fn();
vi.mock('../../api/societyApi', () => ({
    unreportSociety: (...args) => unreportSocietyApiMock(...args),
}));

vi.mock('../../components/Society/hooks/useSocietySubscription', () => ({
    useSocietySubscription: () => ({ isSubscribed: false, toggleSubscription: vi.fn() }),
}));

vi.mock('../../components/Society/SocietyDetail/SocietyHero', () => ({
    default: ({ society, onImageClick, onEditImages }) => (
        <div data-testid="society-hero">
            {society.name}
            {onImageClick && <button onClick={onImageClick}>Open Gallery</button>}
            {onEditImages && <button onClick={onEditImages}>Edit Cover</button>}
        </div>
    ),
}));

vi.mock('../../components/Society/SocietyDetail/SocietyInfo', () => ({
    default: ({ society, onToggleEditMode, onViewMembers }) => (
        <div data-testid="society-info">
            <button onClick={onToggleEditMode}>Toggle Edit</button>
            {onViewMembers && <button onClick={onViewMembers}>View Members</button>}
        </div>
    ),
}));

vi.mock('../../components/Society/SocietyDetail/tabs/SocietyTabs', () => ({
    default: ({ onEditAnnouncement }) => (
        <div data-testid="society-tabs">
            {onEditAnnouncement && <button onClick={() => onEditAnnouncement({ id: 1, title: 'Edit Me' })}>Edit Announcement</button>}
        </div>
    ),
}));

vi.mock('../../components/Society/SocietyDetail/SocietySidebar', () => ({
    default: () => <div data-testid="society-sidebar" />,
}));

vi.mock('../../components/Society/SocietyDetail/imageHandlers/CoverImageModal', () => ({
    default: ({ onClose, onUpdate }) => (
        <div data-testid="cover-modal">
            <button onClick={onClose}>Close Cover</button>
            <button onClick={() => onUpdate([{ url: 'https://example.com/1.jpg' }])}>Save Cover</button>
        </div>
    ),
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
    default: ({ onClose, onSubmit, onDelete }) => (
        <div data-testid="announcement-modal">
            <button onClick={onClose}>Close Announcement</button>
            <button onClick={() => onSubmit({ id: 1, title: 'A' }, null)}>Submit Update</button>
            <button onClick={() => onSubmit({ title: 'New Announcement' }, null)}>Submit New</button>
            <button onClick={() => onSubmit({ id: 2, title: 'B' }, { id: 99, pinned: true })}>Submit With Conflict</button>
            {onDelete && <button onClick={() => onDelete(1, 'Edit Me')}>Delete Announcement</button>}
        </div>
    ),
}));

vi.mock('../../components/Society/SocietyDetail/ReportSocietyModal', () => ({
    default: ({ onClose, onReportSuccess }) => (
        <div data-testid="report-modal">
            <button onClick={onClose}>Close Report</button>
            <button onClick={onReportSuccess}>Report Success</button>
        </div>
    ),
}));

vi.mock('../../components/Society/SocietyDetail/MemberDirectoryModal', () => ({
    default: ({ onClose }) => (
        <div data-testid="members-modal">
            <button onClick={onClose}>Close Members</button>
        </div>
    ),
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
        locationState = { state: null };
        useSocietyDetail.mockReturnValue(mockHookData);
        mockConfirm.mockResolvedValue(false);
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

    it('opens report modal when report button is clicked', () => {
        renderPage();
        fireEvent.click(screen.getByTitle('Report Society'));
        expect(screen.getByTestId('report-modal')).toBeTruthy();
    });

    it('shows unreport title when society has been reported', () => {
        useSocietyDetail.mockReturnValue({
            ...mockHookData,
            society: { ...mockHookData.society, has_reported: true },
        });
        renderPage();
        expect(screen.getByTitle('You have reported this society. Click to unreport.')).toBeTruthy();
    });

    it('calls unreport and updateLocalSociety when unreport is clicked and user confirms', async () => {
        const updateLocalSociety = vi.fn();
        useSocietyDetail.mockReturnValue({
            ...mockHookData,
            society: { ...mockHookData.society, has_reported: true },
            updateLocalSociety,
        });
        mockConfirm.mockResolvedValue(true);
        unreportSocietyApiMock.mockResolvedValue(undefined);
        renderPage();
        fireEvent.click(screen.getByTitle('You have reported this society. Click to unreport.'));
        await waitFor(() => {
            expect(mockConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Unreport Society' }));
        });
        await waitFor(() => {
            expect(unreportSocietyApiMock).toHaveBeenCalledWith(1);
            expect(updateLocalSociety).toHaveBeenCalledWith({ has_reported: false });
        });
    });

    it('opens gallery modal when hero image is clicked', () => {
        renderPage();
        fireEvent.click(screen.getByText('Open Gallery'));
        expect(screen.getByTestId('gallery-modal')).toBeTruthy();
    });

    it('closes gallery modal', () => {
        renderPage();
        fireEvent.click(screen.getByText('Open Gallery'));
        fireEvent.click(screen.getByText('Close Gallery'));
        expect(screen.queryByTestId('gallery-modal')).toBeNull();
    });

    it('opens cover modal when edit images is clicked', () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Cover'));
        expect(screen.getByTestId('cover-modal')).toBeTruthy();
    });

    it('opens members modal when view members is clicked', () => {
        renderPage();
        fireEvent.click(screen.getByText('View Members'));
        expect(screen.getByTestId('members-modal')).toBeTruthy();
    });

    it('uses initialTab and location state for activeTab when provided', () => {
        locationState = { state: { activeTab: 'about', announcementId: 'a1' } };
        renderPage({ initialTab: 'announcements' });
        expect(screen.getByTestId('society-tabs')).toBeTruthy();
    });

    it('announcement submit with conflict calls updateAnnouncement for conflict and data', async () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Announcement'));
        expect(screen.getByTestId('announcement-modal')).toBeTruthy();
        fireEvent.click(screen.getByText('Submit With Conflict'));
        await waitFor(() => {
            expect(mockHookData.updateAnnouncement).toHaveBeenCalledWith(99, expect.objectContaining({ pinned: false }), false);
            expect(mockHookData.updateAnnouncement).toHaveBeenCalledWith(2, expect.objectContaining({ title: 'B' }), false);
        });
        expect(screen.queryByTestId('announcement-modal')).toBeNull();
    });

    it('announcement submit without conflict calls addAnnouncement for new data', async () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Announcement'));
        fireEvent.click(screen.getByText('Submit New'));
        await waitFor(() => {
            expect(mockHookData.addAnnouncement).toHaveBeenCalledWith(expect.objectContaining({ title: 'New Announcement' }), false);
        });
        expect(screen.queryByTestId('announcement-modal')).toBeNull();
    });

    it('cover modal onUpdate calls updateSociety with images', async () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Cover'));
        fireEvent.click(screen.getByText('Save Cover'));
        expect(mockHookData.updateSociety).toHaveBeenCalledWith({
            images: [{ url: 'https://example.com/1.jpg' }],
            image: { url: 'https://example.com/1.jpg' },
        });
    });

    it('unreport error path does not call updateLocalSociety when API fails', async () => {
        const updateLocalSociety = vi.fn();
        useSocietyDetail.mockReturnValue({
            ...mockHookData,
            society: { ...mockHookData.society, has_reported: true },
            updateLocalSociety,
        });
        mockConfirm.mockResolvedValue(true);
        unreportSocietyApiMock.mockRejectedValue(new Error('Network error'));
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        renderPage();
        fireEvent.click(screen.getByTitle('You have reported this society. Click to unreport.'));
        await waitFor(() => expect(unreportSocietyApiMock).toHaveBeenCalledWith(1));
        expect(updateLocalSociety).not.toHaveBeenCalled();
        errSpy.mockRestore();
    });

    it('does not call unreport when user cancels confirm', async () => {
        const updateLocalSociety = vi.fn();
        useSocietyDetail.mockReturnValue({
            ...mockHookData,
            society: { ...mockHookData.society, has_reported: true },
            updateLocalSociety,
        });
        mockConfirm.mockResolvedValue(false);
        renderPage();
        fireEvent.click(screen.getByTitle('You have reported this society. Click to unreport.'));
        await waitFor(() => expect(mockConfirm).toHaveBeenCalled());
        expect(unreportSocietyApiMock).not.toHaveBeenCalled();
    });

    it('report modal onReportSuccess updates local society', () => {
        const updateLocalSociety = vi.fn();
        useSocietyDetail.mockReturnValue({
            ...mockHookData,
            updateLocalSociety,
        });
        renderPage();
        fireEvent.click(screen.getByTitle('Report Society'));
        fireEvent.click(screen.getByText('Report Success'));
        expect(updateLocalSociety).toHaveBeenCalledWith({ has_reported: true });
    });

    it('announcement modal onDelete closes and calls deleteAnnouncement', async () => {
        renderPage();
        fireEvent.click(screen.getByText('Edit Announcement'));
        fireEvent.click(screen.getByText('Delete Announcement'));
        await waitFor(() => expect(mockHookData.deleteAnnouncement).toHaveBeenCalledWith(1, false));
        expect(screen.queryByTestId('announcement-modal')).toBeNull();
    });

    it('reads activeTab from search params', () => {
        render(
            <MemoryRouter initialEntries={['/society/1?tab=about']}>
                <SocietyDetailPage societyId={1} onBack={vi.fn()} />
            </MemoryRouter>
        );
        expect(screen.getByTestId('society-tabs')).toBeTruthy();
    });

    it('closes members modal', () => {
        renderPage();
        fireEvent.click(screen.getByText('View Members'));
        fireEvent.click(screen.getByText('Close Members'));
        expect(screen.queryByTestId('members-modal')).toBeNull();
    });

    it('members modal shows for editor role', () => {
        useSocietyDetail.mockReturnValue({
            ...mockHookData,
            society: { ...mockHookData.society, role: 'editor' },
        });
        renderPage();
        fireEvent.click(screen.getByText('View Members'));
        expect(screen.getByTestId('members-modal')).toBeTruthy();
    });
});
