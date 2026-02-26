import styles from "./CardGrid.module.css";
import DayCard from "./DayCard";

export default function CardGrid({ items, onDelete, onEdit, date }) {
  if (!items?.length) return null;
  return (
    <div className={styles.grid}>
      {items.map((e) => (
        <DayCard key={e.id} e={e} onDelete={onDelete} onClick={() => onEdit?.(e)} date={date} />
      ))}
    </div>
  );
}