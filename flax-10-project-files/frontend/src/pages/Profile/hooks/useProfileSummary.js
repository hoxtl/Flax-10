import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../../../api/client';

async function fetchProfileSummary(userId) {
  const url = userId ? `/profile/summary/?user_id=${userId}` : '/profile/summary/';
  return fetchApi(url);
}

export function useProfileSummary(userId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchProfileSummary(userId)
      .then(setSummary)
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { summary, loading, error, refetch: load };
}