import { useState, useEffect } from 'react';
import { isEnrolledIn, filterModules, getDepartments } from '../../components/Modules/utils/moduleUtils.js';
import useModules from '../../components/Modules/hooks/useModules.js';
import ModuleGrid from '../../components/Modules/ModuleGrid.jsx';
import ModuleForm from '../../components/Modules/ModuleForm.jsx';
import ModuleDetails from '../../components/Modules/ModuleDetails.jsx';
import styles from './ModulesPage.module.css';
import DeadlineModal from '../../components/Modules/DeadlineModal.jsx';
import useModuleSorting from '../../components/Modules/hooks/useModuleSorting.js';
import ModuleDropdown from '../../components/Modules/ModuleDropdown.jsx';
import { Pagination, BackToTop } from '../../components/Pagination/Pagination.jsx';

function useModulesPage(initialSearch = '') {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const is_teacher = user.role === 'teacher';
    const [search_query, setSearchQuery] = useState(initialSearch);
    const [filter_mode, setFilterMode] = useState('all');
    const [show_form, setShowForm] = useState(false);
    const [editing_module, setEditingModule] = useState(null);
    const [viewing_module, setViewingModule] = useState(null);
    const [deadline_module, setDeadlineModule] = useState(null);
    const hook = useModules();

    // Auto-open the specific module detail when navigated from a profile card
    useEffect(() => {
        if (!initialSearch || hook.loading || hook.modules.length === 0) return;
        const match = hook.modules.find(
            m => m.module_code?.toLowerCase() === initialSearch.toLowerCase()
        );
        if (match) setViewingModule(match);
    }, [initialSearch, hook.loading, hook.modules]);

    return { is_teacher, search_query, setSearchQuery, filter_mode, setFilterMode, show_form, setShowForm, editing_module, setEditingModule, viewing_module, setViewingModule, deadline_module, setDeadlineModule, hook };
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

export default function ModulesPage({ initialSearch = '' }) {
    const state = useModulesPage(initialSearch);
    const { hook, show_form, viewing_module, deadline_module, setDeadlineModule } = state;
    if (hook.loading) return <LoadingView />;
    if (show_form) return <FormView state={state} />;
    if (viewing_module) return <DetailsView state={state} />;
    return (
        <>
            <MainView state={state} />
            {deadline_module && <DeadlineModal module={deadline_module} onClose={() => setDeadlineModule(null)} />}
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
    const { hook, is_teacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule } = state;
    const { sorting, search, departments } = useMainView(state);
    return (
        <div className={styles.container}>
            <PageHeader is_teacher={is_teacher} onCreateModule={() => { setEditingModule(null); setShowForm(true); }} />
            <Toolbar search={search} sorting={sorting} departments={departments} />
            <ModuleResults sorting={sorting} hook={hook} isTeacher={is_teacher} setViewingModule={setViewingModule}
                setEditingModule={setEditingModule} setShowForm={setShowForm} setDeadlineModule={setDeadlineModule} />
        </div>
    );
}

function ModuleResults({ sorting, hook, isTeacher, setViewingModule, setEditingModule, setShowForm, setDeadlineModule }) {
    if (sorting.results.length === 0) return <EmptyState />;
    return (
        <div>
            <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} />
            <ModuleGrid
                modules={sorting.pageModules} enrollments={hook.enrollments} isTeacher={isTeacher}
                onViewModule={setViewingModule} onEnrollmentToggle={hook.toggleEnrollment}
                onEdit={(m) => { setEditingModule(m); setShowForm(true); }}
                onDelete={(m) => hook.handleDeleteModule(m, () => setViewingModule(null))}
                onManageDeadlines={setDeadlineModule}
            />
            <Pagination currentPage={sorting.currentPage} totalPages={sorting.totalPages} onPageChange={sorting.setCurrentPage} />
            <BackToTop />
        </div>
    );
}

function LoadingView() {
    return (
        <div className={styles.container}>
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <p>Loading modules...</p>
            </div>
        </div>
    );
}

function PageHeader({ is_teacher, onCreateModule }) {
    const subtitle = is_teacher ? 'Manage your course modules and lectures' : 'Browse and enroll into available modules...';
    return (
        <div className={styles.header}>
            <div>
                <h1 className={styles.pageTitle}>Modules</h1>
                <p className={styles.subtitle}>{subtitle}</p>
            </div>
            {is_teacher && <button className={styles.createButton} onClick={onCreateModule}>+ Create Module</button>}
        </div>
    );
}

const filter_options = [
    { value: 'all', label: 'All Modules' },
    { value: 'enrolled', label: 'My Enrollments' },
];

const sortOptions = [
    { value: 'name', label: 'Sort by Name' },
    { value: 'deadlines', label: 'Sort by Deadlines' },
];

function Toolbar({ search, sorting, departments }) {
    const dept_options = [
    { value: 'all', 'label': 'All Departments' },
        ...departments.map(d => ({ value: d, label: d })),
    ];
    return (
        <div className={styles.toolbar}>
            <SearchInput value={search.query} onChange={search.onQueryChange} />
            <ModuleDropdown value={search.filter} onChange={search.onFilterChange} options={filter_options} />
            <ModuleDropdown value={sorting.department} onChange={sorting.handleNewDepartment} options={dept_options} />
            <ModuleDropdown value={sorting.sortBy} onChange={sorting.handleNewSort} options={sortOptions} />
        </div>
    );
}

function SearchInput({ value, onChange }) {
    return (
        <div className={styles.searchContainer}>
            <input type="text" className={styles.searchInput} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search by module name or code..." />
            {value && <button className={styles.clearButton} onClick={() => onChange('')} aria-label="Clear search">×</button>}
        </div>
    );
}

function EmptyState({ }) {
    return (
        <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📚</span>
            <p>No modules found... </p>
        </div>
    );
}
