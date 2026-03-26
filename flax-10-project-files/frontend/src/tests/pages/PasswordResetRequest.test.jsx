import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PasswordResetRequest from '../../pages/auth/PasswordResetRequest';

vi.mock('../../components/Auth/AuthHeroGeometric', () => ({ default: () => <div /> }));
vi.mock('../../components/Auth/AuthBranding', () => ({
    AuthBrand: () => <div />,
    AuthFooter: () => <div />,
}));

describe('PasswordResetRequest', () => {
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
                <PasswordResetRequest />
            </MemoryRouter>
        );
    }

    it('renders the page title', () => {
        renderPage();
        expect(screen.getByText('Reset Password')).toBeTruthy();
    });

    it('renders the email input', () => {
        renderPage();
        expect(screen.getByLabelText('Email Address')).toBeTruthy();
    });

    it('renders the Send Reset Link button', () => {
        renderPage();
        expect(screen.getByText('Send Reset Link')).toBeTruthy();
    });

    it('renders Back to Login link', () => {
        renderPage();
        expect(screen.getByText('Back to Login')).toBeTruthy();
    });

    it('updates email input value', () => {
        renderPage();
        const input = screen.getByLabelText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });
        expect(input.value).toBe('test@example.com');
    });

    it('shows loading state while submitting', async () => {
        fetch.mockImplementation(() => new Promise(() => {})); // never resolves
        renderPage();
        const input = screen.getByLabelText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }));
        expect(screen.getByText('Sending...')).toBeTruthy();
    });

    it('shows success message on successful request', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Check your email.' }),
        });
        renderPage();
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }));
        await waitFor(() => expect(screen.getByText('Check your email.')).toBeTruthy());
        expect(screen.getByText('✅ Email Sent!')).toBeTruthy();
    });

    it('clears email after successful request', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Email sent.' }),
        });
        renderPage();
        const input = screen.getByLabelText('Email Address');
        fireEvent.change(input, { target: { value: 'test@example.com' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }));
        await waitFor(() => expect(input.value).toBe(''));
    });

    it('shows error message on failed request', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Email not found.' }),
        });
        renderPage();
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'bad@example.com' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }));
        await waitFor(() => expect(screen.getByText('Email not found.')).toBeTruthy());
    });

    it('shows fallback error when API returns no error field', async () => {
        fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({}),
        });
        renderPage();
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'bad@example.com' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }));
        await waitFor(() => expect(screen.getByText('There was an error, please try again...')).toBeTruthy());
    });

    it('shows error on network failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));
        renderPage();
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
        fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }));
        await waitFor(() => expect(screen.getByText('There was an error, please try again...')).toBeTruthy());
    });
});
