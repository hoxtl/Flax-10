/*
 * Animated tab bar with sliding indicator and fade-in content panel.
 */

import { motion as Motion, AnimatePresence } from "framer-motion";
import { fadeInMotion, tabContentMotion } from "../motion/transitions";
import styles from "./Tabs.module.css";

function TabButton({ tab, isActive, onClick, layoutId, tabClassName, tabVariant }) {
  const base = isActive ? `${styles.tab} ${styles.active}` : styles.tab;
  const variantClass = tabVariant === "heading" ? styles.headingTab : "";
  const cls = `${base} ${variantClass} ${tabClassName || ""}`.trim();
  return (
    <button className={cls} onClick={onClick} data-active={isActive ? "true" : "false"}>
      {tab.icon && <span>{tab.icon}</span>}
      <span>{tab.label}</span>
      {isActive && <Motion.div className={styles.tabIndicator} layoutId={layoutId} />}
    </button>
  );
}

function TabContent({ activeTab, tabs, disableContentAnimation = false, contentPresenceMode = "wait" }) {
  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;
  if (disableContentAnimation) {
    return <div className={styles.content}>{activeContent}</div>;
  }
  return (
    <AnimatePresence mode={contentPresenceMode}>
      <Motion.div key={activeTab} {...tabContentMotion} className={styles.content}>
        {activeContent}
      </Motion.div>
    </AnimatePresence>
  );
}

function buildContainerClass(compact, className) {
  return `${styles.container} ${compact ? styles.compact : ""} ${className}`.trim();
}

function TabBar({ activeTab, layoutId, onTabChange, tabClassName, tabVariant, tabs }) {
  return (
    <Motion.div className={styles.tabBar} {...fadeInMotion}>
      {tabs.map((tab) => (
        <TabButton key={tab.id} tab={tab} isActive={activeTab === tab.id} onClick={() => onTabChange(tab.id)} layoutId={layoutId} tabClassName={tabClassName} tabVariant={tabVariant} />
      ))}
    </Motion.div>
  );
}

/*
 * Renders an animated tab bar with optional content transitions.
 */

export default function Tabs(props) {
  const { tabs, activeTab, onTabChange, layoutId = "tabIndicator", compact = false, className = "", tabClassName = "", tabVariant = "default", middle, disableContentAnimation = false, contentPresenceMode = "wait" } = props;
  if (!tabs?.length) return null;
  const containerClass = buildContainerClass(compact, className);
  return (
    <div className={containerClass}>
      <TabBar activeTab={activeTab} layoutId={layoutId} onTabChange={onTabChange} tabClassName={tabClassName} tabVariant={tabVariant} tabs={tabs} />
      {middle}
      <TabContent activeTab={activeTab} tabs={tabs} disableContentAnimation={disableContentAnimation} contentPresenceMode={contentPresenceMode} />
    </div>
  );
}
