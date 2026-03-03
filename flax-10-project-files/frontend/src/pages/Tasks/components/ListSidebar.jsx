// list side bar for the tasks page

import { useState, useRef, useEffect, useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";
import styles from "./ListSidebar.module.css";
import { FOCUS_BLOCK_COLOURS_HEX } from "../constants/focusBlockColours";

function isRoutineOrEventTask(task) {
  if (!task) return false;
  const title = (task.title || "").toLowerCase();
  const tag = (task.tag || "").toString().toLowerCase();
  if (tag === "routine" || tag === "event") return true;
  if (/breakfast|lunch|sleep|coffee|meal|dinner|brunch|snack/i.test(title)) return true;
  if (/lecture|seminar|tutorial|lab\s*session/i.test(title)) return true;
  return false;
}

function listColour(list, idx) {
    try {
        if (list?.color) return list.color;
        if (list?.id && typeof window !== "undefined") {
            const stored = localStorage.getItem("listColor:" + list.id);
            if (stored) return stored;
        }
    } catch (_) {}
    return FOCUS_BLOCK_COLOURS_HEX[idx % FOCUS_BLOCK_COLOURS_HEX.length];
}

function RenameInput({ value, onSave, onCancel}) {
    const [val, setVal] = useState(value);
    const ref = useRef(null);
    useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
    return (
        <input
            ref={ref}
            className={styles.renameInput}
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={e => {
                if (e.key === "Enter") onSave(val.trim() || value);
                if (e.key === "Escape") onCancel();
            }}
            onBlur={() => onSave(val.trim() || value)}
        />
    );
}

function ListContextMenu({ x, y, onRename, onDelete, onClose }) {
    const ref = useRef(null);
    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose]);

    return (
        <div ref={ref} className={styles.ctxMenu} style={{ top: y, left: x }}>
            <button className={styles.ctxItem} onClick={() => { onRename(); onClose(); }}>
                <Pencil size={14} strokeWidth={2} /> Rename
            </button>
            <div className={styles.ctxDivider} />
            <button className={`${styles.ctxItem} ${styles.ctxDelete}`} onClick={() => { onDelete(); onClose(); }}>
                <Trash2 size={14} strokeWidth={2} /> Delete list
            </button>
        </div>
    );
}

export default function ListSidebar({
    lists,
    tasks,
    activeListId,
    activeFilter,
    onSelectList,
    onSelectFilter,
    onNewList,
    onDeleteList,
    onRenameList,
    onUnarchiveList,
    onPermanentlyDeleteList,
    archivedLists = [],
}) {
    const [ctxMenu,      setCtxMenu]      = useState(null);
    const [renamingId,   setRenamingId]   = useState(null);
    const [showArchived, setShowArchived] = useState(false);

    const now      = new Date();
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const weekEnd  = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);

    const overdueCount = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < now && !isRoutineOrEventTask(t)).length;
    const todayCount   = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) >= now && new Date(t.due_date) <= todayEnd).length;
    const weekCount    = tasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) > todayEnd && new Date(t.due_date) <= weekEnd).length;
    const allCount     = tasks.filter(t => !t.completed).length;

    const listCounts = lists.reduce((acc, l) => {
        acc[l.id] = tasks.filter(t => !t.completed && String(t.task_list) === String(l.id)).length;
        return acc;
    }, {});

    const smartFilters = [
        { id: "all",   label: "All tasks", emoji: "📋", count: allCount },
        { id: "today", label: "Today",     emoji: "📅", count: todayCount },
        { id: "week",  label: "This week", emoji: "📆", count: weekCount },
        ...(overdueCount > 0 ? [{ id: "overdue", label: "Overdue", emoji: "⚠️", count: overdueCount, danger: true }] : []),
    ];

    const handleCtxMenu = useCallback((e, listId) => {
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY, listId });
    }, []);

    return (
        <aside className={styles.sidebar}>
            {/* ── Views ── */}
            <div className={styles.sectionLabel}>VIEWS</div>
            <nav className={styles.nav}>
                {smartFilters.map(f => (
                    <button
                        key={f.id}
                        className={`${styles.navItem} ${!activeListId && activeFilter === f.id ? styles.navActive : ""} ${f.danger ? styles.navDanger : ""}`}
                        onClick={() => { onSelectList(null); onSelectFilter(f.id); }}
                    >
                        <span className={styles.navEmoji}>{f.emoji}</span>
                        <span className={styles.navLabel}>{f.label}</span>
                        {f.count > 0 && (
                            <span className={`${styles.navCount} ${f.danger ? styles.navCountDanger : ""}`}>{f.count}</span>
                        )}
                    </button>
                ))}
            </nav>

            {/* ── Lists ── */}
            <div className={styles.sectionLabel}>LISTS</div>
            <nav className={styles.nav}>
                {lists.map((list, idx) => {
                    const color  = listColour(list, idx);
                    const count  = listCounts[list.id] || 0;
                    const active = activeListId === list.id;
                    return (
                        <div
                            key={list.id}
                            className={`${styles.listItem} ${active ? styles.listActive : ""}`}
                            style={{ "--list-color": color }}
                            onContextMenu={e => handleCtxMenu(e, list.id)}
                            
                        >
                            {renamingId === list.id ? (
                                <RenameInput
                                    value={list.name}
                                    onSave={name => { onRenameList?.(list.id, name); setRenamingId(null); }}
                                    onCancel={() => setRenamingId(null)}
                                />
                            ) : (
                                <button
                                    className={styles.listBtn}
                                    onClick={() => { onSelectList(list.id); onSelectFilter("all"); }}
                                >
                                    <span className={styles.listDot} style={{ background: color }} />
                                    <span className={styles.listName}>{list.name}</span>
                                    {count > 0 && <span className={styles.listCount}>{count}</span>}
                                </button>
                            )}
                        </div>
                    );
                })}
                {lists.length === 0 && <p className={styles.emptyLists}>No lists yet</p>}
            </nav>

            {/* ── Explicit create button ── */}
            <button className={styles.createListBtn} onClick={onNewList}>
                + Add list
            </button>

            {/* ── Archived section ── */}
            {archivedLists.length > 0 && (
                <div className={styles.archiveSection}>
                    <button className={styles.archiveToggle} onClick={() => setShowArchived(s => !s)}>
                        <span>🗂️ Archived ({archivedLists.length})</span>
                        <span>{showArchived ? "▾" : "▸"}</span>
                    </button>
                    {showArchived && (
                        <div className={styles.archiveList}>
                            {archivedLists.map(list => (
                                <div key={list.id} className={styles.archiveItem}>
                                    <span className={styles.archiveName}>{list.name}</span>
                                    <div className={styles.archiveActions}>
                                        {onUnarchiveList && (
                                            <button
                                                type="button"
                                                className={styles.restoreBtn}
                                                onClick={() => onUnarchiveList(list.id)}
                                            >
                                                Restore
                                            </button>
                                        )}
                                        {onPermanentlyDeleteList && (
                                            <button
                                                type="button"
                                                className={styles.deletePermanentBtn}
                                                onClick={() => onPermanentlyDeleteList(list.id)}
                                                title="Permanently delete list"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Context menu ── */}
            {ctxMenu && (
                <ListContextMenu
                    x={ctxMenu.x}
                    y={ctxMenu.y}
                    onRename={() => setRenamingId(ctxMenu.listId)}
                    onDelete={() => onDeleteList(ctxMenu.listId)}
                    onClose={() => setCtxMenu(null)}
                />
            )}
        </aside>
    );
}