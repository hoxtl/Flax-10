/*
 * Shared user search constants and styling helpers.
 */

import { KCL_DEPARTMENTS } from '../../lib/kclCourses';
import socialStyles from './Social.module.css';
import searchStyles from './UserSearch.module.css';

export const styles = { ...socialStyles, ...searchStyles };

export const allCourses = KCL_DEPARTMENTS;

export const YEAR_OPTIONS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"];

export const ROLE_OPTIONS = [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Professor" },
];

export const FILTER_TABS = [
    { value: 'roles', label: 'Role' },
    { value: 'courses', label: 'Courses' },
    { value: 'years', label: 'Year' },
    { value: 'societies', label: 'Societies' },
];

export const SEARCH_EMPTY_CONFIG = {
    loading: { icon: '⏳', title: 'Searching users', description: 'Matching profiles will appear here.' },
    users: { icon: '🔎', title: 'No users found', description: 'Try a different name or filter.' },
    start: { icon: '👋', title: 'Start typing', description: 'Search by name, username, course, or society.' },
    courses: { icon: '📚', title: 'No courses found', description: 'Try a different course search.' },
    years: { icon: '🗓️', title: 'No years found', description: 'Try a different year search.' },
    roles: { icon: '🧑‍🏫', title: 'No roles found', description: 'Try selecting a different role.' },
    societies: { icon: '🎭', title: 'No societies found', description: 'Try a different society search.' },
};
