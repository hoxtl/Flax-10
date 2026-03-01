import AnimatedDropdown from "./AnimatedDropdown";
import WarningBox from "./WarningBox";
import styles from "./OnboardingModal.module.css";
import { motion, AnimatePresence } from "framer-motion";

const YEARS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"];

function YearCourseFields({ year, setYear, major, handleMajorChange, courseOptions }) {
  return (
    <>
      <label className={styles.label}>Year of Study</label>
      <AnimatedDropdown value={year} onChange={setYear} placeholder="Select your year" options={YEARS} grouped={false} />
      <label className={styles.label} style={{ marginTop: '1rem' }}>Course</label>
      <AnimatedDropdown value={major} onChange={handleMajorChange} placeholder="Select your course" options={courseOptions} grouped={true} searchable={true} />
    </>
  );
}

function WarningSection({ year, major, confirmed, setConfirmed }) {
  return (
    <AnimatePresence>
      {year && major && (
        <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: 8, height: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} style={{ overflow: 'hidden' }}>
          <WarningBox major={major} confirmed={confirmed} onConfirm={setConfirmed} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function OnboardingForm({ year, setYear, major, handleMajorChange, confirmed, setConfirmed, loading, handleSubmit, courseOptions }) {
  return (
    <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
      <h2 className={styles.title}>Welcome to StudyFlax 👋</h2>
      <p className={styles.subtitle}>Tell us about yourself so we can set up your modules.</p>
      <YearCourseFields year={year} setYear={setYear} major={major} handleMajorChange={handleMajorChange} courseOptions={courseOptions} />
      <WarningSection year={year} major={major} confirmed={confirmed} setConfirmed={setConfirmed} />
      <button className={styles.btn} onClick={handleSubmit} disabled={!year || !major || !confirmed || loading}>
        {loading ? "Setting up your modules..." : "Get Started"}
      </button>
    </motion.div>
  );
}