/*
 * societyHookUtils contains small data mappers shared across society hooks.
 */

export const normalizeIsoTime = (time) => {
    if (!time || time.length > 16) return time;
    return `${time}:00`;
};

export const getRecurrence = (rec) => {
    if (!rec) return 'none';
    if (typeof rec === 'string') return rec;
    return rec.frequency || 'none';
};

export const getRecurrenceEndDate = (rec) => {
    if (!rec || typeof rec === 'string') return null;
    return rec.end_date || null;
};

export const parseTagId = (tag) => {
    if (!tag || isNaN(tag)) return null;
    return parseInt(tag);
};

export const transformLegacyEventData = (data) => {
    const time = data.startTime || '12:00';
    const endTime = data.endTime || '13:00';
    return {
        title: data.title,
        description: data.description || "",
        location: data.location || "",
        start_time: `${data.date}T${time}:00`,
        end_time: `${data.date}T${endTime}:00`,
        all_day: data.allDay || false,
        tag: parseTagId(data.tag),
        recurrence: data.recurrence || "none",
        announcement: data.announcement || null
    };
};

export const transformEventData = (data) => {
    if (data.date) return transformLegacyEventData(data);
    return {
        ...data,
        start_time: normalizeIsoTime(data.start_time),
        end_time: normalizeIsoTime(data.end_time),
        tag: parseTagId(data.tag),
        recurrence: getRecurrence(data.recurrence),
        recurrence_end_date: getRecurrenceEndDate(data.recurrence),
        announcement: data.announcement || null
    };
};

export const transformAnnouncementData = (data) => {
    const ann = { title: data.title, content: data.content, tag: data.tag || null };
    const evData = { ...data, description: data.content, tag: data.tag || null, announcement: ann.id };
    return { ann, evData };
};
