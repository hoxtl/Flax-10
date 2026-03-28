import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../../components/society/components/CategorySelector', () => ({
    default: ({ onChange }) => <div data-testid="category-selector"><button onClick={() => onChange(['Tech'])}>Select Cat</button></div>,
    CategoryDisplay: ({ category, editMode, onEdit }) => (
        <div data-testid="category-display">
            {(category || []).join(', ')}
            {editMode && <button data-testid="edit-category" onClick={onEdit}>✎</button>}
        </div>
    ),
}));

vi.mock('../../../../components/society/society_detail/SocietyInsightBanner', () => ({
    default: ({ society }) => <div data-testid="society-insight-banner">{society.name}</div>,
}));

import SocietyInfo from '../../../../components/society/society_detail/SocietyInfo';

const baseSociety = {
    id: 1,
    name: 'Chess Society',
    bio: 'We play chess',
    categories: ['Games'],
    member_count: 10,
    is_member: false,
};

describe('SocietyInfo', () => {
    function renderInfo(societyOverrides = {}, props = {}) {
        return render(
            <MemoryRouter>
                <SocietyInfo
                    society={{ ...baseSociety, ...societyOverrides }}
                    editMode={false}
                    showBio={false}
                    showLocation={false}
                    showMeta={false}
                    {...props}
                />
            </MemoryRouter>,
        );
    }

    it('renders nothing when no sections are enabled', () => {
        const { container } = renderInfo();
        expect(container.firstChild).toBeNull();
    });

    it('renders bio text', () => {
        renderInfo({}, { showBio: true });
        expect(screen.getByText('We play chess')).toBeTruthy();
    });

    it('does not render the society insight banner inside SocietyInfo', () => {
        renderInfo({}, { showBio: true, showMeta: true, showLocation: true });
        expect(screen.queryByTestId('society-insight-banner')).not.toBeInTheDocument();
    });

    it('renders Join Society button when not a member', () => {
        renderInfo({}, { showMeta: true, onJoin: vi.fn() });
        expect(screen.getByText('Join')).toBeTruthy();
    });

    it('renders Leave button when a member', () => {
        renderInfo({ is_member: true }, { showMeta: true, onLeave: vi.fn() });
        expect(screen.getByText('Leave')).toBeTruthy();
    });

    it('calls onJoin when Join Society button clicked', () => {
        const onJoin = vi.fn();
        renderInfo({}, { showMeta: true, onJoin });
        fireEvent.click(screen.getByText('Join'));
        expect(onJoin).toHaveBeenCalledOnce();
    });

    it('shows bio placeholder in edit mode with no bio', () => {
        renderInfo({ bio: '' }, { showBio: true, editMode: true });
        expect(screen.getByText('Add a bio description...')).toBeTruthy();
    });

    it('shows edit icon in edit mode and clicking enters edit mode', () => {
        renderInfo({}, { showBio: true, editMode: true, onUpdateSociety: vi.fn() });
        fireEvent.click(screen.getByTitle('Edit'));
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders category display', () => {
        renderInfo({}, { showMeta: true });
        expect(screen.getByTestId('category-display')).toBeTruthy();
    });

    it('renders empty bio wrapper when no bio and not edit mode', () => {
        const { container } = renderInfo({ bio: '' }, { showBio: true });
        const wrapper = container.querySelector('[class*="bioWrapper"]');
        expect(wrapper).toBeTruthy();
        expect(wrapper?.textContent?.trim()).toBe('');
    });

    it('BioEditor: enter edit mode, change value, Save calls onUpdateSociety', () => {
        const onUpdateSociety = vi.fn();
        renderInfo({}, { showBio: true, editMode: true, onUpdateSociety });
        fireEvent.click(screen.getByTitle('Edit'));
        const textarea = screen.getByRole('textbox');
        fireEvent.change(textarea, { target: { value: 'Updated bio' } });
        fireEvent.click(screen.getByText('Save'));
        expect(onUpdateSociety).toHaveBeenCalledWith({ bio: 'Updated bio' });
    });

    it('CategorySection: enter edit, select category, Save calls onUpdateSociety', () => {
        const onUpdateSociety = vi.fn();
        renderInfo({}, { showMeta: true, editMode: true, onUpdateSociety });
        fireEvent.click(screen.getByTestId('edit-category'));
        fireEvent.click(screen.getByText('Select Cat'));
        fireEvent.click(screen.getByText('Save'));
        expect(onUpdateSociety).toHaveBeenCalledWith({ categories: ['Tech'] });
    });

    it('shows NotificationBell and calls onToggleSubscription when member', () => {
        const onToggleSubscription = vi.fn();
        renderInfo(
            { is_member: true },
            { showMeta: true, isSubscribed: true, onToggleSubscription },
        );
        const bellBtn = screen.getByRole('button', { name: 'Notifications on' });
        fireEvent.click(bellBtn);
        expect(onToggleSubscription).toHaveBeenCalledOnce();
    });

    it('NotificationBell shows Notifications off when not subscribed', () => {
        renderInfo(
            { is_member: true },
            { showMeta: true, isSubscribed: false, onToggleSubscription: vi.fn() },
        );
        expect(screen.getByRole('button', { name: 'Notifications off' })).toBeTruthy();
    });

    it('disables notifications when the user is not a member', () => {
        renderInfo({}, { showMeta: true, isSubscribed: true, onToggleSubscription: vi.fn() });
        expect(screen.getByRole('button', { name: 'Join to manage notifications' })).toBeDisabled();
    });

    it('does not render the member count in the segmented pill', () => {
        renderInfo({}, { showMeta: true });
        expect(screen.queryByText(/10.*members/)).not.toBeInTheDocument();
    });

    it('canEdit shows Edit Society button and toggles edit mode', () => {
        const onToggleEditMode = vi.fn();
        renderInfo({}, { showMeta: true, canEdit: true, onToggleEditMode });
        fireEvent.click(screen.getByText('Edit Society'));
        expect(onToggleEditMode).toHaveBeenCalledOnce();
    });

    it('does not render the insight banner for admins editing the society', () => {
        renderInfo({ is_admin: true }, { showMeta: true, canEdit: true, onToggleEditMode: vi.fn() });
        expect(screen.queryByTestId('society-insight-banner')).not.toBeInTheDocument();
    });

    it('canEdit shows Done Editing when in edit mode', () => {
        renderInfo({}, { showMeta: true, editMode: true, canEdit: true, onToggleEditMode: vi.fn() });
        expect(screen.getByText('Done Editing')).toBeTruthy();
    });

    it('calls onLeave when Joined button clicked', () => {
        const onLeave = vi.fn();
        renderInfo({ is_member: true }, { showMeta: true, onLeave });
        fireEvent.click(screen.getByText('Leave'));
        expect(onLeave).toHaveBeenCalledOnce();
    });

    it('uses society.category when categories is empty', () => {
        renderInfo({ categories: undefined, category: 'Sports' }, { showMeta: true });
        expect(screen.getByTestId('category-display')).toHaveTextContent('Sports');
    });

    it('uses empty array when both categories and category are falsy', () => {
        renderInfo({ categories: undefined, category: undefined }, { showMeta: true });
        expect(screen.getByTestId('category-display')).toBeTruthy();
    });

    it('CategorySection handles null categories prop', () => {
        renderInfo({ categories: null }, { showMeta: true, editMode: true });
        expect(screen.getByTestId('category-display')).toBeTruthy();
    });

    it('does not render the Ratified label in the metadata pill', () => {
        renderInfo({ is_ratified: true }, { showMeta: true });
        expect(screen.queryByText('Ratified')).not.toBeInTheDocument();
    });

    it('CategorySection updates value when categories prop changes', () => {
        const { rerender } = render(
            <SocietyInfo society={{ ...baseSociety, categories: ['Sports'] }} editMode={true} />
        );
        rerender(
            <MemoryRouter>
                <SocietyInfo society={{ ...baseSociety, categories: ['Sports'] }} editMode={true} showMeta />
            </MemoryRouter>,
        );
        expect(screen.getByTestId('category-display')).toHaveTextContent('Sports');
        rerender(
            <MemoryRouter>
                <SocietyInfo society={{ ...baseSociety, categories: ['Arts'] }} editMode={true} showMeta />
            </MemoryRouter>,
        );
        expect(screen.getByTestId('category-display')).toHaveTextContent('Arts');
    });

    it('shows pending membership labels for join and leave actions', () => {
        const { rerender } = renderInfo({}, { showMeta: true, membershipAction: 'join' });
        expect(screen.getByRole('button', { name: 'Joining...' })).toBeDisabled();
        rerender(
            <MemoryRouter>
                <SocietyInfo
                    society={{ ...baseSociety, is_member: true }}
                    editMode={false}
                    showMeta
                    membershipAction="leave"
                />
            </MemoryRouter>,
        );
        expect(screen.getByRole('button', { name: 'Leaving...' })).toBeDisabled();
    });

    it('supports the hero layout modifier for the metadata pill', () => {
        const { rerender } = render(
            <MemoryRouter>
                <SocietyInfo society={{ ...baseSociety, categories: null }} editMode={true} showMeta layout="hero" />
            </MemoryRouter>,
        );
        expect(document.querySelector('[class*="metaPillHero"]')).toBeTruthy();
        rerender(
            <MemoryRouter>
                <SocietyInfo society={{ ...baseSociety, categories: ['Arts'] }} editMode={true} showMeta layout="hero" />
            </MemoryRouter>,
        );
        expect(screen.getByTestId('category-display')).toHaveTextContent('Arts');
    });

    it('initialises an empty bio editor value when the bio is null', () => {
        renderInfo({ bio: null }, { showBio: true, editMode: true, onUpdateSociety: vi.fn() });
        fireEvent.click(screen.getByTitle('Edit'));
        expect(screen.getByRole('textbox')).toHaveValue('');
    });

    it('opens the category editor when categories are null', () => {
        renderInfo({ categories: null }, { showMeta: true, editMode: true, onUpdateSociety: vi.fn() });
        fireEvent.click(screen.getByTestId('edit-category'));
        expect(screen.getByText('Edit Categories')).toBeInTheDocument();
        expect(screen.getByTestId('category-selector')).toBeInTheDocument();
    });

    it('renders a map link when the society has a location', () => {
        renderInfo({ location: 'Bush House' }, { showLocation: true });
        expect(screen.getByLabelText('Open UniMap for Bush House')).toBeInTheDocument();
    });
});
