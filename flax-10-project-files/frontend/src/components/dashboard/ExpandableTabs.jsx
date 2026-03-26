import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./ExpandableTabs.module.css";

const buttonVariants = {
  animate: (isSelected) => ({
    gap: isSelected ? "8px" : 0,
    paddingLeft: isSelected ? "14px" : "8px",
    paddingRight: isSelected ? "14px" : "8px",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

const transition = { delay: 0.05, type: "spring", bounce: 0, duration: 0.5 };

function Separator() {
  return <div className={styles.separator} aria-hidden="true" />;
}

function TabLabel({ title }) {
  return (
    <motion.span variants={spanVariants} initial="initial" animate="animate"
      exit="exit" transition={transition} className={styles.tabLabel}>
      {title}
    </motion.span>
  );
}

function TabIcon({ icon: Icon }) {
  return <Icon size={18} />;
}

function TabBadge({ count }) {
  if (!count || count <= 0) return null;
  return <span className={styles.badge}>{count > 99 ? '99+' : count}</span>;
}

function TabInner({ tab, isSelected }) {
  return (
    <>
      <TabIcon icon={tab.icon} />
      <TabBadge count={tab.badge} />
      <AnimatePresence initial={false}>
        {isSelected && <TabLabel title={tab.title} />}
      </AnimatePresence>
    </>
  );
}

function Tab({ tab, index, isSelected, onSelect }) {
  const cls = `${styles.tab} ${isSelected ? styles.tabActive : ""}`;
  return (
    <motion.button className={cls} variants={buttonVariants} initial={false}
      animate="animate" custom={isSelected} onClick={() => onSelect(index)} transition={transition}>
      <TabInner tab={tab} isSelected={isSelected} />
    </motion.button>
  );
}

function useClickOutside(ref, onClose) {
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onClose]);
}

function useTabState(onChange) {
  const [selected, setSelected] = useState(null);
  const deselect = () => { setSelected(null); onChange?.(null); };
  const handleSelect = (index) => {
    const next = selected === index ? null : index;
    setSelected(next);
    // Always trigger onChange when a tab is explicitly clicked, even if it's already selected
    // This ensures actionable tabs like "Add" always fire their callbacks.
    onChange?.(index);
  };
  return { selected, deselect, handleSelect };
}

function TabList({ tabs, selected, onSelect }) {
  return tabs.map((tab, index) => {
    if (tab.type === "separator") return <Separator key={`sep-${index}`} />;
    return <Tab key={tab.title} tab={tab} index={index} isSelected={selected === index} onSelect={onSelect} />;
  });
}

export function ExpandableTabs({ tabs, onChange }) {
  const ref = useRef(null);
  const { selected, deselect, handleSelect } = useTabState(onChange);
  useClickOutside(ref, deselect);
  return (
    <div ref={ref} className={styles.container}>
      <TabList tabs={tabs} selected={selected} onSelect={handleSelect} />
    </div>
  );
}