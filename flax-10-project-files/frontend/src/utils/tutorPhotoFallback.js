/*
 * Deterministic avatar fallbacks for tutors and students.
 */

function normalise(value = "") {
  return `${value}`.trim().toLowerCase().replace(/^dr\.\s*/i, "");
}

function getHash(value = "") {
  return Math.abs(
    [...`${value || "user"}`].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  );
}

const MALE_AVATAR_INDICES = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39];
const FEMALE_AVATAR_INDICES = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40];

const KNOWN_MALE_NAMES = new Set([
  "john", "charlie", "omar", "liam", "sam", "eric", "james", "ravi", "david", "tom",
  "francisco", "chris", "ben", "alex", "jordan", "daniel", "adam", "michael", "henry",
  "jack", "peter", "joseph", "ryan", "elliot", "dan", "will", "leo", "khan", "kwame",
  "park", "murphy",
]);

const KNOWN_FEMALE_NAMES = new Set([
  "jane", "riley", "nina", "sofia", "alice", "hina", "sarah", "laura", "olivia",
  "maya", "anna", "amy", "sophie", "emma", "lily", "isabella", "grace", "chloe",
  "zoe", "maria", "yasmin", "yamada", "farrell",
]);

function getFirstName(fullName = "") {
  return normalise(fullName).split(/\s+/)[0] || "";
}

const MALE_USERNAME_PATTERN = /^johndoe|charlie|omar|liamk|srahwan|echen|jmurphy|rkapoor|dnguyen|tbrown|fnunes|cellis|bkwame|jpark$/;
const FEMALE_USERNAME_PATTERN = /^janedoe|riley|nina|sofia|amiller|hpatel|swan|lturner|ofarrell|ayamada|hlewis|asmith$/;

function inferGender({ fullName = "", username = "" } = {}) {
  const first = getFirstName(fullName);
  const uname = normalise(username);
  if (KNOWN_MALE_NAMES.has(first) || MALE_USERNAME_PATTERN.test(uname)) return "male";
  if (KNOWN_FEMALE_NAMES.has(first) || FEMALE_USERNAME_PATTERN.test(uname)) return "female";
  return "unknown";
}

function buildGenderAvatar(seedKey = "", gender = "unknown") {
  const hash = getHash(seedKey);
  if (gender === "male") return `https://randomuser.me/api/portraits/men/${MALE_AVATAR_INDICES[hash % MALE_AVATAR_INDICES.length]}.jpg`;
  if (gender === "female") return `https://randomuser.me/api/portraits/women/${FEMALE_AVATAR_INDICES[hash % FEMALE_AVATAR_INDICES.length]}.jpg`;
  return `https://i.pravatar.cc/96?img=${(hash % 50) + 1}`;
}

function buildNonHumanAvatar(seedKey = "") {
  const hash = getHash(seedKey);
  if (hash % 2 === 0) return `https://robohash.org/${encodeURIComponent(seedKey)}?set=set4&size=96x96`;
  return `https://picsum.photos/seed/${encodeURIComponent(seedKey)}/96/96`;
}

function buildStudentFallback(seedKey = "") {
  const hash = getHash(seedKey);
  if (hash % 10 === 0) return null;
  if (hash % 4 === 0) return buildNonHumanAvatar(seedKey);
  return buildGenderAvatar(seedKey, "unknown");
}

const FIXED_PROFILE_PHOTOS = {
  johndoe: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=96&h=96&q=80",
  janedoe: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&h=96&q=80",
  charlie: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
  riley: "https://robohash.org/riley.wood?set=set4&size=96x96",
  nina: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=96&h=96&q=80",
  omar: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=96&h=96&q=80",
  sofia: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=96&h=96&q=80",
  liamk: "https://picsum.photos/seed/liam.kelly/96/96",
  amiller: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
  srahwan: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80",
  hpatel: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&h=96&q=80",
  echen: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=96&h=96&q=80",
  jmurphy: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&h=96&q=80",
  rkapoor: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
  dnguyen: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=96&h=96&q=80",
  tbrown: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=96&h=96&q=80",
  fnunes: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&h=96&q=80",
  cellis: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=96&h=96&q=80",
  bkwame: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=96&h=96&q=80",
  mkhan: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
  jpark: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&h=96&q=80",
  asmith: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=96&h=96&q=80",
  ayamada: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=96&h=96&q=80",
  hlewis: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80",
  lturner: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=96&h=96&q=80",
  swan: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
  ofarrell: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=96&h=96&q=80",
};

const FIXED_NAME_PHOTOS = {
  "john doe": FIXED_PROFILE_PHOTOS.johndoe,
  "jane doe": FIXED_PROFILE_PHOTOS.janedoe,
  "charlie smith": FIXED_PROFILE_PHOTOS.charlie,
  "riley wood": FIXED_PROFILE_PHOTOS.riley,
  "nina green": FIXED_PROFILE_PHOTOS.nina,
  "omar hassan": FIXED_PROFILE_PHOTOS.omar,
  "sofia reid": FIXED_PROFILE_PHOTOS.sofia,
  "liam kelly": FIXED_PROFILE_PHOTOS.liamk,
  "alice miller": FIXED_PROFILE_PHOTOS.amiller,
  "sam rahwan": FIXED_PROFILE_PHOTOS.srahwan,
  "hina patel": FIXED_PROFILE_PHOTOS.hpatel,
  "eric chen": FIXED_PROFILE_PHOTOS.echen,
  "james murphy": FIXED_PROFILE_PHOTOS.jmurphy,
};

export function getTutorPhotoFallback({ fullName = "", username = "", role = "", seed = "", allowGeneric = false } = {}) {
  const byUsername = FIXED_PROFILE_PHOTOS[normalise(username)];
  if (byUsername) return byUsername;
  const byName = FIXED_NAME_PHOTOS[normalise(fullName)];
  if (byName) return byName;
  if (!allowGeneric) return null;
  const seedKey = seed || username || fullName;
  if (normalise(role) === "teacher") return buildGenderAvatar(seedKey, inferGender({ fullName, username }));
  return buildStudentFallback(seedKey);
}

function extractDirectPhoto(user) {
  return user.profile_photo_url || user.profile_photo || user.avatar || null;
}

function extractFullName(user) {
  return user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim();
}

/** Resolves a user's display photo, falling back to a deterministic avatar. */
export function getResolvedUserPhoto(user, options = {}) {
  if (!user) return null;
  const direct = extractDirectPhoto(user);
  if (direct) return direct;
  return getTutorPhotoFallback({
    fullName: extractFullName(user),
    username: user.username,
    role: user.role,
    seed: options.seed,
    allowGeneric: Boolean(options.allowGeneric),
  });
}
