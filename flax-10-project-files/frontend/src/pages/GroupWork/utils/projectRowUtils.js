/*
 * GroupWork project row helpers.
 */

import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback.js";

export function getProjectDate(deadline) {
  return deadline ? new Date(deadline) : null;
}

export function formatProjectDate(date) {
  if (!date) return "--";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatProjectHeadlineDate(date) {
  if (!date) return "--";
  const day = date.getDate();
  return `${day}${getOrdinalSuffix(day)} ${date.toLocaleDateString("en-GB", { month: "long" })}`;
}

export function getDaysLeft(date) {
  if (!date) return null;
  return Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));
}

export function getProjectPercent(project) {
  const total = project.task_count || 0;
  const completed = project.completed_task_count || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function formatProjectCountdownText(date) {
  const days = getDaysLeft(date);
  if (days === null) return "";
  if (days < 0) {
    const overdueDays = Math.abs(days);
    return overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`;
  }
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  return `${days} days left`;
}

export function getProjectCompletedCount(project) {
  return Number(project?.completed_task_count || 0);
}

export function getProjectRemainingCount(project) {
  return Math.max(Number(project?.task_count || 0) - Number(project?.completed_task_count || 0), 0);
}

export function getProjectCaption(project) {
  const moduleName = project?.module_name || "the module";
  const title = String(project?.name || "").toLowerCase();
  if (title.includes("poster")) return `Shape the story, visuals, and final talking points for the ${moduleName} poster submission.`;
  if (title.includes("moot") || title.includes("argument")) return `Prepare authorities, structure speaking points, and refine the final case for ${moduleName}.`;
  if (title.includes("report")) return `Split sections, review evidence, and polish the final write-up for ${moduleName}.`;
  if (title.includes("problem sheet")) return `Work through the core questions together and align the final solutions for ${moduleName}.`;
  if (title.includes("findings")) return `Bring together the key evidence, analysis, and presentation flow for ${moduleName}.`;
  if (title.includes("research")) return `Coordinate research threads, shared notes, and the final submission plan for ${moduleName}.`;
  return `Keep the team aligned on scope, tasks, and delivery for ${moduleName}.`;
}

export function getProjectTeacherName(project) {
  return project?.module_tutor_name || project?.module_tutor_username || "Module lead";
}

export function getProjectTeacherEmail(project) {
  return project?.module_tutor_email || "";
}

export function getProjectTeacherPhoto(project) {
  return getResolvedUserPhoto({
    id: project?.module_tutor_id,
    username: project?.module_tutor_username,
    name: getProjectTeacherName(project),
    role: "teacher",
    profile_photo_url: project?.module_tutor_profile_photo_url,
  }, {
    seed: project?.module_tutor_username || project?.module_tutor_id || getProjectTeacherName(project),
    allowGeneric: true,
  });
}

export function compareProjectsBySort(left, right, sortBy) {
  if (sortBy === "name-desc") return compareNames(right, left);
  if (sortBy === "name") return compareNames(left, right);
  if (sortBy === "most-completed") return compareCompletion(right, left);
  if (sortBy === "least-completed") return compareCompletion(left, right);
  return compareDeadlines(left, right) || compareCompletion(right, left) || compareNames(left, right);
}

export function getProjectMembers(project) {
  return getVisibleMembers(project.members || []);
}

export function getVisibleMembers(members = []) {
  const viewer = getStoredViewer();
  const seen = new Set();
  return members.filter((member) => {
    const key = String(member.user ?? member.id ?? member.user_name ?? member.username ?? "");
    if (!key || seen.has(key) || matchesViewer(member, viewer)) return false;
    seen.add(key);
    return true;
  });
}

function getStoredViewer() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function matchesViewer(member, viewer) {
  if (!viewer || Object.keys(viewer).length === 0) return false;
  const memberUserId = member.user ?? member.id;
  const viewerId = viewer.id ?? viewer.user;
  const memberUsername = (member.user_name || member.username || "").trim().toLowerCase();
  const viewerUsername = (viewer.username || viewer.user_name || "").trim().toLowerCase();
  return String(memberUserId || "") === String(viewerId || "") || (memberUsername && viewerUsername && memberUsername === viewerUsername);
}

function compareCompletion(left, right) {
  const percentDiff = getProjectPercent(left) - getProjectPercent(right);
  if (percentDiff !== 0) return percentDiff;
  const completedDiff = getProjectCompletedCount(left) - getProjectCompletedCount(right);
  if (completedDiff !== 0) return completedDiff;
  return compareNames(left, right);
}

function compareNames(left, right) {
  return String(left?.name || "").localeCompare(String(right?.name || ""), undefined, { sensitivity: "base" });
}

function compareDeadlines(left, right) {
  return getDeadlineValue(left?.deadline) - getDeadlineValue(right?.deadline);
}

function getDeadlineValue(deadline) {
  if (!deadline) return Number.POSITIVE_INFINITY;
  const parsed = new Date(deadline).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function getOrdinalSuffix(day) {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) return "th";
  if (day % 10 === 1) return "st";
  if (day % 10 === 2) return "nd";
  if (day % 10 === 3) return "rd";
  return "th";
}
