/*
 * Fetches analytics summaries, progress stats, and AI insights.
 */

import { fetchApi } from './client';

const analyticsApi = {
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

export default analyticsApi;
