/**
 * Homepage display-name hook.
 */

import { useMemo } from "react";

function readDisplayName() {
  try {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const firstName = user?.first_name?.trim();
    return firstName || user?.username?.trim() || null;
  } catch {
    return null;
  }
}

export function useHomepageDisplayName() {
  return useMemo(readDisplayName, []);
}
