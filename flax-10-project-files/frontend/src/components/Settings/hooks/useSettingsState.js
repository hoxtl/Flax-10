/*
 * Shared state container for settings save handlers.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { useState } from "react";

export default function useSettingsState() {
  const [isSaving, setIsSaving] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [homeAddressError, setHomeAddressError] = useState("");

  return {
    isSaving,
    setIsSaving,
    bannerMessage,
    setBannerMessage,
    passwordError,
    setPasswordError,
    homeAddressError,
    setHomeAddressError,
  };
}
