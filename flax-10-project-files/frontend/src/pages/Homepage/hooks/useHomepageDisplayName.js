/**
 * Homepage display-name hook.
 */

import { useMemo } from "react";

function readDisplayName() {
  try {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    const user = JSON.parse(storedUser);
    return (user.first_name || "").trim() || (user.username || "").trim() || null;
  } catch {
    return null;
  }
}

export function useHomepageDisplayName() {
  return useMemo(readDisplayName, []);
}
