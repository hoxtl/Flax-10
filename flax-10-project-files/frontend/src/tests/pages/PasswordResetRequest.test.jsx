import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PasswordResetRequest from '../../pages/Auth/PasswordResetRequest';

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

    function fillEmail(value) {
        fireEvent.change(screen.getByLabelText('Email Address'), { target: { value } });
    }

    function submitResetRequest() {
        fireEvent.submit(screen.getByRole('button', { name: 'Send Reset Link' }));
    }

    function mockFetchResponse(ok, payload) {
        fetch.mockResolvedValueOnce({ ok, json: async () => payload });
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
        fillEmail('test@example.com');
        expect(input.value).toBe('test@example.com');
    });

    it('shows loading state while submitting', async () => {
        fetch.mockImplementation(() => new Promise(() => {})); // never resolves
        renderPage();
        fillEmail('test@example.com');
        submitResetRequest();
        expect(screen.getByText('Sending...')).toBeTruthy();
    });

    it('shows success message on successful request', async () => {
        mockFetchResponse(true, { message: 'Check your email.' });
        renderPage();
        fillEmail('test@example.com');
        submitResetRequest();
        await waitFor(() => expect(screen.getByText('Check your email.')).toBeTruthy());
        expect(screen.getByText('✅ Email Sent!')).toBeTruthy();
    });

    it('clears email after successful request', async () => {
        mockFetchResponse(true, { message: 'Email sent.' });
        renderPage();
        const input = screen.getByLabelText('Email Address');
        fillEmail('test@example.com');
        submitResetRequest();
        await waitFor(() => expect(input.value).toBe(''));
    });

    it('shows error message on failed request', async () => {
        mockFetchResponse(false, { error: 'Email not found.' });
        renderPage();
        fillEmail('bad@example.com');
        submitResetRequest();
        await waitFor(() => expect(screen.getByText('Email not found.')).toBeTruthy());
    });

    it('shows fallback error when API returns no error field', async () => {
        mockFetchResponse(false, {});
        renderPage();
        fillEmail('bad@example.com');
        submitResetRequest();
        await waitFor(() => expect(screen.getByText('There was an error, please try again...')).toBeTruthy());
    });

    it('shows error on network failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));
        renderPage();
        fillEmail('test@example.com');
        submitResetRequest();
        await waitFor(() => expect(screen.getByText('There was an error, please try again...')).toBeTruthy());
    });
});
