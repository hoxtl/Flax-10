/**
 * Word-loader rotation hook.
 */

import { useEffect, useState } from "react";

export function useWordLoader(words) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length < 2) return undefined;
    const interval = setInterval(() => setIndex((current) => getNextIndex(current, words.length, interval)), 1000);
    return () => clearInterval(interval);
  }, [words.length]);

  return { index, word: words[index] || "" };
}

function getNextIndex(index, wordCount, interval) {
  if (index >= wordCount - 1) {
    clearInterval(interval);
    return index;
  }

  return index + 1;
}
