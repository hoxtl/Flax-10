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

    it('getProgress calls with custom days', async () => {
        await analyticsService.getProgress(14);
        expect(fetchApi).toHaveBeenCalledWith('/analytics/progress/?days=14');
    });

    it('getThemeStats calls with custom days', async () => {
        await analyticsService.getThemeStats(7);
        expect(fetchApi).toHaveBeenCalledWith('/analytics/theme-stats/?days=7');
    });

    it('getSummary returns the value from fetchApi', async () => {
        const mockResult = { summary: { total_study_hours: 5 } };
        fetchApi.mockResolvedValueOnce(mockResult);
        const result = await analyticsService.getSummary(30);
        expect(result).toEqual(mockResult);
    });

    it('getAiInsights returns the value from fetchApi', async () => {
        const mockResult = { insights: ['Great work!'] };
        fetchApi.mockResolvedValueOnce(mockResult);
        const result = await analyticsService.getAiInsights(30);
        expect(result).toEqual(mockResult);
    });
});
