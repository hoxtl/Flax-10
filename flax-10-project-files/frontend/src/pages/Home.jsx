import { useState } from "react";
import styles from "./Home.module.css";
import PillFilters from "../components/PillFilters";

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("all");
  const items = []; // later replace with real dayItems/events

  return (
    <div className={styles.page}>
      <PillFilters active={activeFilter} onChange={setActiveFilter} items={items} />
      <div className={styles.content}>home content</div>
    </div>
  );
}