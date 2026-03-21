import { useState, useRef, useEffect, useMemo } from 'react';
import { Tag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTags } from '../../../context/TagContext';
import { TagsSelector } from '../../common/TagsSelector/TagsSelector';
import TagManagerModal from '../../Tags/TagManagerModal';
import styles from './CalendarHeaderUtils.module.css';
function FilterPopup({ tagObjects, selectedTagObjects, onSelectionChange, onManageTags }) {
    return (
        <motion.div className={styles.filterPopup}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}>
            <div className={styles.filterPopupHeader}><span className={styles.filterPopupTitle}>Filter by tag</span>
                <button type="button" className={styles.filterManageBtn} onClick={onManageTags}>Manage tags…</button>
            </div>
            <TagsSelector tags={tagObjects} selectedTags={selectedTagObjects} onSelectionChange={onSelectionChange} />
        </motion.div>
    );
}
function useFilterState(active, tags) {
    const selectedValues = useMemo(() => {
        const source = Array.isArray(active) ? active.flat(Infinity) : [active];
        const labels = source.map(v => String(v).trim().toLowerCase()).filter(Boolean);
        return Array.from(new Set(labels)).includes('all') ? [] : source;
    }, [active]);
    const tagObjects = useMemo(() => {
        const unique = Array.from(new Map((tags || []).map(t => [t.label.toLowerCase(), t])).values());
        return unique.map(t => ({ id: t.label.toLowerCase(), label: t.label }));
    }, [tags]);
    return { selectedValues, tagObjects, selectedTagObjects: tagObjects.filter(t => selectedValues.includes(t.id)) };
}
function useFilterAutoClose(ref, setOpen) {
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [ref, setOpen]);
}
export function FilterDropdownButton({ active, onChange }) {
    const { tags } = useTags();
    const [manager, setManager] = useState(false), [open, setOpen] = useState(false), ref = useRef(null);
    const { selectedValues, tagObjects, selectedTagObjects } = useFilterState(active, tags);
    useFilterAutoClose(ref, setOpen);
    const cls = `${styles.filterTriggerBtn} ${(open || selectedValues.length > 0) ? styles.filterTriggerBtnActive : ''}`;
    return (
        <div className={styles.filterWrap} ref={ref} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
            <button className={cls} onClick={() => setOpen(!open)}><Tag size={18} />
                {selectedValues.length > 0 && <span className={styles.filterBadge}>{selectedValues.length}</span>}
            </button>
            <AnimatePresence>
                {open && <FilterPopup tagObjects={tagObjects} selectedTagObjects={selectedTagObjects}
                    onSelectionChange={(v) => onChange(v.length ? v.map(t => t.id) : 'all')}
                    onManageTags={() => { setOpen(false); setManager(true); }} />}
            </AnimatePresence>
            {manager && <TagManagerModal onClose={() => setManager(false)} />}
        </div>
    );
}
