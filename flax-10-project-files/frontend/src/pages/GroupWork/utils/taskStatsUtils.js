/*
 * Completion stats calculation for the group project progress bar.
 */

import { buildMemberColorMap, getMemberKey, MEMBER_PALETTE } from "../components/memberAvatarUtils";

function buildUserCounts(completedArr, members) {
    const userCounts = {};
    let unassignedCount = 0;
    completedArr.forEach((task) => accumulateTaskAssignees(task, members, userCounts, (n) => { unassignedCount += n; }));
    return { userCounts, unassignedCount };
}

function accumulateTaskAssignees(task, members, userCounts, onUnassigned) {
    const assignees = task.assignees_info || [];
    if (assignees.length === 0) { onUnassigned(1); return; }
    assignees.forEach((assignee) => accumulateAssignee(assignee, task, assignees.length, members, userCounts));
}

function accumulateAssignee(assignee, task, assigneeCount, members, userCounts) {
    if (!userCounts[assignee.id]) {
        const memberInfo = members.find((m) => getMemberKey(m) === String(assignee.id));
        userCounts[assignee.id] = { totalShare: 0, tasksDone: 0, id: assignee.id, name: memberInfo ? memberInfo.user_name : (assignee.name || "Unknown") };
    }
    userCounts[assignee.id].totalShare += (1 / assigneeCount);
    userCounts[assignee.id].tasksDone += 1;
}

function buildSegments(userCounts, unassignedCount, total, members) {
    const colorMap = buildMemberColorMap(members);
    const memberOrder = new Map(members.map((member, index) => [getMemberKey(member), index]));
    const segments = Object.values(userCounts)
        .map((u) => buildSegmentEntry(u, total, colorMap))
        .sort((left, right) => (memberOrder.get(String(left.id)) ?? Number.POSITIVE_INFINITY) - (memberOrder.get(String(right.id)) ?? Number.POSITIVE_INFINITY));
    if (unassignedCount > 0) segments.push(buildUnassignedSegment(unassignedCount, total));
    return segments;
}

function buildSegmentEntry(u, total, colorMap) {
    return {
        ...u,
        percentage: (u.totalShare / total) * 100,
        tooltip: `${u.name}: ${u.tasksDone} task${u.tasksDone !== 1 ? "s" : ""} completed · ${Math.round((u.totalShare / total) * 100)}% of project`,
        color: colorMap[String(u.id)] || MEMBER_PALETTE[0],
    };
}

function buildUnassignedSegment(unassignedCount, total) {
    return {
        id: "unassigned",
        name: "Unassigned",
        percentage: (unassignedCount / total) * 100,
        tooltip: `Unassigned: ${unassignedCount} task${unassignedCount !== 1 ? "s" : ""} completed`,
        color: "#e0e0e0",
    };
}

/** Calculates per-member completion segments for the progress bar. */
export function calcCompletionSegments(tasks, members) {
    const total = tasks.length;
    if (total === 0) return { percent: 0, completed: 0, total: 0, segments: [] };
    const completedArr = tasks.filter((t) => t.completed || t.status === "done");
    const completed = completedArr.length;
    const percent = Math.round((completed / total) * 100);
    const { userCounts, unassignedCount } = buildUserCounts(completedArr, members);
    const segments = buildSegments(userCounts, unassignedCount, total, members);
    return { percent, completed, total, segments };
}
