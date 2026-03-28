import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../../../components/social/components/UserSearch', () => ({
    default: () => <div data-testid="mock-user-search" />,
}));

vi.mock('../../../../components/common/badge/Badge', () => ({
    default: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../../../components/common/primary_button/PrimaryButton', () => ({
    default: ({ children, onClick }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('../../../../components/common/search_empty_state/SearchEmptyState', () => ({
    default: () => <div>empty</div>,
}));

vi.mock('../../../../components/common/standard_modal/StandardModal', () => ({
    default: ({ title, children, onClose }) => (
        <div>
            <span>{title}</span>
            <button onClick={onClose}>Close</button>
            {children}
        </div>
    ),
}));

import AddCollaboratorModal from '../../../../components/society/components/AddCollaboratorModal';

describe('AddCollaboratorModal confirm guard', () => {
    it('returns early when confirm is triggered with no selected collaborators', () => {
        const onAdd = vi.fn();
        const onClose = vi.fn();

        render(<AddCollaboratorModal onClose={onClose} onAdd={onAdd} />);
        fireEvent.click(screen.getByText('Add'));

        expect(onAdd).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.queryByText(/Failed to add collaborator/i)).toBeNull();
    });
});
