import { KCL_DEPARTMENTS } from '../../../lib/kclCourses';

const MODULE_PREFIX_TO_DEPARTMENT = {
    CS: "Natural, Mathematical & Engineering Sciences",
    AI: "Natural, Mathematical & Engineering Sciences",
    MA: "Natural, Mathematical & Engineering Sciences",
    PH: "Natural, Mathematical & Engineering Sciences",
    LS: "Life Sciences & Medicine",
    LW: "Law",
    PS: "Psychiatry, Psychology & Neuroscience",
    BM: "Business",
    EC: "Business",
    HI: "Arts & Humanities",
    EN: "Arts & Humanities",
    PL: "Arts & Humanities",
    GE: "Social Science & Public Policy",
    PO: "Social Science & Public Policy",
    IR: "Social Science & Public Policy",
    NU: "Nursing, Midwifery & Palliative Care",
    DE: "Dentistry, Oral & Craniofacial Sciences",
};

export function getDepartment(module_code, storedDepartment) {
    if (storedDepartment) return storedDepartment;
    const prefix = module_code?.match(/^[A-Z]+/)?.[0];
    return MODULE_PREFIX_TO_DEPARTMENT[prefix] || "King's College London";
}

export function isEnrolledIn(module_id, enrollments) {
    return enrollments.some(e => e.module === module_id);
}

export function getEnrollmentId(module_id, enrollments) {
    const enrollment = enrollments.find(e => e.module === module_id);
    return enrollment ? enrollment.id : null;
}

export function serialiseModule(form_data) {
    return {
        module_code: form_data.module_code,
        module_name: form_data.module_name,
        description: form_data.description,
        department: form_data.department,
        course: form_data.course,
        start_time: form_data.start_time,
        end_time: form_data.end_time,
        location: form_data.location,
        is_recurring: form_data.is_recurring !== false
    };
}

export function formatWeekdayTime(date_time_str) {
    if (!date_time_str) return "Not announced yet...";
    const date = new Date(date_time_str);
    const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' });
    const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${weekday}s at ${time}`;
}

export function formatFullDateTime(date_time_str) {
    if (!date_time_str) return "Not announced yet...";
    const date = new Date(date_time_str);
    return date.toLocaleString('en-GB', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
    });
}

export function formatTime(date_time_str) {
    if (!date_time_str) return "Not announced yet...";
    const date = new Date(date_time_str);
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDuration(start, end) {
    if (!start || !end) return '';
    const duration = (new Date(end) - new Date(start)) / (1000 * 60);
    return createDurationString(duration);
}

function createDurationString(duration) {
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
}

//from formUtils.js - move to dateUtils to allow export
export function formatForInput(d) {
    if (!d) return new Date().toISOString().slice(0, 16);
    const date = typeof d === 'string' ? new Date(d) : d;
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
}

export function filterModules(modules, enrollments, search_query, filter_mode) {
    return modules.filter(module => {
        const search_result = checkSearch(module, search_query)
        const filter_result = checkFilter(module, enrollments, filter_mode);
        return search_result && filter_result;
    })
}

function checkSearch(module, search_query) {
    const query_lower = search_query.toLowerCase();
    return module.module_name.toLowerCase().includes(query_lower)
        || module.module_code.toLowerCase().includes(query_lower);
}

function checkFilter(module, enrollments, filter_mode) {
    if (filter_mode === 'all') return true;
    return isEnrolledIn(module.id, enrollments);
}

export function getDepartments(modules) {
    const depts = modules.map(m => getDepartment(m.module_code, m.department));
    return Array.from(new Set(depts)).sort();
}

export function sortModules(modules, sort_by) {
    return [...modules].sort((a,b) => {
        if (sort_by === 'deadlines') return (b.deadlines?.length || 0) - (a.deadlines?.length || 0);
        return a.module_name.localeCompare(b.module_name);
    });

}

export function applyFiltersAndSort(modules, selectedCourses, sort_by) {
    if (!selectedCourses || selectedCourses.length === 0) return sortModules(modules, sort_by);
    const filtered = modules.filter(m => {
        if (m.course && selectedCourses.includes(m.course)) return true;
        const dept = getDepartment(m.module_code, m.department);
        return selectedCourses.some(c => getDepartmentForCourse(c) === dept);
    });
    return sortModules(filtered, sort_by);
}

function getDepartmentForCourse(courseName) {
    for (const [dept, courses] of Object.entries(KCL_DEPARTMENTS)) {
        if (courses.includes(courseName)) return dept;
    }
    return null;
}