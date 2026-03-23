/*
 * Completion stats calculation for the group project progress bar.
 */

import { MEMBER_PALETTE, getMemberKey, buildMemberColorMap } from "./memberAvatarUtils";

function buildUserCounts(completedArr, members) {
    const userCounts = {};
    let unassignedCount = 0;
    completedArr.forEach(t => {
        const assignees = t.assignees_info || [];
        if (assignees.length === 0) { unassignedCount++; return; }
        assignees.forEach(a => {
            if (!userCounts[a.id]) {
                const memberInfo = members.find(m => getMemberKey(m) === String(a.id));
                userCounts[a.id] = {
                    totalShare: 0, tasksDone: 0, id: a.id,
                    name: memberInfo ? memberInfo.user_name : (a.name || "Unknown")
                };
            }
            userCounts[a.id].totalShare += (1 / assignees.length);
            userCounts[a.id].tasksDone += 1;
        });
    });
    return { userCounts, unassignedCount };
}

function buildSegments(userCounts, unassignedCount, total, members) {
    const colorMap = buildMemberColorMap(members);
    const memberOrder = new Map(members.map((member, index) => [getMemberKey(member), index]));
    const segments = Object.values(userCounts).map(u => ({
        ...u,
        percentage: (u.totalShare / total) * 100,
        tooltip: `${u.name}: ${u.tasksDone} task${u.tasksDone !== 1 ? "s" : ""} completed · ${Math.round((u.totalShare / total) * 100)}% of project`,
        color: colorMap[String(u.id)] || MEMBER_PALETTE[0],
    })).sort((left, right) => (memberOrder.get(String(left.id)) ?? Number.POSITIVE_INFINITY) - (memberOrder.get(String(right.id)) ?? Number.POSITIVE_INFINITY));
    if (unassignedCount > 0) {
        segments.push({
            id: "unassigned", name: "Unassigned",
            percentage: (unassignedCount / total) * 100,
            tooltip: `Unassigned: ${unassignedCount} task${unassignedCount !== 1 ? "s" : ""} completed`,
            color: "var(--color-groupwork-progress)",
        });
    }
    return segments;
}

/** Calculates per-member completion segments for the project progress bar. */

export function calcCompletionSegments(tasks, members) {
    const total = tasks.length;
    if (total === 0) return { percent: 0, completed: 0, total: 0, segments: [] };
    const completedArr = tasks.filter(t => t.completed || t.status === "done");
    const completed = completedArr.length;
    const percent = Math.round((completed / total) * 100);
    const { userCounts, unassignedCount } = buildUserCounts(completedArr, members);
    const segments = buildSegments(userCounts, unassignedCount, total, members);
    return { percent, completed, total, segments };
}
