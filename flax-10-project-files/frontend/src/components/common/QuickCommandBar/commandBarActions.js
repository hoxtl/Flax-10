/*
 * Action definitions and filter logic for the quick command bar.
 */

import {
  CalendarPlus2, GraduationCap, Timer, Users, Sparkles,
  Home, Calendar, CheckSquare, MapPin, BarChart2, ClipboardCheck, UserCheck,
} from "lucide-react";

/** Returns the full list of available quick actions. */
export function buildActionDefs({ onNavChange, onOpenTask }) {
  const nav = (page) => () => onNavChange?.(page);
  return [
    { id: "add-task", title: "Add task", hint: "Open quick task modal", Icon: CalendarPlus2, run: () => onOpenTask?.() },
    { id: "go-home", title: "Go to Home", hint: "Navigate to home dashboard", Icon: Home, run: nav("home") },
    { id: "go-calendar", title: "Open Calendar", hint: "View and manage your calendar events", Icon: Calendar, run: nav("calendar") },
    { id: "go-timer", title: "Start timer", hint: "Jump into focus mode timer", Icon: Timer, run: nav("timer") },
    { id: "go-tasks", title: "View tasks", hint: "Open your task list", Icon: CheckSquare, run: nav("tasks") },
    { id: "go-modules", title: "Jump to module", hint: "Open modules or search by module code", Icon: GraduationCap,
      run: (query) => { const q = String(query || "").trim(); onNavChange?.(q ? `/modules?code=${encodeURIComponent(q)}` : "modules"); } },
    { id: "go-map", title: "Open campus map", hint: "Navigate the campus map and plan your journey", Icon: MapPin, run: nav("map") },
    { id: "go-societies", title: "Browse societies", hint: "Explore and join student societies", Icon: Sparkles, run: () => onNavChange?.("/societies?tab=all") },
    { id: "go-users", title: "Discover users", hint: "Find and connect with other students", Icon: Users, run: nav("users") },
    { id: "go-group-work", title: "Group Projects", hint: "Track shared project work", Icon: UserCheck, run: nav("group-work") },
    { id: "go-analytics", title: "View analytics", hint: "See your study statistics and insights", Icon: BarChart2, run: nav("analytics") },
    { id: "go-attendance", title: "Attendance", hint: "Check your lecture attendance", Icon: ClipboardCheck, run: nav("attendance") },
  ];
}

/** Returns true if the action matches the given query string. */
export function matchesQuery(action, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return action.title.toLowerCase().includes(q) || action.hint.toLowerCase().includes(q);
}
