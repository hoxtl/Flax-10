/*
 * Quick command bar overlay triggered by the "/" key for fast navigation and actions.
 */

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import styles from "./QuickCommandBar.module.css";
import SearchEmptyState from "../SearchEmptyState/SearchEmptyState";
import { buildActionDefs, matchesQuery } from "./commandBarActions";

function isEditableTarget(target) {
  const tag = target?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable === true;
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
  const actions = useMemo(() => buildActionDefs({ onNavChange, onOpenTask }), [onNavChange, onOpenTask]);
  const filtered = useMemo(() => actions.filter((a) => matchesQuery(a, query)), [actions, query]);
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
