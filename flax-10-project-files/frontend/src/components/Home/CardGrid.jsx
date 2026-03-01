import styles from "./CardGrid.module.css";
import DayCard from "./DayCard";

function EmptyState() {
  return <p className={styles.empty}>Nothing scheduled — click + to add your first event! 😊</p>;
}

function CardList({ items, onDelete, onEdit, date }) {
  return (
    <div className={styles.grid}>
      {items.map((e) => <DayCard key={e.id} e={e} onDelete={onDelete} onClick={(ev) => onEdit?.(e, ev)} date={date} />)}
    </div>
  );
}

export default function CardGrid({ items, onDelete, onEdit, date }) {
  if (!items?.length) return <EmptyState />;
  return <CardList items={items} onDelete={onDelete} onEdit={onEdit} date={date} />;
}