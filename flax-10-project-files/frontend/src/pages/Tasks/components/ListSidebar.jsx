/**
 * Sidebar: views (filters), lists, archived. Uses listColorUtils and listSidebarUtils.
 */

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { getListColor } from "../utils/listColorUtils";
import { computeListSidebarCounts } from "../utils/listSidebarUtils";
import EmptyState from "../../../components/common/EmptyState/EmptyState";
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
  return (
    <div ref={ref} className={styles.ctxMenu} style={{ top: y, left: x }}>
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

function ListSidebarListItem({ list, idx, color, count, active, renamingId, setRenamingId, onSelectList, onSelectFilter, onRenameList, onCtxMenu }) {
  return (
    <div className={`${styles.listItem} ${active ? styles.listActive : ""}`} style={{ "--list-color": color }} onContextMenu={(e) => onCtxMenu(e, list.id)}>
      {renamingId === list.id ? (
        <RenameInput value={list.name} onSave={(name) => { onRenameList?.(list.id, name); setRenamingId(null); }} onCancel={() => setRenamingId(null)} />
      ) : (
        <button className={styles.listBtn} onClick={() => { onSelectList(list.id); onSelectFilter("all"); }} title={list.name}>
          <span className={styles.listDot} style={{ background: color }} />
          <span className={styles.listName}>{list.name}</span>
          {count > 0 && <span className={styles.listCount}>{count}</span>}
        </button>
      )}
    </div>
  );
}

function ListSidebarListItems({ lists, listCounts, activeListId, renamingId, setRenamingId, onSelectList, onSelectFilter, onRenameList, onCtxMenu }) {
  return (
    <nav className={styles.nav}>
      {lists.map((list, idx) => (
        <ListSidebarListItem key={list.id} list={list} idx={idx} color={getListColor(list, idx)} count={listCounts[list.id] || 0} active={activeListId === list.id} renamingId={renamingId} setRenamingId={setRenamingId} onSelectList={onSelectList} onSelectFilter={onSelectFilter} onRenameList={onRenameList} onCtxMenu={onCtxMenu} />
      ))}
      {lists.length === 0 && (
        <EmptyState
          icon="🗂️"
          title="No lists yet"
          description="Create a list to organize your tasks."
        />
      )}
    </nav>
  );
}

function ArchiveListItems({ archivedLists, onUnarchiveList, onPermanentlyDeleteList }) {
  return archivedLists.map((list) => (
    <div key={list.id} className={styles.archiveItem}>
      <span className={styles.archiveName}>{list.name}</span>
      <div className={styles.archiveActions}>
        {onUnarchiveList && <button type="button" className={styles.restoreBtn} onClick={() => onUnarchiveList(list.id)}>Restore</button>}
        {onPermanentlyDeleteList && <button type="button" className={styles.deletePermanentBtn} onClick={() => onPermanentlyDeleteList(list.id)} title="Permanently delete list">Delete</button>}
      </div>
    </div>
  ));
}

function ListSidebarArchive({ archivedLists, showArchived, setShowArchived, onUnarchiveList, onPermanentlyDeleteList }) {
  if (archivedLists.length === 0) return null;
  return (
    <div className={styles.archiveSection}>
      <button className={styles.archiveToggle} onClick={() => setShowArchived((s) => !s)}>
        <span>🗂️ Archived ({archivedLists.length})</span>
        <span>{showArchived ? "▾" : "▸"}</span>
      </button>
      {showArchived && (
        <div className={styles.archiveList}>
          <ArchiveListItems archivedLists={archivedLists} onUnarchiveList={onUnarchiveList} onPermanentlyDeleteList={onPermanentlyDeleteList} />
        </div>
      )}
    </div>
  );
}

export default function ListSidebar(props) {
  const [ctxMenu, setCtxMenu] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const { listCounts, smartFilters } = computeListSidebarCounts(props.tasks, props.lists);
  const handleCtxMenu = (e, listId) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, listId }); };
  return (
    <aside className={styles.sidebar}>
      <div className={styles.sectionLabel}>VIEWS</div>
      <ListSidebarViews smartFilters={smartFilters} activeListId={props.activeListId} activeFilter={props.activeFilter} onSelectList={props.onSelectList} onSelectFilter={props.onSelectFilter} />
      <div className={styles.sectionLabel}>LISTS</div>
      <ListSidebarListItems lists={props.lists} listCounts={listCounts} activeListId={props.activeListId} renamingId={renamingId} setRenamingId={setRenamingId} onSelectList={props.onSelectList} onSelectFilter={props.onSelectFilter} onRenameList={props.onRenameList} onCtxMenu={handleCtxMenu} />
      <button className={styles.createListBtn} onClick={props.onNewList}>+ Add list</button>
      <ListSidebarArchive archivedLists={props.archivedLists} showArchived={showArchived} setShowArchived={setShowArchived} onUnarchiveList={props.onUnarchiveList} onPermanentlyDeleteList={props.onPermanentlyDeleteList} />
      {ctxMenu && <ListContextMenu x={ctxMenu.x} y={ctxMenu.y} onRename={() => setRenamingId(ctxMenu.listId)} onDelete={() => props.onDeleteList(ctxMenu.listId)} onClose={() => setCtxMenu(null)} />}
    </aside>
  );
}
