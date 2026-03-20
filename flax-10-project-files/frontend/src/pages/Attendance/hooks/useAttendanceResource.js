/*
 * Shared attendance async resource hook.
 */

import { useCallback, useEffect, useState } from "react";

function createInitialState(initialValue) {
  return { data: initialValue, loading: true, error: null };
}

async function runAttendanceLoader(loader, setState) {
  setState((current) => ({ ...current, loading: true, error: null }));
  try {
    const data = await loader();
    setState({ data, loading: false, error: null });
  } catch (error) {
    setState((current) => ({ ...current, loading: false, error: error.message }));
  }
}

export function useAttendanceResource(loader, initialValue) {
  const [state, setState] = useState(createInitialState(initialValue));
  const refetch = useCallback(() => runAttendanceLoader(loader, setState), [loader]);
  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}
