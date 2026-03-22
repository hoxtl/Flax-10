/*
 * Hook for fetching admin lists.
 */

import { useCallback, useEffect, useState } from "react";

function getErrorMessage(error, fallback) {
  return error?.message || fallback;
}

export function useAsyncList(fetcher, fallbackMessage) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    setLoading(true);
    setError("");
    return fetcher().then(setItems).catch((error) => setError(getErrorMessage(error, fallbackMessage))).finally(() => setLoading(false));
  }, [fallbackMessage, fetcher]);
  useEffect(() => { load(); }, [load]);
  return { error, items, loading, setError, setItems };
}
