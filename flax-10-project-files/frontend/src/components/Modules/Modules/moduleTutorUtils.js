/*
 * Shared tutor photo helpers for module cards and detail views.
 */

import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback.js";

export function getModuleTutorPhoto(moduleData) {
  return getResolvedUserPhoto({
    id: moduleData?.created_by,
    name: moduleData?.created_by_name,
    role: "teacher",
    username: moduleData?.created_by_username,
    profile_photo_url: moduleData?.created_by_profile_photo_url,
    seed: moduleData?.created_by_username || moduleData?.created_by || moduleData?.created_by_name,
  }, { allowGeneric: true });
}

export function hideBrokenTutorImage(event, fallbackDisplay = "flex") {
  event.currentTarget.style.display = "none";
  const fallback = event.currentTarget.nextElementSibling;
  if (fallback) fallback.style.display = fallbackDisplay;
}
