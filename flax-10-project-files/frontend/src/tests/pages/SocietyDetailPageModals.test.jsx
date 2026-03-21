import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SocietyDetailPage from '../../pages/Societies/SocietyDetailPage';
import { useSocietyDetail } from '../../components/Society/hooks/useSocietyDetail';

vi.mock('../../components/Society/hooks/useSocietyDetail', () => ({
    useSocietyDetail: vi.fn(),
}));
vi.mock('../../components/Society/hooks/useChangeTracker', () => ({
    useChangeTracker: vi.fn(() => ({
        trackEvent: vi.fn(),
        trackAnnouncement: vi.fn(),
    })),
}));
vi.mock('../../components/Society/hooks/useSocietySubscription', () => ({
    useSocietySubscription: () => ({ isSubscribed: false, toggleSubscription: vi.fn() }),
}));
vi.mock('../../components/Society/hooks/useUnreportSociety', () => ({
    useUnreportSociety: () => vi.fn(),
}));

// Mock Modals
vi.mock('../../components/Society/SocietyDetail/imageHandlers/CoverImageModal', () => ({
    default: ({ onClose, onUpdate }) => (
        <div data-testid="cover-modal">
            <button onClick={onClose}>Close</button>
            <button onClick={() => onUpdate(['img1'])}>Save</button>
        </div>
    ),
}));
vi.mock('../../components/Society/SocietyDetail/imageHandlers/ImageGalleryModal', () => ({
    default: ({ onClose }) => (
        <div data-testid="gallery-modal">
            Gallery Modal Mock
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));
vi.mock('../../components/Society/SocietyDetail/SettingsModal', () => ({
    default: ({ onClose, onDelete }) => (
        <div data-testid="settings-modal"><button onClick={onClose}>Close</button><button onClick={onDelete}>Delete</button></div>
    ),
}));
vi.mock('../../components/Society/SocietyDetail/ReportSocietyModal', () => ({
    default: ({ onClose, onReportSuccess }) => (
        <div data-testid="report-modal"><button onClick={onClose}>Close</button><button onClick={onReportSuccess}>Success</button></div>
    ),
}));
vi.mock('../../components/Society/SocietyDetail/MemberDirectoryModal', () => ({
    default: ({ onClose }) => <div data-testid="members-modal"><button onClick={onClose}>Close</button></div>,
}));
vi.mock('../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementModal', () => ({
    default: ({ onClose, onSubmit, onDelete }) => (
        <div data-testid="announce-modal">
            <button onClick={onClose}>Close</button>
            <button onClick={() => onSubmit({ id: 1, title: 'A' }, null)}>Submit</button>
            <button onClick={() => onSubmit({ id: 1, title: 'A' }, { id: 2, pinned: true })}>Conflict</button>
            <button onClick={() => onDelete(1)}>Delete</button>
        </div>
    ),
}));

// Mock Hero/Info just enough to trigger modals
vi.mock('../../components/Society/SocietyDetail/SocietyHero', () => ({
    default: ({ society, onUpdateName, onImageClick, onEditImages }) => (
        <div data-testid="hero">
            <span>{society?.name || 'Hero Mock'}</span>
            <button onClick={() => onUpdateName?.('New Name')}>update-name</button>
            <button onClick={() => onImageClick(0)}>Gallery</button>
            <button onClick={onEditImages}>Cover</button>
        </div>
    ),
}));
vi.mock('../../components/Society/SocietyDetail/SocietyInfo', () => ({
    default: ({ onViewMembers }) => (
        <div><button onClick={onViewMembers}>Members</button></div>
    ),
}));
vi.mock('../../components/Society/SocietyDetail/tabs/SocietyTabs', () => ({
    default: ({ onEditAnnouncement }) => (
        <div><button onClick={() => onEditAnnouncement({ id: 1 })}>Edit Ann</button></div>
    ),
}));

const mockSoc = { id: 1, name: 'Soc', role: 'admin', images: [], announcements: [], tags: [] };

describe('SocietyDetailPage Modals', () => {
    let mockData;
    beforeEach(() => {
        vi.clearAllMocks();
        mockData = {
            society: mockSoc, loading: false, updateSociety: vi.fn(), updateLocalSociety: vi.fn(),
            deleteSociety: vi.fn().mockResolvedValue({}), fetchMembers: vi.fn(),
            updateAnnouncement: vi.fn(), addAnnouncement: vi.fn(), deleteAnnouncement: vi.fn()
        };
        useSocietyDetail.mockReturnValue(mockData);
    });

    it('manages gallery modal', () => {
        render(<MemoryRouter><SocietyDetailPage societyId={1} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Gallery'));
        expect(screen.getByTestId('gallery-modal')).toBeTruthy();
        fireEvent.click(screen.getByText('Close'));
        expect(screen.queryByTestId('gallery-modal')).toBeNull();
    });

    it('EditableName: clicking update-name calls updateSociety', async () => {
        render(<MemoryRouter><SocietyDetailPage societyId={1} /></MemoryRouter>);
        fireEvent.click(screen.getByText('update-name'));
        expect(mockData.updateSociety).toHaveBeenCalledWith({ name: 'New Name' });
    });

    it('manages cover modal', () => {
        render(<MemoryRouter><SocietyDetailPage societyId={1} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Cover'));
        fireEvent.click(screen.getByText('Save'));
        expect(mockData.updateSociety).toHaveBeenCalledWith({ images: ['img1'], image: 'img1' });
    });

    it('manages announcement modal workflows', () => {
        render(<MemoryRouter><SocietyDetailPage societyId={1} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Edit Ann'));
        fireEvent.click(screen.getByText('Submit'));
        expect(mockData.updateAnnouncement).toHaveBeenCalled();
        
        fireEvent.click(screen.getByText('Edit Ann'));
        fireEvent.click(screen.getByText('Conflict'));
        expect(mockData.updateAnnouncement).toHaveBeenCalledTimes(3); // Conflict + Update
        
        fireEvent.click(screen.getByText('Edit Ann'));
        fireEvent.click(screen.getByText('Delete'));
        expect(mockData.deleteAnnouncement).toHaveBeenCalled();
    });
});
