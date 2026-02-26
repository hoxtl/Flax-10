import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isEnrolledIn } from '../../components/Modules/utils/moduleUtils.js';
import { filterModules } from '../../components/Modules/utils/moduleUtils.js';
import useModules from '../../components/Modules/hooks/useModules.js';
import ModuleGrid from '../../components/Modules/ModuleGrid.jsx';
import ModuleForm from '../../components/Modules/ModuleForm.jsx';
import ModuleDetails from '../../components/Modules/ModuleDetails.jsx';
import styles from './ModulesPage.module.css';
import DeadlineModal from '../../components/Modules/DeadlineModal.jsx';

function useModulesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const is_teacher = user.role === 'teacher';
    const [search_query, setSearchQuery] = useState('');
    const filterFromUrl = searchParams.get('filter');
    const [filter_mode, setFilterMode] = useState(filterFromUrl === 'enrolled' ? 'enrolled' : 'all');
    const [show_form, setShowForm] = useState(false);
    const [editing_module, setEditingModule] = useState(null);
    const [viewing_module, setViewingModule] = useState(null);
    const [deadline_module, setDeadlineModule] = useState(null);
    const hook = useModules();

    const codeFromUrl = searchParams.get('code');
    const moduleIdFromUrl = searchParams.get('moduleId');

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

    return { is_teacher, search_query, setSearchQuery, filter_mode, setFilterMode, show_form, setShowForm, editing_module, setEditingModule, viewing_module, setViewingModule, deadline_module, setDeadlineModule, hook };
}

export default function ModulesPage() {
    const state = useModulesPage();
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
    const { hook, is_teacher, search_query, filter_mode, setSearchQuery, setFilterMode, setViewingModule, setEditingModule, setShowForm, setDeadlineModule } = state;
    const filtered_modules = filterModules(hook.modules, hook.enrollments, search_query, filter_mode);
    return (
        <div className={styles.container}>
            <PageHeader is_teacher={is_teacher} onCreateModule={() => { setEditingModule(null); setShowForm(true); }} />
            <Toolbar search_query={search_query} filter_mode={filter_mode} onSearchChange={setSearchQuery} onFilterChange={setFilterMode} />
            {filtered_modules.length === 0
                ? <EmptyState search_query={search_query} />: <ModuleGrid
                    modules={filtered_modules} enrollments={hook.enrollments} isTeacher={is_teacher}
                    onViewModule={setViewingModule} onEnrollmentToggle={hook.toggleEnrollment}
                    onEdit={(m) => { setEditingModule(m); setShowForm(true); }}
                    onDelete={(m) => hook.handleDeleteModule(m, () => setViewingModule(null))}
                    onManageDeadlines={setDeadlineModule}
                  />
            }</div>);}

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

function Toolbar({ search_query, filter_mode, onSearchChange, onFilterChange }) {
    return (
        <div className={styles.toolbar}>
            <SearchInput value={search_query} onChange={onSearchChange} />
            <FilterSelect value={filter_mode} onChange={onFilterChange} />
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

function FilterSelect({ value, onChange }) {
    return (
        <select className={styles.filterSelect} value={value} onChange={(e) => onChange(e.target.value)}>
            <option value="all">All Modules</option>
            <option value="enrolled">My Enrollments</option>
        </select>
    );
}

function EmptyState({ search_query }) {
    const message = search_query ? `No modules found matching "${search_query}"` : 'No modules available yet';
    return (
        <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📚</span>
            <p>{message}</p>
        </div>
    );
}