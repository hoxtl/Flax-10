import { useEffect } from "react";
import { useModuleModal } from "../../context/ModuleModalContext";
import useModules from "./hooks/useModules";
import { isEnrolledIn } from "./utils/moduleUtils";
import ModuleDetails from "./ModuleDetails";
import styles from "./ModuleDetailModal.module.css";

export default function ModuleDetailModal() {
  const { module, loading, error, closeModuleModal, isOpen } = useModuleModal();
  const hook = useModules();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeModuleModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeModuleModal]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={closeModuleModal}
      onKeyDown={(e) => e.key === "Escape" && closeModuleModal()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-modal-title"
    >
      <div
        className={styles.scrollWrap}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && closeModuleModal()}
      >
        <div className={styles.headerRow}>
          <button
            type="button"
            className={styles.backLink}
            onClick={closeModuleModal}
          >
            ← Close
          </button>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={closeModuleModal}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className={styles.content}>
          {loading && (
            <div className={styles.loadingWrap}>Loading module…</div>
          )}
          {error && (
            <div className={styles.errorWrap}>{error}</div>
          )}
          {module && !loading && (
            <ModuleDetails
              module={module}
              is_enrolled={isEnrolledIn(module.id, hook.enrollments)}
              onBack={closeModuleModal}
              onEnroll={() => hook.handleEnrollment(module)}
              onUnenroll={() => hook.handleDisenrol(module)}
              inModal
            />
          )}
        </div>
      </div>
    </div>
  );
}
