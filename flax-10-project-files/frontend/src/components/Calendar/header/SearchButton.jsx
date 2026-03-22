import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SearchBar from '../../Common/SearchBar/SearchBar';
import styles from './CalendarHeaderUtils.module.css';
function ExpandedSearch({ value, onChange, onToggle }) {
    const ref = useRef(null);
    useEffect(() => {
        const t = setTimeout(() => ref.current?.querySelector('input')?.focus(), 120);
        return () => clearTimeout(t);
    }, []);
    return (
        <motion.div className={styles.searchWrapper} initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div ref={ref} className={styles.searchInner}>
                <SearchBar value={value} onChange={onChange} placeholder="Search events..." className={styles.searchBar} onBlur={() => !value && onToggle()} />
                <button className={styles.searchClose} onClick={onToggle} aria-label="Close search"><X size={14} /></button>
            </div>
        </motion.div>
    );
}
export function SearchButton({ value, onChange }) {
    const [expanded, setExpanded] = useState(false);
    const toggle = () => { if (expanded && value) onChange(''); setExpanded(!expanded); };
    return (
        <div className={styles.searchContainer}>
            <AnimatePresence mode="wait">
                {expanded ? <ExpandedSearch key="ex" value={value} onChange={onChange} onToggle={toggle} /> : (
                    <motion.div key="icon" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                        <button className={styles.settingsBtn} onClick={toggle} title="Search events"><Search size={18} /></button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
