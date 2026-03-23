/*
 * Skeleton, modal, and transition wrappers for the modules page.
 */

import { AnimatePresence } from "framer-motion";
import { BackToTop } from "../../components/Pagination/Pagination.jsx";
import ModuleForm from "../../components/Modules/Modules/ModuleForm.jsx";
import ModuleDetails from "../../components/Modules/Modules/ModuleDetails.jsx";
import DeadlineModal from "../../components/Modules/Deadlines/DeadlineModal.jsx";
import ReadingModal from "../../components/Modules/Readings/ReadingModal.jsx";
import PageTransition from "../../components/common/PageTransition/PageTransition.jsx";
import SkeletonBlock from "../../components/common/LoadingState/SkeletonBlock";
import { isEnrolledIn } from "../../components/Modules/utils/moduleUtils.js";
import styles from "./ModulesPage.module.css";

function SkeletonHeader() {
  return (
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonHeaderText}>
        <SkeletonBlock className={styles.skeletonTitle} />
        <SkeletonBlock className={styles.skeletonSubtitle} />
      </div>
      <SkeletonBlock className={styles.skeletonAction} />
    </div>
  );
}

function SkeletonToolbar() {
  return (
    <div className={styles.skeletonToolbar}>
      <SkeletonBlock className={styles.skeletonSearch} />
      <SkeletonBlock className={styles.skeletonSelect} />
      <SkeletonBlock className={styles.skeletonSelect} />
      <SkeletonBlock className={styles.skeletonSort} />
    </div>
  );
}

export function ModulesSkeleton() {
  return (
    <div className={styles.container} data-testid="modules-skeleton" aria-busy="true">
      <SkeletonHeader />
      <SkeletonToolbar />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 6 }).map((_, index) => <SkeletonBlock key={index} className={styles.skeletonCard} />)}
      </div>
    </div>
  );
}

export function getViewKey(showForm, viewingModule) {
  if (showForm) return "modules-form";
  if (!viewingModule) return "modules-list";
  return `modules-details-${viewingModule.id || viewingModule.module_code || "active"}`;
}

export function FormView({ state }) {
  const handleSuccess = (savedModule, isNew) => {
    if (isNew) state.hook.handleModuleCreated(savedModule);
    if (!isNew) state.hook.handleModuleUpdated(savedModule);
    state.setShowForm(false);
    state.setEditingModule(null);
  };
  return (
    <div className={styles.container}>
      <ModuleForm module={state.editingModule} onSuccess={handleSuccess} onCancel={() => handleFormCancel(state)} />
    </div>
  );
}

function handleFormCancel(state) {
  state.setShowForm(false);
  state.setEditingModule(null);
}

export function DetailsView({ state }) {
  return (
    <div className={styles.container}>
      <ModuleDetails
        module={state.viewingModule}
        is_enrolled={isEnrolledIn(state.viewingModule.id, state.hook.enrollments)}
        is_teacher={state.isTeacher}
        onBack={() => handleBackFromDetails(state)}
        onEnroll={() => state.hook.handleEnrollment(state.viewingModule)}
        onUnenroll={() => state.hook.handleDisenrol(state.viewingModule)}
      />
      <BackToTop />
    </div>
  );
}

function handleBackFromDetails(state) {
  state.setViewingModule(null);
  state.setSearchQuery("");
}

function DeadlineOnlyModal({ state }) {
  if (!state.deadlineModule) return null;
  return <DeadlineModal module={state.deadlineModule} onClose={() => state.setDeadlineModule(null)} />;
}

export function ModulesPageModals({ state }) {
  if (state.showForm || state.viewingModule) return null;
  return (
    <>
      <DeadlineOnlyModal state={state} />
      {state.readingModule && <ReadingModal module={state.readingModule} onClose={() => state.setReadingModule(null)} />}
    </>
  );
}

export function TestModeContent({ state, MainView }) {
  if (state.showForm) return <FormView state={state} />;
  if (state.viewingModule) return <DetailsView state={state} />;
  return (
    <>
      <MainView state={state} />
      <DeadlineOnlyModal state={state} />
    </>
  );
}

function TransitionPane({ active, viewKey, children }) {
  if (!active) return null;
  return <PageTransition key={viewKey}>{children}</PageTransition>;
}

export function AnimatedContent({ state, viewKey, MainView }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <TransitionPane active={state.showForm} viewKey={viewKey}><FormView state={state} /></TransitionPane>
      <TransitionPane active={!state.showForm && Boolean(state.viewingModule)} viewKey={viewKey}><DetailsView state={state} /></TransitionPane>
      <TransitionPane active={!state.showForm && !state.viewingModule} viewKey={viewKey}><MainView state={state} /></TransitionPane>
    </AnimatePresence>
  );
}
