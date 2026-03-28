/*
 * societiesPageState centralizes societies page navigation and modal state.
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSocieties } from "../../../components/society/hooks/useSocieties";
import { useUnreportSociety } from "../../../components/society/hooks/useUnreportSociety";
import { useToast } from "../../../context/ToastContext";

export function useSocietiesPage() {
    const navigation = useSocietiesNavigation();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [reportingSociety, setReportingSociety] = useState(null);
    const societiesData = useSocieties();
    const showToast = useToast();
    const handleUnreport = useUnreportSociety(societiesData.updateSocietyLocally);
    return buildPageState(navigation, societiesData, handleUnreport, {
        showCreateModal,
        setShowCreateModal,
        reportingSociety,
        setReportingSociety,
        showToast,
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
        onCreate: async (form) => handleCreate(form, societiesData, navigation.select, modalState.setShowCreateModal, modalState.showToast),
        onReportSuccess: (id) => societiesData.updateSocietyLocally(id, { has_reported: true }),
    };
}

function buildCreateToastMessage(created) {
    const failures = created?.create_meta?.collaboratorFailures || [];
    const ratificationError = created?.create_meta?.ratificationError;
    if (failures.length && ratificationError) {
        return `${created.name} was created, but some collaborators and the ratification request still need attention.`;
    }
    if (failures.length) {
        return `${created.name} was created, but some collaborators could not be added yet.`;
    }
    if (ratificationError) {
        return `${created.name} was created, but the ratification request still needs to be sent.`;
    }
    return `${created.name} created successfully.`;
}

async function handleCreate(form, societiesData, selectSociety, setShowCreateModal, showToast) {
    const created = await societiesData.handleCreate(form);
    setShowCreateModal(false);
    selectSociety(created.id);
    showToast?.(buildCreateToastMessage(created), {
        variant: created?.create_meta?.collaboratorFailures?.length || created?.create_meta?.ratificationError ? "info" : "success",
    });
}
