import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SocietyDetailPage from '../../pages/Societies/SocietyDetailPage';
import { useSocietyDetail } from '../../components/Society/hooks/useSocietyDetail';

// Mock everything needed for basic render
vi.mock('../../components/Society/hooks/useSocietyDetail', () => ({
    useSocietyDetail: vi.fn(),
}));
vi.mock('../../components/Society/hooks/useChangeTracker', () => ({
    useChangeTracker: vi.fn(() => ({
        hasChanges: vi.fn(() => false),
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
vi.mock('../../api/societyApi', () => ({
    unreportSociety: vi.fn(),
}));

// Mock child components to keep it simple
vi.mock('../../components/Society/SocietyDetail/SocietyHero', () => ({
    default: ({ society }) => <div data-testid="hero">{society?.name}</div>,
}));
vi.mock('../../components/Society/SocietyDetail/SocietyInfo', () => ({
    default: () => <div data-testid="info" />,
}));
vi.mock('../../components/Society/SocietyDetail/tabs/SocietyTabs', () => ({
    default: () => <div data-testid="tabs" />,
}));
vi.mock('../../components/Society/SocietyDetail/SocietySidebar', () => ({
    default: () => <div data-testid="sidebar" />,
}));
vi.mock('../../pages/Societies/SocietySkeletons', () => ({
    SocietyDetailSkeleton: () => <div>Loading...</div>
}));

const mockSoc = { id: 1, name: 'Soc', role: 'member', images: [], announcements: [], tags: [] };

describe('SocietyDetailPage Basic Rendering', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useSocietyDetail.mockReturnValue({ society: mockSoc, loading: false, fetchMembers: vi.fn() });
    });

    it('renders basic layout', () => {
        render(<MemoryRouter><SocietyDetailPage societyId={1} onBack={vi.fn()} /></MemoryRouter>);
        expect(screen.getByTestId('hero')).toBeTruthy();
        expect(screen.getByTestId('info')).toBeTruthy();
        expect(screen.getByTestId('tabs')).toBeTruthy();
        expect(screen.getByTestId('sidebar')).toBeTruthy();
    });

    it('shows loading skeleton', () => {
        useSocietyDetail.mockReturnValue({ loading: true });
        render(<MemoryRouter><SocietyDetailPage societyId={1} onBack={vi.fn()} /></MemoryRouter>);
        expect(screen.getByText('Loading...')).toBeTruthy();
    });

    it('shows not found', () => {
        useSocietyDetail.mockReturnValue({ society: null, loading: false });
        render(<MemoryRouter><SocietyDetailPage societyId={1} onBack={vi.fn()} /></MemoryRouter>);
        expect(screen.getByText('Society not found.')).toBeTruthy();
    });

    it('calls onBack from NotFound page', () => {
        useSocietyDetail.mockReturnValue({ loading: false, society: null });
        const onBack = vi.fn();
        render(<MemoryRouter><SocietyDetailPage societyId={1} onBack={onBack} /></MemoryRouter>);
        fireEvent.click(screen.getByText('Back to Societies'));
        expect(onBack).toHaveBeenCalledTimes(1);
    });
});
