import AnimatedDropdown from "../common/AnimatedDropdown";
import WarningBox from "./WarningBox";
import styles from "./OnboardingModal.module.css";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Onboarding form for selecting year and course before module setup.
 */
const YEARS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"];
const FORM_ANIMATION = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 } };
const WARNING_ANIMATION = { initial: { opacity: 0, y: 8, height: 0 }, animate: { opacity: 1, y: 0, height: "auto" }, exit: { opacity: 0, y: 8, height: 0 } };
const STAR_ANIMATION = { rotate: [0, 20, -20, 12, -12, 0], scale: [1, 1.2, 1] };
const STAR_TRANSITION = { duration: 1.8, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" };

function YearCourseFields({ year, setYear, major, handleMajorChange, courseOptions }) {
  return (
    <>
      <label className={styles.label}>Year of Study</label>
      <AnimatedDropdown value={year} onChange={setYear} placeholder="Select your year" options={YEARS} grouped={false} />
      <label className={styles.label} style={{ marginTop: "1rem" }}>Course</label>
      <AnimatedDropdown value={major} onChange={handleMajorChange} placeholder="Select your course" options={courseOptions} grouped={true} searchable={true} />
    </>
  );
}

function FormTitle() {
  return (
    <h2 className={styles.title}>
      You&rsquo;re in the right place{" "}
      <motion.span style={{ display: "inline-block", color: "var(--primary, #9E7E5D)" }} animate={STAR_ANIMATION} transition={STAR_TRANSITION}>
        ✦
      </motion.span>
    </h2>
  );
}

function WarningSection({ year, major, confirmed, setConfirmed }) {
  if (!year || !major) return null;
  return (
    <AnimatePresence>
      <motion.div initial={WARNING_ANIMATION.initial} animate={WARNING_ANIMATION.animate} exit={WARNING_ANIMATION.exit} transition={{ duration: 0.3, ease: "easeOut" }} style={{ overflow: "hidden" }}>
        <WarningBox major={major} confirmed={confirmed} onConfirm={setConfirmed} />
      </motion.div>
    </AnimatePresence>
  );
}

import PrimaryButton from "../common/PrimaryButton/PrimaryButton";

/**
 * Collects onboarding fields and confirms course mapping before setup.
 */
export default function OnboardingForm({ year, setYear, major, handleMajorChange, confirmed, setConfirmed, loading, handleSubmit, courseOptions }) {
  const isSubmitDisabled = !year || !major || !confirmed || loading;
  return (
    <motion.div key="form" {...FORM_ANIMATION}>
      <FormTitle />
      <p className={styles.subtitle}>Two quick things and we'll have your modules ready to go.</p>
      <YearCourseFields year={year} setYear={setYear} major={major} handleMajorChange={handleMajorChange} courseOptions={courseOptions} />
      <WarningSection year={year} major={major} confirmed={confirmed} setConfirmed={setConfirmed} />
      <div style={{ marginTop: "1.25rem" }}>
        <PrimaryButton 
          onClick={handleSubmit} 
          disabled={isSubmitDisabled}
          loading={loading}
          width="100%"
          pill
        >
          {loading ? "Setting up your modules..." : "Set up my modules"}
        </PrimaryButton>
      </div>
    </motion.div>
  );
}
