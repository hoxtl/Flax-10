/*
 * Scroll helpers for moving users to the auth form card.
 */

import { useCallback } from "react";

function scrollToFormCard() {
  const formCard = document.getElementById("auth-form-card");
  if (!formCard) return;
  formCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function useAuthPageScroll(handleToggle) {
  const showSignIn = useCallback(() => {
    handleToggle(true);
    scrollToFormCard();
  }, [handleToggle]);

  const showSignUp = useCallback(() => {
    handleToggle(false);
    scrollToFormCard();
  }, [handleToggle]);

  return { showSignIn, showSignUp };
}
