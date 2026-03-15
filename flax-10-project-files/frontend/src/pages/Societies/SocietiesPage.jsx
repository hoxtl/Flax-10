/**
 * SocietiesPage handles the main view for exploring and managing societies.
 * It supports tabbed views for joined vs all societies and deep navigation to details.
 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppPage from "../../components/common/AppPage/AppPage";
import PageTransition from "../../components/common/PageTransition/PageTransition";
import PageSkeleton from "../../components/common/LoadingState/PageSkeleton";
import styles from "./SocietiesPage.module.css";
import { useSocieties } from "../../components/Society/hooks/useSocieties";
import AllSocieties from "./AllSocieties";
import SocietySection from "./SocietySection";
import SocietyDetailPage from "./SocietyDetailPage";
import CreateSocietyModal from "../../components/Society/CreateSocietyModal";
import ReportSocietyModal from "../../components/Society/SocietyDetail/ReportSocietyModal";
import Tabs from "../../components/common/Tabs/Tabs";
import { usePagination } from "../../hooks/usePagination";
import { BackToTop } from "../../components/Pagination/Pagination";
import SearchBar from "../../components/common/SearchBar/SearchBar";

import { SocietiesSkeleton } from "./SocietySkeletons";
import { useUnreportSociety } from "../../components/Society/hooks/useUnreportSociety";

/** Main entry point for the Societies feature. */
export default function SocietiesPage() {
    const state = useSocietiesPage();
    if (state.loading) return <SocietiesSkeleton />;
    const activeView = state.selectedSocietyId ? "detail" : state.view;

    if (state.selectedSocietyId) return <SocietyDetailPage societyId={state.selectedSocietyId} onBack={() => { state.setView('all'); state.clearSelection(); }} />;
    if (state.view === "all") return (
        <>
            <AllSocieties onBack={() => state.setView("my")} onSelect={state.selectSociety} societies={state.societies} onReport={state.setReportingSociety} onUnreport={state.handleUnreport} />
            {state.reportingSociety && <ReportSocietyModal society={state.reportingSociety} onClose={() => state.setReportingSociety(null)} onReportSuccess={() => state.onReportSuccess(state.reportingSociety.id)} />}
        </>
    );
    return (
        <>
            <AnimatePresence mode="wait" initial={false}>
                {activeView === "detail" ? (
                    <PageTransition key="society-detail">
                        <SocietyDetailPage societyId={state.selectedSocietyId} onBack={state.clearSelection} />
                    </PageTransition>
                ) : activeView === "all" ? (
                    <PageTransition key="society-all">
                        <AllSocieties onBack={() => state.setView("my")} onSelect={state.selectSociety} societies={state.societies} onReport={state.setReportingSociety} onUnreport={state.handleUnreport} />
                    </PageTransition>
                ) : (
                    <PageTransition key="society-my">
                        <MySocietiesView setView={state.setView} onSelect={state.selectSociety}
                            onCreateClick={() => state.setShowCreateModal(true)} societies={state.societies} onReport={state.setReportingSociety} onUnreport={state.handleUnreport} />
                    </PageTransition>
                )}
            </AnimatePresence>
            {state.showCreateModal && <CreateSocietyModal onClose={() => state.setShowCreateModal(false)} onCreate={state.onCreate} />}
            {state.reportingSociety && <ReportSocietyModal society={state.reportingSociety} onClose={() => state.setReportingSociety(null)} onReportSuccess={() => state.onReportSuccess(state.reportingSociety.id)} />}
        </>
    );
}

/** Manages the global state and navigation for the Societies page. */
function useSocietiesPage() {
    const { view, setView, selectedId, select } = useSocietiesNavigation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reportingSociety, setReportingSociety] = useState(null);
    const societiesData = useSocieties();
    const handleUnreport = useUnreportSociety(societiesData.updateSocietyLocally);
    return {
        view, setView, selectedSocietyId: selectedId,
        selectSociety: select, clearSelection: () => select(null),
        showCreateModal, setShowCreateModal, reportingSociety, setReportingSociety,
        ...societiesData, handleUnreport,
        onReportSuccess: (id) => societiesData.updateSocietyLocally(id, { has_reported: true }),
        onCreate: async (form) => {
            const res = await societiesData.handleCreate(form);
            setShowCreateModal(false);
            select(res.id);
        }
    };
}

/** Handles URL-based navigation and selection state. */
function useSocietiesNavigation() {
    const [params, setParams] = useSearchParams();
    const view = params.get('tab') === 'all' ? 'all' : 'my';
    const selectedId = params.get('id');

    const updateParams = (key, val) => setParams(prev => {
        if (!val) prev.delete(key); else prev.set(key, val);
        return prev;
    });

    return {
        view,
        setView: (v) => updateParams('tab', v),
        selectedId,
        select: (id) => updateParams('id', id)
    };
}


const PAGE_SIZE = 15;

/** Displays the user's joined and managed societies with search. */
function MySocietiesView({ setView, onSelect, onCreateClick, societies, onReport, onUnreport }) {
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const activeTab = params.get('subTab') || "member";
    const setTab = (t) => setParams(prev => {
        prev.set('subTab', t); return prev;
    }, { replace: true });
    const filtered = societies.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
    );
    const tabs = buildTabs(filtered, societies, { onSelect, onReport, onUnreport, setView, onCreateClick });
    return (
        <AppPage className={styles.container} title="Societies" subtitle="Your communities at King's College London">
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setTab}
                rightAction={<MySocietiesSearch value={search} onChange={setSearch} />} />
            <BackToTop />
        </AppPage>
    );
}

/** Build the tab configuration for memberships and management. */
function buildTabs(filtered, all, { onSelect, onReport, onUnreport, setView, onCreateClick }) {
    const common = { onSelect, onReport, onUnreport, hideTitle: true };
    const adminOf = filtered.filter(s => s.is_admin);
    const memberOf = filtered.filter(s => s.is_member && !s.is_admin);

    return [
        {
            id: "member", label: "My Memberships",
            content: <PaginatedSection {...common} items={memberOf} type="member"
                onAction={() => setView("all")} allSocieties={all} />
        },
        {
            id: "admin", label: "Managed By Me",
            content: <PaginatedSection {...common} items={adminOf} type="admin" onAction={onCreateClick} />
        }
    ];
}

/** Renders a society section with internal pagination. */
function PaginatedSection({ items, ...props }) {
    const { currentItems, totalPages, currentPage, setPage } = usePagination(items, PAGE_SIZE);
    return <SocietySection {...props} items={currentItems}
        pagination={{ currentPage, totalPages, onPageChange: setPage }} />;
}

/** Compact search bar for the MySocieties view header. */
function MySocietiesSearch({ value, onChange }) {
    return (
        <SearchBar
            value={value}
            onChange={onChange}
            placeholder="Search my societies..."
            className={styles.smallSearch}
        />
    );
}
