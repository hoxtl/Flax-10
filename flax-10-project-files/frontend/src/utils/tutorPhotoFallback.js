function normalise(value = "") {
  return `${value}`.trim().toLowerCase();
}

const TUTOR_PHOTOS = {
  "alice miller": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
  amiller: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
  "sam rahwan": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
  srahwan: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
  "james murphy": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&h=96&q=80",
  jmurphy: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&h=96&q=80",
  "eric chen": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
  echen: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
  "hena patel": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80",
  hpatel: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80",
  "sarah wan": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80",
};

const GENERIC_PHOTOS = [
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=96&h=96&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=96&h=96&q=80",
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&h=96&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=96&h=96&q=80",
];

function getHash(value = "") {
  return Math.abs(
    [...`${value || "tutor"}`].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  );
}

export function getTutorPhotoFallback({ fullName = "", username = "", seed = "", allowGeneric = false } = {}) {
  const byName = TUTOR_PHOTOS[normalise(fullName)];
  if (byName) return byName;

  const byUsername = TUTOR_PHOTOS[normalise(username)];
  if (byUsername) return byUsername;

  if (!allowGeneric) return null;
  const index = getHash(`${fullName}-${username}-${seed}`);
  return GENERIC_PHOTOS[index % GENERIC_PHOTOS.length];
}

export function getResolvedUserPhoto(user, options = {}) {
  if (!user) return null;

  const direct =
    user.profile_photo_url ||
    user.profile_photo ||
    user.avatar ||
    null;
  if (direct) return direct;

  const fullName =
    user.name ||
    `${user.first_name || ""} ${user.last_name || ""}`.trim();

  return getTutorPhotoFallback({
    fullName,
    username: user.username,
    seed: options.seed,
    allowGeneric: Boolean(options.allowGeneric),
  });
}
