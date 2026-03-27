import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
<<<<<<< HEAD:flax-10-project-files/frontend/src/tests/components/settings/SecurityForm.test.jsx
import SecurityForm from '../../../components/settings/components/SecurityForm';
=======
import SecurityForm from '../../../components/settings/SecurityForm';
>>>>>>> main:flax-10-project-files/frontend/src/tests/components/Settings/SecurityForm.test.jsx

describe('SecurityForm', () => {
    it('renders password fields', () => {
        render(<SecurityForm onSave={vi.fn()} isSaving={false} />);
        expect(screen.getByLabelText('New Password')).toBeTruthy();
        expect(screen.getByLabelText('Confirm New Password')).toBeTruthy();
    });

    it('renders Change Password button', () => {
        render(<SecurityForm onSave={vi.fn()} isSaving={false} />);
        expect(screen.getByRole('button', { name: 'Change Password' })).toBeTruthy();
    });

    it('shows Changing... when saving', () => {
        render(<SecurityForm onSave={vi.fn()} isSaving={true} />);
        expect(screen.getByText('Changing...')).toBeTruthy();
    });

    it('renders error message when error is provided', () => {
        render(<SecurityForm onSave={vi.fn()} isSaving={false} error="Password too short" />);
        expect(screen.getByText('Password too short')).toBeTruthy();
    });

    it('calls onSave with form data on submit', () => {
        const onSave = vi.fn();
        const { container } = render(<SecurityForm onSave={onSave} isSaving={false} />);
        fireEvent.change(screen.getByLabelText('New Password'), { target: { name: 'newPassword', value: 'new123' } });
        fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { name: 'confirmPassword', value: 'new123' } });
        fireEvent.submit(container.querySelector('form'));
        expect(onSave).toHaveBeenCalledWith({
            newPassword: 'new123',
            confirmPassword: 'new123',
        });
    });

    it('shows saved tick after a successful password change', async () => {
        const onSave = vi.fn().mockResolvedValue(true);
        const { container } = render(<SecurityForm onSave={onSave} isSaving={false} />);
        fireEvent.change(screen.getByLabelText('New Password'), { target: { name: 'newPassword', value: 'new12345' } });
        fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { name: 'confirmPassword', value: 'new12345' } });
        fireEvent.submit(container.querySelector('form'));
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /saved!/i })).toBeTruthy();
        });
    });
});
