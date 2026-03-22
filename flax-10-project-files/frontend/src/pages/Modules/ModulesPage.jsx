/*
 * Modules page entry for browsing, enrolling, and managing course modules.
 */
import { MainView } from "./ModulesPageResults.jsx";
import {
  AnimatedContent,
  getViewKey,
  ModulesPageModals,
  ModulesSkeleton,
  TestModeContent,
} from "./ModulesPageChrome.jsx";
import { useModulesPageState } from "./modulesPageHooks.js";

export default function ModulesPage({ initialSearch = "", initialCreate = false }) {
  const state = useModulesPageState(initialSearch, initialCreate);
  if (state.hook.loading) return <ModulesSkeleton />;
  if (isTestEnv()) return <TestModeContent state={state} MainView={MainView} />;
  return (
    <>
      <AnimatedContent state={state} viewKey={getViewKey(state.showForm, state.viewingModule)} MainView={MainView} />
      <ModulesPageModals state={state} />
    </>
  );
}

function isTestEnv() {
  return typeof process !== "undefined" && process.env?.NODE_ENV === "test";
}
