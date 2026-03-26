<<<<<<< HEAD
/*
 * SearchButton.jsx
 * Expandable calendar search control.
 */

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import SearchBar from "../../common/search_bar/SearchBar";
import styles from "./CalendarHeaderUtils.module.css";

const MotionDiv = motion.div;

function SearchIcon({ onClick }) {
  return (
    <button
      type="button"
      className={styles.settingsBtn}
      onClick={onClick}
      title="Search events"
      aria-label="Search events"
    >
      <Search size={18} />
    </button>
  );
}

function useSearchFocus(ref) {
  useEffect(() => {
    const timer = setTimeout(() => ref.current?.querySelector("input")?.focus(), 120);
    return () => clearTimeout(timer);
  }, [ref]);
}

function ExpandedSearch({ value, onBlur, onChange, onClose }) {
  const ref = useRef(null);
  useSearchFocus(ref);
  return (
    <SearchMotion>
      <SearchInputRow
        inputRef={ref}
        value={value}
        onBlur={onBlur}
        onChange={onChange}
        onClose={onClose}
      />
    </SearchMotion>
  );
}

function SearchIconMotion({ onClick }) {
  return (
    <MotionDiv
      key="search-icon"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
    >
      <SearchIcon onClick={onClick} />
    </MotionDiv>
  );
}

function SearchMotion({ children }) {
  return (
    <MotionDiv
      key="search-expanded"
      className={styles.searchWrapper}
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: "auto", opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionDiv>
  );
}

function SearchInputRow({ inputRef, value, onBlur, onChange, onClose }) {
  return (
    <div ref={inputRef} className={styles.searchInner}>
      <SearchBar
        value={value}
        onChange={onChange}
        placeholder="Search events..."
        className={styles.searchBar}
        onBlur={onBlur}
      />
      <CloseSearchButton onClick={onClose} />
    </div>
  );
}

function CloseSearchButton({ onClick }) {
  return (
    <button
      type="button"
      className={styles.searchClose}
      onClick={onClick}
      aria-label="Close search"
    >
      <X size={14} />
    </button>
  );
}

function closeSearch(value, onChange, setExpanded) {
  if (value) onChange("");
  setExpanded(false);
}

function SearchContainer({ children }) {
  return (
    <div className={styles.searchContainer}>
      <AnimatePresence mode="wait">{children}</AnimatePresence>
    </div>
  );
}

export function SearchButton({ value, onChange }) {
  const [expanded, setExpanded] = useState(false);
  const onBlur = () => !value && setExpanded(false);
  const onClose = () => closeSearch(value, onChange, setExpanded);
  if (!expanded) return <SearchContainer><SearchIconMotion onClick={() => setExpanded(true)} /></SearchContainer>;
  return <SearchContainer><ExpandedSearch value={value} onBlur={onBlur} onChange={onChange} onClose={onClose} /></SearchContainer>;
=======
import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import SearchBar from '../../common/SearchBar/SearchBar';
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
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}
