import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ToDoPanel.module.css";
import { Reorder, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";

const STORAGE_KEY = "flax_todo_items_v1";
const AUTO_CLEAR_MS = 2 * 60 * 60 * 1000;

function normaliseItem(x) {
  return {
    id: x?.id ?? crypto.randomUUID(),
    title: typeof x?.title === "string" ? x.title : "",
    done: !!x?.done,
    urgent: !!x?.urgent,
    completedAt: typeof x?.completedAt === "number" ? x.completedAt : null,
  };
}

function pinUrgentFirst(activeList) {
  const urgent = activeList.filter((t) => t.urgent);
  const others = activeList.filter((t) => !t.urgent);
  return [...urgent, ...others];
}

export default function ToDoPanel({ open = true, onClose }) {
  const [text, setText] = useState("");

  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw).map(normaliseItem) : [];
      return parsed;
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  // Auto clear completed tasks after 2 hours
  useEffect(() => {
    const now = Date.now();

    const hasExpired = items.some(
      (t) =>
        t.done &&
        typeof t.completedAt === "number" &&
        now - t.completedAt >= AUTO_CLEAR_MS
    );

    if (hasExpired) {
      setItems((prev) =>
        prev.filter(
          (t) =>
            !(
              t.done &&
              typeof t.completedAt === "number" &&
              now - t.completedAt >= AUTO_CLEAR_MS
            )
        )
      );
    }

    const nextExpiry = items
      .filter((t) => t.done && typeof t.completedAt === "number")
      .map((t) => t.completedAt + AUTO_CLEAR_MS)
      .filter((ts) => ts > now)
      .sort((a, b) => a - b)[0];

    if (!nextExpiry) return;

    const id = window.setTimeout(() => {
      const n = Date.now();
      setItems((prev) =>
        prev.filter(
          (t) =>
            !(
              t.done &&
              typeof t.completedAt === "number" &&
              n - t.completedAt >= AUTO_CLEAR_MS
            )
        )
      );
    }, Math.max(0, nextExpiry - now + 50));

    return () => window.clearTimeout(id);
  }, [items]);

  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const panelRef = useRef(null);

  const [taskMenuId, setTaskMenuId] = useState(null);
  const taskMenuRef = useRef(null);
  const [taskMenuPos, setTaskMenuPos] = useState({ top: 0, left: 0 });
  const [taskMenuAnchor, setTaskMenuAnchor] = useState(null); 

  useEffect(() => {
    if (!open) return;

    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }

      const clickedDotsBtn = e.target.closest?.("[data-task-menu-btn='true']");
      if (!clickedDotsBtn) {
        if (taskMenuRef.current && !taskMenuRef.current.contains(e.target)) {
          setTaskMenuId(null);
        }
      }

      // Close panel if clicking outside
      const panelEl = panelRef.current;
      const clickedInsidePanel = panelEl?.contains(e.target);
      const clickedInsideTopMenu = menuRef.current && menuRef.current.contains(e.target);
      const clickedInsideTaskMenu = taskMenuRef.current && taskMenuRef.current.contains(e.target);

      if (!clickedInsidePanel && !clickedInsideTopMenu && !clickedInsideTaskMenu) {
        onClose?.();
      }
    };

    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setTaskMenuId(null);
        onClose?.();
      }
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!taskMenuId || !taskMenuAnchor) return;
    const el = taskMenuRef.current;
    if (!el) return;

    const pad = 8;
    const menuW = el.offsetWidth;
    const menuH = el.offsetHeight;

    let left = taskMenuAnchor.x + taskMenuAnchor.w - menuW;
    let top = taskMenuAnchor.y + taskMenuAnchor.h + 8;

    left = Math.max(pad, Math.min(left, window.innerWidth - menuW - pad));

    if (top + menuH + pad > window.innerHeight) {
      top = taskMenuAnchor.y - menuH - 8;
    }

    top = Math.max(pad, Math.min(top, window.innerHeight - menuH - pad));

    setTaskMenuPos({ top, left });
  }, [taskMenuId, taskMenuAnchor]);

  const addItem = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;

    const newItem = {
      id: crypto.randomUUID(),
      title: t,
      done: false,
      urgent: false,
      completedAt: null,
    };

    setItems((prev) => [...prev, newItem]);
    setText("");
  };

  const toggleDone = (id) => {
    setItems((prev) => {
      const now = Date.now();
      return prev.map((x) => {
        if (x.id !== id) return x;
        const nextDone = !x.done;
        return {
          ...x,
          done: nextDone,
          completedAt: nextDone ? now : null,
        };
      });
    });
    setTaskMenuId(null);
  };

  const toggleUrgent = (id) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, urgent: !x.urgent } : x))
    );
    setTaskMenuId(null);
  };

  const deleteTask = (id) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
    setTaskMenuId(null);
  };

  const clearCompleted = () => {
    setItems((prev) => prev.filter((x) => !x.done));
    setMenuOpen(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditText(item.title);
  };

  const saveEdit = (id) => {
    const t = editText.trim();
    if (!t) {
      setEditingId(null);
      setEditText("");
      return;
    }
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, title: t } : x)));
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const activeRaw = useMemo(() => items.filter((x) => !x.done), [items]);
  const doneItems = useMemo(() => items.filter((x) => x.done), [items]);
  const isEmpty = activeRaw.length === 0 && doneItems.length === 0;

  const activePinned = useMemo(() => pinUrgentFirst(activeRaw), [activeRaw]);
  const urgentActive = useMemo(
    () => activePinned.filter((x) => x.urgent),
    [activePinned]
  );
  const otherActive = useMemo(
    () => activePinned.filter((x) => !x.urgent),
    [activePinned]
  );

  const anyCompleted = doneItems.length > 0;

  const onReorderActive = (newOrder) => {
    const pinned = pinUrgentFirst(newOrder);
    setItems((prev) => {
      const done = prev.filter((x) => x.done);
      return [...pinned, ...done];
    });
  };

  const renderTaskMenu = (item) => {
    if (taskMenuId !== item.id) return null;

    const isUrgent = !!item.urgent;
    const canUrgent = !item.done;

    return createPortal(
      <div
        ref={taskMenuRef}
        className={styles.taskMenu}
        style={{ top: taskMenuPos.top, left: taskMenuPos.left }}
        role="menu"
      >
        {canUrgent && (
          <button
            type="button"
            className={styles.taskMenuItem}
            onClick={() => toggleUrgent(item.id)}
            role="menuitem"
          >
            <span className={styles.taskMenuIcon} aria-hidden="true">
              ⚡
            </span>
            <span className={styles.taskMenuLabel}>
              {isUrgent ? "Remove urgent" : "Mark as urgent"}
            </span>
          </button>
        )}

        <button
          type="button"
          className={styles.taskMenuItem}
          onClick={() => deleteTask(item.id)}
          role="menuitem"
        >
          <span className={styles.taskMenuIcon} aria-hidden="true">
            🗑️
          </span>
          <span className={styles.taskMenuLabel}>Delete</span>
        </button>
      </div>,
      document.body
    );
  };

  const onTaskDotsClick = (e, item) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTaskMenuAnchor({ x: r.left, y: r.top, w: r.width, h: r.height });
    setTaskMenuId((cur) => (cur === item.id ? null : item.id));
  };

  return (
    <div 
      ref={panelRef}
      className={`${styles.panel} ${open ? styles.open : styles.closed}`}>
      {/* Header */}
      <div className={styles.header}>

       <div className={styles.titleBtn} title="To-do">
          <span className={styles.titleText}>To-do</span> 
        </div>

        <div className={styles.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Task menu"
            aria-expanded={menuOpen}
          >
            <span className={styles.dots} aria-hidden="true">
              •••
            </span>
          </button>

          {menuOpen && (
            <div className={styles.menu}>
              <button
                type="button"
                className={styles.menuItem}
                onClick={clearCompleted}
                disabled={!anyCompleted}
                title={!anyCompleted ? "No completed tasks" : "Remove completed tasks"}
              >
                <span className={styles.menuIcon} aria-hidden="true">
                  🪄
                </span>
                <span className={styles.menuLabel}>Clear completed tasks</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* List */}
      <div className={styles.list}>
        {isEmpty && (
          <div className={styles.emptyState}>
            No tasks yet. Add one below!
          </div>
        )}
        <Reorder.Group
          axis="y"
          values={activePinned}
          onReorder={onReorderActive}
          className={styles.reorderGroup}
        >
          <AnimatePresence>
            {/* Urgent Section */}
            {urgentActive.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>
                  URGENT <span className={styles.urgentBang} aria-hidden="true">!</span>
                </div>

                {urgentActive.map((item) => (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    className={`${styles.row} ${
                      taskMenuId === item.id ? styles.rowActive : ""
                    }`}
                    whileDrag={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleDone(item.id)}
                    />

                    {editingId === item.id ? (
                      <input
                        className={styles.editInput}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        onBlur={() => saveEdit(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(item.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    ) : (
                      <span
                        className={`${styles.urgentText} ${
                          item.done ? styles.done : ""
                        }`}
                        onDoubleClick={() => startEdit(item)}
                        title="Double-click to edit"
                      >
                        {item.title}
                      </span>
                    )}

                    <div className={styles.taskMenuRoot}>
                      <button
                        type="button"
                        className={styles.taskMenuBtn}
                        data-task-menu-btn="true"
                        onClick={(e) => onTaskDotsClick(e, item)}
                        aria-label="Task options"
                        title="Task options"
                      >
                        <span className={styles.taskDots}>•••</span>
                      </button>
                    </div>

                    {renderTaskMenu(item)}
                  </Reorder.Item>
                ))}
              </div>
            )}

            {otherActive.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>OTHERS</div>

                {otherActive.map((item) => (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    className={`${styles.row} ${
                      taskMenuId === item.id ? styles.rowActive : ""
                    }`}
                    whileDrag={{ scale: 1.02 }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleDone(item.id)}
                    />

                    {editingId === item.id ? (
                      <input
                        className={styles.editInput}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                        onBlur={() => saveEdit(item.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(item.id);
                          if (e.key === "Escape") cancelEdit();
                        }}
                      />
                    ) : (
                      <span
                        className={item.done ? styles.done : ""}
                        onDoubleClick={() => startEdit(item)}
                        title="Double-click to edit"
                      >
                        {item.title}
                      </span>
                    )}

                    <div className={styles.taskMenuRoot}>
                      <button
                        type="button"
                        className={styles.taskMenuBtn}
                        data-task-menu-btn="true"
                        onClick={(e) => onTaskDotsClick(e, item)}
                        aria-label="Task options"
                        title="Task options"
                      >
                        <span className={styles.taskDots}>•••</span>
                      </button>
                    </div>

                    {renderTaskMenu(item)}
                  </Reorder.Item>
                ))}
              </div>
            )}
          </AnimatePresence>
        </Reorder.Group>

        {doneItems.length > 0 && (
          <div className={styles.section}>
            <div className={styles.doneTitle}>DONE</div>

            {doneItems.map((item) => (
              <div
                key={item.id}
                className={`${styles.row} ${
                  taskMenuId === item.id ? styles.rowActive : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleDone(item.id)}
                />

                <span className={styles.done}>{item.title}</span>

                <div className={styles.taskMenuRoot}>
                  <button
                    type="button"
                    className={styles.taskMenuBtn}
                    data-task-menu-btn="true"
                    onClick={(e) => onTaskDotsClick(e, item)}
                    aria-label="Task options"
                    title="Task options"
                  >
                    <span className={styles.taskDots}>•••</span>
                  </button>
                </div>

                {renderTaskMenu(item)}
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={addItem} className={styles.inputRow}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New Task"
        />
      </form>
    </div>
  );
}