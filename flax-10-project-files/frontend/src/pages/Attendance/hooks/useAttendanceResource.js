/*
 * Shared attendance async resource hook.
 */

import { useCallback, useEffect, useState } from "react";
<<<<<<< HEAD
import { ATTENDANCE_UPDATED_EVENT } from "../../../lib/attendanceEvents";
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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
<<<<<<< HEAD
  useEffect(() => {
    refetch();
    window.addEventListener(ATTENDANCE_UPDATED_EVENT, refetch);
    return () => window.removeEventListener(ATTENDANCE_UPDATED_EVENT, refetch);
  }, [refetch]);
=======
  useEffect(() => { refetch(); }, [refetch]);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  return { ...state, refetch };
}
