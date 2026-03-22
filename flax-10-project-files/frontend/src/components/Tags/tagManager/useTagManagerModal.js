/*
 * State and actions for the tag manager modal.
 */

import { useState } from "react";
import { useConfirm } from "../../../context/ConfirmContext";
import { useTags } from "../../../context/TagContext";
import { useToast } from "../../../context/ToastContext";
import {
  deleteTagWithConfirmation,
  saveTag,
} from "./tagManagerActions";

export default function useTagManagerModal() {
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();
  const { tags, addTag, updateTag, deleteTag } = useTags();

  return {
    tags,
    editingId,
    isAdding,
    setEditingId,
    setIsAdding,
    resetState: () => resetModalState(setEditingId, setIsAdding),
    onDelete: (id) => deleteTagWithConfirmation({ confirm, deleteTag, id, tags, toast }),
    onSave: (data) => saveTag({ addTag, confirm, data, editingId, resetState: () => resetModalState(setEditingId, setIsAdding), tags, updateTag }),
  };
}

function resetModalState(setEditingId, setIsAdding) {
  setEditingId(null);
  setIsAdding(false);
}
