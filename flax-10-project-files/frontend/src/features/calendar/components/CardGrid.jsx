import styles from "./CardGrid.module.css";
import DayCard from "./DayCard";

// Grid component that displays a list of event cards. If no items, shows an empty state message
export default function CardGrid({ items, onDelete }) {
  if (!items?.length) {
    return (
      <p className={styles.empty}>
        Nothing scheduled — click + to add your first event! 😊
      </p>
    );
  }

  return (
    <div className={styles.grid}>
      {items.map((e) => (
        <DayCard key={e.id} e={e} onDelete={onDelete} />
      ))}
    </div>
  );
}

