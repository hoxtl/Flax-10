import { useState } from "react";
import styles from "./Home.module.css";
import PillFilters from "../components/PillFilters";
import DateNavigator from "../components/DateNavigator";
import { isToday } from "../lib/dateUtils";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const items = []; // later replace with real dayItems/events
  const todayFlag = isToday(selectedDate);

  return (
    <div className={styles.page}>
        <div className={styles.filters}>
            <PillFilters active={activeFilter} onChange={setActiveFilter} items={items} />
        </div>
      <DateNavigator date={selectedDate} onChange={setSelectedDate} scheduleTitle={todayFlag ? "Today's schedule" : "Schedule"} />
      <div className={styles.content}>home content</div>
    </div>
  );
}