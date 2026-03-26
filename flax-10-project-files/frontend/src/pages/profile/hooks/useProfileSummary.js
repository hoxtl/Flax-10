<<<<<<< HEAD
/**
 * Profile summary loading hook.
 */
=======
import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '../../../api/client';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

import { useEffect, useRef, useState } from "react";
import { fetchApi } from "../../../api/client";

function buildSummaryUrl(userId) {
  return userId ? `/profile/summary/?user_id=${userId}` : "/profile/summary/";
}

function useSummaryState() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
<<<<<<< HEAD
  return { error, loading, setError, setLoading, setSummary, summary };
}

function loadProfileSummary(userId, summaryRef, state, showLoading) {
  const shouldShowLoading = showLoading || summaryRef.current === null;
  if (shouldShowLoading) state.setLoading(true);
  return fetchApi(buildSummaryUrl(userId))
    .then((nextSummary) => { state.setSummary(nextSummary); state.setError(null); })
    .catch((nextError) => state.setError(nextError))
    .finally(() => shouldShowLoading && state.setLoading(false));
}

export function useProfileSummary(userId) {
  const state = useSummaryState();
  const summaryRef = useRef(null);
  useEffect(() => { summaryRef.current = state.summary; }, [state.summary]);
  useEffect(() => { loadProfileSummary(userId, summaryRef, state, true); }, [userId]);
  const refetch = () => loadProfileSummary(userId, summaryRef, state, false);
  return { summary: state.summary, loading: state.loading, error: state.error, refetch };
=======
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
