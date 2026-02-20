import { motion, AnimatePresence } from "framer-motion";
import AnimatedDropdown from "./AnimatedDropdown";
import WarningBox from "./WarningBox";
import styles from "./OnboardingModal.module.css";

const YEARS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"];

export default function OnboardingForm({ year, setYear, major, handleMajorChange, confirmed, setConfirmed, loading, handleSubmit, courseOptions }) {
  return (
    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
      <h2 className={styles.title}>Welcome to StudyFlax 👋</h2>
      <p className={styles.subtitle}>Tell us about yourself so we can set up your modules.</p>

      <label className={styles.label}>Year of Study</label>
      <AnimatedDropdown value={year} onChange={setYear} placeholder="Select your year" options={YEARS} grouped={false} />

      <label className={styles.label} style={{ marginTop: '1rem' }}>Course</label>
      <AnimatedDropdown value={major} onChange={handleMajorChange} placeholder="Select your course" options={courseOptions} grouped={true} />

      <AnimatePresence>
        {year && major && (
          <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: 8, height: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} style={{ overflow: 'hidden' }}
          >
            <WarningBox major={major} confirmed={confirmed} onConfirm={setConfirmed} />
          </motion.div>
        )}
      </AnimatePresence>

      <button className={styles.btn} onClick={handleSubmit} disabled={!year || !major || !confirmed || loading}>
        {loading ? "Setting up your modules..." : "Get Started"}
      </button>
    </motion.div>
  );
}