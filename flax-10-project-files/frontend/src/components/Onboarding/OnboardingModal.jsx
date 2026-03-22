import { AnimatePresence } from "framer-motion";
import { KCL_DEPARTMENTS } from "../../lib/kclCourses";
import useOnboarding from "./hooks/useOnboarding";
import OnboardingForm from "./OnboardingForm";
import SuccessScreen from "./SuccessScreen";
import styles from "./OnboardingModal.module.css";
import StandardModal from "../Common/StandardModal/StandardModal";

function getCourseOptions() {
  return Object.entries(KCL_DEPARTMENTS).map(([dept, courses]) => ({
    label: dept,
    options: courses.map(c => ({ value: c, label: c }))
  }));
}

function ModalContent({ state, onComplete }) {
  return (
    <AnimatePresence mode="wait">
      {state.done
        ? <SuccessScreen key="success" major={state.major} onComplete={onComplete} />
        : <OnboardingForm key="form" {...state} courseOptions={getCourseOptions()} />
      }
    </AnimatePresence>
  );
}

export default function OnboardingModal({ isOpen, onComplete }) {
  const state = useOnboarding();
  if (!isOpen) return null;
  return (
    <StandardModal
      onClose={onComplete} 
      hideHeader
      size="md"
      contentClassName={styles.modal}
    >
      <ModalContent state={state} onComplete={onComplete} />
    </StandardModal>
  );
}