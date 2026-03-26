/*
 * Shared admin list components.
 */

import { AnimatePresence, motion } from "framer-motion";
import styles from "../styles";
import { rowAnim, stagger } from "../utils/adminMotion";
import AdminDecisionButtons from "./AdminDecisionButtons";

export function AnimatedList({ items, renderItem }) {
  return (
    <motion.div className={styles.list} variants={stagger} initial="initial" animate="animate">
      <AnimatePresence>{items.map(renderItem)}</AnimatePresence>
    </motion.div>
  );
}

export function ListRow({ children, onClick, style }) {
  return <motion.div className={styles.listRow} variants={rowAnim} layout onClick={onClick} style={style}>{children}</motion.div>;
}

export function ListInfo({ children, extraMeta, meta, name }) {
  return (
    <div className={styles.listInfo}>
      <span className={styles.listName}>{name}</span>
      <span className={styles.listMeta}>{meta}</span>
      {extraMeta ? <span className={styles.listMeta}>{extraMeta}</span> : null}
      {children}
    </div>
  );
}

export function ListActions({ children }) {
  return <div className={styles.listActions}>{children}</div>;
}

function stopAndRun(event, onDecide, id, action) {
  event.stopPropagation();
  onDecide(id, action);
}

export function DecisionListRow({ busy, cursor, extraMeta, id, meta, name, navigate, onDecide }) {
  return (
    <ListRow onClick={navigate} style={{ cursor }}>
      <ListInfo name={name} meta={meta} extraMeta={extraMeta} />
      <ListActions>
        <AdminDecisionButtons
          busy={busy === id}
          onApprove={(event) => stopAndRun(event, onDecide, id, "approve")}
          onReject={(event) => stopAndRun(event, onDecide, id, "reject")}
        />
      </ListActions>
    </ListRow>
  );
}
