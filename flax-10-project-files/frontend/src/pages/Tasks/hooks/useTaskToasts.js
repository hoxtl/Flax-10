/**
 * Hook for managing task action toast notifications (undo, delete, info).
 */

import { useState } from "react";

/**
 * Returns toast state and handlers for task add/delete/info notifications.
 *
 * @returns {{ toastUndo, toastDelete, toastInfo, showUndoToast, clearUndoToast, showDeleteToast, showInfoToast }}
 */
export default function useTaskToasts() {
  const [toastUndo,   setToastUndo]   = useState(null);
  const [toastDelete, setToastDelete] = useState(false);
  const [toastInfo,   setToastInfo]   = useState(null);
  const showUndoToast   = (taskId, title) => { setToastUndo({ taskId, title }); setTimeout(() => setToastUndo(null), 5000); };
  const clearUndoToast  = () => setToastUndo(null);
  const showDeleteToast = () => { setToastDelete(true); setTimeout(() => setToastDelete(false), 3500); };
  const showInfoToast   = (msg) => { setToastInfo(msg); setTimeout(() => setToastInfo(null), 3000); };
  return { toastUndo, toastDelete, toastInfo, showUndoToast, clearUndoToast, showDeleteToast, showInfoToast };
}
