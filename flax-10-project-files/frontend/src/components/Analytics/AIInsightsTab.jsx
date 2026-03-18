import { useState } from 'react';
import analyticsService from '../../api/analyticsService';
import { InsightsPanel } from './InsightsPanel';
import { ChatPanel } from './ChatPanel';
import styles from './AIInsightsTab.module.css';

export { InsightsPanel } from './InsightsPanel';
export { ChatPanel } from './ChatPanel';

const fetchInsights = async (period, setInsights, setLoading, setError) => {
  setLoading(true);
  setError(null);
  try {
    const res = await analyticsService.getAiInsights(period);
    setInsights(res.insights);
  } catch {
    setError('Failed to generate insights. Check your API key configuration.');
  } finally {
    setLoading(false);
  }
};

export default function AIInsightsTab({ period }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const onGenerate = () => fetchInsights(period, setInsights, setLoading, setError);
  return (
    <div className={styles.aiTab}>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.aiGrid}>
        <InsightsPanel insights={insights} loading={loading} onGenerate={onGenerate} period={period} />
        <ChatPanel period={period} />
      </div>
    </div>
  );
}
