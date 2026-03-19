/*
 * Analytics API service.
 */

import { fetchApi } from './client';

const analyticsService = {
  getSummary: async (days = 30) => fetchApi(`/analytics/summary/?days=${days}`),
  getProgress: async (days = 30) => fetchApi(`/analytics/progress/?days=${days}`),
  getThemeStats: async (days = 30) => fetchApi(`/analytics/theme-stats/?days=${days}`),
  getAiInsights: async (days = 30) => fetchApi('/analytics/ai-insights/', {
    method: 'POST',
    body: JSON.stringify({ days }),
  }),
  aiChat: async (messages, days = 30) => fetchApi('/analytics/ai-chat/', {
    method: 'POST',
    body: JSON.stringify({ messages, days }),
  }),
};

export default analyticsService;
