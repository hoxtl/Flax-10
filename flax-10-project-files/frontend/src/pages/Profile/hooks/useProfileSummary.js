import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '../../../api/client';

async function fetchProfileSummary(userId) {
  const url = userId ? `/profile/summary/?user_id=${userId}` : '/profile/summary/';
  return fetchApi(url);
}

export function useProfileSummary(userId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const summaryRef = useRef(null);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  const load = useCallback(({ showLoading = true } = {}) => {
    const hasSummary = summaryRef.current !== null;
    const shouldShowLoading = showLoading || !hasSummary;

    if (shouldShowLoading) {
      setLoading(true);
    }

    fetchProfileSummary(userId)
      .then((nextSummary) => {
        setSummary(nextSummary);
        setError(null);
      })
      .catch((nextError) => {
        setError(nextError);
      })
      .finally(() => {
        if (shouldShowLoading) {
          setLoading(false);
        }
      });
  }, [userId]);

  useEffect(() => { load({ showLoading: true }); }, [load]);

  return {
    summary,
    loading,
    error,
    refetch: () => load({ showLoading: false }),
  };
}
