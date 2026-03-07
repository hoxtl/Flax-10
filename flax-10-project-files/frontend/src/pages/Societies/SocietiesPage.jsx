import { useState } from "react";
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

export default function SocietiesPage() {
    const state = useSocietiesPage();

    if (state.loading) return <div className={styles.container}>Loading...</div>;
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
    const [view, setView] = useState("my");
    const [selectedSocietyId, setSelectedSocietyId] = useState(null);
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

function MySocietiesView({ setView, onSelect, onCreateClick, societies, onReport, onUnreport }) {
    const [activeTab, setActiveTab] = useState("admin");
    const adminOf = societies.filter(s => s.is_admin);
    const memberOf = societies.filter(s => s.is_member && !s.is_admin);

    const common = { onSelect, onReport, onUnreport, hideTitle: true };
    const tabs = [
        { id: "admin", label: "Managed By Me", content: <SocietySection {...common} title="Managed Societies" items={adminOf} type="admin" onAction={onCreateClick} /> },
        { id: "member", label: "My Memberships", content: <SocietySection {...common} title="My Memberships" items={memberOf} type="member" onAction={() => setView("all")} allSocieties={societies} /> }
    ];

    return (
        <div className={styles.container}>
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    );
}