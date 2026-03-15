import { motion, AnimatePresence } from "framer-motion";
import styles from "./Tabs.module.css";

export default function Tabs({ tabs, activeTab, onTabChange, layoutId = "tabIndicator" }) {
    if (!tabs?.length) return null;
    return (
        <div className={styles.container}>
            <motion.div
                className={styles.tabBar}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.35 }}
            >
                {tabs.map(tab => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        isActive={activeTab === tab.id}
                        onClick={() => onTabChange(tab.id)}
                        layoutId={layoutId}
                    />
                ))}
            </motion.div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className={styles.content}
                >
                    {tabs.find(t => t.id === activeTab)?.content}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function TabButton({ tab, isActive, onClick, layoutId }) {
    const cls = isActive ? `${styles.tab} ${styles.active}` : styles.tab;
    return (
        <button className={cls} onClick={onClick}>
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {isActive && (
                <motion.div className={styles.tabIndicator} layoutId={layoutId} />
            )}
        </button>
    );
}
