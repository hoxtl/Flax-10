import { motion, AnimatePresence } from "framer-motion";
import styles from "./Tabs.module.css";

export default function Tabs({ tabs, activeTab, onTabChange, rightAction }) {
    if (!tabs?.length) return null;
    return (
        <div className={styles.container}>
            <div className={styles.tabBar}>
                <div className={styles.tabList}>
                    {tabs.map(tab => <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={() => onTabChange(tab.id)} />)}
                </div>
                {rightAction && <div className={styles.rightAction}>{rightAction}</div>}
            </div>
            <div className={styles.content}>
                {tabs.find(t => t.id === activeTab)?.content}
            </div>
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
