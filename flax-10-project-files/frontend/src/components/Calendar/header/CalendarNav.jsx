/*
 * CalendarNav.jsx
 * Calendar navigation controls and date picker entry point.
 */

import { ChevronLeft, ChevronRight } from "lucide-react";
import PrimaryButton from "../../common/PrimaryButton/PrimaryButton";
import { DatePickerButton } from "./DatePickerButton";
import styles from "./CalendarHeaderUtils.module.css";

function NavArrow({ ariaLabel, direction, onClick }) {
  const IconComponent = direction === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      className={styles.arrowBtn}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <IconComponent size={18} />
    </button>
  );
}

function TodayButton({ onToday }) {
  return (
    <PrimaryButton
      className={styles.todayBtn}
      variant="ghost"
      onClick={onToday}
      pill
    >
      Today
    </PrimaryButton>
  );
}

function CalendarTitle({ title }) {
  if (!title) return null;
  return <h2 className={styles.title}>{title}</h2>;
}

export function CalendarNav(props) {
  const { onPrev, onNext, onToday, showToday, selectedDate, onDatePick, title } =
    props;
  return (
    <div className={styles.nav}>
      <NavArrow ariaLabel="Previous" direction="left" onClick={onPrev} />
      {showToday && <TodayButton onToday={onToday} />}
      <NavArrow ariaLabel="Next" direction="right" onClick={onNext} />
      <DatePickerButton selectedDate={selectedDate} onDatePick={onDatePick} />
      <CalendarTitle title={title} />
    </div>
  );
}
