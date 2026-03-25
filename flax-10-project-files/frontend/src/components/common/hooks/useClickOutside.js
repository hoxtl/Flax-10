/*
 * Runs a callback when a pointer event lands outside the referenced element.
 */

import { useEffect } from "react";

export function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handler = (event) => ref.current && !ref.current.contains(event.target) && onOutside();
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}
