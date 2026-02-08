import styles from "./DayCard.module.css";
import { formatTimeRange } from "../utils/cardUtils";
import { useTags } from "../context/TagContext";

// Card component that displays the details of an event and includes a delete button
export default function DayCard({ e, onDelete, onClick }) {
  const { getTag } = useTags();
  const theme = getTag(e.tag_name);
  const t = theme || { color: "#94A3B8", icon: "⭐" };
  return (
    <article className={styles.card} style={{ "--accent": t.color }} onClick={onClick}>
      <div className={styles.row}>
        <div className={styles.iconWrap}>{t.icon}</div>
        <div className={styles.main}>
          <Header e={e} />
          <Sub e={e} />
          <Meta e={e} />
          <Footer e={e} />
        </div>
        <button
          className={styles.delete}
          onClick={(ev) => {
            ev.stopPropagation();
            onDelete?.(e.id);
          }}
          aria-label="Delete"
        >
          ×
        </button>
      </div>
    </article>
  );
}

// Header component that displays the event title and an "UP NEXT" badge if applicable
function Header({ e }) {
  return (
    <div className={styles.header}>
      <h3 className={styles.title}>{e.title}</h3>
      {e.upNext ? <span className={styles.upNext}>UP NEXT</span> : null}
    </div>
  );
}

// Subheader component that displays the event subtitle if it exists
function Sub({ e }) {
  return e.subtitle ? <div className={styles.subtitle}>{e.subtitle}</div> : null;
}

// Meta component that displays the event time range and location (if provided)
function Meta({ e }) {
  return (
    <div className={styles.meta}>
      <span className={styles.metaItem}>🕒 {formatTimeRange(e)}</span>
      {e.location ? <span className={styles.metaItem}>📍 {e.location}</span> : null}
    </div>
  );
}

// Footer component that displays a warning message if the event has a warning property
function Footer({ e }) {
  if (!e.warning) return null;
  return <div className={styles.warning}>⚠️ {e.warning}</div>;
}

