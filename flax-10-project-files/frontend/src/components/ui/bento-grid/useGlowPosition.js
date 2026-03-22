/**
 * Bento-card glow-position hook.
 */

import { useState } from "react";

const centerGlow = { x: "50%", y: "50%" };

export function useGlowPosition(cardRef) {
  const [glowPos, setGlowPos] = useState(centerGlow);

  return {
    glowPos,
    handleMouseMove: (event) => updateGlowPosition(cardRef, event, setGlowPos),
    resetGlow: () => setGlowPos(centerGlow),
  };
}

function updateGlowPosition(cardRef, event, setGlowPos) {
  if (!cardRef.current) return;
  const rect = cardRef.current.getBoundingClientRect();
  setGlowPos(getRelativeGlowPosition(event, rect));
}

function getRelativeGlowPosition(event, rect) {
  return {
    x: `${((event.clientX - rect.left) / rect.width) * 100}%`,
    y: `${((event.clientY - rect.top) / rect.height) * 100}%`,
  };
}
