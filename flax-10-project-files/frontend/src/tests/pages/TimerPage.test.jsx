import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as helpers from '../utils/timerTestHelpers';
import { fireEvent, screen, act } from '@testing-library/react';

const { mockGetHistory } = vi.hoisted(() => ({
    mockGetHistory: vi.fn(),
}));

vi.mock('../../components/Timer/utils/historyUtils', async () => {
    const actual = await vi.importActual('../../components/Timer/utils/historyUtils');
    return {
        ...actual,
        getHistory: mockGetHistory,
    };
});

vi.mock('../../components/Timer/TreeAnimation', () => ({
    default: ({ progress }) => <div data-testid="tree-anim">Progress: {progress}</div>
}));

vi.mock('../../components/Timer/FocusAnimation', () => ({
    default: () => <div data-testid="focus-animation" />,
}));

vi.mock('../../components/Timer/TodayBanner', () => ({
    default: () => <div data-testid="today-banner" />,
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_, tag) => (props) => {
      const { children, ...rest } = props || {};
      const Tag = typeof tag === 'string' ? tag : 'div';
      delete rest.animate;
      delete rest.exit;
      delete rest.initial;
      delete rest.layout;
      delete rest.layoutId;
      delete rest.layoutRoot;
      delete rest.transition;
      delete rest.whileHover;
      delete rest.whileTap;
      return <Tag {...rest}>{children}</Tag>;
    },
  }),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../components/Notifications/hooks/useNotify', () => ({
    useNotify: () => vi.fn(),
}));

let mockLocationState = null;
vi.mock('react-router-dom', () => ({
    useLocation: () => ({ pathname: '/timer', state: mockLocationState }),
    useNavigate: () => vi.fn(),
}));

let mockNotificationPermission = 'granted';
const mockRequestPermission = vi.fn();
vi.mock('../../components/Timer/utils/timerUtils', async () => {
    const actual = await vi.importActual('../../components/Timer/utils/timerUtils');
    return {
        ...actual,
        useNotificationPermission: () => ({ permission: mockNotificationPermission, request: mockRequestPermission }),
    };
});

const setupTests = () => {
    vi.useFakeTimers();
    helpers.mockNotifications();
    helpers.mockHistorySave();
};

const cleanupTests = () => {
    vi.useRealTimers();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mockLocationState = null;
    mockNotificationPermission = 'granted';
};

const testInitialState = () => {
    helpers.renderTimerPage();
    helpers.expectTimer('25:00');
    helpers.expectButton('Start');
};

const testStartStop = () => {
    helpers.renderTimerPage();
    helpers.clickStart();
    helpers.expectButton('Pause');
    helpers.advanceTimer(1000);
    helpers.expectTimer('24:59');
    helpers.clickPause();
    helpers.expectButton('Resume');
};

const testReset = () => {
    helpers.renderTimerPage();
    helpers.clickStart();
    helpers.advanceTimer(5000);
    helpers.clickReset();
    helpers.expectTimer('25:00');
    helpers.expectButton('Start');
};

const testSettings = () => {
    helpers.renderTimerPage();
    helpers.updateSettings(0, '30');
    helpers.expectTimer('30:00');
};

const testBreakModalShow = () => {
    helpers.renderTimerPage();
    helpers.updateSettings(0, '1');
    helpers.clickStart();
    helpers.advanceTimer(61000);
    helpers.expectButton("Start Break");
};

const testBreakModalEnter = () => {
    helpers.renderTimerPage();
    helpers.updateSettings(0, '1');
    helpers.clickStart();
    helpers.advanceTimer(61000);
    helpers.clickButton("Start Break");
    helpers.expectTimer('05:00');
};

const testHistoryModal = async () => {
    mockGetHistory.mockResolvedValue([{ id: 1, duration: 25 }]);
    const origInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
    helpers.renderTimerPage();
    const viewBtn = screen.getByRole('button', { name: /View History/i });
    expect(viewBtn).toBeInTheDocument();
    fireEvent.click(viewBtn);
    // RTL polling + effects rely on timers under fake-timers.
    act(() => vi.advanceTimersByTime(500));
    expect(mockGetHistory).toHaveBeenCalled();
    // Flush promise resolutions from HistoryModal's useEffect
    await act(async () => {
        await Promise.resolve();
    });
    // Wait for modal mount
    expect(document.body.querySelector('div[class*="_backdrop"]')).toBeTruthy();
    expect(document.body.textContent || '').toMatch(/History/i);
    // Wait for modal to load data (fake-timers can stall RTL findByRole polling)
    expect(document.body.textContent || '').toMatch(/Clear History/i);
    Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, writable: true, configurable: true });
};

const testHistoryModalClose = async () => {
    // Mock getHistory so it doesn't crash
    mockGetHistory.mockResolvedValue([]);
    const origInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
    helpers.renderTimerPage();
    const viewBtn = screen.getByRole('button', { name: /View History/i });
    expect(viewBtn).toBeInTheDocument();
    fireEvent.click(viewBtn);
    // RTL polling + effects rely on timers under fake-timers.
    act(() => vi.advanceTimersByTime(500));
    // Flush promise resolutions from HistoryModal's useEffect
    await act(async () => {
        await Promise.resolve();
    });
    // Modal should be mounted
    expect(document.body.querySelector('div[class*="_backdrop"]')).toBeTruthy();

    // StandardModal close button uses aria-label="Close"
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);

    // Flush state updates after close
    act(() => vi.advanceTimersByTime(200));
    await act(async () => {
        await Promise.resolve();
    });

    // Modal should be gone
    const backdrop = document.body.querySelector('div[class*="_backdrop"]');
    expect(backdrop === null || /_hidden_/.test(backdrop.className)).toBe(true);
    // Clear History should not exist (and in this test getHistory returns [])
    expect(document.body.textContent || '').not.toMatch(/Clear History/i);
    Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, writable: true, configurable: true });
};

describe('TimerPage Integration', () => {
    beforeEach(setupTests);
    afterEach(cleanupTests);
    it('renders initial state correctly', testInitialState, 15000);
    it('starts and stops the timer', testStartStop);
    it('resets the timer', testReset);
    it('updates settings', testSettings, 15000);
    it('shows break modal when work session finishes', testBreakModalShow, 15000);
    it('enters break mode from modal', testBreakModalEnter, 15000);
    it('opens history modal when history button is clicked', testHistoryModal, 15000);
    it('closes history modal', testHistoryModalClose, 15000);

    it('shows Enable Notifications when permission is default and click calls request', () => {
        mockNotificationPermission = 'default';
        helpers.renderTimerPage();
        const btn = screen.getByText('Enable Notifications');
        expect(btn).toBeInTheDocument();
        fireEvent.click(btn);
        expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('hides notification prompt when permission is not default', () => {
        mockNotificationPermission = 'denied';
        helpers.renderTimerPage();
        expect(screen.queryByText('Enable Notifications')).not.toBeInTheDocument();
    });

    it('shows focus transition overlay when location.state.fromTaskPlay is true', () => {
        mockLocationState = { fromTaskPlay: true };
        helpers.renderTimerPage();
        const container = document.querySelector('[class*="focusModeTransition"]');
        expect(container).toBeInTheDocument();
    });

    it('shows the focus page skeleton before the page settles', () => {
        helpers.renderTimerPage({ settle: false });
        expect(screen.getByTestId('focus-page-skeleton')).toBeInTheDocument();
    });

    it('shows the overtime modal even while full focus mode is open', () => {
        helpers.renderTimerPage();
        helpers.updateSettings(0, '1');
        helpers.clickStart();
        fireEvent.click(screen.getByRole('button', { name: /full focus mode/i }));
        helpers.advanceTimer(61000);
        expect(screen.getByRole('button', { name: /exit focus/i })).toBeInTheDocument();
        expect(screen.getByText("Time's Up!")).toBeInTheDocument();
    }, 15000);

    it('cycles focus transition messages and hides after 10s', () => {
        mockLocationState = { fromTaskPlay: true };
        helpers.renderTimerPage();
        expect(document.querySelector('[class*="focusModeTransition"]')).toBeInTheDocument();
        act(() => vi.advanceTimersByTime(11000));
        expect(document.querySelector('[class*="focusModeTransition"]')).not.toBeInTheDocument();
    });

    it('useIsMobile true when window width < 900', () => {
        const origInnerWidth = window.innerWidth;
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
        helpers.renderTimerPage();
        expect(screen.getByText('View History 📜')).toBeInTheDocument();
        Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, writable: true, configurable: true });
    });

    it('useIsMobile false when window width >= 900', () => {
        const origInnerWidth = window.innerWidth;
        Object.defineProperty(window, 'innerWidth', { value: 1000, writable: true, configurable: true });
        helpers.renderTimerPage();
        expect(screen.getByRole('button', { name: /History/i })).toBeInTheDocument();
        Object.defineProperty(window, 'innerWidth', { value: origInnerWidth, writable: true, configurable: true });
    }, 15000);
});
