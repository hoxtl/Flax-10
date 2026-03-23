/*
 * Task sidebar with smart filters, lists, archive controls, and confirmations.
 */

import { getListColor } from "../utils/listColorUtils";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import HoldConfirmModal from "../../../components/common/HoldConfirmModal/HoldConfirmModal";
import { isReadingList, isTeachingList, parseReadingListName } from "../utils/readingListUtils";
import styles from "./ListSidebar.module.css";
import { ListContextMenu, RenameInput } from "./listSidebarParts";
import { useListSidebarState } from "./useListSidebarState";
import { useAuth } from "../../../context/AuthContext";

function ListSidebarViews({ smartFilters, activeListId, activeFilter, onSelectList, onSelectFilter }) {
  return (
    <nav className={styles.nav}>
      {smartFilters.map((f) => (
        <button key={f.id} className={`${styles.navItem} ${!activeListId && activeFilter === f.id ? styles.navActive : ""} ${f.danger ? styles.navDanger : ""}`} onClick={() => { onSelectList(null); onSelectFilter(f.id); }} title={f.label}>
          <span className={styles.navEmoji}>{f.emoji}</span>
          <span className={styles.navLabel}>{f.label}</span>
          {f.count > 0 && <span className={`${styles.navCount} ${f.danger ? styles.navCountDanger : ""}`}>{f.count}</span>}
        </button>
      ))}
    </nav>
  );
}

function ListLabel({ list }) {
  if (!isReadingList(list)) {
    return <span className={styles.listName}>{list.name}</span>;
  }

  const parsed = parseReadingListName(list.name);
  const displayLabel = parsed.moduleName && parsed.moduleCode
    ? `${parsed.moduleName} (${parsed.moduleCode})`
    : parsed.moduleName || parsed.moduleCode || list.name;

  return <span className={styles.readingListLabel}>{displayLabel}</span>;
}

function ListSidebarListItem({ list, color, count, active, renamingId, setRenamingId, onSelectList, onSelectFilter, onRenameList, onCtxMenu }) {
  return (
    <div className={`${styles.listItem} ${active ? styles.listActive : ""}`} style={{ "--list-color": color }} onContextMenu={(e) => onCtxMenu(e, list.id)}>
      {renamingId === list.id ? (
        <RenameInput value={list.name} onSave={(name) => { onRenameList?.(list.id, name); setRenamingId(null); }} onCancel={() => setRenamingId(null)} />
      ) : (
        <button className={styles.listBtn} onClick={() => { onSelectList(list.id); onSelectFilter("all"); }} title={list.name}>
          <span className={styles.listDot} style={{ background: color }} />
          <ListLabel list={list} />
          {count > 0 && <span className={styles.listCount}>{count}</span>}
        </button>
      )}
    </div>
  );
}

function ListSection({ label, lists, emptyState, listCounts, activeListId, renamingId, setRenamingId, onSelectList, onSelectFilter, onRenameList, onCtxMenu }) {
  if (lists.length === 0 && !emptyState) return null;
  return (
    <>
      <div className={styles.sectionLabel}>{label}</div>
      <nav className={styles.nav}>
        {lists.map((list, idx) => <ListSidebarListItem key={list.id} list={list} idx={idx} color={getListColor(list, idx)} count={listCounts[list.id] || 0} active={activeListId === list.id} renamingId={renamingId} setRenamingId={setRenamingId} onSelectList={onSelectList} onSelectFilter={onSelectFilter} onRenameList={onRenameList} onCtxMenu={onCtxMenu} />)}
        {lists.length === 0 && emptyState}
      </nav>
    </>
  );
}

function ListSidebarListItems({ lists, listCounts, activeListId, renamingId, setRenamingId, onSelectList, onSelectFilter, onRenameList, onCtxMenu }) {
  const { profile } = useAuth();
  const isTeacher = profile?.role === "teacher";
  const readingLists = lists.filter(isReadingList);
  const teachingLists = lists.filter(isTeachingList);
  const lifeLists = lists.filter((list) => !isReadingList(list) && !isTeachingList(list));
  const shared = { listCounts, activeListId, renamingId, setRenamingId, onSelectList, onSelectFilter, onRenameList, onCtxMenu };
  return (
    <>
      {!isTeacher && <ListSection label="READING LISTS" lists={readingLists} {...shared} />}
      {isTeacher && <ListSection label="MY TEACHING" lists={teachingLists} emptyState={<EmptyState icon="📋" title="No teaching lists yet" description="Create a list for meetings, planning, or admin." />} {...shared} />}
      <ListSection label="LIFE" lists={lifeLists} emptyState={<EmptyState icon="🗂️" title="No lists yet" description="Create a list to organise your tasks." />} {...shared} />
    </>
  );
}

function ArchiveListItems({ archivedLists, onUnarchiveList, onRequestPermanentDelete }) {
  return archivedLists.map((list) => (
    <div key={list.id} className={styles.archiveItem}>
      <span className={styles.archiveName}>{list.name}</span>
      <div className={styles.archiveActions}>
        {onUnarchiveList && <button type="button" className={styles.restoreBtn} onClick={() => onUnarchiveList(list.id)}>Restore</button>}
        <button type="button" className={styles.deletePermanentBtn} onClick={() => onRequestPermanentDelete(list.id)} title="Permanently delete list">Delete</button>
      </div>
    </div>
  ));
}

function ListSidebarArchive({ archivedLists, showArchived, setShowArchived, onUnarchiveList, onRequestPermanentDelete }) {
  if (archivedLists.length === 0) return null;
  return (
    <div className={styles.archiveSection}>
      <button className={styles.archiveToggle} onClick={() => setShowArchived((s) => !s)}>
        <span>🗂️ Archived ({archivedLists.length})</span>
        <span>{showArchived ? "▾" : "▸"}</span>
      </button>
      {showArchived && (
        <div className={styles.archiveList}>
          <ArchiveListItems archivedLists={archivedLists} onUnarchiveList={onUnarchiveList} onRequestPermanentDelete={onRequestPermanentDelete} />
        </div>
      )}
    </div>
  );
}

function getSidebarListName(lists, id) {
  return id ? (lists.find((list) => list.id === id)?.name || "this list") : "";
}

function ListSidebarDialogs({ props, state }) {
  const deleteListName = getSidebarListName(props.lists, state.deleteListId);
  const permDeleteName = getSidebarListName(props.archivedLists, state.permDeleteId);
  return (
    <>
      {state.ctxMenu && <ListContextMenu x={state.ctxMenu.x} y={state.ctxMenu.y} onRename={() => state.setRenamingId(state.ctxMenu.listId)} onDelete={() => state.setDeleteListId(state.ctxMenu.listId)} onClose={() => state.setCtxMenu(null)} />}
      {state.deleteListId && <HoldConfirmModal title={`Delete "${deleteListName}"`} warningText={`This will archive "${deleteListName}" and all its tasks. You can restore it later from the Archived section.`} cancelLabel="Keep List" holdLabel="Hold to Delete" onConfirm={() => { props.onDeleteList(state.deleteListId); state.setDeleteListId(null); }} onCancel={() => state.setDeleteListId(null)} />}
      {state.permDeleteId && <HoldConfirmModal title={`Permanently Delete "${permDeleteName}"`} warningText="This will permanently delete this list. You won't be able to restore it." cancelLabel="Keep It" holdLabel="Hold to Delete" onConfirm={() => { props.onPermanentlyDeleteList(state.permDeleteId); state.setPermDeleteId(null); }} onCancel={() => state.setPermDeleteId(null)} />}
    </>
  );
}

export default function ListSidebar(props) {
  const state = useListSidebarState(props.tasks, props.lists);
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionLabel}>VIEWS</div>
      <ListSidebarViews smartFilters={state.smartFilters} activeListId={props.activeListId} activeFilter={props.activeFilter} onSelectList={props.onSelectList} onSelectFilter={props.onSelectFilter} />
      <ListSidebarListItems lists={props.lists} listCounts={state.listCounts} activeListId={props.activeListId} renamingId={state.renamingId} setRenamingId={state.setRenamingId} onSelectList={props.onSelectList} onSelectFilter={props.onSelectFilter} onRenameList={props.onRenameList} onCtxMenu={state.handleCtxMenu} />
      <button className={styles.createListBtn} onClick={props.onNewList}>+ Add list</button>
      <ListSidebarArchive archivedLists={props.archivedLists} showArchived={state.showArchived} setShowArchived={state.setShowArchived} onUnarchiveList={props.onUnarchiveList} onRequestPermanentDelete={state.setPermDeleteId} />
      <ListSidebarDialogs props={props} state={state} />
    </aside>
  );
}
