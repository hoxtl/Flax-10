import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import styles from "./TagsSelector.module.css";

export function TagsSelector({ tags = [], selectedTags = [], onSelectionChange, emptyHint = "Select tags to filter…" }) {
    const scrollRef = useRef(null);

    const remove = (id) => onSelectionChange(selectedTags.filter(t => t.id !== id));
    const add = (tag) => onSelectionChange([...selectedTags, tag]);
    const unselected = tags.filter(t => !selectedTags.some(s => s.id === t.id));

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ left: scrollRef.current.scrollWidth, behavior: "smooth" });
        }
    }, [selectedTags]);

    return (
        <div className={styles.wrap}>
            <motion.div className={styles.selectedRow} ref={scrollRef} layout>
                <AnimatePresence mode="popLayout">
                    {selectedTags.length === 0 ? (
                        <span className={styles.emptyHint}>{emptyHint}</span>
                    ) : (
                        selectedTags.map(tag => (
                            <motion.div
                                key={tag.id}
                                className={styles.selectedTag}
                                layoutId={`tag-${tag.id}`}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: 0.15 }}
                            >
                                <motion.span layoutId={`tag-label-${tag.id}`} className={styles.tagLabel}>
                                    {tag.label}
                                </motion.span>
                                <button type="button" className={styles.removeBtn} onClick={() => remove(tag.id)}>
                                    <X size={12} strokeWidth={2.5} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </motion.div>

            {unselected.length > 0 && (
                <motion.div className={styles.pillsWrap} layout>
                    <AnimatePresence mode="popLayout">
                        {unselected.map(tag => (
                            <motion.button
                                key={tag.id}
                                type="button"
                                className={styles.pill}
                                layoutId={`tag-${tag.id}`}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => add(tag)}
                            >
                                <motion.span layoutId={`tag-label-${tag.id}`} className={styles.tagLabel}>
                                    {tag.label}
                                </motion.span>
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
