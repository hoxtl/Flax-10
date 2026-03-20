/** Modules page for browsing, enrolling, and managing course modules. */
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence } from "framer-motion";
import AppPage from '../../components/common/AppPage/AppPage';
import PageTransition from '../../components/common/PageTransition/PageTransition.jsx';
import { filterModules } from '../../components/Modules/utils/moduleUtils.js';
import useModules from '../../components/Modules/hooks/useModules.js';
import styles from './ModulesPage.module.css';
import DeadlineModal from '../../components/Modules/Deadlines/DeadlineModal.jsx';
import useModuleSorting from '../../components/Modules/hooks/useModuleSorting.js';
import ReadingModal from '../../components/Modules/Readings/ReadingModal.jsx';
import SkeletonBlock from '../../components/common/LoadingState/SkeletonBlock';
import {
    MainView, FormView, DetailsView
} from './components/ModulesPageViews';

export default function ModulesPage({ initialSearch = '', initialCreate = false }) {
    const state = useModulesPage(initialSearch, initialCreate);
    if (state.hook.loading) return <ModulesSkeleton />;
    
    const isTestEnv = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
    if (isTestEnv) return <TestModeContent state={state} />;
    
    const viewKey = getViewKey(state.show_form, state.viewing_module);
    return (<><AnimatedContent state={state} viewKey={viewKey} /><Modals state={state} /></>);
}

function usePageState(initialSearch, initialCreate, searchParams) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const filterFromUrl = searchParams.get('filter');
    const is_teacher = user.role === 'teacher';
    const initialFilter = filterFromUrl === 'enrolled' ? 'enrolled' : 
        (filterFromUrl === 'all' ? 'all' : (is_teacher ? 'all' : 'enrolled'));
    return {
        is_teacher,
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
    }, [initialSearch, hook.modules, codeFromUrl, moduleIdFromUrl, setViewingModule]);

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
            setViewingModule(null); setEditingModule(null); setShowForm(false);
            setDeadlineModule(null); setReadingModule(null);
            setSearchQuery(""); setFilterMode("all");
            setSearchParams({}, { replace: true });
        };
        window.addEventListener("modules:show-all", showAll);
        return () => window.removeEventListener("modules:show-all", showAll);
    }, [setSearchParams, setViewingModule, setEditingModule, setShowForm, setDeadlineModule, setReadingModule, setSearchQuery, setFilterMode]);

    return { 
        is_teacher: st.is_teacher, search_query, setSearchQuery, filter_mode, setFilterMode, 
        show_form, setShowForm, editing_module, setEditingModule, viewing_module, setViewingModule, 
        deadline_module, setDeadlineModule, hook, reading_module, setReadingModule 
    };
}

function useMainView(state) {
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

function ModulesSkeleton() {
    return (
        <div className={styles.container} data-testid="modules-skeleton" aria-busy="true">
            <div className={styles.skeletonHeader}>
                <div className={styles.skeletonHeaderText}><SkeletonBlock className={styles.skeletonTitle} /><SkeletonBlock className={styles.skeletonSubtitle} /></div>
                <SkeletonBlock className={styles.skeletonAction} />
            </div>
            <div className={styles.skeletonToolbar}>
                <SkeletonBlock className={styles.skeletonSearch} /><SkeletonBlock className={styles.skeletonSelect} />
                <SkeletonBlock className={styles.skeletonSelect} /><SkeletonBlock className={styles.skeletonSort} />
            </div>
            <div className={styles.skeletonGrid}>{Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className={styles.skeletonCard} />)}</div>
        </div>
    );
}

function getViewKey(show_form, viewing_module) {
    if (show_form) return "modules-form";
    if (viewing_module) return `modules-details-${viewing_module.id || viewing_module.module_code || "active"}`;
    return "modules-list";
}

function TestModeContent({ state }) {
    const { show_form, viewing_module, deadline_module, setDeadlineModule } = state;
    if (show_form) return <FormView state={state} />;
    if (viewing_module) return <DetailsView state={state} />;
    const { sorting, search } = useMainView(state);
    return (
        <>
            <MainView state={state} sorting={sorting} search={search} />
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
