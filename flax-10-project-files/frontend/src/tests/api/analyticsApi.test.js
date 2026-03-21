import { describe, it, expect, vi, beforeEach } from 'vitest';
import analyticsService from '../../api/analyticsApi';
import { fetchApi } from '../../api/client';

vi.mock('../../api/client', () => ({
    fetchApi: vi.fn(),
}));

describe('analyticsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('getSummary calls with default days=30', async () => {
        await analyticsService.getSummary();
        expect(fetchApi).toHaveBeenCalledWith('/analytics/summary/?days=30');
    });

    it('getSummary calls with custom days', async () => {
        await analyticsService.getSummary(7);
        expect(fetchApi).toHaveBeenCalledWith('/analytics/summary/?days=7');
    });

    it('getProgress calls with default days=30', async () => {
        await analyticsService.getProgress();
        expect(fetchApi).toHaveBeenCalledWith('/analytics/progress/?days=30');
    });

    it('getThemeStats calls with default days=30', async () => {
        await analyticsService.getThemeStats();
        expect(fetchApi).toHaveBeenCalledWith('/analytics/theme-stats/?days=30');
    });

    it('getAiInsights sends POST with days body', async () => {
        await analyticsService.getAiInsights(14);
        expect(fetchApi).toHaveBeenCalledWith('/analytics/ai-insights/', {
            method: 'POST',
            body: JSON.stringify({ days: 14 }),
        });
    });

    it('getAiInsights uses default days=30 when called with no argument', async () => {
        await analyticsService.getAiInsights();
        expect(fetchApi).toHaveBeenCalledWith('/analytics/ai-insights/', {
            method: 'POST',
            body: JSON.stringify({ days: 30 }),
        });
    });

    it('aiChat sends POST with messages and days', async () => {
        const messages = [{ role: 'user', content: 'Hello' }];
        await analyticsService.aiChat(messages, 30);
        expect(fetchApi).toHaveBeenCalledWith('/analytics/ai-chat/', {
            method: 'POST',
            body: JSON.stringify({ messages, days: 30 }),
        });
    });

    it('aiChat uses default days=30 when called with only messages', async () => {
        const messages = [{ role: 'user', content: 'Hi' }];
        await analyticsService.aiChat(messages);
        expect(fetchApi).toHaveBeenCalledWith('/analytics/ai-chat/', {
            method: 'POST',
            body: JSON.stringify({ messages, days: 30 }),
        });
    });
});
