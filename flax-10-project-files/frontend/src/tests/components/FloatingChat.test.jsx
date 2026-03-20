import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('framer-motion', () => ({
    motion: new Proxy({}, {
        get: (_, tag) => ({ children, ...props }) => {
            const Tag = typeof tag === 'string' ? tag : 'div';
            const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = props;
            return <Tag {...rest}>{children}</Tag>;
        },
    }),
    AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('react-markdown', () => ({
    default: ({ children }) => <div data-testid="markdown">{children}</div>,
}));

vi.mock('remark-gfm', () => ({ default: vi.fn() }));

vi.mock('../../api/analyticsService', () => ({
    default: {
        aiChat: vi.fn(),
    },
}));

import FloatingChat from '../../components/FloatingChat';
import analyticsService from '../../api/analyticsService';

describe('FloatingChat', () => {
    beforeEach(() => {
        Element.prototype.scrollIntoView = vi.fn();
        vi.clearAllMocks();
    });

    function renderChat(entry = '/tasks') {
        return render(
            <MemoryRouter initialEntries={[entry]}>
                <FloatingChat />
            </MemoryRouter>
        );
    }

    it('renders the FAB button', () => {
        renderChat();
        expect(screen.getByRole('button', { name: 'Open chat' })).toBeTruthy();
    });

    it('shows the task planning prompt on the tasks route', () => {
        renderChat('/tasks');
        expect(screen.getByText(/Not sure how long a task will take/i)).toBeTruthy();
    });

    it('shows the module selection prompt on the modules route', () => {
        renderChat('/modules');
        expect(screen.getByText(/Curious about new modules/i)).toBeTruthy();
    });

    it('opens chat window when FAB clicked', () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        expect(screen.getByText('Flax Bot')).toBeTruthy();
    });

    it('shows subtitle in chat header', () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        expect(screen.getByText('Ask me anything')).toBeTruthy();
    });

    it('shows suggestions when no messages', () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        expect(screen.getByText("When should I study this week?")).toBeTruthy();
        expect(screen.getByText("Am I a night owl or morning person?")).toBeTruthy();
    });

    it('closes chat window when close button clicked', async () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        fireEvent.click(screen.getAllByRole('button', { name: 'Close chat' })[0]);
        await waitFor(() => {
            expect(screen.queryByText('Flax Bot')).toBeNull();
        });
    });

    it('sends message via suggestion click', async () => {
        analyticsService.aiChat.mockResolvedValue({ reply: 'AI response here' });
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        fireEvent.click(screen.getByText('When should I study this week?'));
        await waitFor(() => {
            expect(analyticsService.aiChat).toHaveBeenCalled();
        });
    });

    it('shows AI reply in chat', async () => {
        analyticsService.aiChat.mockResolvedValue({ reply: 'Here is my advice' });
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        fireEvent.click(screen.getByText('When should I study this week?'));
        await waitFor(() => {
            expect(screen.getByTestId('markdown')).toBeTruthy();
        });
    });

    it('shows error message when API fails', async () => {
        analyticsService.aiChat.mockRejectedValue(new Error('Network error'));
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        const textarea = screen.getByPlaceholderText('Ask me anything…');
        fireEvent.change(textarea, { target: { value: 'Test question' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
        await waitFor(() => {
            expect(screen.getByText('Could not get a response. Please try again.')).toBeTruthy();
        });
    });

    it('opens chat via flax-open-chat custom event', () => {
        renderChat();
        act(() => {
            window.dispatchEvent(new CustomEvent('flax-open-chat', { detail: { initialMessage: 'hello' } }));
        });
        expect(screen.getByText('Flax Bot')).toBeTruthy();
    });

    it('disables send button when input is empty', () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        const sendBtn = screen.getByRole('button', { name: 'Send message' });
        expect(sendBtn.disabled).toBe(true);
    });

    it('enables send button when input has text', () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        const textarea = screen.getByPlaceholderText('Ask me anything…');
        fireEvent.change(textarea, { target: { value: 'Hello' } });
        const sendBtn = screen.getByRole('button', { name: 'Send message' });
        expect(sendBtn.disabled).toBe(false);
    });

    it('shows Clear button after messages exist', async () => {
        analyticsService.aiChat.mockResolvedValue({ reply: 'Done' });
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        const textarea = screen.getByPlaceholderText('Ask me anything…');
        fireEvent.change(textarea, { target: { value: 'Hello' } });
        fireEvent.click(screen.getByRole('button', { name: 'Send message' }));
        await waitFor(() => {
            expect(screen.getByText('Clear')).toBeTruthy();
        });
    });

    it('clears messages when Clear button clicked', async () => {
        analyticsService.aiChat.mockResolvedValue({ reply: 'Done' });
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        fireEvent.click(screen.getByText('When should I study this week?'));
        await waitFor(() => expect(screen.getByText('Clear')).toBeTruthy());
        fireEvent.click(screen.getByText('Clear'));
        expect(screen.queryByText('When should I study this week?')).toBeTruthy(); // suggestions back
    });

    it('sends on Enter without Shift (handleKey path)', async () => {
        analyticsService.aiChat.mockResolvedValue({ reply: 'Got it' });
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        const textarea = screen.getByPlaceholderText('Ask me anything…');
        fireEvent.change(textarea, { target: { value: 'My question' } });
        await waitFor(() => expect(screen.getByDisplayValue('My question')).toBeTruthy());
        fireEvent.keyDown(screen.getByPlaceholderText('Ask me anything…'), { key: 'Enter', shiftKey: false });
        await waitFor(() => expect(analyticsService.aiChat).toHaveBeenCalled());
    });

    it('does not send on Shift+Enter (allows newline)', () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        const textarea = screen.getByPlaceholderText('Ask me anything…');
        fireEvent.change(textarea, { target: { value: 'Line 1' } });
        fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });
        expect(analyticsService.aiChat).not.toHaveBeenCalled();
    });

    it('closes chat when FAB clicked while open', async () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        expect(screen.getByText('Flax Bot')).toBeTruthy();
        const closeButtons = screen.getAllByRole('button', { name: 'Close chat' });
        const fabClose = closeButtons.find((btn) => (btn.className || '').includes('_fab_')) || closeButtons[0];
        fireEvent.click(fabClose);
        await waitFor(() => expect(screen.queryByText('Flax Bot')).toBeNull());
    });

    it('uses empty string when flax-open-chat has non-string initialMessage', () => {
        renderChat();
        act(() => {
            window.dispatchEvent(new CustomEvent('flax-open-chat', { detail: { initialMessage: 123 } }));
        });
        expect(screen.getByText('Flax Bot')).toBeTruthy();
        const textarea = screen.getByPlaceholderText('Ask me anything…');
        expect(textarea.value).toBe('');
    });

    it('auto-sends initialMessage when opened via flax-open-chat', async () => {
        analyticsService.aiChat.mockResolvedValue({ reply: 'Auto reply' });
        renderChat();
        act(() => {
            window.dispatchEvent(new CustomEvent('flax-open-chat', { detail: { initialMessage: 'help me' } }));
        });
        await waitFor(() => expect(analyticsService.aiChat).toHaveBeenCalledWith(
            [{ role: 'user', content: 'help me' }],
            30
        ), { timeout: 1000 });
    });

    it('does not send when input is empty and send button clicked', () => {
        renderChat();
        fireEvent.click(screen.getByRole('button', { name: 'Open chat' }));
        const sendBtn = screen.getByRole('button', { name: 'Send message' });
        fireEvent.click(sendBtn);
        expect(analyticsService.aiChat).not.toHaveBeenCalled();
    });
});
