import { useEffect, useState } from "react";

export function TypingAnimation({ text, duration = 80, className }) {
  const [displayed, setDisplayed] = useState("");
  const [i, setI] = useState(0);

  useEffect(() => {
    if (i >= text.length) return;
    const timer = setTimeout(() => {
      setDisplayed(text.substring(0, i + 1));
      setI(i + 1);
    }, duration);
    return () => clearTimeout(timer);
  }, [i, text, duration]);

  return <span className={className}>{displayed || text}</span>;
}