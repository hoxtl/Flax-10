/* Modules browsing page with filtering, sorting, and pagination. */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AppPage from '../../components/common/AppPage/AppPage';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';
import PageTransition from '../../components/common/PageTransition/PageTransition.jsx';
import { filterModules } from '../../components/Modules/utils/moduleUtils.js';
import useModules from '../../components/Modules/hooks/useModules.js';
import ModuleForm from '../../components/Modules/Modules/ModuleForm.jsx';
import ModuleDetails from '../../components/Modules/Modules/ModuleDetails.jsx';
import DeadlineModal from '../../components/Modules/Deadlines/DeadlineModal.jsx';
import useModuleSorting from '../../components/Modules/hooks/useModuleSorting.js';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import Tabs from '../../components/common/Tabs/Tabs';
import { BackToTop } from '../../components/Pagination/Pagination.jsx';
import ReadingModal from '../../components/Modules/Readings/ReadingModal.jsx';
import SkeletonBlock from '../../components/common/LoadingState/SkeletonBlock';
import SearchEmptyState from '../../components/common/SearchEmptyState/SearchEmptyState.jsx';
import MyModulesDashboard from './MyModulesDashboard.jsx';
import { ModuleToolbar, EnrollmentToolbar, EnrollmentGrid, ModuleResults } from './ModulesPageParts.jsx';
import styles from './ModulesPage.module.css';

function resolveInitialFilter(filterFromUrl, isTeacher) {
    if (filterFromUrl === 'enrolled') return 'enrolled';
    if (filterFromUrl === 'all') return 'all';
    return isTeacher ? 'all' : 'enrolled';
}

function usePageState(initialSearch, initialCreate, searchParams) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isTeacher = user.role === 'teacher';
    const initialFilter = resolveInitialFilter(searchParams.get('filter'), isTeacher);
    return {
        is_teacher: isTeacher,
        search: useState(initialSearch || ''),
        filter: useState(initialFilter),
        form: useState(!!initialCreate),
        editing: useState(null),
        viewing: useState(null),
        deadline: useState(null),
        reading: useState(null),
    };
}

function useModulesPage(initialSearch = '', initialCreate = false) {
    const [searchParams, setSearchParams] = useSearchParams();
    const st = usePageState(initialSearch, initialCreate, searchParams);
    const [search_query, setSearchQuery] = st.search;
    const [filter_mode, setFilterMode] = st.filter;
    const [show_form, setShowForm] = st.form;
    const [editing_module, setEditingModule] = st.editing;
    const [viewing_module, setViewingModule] = st.viewing;
    const [deadline_module, setDeadlineModule] = st.deadline;
    const [reading_module, setReadingModule] = st.reading;
    const hook = useModules();
    const codeFromUrl = searchParams.get('code'), moduleIdFromUrl = searchParams.get('moduleId');

    useEffect(() => {
        if (!initialSearch || codeFromUrl || moduleIdFromUrl || !hook.modules?.length) return;
        const match = hook.modules.find(m => m.module_code?.toLowerCase() === initialSearch.toLowerCase());
        if (match) setViewingModule(match);
    }, [initialSearch, modules, codeFromUrl, moduleIdFromUrl, setViewingModule]);
}

function handleModuleIdMatch(moduleIdFromUrl, modules, setViewingModule, searchParams, setSearchParams) {
    const match = modules.find((m) => m.id === Number(moduleIdFromUrl));
    if (!match) return false;
    setViewingModule(match);
    const next = new URLSearchParams(searchParams);
    next.delete('moduleId');
    setSearchParams(next.toString(), { replace: true });
    return true;
}

    useEffect(() => {
        if (!codeFromUrl && !moduleIdFromUrl) return;
        if (hook.loading || !hook.modules) return;
        if (moduleIdFromUrl) {
            const match = hook.modules.find(m => m.id === Number(moduleIdFromUrl));
            if (match) {
                setViewingModule(match);
                const next = new URLSearchParams(searchParams);
                next.delete('moduleId');
                setSearchParams(next.toString(), { replace: true });
                return;
            }
        }
        if (codeFromUrl) {
            const norm = (s) => (s || '').toUpperCase().replace(/\s/g, '');
            const match = hook.modules?.find(m => norm(m.module_code) === norm(codeFromUrl));
            if (match) { setViewingModule(match); setSearchParams({}, { replace: true }); }
            else { setSearchQuery(codeFromUrl.trim()); setSearchParams({}, { replace: true }); }
        }
    }, [codeFromUrl, moduleIdFromUrl, hook.loading, hook.modules, searchParams, setSearchParams, setViewingModule, setSearchQuery]);

    useEffect(() => {
        const showAll = () => {
            Object.values(setters).forEach(fn => fn(null));
            setters.setSearchQuery('');
            setters.setFilterMode('all');
            setSearchParams({}, { replace: true });
        };
        window.addEventListener('modules:show-all', showAll);
        return () => window.removeEventListener('modules:show-all', showAll);
    }, [setSearchParams, setters]);
}

function useModulesPage(initialSearch = '', initialCreate = false) {
    const [searchParams, setSearchParams] = useSearchParams();
    const ps = usePageState(initialSearch, initialCreate, searchParams);
    const [search_query, setSearchQuery] = ps.search;
    const [filter_mode, setFilterMode] = ps.filter;
    const [show_form, setShowForm] = ps.form;
    const [editing_module, setEditingModule] = ps.editing;
    const [viewing_module, setViewingModule] = ps.viewing;
    const [deadline_module, setDeadlineModule] = ps.deadline;
    const [reading_module, setReadingModule] = ps.reading;
    const hook = useModules();
    const [codeFromUrl, moduleIdFromUrl] = [searchParams.get('code'), searchParams.get('moduleId')];
    useInitialSearchMatch(initialSearch, codeFromUrl, moduleIdFromUrl, hook.modules, setViewingModule);
    useUrlModuleMatch(codeFromUrl, moduleIdFromUrl, hook, setViewingModule, setSearchQuery, searchParams, setSearchParams);
    useShowAllListener({ setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule, setSearchQuery, setFilterMode }, setSearchParams);
    return { is_teacher: ps.is_teacher, search_query, setSearchQuery, filter_mode, setFilterMode, show_form, setShowForm, editing_module, setEditingModule, viewing_module, setViewingModule, deadline_module, setDeadlineModule, hook, reading_module, setReadingModule };
}

function useMainViewData(state) {
    const { hook, search_query, filter_mode, setSearchQuery, setFilterMode, is_teacher } = state;
    const filtered = filterModules(
        hook.modules, hook.enrollments, search_query, filter_mode,
        { excludeEnrolled: !is_teacher && filter_mode === 'all' },
    );
    const sorting = useModuleSorting(filtered);
    const search = {
        query: search_query, filter: filter_mode,
        onQueryChange: (q) => { setSearchQuery(q); sorting.setCurrentPage(1); },
        onFilterChange: (f) => { setFilterMode(f); sorting.setCurrentPage(1); },
    };
    return { sorting, search };
}

function SkeletonHeader() {
    return (
        <div className={styles.skeletonHeader}>
            <div className={styles.skeletonHeaderText}>
                <SkeletonBlock className={styles.skeletonTitle} />
                <SkeletonBlock className={styles.skeletonSubtitle} />
            </div>
            <SkeletonBlock className={styles.skeletonAction} />
        </div>
    );
}

function SkeletonToolbar() {
    return (
        <div className={styles.skeletonToolbar}>
            <SkeletonBlock className={styles.skeletonSearch} />
            <SkeletonBlock className={styles.skeletonSelect} />
            <SkeletonBlock className={styles.skeletonSelect} />
            <SkeletonBlock className={styles.skeletonSort} />
        </div>
    );
}

function ModulesSkeleton() {
    return (
        <div className={styles.container} data-testid="modules-skeleton" aria-busy="true">
            <SkeletonHeader />
            <SkeletonToolbar />
            <div className={styles.skeletonGrid}>
                {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className={styles.skeletonCard} />)}
            </div>
        </div>
    );
}

function getViewKey(show_form, viewing_module) {
    if (show_form) return 'modules-form';
    if (viewing_module) return `modules-details-${viewing_module.id || viewing_module.module_code || 'active'}`;
    return 'modules-list';
}

function TestModeContent({ state }) {
    const { show_form, viewing_module, deadline_module, setDeadlineModule } = state;
    if (show_form) return <FormView state={state} />;
    if (viewing_module) return <DetailsView state={state} />;
    return (
        <>
            <MainView state={state} />
            {deadline_module && <DeadlineModal module={deadline_module} onClose={() => setDeadlineModule(null)} />}
        </>
    );
}

function AnimatedContent({ state, viewKey }) {
    const { sorting, search } = useMainView(state);
    return (
        <AnimatePresence mode="wait" initial={false}>
            {state.show_form && <PageTransition key={viewKey}><FormView state={state} /></PageTransition>}
            {!state.show_form && state.viewing_module && <PageTransition key={viewKey}><DetailsView state={state} /></PageTransition>}
            {!state.show_form && !state.viewing_module && <PageTransition key={viewKey}><MainView state={state} sorting={sorting} search={search} /></PageTransition>}
        </AnimatePresence>
    );
}

function Modals({ state }) {
    const { show_form, viewing_module, deadline_module, setDeadlineModule, reading_module, setReadingModule } = state;
    if (show_form || viewing_module) return null;
    return (
        <>
            {deadline_module && <DeadlineModal module={deadline_module} onClose={() => setDeadlineModule(null)} />}
            {reading_module && <ReadingModal module={reading_module} onClose={() => setReadingModule(null)} />}
        </>
    );
}

export default function ModulesPage({ initialSearch = '', initialCreate = false }) {
    const state = useModulesPage(initialSearch, initialCreate);
    if (state.hook.loading) return <ModulesSkeleton />;
    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    if (isTestEnv) return <TestModeContent state={state} />;
    const viewKey = getViewKey(state.show_form, state.viewing_module);
    return (<><AnimatedContent state={state} viewKey={viewKey} /><Modals state={state} /></>);
}

function FormView({ state }) {
    const { editing_module, hook, setShowForm, setEditingModule } = state;
    function handleSuccess(savedModule, isNew) {
        if (isNew) hook.handleModuleCreated(savedModule);
        else hook.handleModuleUpdated(savedModule);
        setShowForm(false);
        setEditingModule(null);
    }
    const handleCancel = () => { setShowForm(false); setEditingModule(null); };
    return (
        <div className={styles.container}>
            <ModuleForm module={editing_module} onSuccess={handleSuccess} onCancel={handleCancel} />
        </div>
    );
}

function DetailsView({ state }) {
    const { viewing_module, hook, setViewingModule, is_teacher } = state;
    return (
        <div className={styles.container}>
            <ModuleDetails
                module={viewing_module}
                is_enrolled={isEnrolledIn(viewing_module.id, hook.enrollments)}
                is_teacher={is_teacher}
                onBack={() => { setViewingModule(null); state.setSearchQuery(''); }}
                onEnroll={() => hook.handleEnrollment(viewing_module)}
                onUnenroll={() => hook.handleDisenrol(viewing_module)}
            />
            <BackToTop />
        </div>
    );
}

function CreateModuleButton({ setEditingModule, setShowForm }) {
    return (
        <PrimaryButton className={styles.createButton} pill onClick={() => { setEditingModule(null); setShowForm(true); }}>
            + Create Module
        </PrimaryButton>
    );
}

function StudentModulesTabs({ filterMode, onChange }) {
    const options = [
        { value: 'enrolled', label: 'My Modules' },
        { value: 'all', label: 'Browse Modules' },
    ];
    return <SegmentedControl className={styles.studentTabs} value={filterMode} onChange={onChange} options={options} variant="solid" />;
}

function MyModulesTabContent({ state }) {
    return (
        <>
            <MyModulesDashboard modules={state.hook.modules} enrollments={state.hook.enrollments} />
            <BackToTop />
        </>
    );
}

function MyEnrollmentsTabContent({ state }) {
    const [enrollSearch, setEnrollSearch] = useState('');
    const enrolledModules = filterModules(state.hook.modules, state.hook.enrollments, enrollSearch, 'enrolled');
    const enrolledSorting = useModuleSorting(enrolledModules);
    return (
        <>
            <EnrollmentToolbar enrollSearch={enrollSearch} setEnrollSearch={setEnrollSearch} enrolledSorting={enrolledSorting} />
            {enrolledSorting.results.length === 0
                ? <SearchEmptyState query={enrollSearch} itemLabel="your modules" onClear={() => setEnrollSearch('')} />
                : <EnrollmentGrid state={state} enrolledSorting={enrolledSorting} />}
            <BackToTop />
        </>
    );
}

function MyModulesWithTabs({ state }) {
    const [innerTab, setInnerTab] = useState('overview');
    const tabs = [
        { id: 'overview', icon: '\ud83d\udcca', label: 'Overview', content: <MyModulesTabContent state={state} /> },
        { id: 'enrollments', icon: '\ud83d\udcda', label: 'My Enrollments', content: <MyEnrollmentsTabContent state={state} /> },
    ];
    return <Tabs tabs={tabs} activeTab={innerTab} onTabChange={setInnerTab} layoutId="myModulesTabIndicator" tabVariant="heading" />;
}

function getMainViewTitle(isTeacher, isStudentMyModules) {
    if (isTeacher) return 'Modules';
    return isStudentMyModules ? 'My Modules' : 'Browse Modules';
}

function getMainViewSubtitle(isTeacher, isStudentMyModules) {
    if (isTeacher) return <>Manage <em>King's modules</em> and keep your <em>teaching schedule</em> organised.</>;
    if (isStudentMyModules) return <>See your <em>enrolled modules</em>, <em>readings</em>, and <em>deadlines</em> in one place.</>;
    return <>Browse <em>King's modules</em> and add more options for your <em>term choices</em>.</>;
}

function getMainViewAction(isTeacher, setEditingModule, setShowForm, search) {
    if (isTeacher) return <CreateModuleButton setEditingModule={setEditingModule} setShowForm={setShowForm} />;
    return <StudentModulesTabs filterMode={search.filter} onChange={search.onFilterChange} />;
}

function BrowseContent({ state, sorting, search }) {
    const { hook, is_teacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule } = state;
    return (
        <>
            <ModuleToolbar search={search} sorting={sorting} isTeacher={is_teacher} isMyModules={false} />
            <ModuleResults
                sorting={sorting} search={search} hook={hook} isTeacher={is_teacher}
                setViewingModule={setViewingModule} setEditingModule={setEditingModule}
                setShowForm={setShowForm} setDeadlineModule={setDeadlineModule} setReadingModule={setReadingModule}
            />
        </>
    );
}

function MainViewPage({ state, sorting, search, isStudentMyModules }) {
    const { is_teacher, setEditingModule, setShowForm } = state;
    return (
        <AppPage
            width="xl" className={styles.container}
            title={getMainViewTitle(is_teacher, isStudentMyModules)}
            subtitle={getMainViewSubtitle(is_teacher, isStudentMyModules)}
            action={getMainViewAction(is_teacher, setEditingModule, setShowForm, search)}
        >
            {isStudentMyModules
                ? <MyModulesWithTabs state={state} />
                : <BrowseContent state={state} sorting={sorting} search={search} />}
        </AppPage>
    );
}

function MainView({ state }) {
    const { is_teacher } = state;
    const { sorting, search } = useMainViewData(state);
    const isStudentMyModules = !is_teacher && search.filter === 'enrolled';
    const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const page = <MainViewPage state={state} sorting={sorting} search={search} isStudentMyModules={isStudentMyModules} />;
    if (is_teacher || isTestEnv) return page;
    return (
        <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={`student-modules-${search.filter}`}>{page}</PageTransition>
        </AnimatePresence>
    );
}
