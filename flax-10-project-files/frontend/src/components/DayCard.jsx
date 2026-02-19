import styles from "./DayCard.module.css";
import { formatTimeRange, isDeadlineEvent, getDeadlineCountdown, formatDeadlineDate } from "../utils/cardUtils";
import { useTags } from "../context/TagContext";

function Header({ e }) {
  return (
    <div className={styles.header}>
      <h3 className={styles.title}>{e.title}</h3>
      {e.upNext ? <span className={styles.upNext}>UP NEXT</span> : null}
    </div>
  );
}

function Sub({ e }) {
  return e.subtitle ? <div className={styles.subtitle}>{e.subtitle}</div> : null;
}

function Meta({ e, date }) {
  return (
    <div className={styles.meta}>
      <span className={styles.metaItem}>🕒 {formatTimeRange(e, date)}</span>
      {e.location ? <span className={styles.metaItem}>📍 {e.location}</span> : null}
    </div>
  );
}

function DeadlineMeta({e}) {
  return (
    <div className={styles.meta}>
      <span className={styles.metaItem}> {formatDeadlineDate(e)}</span>
      {e.location ? <span className={styles.metaItem}>📍 {e.location}</span> : null}
      <span className={styles.countdown}>{getDeadlineCountdown(e)}</span>
    </div>
  );
}


function Footer({ e }) {
  if (!e.warning) return null;
  return <div className={styles.warning}>⚠️ {e.warning}</div>;
}

function DeleteButton({ id, onDelete }) {
  const handleClick = (ev) => { ev.stopPropagation(); onDelete?.(id); };
  return <button className={styles.delete} onClick={handleClick} aria-label="Delete">×</button>;
}

function CardBody({ e, date }) {
  return (
    <div className={styles.main}>
      <Header e={e} />
      <Sub e={e} />
      {isDeadlineEvent(e) ? <DeadlineMeta e={e} /> : <Meta e={e} date={date} />}
      <Meta e={e} date={date} />
      <Footer e={e} />
    </div>
  );
}

export default function DayCard({ e, onDelete, onClick, date }) {
  const { getTag } = useTags();
  const theme = getTag(e.tag);
  const t = theme || { color: "#94A3B8", icon: "⭐" };
  const icon = isDeadlineEvent(e) ? "⏳" : t.icon;
  return (
    <article className={styles.card} style={{ "--accent": t.color }} onClick={onClick}>
      <div className={styles.row}>
        <div className={styles.iconWrap}>{t.icon}</div>
        <CardBody e={e} date={date} />
        <DeleteButton id={e.id} onDelete={onDelete} />
      </div>
    </article>
  );
}