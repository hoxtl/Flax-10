import { getUserSettings } from "../api/userApi";

export async function loadTheme(authed, setInitialTheme, setInitialMode, setIsLoadingTheme) {
  if (!authed) {
    setIsLoadingTheme(false);
    return;
  }
  try {
    const settings = await getUserSettings();
    setInitialTheme(settings.theme || "flax");
    setInitialMode(settings.mode || "light");
  } catch {
    setInitialTheme("flax");
    setInitialMode("light");
  } finally {
    setIsLoadingTheme(false);
  }
}
