import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../components/Society/society_detail/tabs/AboutTab', () => ({
    default: ({ about, onUpdate }) => (
        <div data-testid="about-tab">
            {about || 'About'}
            <button data-testid="update-about" onClick={() => onUpdate({ bio: 'new' })}>Update</button>
        </div>
    ),
}));

vi.mock('../../../components/Society/society_detail/tabs/calendar_tab/CalendarTab', () => ({
    default: ({ onViewAnnouncement }) => (
        <div data-testid="calendar-tab">
            <button data-testid="view-ann" onClick={() => onViewAnnouncement?.(5)}>View Ann</button>
        </div>
    ),
}));

vi.mock('../../../components/Society/society_detail/tabs/announcement_tab/AnnouncementsTab', () => ({
    default: () => <div data-testid="announcements-tab" />,
}));

import SocietyTabs from '../../../components/Society/society_detail/tabs/SocietyTabs';

const baseSociety = {
    id: 1,
    name: 'Chess Society',
    about: 'We love chess',
    admin_emails: 'admin@kcl.ac.uk',
    events: [],
    announcements: [],
    is_member: false,
};

describe('SocietyTabs', () => {
    it('renders tab bar with Calendar, About, Announcements', () => {
        render(<SocietyTabs activeTab="calendar" onTabChange={vi.fn()} society={baseSociety} />);
        expect(screen.getByText('Calendar')).toBeTruthy();
        expect(screen.getByText('About')).toBeTruthy();
        expect(screen.getByText('Announcements')).toBeTruthy();
    });

    it('renders CalendarTab by default', () => {
        render(<SocietyTabs activeTab="calendar" onTabChange={vi.fn()} society={baseSociety} />);
        expect(screen.getByTestId('calendar-tab')).toBeTruthy();
    });

    it('renders AboutTab when activeTab is about', () => {
        render(<SocietyTabs activeTab="about" onTabChange={vi.fn()} society={baseSociety} />);
        expect(screen.getByTestId('about-tab')).toBeTruthy();
    });

    it('renders AnnouncementsTab when activeTab is announcements', () => {
        render(<SocietyTabs activeTab="announcements" onTabChange={vi.fn()} society={baseSociety} />);
        expect(screen.getByTestId('announcements-tab')).toBeTruthy();
    });

    it('calls onTabChange when a tab button is clicked', () => {
        const onTabChange = vi.fn();
        render(<SocietyTabs activeTab="calendar" onTabChange={onTabChange} society={baseSociety} />);
        fireEvent.click(screen.getByText('About'));
        expect(onTabChange).toHaveBeenCalledWith('about');
    });

    it('onViewAnnouncement in CalendarTab calls onTabChange with announcements', () => {
        const onTabChange = vi.fn();
        render(<SocietyTabs activeTab="calendar" onTabChange={onTabChange} society={baseSociety} />);
        fireEvent.click(screen.getByTestId('view-ann'));
        expect(onTabChange).toHaveBeenCalledWith('announcements', 5);
    });

    it('AboutTab onUpdate callback calls outer onUpdate', () => {
        const onUpdate = vi.fn();
        render(<SocietyTabs activeTab="about" onTabChange={vi.fn()} society={baseSociety} onUpdate={onUpdate} />);
        fireEvent.click(screen.getByTestId('update-about'));
        expect(onUpdate).toHaveBeenCalledWith({ bio: 'new' });
    });
});
