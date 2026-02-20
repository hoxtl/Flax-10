import { useState } from 'react';
import { isEnrolledIn } from '../../components/Modules/utils/moduleUtils.js';
import { filterModules } from '../../components/Modules/utils/moduleUtils.js';
import useModules from '../../components/Modules/hooks/useModules.js';
import ModuleGrid from '../../components/Modules/ModuleGrid.jsx';
import ModuleForm from '../../components/Modules/ModuleForm.jsx';
import ModuleDetails from '../../components/Modules/ModuleDetails.jsx';
import styles from './ModulesPage.module.css';

export default function ModulesPage() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const is_teacher = user.role === 'teacher';
    const [search_query, setSearchQuery] = useState('');
    const [filter_mode, setFilterMode] = useState('all');
    const [show_form, setShowForm] = useState(false);
    const [editing_module, setEditingModule] = useState(null);
    const [viewing_module, setViewingModule] = useState(null);
    const hook = useModules();
    if (hook.loading) return <LoadingView />;
    const filtered_modules = filterModules(hook.modules, hook.enrollments, search_query, filter_mode);
    if (show_form) return <FormView module={editing_module} hook={hook} setShowForm={setShowForm} setEditingModule={setEditingModule} />;
    if (viewing_module) return <DetailsView module={viewing_module} hook={hook} setViewingModule={setViewingModule} />;
    return <MainView hook={hook} is_teacher={is_teacher} filtered_modules={filtered_modules} search_query={search_query} filter_mode={filter_mode} setSearchQuery={setSearchQuery} setFilterMode={setFilterMode} setViewingModule={setViewingModule} setEditingModule={setEditingModule} setShowForm={setShowForm} />;
}

function FormView({ module, hook, setShowForm, setEditingModule }) {
    function HandleSuccess(saved_module, is_new) {
        if (is_new) hook.handleModuleCreated(saved_module);
        else hook.handleModuleUpdated(saved_module);
        setShowForm(false);
        setEditingModule(null);
    }
    return (
        <div className={styles.container}>
            <ModuleForm module={module} onSuccess={HandleSuccess} onCancel={() => { setShowForm(false); setEditingModule(null); }} />
        </div>
    );
}
function DetailsView({ module, hook, setViewingModule }) {
    return (
        <div className={styles.container}>
            <ModuleDetails
                module={module}
                is_enrolled={isEnrolledIn(module.id, hook.enrollments)}
                onBack={() => setViewingModule(null)}
                onEnroll={() => hook.handleEnrollment(module)}
                onUnenroll={() => hook.handleDisenrol(module)}
            />
        </div>
    );
}
function MainView({ hook, is_teacher, filtered_modules, search_query, filter_mode, setSearchQuery, setFilterMode, setViewingModule, setEditingModule, setShowForm }) {
    return (
        <div className={styles.container}>
            <PageHeader is_teacher={is_teacher} onCreateModule={() => { setEditingModule(null); setShowForm(true); }} />
            <Toolbar search_query={search_query} filter_mode={filter_mode} onSearchChange={setSearchQuery} onFilterChange={setFilterMode} />
            {filtered_modules.length === 0
                ? <EmptyState search_query={search_query} />
                : <ModuleGrid modules={filtered_modules} enrollments={hook.enrollments} isTeacher={is_teacher} onViewModule={setViewingModule} onEnrollmentToggle={hook.toggleEnrollment} onEdit={(m) => { setEditingModule(m); setShowForm(true); }} onDelete={(m) => hook.handleDeleteModule(m, () => setViewingModule(null))} />
            }
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
//Search input and filter dropdown
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
//Message notifying no modules matching search or filter
function EmptyState({ search_query }) {
    const message = search_query ? `No modules found matching "${search_query}"` : 'No modules available yet';
    return (
        <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📚</span>
            <p>{message}</p>
        </div>
    );
}
