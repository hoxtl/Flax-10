import { X, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { ModulePill, TypePill, getModulePillColors } from "./ModulePill";

export function HomepageOverlays({
  selectedModulePill,
  setSelectedModulePill,
  enrolledModules,
  selectedDeadline,
  setSelectedDeadline,
  styles,
}) {
  return (
    <>
      {selectedModulePill && (() => {
        const mCode = selectedModulePill.code || "";
        const mId = selectedModulePill.id;
        const mColors = getModulePillColors(mCode);
        const mModule = enrolledModules.find((m) =>
          (mId && String(m.id) === String(mId)) ||
          (m.module_code || "").toUpperCase() === mCode.toUpperCase()
        );
        const mName = mModule?.module_name || mModule?.name || null;
        const mDept = mModule?.department || mModule?.school || null;
        const mDesc = mModule?.description || null;
        const mLeader = mModule?.module_leader || mModule?.leader || null;
        const mUrl = mId ? `/modules?moduleId=${mId}` : `/modules?code=${encodeURIComponent(mCode)}`;
        return (
          <div
            className={styles.deadlineDetailOverlay}
            onClick={() => setSelectedModulePill(null)}
            role="dialog"
            aria-modal
            aria-labelledby="module-card-title"
          >
            <div className={styles.moduleCardCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.moduleCardHeader}>
                <div
                  className={styles.moduleCardColorBar}
                  style={{ background: mColors.bg, color: mColors.text }}
                >
                  {mCode.slice(0, 2)}
                </div>
                <button
                  type="button"
                  className={styles.deadlineDetailClose}
                  onClick={() => setSelectedModulePill(null)}
                  aria-label="Close"
                >
                  <X size={14} strokeWidth={2} aria-hidden />
                </button>
              </div>
              <h2 id="module-card-title" className={styles.moduleCardCode} style={{ color: mColors.text }}>
                {mCode}
              </h2>
              {mName && <p className={styles.moduleCardName}>{mName}</p>}
              {mDept && <p className={styles.moduleCardDept}>{mDept}</p>}
              {mDesc && <p className={styles.moduleCardDesc}>{mDesc.length > 120 ? mDesc.slice(0, 120) + "…" : mDesc}</p>}
              {mLeader && <p className={styles.moduleCardLeader}>Leader: {mLeader}</p>}
              <div className={styles.moduleCardDivider} />
              <Link
                to={mUrl}
                className={styles.moduleCardLink}
                style={{ background: mColors.text }}
                onClick={() => setSelectedModulePill(null)}
              >
                View module →
              </Link>
            </div>
          </div>
        );
      })()}

      {selectedDeadline && (
        <div className={styles.deadlineDetailOverlay} onClick={() => setSelectedDeadline(null)} role="dialog" aria-modal aria-labelledby="deadline-detail-title">
          <div className={styles.deadlineDetailCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deadlineDetailHeader}>
              <div className={styles.deadlineDetailPills}>
                {selectedDeadline.module_code && (
                  <ModulePill moduleCode={selectedDeadline.module_code} />
                )}
                {selectedDeadline.deadline_type && (
                  <TypePill
                    typeLabel={selectedDeadline.deadline_type.charAt(0).toUpperCase() + selectedDeadline.deadline_type.slice(1)}
                    accentColor={selectedDeadline.module_code ? getModulePillColors(selectedDeadline.module_code).accent : undefined}
                  />
                )}
              </div>
            </div>
            <h2 id="deadline-detail-title" className={styles.deadlineDetailTitle}>
              {selectedDeadline.assessment_title || selectedDeadline.title || "Assignment"}
            </h2>
            {selectedDeadline.start_due_date && (
              <p className={styles.deadlineDetailDate}>
                Due: {new Date(selectedDeadline.start_due_date).toLocaleDateString("en-GB", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric"
                })}
              </p>
            )}
            {selectedDeadline.description && (
              <p className={styles.deadlineDetailDesc}>{selectedDeadline.description}</p>
            )}
            {selectedDeadline.location && (
              <p className={styles.deadlineDetailMeta}>
                <MapPin size={14} className={styles.deadlineDetailMetaIcon} aria-hidden />
                {selectedDeadline.location}
              </p>
            )}
            {(selectedDeadline.module_id != null || selectedDeadline.module != null || selectedDeadline.module_code) && (
              <Link
                to={selectedDeadline.module_id != null || selectedDeadline.module != null
                  ? `/modules?moduleId=${selectedDeadline.module_id ?? selectedDeadline.module}`
                  : `/modules?code=${encodeURIComponent(selectedDeadline.module_code)}`}
                className={styles.deadlineDetailLink}
                onClick={() => setSelectedDeadline(null)}
              >
                Go to module →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
