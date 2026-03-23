/**
 * TfL disruption data hook for the campus map page.
 */

import { useState, useEffect } from 'react';
import { tflService } from '../../../api/tflApi';

async function fetchDisruptions(setDisruptions, setLoading) {
  setLoading(true);
  try {
    const data = await tflService.getTfLDelays();
    setDisruptions(data);
  } catch {
  } finally {
    setLoading(false);
  }
}

export function useDisruptions() {
  const [disruptions, setDisruptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const doFetch = () => fetchDisruptions(setDisruptions, setLoading);

  useEffect(() => {
    doFetch();
    const interval = setInterval(doFetch, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { disruptions, loading };
}
