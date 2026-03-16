import { useEffect, useState } from "react";
import analyticsService from "../../../api/analyticsService";

export default function useAnalyticsOverview(period) {
  const [data, setData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [themeStats, setThemeStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [summary, progress, theme] = await Promise.all([
          analyticsService.getSummary(period),
          analyticsService.getProgress(period),
          analyticsService.getThemeStats(period),
        ]);
        if (cancelled) return;
        setData(summary);
        setProgressData(progress);
        setThemeStats(theme);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Failed to load analytics data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [period]);

  return { data, progressData, themeStats, loading, error };
}
