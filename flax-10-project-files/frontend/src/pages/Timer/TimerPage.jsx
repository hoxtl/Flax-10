/*
 * Timer page entry.
 */

import { useLocation } from 'react-router-dom';
import { useTimerContext } from '../../context/TimerContext';
import { TimerPageContent } from './components/TimerPageContent';
import { useTimerPageController } from './hooks/useTimerPageController';

export default function TimerPage() {
  const t = useTimerContext();
  const location = useLocation();
  const state = useTimerPageController(t, location);

  return <TimerPageContent state={state} />;
}
