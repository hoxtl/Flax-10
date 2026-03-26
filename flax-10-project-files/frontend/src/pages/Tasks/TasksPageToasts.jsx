/*
 * Toast stack for task page actions.
 */

import { AnimatePresence } from "framer-motion";

import AppToast from "../../components/common/app_toast/AppToast";

function UndoToastItem(props) {
  if (!props.toastUndo) return null;

  return (
    <AppToast
      message="Task added."
      actionLabel="Undo"
      onAction={props.handleUndoAddTask}
      onClose={() => props.setToastUndo(null)}
      variant="success"
    />
  );
}

function DeleteToastItem(props) {
  if (!props.toastDelete) return null;
  return <AppToast message="Task deleted." onClose={() => props.setToastDelete(false)} variant="success" />;
}

function getToastVariant(message) {
  return typeof message === "string" && message.toLowerCase().includes("deleted")
    ? "success"
    : "info";
}

function InfoToastItem(props) {
  if (!props.toastInfo) return null;
  return <AppToast message={props.toastInfo} onClose={() => props.setToastInfo(null)} variant={getToastVariant(props.toastInfo)} />;
}

export default function TasksPageToasts(props) {
  return (
    <AnimatePresence initial={false}>
      <UndoToastItem key="undo" {...props} />
      <DeleteToastItem key="delete" {...props} />
      <InfoToastItem key="info" {...props} />
    </AnimatePresence>
  );
}
