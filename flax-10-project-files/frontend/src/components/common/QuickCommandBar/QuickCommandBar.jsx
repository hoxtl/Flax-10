import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarPlus2, GraduationCap, Timer, Users, Sparkles } from "lucide-react";

import styles from "./QuickCommandBar.module.css";

function isEditableTarget(target) {
  const tag = target?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;
}

function actionDefs({ onNavChange, onOpenTask }) {
  return [
    {
      id: "add-task",
      title: "Add task",
      hint: "Open quick task modal",
      Icon: CalendarPlus2,
      run: () => onOpenTask?.(),
    },
    {
      id: "jump-module",
      title: "Jump to module",
      hint: "Open modules (or search by typed code)",
      Icon: GraduationCap,
      run: (query) => {
        if (String(query || "").trim()) {
          onNavChange?.(`/modules?code=${encodeURIComponent(String(query).trim())}`);
          return;
        }
        onNavChange?.("modules");
      },
    },
    {
      id: "invite-user",
      title: "Invite user",
      hint: "Open Discover users",
      Icon: Users,
      run: () => onNavChange?.("users"),
    },
    {
      id: "open-society",
      title: "Open societies",
      hint: "Browse all societies",
      Icon: Sparkles,
      run: () => onNavChange?.("/societies?tab=all"),
    },
    {
      id: "start-timer",
      title: "Start timer",
      hint: "Jump into focus mode",
      Icon: Timer,
      run: () => onNavChange?.("timer"),
    },
  ];
}

function matches(action, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return action.title.toLowerCase().includes(q) || action.hint.toLowerCase().includes(q);
}

export default function QuickCommandBar({ onNavChange, onOpenTask }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const actions = useMemo(() => actionDefs({ onNavChange, onOpenTask }), [onNavChange, onOpenTask]);
  const filtered = useMemo(() => actions.filter((action) => matches(action, query)), [actions, query]);
  const primary = filtered[0] || null;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("quick-actions:open", onOpen);
    return () => window.removeEventListener("quick-actions:open", onOpen);
  }, []);

  useEffect(() => {
    if (open) return;
    setQuery("");
  }, [open]);

  const trigger = (action) => {
    if (!action) return;
    action.run(query);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <motion.div
            className={styles.shell}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.header}>
              <p className={styles.title}>Quick actions</p>
              <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)}>Esc</button>
            </div>
            <input
              className={styles.input}
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  trigger(primary);
                }
              }}
              placeholder="Type to filter actions…"
            />
            <div className={styles.list}>
              {filtered.map((action) => {
                const Icon = action.Icon;
                return (
                  <button key={action.id} type="button" className={styles.item} onClick={() => trigger(action)}>
                    <span className={styles.itemIcon}><Icon size={14} /></span>
                    <span className={styles.itemText}>
                      <span className={styles.itemTitle}>{action.title}</span>
                      <span className={styles.itemHint}>{action.hint}</span>
                    </span>
                  </button>
                );
              })}
              {!filtered.length && <p className={styles.empty}>No matching action</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
