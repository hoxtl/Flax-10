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

function Tab({ tab, index, isSelected, onSelect }) {
  const Icon = tab.icon;
  return (
    <motion.button
      className={`${styles.tab} ${isSelected ? styles.tabActive : ""}`}
      variants={buttonVariants}
      initial={false}
      animate="animate"
      custom={isSelected}
      onClick={() => onSelect(index)}
      transition={transition}
    >
      <Icon size={18} />
      <AnimatePresence initial={false}>
        {isSelected && (
          <motion.span
            variants={spanVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className={styles.tabLabel}
          >
            {tab.title}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function ExpandableTabs({ tabs, onChange }) {
  const [selected, setSelected] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setSelected(null);
        onChange?.(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onChange]);

  const handleSelect = (index) => {
    const next = selected === index ? null : index;
    setSelected(next);
    onChange?.(next);
  };

  return (
    <div ref={ref} className={styles.container}>
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`sep-${index}`} />;
        }
        return (
          <Tab
            key={tab.title}
            tab={tab}
            index={index}
            isSelected={selected === index}
            onSelect={handleSelect}
          />
        );
      })}
    </div>
  );
}