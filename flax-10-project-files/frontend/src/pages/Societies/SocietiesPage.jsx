import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader/PageHeader";
import PageSkeleton from "../../components/common/LoadingState/PageSkeleton";
import styles from "./SocietiesPage.module.css";
import { useSocieties } from "../../components/Society/hooks/useSocieties";
import AllSocieties from "./AllSocieties";
import SocietySection from "./SocietySection";
import SocietyDetailPage from "./SocietyDetailPage";
import CreateSocietyModal from "../../components/Society/CreateSocietyModal";
import ReportSocietyModal from "../../components/Society/SocietyDetail/ReportSocietyModal";
import { useConfirm } from "../../context/ConfirmContext";
import { unreportSociety } from "../../api/societyApi";
import Tabs from "../../components/common/Tabs/Tabs";
import { usePagination } from "../../hooks/usePagination";
import { BackToTop } from "../../components/Pagination/Pagination";

function SocietiesSkeleton() {
  return <PageSkeleton label="Loading societies" cardCount={8} cardHeight="200px" columns={4} />;
}

export default function SocietiesPage() {
    const state = useSocietiesPage();

    if (state.loading) return <SocietiesSkeleton />;
    if (state.selectedSocietyId) return <SocietyDetailPage societyId={state.selectedSocietyId} onBack={state.clearSelection} />;
    if (state.view === "all") return (
        <>
            <AllSocieties onBack={() => state.setView("my")} onSelect={state.selectSociety} societies={state.societies} onReport={state.setReportingSociety} onUnreport={state.handleUnreport} />
            {state.reportingSociety && <ReportSocietyModal society={state.reportingSociety} onClose={() => state.setReportingSociety(null)} onReportSuccess={() => state.onReportSuccess(state.reportingSociety.id)} />}
        </>
    );

    return (
        <>
            <MySocietiesView setView={state.setView} onSelect={state.selectSociety}
                onCreateClick={() => state.setShowCreateModal(true)} societies={state.societies} onReport={state.setReportingSociety} onUnreport={state.handleUnreport} />
            {state.showCreateModal && <CreateSocietyModal onClose={() => state.setShowCreateModal(false)} onCreate={state.onCreate} />}
            {state.reportingSociety && <ReportSocietyModal society={state.reportingSociety} onClose={() => state.setReportingSociety(null)} onReportSuccess={() => state.onReportSuccess(state.reportingSociety.id)} />}
        </>
    );
}

function useSocietiesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('tab') === 'all' ? 'all' : 'my';
    const selectedSocietyId = searchParams.get('id');

    const setView = (v) => setSearchParams(prev => { prev.set('tab', v); return prev; });
    const setSelectedSocietyId = (id) => {
        if (!id) {
            setSearchParams(prev => { prev.delete('id'); return prev; });
        } else {
            setSearchParams(prev => { prev.set('id', id); return prev; });
        }
    };

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reportingSociety, setReportingSociety] = useState(null);
    const { societies, loading, handleCreate, refresh, updateSocietyLocally } = useSocieties();
    const confirm = useConfirm();

    const handleUnreport = async (society) => {
        const isConfirmed = await confirm({
            title: "Unreport Society",
            message: `Are you sure you want to remove your report for ${society.name}?`,
            confirmText: "Unreport",
            cancelText: "Cancel",
            confirmStyle: "danger"
        });
        if (isConfirmed) {
            try {
                await unreportSociety(society.id);
                updateSocietyLocally(society.id, { has_reported: false });
            } catch (error) {
                console.error("Failed to unreport society:", error);
            }
        }
    };

    const onCreate = async (form) => {
        const newSociety = await handleCreate(form);
        setShowCreateModal(false);
        setSelectedSocietyId(newSociety.id);
    };
    const selectSociety = (society) => setSelectedSocietyId(society.id);
    const clearSelection = () => { setSelectedSocietyId(null); refresh(); };
    const onReportSuccess = (id) => updateSocietyLocally(id, { has_reported: true });

    return { view, setView, selectedSocietyId, selectSociety, clearSelection, showCreateModal, setShowCreateModal, reportingSociety, setReportingSociety, societies, loading, onCreate, onReportSuccess, handleUnreport };
}

const PAGE_SIZE = 12;

function MySocietiesView({ setView, onSelect, onCreateClick, societies, onReport, onUnreport }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('subTab') || "member";

    const setActiveTab = (t) => setSearchParams(prev => { prev.set('subTab', t); return prev; }, { replace: true });

    const adminOf = societies.filter(s => s.is_admin);
    const memberOf = societies.filter(s => s.is_member && !s.is_admin);

    const adminPage = usePagination(adminOf, PAGE_SIZE);
    const memberPage = usePagination(memberOf, PAGE_SIZE);

    const common = { onSelect, onReport, onUnreport, hideTitle: true };
    const tabs = [
        { id: "member", label: "My Memberships", content: <SocietySection {...common} title="My Memberships" items={memberPage.currentItems} type="member" onAction={() => setView("all")} allSocieties={societies} pagination={{ currentPage: memberPage.currentPage, totalPages: memberPage.totalPages, onPageChange: memberPage.setPage }} /> },
        { id: "admin", label: "Managed By Me", content: <SocietySection {...common} title="Managed Societies" items={adminPage.currentItems} type="admin" onAction={onCreateClick} pagination={{ currentPage: adminPage.currentPage, totalPages: adminPage.totalPages, onPageChange: adminPage.setPage }} /> }
    ];

    return (
        <div className={styles.container}>
            <PageHeader title="Societies" subtitle="Your communities at King's College London" />
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            <BackToTop />
        </div>
    );
}
