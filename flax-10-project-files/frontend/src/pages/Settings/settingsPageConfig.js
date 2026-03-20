/*
 * Settings page tab metadata and panel styling.
 */
import { BookOpen, Lock, MapPin, Palette, User } from "lucide-react";

export const PANEL_META = {
  account: { icon: User, title: "Account", desc: "Manage your personal information and year of study." },
  home: { icon: MapPin, title: "Location", desc: "Set your home address for journey planning on UniMap." },
  security: { icon: Lock, title: "Security", desc: "Update your password anytime." },
  preferences: { icon: Palette, title: "Preferences", desc: "Customise your theme and daily sleep schedule." },
  preferences_themes: { icon: Palette, title: "Appearance", desc: "Customise how StudyFlax looks." },
  preferences_sleep: { icon: Palette, title: "Sleep Schedule", desc: "Manage your daily sleep and wake times." },
  course: { icon: BookOpen, title: "Teacher Access", desc: "Manage your teacher request and course changes." },
};

export const panelVariantClass = {
  account: "panelAccount",
  home: "panelHome",
  security: "panelSecurity",
  preferences: "panelPreferences",
  preferences_themes: "panelPreferences",
  preferences_sleep: "panelPreferences",
  course: "panelCourse",
};

export const VALID_TABS = new Set(Object.keys(PANEL_META));
