/*
 * Pure helpers for user search state and filtering.
 */

import { searchUsers } from '../../api/userApi';

export function handleErr(label, error, setter) {
<<<<<<< HEAD
    void label;
    void error;
=======
    console.error(label, error);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    setter([]);
}

export async function fetchUserResults(query, courses, socs, years, roles, setResults, setLoading) {
    const safeSetResults = typeof setResults === "function" ? setResults : () => {};
    const safeSetLoading = typeof setLoading === "function" ? setLoading : () => {};
    const hasFilters = [query, courses, socs, years, roles].some((value) => value.trim());
    if (!hasFilters) return safeSetResults([]);
    safeSetLoading(true);
    const data = await searchUsers(query, courses, socs, 0, 20, years, roles).catch(() => []);
    safeSetResults(data.results || data);
    safeSetLoading(false);
}

export function getSocietyCategories(societies) {
    const categories = societies.map((society) => society.categories?.[0]?.toLowerCase() || 'other');
    return Array.from(new Set(categories)).sort();
}

export function filterObj(items, query, keys) {
    const normalized = query.toLowerCase();
    return items.filter((item) => !query || keys.some((key) => (item[key] || '').toLowerCase().includes(normalized)));
}

export function filterCourses(courseGroups, query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return courseGroups;
    const entries = Object.entries(courseGroups).map(([department, courses]) => [department, filterDepartmentCourses(department, courses, normalized)]);
    return Object.fromEntries(entries.filter(([, courses]) => courses.length > 0));
}

function filterDepartmentCourses(department, courses, query) {
    if (department.toLowerCase().includes(query)) return courses;
    return courses.filter((course) => course.toLowerCase().includes(query));
}

export function toggleArr(items, value) {
    return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

export function matchCat(society, category) {
    if (category === 'other') return !society.categories || !society.categories.length;
    return society.categories?.[0]?.toLowerCase() === category;
}
