/*
 * Password settings form.
 */
import { useState } from "react";
import SecurityFormLayout from "./SecurityFormLayout";

function usePasswordForm() {
  const [formData, setFormData] = useState({ newPassword: "", confirmPassword: "" });
  const [saveSignal, setSaveSignal] = useState(0);
  return { formData, setFormData, saveSignal, setSaveSignal };
}

export default function SecurityForm({ onSave, isSaving, error }) {
  const form = usePasswordForm();
  const hasUnsaved = Boolean(form.formData.newPassword || form.formData.confirmPassword);

  const handleChange = (event) => {
    const { name, value } = event.target;
    form.setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const ok = await onSave(form.formData);
    if (ok) {
      form.setFormData({ newPassword: "", confirmPassword: "" });
      form.setSaveSignal((count) => count + 1);
    }
  };

  return <SecurityFormLayout onSubmit={handleSubmit} error={error} formData={form.formData} handleChange={handleChange} isSaving={isSaving} hasUnsaved={hasUnsaved} saveSignal={form.saveSignal} />;
}
