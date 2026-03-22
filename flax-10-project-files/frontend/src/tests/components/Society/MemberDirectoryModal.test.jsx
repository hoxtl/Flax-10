import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MemberDirectoryModal from '../../../components/Society/SocietyDetail/MemberDirectoryModal';

vi.mock('../../../components/Common/GenericSummaryModal/GenericSummaryModal', () => ({
    default: ({ title, subtitle, emptyMessage, topContent, items, renderItem, children }) => {
        const hasItems = items && items.length > 0;
        const listContent = children || (renderItem && items?.map(renderItem));
        return (
            <div data-testid="generic-modal">
                <h2>{title}</h2>
                <p>{subtitle}</p>
                {topContent}
                {!hasItems ? <span>{emptyMessage}</span> : listContent}
            </div>
        );
    },
}));
vi.mock('../../../components/Common/GenericSummaryModal/SummaryItem', () => ({
    default: ({ title, rightAction, onClick }) => (
        <div data-testid="summary-item" onClick={onClick}>
            {title}
            {rightAction}
        </div>
    ),
}));
vi.mock('../../../components/Common/SearchBar/SearchBar', () => ({
    default: ({ value, onChange, placeholder }) => (
        <input data-testid="search-bar" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    ),
}));
vi.mock('../../../components/Common/UserAvatar/UserAvatar', () => ({
    default: () => <span data-testid="avatar" />,
}));
vi.mock('../../../context/ConfirmContext', () => ({
    useConfirm: vi.fn(),
}));
vi.mock('../../../hooks/useSearchFilter', () => ({
    useSearchFilter: vi.fn((members) => members || []),
}));

import { useConfirm } from '../../../context/ConfirmContext';
import { useSearchFilter } from '../../../hooks/useSearchFilter';

describe('MemberDirectoryModal', () => {
    const members = [
        { user: 1, username: 'alice', role: 'admin' },
        { user: 2, username: 'bob', role: 'member' },
    ];
    let onClose, onRemoveMember, onFetchMembers;

    beforeEach(() => {
        onClose = vi.fn();
        onRemoveMember = vi.fn();
        onFetchMembers = vi.fn().mockResolvedValue(undefined);
        vi.mocked(useConfirm).mockReturnValue(vi.fn().mockResolvedValue(false));
        vi.mocked(useSearchFilter).mockImplementation((m) => m || []);
    });

    it('renders modal with society name and members', () => {
        render(<MemberDirectoryModal societyName="Chess Club" members={members} onClose={onClose} />);
        expect(screen.getByText('Members of Chess Club')).toBeInTheDocument();
        expect(screen.getByText('View everyone in this society')).toBeInTheDocument();
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
        expect(screen.getAllByTestId('summary-item')).toHaveLength(2);
    });

    it('shows loading message when loading', () => {
        vi.mocked(useSearchFilter).mockReturnValue([]);
        const neverResolve = () => new Promise(() => {});
        render(<MemberDirectoryModal societyName="X" members={[]} onFetchMembers={neverResolve} onClose={onClose} />);
        expect(screen.getByText('Loading members...')).toBeInTheDocument();
    });

    it('shows No members found when not loading and empty', async () => {
        vi.mocked(useSearchFilter).mockReturnValue([]);
        const resolveNow = vi.fn().mockResolvedValue(undefined);
        render(<MemberDirectoryModal societyName="X" members={[]} onFetchMembers={resolveNow} onClose={onClose} />);
        await waitFor(() => expect(screen.getByText('No members found.')).toBeInTheDocument());
    });

    it('calls onRemoveMember when confirm is accepted', async () => {
        const confirm = vi.fn().mockResolvedValue(true);
        vi.mocked(useConfirm).mockReturnValue(confirm);
        render(<MemberDirectoryModal societyName="Club" members={members} onRemoveMember={onRemoveMember} isAdmin onClose={onClose} />);
        const removeButtons = screen.getAllByLabelText('Remove member');
        expect(removeButtons.length).toBeGreaterThanOrEqual(1);
        fireEvent.click(removeButtons[0]);
        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Remove Member', confirmText: 'Remove', confirmStyle: 'danger' }));
        await vi.waitFor(() => expect(onRemoveMember).toHaveBeenCalledWith(1));
    });

    it('does not call onRemoveMember when confirm is cancelled', async () => {
        const confirm = vi.fn().mockResolvedValue(false);
        vi.mocked(useConfirm).mockReturnValue(confirm);
        render(<MemberDirectoryModal societyName="Club" members={members} onRemoveMember={onRemoveMember} isAdmin onClose={onClose} />);
        const removeButtons = screen.getAllByLabelText('Remove member');
        fireEvent.click(removeButtons[0]);
        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(onRemoveMember).not.toHaveBeenCalled();
    });

    it('does not render remove button when not admin', () => {
        render(<MemberDirectoryModal societyName="Club" members={members} onClose={onClose} isAdmin={false} />);
        expect(screen.queryByLabelText('Remove member')).not.toBeInTheDocument();
    });

    it('dispatches navigate event when member item is clicked', () => {
        const spy = vi.fn();
        window.addEventListener('navigate', spy);
        render(<MemberDirectoryModal societyName="Club" members={members} onClose={onClose} />);
        const items = screen.getAllByTestId('summary-item');
        fireEvent.click(items[0]);
        expect(spy).toHaveBeenCalledWith(expect.objectContaining({ detail: 'profile_1' }));
        window.removeEventListener('navigate', spy);
    });
});
