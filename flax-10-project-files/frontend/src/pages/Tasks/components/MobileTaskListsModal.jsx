import StandardModal from "../../../components/Common/StandardModal/StandardModal";
import EmptyState from "../../../components/Common/EmptyState/EmptyState";
import { computeListSidebarCounts } from "../utils/listSidebarUtils";
import { getListColor } from "../utils/listColorUtils";
import { isReadingList } from "../utils/readingListUtils";
import styles from "./MobileTaskListsModal.module.css";

function ListRow({ list, index, count, active, onClick }) {
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

export default function MobileTaskListsModal({
  lists = [],
  tasks = [],
  activeListId,
  onSelectList,
  onSelectFilter,
  onNewList,
  onClose,
}) {
  const { listCounts } = computeListSidebarCounts(tasks, lists);
  const readingLists = (lists || []).filter(isReadingList);
  const lifeLists = (lists || []).filter((list) => !isReadingList(list));

  const handleSelectList = (listId) => {
    onSelectList?.(listId);
    onSelectFilter?.("all");
    onClose?.();
  };

  return (
    <StandardModal
      title="View lists"
      subtitle="Choose a list to focus your task feed"
      onClose={onClose}
      size="sm"
      contentClassName={styles.content}
    >
      {lists.length === 0 ? (
        <div className={styles.listWrap}>
          <EmptyState
            icon="🗂️"
            title="No lists yet"
            description="Create a list to organize your tasks."
          />
        </div>
      ) : (
        <>
          <div className={styles.sectionLabel}>READING LISTS</div>
          <div className={styles.listWrap}>
            {readingLists.length === 0 ? (
              <p className={styles.sectionEmpty}>No reading lists</p>
            ) : (
              readingLists.map((list, index) => (
                <ListRow
                  key={list.id}
                  list={list}
                  index={index}
                  count={listCounts[list.id] || 0}
                  active={String(activeListId) === String(list.id)}
                  onClick={() => handleSelectList(list.id)}
                />
              ))
            )}
          </div>
          <div className={styles.sectionDivider} aria-hidden />
          <div className={styles.sectionLabel}>LIFE LISTS</div>
          <div className={styles.listWrap}>
            {lifeLists.length === 0 ? (
              <p className={styles.sectionEmpty}>No life lists</p>
            ) : (
              lifeLists.map((list, index) => (
                <ListRow
                  key={list.id}
                  list={list}
                  index={index}
                  count={listCounts[list.id] || 0}
                  active={String(activeListId) === String(list.id)}
                  onClick={() => handleSelectList(list.id)}
                />
              ))
            )}
          </div>
        </>
      )}
      <button
        type="button"
        className={styles.addListBtn}
        onClick={() => {
          onClose?.();
          onNewList?.();
        }}
      >
        + Add list
      </button>
    </StandardModal>
  );
}
