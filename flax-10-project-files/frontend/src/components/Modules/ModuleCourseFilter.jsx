import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KCL_DEPARTMENTS } from '../../lib/kclCourses';
import SearchBar from '../common/SearchBar/SearchBar';
import SearchEmptyState from '../common/SearchEmptyState/SearchEmptyState';
import styles from './ModuleCourseFilter.module.css';

const TABS = [
    { value: 'courses', label: 'Courses' },
    { value: 'enrollment', label: 'Enrollment' },
];

const ENROLLMENT_OPTIONS = [
    { value: 'all', label: 'All Modules' },
    { value: 'enrolled', label: 'My Enrollments' },
];

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

function EnrollmentOption({ option, isActive, onSelect }) {
    return (
        <div className={`${styles.item} ${isActive ? styles.itemActive : ''}`} onClick={() => onSelect(option.value)}>
            <div className={`${styles.radio} ${isActive ? styles.radioChecked : ''}`} />
            <span className={styles.itemLabel}>{option.label}</span>
        </div>
    );
}

export default function ModuleCourseFilter({ selectedCourses, onToggleCourse, filterMode, onFilterModeChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('courses');
    const [filterQuery, setFilterQuery] = useState('');
    const [expanded, setExpanded] = useState({});
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => ref.current && !ref.current.contains(e.target) && setIsOpen(false);
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const toggleExpanded = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));
    const filteredGroups = filterCourseGroups(KCL_DEPARTMENTS, filterQuery);
    const flatFiltered = Object.values(filteredGroups).flat();
    const activeCount = selectedCourses.length + (filterMode !== 'all' ? 1 : 0);
    const hasFilterQuery = String(filterQuery || "").trim().length > 0;

    return (
        <div ref={ref} className={styles.wrapper}>
            <button onClick={() => setIsOpen(!isOpen)} className={styles.filterBtn}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                Filter{activeCount > 0 && <span className={styles.badge}>{activeCount}</span>}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className={styles.dropdown}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className={styles.tabs}>
                            {TABS.map(tab => (
                                <button key={tab.value} onClick={() => setActiveTab(tab.value)} className={`${styles.tab} ${activeTab === tab.value ? styles.tabActive : ''}`}>{tab.label}</button>
                            ))}
                        </div>
                        {activeTab === 'courses' && (
                            <>
                                <SearchBar
                                    value={filterQuery}
                                    onChange={setFilterQuery}
                                    placeholder="Search courses or departments..."
                                    inputClassName={styles.searchInput}
                                />
                                <div className={styles.listContainer}>
                                    {hasFilterQuery && flatFiltered.length === 0 && (
                                        <SearchEmptyState
                                            query={filterQuery}
                                            itemLabel="courses"
                                            hint="Try a different keyword or choose another department."
                                        />
                                    )}
                                    {filterQuery ? (
                                        <div className={styles.itemList}>
                                            {flatFiltered.map(course => (
                                                <CourseItem key={course} course={course} isChecked={selectedCourses.includes(course)} onToggle={onToggleCourse} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.groups}>
                                            {Object.entries(filteredGroups).map(([dept, courses]) => (
                                                <DepartmentGroup key={dept} department={dept} courses={courses} selectedCourses={selectedCourses} onToggle={onToggleCourse} expanded={expanded} toggleExpanded={toggleExpanded} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {activeTab === 'enrollment' && (
                            <div className={styles.listContainer}>
                                {ENROLLMENT_OPTIONS.map(opt => (
                                    <EnrollmentOption key={opt.value} option={opt} isActive={filterMode === opt.value} onSelect={onFilterModeChange} />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
