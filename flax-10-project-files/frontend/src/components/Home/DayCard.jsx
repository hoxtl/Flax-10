import styles from "./DayCard.module.css";
import { formatTimeRange } from "./utils/cardUtils";
import { useTags } from "../../context/TagContext";
import { isReadOnlyEvent } from "../Calendar/utils/eventUtils";
import { getEventTheme } from "../Calendar/utils/eventStyleUtils";

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

function Footer({ e }) {
  if (!e.warning) return null;
  return <div className={styles.warning}>⚠️ {e.warning}</div>;
}


function CardBody({ e, date }) {
  return (
    <div className={styles.main}>
      <Header e={e} />
      <Sub e={e} />
      <Meta e={e} date={date} />
      <Footer e={e} />
    </div>
  );
}

export default function DayCard({ e, onClick, date }) {
  const tags = useTags();
  const t = getEventTheme(e, tags);

  return (
    <article className={styles.card} style={{ "--accent": t.color }} onClick={(ev) => onClick?.(ev)}>
      <div className={styles.row}>
        <div className={styles.iconWrap}>{t.icon}</div>
        <CardBody e={e} date={date} />
      </div>
    </article>
  );
}