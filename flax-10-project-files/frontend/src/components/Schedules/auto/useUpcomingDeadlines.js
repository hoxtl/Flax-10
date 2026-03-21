/*
 * Upcoming deadline loading.
 */
import { useEffect, useState } from 'react';
import { getUpcomingDeadlines } from '../../../api/deadlineApi';
import { useToast } from '../../../context/ToastContext';

export function useUpcomingDeadlines() {
  const showToast = useToast();
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    loadUpcomingDeadlines(setDeadlines, showToast);
  }, [showToast]);

  return { deadlines, showToast };
}

async function loadUpcomingDeadlines(setDeadlines, showToast) {
  try {
    setDeadlines(await getUpcomingDeadlines());
  } catch {
    showToast('Unable to load upcoming deadlines.', { variant: 'error' });
  }
}
