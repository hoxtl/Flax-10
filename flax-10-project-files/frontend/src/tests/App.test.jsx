import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

vi.mock('../api/userService', () => ({
    getUserSettings: vi.fn().mockResolvedValue({ theme: 'light' }),
    getUserProfile: vi.fn().mockResolvedValue({ major: 'Computer Science' }),
}));

vi.mock('../layout/DashboardLayout', () => ({
    default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>,
}));

vi.mock('../pages/Welcome/WelcomeLanding', () => ({
    default: ({ onExplore, onBackToAuth }) => (
        <div data-testid="welcome-landing">
            <button onClick={onExplore}>Explore</button>
            <button onClick={onBackToAuth}>Back to Auth</button>
        </div>
    ),
}));

vi.mock('../pages/Auth/AuthPage', () => ({
    default: () => <div data-testid="auth-page">Auth</div>,
}));

vi.mock('../pages/Auth/PasswordResetRequest', () => ({
    default: () => <div data-testid="password-reset-request">Reset</div>,
}));

vi.mock('../pages/Auth/PasswordResetConfirm', () => ({
    default: () => <div data-testid="password-reset-confirm">Confirm</div>,
}));

vi.mock('../pages/Settings/Settings', () => ({
    default: () => <div data-testid="settings-page">Settings</div>,
}));

vi.mock('../pages/Profile/Profile', () => ({
    default: () => <div data-testid="profile-page">Profile</div>,
}));

vi.mock('../pages/Societies/SocietyDetailPage', () => ({
    default: () => <div data-testid="society-detail-page">Society</div>,
}));

vi.mock('../components/Onboarding/OnboardingModal', () => ({
    default: ({ isOpen }) => isOpen ? <div data-testid="onboarding-modal">Onboarding</div> : null,
}));

vi.mock('../components/Notifications', () => ({
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

vi.mock('../lib/routes', () => ({
    APP_ROUTES: [
        { id: 'home', path: '/', element: <div data-testid="home-route">Home</div> },
        { id: 'settings', path: '/settings', element: null },
    ],
}));

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
    });

    afterEach(() => {
        localStorage.clear();
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
        renderApp('/login');
        await waitFor(() => screen.getByTestId('auth-page'));
        // Simulate login
        localStorage.setItem('token', 'abc');
        localStorage.setItem('user', JSON.stringify({ id: 1, username: 'alice' }));
        localStorage.setItem('flax_welcome_seen_v1', '1');
        window.dispatchEvent(new Event('auth-changed'));
        await waitFor(() => expect(screen.getByTestId('dashboard-layout')).toBeTruthy());
    });
});
