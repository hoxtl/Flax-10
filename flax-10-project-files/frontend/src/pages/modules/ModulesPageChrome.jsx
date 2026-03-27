/*
 * Skeleton, modal, and transition wrappers for the modules page.
 */

import { AnimatePresence } from "framer-motion";
import { BackToTop } from "../../components/pagination/Pagination.jsx";
import ModuleForm from "../../components/modules/modules/ModuleForm.jsx";
import ModuleDetails from "../../components/modules/modules/ModuleDetails.jsx";
import StandardModal from "../../components/common/standard_modal/StandardModal.jsx";
import DeadlineModal from "../../components/modules/Deadlines/DeadlineModal.jsx";
import ReadingModal from "../../components/modules/Readings/ReadingModal.jsx";
import PageTransition from "../../components/common/page_transition/PageTransition.jsx";
import SkeletonBlock from "../../components/common/loading_state/SkeletonBlock";
import { isEnrolledIn } from "../../components/modules/utils/moduleUtils.js";
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
  const enrollment = state.hook.enrollments.find(e => e.module === state.viewingModule.id);
  return (
    <div className={styles.container}>
      <ModuleDetails
        module={state.viewingModule}
        is_enrolled={isEnrolledIn(state.viewingModule.id, state.hook.enrollments)}
        is_core={enrollment?.is_core || false}
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

function handleFormModalClose(state) {
  state.setShowForm(false);
  state.setEditingModule(null);
}

function EditModuleModal({ state }) {
  const handleSuccess = (savedModule) => {
    state.hook.handleModuleUpdated(savedModule);
    handleFormModalClose(state);
  };
  return (
    <StandardModal
      title="Edit Module"
      subtitle="Update the module details below"
      onClose={() => handleFormModalClose(state)}
      size="lg"
    >
      <ModuleForm module={state.editingModule} onSuccess={handleSuccess} onCancel={() => handleFormModalClose(state)} hideHeader />
    </StandardModal>
  );
}

function CreateModuleModal({ state }) {
  const handleSuccess = (savedModule, isNew) => {
    if (isNew) state.hook.handleModuleCreated(savedModule);
    handleFormModalClose(state);
  };
  return (
    <StandardModal
      title="Create Module"
      subtitle="Fill in the details to create a new module"
      onClose={() => handleFormModalClose(state)}
      size="lg"
    >
      <ModuleForm onSuccess={handleSuccess} onCancel={() => handleFormModalClose(state)} hideHeader />
    </StandardModal>
  );
}

export function AnimatedContent({ state, viewKey, MainView }) {
  const isFormModal = state.showForm;
  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <TransitionPane active={!isFormModal && Boolean(state.viewingModule)} viewKey={viewKey}><DetailsView state={state} /></TransitionPane>
        <TransitionPane active={!isFormModal && !state.viewingModule} viewKey={viewKey}><MainView state={state} /></TransitionPane>
      </AnimatePresence>
      {isFormModal && Boolean(state.editingModule) && <EditModuleModal state={state} />}
      {isFormModal && !state.editingModule && <CreateModuleModal state={state} />}
    </>
  );
}
