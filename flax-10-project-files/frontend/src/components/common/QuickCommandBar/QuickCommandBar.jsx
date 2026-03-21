/*
 * Quick command bar overlay triggered by the "/" key for fast navigation and actions.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarPlus2, GraduationCap, Timer, Users, Sparkles,
  Home, Calendar, CheckSquare, MapPin, BarChart2, ClipboardCheck, UserCheck,
} from "lucide-react";

import styles from "./QuickCommandBar.module.css";
import SearchEmptyState from "../SearchEmptyState/SearchEmptyState";

function isEditableTarget(target) {
  const tag = target?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;
}

/** Returns the full list of available quick actions. */
function actionDefs({ onNavChange, onOpenTask }) {
  const nav = (page) => () => onNavChange?.(page);
  return [
    { id: "add-task", title: "Add task", hint: "Open quick task modal", Icon: CalendarPlus2, run: () => onOpenTask?.() },
    { id: "go-home", title: "Go to Home", hint: "Navigate to home dashboard", Icon: Home, run: nav("home") },
    { id: "go-calendar", title: "Open Calendar", hint: "View and manage your calendar events", Icon: Calendar, run: nav("calendar") },
    { id: "go-timer", title: "Start timer", hint: "Jump into focus mode timer", Icon: Timer, run: nav("timer") },
    { id: "go-tasks", title: "View tasks", hint: "Open your task list", Icon: CheckSquare, run: nav("tasks") },
    { id: "go-modules", title: "Jump to module", hint: "Open modules or search by module code", Icon: GraduationCap,
      run: (query) => { const q = String(query || "").trim(); onNavChange?.(q ? `/modules?code=${encodeURIComponent(q)}` : "modules"); } },
    { id: "go-map", title: "Open campus map", hint: "Navigate the campus map and plan your journey", Icon: MapPin, run: nav("map") },
    { id: "go-societies", title: "Browse societies", hint: "Explore and join student societies", Icon: Sparkles, run: () => onNavChange?.("/societies?tab=all") },
    { id: "go-users", title: "Discover users", hint: "Find and connect with other students", Icon: Users, run: nav("users") },
    { id: "go-group-work", title: "Group work", hint: "Collaborate with your group", Icon: UserCheck, run: nav("group-work") },
    { id: "go-analytics", title: "View analytics", hint: "See your study statistics and insights", Icon: BarChart2, run: nav("analytics") },
    { id: "go-attendance", title: "Attendance", hint: "Check your lecture attendance", Icon: ClipboardCheck, run: nav("attendance") },
  ];
}

function matches(action, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return action.title.toLowerCase().includes(q) || action.hint.toLowerCase().includes(q);
}

function CommandItem({ action, onTrigger }) {
  const Icon = action.Icon;
  return (
    <button key={action.id} type="button" className={styles.item} onClick={() => onTrigger(action)}>
      <span className={styles.itemIcon}><Icon size={14} /></span>
      <span className={styles.itemText}>
        <span className={styles.itemTitle}>{action.title}</span>
        <span className={styles.itemHint}>{action.hint}</span>
      </span>
    </button>
  );
}

function useCommandBarShortcuts(setOpen) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") { setOpen(false); return; }
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [setOpen]);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("quick-actions:open", onOpen);
    return () => window.removeEventListener("quick-actions:open", onOpen);
  }, [setOpen]);
}

function CommandShell({ query, setQuery, visible, primary, onTrigger, onClose }) {
  return (
    <motion.div className={styles.shell}
      initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.985 }} transition={{ duration: 0.2 }}>
      <div className={styles.header}>
        <p className={styles.title}>Quick actions</p>
        <button type="button" className={styles.closeBtn} onClick={onClose}>Esc</button>
      </div>
      <input className={styles.input} autoFocus value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onTrigger(primary); } }}
        placeholder="Type to filter actions…" />
      <div className={styles.list}>
        {visible.map((action) => <CommandItem key={action.id} action={action} onTrigger={onTrigger} />)}
        {!visible.length && <SearchEmptyState query={query} itemLabel="actions" onClear={() => setQuery("")} />}
      </div>
    </motion.div>
  );
}

function useCommandBarState(onNavChange, onOpenTask) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const actions = useMemo(() => actionDefs({ onNavChange, onOpenTask }), [onNavChange, onOpenTask]);
  const filtered = useMemo(() => actions.filter((a) => matches(a, query)), [actions, query]);
  useCommandBarShortcuts(setOpen);
  useEffect(() => { if (!open) setQuery(""); }, [open]);
  return { open, setOpen, query, setQuery, visible: query ? filtered : filtered.slice(0, 6) };
}

/** Full-screen command palette for quick navigation and actions. */
export default function QuickCommandBar({ onNavChange, onOpenTask }) {
  const { open, setOpen, query, setQuery, visible } = useCommandBarState(onNavChange, onOpenTask);
  const trigger = (action) => { if (!action) return; action.run(query); setOpen(false); };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <CommandShell query={query} setQuery={setQuery} visible={visible} primary={visible[0] || null}
            onTrigger={trigger} onClose={() => setOpen(false)} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
