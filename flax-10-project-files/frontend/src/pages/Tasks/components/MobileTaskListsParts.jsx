/*
 * Shared sections for the mobile task list picker modal.
 */

import EmptyState from "../../../components/common/EmptyState/EmptyState";

import { getListColor } from "../utils/listColorUtils";

import styles from "./MobileTaskListsModal.module.css";

export function ListRow({ list, index, count, active, onClick }) {
  const color = getListColor(list, index);

  return (
    <button
      type="button"
      className={`${styles.listRow} ${active ? styles.listRowActive : ""}`}
      onClick={onClick}
    >
      <span className={styles.listDot} style={{ background: color }} />
      <span className={styles.listName}>{list.name}</span>
      {count > 0 && <span className={styles.listCount}>{count}</span>}
    </button>
  );
}

function EmptySection({ title, message }) {
  return (
    <>
      <div className={styles.sectionLabel}>{title}</div>
      <div className={styles.listWrap}>
        <p className={styles.sectionEmpty}>{message}</p>
      </div>
    </>
  );
}

function ListSectionRows({ lists, activeListId, listCounts, onSelectList }) {
  return lists.map((list, index) => (
    <ListRow
      key={list.id}
      list={list}
      index={index}
      count={listCounts[list.id] || 0}
      active={String(activeListId) === String(list.id)}
      onClick={() => onSelectList(list.id)}
    />
  ));
}

export function MobileListSection(props) {
  if (props.lists.length === 0) {
    return <EmptySection title={props.title} message={props.emptyMessage} />;
  }

  return (
    <>
      <div className={styles.sectionLabel}>{props.title}</div>
      <div className={styles.listWrap}>
        <ListSectionRows {...props} />
      </div>
    </>
  );
}

export function EmptyListsState() {
  return (
    <div className={styles.listWrap}>
      <EmptyState
        icon="🗂️"
        title="No lists yet"
        description="Create a list to organize your tasks."
      />
    </div>
  );
}
