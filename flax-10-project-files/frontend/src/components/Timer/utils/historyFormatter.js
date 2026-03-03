export const formatTimeRange = (start, end) => {
    if (!start || !end) return '';
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        weekday: 'short', month: 'short', day: 'numeric'
    });
};

export const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const parts = [];
    if (hrs > 0) parts.push(hrs.toString().padStart(2, '0'));
    parts.push(mins.toString().padStart(2, '0'));
    parts.push(`${secs.toString().padStart(2, '0')}s`);
    return parts.join(':');
};

const normalizeSession = (s) => {
    let {
        start_time, startTime,
        end_time, endTime,
        date, duration: durInSeconds,
        break_duration, breakDuration,
        pause_duration, pauseDuration,
        study_block_id, studyBlockId
    } = s;

    const now = new Date().toISOString();

    const normalizedStartTime = startTime || start_time;
    const normalizedEndTime = endTime || end_time || date || now;
    const normalizedBreakDuration = breakDuration !== undefined ? breakDuration : (break_duration || 0);
    const normalizedPauseDuration = pauseDuration !== undefined ? pauseDuration : (pause_duration || 0);
    const normalizedBlockId = studyBlockId || study_block_id;

    let finalStartTime;
    if (!normalizedStartTime) {
        const endTs = new Date(normalizedEndTime).getTime();
        finalStartTime = !isNaN(endTs) ? new Date(endTs - (durInSeconds || 0) * 1000).toISOString() : now;
    } else {
        finalStartTime = normalizedStartTime;
    }

    return {
        ...s,
        startTime: finalStartTime,
        endTime: normalizedEndTime,
        date: date || normalizedEndTime,
        duration: durInSeconds || 0,
        breakDuration: normalizedBreakDuration,
        pauseDuration: normalizedPauseDuration,
        studyBlockId: normalizedBlockId
    };
};

/** Initialize a new study block from a session */
const createBlock = (id, s) => ({
    id, sessions: [s], totalDuration: s.duration,
    totalBreak: s.breakDuration || 0,
    totalPause: s.pauseDuration || 0,
    startTime: s.startTime, endTime: s.endTime, date: s.date,
    task: s.task // Capture the task from the session
});

/** Aggregate session data into an existing block */
const updateBlock = (b, s) => {
    b.sessions.push(s);
    b.totalDuration += s.duration;
    b.totalBreak += (s.breakDuration || 0);
    b.totalPause += (s.pauseDuration || 0);
    const startTs = new Date(s.startTime).getTime();
    if (!isNaN(startTs) && startTs < new Date(b.startTime).getTime()) b.startTime = s.startTime;
    const endTs = new Date(s.endTime).getTime();
    if (!isNaN(endTs) && endTs > new Date(b.endTime).getTime()) b.endTime = s.endTime;
};

/** Group sessions by ID and sort by date (newest first) */
export const groupHistoryByBlock = (history) => {
    const blocks = {};
    history.forEach(rawSession => {
        const session = normalizeSession(rawSession);
        const blockId = session.studyBlockId || session.id;
        blocks[blockId] ? updateBlock(blocks[blockId], session) : (blocks[blockId] = createBlock(blockId, session));
    });
    return Object.values(blocks).sort((a, b) => new Date(b.date) - new Date(a.date));
};
