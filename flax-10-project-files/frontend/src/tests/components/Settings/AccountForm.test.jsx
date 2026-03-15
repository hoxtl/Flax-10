import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AccountForm from '../../../components/Settings/AccountForm';

vi.mock('../../../api/userService', () => ({
    getUserProfile: vi.fn(),
}));

vi.mock('../../../lib/kclCourses', () => ({
    KCL_DEPARTMENTS: {
        'Science': ['Physics', 'Chemistry'],
        'Arts': ['English', 'History'],
    },
}));

import { getUserProfile } from '../../../api/userService';

describe('AccountForm', () => {
    const user = {
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'alice@example.com',
        year: 'Year 2',
        major: '',
    };

    beforeEach(() => {
        getUserProfile.mockResolvedValue({ year: 'Year 2', major: '' });
    });

    it('renders personal info fields', async () => {
        render(<AccountForm user={user} onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByDisplayValue('Alice')).toBeTruthy();
            expect(screen.getByDisplayValue('Smith')).toBeTruthy();
        });
    });

    it('renders email field', async () => {
        render(<AccountForm user={user} onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByDisplayValue('alice@example.com')).toBeTruthy();
        });
    });

    it('renders Save Changes button', async () => {
        render(<AccountForm user={user} onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Save Changes' })).toBeTruthy();
        });
    });

    it('shows Saving... when isSaving', async () => {
        render(<AccountForm user={user} onSave={vi.fn()} isSaving={true} />);
        await waitFor(() => {
            expect(screen.getByText('Saving...')).toBeTruthy();
        });
    });

    it('shows locked course field when user has major', async () => {
        getUserProfile.mockResolvedValueOnce({ year: 'Year 1', major: 'Physics' });
        render(<AccountForm user={{ ...user, major: 'Physics' }} onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText('Physics')).toBeTruthy();
            expect(screen.getByText(/cannot be changed after/)).toBeTruthy();
        });
    });

    it('shows editable course field when user has no major', async () => {
        getUserProfile.mockResolvedValueOnce({ year: 'Year 1', major: '' });
        render(<AccountForm user={user} onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByText(/Choose carefully/)).toBeTruthy();
        });
    });

    it('calls onSave with form data when submitted', async () => {
        const onSave = vi.fn();
        const { container } = render(<AccountForm user={user} onSave={onSave} isSaving={false} />);
        await waitFor(() => screen.getByDisplayValue('Alice'));
        fireEvent.submit(container.querySelector('form'));
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            firstName: 'Alice',
            lastName: 'Smith',
        }));
    });

    it('handles getUserProfile error gracefully', async () => {
        getUserProfile.mockRejectedValueOnce(new Error('Network error'));
        render(<AccountForm user={user} onSave={vi.fn()} isSaving={false} />);
        await waitFor(() => {
            expect(screen.getByDisplayValue('Alice')).toBeTruthy();
        });
    });
});
