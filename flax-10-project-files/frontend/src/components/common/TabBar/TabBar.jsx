/*
 * Reusable animated tab bar with underline indicator and content switcher.
 */

import { motion, AnimatePresence } from "framer-motion";
import styles from "./TabBar.module.css";

function TabButton({ tab, isActive, onClick, layoutId, variant }) {
  return (
    <button className={`${styles.tabBtn} ${styles[variant]} ${isActive ? styles.tabActive : ""}`} onClick={onClick}>
      {tab.label}
      {isActive && <motion.div className={styles.tabUnderline} layoutId={layoutId} />}
    </button>
  );
}

/** Animated tab bar with a sliding underline indicator. */

export function TabBar({ tabs, activeTab, onTabChange, layoutId = "tab-underline", variant = "default" }) {
  return (
    <motion.div className={`${styles.tabBar} ${styles[variant]}`}
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.28 }}>
      {tabs.map((t) => <TabButton key={t.id} tab={t} isActive={activeTab === t.id} onClick={() => onTabChange(t.id)} layoutId={layoutId} variant={variant} />)}
    </motion.div>
  );
}

/** Animated content area that transitions between tab panels. */

export function TabContent({ activeTab, children, minHeight = 320 }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeTab} className={styles.tabContent} style={{ minHeight }}
        initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28, ease: "easeOut" }}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
