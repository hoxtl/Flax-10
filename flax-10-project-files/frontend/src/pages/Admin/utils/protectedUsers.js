const PROTECTED_FIXTURE_USERNAMES = new Set(["janedoe", "johndoe", "charlie", "amiller"]);

export function isProtectedFixtureUser(user) {
  return PROTECTED_FIXTURE_USERNAMES.has(String(user?.username || "").trim().toLowerCase());
}
