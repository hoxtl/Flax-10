import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { useChangeTracker } from "../../components/Society/hooks/useChangeTracker";
import { useSocietyDetail } from "../../components/Society/hooks/useSocietyDetail";
import { useSocietySubscription } from "../../components/Society/hooks/useSocietySubscription";
import { useUnreportSociety } from "../../components/Society/hooks/useUnreportSociety";
import { scrollContentToTop } from "./SocietyDetailPageUtils";
import {
  wrapAddAnnouncement,
  wrapAddEvent,
  wrapDeleteAnnouncement,
  wrapDeleteEvent,
  wrapUpdateAnnouncement,
  wrapUpdateEvent,
} from "./SocietyDetailPageUtils";

function usePageState(initialTab, location) {
  const [params, setParams] = useSearchParams();
  const activeTab = params.get("tab") || initialTab || location.state?.activeTab || "calendar";
  const focusId = params.get("announcementId") || location.state?.announcementId;

  const setTab = (tab, announcementId = null) => {
    setParams((prev) => {
      prev.set("tab", tab);
      if (announcementId) prev.set("announcementId", announcementId);
      else prev.delete("announcementId");
      return prev;
    }, { replace: true });
  };

  return { activeTab, focusAnnouncementId: focusId, handleTabChange: setTab };
}

function useModalState() {
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  return {
    editingAnnouncement,
    setEditingAnnouncement,
    galleryOpen,
    setGalleryOpen,
    editMode,
    setEditMode,
    showCoverModal,
    setShowCoverModal,
    showSettings,
    setShowSettings,
    showReportModal,
    setShowReportModal,
    showMembersModal,
    setShowMembersModal,
  };
}

function buildEventHandlers(hookData, editMode, trackEvent) {
  const { addEvent, updateEvent, deleteEvent, addException } = hookData;
  return {
    addEvent: wrapAddEvent(addEvent, editMode, trackEvent),
    updateEvent: wrapUpdateEvent(updateEvent, editMode, trackEvent),
    deleteEvent: wrapDeleteEvent(deleteEvent, editMode, trackEvent),
    addException: (eventId, date) => addException(eventId, date, editMode),
  };
}

function buildAnnouncementHandlers(hookData, editMode, trackAnnouncement) {
  const { addAnnouncement, updateAnnouncement, deleteAnnouncement } = hookData;
  return {
    addAnnouncement: wrapAddAnnouncement(addAnnouncement, editMode, trackAnnouncement),
    updateAnnouncement: wrapUpdateAnnouncement(updateAnnouncement, editMode, trackAnnouncement),
    deleteAnnouncement: wrapDeleteAnnouncement(deleteAnnouncement, editMode, trackAnnouncement),
  };
}

function buildHandlers(hookData, editMode, changeTracker) {
  const { trackEvent, trackAnnouncement } = changeTracker;
  return {
    ...hookData,
    ...buildEventHandlers(hookData, editMode, trackEvent),
    ...buildAnnouncementHandlers(hookData, editMode, trackAnnouncement),
    onAddTag: hookData.addTag,
    onDeleteTag: hookData.deleteTag,
    onUpdateTag: hookData.updateTag,
  };
}

export function useSocietyPageData(societyId, initialTab, onMembershipChange) {
  const hookData = useSocietyDetail(societyId, onMembershipChange);
  const { society, updateLocalSociety } = hookData;
  const location = useLocation();
  const page = usePageState(initialTab, location);
  const modals = useModalState();
  const handleUnreport = useUnreportSociety((id, fields) => updateLocalSociety(fields));
  const subscription = useSocietySubscription(societyId, society, updateLocalSociety);
  const tracker = useChangeTracker();
  const handlers = buildHandlers(hookData, modals.editMode, tracker);
  return { ...handlers, page, modals, handleUnreport, subscription, tracker };
}

export function useSocietyInit(activeTabState) {
  useEffect(() => {
    scrollContentToTop();
    if (activeTabState) window.history.replaceState({}, document.title);
  }, [activeTabState]);
}
