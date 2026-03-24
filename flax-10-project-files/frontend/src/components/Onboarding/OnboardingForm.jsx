/*
 * Onboarding form for year and course selection.
 */

import { AnimatePresence, motion } from "framer-motion";
import AnimatedDropdown from "../common/AnimatedDropdown";
import PrimaryButton from "../common/PrimaryButton/PrimaryButton";
import WarningBox from "./WarningBox";
import styles from "./OnboardingModal.module.css";

const YEARS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"];
const FORM_ANIMATION = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, y: -10 }, transition: { duration: 0.2 } };
const WARNING_ANIMATION = { initial: { opacity: 0, y: 8, height: 0 }, animate: { opacity: 1, y: 0, height: "auto" }, exit: { opacity: 0, y: 8, height: 0 } };
const STAR_ANIMATION = { rotate: [0, 20, -20, 12, -12, 0], scale: [1, 1.2, 1] };
const STAR_TRANSITION = { duration: 1.8, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" };

function YearCourseFields({ year, setYear, major, handleMajorChange, courseOptions, onDropdownOpenChange }) {
  return (
    <>
      <label className={styles.label}>Year of Study</label>
      <AnimatedDropdown value={year} onChange={setYear} placeholder="Select your year" options={YEARS} grouped={false} allowFlipUpward onOpenChange={(open) => onDropdownOpenChange?.("year", open)} />
      <label className={styles.label} style={{ marginTop: "1rem" }}>Course</label>
      <AnimatedDropdown value={major} onChange={handleMajorChange} placeholder="Select your course" options={courseOptions} grouped searchable allowFlipUpward onOpenChange={(open) => onDropdownOpenChange?.("course", open)} />
    </>
  );
}

function FormTitle() {
  return <h2 className={styles.title}>You&rsquo;re in the right place <motion.span className={styles.starSpan} animate={STAR_ANIMATION} transition={STAR_TRANSITION}>✦</motion.span></h2>;
}

function FormSubtitle() {
  return <p className={styles.subtitle}>Two quick things and we'll have your modules ready to go.</p>;
}

function WarningSection({ year, major, confirmed, setConfirmed }) {
  if (!year || !major) return null;
  return <AnimatePresence><motion.div initial={WARNING_ANIMATION.initial} animate={WARNING_ANIMATION.animate} exit={WARNING_ANIMATION.exit} transition={{ duration: 0.3, ease: "easeOut" }} style={{ overflow: "hidden" }}><WarningBox major={major} confirmed={confirmed} onConfirm={setConfirmed} /></motion.div></AnimatePresence>;
}

function SubmitButton({ loading, disabled, onClick }) {
  return <div className={styles.submitRow}><PrimaryButton onClick={onClick} disabled={disabled} className={styles.submitButton} pill>{loading ? "Setting up your modules..." : "Set up my modules"}</PrimaryButton></div>;
}

export default function OnboardingForm({ year, setYear, major, handleMajorChange, confirmed, setConfirmed, loading, handleSubmit, courseOptions, onDropdownOpenChange }) {
  const isSubmitDisabled = !year || !major || !confirmed || loading;
  return (
    <motion.div key="form" {...FORM_ANIMATION}>
      <FormTitle />
      <FormSubtitle />
      <YearCourseFields year={year} setYear={setYear} major={major} handleMajorChange={handleMajorChange} courseOptions={courseOptions} onDropdownOpenChange={onDropdownOpenChange} />
      <WarningSection year={year} major={major} confirmed={confirmed} setConfirmed={setConfirmed} />
      <SubmitButton loading={loading} disabled={isSubmitDisabled} onClick={handleSubmit} />
    </motion.div>
  );
}
