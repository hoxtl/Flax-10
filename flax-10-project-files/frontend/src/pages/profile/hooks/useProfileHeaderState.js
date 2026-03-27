/**
 * Profile header interaction state.
 */

import { useState } from "react";
import { fetchApi } from "../../../api/client";

function useHeaderCollections(profileData) {
  const [badges, setBadges] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSocieties, setShowSocieties] = useState(false);
  const pinnedBadgeId = profileData?.pinned_badge_id || "";
  return { badges, pinnedBadgeId, setBadges, setSocieties, setShowAchievements, setShowSocieties, showAchievements, showSocieties, societies };
}

function usePersonaState() {
  const [persona, setPersona] = useState(null);
  const [peakHour, setPeakHour] = useState(null);
  const setPersonaState = (nextPersona, nextPeakHour) => {
    setPersona(nextPersona);
    setPeakHour(nextPeakHour);
  };
  return { peakHour, persona, setPersonaState };
}

function buildNextPinnedBadgeId(pinnedBadgeId, badgeId) {
  return String(pinnedBadgeId) === String(badgeId) ? "" : String(badgeId || "");
}

export function useProfileHeaderState(profileData, visibility, reload) {
  const collections = useHeaderCollections(profileData);
  const personaState = usePersonaState();
  const handlePinBadge = async (badgeId) => {
    if (!visibility.canEditProfile) return;
    await fetchApi("/profile/", { method: "PATCH", body: JSON.stringify({ pinned_badge_id: buildNextPinnedBadgeId(collections.pinnedBadgeId, badgeId) }) });
    reload?.();
  };
  return {
    ...collections,
    ...personaState,
    closeAchievements: () => collections.setShowAchievements(false),
    closeSocieties: () => collections.setShowSocieties(false),
    handlePinBadge,
    openAchievements: () => collections.setShowAchievements(true),
    openSocieties: () => collections.setShowSocieties(true),
    setSocieties: collections.setSocieties,
  };
}
