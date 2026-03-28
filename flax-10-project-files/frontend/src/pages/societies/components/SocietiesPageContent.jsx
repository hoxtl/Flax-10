/*
 * SocietiesPageContent renders the societies feature views and modal chrome.
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import AppPage from "../../../components/common/app_page/AppPage";
import PageTransition from "../../../components/common/page_transition/PageTransition";
import Tabs from "../../../components/common/tabs/Tabs";
import SearchBar from "../../../components/common/search_bar/SearchBar";
import { BackToTop } from "../../../components/pagination/Pagination";
import { usePagination } from "../../../hooks/usePagination";
import CreateSocietyModal from "../../../components/society/components/CreateSocietyModal";
import ReportSocietyModal from "../../../components/society/society_detail/ReportSocietyModal";
import AllSocieties from "./AllSocieties";
import SocietySection from "./SocietySection";
import SocietyDetailPage from "./SocietyDetailPage";
import { SocietiesSkeleton } from "./SocietySkeletons";
import styles from "../styles/SocietiesPage.module.css";
import extraStyles from "../styles/SocietiesPageExtras.module.css";

const pageStyles = { ...styles, ...extraStyles };
const societiesSubtitle = (
    <>
        Keep up with <em>King's societies</em>, <em>committees</em>, and <em>student communities</em>.
    </>
);

const PAGE_SIZE = 15;

export function SocietiesPageContent({ state }) {
    if (state.loading) return <SocietiesSkeleton />;
    return (
        <>
            <AnimatePresence initial={false}>
                {state.selectedSocietyId ? (
                    <PageTransition key={`society-detail-${state.selectedSocietyId}`}>
                        <SelectedSocietyView state={state} />
                    </PageTransition>
                ) : (
                    <PageTransition key={`society-view-${state.view}`}>
                        <SocietiesViewSwitch state={state} />
                    </PageTransition>
                )}
            </AnimatePresence>
            {!state.selectedSocietyId && <SocietiesModals state={state} />}
        </>
    );
}

function SelectedSocietyView({ state }) {
    return (
        <SocietyDetailPage
            societyId={state.selectedSocietyId}
            onBack={() => handleBackFromDetail(state)}
            onMembershipChange={state.refresh}
            onDelete={() => state.removeSociety(Number(state.selectedSocietyId))}
        />
    );
}

function handleBackFromDetail(state) {
    state.setView("my");
    state.clearSelection();
}

function SocietiesViewSwitch({ state }) {
    const view = state.view === "all" ? "all" : "my";
    return (
        <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={`society-${view}`}>
                {view === "all" ? <AllSocietiesView state={state} /> : <MySocietiesView state={state} />}
            </PageTransition>
        </AnimatePresence>
    );
}

function AllSocietiesView({ state }) {
    return (
        <AllSocieties
            onBack={() => state.setView("my")}
            onSelect={state.selectSociety}
            societies={state.societies}
            onReport={state.setReportingSociety}
            onUnreport={state.handleUnreport}
        />
    );
}

function SocietiesModals({ state }) {
    return (
        <>
            {state.showCreateModal && (
                <CreateSocietyModal onClose={() => state.setShowCreateModal(false)} onCreate={state.onCreate} />
            )}
            {state.reportingSociety && <ReportingModal state={state} />}
        </>
    );
}

function ReportingModal({ state }) {
    return (
        <ReportSocietyModal
            society={state.reportingSociety}
            onClose={() => state.setReportingSociety(null)}
            onReportSuccess={() => state.onReportSuccess(state.reportingSociety.id)}
        />
    );
}

function MySocietiesView({ state }) {
    const [params, setParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const activeTab = params.get("subTab") || "member";
    const filtered = filterSocieties(state.societies, search);
    const tabs = buildTabs(filtered, state.societies, state);
    return (
        <AppPage className={pageStyles.container} title="Societies" subtitle={societiesSubtitle}>
            <Tabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab, setParams)}
                tabVariant="heading"
                rightAction={<MySocietiesSearch value={search} onChange={setSearch} />}
            />
            <BackToTop />
        </AppPage>
    );
}

function filterSocieties(societies, search) {
    const query = search.toLowerCase();
    return societies.filter((society) => society.name.toLowerCase().includes(query));
}

function setActiveTab(tab, setParams) {
    setParams((prev) => {
        prev.set("subTab", tab);
        return prev;
    }, { replace: true });
}

function buildTabs(filtered, allSocieties, state) {
    return [
        createTab("member", "My Memberships", filtered.filter(isMembershipSociety), state, allSocieties),
        createTab("admin", "Managed By Me", filtered.filter((society) => society.is_admin), state),
    ];
}

function isMembershipSociety(society) {
    return society.is_member && !society.is_admin;
}

function createTab(id, label, items, state, allSocieties) {
    return {
        id,
        label,
        content: (
            <PaginatedSection
                items={items}
                type={id}
                hideTitle
                onSelect={state.selectSociety}
                onReport={state.setReportingSociety}
                onUnreport={state.handleUnreport}
                onAction={id === "member" ? () => state.setView("all") : () => state.setShowCreateModal(true)}
                allSocieties={allSocieties}
            />
        ),
    };
}

function PaginatedSection({ items, ...props }) {
    const { currentItems, totalPages, currentPage, setPage } = usePagination(items, PAGE_SIZE);
    return (
        <SocietySection
            {...props}
            items={currentItems}
            pagination={{ currentPage, totalPages, onPageChange: setPage }}
        />
    );
}

function MySocietiesSearch({ value, onChange }) {
    return (
        <SearchBar
            value={value}
            onChange={onChange}
            placeholder="Search my societies..."
            className={pageStyles.smallSearch}
        />
    );
}
