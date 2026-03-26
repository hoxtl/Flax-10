<<<<<<< HEAD
/*
 * Onboarding modal with course selection.
 */

import { useState } from "react";
=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { AnimatePresence } from "framer-motion";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import useOnboarding from "./hooks/useOnboarding";
import OnboardingForm from "./OnboardingForm";
import SuccessScreen from "./SuccessScreen";
import styles from "./OnboardingModal.module.css";
<<<<<<< HEAD
import StandardModal from "../common/standard_modal/StandardModal";
=======
import StandardModal from "../common/StandardModal/StandardModal";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

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
<<<<<<< HEAD
  <StandardModal onClose={onComplete} hideHeader size="lg" modalClassName={getOnboardingPanelClass(state, openDropdowns)} contentClassName={styles.modal} dismissOnBackdrop={false}>
      <ModalContent state={state} onComplete={onComplete} onDropdownOpenChange={(field, open) => setOpenDropdowns((current) => ({ ...current, [field]: open }))} />
=======
    <StandardModal
      onClose={onComplete} 
      hideHeader
      size="md"
      contentClassName={styles.modal}
    >
      <ModalContent state={state} onComplete={onComplete} />
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    </StandardModal>
  );
}
