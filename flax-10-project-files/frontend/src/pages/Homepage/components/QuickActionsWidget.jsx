import { motion } from "framer-motion";
import { Zap, Sparkles, Plus, RefreshCw, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import styles from "./QuickActionsWidget.module.css";

const containerVariants = {
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const primaryVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] } },
};

export function QuickActionsWidget({ onStartFocus, onAddEvent, onRePlanDay, focusWindowDuration }) {
  const navigate = useNavigate();
  const hasFocusNow = !!onStartFocus;

  const handleFocus = () => (onStartFocus ? onStartFocus() : navigate("/timer"));
  const handleAddEvent = () => (onAddEvent ? onAddEvent() : navigate("/calendar"));
  const handleRePlan = () => (onRePlanDay ? onRePlanDay() : navigate("/calendar"));

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Zap className={styles.headerIcon} size={16} strokeWidth={1.75} aria-hidden />
        <span className={styles.headerLabel}>Quick Actions</span>
      </div>

      <motion.div className={styles.list} initial="hidden" animate="visible" variants={containerVariants}>

        {/* Primary: Start Focus Session */}
        <motion.button
          type="button"
          className={styles.primaryCard}
          variants={primaryVariants}
          whileHover={{ scale: 1.01, y: -1 }}
          whileTap={{ scale: 0.98, y: 0 }}
          onClick={handleFocus}
        >
          <div className={styles.primaryLeft}>
            {hasFocusNow && (
              <motion.span
                className={styles.primaryDot}
                aria-hidden
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            <Sparkles size={20} strokeWidth={1.75} className={styles.primaryIcon} aria-hidden />
            <div className={styles.primaryTextBlock}>
              <span className={styles.primaryLabel}>Start Focus Session</span>
              {hasFocusNow && (
                <span className={styles.primarySub}>
                  {focusWindowDuration ? `${focusWindowDuration} window available` : "Focus window available now"}
                </span>
              )}
            </div>
          </div>
          <motion.span
            className={styles.primaryArrow}
            aria-hidden
            whileHover={{ x: 3 }}
            transition={{ duration: 0.15 }}
          >
            <ArrowRight size={16} strokeWidth={1.75} />
          </motion.span>
        </motion.button>

        {/* Secondary: Add Event */}
        <motion.button
          type="button"
          className={styles.secondaryCard}
          variants={cardVariants}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          onClick={handleAddEvent}
        >
          <Plus size={18} strokeWidth={2} className={styles.secondaryIconAdd} aria-hidden />
          <span className={styles.secondaryLabel}>Add Event</span>
          <motion.span
            className={styles.secondaryArrow}
            aria-hidden
            whileHover={{ x: 3 }}
            transition={{ duration: 0.15 }}
          >
            <ArrowRight size={14} strokeWidth={1.75} />
          </motion.span>
        </motion.button>

        {/* Tertiary: Re-plan My Day */}
        <motion.button
          type="button"
          className={styles.secondaryCard}
          variants={cardVariants}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          onClick={handleRePlan}
        >
          <motion.span
            aria-hidden
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{ display: "flex", flexShrink: 0 }}
          >
            <RefreshCw size={18} strokeWidth={1.75} className={styles.secondaryIconRefresh} />
          </motion.span>
          <span className={styles.secondaryLabel}>
            Re-plan My Day
            <span className={styles.aiPill}>AI</span>
          </span>
          <motion.span
            className={styles.secondaryArrow}
            aria-hidden
            whileHover={{ x: 3 }}
            transition={{ duration: 0.15 }}
          >
            <ArrowRight size={14} strokeWidth={1.75} />
          </motion.span>
        </motion.button>
      </motion.div>
    </div>
  );
}
