/*
 * Task sidebar with smart filters, lists, archive controls, and confirmations.
 */

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { getListColor } from "../utils/listColorUtils";
import { computeListSidebarCounts } from "../utils/listSidebarUtils";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
import HoldConfirmModal from "../../../components/common/HoldConfirmModal/HoldConfirmModal";
import { isReadingList, parseReadingListName } from "../utils/readingListUtils";
import styles from "./ListSidebar.module.css";

function RenameInput({ value, onSave, onCancel }) {
  const [val, setVal] = useState(value);
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input ref={ref} className={styles.renameInput} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onSave(val.trim() || value); if (e.key === "Escape") onCancel(); }} onBlur={() => onSave(val.trim() || value)} />
  );
}

function ListContextMenu({ x, y, onRename, onDelete, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);
  const menuPos = { '--ctx-top': y, '--ctx-left': x };
  return (
    <div ref={ref} className={styles.ctxMenu} style={menuPos}>
      <button className={styles.ctxItem} onClick={() => { onRename(); onClose(); }}><Pencil size={14} strokeWidth={2} /> Rename</button>
      <div className={styles.ctxDivider} />
      <button className={`${styles.ctxItem} ${styles.ctxDelete}`} onClick={() => { onDelete(); onClose(); }}><Trash2 size={14} strokeWidth={2} /> Delete list</button>
    </div>
  );
}

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
  const readingLists = lists.filter(isReadingList);
  const lifeLists = lists.filter((list) => !isReadingList(list));
  const shared = { listCounts, activeListId, renamingId, setRenamingId, onSelectList, onSelectFilter, onRenameList, onCtxMenu };
  return (
    <>
      <ListSection label="READING LISTS" lists={readingLists} {...shared} />
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

function useListSidebarState(props) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteListId, setDeleteListId] = useState(null);
  const [permDeleteId, setPermDeleteId] = useState(null);
  const { listCounts, smartFilters } = computeListSidebarCounts(props.tasks, props.lists);
  const handleCtxMenu = (event, listId) => { event.preventDefault(); setCtxMenu({ x: event.clientX, y: event.clientY, listId }); };
  return { ctxMenu, setCtxMenu, renamingId, setRenamingId, showArchived, setShowArchived, deleteListId, setDeleteListId, permDeleteId, setPermDeleteId, listCounts, smartFilters, handleCtxMenu };
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
  const state = useListSidebarState(props);
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
