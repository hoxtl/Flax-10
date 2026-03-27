import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PasswordResetConfirm from '../../pages/auth/PasswordResetConfirm';

vi.mock('../../components/Auth/AuthHeroGeometric', () => ({ default: () => <div /> }));
vi.mock('../../components/Auth/AuthBranding', () => ({
    AuthBrand: () => <div />,
    AuthFooter: () => <div />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate, useParams: () => ({ token: 'test-token' }) };
});

describe('PasswordResetConfirm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    function renderPage() {
        return render(
            <MemoryRouter>
                <PasswordResetConfirm />
            </MemoryRouter>
        );
    }

    function fillPasswordForm(newPassword, confirmPassword = newPassword) {
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: newPassword, name: 'new_password' } });
        fireEvent.change(screen.getByLabelText('Confirm New Password'), { target: { value: confirmPassword, name: 'confirm_password' } });
    }

    function submitPasswordReset() {
        fireEvent.submit(screen.getByRole('button', { name: 'Reset Password' }));
    }

    function mockFetchResponse(ok, payload) {
        fetch.mockResolvedValueOnce({ ok, json: async () => payload });
    }

    it('renders the page title', () => {
        renderPage();
        expect(screen.getByText('Reset Your Password')).toBeTruthy();
    });

    it('renders password fields', () => {
        renderPage();
        expect(screen.getByLabelText('New Password')).toBeTruthy();
        expect(screen.getByLabelText('Confirm New Password')).toBeTruthy();
    });

    it('renders Reset Password button', () => {
        renderPage();
        expect(screen.getByRole('button', { name: 'Reset Password' })).toBeTruthy();
    });

    it('updates password fields', () => {
        renderPage();
        fillPasswordForm('pass1234');
        expect(screen.getByLabelText('New Password').value).toBe('pass1234');
        expect(screen.getByLabelText('Confirm New Password').value).toBe('pass1234');
    });

    it('shows password mismatch error', async () => {
        renderPage();
        fillPasswordForm('pass1234', 'different');
        submitPasswordReset();
        expect(screen.getByText('The two passwords do not match!')).toBeTruthy();
    });

    it('clears password error when a field changes', async () => {
        renderPage();
        fillPasswordForm('pass1234', 'different');
        submitPasswordReset();
        expect(screen.getByText('The two passwords do not match!')).toBeTruthy();
        fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'pass12345', name: 'new_password' } });
        expect(screen.queryByText('The two passwords do not match!')).toBeNull();
    });

    it('shows success message on successful reset', async () => {
        mockFetchResponse(true, { message: 'Password reset successfully.' });
        renderPage();
        fillPasswordForm('pass1234');
        submitPasswordReset();
        await waitFor(() => expect(screen.getByText('Password reset successfully.')).toBeTruthy());
        expect(screen.getByText('✅ Success!')).toBeTruthy();
    });

    it('hides form on successful reset', async () => {
        mockFetchResponse(true, { message: 'Password reset successfully.' });
        renderPage();
        fillPasswordForm('pass1234');
        submitPasswordReset();
        await waitFor(() => expect(screen.getByText('✅ Success!')).toBeTruthy());
        // Form is hidden after success
        expect(screen.queryByLabelText('New Password')).toBeNull();
    });

    it('shows error on failed reset', async () => {
        mockFetchResponse(false, { error: 'Token expired.' });
        renderPage();
        fillPasswordForm('pass1234');
        submitPasswordReset();
        await waitFor(() => expect(screen.getByText('Token expired.')).toBeTruthy());
    });

    it('shows fallback error from confirm_password field', async () => {
        mockFetchResponse(false, { confirm_password: 'Passwords do not match on server.' });
        renderPage();
        fillPasswordForm('pass1234');
        submitPasswordReset();
        await waitFor(() => expect(screen.getByText('Passwords do not match on server.')).toBeTruthy());
    });

    it('shows network error message on exception', async () => {
        fetch.mockRejectedValueOnce(new Error('Network down'));
        renderPage();
        fillPasswordForm('pass1234');
        submitPasswordReset();
        await waitFor(() => expect(screen.getByText('Network error. Please try again.')).toBeTruthy());
    });

    it('shows loading state during submission', async () => {
        fetch.mockImplementation(() => new Promise(() => {}));
        renderPage();
        fillPasswordForm('pass1234');
        submitPasswordReset();
        expect(screen.getByText('Resetting Password...')).toBeTruthy();
    });

    it('shows fallback error when API returns ok:false with no error or confirm_password', async () => {
        mockFetchResponse(false, {});
        renderPage();
        fillPasswordForm('pass1234');
        submitPasswordReset();
        await waitFor(() => expect(screen.getByText('Failed to reset password')).toBeTruthy());
    });

    it('navigates to /login after successful reset (after 2s)', async () => {
        mockFetchResponse(true, { message: 'Password reset successfully.' });
        renderPage();
        fillPasswordForm('pass1234');
        submitPasswordReset();
        await waitFor(() => expect(screen.getByText('✅ Success!')).toBeTruthy());
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/login'), { timeout: 3000 });
    }, 5000);
});
