import { useState } from 'react';
import { AnimatePresence } from "framer-motion";
import AppPage from '../../../components/common/AppPage/AppPage';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import PageToolbar, { ToolbarSortControl } from '../../../components/common/PageToolbar/PageToolbar';
import PrimaryButton from '../../../components/common/PrimaryButton/PrimaryButton';
import PageTransition from '../../../components/common/PageTransition/PageTransition.jsx';
import { isEnrolledIn, filterModules } from '../../../components/Modules/utils/moduleUtils.js';
import ModuleGrid from '../../../components/Modules/Modules/ModuleGrid.jsx';
import ModuleForm from '../../../components/Modules/Modules/ModuleForm.jsx';
import ModuleDetails from '../../../components/Modules/Modules/ModuleDetails.jsx';
import styles from '../ModulesPage.module.css';
import { SegmentedControl, TabBar, TabContent } from '../../../components/common';
import ModuleCourseFilter from '../../../components/Modules/Modules/ModuleCourseFilter';
import { Pagination, BackToTop } from '../../../components/Pagination/Pagination.jsx';
import SearchBar from '../../../components/common/SearchBar/SearchBar.jsx';
import SearchEmptyState from '../../../components/common/SearchEmptyState/SearchEmptyState.jsx';
import MyModulesDashboard from '../MyModulesDashboard.jsx';
import useModuleSorting from '../../../components/Modules/hooks/useModuleSorting.js';

export function CreateModuleButton({ setEditingModule, setShowForm }) {
    return <PrimaryButton className={styles.createButton} pill onClick={() => { setEditingModule(null); setShowForm(true); }}>+ Create Module</PrimaryButton>;
}

export function StudentModulesTabs({ filterMode, onChange }) {
    const options = [
        { value: 'enrolled', label: 'My Modules' },
        { value: 'all', label: 'Browse Modules' },
    ];
    return (
        <SegmentedControl
            className={styles.studentTabs}
            value={filterMode}
            onChange={onChange}
            options={options}
            variant="solid"
        />
    );
}

function MyModulesTabContent({ state }) {
    const { hook } = state;
    return (
        <>
            <MyModulesDashboard modules={hook.modules} enrollments={hook.enrollments} />
            <BackToTop />
        </>
    );
}

function MyEnrollmentsTabContent({ state }) {
    const { hook, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule } = state;
    const [enrollSearch, setEnrollSearch] = useState('');
    const enrolledModules = filterModules(hook.modules, hook.enrollments, enrollSearch, 'enrolled');
    const enrolledSorting = useModuleSorting(enrolledModules);
    const sortOptions = [{ value: 'name', label: 'A → Z' }, { value: 'name-desc', label: 'Z → A' }, { value: 'deadlines', label: 'Deadlines' }];
    return (
        <>
            <PageToolbar
                searchSlot={<SearchBar value={enrollSearch} onChange={(q) => { setEnrollSearch(q); enrolledSorting.setCurrentPage(1); }} placeholder="Search your enrolled modules..." />}
                controlsSlot={
                    <ToolbarSortControl>
                        <SegmentedControl value={enrolledSorting.handleNewSort} onChange={enrolledSorting.handleNewSort} options={sortOptions} />
                    </ToolbarSortControl>
                }
            />
            {enrolledSorting.results.length === 0 ? (
                <SearchEmptyState query={enrollSearch} itemLabel="your modules" onClear={() => setEnrollSearch('')} />
            ) : (
                <ModuleGrid modules={enrolledSorting.results} enrollments={hook.enrollments} isTeacher={false}
                    onViewModule={setViewingModule} onEnrollmentToggle={hook.toggleEnrollment}
                    onEdit={(m) => { setEditingModule(m); setShowForm(true); }} onDelete={(m) => hook.handleDeleteModule(m, () => setViewingModule(null))}
                    onManageDeadlines={setDeadlineModule} onManageReadings={setReadingModule} taskCountsByModule={hook.taskCountsByModule} />
            )}
            <BackToTop />
        </>
    );
}

function MyModulesWithTabs({ state }) {
    const [innerTab, setInnerTab] = useState('overview');
    const tabs = [
        { id: 'overview', icon: '📊', label: 'Overview', content: <MyModulesTabContent state={state} /> },
        { id: 'enrollments', icon: '📚', label: 'My Enrollments', content: <MyEnrollmentsTabContent state={state} /> },
    ];
    return (
        <>
            <TabBar tabs={tabs} activeTab={innerTab} onTabChange={setInnerTab} layoutId="myModulesTabIndicator" variant="heading" />
            <TabContent activeTab={innerTab}>{tabs.find(t => t.id === innerTab)?.content}</TabContent>
        </>
    );
}

export function FormView({ state }) {
    const { editing_module, hook, setShowForm, setEditingModule } = state;
    const handleSuccess = (saved, is_new) => {
        if (is_new) hook.handleModuleCreated(saved);
        else hook.handleModuleUpdated(saved);
        setShowForm(false);
        setEditingModule(null);
    };
    const handleCancel = () => { setShowForm(false); setEditingModule(null); };
    return (
        <div className={styles.container}>
            <ModuleForm module={editing_module} onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
    );
}

export function DetailsView({ state }) {
    const { viewing_module, hook, setViewingModule, setSearchQuery, is_teacher } = state;
    return (
        <div className={styles.container}>
            <ModuleDetails
                module={viewing_module}
                is_enrolled={isEnrolledIn(viewing_module.id, hook.enrollments)}
                is_teacher={is_teacher}
                onBack={() => { setViewingModule(null); setSearchQuery(''); }}
                onEnroll={() => hook.handleEnrollment(viewing_module)}
                onUnenroll={() => hook.handleDisenrol(viewing_module)}
            />
            <BackToTop />
        </div>
    );
}

export function MainView({ state, sorting, search }) {
    const { hook, is_teacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule } = state;
    const isStudentMyModules = !is_teacher && search.filter === 'enrolled';
    const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
    const title = is_teacher ? 'Modules' : (isStudentMyModules ? 'My Modules' : 'Browse Modules');
    const subtitle = getSubtitle(is_teacher, isStudentMyModules);
    const action = is_teacher
        ? <CreateModuleButton setEditingModule={setEditingModule} setShowForm={setShowForm} />
        : <StudentModulesTabs filterMode={search.filter} onChange={search.onFilterChange} />;
    
    const pageContent = (
        <AppPage width="xl" className={styles.container} title={title} subtitle={subtitle} action={action}>
            {isStudentMyModules ? <MyModulesWithTabs state={state} /> : <ModulesListSection state={state} sorting={sorting} search={search} />}
        </AppPage>
    );

    if (is_teacher || isTestEnv) return pageContent;
    return <AnimatePresence mode="wait" initial={false}><PageTransition key={`student-modules-${search.filter}`}>{pageContent}</PageTransition></AnimatePresence>;
}

function getSubtitle(is_teacher, isMyModules) {
    if (is_teacher) return <>Manage <em>King's modules</em> and keep your <em>teaching schedule</em> organised.</>;
    if (isMyModules) return <>See your <em>enrolled modules</em>, <em>readings</em>, and <em>deadlines</em> in one place.</>;
    return <>Browse <em>King's modules</em> and add more options for your <em>term choices</em>.</>;
}

function ModulesListSection({ state, sorting, search }) {
    const { hook, is_teacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule } = state;
    return (
        <>
            <ModuleToolbar search={search} sorting={sorting} isTeacher={is_teacher} />
            <ModuleResults sorting={sorting} search={search} hook={hook} isTeacher={is_teacher} setViewingModule={setViewingModule} setEditingModule={setEditingModule} setShowForm={setShowForm} setDeadlineModule={setDeadlineModule} setReadingModule={setReadingModule} />
        </>
    );
}

function ModuleToolbar({ search, sorting, isTeacher }) {
    const sortOptions = [{ value: 'name', label: 'A → Z' }, { value: 'name-desc', label: 'Z → A' }, { value: 'deadlines', label: 'Deadlines' }];
    const isMyModules = !isTeacher && search.filter === 'enrolled';
    return (
        <PageToolbar
            searchSlot={<SearchBar value={search.query} onChange={search.onQueryChange} placeholder={isMyModules ? 'Search your modules...' : "Search King's modules..."} />}
            controlsSlot={
                <>
                    {!isTeacher && !isMyModules && <ModuleCourseFilter selectedCourses={sorting.selectedCourses || []} onToggleCourse={sorting.toggleCourse || (() => { })} />}
                    <ToolbarSortControl><SegmentedControl value={sorting.sortBy} onChange={sorting.handleNewSort} options={sortOptions} /></ToolbarSortControl>
                </>
            }
        />
    );
}

function ModuleResults(props) {
    const { sorting, search, isTeacher } = props;
    if (sorting.results.length === 0) return <EmptyResults search={search} sorting={sorting} isTeacher={isTeacher} />;
    return <ModuleGridWithPagination {...props} />;
}

function EmptyResults({ search, sorting, isTeacher }) {
    const isMyModules = !isTeacher && search.filter === 'enrolled';
    const hasSearch = String(search.query || "").trim().length > 0;
    const hasActiveFilter = search.filter !== 'all' || (sorting.selectedCourses || []).length > 0;
    const handleClear = (opts) => () => {
        if (hasSearch) search.onQueryChange("");
        if (!opts?.preserveView && search.filter !== 'all') search.onFilterChange('all');
        sorting.clearFilters();
    };
    if (hasSearch) return <SearchEmptyState query={search.query} itemLabel={isMyModules ? "your modules" : "modules"} onClear={handleClear({ preserveView: isMyModules })} />;
    if (hasActiveFilter && !isMyModules) return <SearchEmptyState itemLabel="modules" title="No modules matched your filters" onClear={handleClear()} alwaysShowClear />;
    if (isTeacher) return <EmptyState icon="📚" title="No modules yet" description="Create your first module." />;
    if (isMyModules) return <EmptyState icon="📚" title="Not enrolled yet" action={<PrimaryButton pill onClick={() => search.onFilterChange('all')}>Browse modules</PrimaryButton>} />;
    return <EmptyState icon="📚" title="No modules found" />;
}

function ModuleGridWithPagination({ sorting, hook, isTeacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule }) {
    return (
        <div>
            <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} />
            <ModuleGrid modules={sorting.pageModules} enrollments={hook.enrollments} isTeacher={isTeacher}
                onViewModule={setViewingModule} onEnrollmentToggle={hook.toggleEnrollment}
                onEdit={(m) => { setEditingModule(m); setShowForm(true); }} onDelete={(m) => hook.handleDeleteModule(m, () => setViewingModule(null))}
                onManageDeadlines={setDeadlineModule} onManageReadings={setReadingModule} taskCountsByModule={hook.taskCountsByModule} />
            <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} /><BackToTop />
        </div>
    );
}
