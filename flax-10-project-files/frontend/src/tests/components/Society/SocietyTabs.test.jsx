import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../components/Society/SocietyDetail/tabs/AboutTab', () => ({
    default: ({ about }) => <div data-testid="about-tab">{about || 'About'}</div>,
}));

vi.mock('../../../components/Society/SocietyDetail/tabs/calendarTab/CalendarTab', () => ({
    default: () => <div data-testid="calendar-tab" />,
}));

vi.mock('../../../components/Society/SocietyDetail/tabs/announcementTab/AnnouncementsTab', () => ({
    default: () => <div data-testid="announcements-tab" />,
}));

import SocietyTabs from '../../../components/Society/SocietyDetail/tabs/SocietyTabs';

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
});
