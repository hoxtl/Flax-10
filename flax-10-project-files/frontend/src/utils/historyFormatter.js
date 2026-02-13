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

const normalizeSession = (s) => {
    let { startTime, endTime, date, duration } = s;
    const now = new Date().toISOString();
    if (!date) date = now;
    if (!endTime) endTime = date;
    if (!startTime) {
        const endTs = new Date(endTime).getTime();
        startTime = !isNaN(endTs) ? new Date(endTs - (duration || 0) * 60000).toISOString() : now;
    }
    return { ...s, startTime, endTime, date };
};

const createBlock = (id, s) => ({
    id, sessions: [s], totalDuration: s.duration,
    totalBreak: s.breakDuration || 0,
    startTime: s.startTime, endTime: s.endTime, date: s.date
});

const updateBlock = (b, s) => {
    b.sessions.push(s);
    b.totalDuration += s.duration;
    b.totalBreak += (s.breakDuration || 0);
    const startTs = new Date(s.startTime).getTime();
    if (!isNaN(startTs) && startTs < new Date(b.startTime).getTime()) b.startTime = s.startTime;
    const endTs = new Date(s.endTime).getTime();
    if (!isNaN(endTs) && endTs > new Date(b.endTime).getTime()) b.endTime = s.endTime;
};

export const groupHistoryByBlock = (history) => {
    const blocks = {};
    history.forEach(rawSession => {
        const session = normalizeSession(rawSession);
        const blockId = session.studyBlockId || session.id;
        blocks[blockId] ? updateBlock(blocks[blockId], session) : (blocks[blockId] = createBlock(blockId, session));
    });
    return Object.values(blocks).sort((a, b) => new Date(b.date) - new Date(a.date));
};
