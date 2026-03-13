import { useEffect, useState } from "react";

export default function useBreakpoint(breakpoint = 900) {
  const [matches, setMatches] = useState(() => window.innerWidth < breakpoint);

  useEffect(() => {
    const onResize = () => setMatches(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return matches;
}
