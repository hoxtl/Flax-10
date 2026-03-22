/*
 * Chooses the active tag manager view.
 */

import TagForm from "./TagForm";
import TagList from "./TagList";
import { getInitialTagForm, isProtectedTag } from "./tagManagerUtils";

export default function TagManagerContent({ modal }) {
  if (!modal.editingId && !modal.isAdding) return <TagList modal={modal} />;
  return <TagManagerFormView modal={modal} />;
}

function TagManagerFormView({ modal }) {
  const initialData = getInitialTagForm(modal.tags, modal.editingId);
  const tag = modal.tags.find((currentTag) => currentTag.id === modal.editingId);

  return (
    <TagForm
      initialData={initialData}
      isProtected={isProtectedTag(tag?.label)}
      onCancel={modal.resetState}
      onSave={modal.onSave}
    />
  );
}
