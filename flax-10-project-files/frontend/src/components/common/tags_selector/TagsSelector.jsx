/*
 * Horizontal tag selector with animated pill chips for adding and removing tags.
 */

import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import styles from "./TagsSelector.module.css";

const PILL_MOTION = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.85 },
  transition: { duration: 0.15 },
};

function TagDot({ color }) {
  if (!color) return null;
  return <span className={styles.tagDot} style={{ backgroundColor: color }} aria-hidden="true" />;
}

function SelectedTag({ tag, onRemove, className = "" }) {
  return (
    <motion.div className={`${styles.selectedTag} ${className}`.trim()} layoutId={`tag-${tag.id}`}
      initial={PILL_MOTION.initial} animate={PILL_MOTION.animate} exit={PILL_MOTION.exit} transition={PILL_MOTION.transition}>
      <TagDot color={tag.color} />
      <motion.span layoutId={`tag-label-${tag.id}`} className={styles.tagLabel}>{tag.label}</motion.span>
      <button type="button" className={styles.removeBtn} aria-label={`Remove ${tag.label}`} onClick={() => onRemove(tag.id)}>
        <X size={12} strokeWidth={2.5} />
      </button>
    </motion.div>
  );
}

function SelectedTagsRow({ scrollRef, selectedTags, emptyHint, onRemove, className = "", selectedTagClassName = "" }) {
  return (
    <motion.div className={`${styles.selectedRow} ${className}`.trim()} ref={scrollRef} layout>
      <AnimatePresence mode="popLayout">
        {selectedTags.length === 0
          ? <span className={styles.emptyHint}>{emptyHint}</span>
          : selectedTags.map(tag => <SelectedTag key={tag.id} tag={tag} onRemove={onRemove} className={selectedTagClassName} />)}
      </AnimatePresence>
    </motion.div>
  );
}

function UnselectedPill({ tag, onAdd, className = "" }) {
  return (
    <motion.button type="button" className={`${styles.pill} ${className}`.trim()} layoutId={`tag-${tag.id}`}
      initial={PILL_MOTION.initial} animate={PILL_MOTION.animate} exit={PILL_MOTION.exit}
      transition={PILL_MOTION.transition} onClick={() => onAdd(tag)}>
      <TagDot color={tag.color} />
      <motion.span layoutId={`tag-label-${tag.id}`} className={styles.tagLabel}>{tag.label}</motion.span>
    </motion.button>
  );
}

function AvailablePills({ unselected, onAdd, className = "", pillClassName = "" }) {
  if (!unselected.length) return null;
  return (
    <motion.div className={`${styles.pillsWrap} ${className}`.trim()} layout>
      <AnimatePresence mode="popLayout">
        {unselected.map(tag => <UnselectedPill key={tag.id} tag={tag} onAdd={onAdd} className={pillClassName} />)}
      </AnimatePresence>
    </motion.div>
  );
}

function useScrollToEnd(scrollRef, deps, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const node = scrollRef.current;
    if (typeof node?.scrollTo === "function") {
      node.scrollTo({ left: node.scrollWidth, behavior: "smooth" });
    } else if (node) {
      node.scrollLeft = node.scrollWidth;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Animated tag selector that shows selected tags and available pills. */

export function TagsSelector({
  tags = [],
  selectedTags = [],
  onSelectionChange,
  emptyHint = "Select tags to filter…",
  className = "",
  variant = "default",
}) {
  const scrollRef = useRef(null);
  const unselected = tags.filter(t => !selectedTags.some(s => s.id === t.id));
  const remove = (id) => onSelectionChange(selectedTags.filter(t => t.id !== id));
  const add = (tag) => onSelectionChange([...selectedTags, tag]);
  const isInline = variant === "inline";
  useScrollToEnd(scrollRef, [selectedTags], !isInline);
  return (
    <div className={`${styles.wrap} ${className}`.trim()}>
      <SelectedTagsRow
        scrollRef={scrollRef}
        selectedTags={selectedTags}
        emptyHint={emptyHint}
        onRemove={remove}
        className={isInline ? styles.inlineSelectedRow : ""}
        selectedTagClassName={isInline ? styles.inlineSelectedTag : ""}
      />
      <AvailablePills
        unselected={unselected}
        onAdd={add}
        className={isInline ? styles.inlinePillsWrap : ""}
        pillClassName={isInline ? styles.inlinePill : ""}
      />
    </div>
  );
}
