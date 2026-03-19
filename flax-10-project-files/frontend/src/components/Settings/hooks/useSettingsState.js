/*
 * Shared state container for settings save handlers.
 */
import { useState } from "react";

export default function useSettingsState() {
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [homeAddressError, setHomeAddressError] = useState("");

  return {
    isSaving,
    setIsSaving,
    successMessage,
    setSuccessMessage,
    passwordError,
    setPasswordError,
    homeAddressError,
    setHomeAddressError,
  };
}
