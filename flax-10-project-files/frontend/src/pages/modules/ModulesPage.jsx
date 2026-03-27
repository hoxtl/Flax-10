/*
 * Modules page entry for browsing, enrolling, and managing course modules.
 */

import { MainView } from "./components/ModulesPageResults.jsx";
import {
  AnimatedContent,
  getViewKey,
  ModulesPageModals,
  ModulesSkeleton,
  TestModeContent,
} from "./components/ModulesPageChrome.jsx";
import { useModulesPageState } from "./hooks/modulesPageHooks.js";
import HoldConfirmModal from "../../components/common/hold_confirm_modal/HoldConfirmModal.jsx";

function DeleteModuleModal({ state }) {
  const mod = state.deletingModule;
  if (!mod) return null;
  return (
    <HoldConfirmModal
      title="Delete Module"
      warningBanner="This will permanently remove this module and all enrolled students. This cannot be undone."
      warningText={`Are you sure you want to delete "${mod.module_name}"? Any students currently enrolled will be immediately unenrolled. This is irreversible.`}
      holdLabel="Hold to Delete"
      cancelLabel="Keep Module"
      onConfirm={() => {
        state.setDeletingModule(null);
        state.hook.handleDirectDeleteModule(mod, () => state.setViewingModule?.(null));
      }}
      onCancel={() => state.setDeletingModule(null)}
    />
  );
}

export default function ModulesPage({ initialSearch = "", initialCreate = false }) {
  const state = useModulesPageState(initialSearch, initialCreate);
  if (state.hook.loading) return <ModulesSkeleton />;
  if (isTestEnv()) return <TestModeContent state={state} MainView={MainView} />;
  return (
    <>
      <AnimatedContent state={state} viewKey={getViewKey(state.showForm, state.viewingModule)} MainView={MainView} />
      <ModulesPageModals state={state} />
      <DeleteModuleModal state={state} />
    </>
  );
}

function isTestEnv() {
  return typeof process !== "undefined" && process.env?.NODE_ENV === "test";
}
