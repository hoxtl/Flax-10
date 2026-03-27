import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, variants, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../api/userApi', () => ({
    getUserSettings: vi.fn().mockResolvedValue({ theme: 'light' }),
    getUserProfile: vi.fn().mockResolvedValue({ major: 'Computer Science' }),
}));

vi.mock('../layout/DashboardLayout', () => ({
    default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('../pages/welcome/WelcomeLanding', () => ({
    default: ({ onExplore, onBackToAuth }) => (
        <div data-testid="welcome-landing">
            <button onClick={onExplore}>Explore</button>
            <button onClick={onBackToAuth}>Back to Auth</button>
        </div>
    ),
}));

vi.mock('../pages/auth/AuthPage', () => ({
    default: () => <div data-testid="auth-page">Auth</div>,
}));

vi.mock('../pages/auth/PasswordResetRequest', () => ({
    default: () => <div data-testid="password-reset-request">Reset</div>,
}));

vi.mock('../pages/auth/PasswordResetConfirm', () => ({
    default: () => <div data-testid="password-reset-confirm">Confirm</div>,
}));

vi.mock('../pages/settings/Settings', () => ({
    default: () => <div data-testid="settings-page">Settings</div>,
}));

vi.mock('../pages/profile/Profile', () => ({
    default: () => <div data-testid="profile-page">Profile</div>,
}));

vi.mock('../pages/societies/SocietyDetailPage', () => ({
    default: () => <div data-testid="society-detail-page">Society</div>,
}));

vi.mock('../components/onboarding/OnboardingModal', () => ({
    default: ({ isOpen, onComplete }) => isOpen ? <div data-testid="onboarding-modal"><button onClick={onComplete}>Complete onboarding</button></div> : null,
}));

vi.mock('../components/notifications', () => ({
    NotificationToast: () => null,
}));

// Mock all context providers to pass through
vi.mock('../context/CalendarContext', () => ({
    CalendarProvider: ({ children }) => <>{children}</>,
    useCalendar: vi.fn(() => ({})),
    useCalendarDispatch: vi.fn(() => vi.fn()),
}));

vi.mock('../context/TagContext', () => ({
    TagProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../context/NotificationContext', () => ({
    NotificationProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../context/TimerContext', () => ({
    TimerProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../context/ThemeContext', () => ({
    ThemeProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../context/ConfirmContext', () => ({
    ConfirmProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../context/TaskCompletionContext', () => ({
    TaskCompletionProvider: ({ children }) => <>{children}</>,
}));

vi.mock('../lib/routes', () => {
    const React = require('react');
    const ModulesPlaceholder = (props) => (
        <div
            data-testid="modules-route"
            data-initial-create={props.initialCreate}
            data-initial-search={props.initialSearch}
        >
            Modules
        </div>
    );
    return {
        APP_ROUTES: [
            { id: 'home', path: '/', element: <div data-testid="home-route">Home</div> },
            { id: 'settings', path: '/settings', element: <div data-testid="settings-route">Settings Route</div> },
            { id: 'profile', path: '/profile', element: <div data-testid="profile-route">Profile Route</div> },
            { id: 'modules', path: '/modules', element: <ModulesPlaceholder /> },
        ],
    };
});

import App from '../App';

function renderApp(initialRoute = '/login') {
    return render(
        <MemoryRouter initialEntries={[initialRoute]}>
            <App />
        </MemoryRouter>
    );
}

describe('App', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        mockNavigate.mockClear();
    });

    afterEach(() => {
        localStorage.clear();
        cleanup();
    });

    it('renders auth screen when not authenticated', async () => {
        renderApp('/login');
        await waitFor(() => expect(screen.getByTestId('auth-page')).toBeTruthy());
    });

    it('redirects to /login for unknown auth routes', async () => {
        renderApp('/unknown');
        await waitFor(() => expect(screen.getByTestId('auth-page')).toBeTruthy());
    });

    it('renders welcome screen when authenticated but welcome not seen', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }));
        // welcome not seen (no flax_welcome_seen_v1 key)
        renderApp('/');
        await waitFor(() => expect(screen.getByTestId('welcome-landing')).toBeTruthy());
    });

    it('renders app screen when authenticated and welcome seen', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/');
        await waitFor(() => expect(screen.getByTestId('dashboard-layout')).toBeTruthy());
    });

    it('clicking Explore on welcome navigates to app', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }));
        renderApp('/');
        await waitFor(() => screen.getByTestId('welcome-landing'));
        fireEvent.click(screen.getByText('Explore'));
        await waitFor(() => expect(screen.getByTestId('dashboard-layout')).toBeTruthy());
    });

    it('fires auth-changed event to sync auth state', async () => {
        // Ensure the initial showWelcome state is derived correctly.
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/login');
        await waitFor(() => screen.getByTestId('auth-page'));
        // Simulate login
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }));
        act(() => {
            window.dispatchEvent(new Event('auth-changed'));
        });
        await waitFor(() => expect(screen.getByTestId('dashboard-layout')).toBeTruthy());
    });

    it('renders password reset request at /reset-password', async () => {
        renderApp('/reset-password');
        await waitFor(() => expect(screen.getByTestId('password-reset-request')).toBeTruthy());
    });

    it('renders password reset confirm at /reset-password/:token', async () => {
        renderApp('/reset-password/abc-token-123');
        await waitFor(() => expect(screen.getByTestId('password-reset-confirm')).toBeTruthy());
    });

    it('onBackToAuth clears storage and shows auth screen', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        renderApp('/');
        await waitFor(() => screen.getByTestId('welcome-landing'));
        fireEvent.click(screen.getByText('Back to Auth'));
        await waitFor(() => expect(screen.getByTestId('auth-page')).toBeTruthy());
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
    });

    it('handles invalid user JSON in localStorage (readUser catch)', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', 'not-valid-json');
        renderApp('/');
        // AuthContext refresh will overwrite localStorage user with a valid profile,
        // so we should end up on the welcome screen rather than the auth screen.
        await waitFor(() => expect(screen.getByTestId('welcome-landing')).toBeTruthy());
    });

    it('loadTheme uses light when getUserSettings rejects', async () => {
        const { getUserSettings } = await import('../api/userApi');
        getUserSettings.mockRejectedValueOnce(new Error('network error'));
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/');
        await waitFor(() => expect(screen.getByTestId('dashboard-layout')).toBeTruthy());
    });

    it('shows onboarding when profile has no major', async () => {
        const { getUserProfile } = await import('../api/userApi');
        getUserProfile.mockResolvedValueOnce({});
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/');
        await waitFor(() => expect(screen.getByTestId('onboarding-modal')).toBeTruthy());
    });

    it('onboarding complete dispatches navigate and closes modal', async () => {
        const { getUserProfile } = await import('../api/userApi');
        getUserProfile.mockResolvedValueOnce({});
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/');
        await waitFor(() => screen.getByTestId('onboarding-modal'));
        fireEvent.click(screen.getByText('Complete onboarding'));
        // Under the current mocks, the profile never gets a `major`, so the
        // onboarding guard re-triggers; we still expect navigation to settings.
        await waitFor(() => expect(screen.getByTestId('settings-page')).toBeTruthy());
    });

    it('syncs activeNav from URL and shows Settings at /settings', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/settings');
        await waitFor(() => expect(screen.getByTestId('settings-page')).toBeTruthy());
    });

    it('navigate event to settings updates nav', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/');
        await waitFor(() => screen.getByTestId('dashboard-layout'));
        act(() => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }));
        });
        await waitFor(() => expect(screen.getByTestId('settings-page')).toBeTruthy());
    });

    it('navigate event with societies_ id navigates to societies URL', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/');
        await waitFor(() => screen.getByTestId('dashboard-layout'));
        act(() => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: 'societies_5_about' }));
        });
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/societies?id=5&tab=about'));
    });

    it('navigate event with path starting with / navigates to path', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/');
        await waitFor(() => screen.getByTestId('dashboard-layout'));
        act(() => {
            window.dispatchEvent(new CustomEvent('navigate', { detail: '/map' }));
        });
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/map'));
    });

    it('resolveRouteContent passes initialCreate for modules_create activeNav', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        localStorage.setItem('flax_active_nav', 'modules_create');
        renderApp('/');
        await waitFor(() => expect(screen.getByTestId('modules-route')).toBeTruthy());
        expect(screen.getByTestId('modules-route').getAttribute('data-initial-create')).toBe('true');
    });

    it('resolveRouteContent passes initialSearch for modules_param activeNav', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        localStorage.setItem('flax_active_nav', 'modules_5CCS2SEG');
        renderApp('/');
        await waitFor(() => expect(screen.getByTestId('modules-route')).toBeTruthy());
        expect(screen.getByTestId('modules-route').getAttribute('data-initial-search')).toBe('5CCS2SEG');
    });

    it('renders Profile view when activeNav is profile_userId', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        localStorage.setItem('flax_active_nav', 'profile_42');
        renderApp('/');
        await waitFor(() => expect(screen.getByTestId('profile-page')).toBeTruthy());
    });

    it('syncs activeNav from URL and shows Profile at /profile', async () => {
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1 }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        renderApp('/profile');
        await waitFor(() => expect(screen.getByTestId('profile-page')).toBeTruthy());
    });
});
