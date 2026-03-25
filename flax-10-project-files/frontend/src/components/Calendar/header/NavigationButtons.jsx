/*
 * NavigationButtons renders the prev/next arrows, Today button, and date picker.
 */

import { useCalendar } from '../../../context/CalendarContext';
import { isSameDay, getWeekDays, isSameMonth } from '../utils/dateUtils';
import { DatePickerButton } from './DatePickerButton';
import styles from './NavigationButtons.module.css';

function shouldShowToday(viewMode, selectedDate) {
  const today = new Date();
  if (viewMode === 'day') return !isSameDay(selectedDate, today);
  if (viewMode === 'week') {
    const days = getWeekDays(selectedDate);
    return !days.some((d) => isSameDay(d, today));
  }
  if (viewMode === 'month') return !isSameMonth(selectedDate, today);
  return true;
}

function makeHandleToday(onDatePick) {
  return () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onDatePick(today);
  };
}

export function NavigationButtons({ selectedDate, onNavigate, onDatePick }) {
  const { viewMode } = useCalendar();
  const showToday = shouldShowToday(viewMode, selectedDate);
  const handleToday = makeHandleToday(onDatePick);
  return (
    <div className={styles.row}>
      <button type="button" className={styles.arrow} onClick={() => onNavigate(-1)}>&lt;</button>
      {showToday && <button type="button" className={styles.today} onClick={handleToday}>Today</button>}
      <button type="button" className={styles.arrow} onClick={() => onNavigate(1)}>&gt;</button>
      <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
    </div>
  );
}
