/*
 * Timer feature file.
 */

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

function getSessionFields(session) {
    return {
        startTime: session.startTime || session.start_time || null,
        endTime: session.endTime || session.end_time || session.date || new Date().toISOString(),
        breakDuration: session.breakDuration ?? session.break_duration ?? 0,
        pauseDuration: session.pauseDuration ?? session.pause_duration ?? 0,
        studyBlockId: session.studyBlockId || session.study_block_id,
<<<<<<< HEAD
        duration: session.duration ?? 0,
=======
        duration: session.duration || 0,
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
        date: session.date || null,
    };
}

function resolveStartTime(fields) {
    if (fields.startTime) return fields.startTime;
    const endTs = new Date(fields.endTime).getTime();
    if (isNaN(endTs)) return new Date().toISOString();
    return new Date(endTs - fields.duration * 1000).toISOString();
}

const normalizeSession = (session) => {
    const fields = getSessionFields(session);
    return {
        ...session,
        startTime: resolveStartTime(fields),
        endTime: fields.endTime,
        date: fields.date || fields.endTime,
        duration: fields.duration,
        breakDuration: fields.breakDuration,
        pauseDuration: fields.pauseDuration,
        studyBlockId: fields.studyBlockId
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
