import { useState, useEffect, useCallback } from 'react';
import { fetchApi } from '../../../api/client';

async function fetchProfileSummary() {
  return fetchApi('/profile/summary/');
}

export function useProfileSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchProfileSummary()
      .then(setSummary)
      .catch(e => setError(e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return { summary, loading, error, refetch: load };
}