/*
 * Onboarding modal with course selection.
 */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import useOnboarding from "./hooks/useOnboarding";
import OnboardingForm from "./OnboardingForm";
import SuccessScreen from "./SuccessScreen";
import styles from "./OnboardingModal.module.css";
import StandardModal from "../common/StandardModal/StandardModal";

function getCourseOptions() {
  return Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({ label: dept, options: courses.map(c => ({ value: c, label: c })) }));
}

function ModalContent({ state, onComplete, onDropdownOpenChange }) {
  return (
    <AnimatePresence mode="wait">
      {state.done
        ? <SuccessScreen key="success" major={state.major} onComplete={onComplete} />
        : <OnboardingForm key="form" {...state} courseOptions={getCourseOptions()} onDropdownOpenChange={onDropdownOpenChange} />
      }
    </AnimatePresence>
  );
}

function getOnboardingPanelClass(state, openDropdowns) {
  const isExpanded = !state.done && Object.values(openDropdowns).some(Boolean);
  return [styles.onboardingPanel, isExpanded ? styles.onboardingPanelExpanded : ""].filter(Boolean).join(" ");
}

export default function OnboardingModal({ isOpen, onComplete }) {
  const state = useOnboarding();
  const [openDropdowns, setOpenDropdowns] = useState({ course: false, year: false });
  if (!isOpen) return null;
  return (
  <StandardModal onClose={onComplete} hideHeader size="lg" modalClassName={getOnboardingPanelClass(state, openDropdowns)} contentClassName={styles.modal} dismissOnBackdrop={false}>
      <ModalContent state={state} onComplete={onComplete} onDropdownOpenChange={(field, open) => setOpenDropdowns((current) => ({ ...current, [field]: open }))} />
    </StandardModal>
  );
}
