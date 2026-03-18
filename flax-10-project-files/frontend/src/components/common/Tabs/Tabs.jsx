import { motion, AnimatePresence } from "framer-motion";
import { fadeInMotion, tabContentMotion } from "../motion/transitions";
import styles from "./Tabs.module.css";

export default function Tabs({
    tabs,
    activeTab,
    onTabChange,
    layoutId = "tabIndicator",
    compact = false,
    className = "",
    tabClassName = "",
    tabVariant = "default",
}) {
    if (!tabs?.length) return null;
    const containerClass = `${styles.container} ${compact ? styles.compact : ""} ${className}`.trim();
    return (
        <div className={containerClass}>
            <motion.div
                className={styles.tabBar}
                {...fadeInMotion}
            >
                {tabs.map(tab => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        isActive={activeTab === tab.id}
                        onClick={() => onTabChange(tab.id)}
                        layoutId={layoutId}
                        tabClassName={tabClassName}
                        tabVariant={tabVariant}
                    />
                ))}
            </motion.div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    {...tabContentMotion}
                    className={styles.content}
                >
                    {tabs.find(t => t.id === activeTab)?.content}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function TabButton({ tab, isActive, onClick, layoutId, tabClassName, tabVariant }) {
    const base = isActive ? `${styles.tab} ${styles.active}` : styles.tab;
    const variantClass = tabVariant === "heading" ? styles.headingTab : "";
    const cls = `${base} ${variantClass} ${tabClassName || ''}`.trim();
    return (
        <button className={cls} onClick={onClick} data-active={isActive ? "true" : "false"}>
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {isActive && (
                <motion.div className={styles.tabIndicator} layoutId={layoutId} />
            )}
        </button>
    );
}
