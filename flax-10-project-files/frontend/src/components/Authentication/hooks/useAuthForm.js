/*
 * Shared state helper for auth forms.
 */

import { useState } from "react";

export function useAuthForm(initialState) {
  const [formData, setFormData] = useState(initialState);

  const updateField = (field) => (event) => {
    setFormData((current) => ({ ...current, [field]: event.target.value }));
  };

  const resetForm = () => {
    setFormData(initialState);
  };

  return { formData, setFormData, updateField, resetForm };
}
