import { getUserSettings } from "../api/userApi";

const VALID_MODES = ["light", "dark"];
const VALID_THEMES = ["flax", "coral", "rust", "amber", "ocean", "indigo", "teal", "forest", "rose", "lavender", "mint", "sand"];

function getStoredTheme(key, valid, fallback) {
  const stored = localStorage.getItem(key);
  if (valid.includes(stored)) return stored;
  const legacy = localStorage.getItem("theme");
  return valid.includes(legacy) ? legacy : fallback;
}

function applyStoredTheme(setInitialTheme, setInitialMode) {
  setInitialTheme(getStoredTheme("colorTheme", VALID_THEMES, "flax"));
  setInitialMode(getStoredTheme("mode", VALID_MODES, "light"));
}

export function readStoredThemePrefs() {
  return {
    theme: getStoredTheme("colorTheme", VALID_THEMES, "flax"),
    mode: getStoredTheme("mode", VALID_MODES, "light"),
  };
}

export async function loadTheme(authed, setInitialTheme, setInitialMode, setIsLoadingTheme) {
  if (!authed) {
    applyStoredTheme(setInitialTheme, setInitialMode);
    setIsLoadingTheme(false);
    return;
  }
  try {
    const settings = await getUserSettings();
    setInitialTheme(settings.theme || "flax");
    setInitialMode(settings.mode || "light");
  } catch {
    applyStoredTheme(setInitialTheme, setInitialMode);
  } finally {
    setIsLoadingTheme(false);
  }
}
