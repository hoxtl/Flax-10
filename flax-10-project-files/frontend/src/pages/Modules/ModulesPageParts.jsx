/*
 * Toolbar, empty states, and grid components for the modules page.
 */
import AnimatedDropdown from '../../components/Common/AnimatedDropdown/AnimatedDropdown';
import PageToolbar, { ToolbarSortControl } from '../../components/Common/PageToolbar/PageToolbar';
import PrimaryButton from '../../components/Common/PrimaryButton/PrimaryButton';
import EmptyState from '../../components/Common/EmptyState/EmptyState';
import SearchBar from '../../components/Common/SearchBar/SearchBar';
import ModuleCourseFilter from '../../components/Modules/Modules/ModuleCourseFilter';
import ModuleGrid from '../../components/Modules/Modules/ModuleGrid.jsx';
import SearchEmptyState from '../../components/Common/SearchEmptyState/SearchEmptyState.jsx';
import { Pagination, BackToTop } from '../../components/Pagination/Pagination.jsx';

const SORT_OPTIONS = [
    { value: 'name', label: 'A \u2192 Z' },
    { value: 'name-desc', label: 'Z \u2192 A' },
];

function getSearchPlaceholder(isMyModules) {
    return isMyModules
        ? 'Search your modules by name or code...'
        : "Search King's modules by name or code...";
}

function ToolbarControls({ isTeacher, isMyModules, sorting }) {
    return (
        <>
            {!isTeacher && !isMyModules && (
                <ModuleCourseFilter selectedCourses={sorting.selectedCourses || []} onToggleCourse={sorting.toggleCourse || (() => {})} />
            )}
            <ToolbarSortControl>
                <AnimatedDropdown value={sorting.sortBy} onChange={sorting.handleNewSort} options={SORT_OPTIONS} placeholder="Sort" />
            </ToolbarSortControl>
        </>
    );
}

export function ModuleToolbar({ search, sorting, isTeacher, isMyModules }) {
    return (
        <PageToolbar
            searchSlot={<SearchBar value={search.query} onChange={search.onQueryChange} placeholder={getSearchPlaceholder(isMyModules)} />}
            controlsSlot={<ToolbarControls isTeacher={isTeacher} isMyModules={isMyModules} sorting={sorting} />}
        />
    );
}

export function EnrolmentToolbar({ enrollSearch, setEnrollSearch, enrolledSorting }) {
    return (
        <PageToolbar
            searchSlot={<SearchBar value={enrollSearch} onChange={(q) => { setEnrollSearch(q); enrolledSorting.setCurrentPage(1); }} placeholder="Search your enrolled modules..." />}
            controlsSlot={
                <ToolbarSortControl>
                    <AnimatedDropdown value={enrolledSorting.sortBy} onChange={enrolledSorting.handleNewSort} options={SORT_OPTIONS} placeholder="Sort" />
                </ToolbarSortControl>
            }
        />
    );
}

export function EnrolmentGrid({ state, enrolledSorting }) {
    const { hook, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule } = state;
    return (
        <ModuleGrid
            modules={enrolledSorting.results} enrollments={hook.enrollments} isTeacher={false}
            onViewModule={setViewingModule} onEnrollmentToggle={hook.toggleEnrollment}
            onEdit={(m) => { setEditingModule(m); setShowForm(true); }}
            onDelete={(m) => hook.handleDeleteModule(m, () => setViewingModule(null))}
            onManageDeadlines={setDeadlineModule} onManageReadings={setReadingModule}
            taskCountsByModule={hook.taskCountsByModule}
        />
    );
}

function createClearHandler(search, sorting, options = {}) {
    return () => {
        if (String(search.query || '').trim()) search.onQueryChange('');
        if (!options.preserveView && search.filter !== 'all') search.onFilterChange('all');
        sorting.clearFilters();
    };
}

function SearchEmpty({ search, sorting, isStudentMyModules }) {
    const clear = createClearHandler(search, sorting, { preserveView: isStudentMyModules });
    return <SearchEmptyState query={search.query} itemLabel={isStudentMyModules ? 'your modules' : 'modules'} onClear={clear} />;
}

function FilterEmpty({ search, sorting }) {
    const clear = createClearHandler(search, sorting);
    return (
        <SearchEmptyState
            itemLabel="modules"
            title="No modules matched your filters"
            hint="Try adjusting your filters or clear them to show more."
            onClear={clear}
            alwaysShowClear
            clearLabel="Clear filters"
        />
    );
}

function TeacherEmpty() {
    return <EmptyState icon="\ud83d\udcda" title="No modules yet" description="Create your first module for students to browse and enrol in." />;
}

function NotEnrolledEmpty({ onBrowse }) {
    return (
        <EmptyState
            icon="\ud83d\udcda"
            title="You're not enrolled in any modules yet"
            description="Browse modules to add your first King's module."
            action={<PrimaryButton pill onClick={onBrowse}>Browse modules</PrimaryButton>}
        />
    );
}

function FallbackEmpty() {
    return <EmptyState icon="\ud83d\udcda" title="No modules found" description="Try adjusting your search or filters." />;
}

export function EmptyResults({ search, sorting, isTeacher }) {
    const isStudentMyModules = !isTeacher && search.filter === 'enrolled';
    const hasSearch = String(search.query || '').trim().length > 0;
    const hasActiveFilter = search.filter !== 'all' || (sorting.selectedCourses || []).length > 0;
    if (hasSearch) return <SearchEmpty search={search} sorting={sorting} isStudentMyModules={isStudentMyModules} />;
    if (hasActiveFilter && !isStudentMyModules) return <FilterEmpty search={search} sorting={sorting} />;
    if (isTeacher) return <TeacherEmpty />;
    if (isStudentMyModules) return <NotEnrolledEmpty onBrowse={() => search.onFilterChange('all')} />;
    return <FallbackEmpty />;
}

function ModuleGridWithPagination({ sorting, hook, isTeacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule }) {
    return (
        <div>
            <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} />
            <ModuleGrid
                modules={sorting.pageModules} enrollments={hook.enrollments} isTeacher={isTeacher}
                onViewModule={setViewingModule} onEnrollmentToggle={hook.toggleEnrollment}
                onEdit={(m) => { setEditingModule(m); setShowForm(true); }}
                onDelete={(m) => hook.handleDeleteModule(m, () => setViewingModule(null))}
                onManageDeadlines={setDeadlineModule} onManageReadings={setReadingModule}
                taskCountsByModule={hook.taskCountsByModule}
            />
            <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} />
            <BackToTop />
        </div>
    );
}

export function ModuleResults(props) {
    const { sorting, search, isTeacher } = props;
    if (sorting.results.length === 0) return <EmptyResults search={search} sorting={sorting} isTeacher={isTeacher} />;
    return <ModuleGridWithPagination {...props} />;
}
