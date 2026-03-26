/**
 * SwipeMonthView - Month calendar with swipe navigation support.
 * Enables touch and scroll gestures to navigate between months.
 */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Calendar/month_view/SwipeMonthView.jsx

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Calendar/MonthView/SwipeMonthView.jsx
import { useRef, useCallback, useState, useEffect, memo } from 'react';
import { useCalendar, useCalendarDispatch } from '../../../context/CalendarContext';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { getMonthWeeks } from '../utils/dateUtils';
import { WeekdayHeader } from './WeekdayHeader';
import { WeekRow } from './WeekRow';
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Calendar/month_view/SwipeMonthView.jsx
import './month-view.css';
=======
import './MonthView.css';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Calendar/MonthView/SwipeMonthView.jsx
import styles from './SwipeMonthView.module.css';

const MonthGrid = memo(function MonthGrid({ date, events, readOnly, onDateSelect, onMoreClick, customTags }) {
  const weeks = getMonthWeeks(date);
  return (
    <div className="month-grid">
      <WeekdayHeader />
      {weeks.map((week, i) => (
        <WeekRow key={i} days={week} events={events} cur={date} onDateSelect={onDateSelect}
          readOnly={readOnly} onMoreClick={onMoreClick} customTags={customTags} />
      ))}
    </div>
  );
});

function useMonthNavigation(selectedDate, dispatch) {
  const [direction, setDirection] = useState(null);

  const navigate = useCallback((dir) => {
    setDirection(dir);
    setTimeout(() => {
      const next = new Date(selectedDate);
      next.setMonth(next.getMonth() + dir);
      dispatch({ type: 'SET_SELECTED_DATE', payload: next });
      setDirection(null);
    }, 150);
  }, [selectedDate, dispatch]);

  const handleDateSelect = useCallback((date) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'day' });
  }, [dispatch]);

  return { direction, onPrev: () => navigate(-1), onNext: () => navigate(1), handleDateSelect };
}

/** Month view with swipe/scroll navigation between months. */
<<<<<<< HEAD:flax-10-project-files/frontend/src/components/Calendar/month_view/SwipeMonthView.jsx

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration):flax-10-project-files/frontend/src/components/Calendar/MonthView/SwipeMonthView.jsx
export function SwipeMonthView({ readOnly: propReadOnly, customTags }) {
  const { selectedDate, events, readOnly: contextReadOnly } = useCalendar();
  const dispatch = useCalendarDispatch();
  const containerRef = useRef(null);
  const { direction, onPrev, onNext, handleDateSelect } = useMonthNavigation(selectedDate, dispatch);

  useSwipeNavigation({ containerRef, onPrev, onNext });
  useEffect(() => { if (containerRef.current) containerRef.current.scrollTop = 0; }, [selectedDate]);

  const animClass = direction === 1 ? styles.slideUp : direction === -1 ? styles.slideDown : '';

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={`${styles.content} ${animClass}`}>
        <MonthGrid date={selectedDate} events={events} readOnly={propReadOnly ?? contextReadOnly}
          onDateSelect={handleDateSelect} onMoreClick={handleDateSelect} customTags={customTags} />
      </div>
    </div>
  );
}
