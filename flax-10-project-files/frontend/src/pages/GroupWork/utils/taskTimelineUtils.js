/*
 * Timeline layout helpers for the GroupWork task timeline view.
 */

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Returns the Monday of the current week at midnight as the timeline anchor date. */

export function getTimelineAnchor() {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    monday.setHours(0, 0, 0, 0);
    return monday;
}

function buildWeek(offset, anchor) {
    const start = new Date(anchor.getTime() + offset * WEEK_MS);
    const end = new Date(start.getTime() + 5 * DAY_MS);
    const sStr = start.toLocaleString("en-GB", { month: "short", day: "numeric" });
    const eStr = end.toLocaleString("en-GB", { month: "short", day: "numeric" });
    return {
        id: offset,
        label: `Week ${offset + 1} (${sStr}–${eStr})`,
        startTs: start.getTime(),
        endTs: end.getTime() + DAY_MS
    };
}

/** Builds an array of 9 consecutive week descriptors starting from the anchor date. */

export function buildWeeks(anchor) {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(o => buildWeek(o, anchor));
}

function placeSingleTask(t, weeks, layout) {
    if (!t.due_date) return;
    const ts = new Date(t.due_date).getTime();
    const wk = weeks.find(w => ts >= w.startTs && ts < w.endTs);
    if (!wk) return;
    const di = (new Date(ts).getDay() + 6) % 7;
    if (di < 6) layout[wk.id][di].push(t);
}

/** Places each task into the correct week and day slot of the layout grid. */

export function placeTasksIntoWeeks(tasks, weeks) {
    const layout = {};
    weeks.forEach(wk => { layout[wk.id] = [[], [], [], [], [], []]; });
    tasks.forEach(t => placeSingleTask(t, weeks, layout));
    return layout;
}
