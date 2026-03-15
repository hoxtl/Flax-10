import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppPage from '../../components/common/AppPage/AppPage';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import PageToolbar, { ToolbarSortControl } from '../../components/common/PageToolbar/PageToolbar';
import PrimaryButton from '../../components/common/PrimaryButton/PrimaryButton';

import { isEnrolledIn, filterModules, getDepartments } from '../../components/Modules/utils/moduleUtils.js';
import useModules from '../../components/Modules/hooks/useModules.js';
import ModuleGrid from '../../components/Modules/ModuleGrid.jsx';
import ModuleForm from '../../components/Modules/ModuleForm.jsx';
import ModuleDetails from '../../components/Modules/ModuleDetails.jsx';
import styles from './ModulesPage.module.css';
import DeadlineModal from '../../components/Modules/DeadlineModal.jsx';
import useModuleSorting from '../../components/Modules/hooks/useModuleSorting.js';
import AnimatedDropdown from '../../components/common/AnimatedDropdown';
import { Pagination, BackToTop } from '../../components/Pagination/Pagination.jsx';
import SearchBar from '../../components/common/SearchBar/SearchBar.jsx';
import ReadingModal from '../../components/Modules/ReadingModal.jsx';
import SkeletonBlock from '../../components/common/LoadingState/SkeletonBlock';

function useModulesPage(initialSearch = '', initialCreate = false) {
    const [searchParams, setSearchParams] = useSearchParams();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const is_teacher = user.role === 'teacher';
    const [search_query, setSearchQuery] = useState(initialSearch || '');
    const filterFromUrl = searchParams.get('filter');
    const [filter_mode, setFilterMode] = useState(filterFromUrl === 'enrolled' ? 'enrolled' : 'all');
    const [show_form, setShowForm] = useState(!!initialCreate);
    const [editing_module, setEditingModule] = useState(null);
    const [viewing_module, setViewingModule] = useState(null);
    const [deadline_module, setDeadlineModule] = useState(null);
    const [reading_module, setReadingModule] = useState(null);
    const hook = useModules();

    const codeFromUrl = searchParams.get('code');
    const moduleIdFromUrl = searchParams.get('moduleId');

    useEffect(() => {
        if (initialSearch && !codeFromUrl && !moduleIdFromUrl && hook.modules?.length > 0) {
            const match = hook.modules.find(m => m.module_code?.toLowerCase() === initialSearch.toLowerCase());
            if (match) setViewingModule(match);
        }
    }, [initialSearch, hook.modules]);

    useEffect(() => {
        if (!codeFromUrl && !moduleIdFromUrl) return;
        if (hook.loading) return;
        if (moduleIdFromUrl && hook.modules) {
            const id = Number(moduleIdFromUrl);
            const match = hook.modules.find((m) => m.id === id);
            if (match) {
                setViewingModule(match);
                const next = new URLSearchParams(searchParams);
                next.delete('moduleId');
                setSearchParams(next.toString(), { replace: true });
                return;
            }
        }
        if (codeFromUrl && hook.modules) {
            const norm = (s) => (s || '').toUpperCase().replace(/\s/g, '');
            const code = norm(codeFromUrl);
            const match = hook.modules?.find((m) => norm(m.module_code) === code);
            if (match) {
                setViewingModule(match);
                setSearchParams({}, { replace: true });
            } else {
                setSearchQuery(codeFromUrl.trim());
                setSearchParams({}, { replace: true });
            }
        }
    }, [codeFromUrl, moduleIdFromUrl, hook.loading, hook.modules, searchParams, setSearchParams]);

    return { is_teacher, search_query, setSearchQuery, filter_mode, setFilterMode, show_form, setShowForm, editing_module, setEditingModule, viewing_module, setViewingModule, deadline_module, setDeadlineModule, hook, reading_module, setReadingModule };
}

function useMainView(state) {
    const { hook, search_query, filter_mode, setSearchQuery, setFilterMode } = state;
    const filtered = filterModules(hook.modules, hook.enrollments, search_query, filter_mode);
    const sorting = useModuleSorting(filtered);
    const search = {
        query: search_query,
        filter: filter_mode,
        onQueryChange: (q) => { setSearchQuery(q); sorting.setCurrentPage(1); },
        onFilterChange: (f) => { setFilterMode(f); sorting.setCurrentPage(1); },
    };
    return { sorting, search, departments: getDepartments(hook.modules) };
}

function ModulesSkeleton() {
    return (
        <div className={styles.container} data-testid="modules-skeleton" aria-busy="true">
            <div className={styles.skeletonHeader}>
                <div className={styles.skeletonHeaderText}>
                    <SkeletonBlock className={styles.skeletonTitle} />
                    <SkeletonBlock className={styles.skeletonSubtitle} />
                </div>
                <SkeletonBlock className={styles.skeletonAction} />
            </div>
            <div className={styles.skeletonToolbar}>
                <SkeletonBlock className={styles.skeletonSearch} />
                <SkeletonBlock className={styles.skeletonSelect} />
                <SkeletonBlock className={styles.skeletonSelect} />
                <SkeletonBlock className={styles.skeletonSort} />
            </div>
            <div className={styles.skeletonGrid}>
                {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonBlock key={index} className={styles.skeletonCard} />
                ))}
            </div>
        </div>
    );
}

export default function ModulesPage({ initialSearch = '', initialCreate = false }) {
    const state = useModulesPage(initialSearch, initialCreate);
    const { hook, show_form, viewing_module, deadline_module, setDeadlineModule, reading_module, setReadingModule } = state;
    if (hook.loading) return <ModulesSkeleton />;
    if (show_form) return <FormView state={state} />;
    if (viewing_module) return <DetailsView state={state} />;
    return (
        <>
            <MainView state={state} />
            {deadline_module && <DeadlineModal module={deadline_module} onClose={() => setDeadlineModule(null)} />}
            {reading_module && <ReadingModal module={reading_module} onClose={() => setReadingModule(null)} />}
        </>
    );
}

function FormView({ state }) {
    const { editing_module, hook, setShowForm, setEditingModule } = state;
    function handleSuccess(saved_module, is_new) {
        if (is_new) hook.handleModuleCreated(saved_module);
        else hook.handleModuleUpdated(saved_module);
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
                onBack={() => setViewingModule(null)}
                onEnroll={() => hook.handleEnrollment(viewing_module)}
                onUnenroll={() => hook.handleDisenrol(viewing_module)}
            />
        </div>
    );
}

function MainView({ state }) {
    const { hook, is_teacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule } = state;
    const { sorting, search, departments } = useMainView(state);
    const subtitle = is_teacher ? 'Manage your course modules and lectures' : 'Browse and enroll into available modules';
    return (
        <AppPage
            width="xl"
            className={styles.container}
            title="Modules"
            subtitle={subtitle}
            action={is_teacher && (
                <PrimaryButton className={styles.createButton} pill onClick={() => { setEditingModule(null); setShowForm(true); }}>
                    + Create Module
                </PrimaryButton>
            )}
        >
            <ModuleToolbar search={search} sorting={sorting} departments={departments} isTeacher={is_teacher} />
            <ModuleResults sorting={sorting} hook={hook} isTeacher={is_teacher} setViewingModule={setViewingModule}
                setEditingModule={setEditingModule} setShowForm={setShowForm} setDeadlineModule={setDeadlineModule} setReadingModule={setReadingModule} />
        </AppPage>
    );
}

function ModuleToolbar({ search, sorting, departments, isTeacher }) {
    const filter_options = [{ value: 'all', label: 'All Modules' }, { value: 'enrolled', label: 'My Enrollments' }];
    const dept_options = [{ value: 'all', label: 'All Departments' }, ...departments.map(d => ({ value: d, label: d }))];
    const sortOptions = [{ value: 'name', label: 'A → Z' }, { value: 'deadlines', label: 'Deadlines' }];
    return (
        <PageToolbar
            searchSlot={<SearchBar value={search.query} onChange={search.onQueryChange} placeholder="Search by module name or code..." />}
            controlsSlot={
                <>
            {!isTeacher && (
                <AnimatedDropdown className={styles.toolbarDropdown} value={search.filter} onChange={search.onFilterChange} options={filter_options} />
            )}
                    <AnimatedDropdown className={styles.toolbarDropdown} value={sorting.department} onChange={sorting.handleNewDepartment} options={dept_options} />
                    <ToolbarSortControl>
                        <AnimatedDropdown className={styles.sortDropdown} value={sorting.sortBy} onChange={sorting.handleNewSort} options={sortOptions} />
                    </ToolbarSortControl>
                </>
            }
        />
    );
}

function ModuleResults({ sorting, hook, isTeacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule }) {
    if (sorting.results.length === 0) return <EmptyState icon="📚" title="No modules found" description="Try adjusting your search or filters." />;
    return (
        <div>
            <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} />
            <ModuleGrid
                modules={sorting.pageModules} enrollments={hook.enrollments} isTeacher={isTeacher}
                onViewModule={setViewingModule} onEnrollmentToggle={hook.toggleEnrollment}
                onEdit={(m) => { setEditingModule(m); setShowForm(true); }}
                onDelete={(m) => hook.handleDeleteModule(m, () => setViewingModule(null))}
                onManageDeadlines={setDeadlineModule}
                onManageReadings={setReadingModule}
            />
            <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} />
            <BackToTop />
        </div>
    );
}
