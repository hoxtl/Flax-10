/**
 * Homepage route composition.
 */

import { AnimatePresence } from "framer-motion";
import AppToast from "../../components/common/app_toast/AppToast";
import { HomepageDashboard } from "./components/HomepageDashboard";
import { useHomepageController } from "./hooks/useHomepageController";

export default function Homepage(props) {
  const homepage = useHomepageController(props.defaultShowCreateTaskModal, props.defaultPlanTimelineReadItem);
  return <HomepageContent {...homepage} />;
}

function HomepageContent(props) {
  return (
    <>
      <HomepageDashboard {...props} />
      <HomepageFallbackToast {...props.toast} />
    </>
  );
}

function HomepageFallbackToast({ fallbackToast, setFallbackToast, toastApi }) {
  return (
    <AnimatePresence initial={false}>
      {!toastApi && fallbackToast && <AppToast {...fallbackToast} onClose={() => setFallbackToast(null)} />}
    </AnimatePresence>
  );
}
