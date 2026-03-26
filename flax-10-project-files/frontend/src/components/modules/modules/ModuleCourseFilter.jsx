/*
 * Dropdown filter for modules by course and enrolment status.
 */

import { AnimatePresence, motion as Motion } from 'framer-motion';
import { KCL_DEPARTMENTS } from '../../../lib/kclCourses';
import { DROPDOWN_MOTION_PROPS } from '../../common/dropdownMotion';
import SearchBar from '../../common/search_bar/SearchBar';
import SearchEmptyState from '../../common/search_empty_state/SearchEmptyState';
import { useClickOutside } from '../../common/hooks/useClickOutside';
import { useModuleCourseFilterState } from './useModuleCourseFilterState';
import styles from './ModuleCourseFilter.module.css';

function filterCourseGroups(groups, query) {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return Object.fromEntries(
        Object.entries(groups)
            .map(([dept, courses]) => [
                dept,
                dept.toLowerCase().includes(q) ? courses : courses.filter(c => c.toLowerCase().includes(q)),
            ])
            .filter(([, courses]) => courses.length > 0)
    );
}

function CourseItem({ course, isChecked, onToggle }) {
    return (
        <div className={styles.item} onClick={() => onToggle(course)}>
            <input type="checkbox" checked={isChecked} onChange={() => onToggle(course)} className={styles.checkbox} onClick={e => e.stopPropagation()} />
            <span className={styles.itemLabel}>{course}</span>
        </div>
    );
}

function DepartmentGroup({ department, courses, selectedCourses, onToggle, expanded, toggleExpanded }) {
    const sectionKey = `dept_${department}`;
    const visible = expanded[sectionKey] ? courses : courses.slice(0, 5);
    return (
        <div>
            <h4 className={styles.groupHeading}>{department}</h4>
            <div className={styles.itemList}>
                {visible.map(course => (
                    <CourseItem key={course} course={course} isChecked={selectedCourses.includes(course)} onToggle={onToggle} />
                ))}
                {courses.length > 5 && (
                    <button className={`${styles.expandBtn} ${expanded[sectionKey] ? styles.collapseBtn : ''}`} onClick={() => toggleExpanded(sectionKey)}>
                        {expanded[sectionKey] ? 'Show less' : `+ ${courses.length - 5} more`}
                    </button>
                )}
            </div>
        </div>
    );
}

function FilterButton({ activeCount, isOpen, onClick }) {
    return (
        <button onClick={onClick} className={styles.filterBtn} aria-expanded={isOpen} aria-haspopup="dialog">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
            Filter{activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
        </button>
    );
}

function CoursesList({ filterQuery, flatFiltered, filteredGroups, selectedCourses, onToggleCourse, expanded, toggleExpanded }) {
    const hasFilterQuery = String(filterQuery || "").trim().length > 0;
    if (hasFilterQuery && flatFiltered.length === 0) return <SearchEmptyState query={filterQuery} itemLabel="courses" hint="Try a different keyword or choose another department." />;
    if (filterQuery) return <div className={styles.itemList}>{flatFiltered.map(course => <CourseItem key={course} course={course} isChecked={selectedCourses.includes(course)} onToggle={onToggleCourse} />)}</div>;
    return <div className={styles.groups}>{Object.entries(filteredGroups).map(([dept, courses]) => <DepartmentGroup key={dept} department={dept} courses={courses} selectedCourses={selectedCourses} onToggle={onToggleCourse} expanded={expanded} toggleExpanded={toggleExpanded} />)}</div>;
}

function CoursesTab({ filterQuery, setFilterQuery, selectedCourses, onToggleCourse, expanded, toggleExpanded }) {
    const filteredGroups = filterCourseGroups(KCL_DEPARTMENTS, filterQuery);
    const flatFiltered = Object.values(filteredGroups).flat();
    return (
        <>
            <SearchBar value={filterQuery} onChange={setFilterQuery} placeholder="Search courses or departments..." inputClassName={styles.searchInput} />
            <div className={styles.listContainer}><CoursesList filterQuery={filterQuery} flatFiltered={flatFiltered} filteredGroups={filteredGroups} selectedCourses={selectedCourses} onToggleCourse={onToggleCourse} expanded={expanded} toggleExpanded={toggleExpanded} /></div>
        </>
    );
}

function DropdownContent({ filterQuery, setFilterQuery, selectedCourses, onToggleCourse, expanded, toggleExpanded }) {
    return (
        <Motion.div {...DROPDOWN_MOTION_PROPS} className={styles.dropdown} onClick={e => e.stopPropagation()}>
            <CoursesTab filterQuery={filterQuery} setFilterQuery={setFilterQuery} selectedCourses={selectedCourses} onToggleCourse={onToggleCourse} expanded={expanded} toggleExpanded={toggleExpanded} />
        </Motion.div>
    );
}

export default function ModuleCourseFilter({ selectedCourses, onToggleCourse }) {
    const { isOpen, setIsOpen, filterQuery, setFilterQuery, expanded, toggleExpanded, ref } = useModuleCourseFilterState();
    useClickOutside(ref, () => setIsOpen(false));
    const activeCount = selectedCourses.length;
    return (
        <div
            ref={ref}
            className={styles.wrapper}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <FilterButton activeCount={activeCount} isOpen={isOpen} onClick={() => setIsOpen(true)} />
            <AnimatePresence>{isOpen && <DropdownContent filterQuery={filterQuery} setFilterQuery={setFilterQuery} selectedCourses={selectedCourses} onToggleCourse={onToggleCourse} expanded={expanded} toggleExpanded={toggleExpanded} />}</AnimatePresence>
        </div>
    );
}
