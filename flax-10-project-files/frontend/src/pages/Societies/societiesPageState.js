/*
 * societiesPageState centralizes societies page navigation and modal state.
 */
<<<<<<< HEAD

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSocieties } from "../../components/society/hooks/useSocieties";
import { useUnreportSociety } from "../../components/society/hooks/useUnreportSociety";
=======
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSocieties } from "../../components/Society/hooks/useSocieties";
import { useUnreportSociety } from "../../components/Society/hooks/useUnreportSociety";
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function useSocietiesPage() {
    const navigation = useSocietiesNavigation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reportingSociety, setReportingSociety] = useState(null);
    const societiesData = useSocieties();
    const handleUnreport = useUnreportSociety(societiesData.updateSocietyLocally);
    return buildPageState(navigation, societiesData, handleUnreport, {
        showCreateModal,
        setShowCreateModal,
        reportingSociety,
        setReportingSociety,
    });
}

function useSocietiesNavigation() {
    const [params, setParams] = useSearchParams();
    const updateParams = buildParamUpdater(setParams);
    return {
        view: params.get("tab") === "all" ? "all" : "my",
        selectedId: params.get("id"),
        setView: (view) => updateParams("tab", view),
        select: (id) => updateParams("id", id),
    };
}

function buildParamUpdater(setParams) {
    return (key, value) => setParams((prev) => {
        if (value) prev.set(key, value);
        else prev.delete(key);
        return prev;
    });
}

function buildPageState(navigation, societiesData, handleUnreport, modalState) {
    return {
        ...societiesData,
        ...modalState,
        view: navigation.view,
        setView: navigation.setView,
        selectedSocietyId: navigation.selectedId,
        selectSociety: navigation.select,
        clearSelection: () => navigation.select(null),
        handleUnreport,
        onCreate: async (form) => handleCreate(form, societiesData, navigation.select, modalState.setShowCreateModal),
        onReportSuccess: (id) => societiesData.updateSocietyLocally(id, { has_reported: true }),
    };
}

async function handleCreate(form, societiesData, selectSociety, setShowCreateModal) {
    const created = await societiesData.handleCreate(form);
    setShowCreateModal(false);
    selectSociety(created.id);
}
