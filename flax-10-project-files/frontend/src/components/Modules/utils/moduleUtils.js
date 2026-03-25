/*
 * Utility functions for module filtering, sorting, formatting, and data transformations.
 */

import { KCL_DEPARTMENTS } from '../../../lib/kclCourses';
import { formatForDateTimeInput } from '../../../utils/dateTimeInput';

const MODULE_PREFIX_TO_DEPARTMENT = {
    CS: "Natural, Mathematical & Engineering Sciences",
    AI: "Natural, Mathematical & Engineering Sciences",
    MA: "Natural, Mathematical & Engineering Sciences",
    PH: "Natural, Mathematical & Engineering Sciences",
    EE: "Natural, Mathematical & Engineering Sciences",
    GN: "Natural, Mathematical & Engineering Sciences",
    CH: "Natural, Mathematical & Engineering Sciences",
    CM: "Natural, Mathematical & Engineering Sciences",
    LS: "Life Sciences & Medicine",
    MD: "Life Sciences & Medicine",
    NS: "Life Sciences & Medicine",
    LW: "Law",
    PS: "Psychiatry, Psychology & Neuroscience",
    BM: "Business",
    AF: "Business",
    IM: "Business",
    EC: "Business",
    HI: "Arts & Humanities",
    EN: "Arts & Humanities",
    PL: "Arts & Humanities",
    GE: "Social Science & Public Policy",
    PO: "Social Science & Public Policy",
    IR: "Social Science & Public Policy",
    NU: "Nursing, Midwifery & Palliative Care",
    MW: "Nursing, Midwifery & Palliative Care",
    DE: "Dentistry, Oral & Craniofacial Sciences",
    FR: "Arts & Humanities",
    SP: "Arts & Humanities",
    GL: "Arts & Humanities",
    AR: "Arts & Humanities",
    ZH: "Arts & Humanities",
    IT: "Arts & Humanities",
    PT: "Arts & Humanities",
    FA: "Arts & Humanities",
    TH: "Arts & Humanities",
    MU: "Arts & Humanities",
    CL: "Arts & Humanities",
    CR: "Arts & Humanities",
};

const MODULE_PREFIX_TO_COURSE = {
    CS: "Computer Science",
    AI: "Artificial Intelligence",
    MA: "Mathematics",
    PH: "Physics",
    EE: "Electronic Engineering",
    GN: "General Engineering",
    CH: "Chemistry",
    CM: "Computer Science with Management",
    LS: "Biomedical Science",
    MD: "Medicine",
    NS: "Neuroscience",
    LW: "Law",
    PS: "Psychology",
    BM: "Business Management",
    AF: "Accounting & Finance",
    IM: "International Management",
    EC: "Economics",
    HI: "History",
    EN: "English Literature",
    PL: "Philosophy",
    GE: "Geography",
    PO: "Politics",
    IR: "International Relations",
    NU: "Nursing",
    MW: "Midwifery",
    DE: "Dentistry",
    FR: "French",
    SP: "Spanish",
    GL: "German",
    AR: "Arabic",
    ZH: "Chinese",
    IT: "Italian",
    PT: "Portuguese",
    FA: "Film Studies",
    TH: "Theatre Studies",
    MU: "Music",
    CL: "Classics",
    CR: "Creative Writing",
};

export function getCourse(module_code, storedCourse) {
    if (storedCourse) return storedCourse;
    const prefix = module_code?.match(/^[A-Z]+/)?.[0];
    return MODULE_PREFIX_TO_COURSE[prefix] || null;
}

export function getDepartment(module_code, storedDepartment) {
    const prefix = module_code?.match(/^[A-Z]+/)?.[0];
    const derivedDepartment = MODULE_PREFIX_TO_DEPARTMENT[prefix];

    if (storedDepartment && storedDepartment !== "King's College London") {
        return storedDepartment;
    }

    return derivedDepartment || storedDepartment || "King's College London";
}

export function isEnrolledIn(module_id, enrollments) {
    return enrollments.some(e => e.module === module_id);
}

export function getEnrollmentId(module_id, enrollments) {
    const enrollment = enrollments.find(e => e.module === module_id);
    return enrollment ? enrollment.id : null;
}

export function normaliseModuleCode(code) {
    return String(code || '').toUpperCase().replace(/\s+/g, '');
}

export function serialiseModule(form_data) {
    const safeIsoOrOriginal = (value) => {
        if (!value) return '';
        // `new Date('10:00')` is invalid because it lacks a full date.
        // In that case, preserve the original value.
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? value : d.toISOString();
    };
    return {
        module_code: form_data.module_code,
        module_name: form_data.module_name,
        description: form_data.description,
        department: form_data.department,
        course: form_data.course,
        start_time: form_data.start_time ? safeIsoOrOriginal(form_data.start_time) : '',
        end_time: form_data.end_time ? safeIsoOrOriginal(form_data.end_time) : '',
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

export function formatForInput(d) {
    return formatForDateTimeInput(d);
}

export function filterModules(modules, enrollments, search_query, filter_mode, options = {}) {
    return modules.filter(module => {
        const search_result = checkSearch(module, search_query)
        const filter_result = checkFilter(module, enrollments, filter_mode, options);
        return search_result && filter_result;
    })
}

function checkSearch(module, search_query) {
    const query_lower = search_query.toLowerCase();
    return module.module_name.toLowerCase().includes(query_lower)
        || module.module_code.toLowerCase().includes(query_lower);
}

function checkFilter(module, enrollments, filter_mode, options = {}) {
    if (filter_mode === 'all' && options.excludeEnrolled) return !isEnrolledIn(module.id, enrollments);
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
        if (sort_by === 'name-desc') return b.module_name.localeCompare(a.module_name);
        return a.module_name.localeCompare(b.module_name);
    });
}

function filterByDepartment(modules, department) {
    if (department === 'all') return modules;
    return modules.filter(m => getDepartment(m.module_code, m.department) === department);
}

function filterByCourses(modules, courses) {
    if (courses.length === 0) return modules;
    return modules.filter(m => courses.includes(getCourse(m.module_code, m.course)));
}

export function applyFiltersAndSort(modules, selectedCoursesOrDepartment, sort_by) {
    if (!selectedCoursesOrDepartment) return sortModules(modules, sort_by);
    if (typeof selectedCoursesOrDepartment === 'string') {
        return sortModules(filterByDepartment(modules, selectedCoursesOrDepartment), sort_by);
    }
    if (Array.isArray(selectedCoursesOrDepartment)) {
        return sortModules(filterByCourses(modules, selectedCoursesOrDepartment), sort_by);
    }
    return sortModules(modules, sort_by);
}
