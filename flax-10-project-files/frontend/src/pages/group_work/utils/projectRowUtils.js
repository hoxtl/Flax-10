/*
 * GroupWork project row helpers.
 */

import { getResolvedUserPhoto } from "../../../utils/tutorPhotoFallback.js";

/** Parses a deadline string into a Date, or returns null if absent. */

export function getProjectDate(deadline) {
  return deadline ? new Date(deadline) : null;
}

/** Formats a date as a short GB locale date string (e.g. "24 Mar 2026"). */

export function formatProjectDate(date) {
  if (!date) return "--";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** Formats a date as an ordinal headline string (e.g. "24th March"). */

export function formatProjectHeadlineDate(date) {
  if (!date) return "--";
  const day = date.getDate();
  return `${day}${getOrdinalSuffix(day)} ${date.toLocaleDateString("en-GB", { month: "long" })}`;
}

/** Returns the number of whole days remaining until the given date. */

export function getDaysLeft(date) {
  if (!date) return null;
  return Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));
}

/** Returns the task completion percentage for a project (0–100). */

export function getProjectPercent(project) {
  const total = project.task_count || 0;
  const completed = project.completed_task_count || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

/** Returns the total member count for a project. */

export function getProjectMemberCount(project) {
  if (Number.isFinite(Number(project?.member_count))) return Number(project.member_count);
  return Array.isArray(project?.members) ? project.members.length : 0;
}

/** Returns a human-readable countdown string for the given date. */

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

/** Returns the number of completed tasks for a project. */

export function getProjectCompletedCount(project) {
  return Number(project?.completed_task_count || 0);
}

/** Returns the number of remaining (incomplete) tasks for a project. */

export function getProjectRemainingCount(project) {
  return Math.max(Number(project?.task_count || 0) - Number(project?.completed_task_count || 0), 0);
}

/** Returns a short auto-generated caption for the project based on its title keywords. */

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

/** Returns the display name for the module teacher on a project. */

export function getProjectTeacherName(project) {
  return project?.module_tutor_name || project?.module_tutor_username || "Module lead";
}

/** Returns two-letter initials for the module teacher, stripping honorifics. */

export function getProjectTeacherInitials(project) {
  const teacherName = String(getProjectTeacherName(project)).trim();
  const rawParts = teacherName
    .split(/[\s._-]+/)
    .map((part) => part.replace(/[^a-z0-9]/gi, ""))
    .filter(Boolean);
  const parts = rawParts.filter((part, index) => !(index === 0 && isHonorific(part)));
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return "ML";
}

/** Returns the email address of the module teacher, or an empty string. */

export function getProjectTeacherEmail(project) {
  return project?.module_tutor_email || "";
}

/** Resolves a photo URL for the module teacher, falling back to a generated avatar. */

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

/** Fires a navigate event to open the module teacher's profile page. */

export function openTeacherProfile(event, project) {
  const tutorId = project?.module_tutor_id;
  if (!tutorId) return;
  event?.stopPropagation?.();
  window.dispatchEvent(new CustomEvent("navigate", { detail: `profile_${tutorId}` }));
}

/** Compares two projects according to the given sort key, returning a sort value. */

export function compareProjectsBySort(left, right, sortBy) {
  if (sortBy === "name-desc") return compareNames(right, left);
  if (sortBy === "name") return compareNames(left, right);
  if (sortBy === "created-desc") return compareCreatedDates(right, left);
  if (sortBy === "created-asc") return compareCreatedDates(left, right);
  if (sortBy === "most-members") return compareMemberCounts(right, left);
  if (sortBy === "least-members") return compareMemberCounts(left, right);
  if (sortBy === "most-completed") return compareCompletion(right, left);
  if (sortBy === "least-completed") return compareCompletion(left, right);
  return compareDeadlines(left, right) || compareCompletion(right, left) || compareNames(left, right);
}

/** Returns the visible (deduped) member list for a project. */

export function getProjectMembers(project) {
  return getVisibleMembers(project.members || []);
}

/** Deduplicates a member array by stable key, preserving order. */

export function getVisibleMembers(members = []) {
  const seen = new Set();
  return members.filter((member) => {
    const key = String(member.user ?? member.id ?? member.user_name ?? member.username ?? "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function compareCompletion(left, right) {
  const percentDiff = getProjectPercent(left) - getProjectPercent(right);
  if (percentDiff) return percentDiff;
  const completedDiff = getProjectCompletedCount(left) - getProjectCompletedCount(right);
  if (completedDiff) return completedDiff;
  return compareNames(left, right);
}

function compareMemberCounts(left, right) {
  const memberDiff = getProjectMemberCount(left) - getProjectMemberCount(right);
  if (memberDiff) return memberDiff;
  return compareCompletion(right, left) || compareDeadlines(left, right);
}

function compareNames(left, right) {
  return String(left?.name || "").localeCompare(String(right?.name || ""), undefined, { sensitivity: "base" });
}

function compareDeadlines(left, right) {
  const deadlineDiff = getDeadlineValue(left?.deadline) - getDeadlineValue(right?.deadline);
  return Number.isNaN(deadlineDiff) ? 0 : deadlineDiff;
}

function compareCreatedDates(left, right) {
  const createdDiff = getCreatedValue(left?.created_at) - getCreatedValue(right?.created_at);
  if (createdDiff) return createdDiff;
  return compareDeadlines(left, right) || compareNames(left, right);
}

function getDeadlineValue(deadline) {
  if (!deadline) return Number.POSITIVE_INFINITY;
  const parsed = new Date(deadline).getTime();
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function getCreatedValue(createdAt) {
  if (!createdAt) return Number.NEGATIVE_INFINITY;
  const parsed = new Date(createdAt).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function getOrdinalSuffix(day) {
  const remainder = day % 100;
  if (remainder >= 11 && remainder <= 13) return "th";
  if (day % 10 === 1) return "st";
  if (day % 10 === 2) return "nd";
  if (day % 10 === 3) return "rd";
  return "th";
}

function isHonorific(part) {
  return ["dr", "mr", "mrs", "ms", "prof", "professor"].includes(part.toLowerCase());
}
