/**
 * Profile page state composition hooks.
 */

import { getFilteredEvents, getUpcomingCount } from "../utils/profileHelpers";
import { useEventsData, useModalState, useProfileData, useTaskCountData } from "./useProfileStatePieces";

function buildProfileHandlers(state) {
  return {
    reload: state.reload,
    setOptimisticShare: state.setOptimisticShare,
    onModulesClick: () => state.setShowModules(true),
    onTasksClick: () => state.setShowTasks(true),
    onEventsClick: () => state.setShowEvents(true),
    onEditProfile: () => state.setShowEditProfile(true),
    onSharedWithClick: () => state.setShowSharedWith(true),
    onSharedByClick: () => state.setShowSharedBy(true),
  };
}

export function useProfileState(userId) {
  const profileState = useProfileData(userId);
  const eventsState = useEventsData(userId);
  const modalState = useModalState();
  const taskState = useTaskCountData(userId);
  const handleSaveProfile = () => profileState.reload();
  return { viewedUserId: userId, handleSaveProfile, ...profileState, ...eventsState, ...modalState, ...taskState };
}

export function useProfileBodyData(state) {
  const modules = state.profileData?.modules || [];
  const filteredEvents = getFilteredEvents(state.allEvents, state.eventRange);
  const upcomingEventCount = getUpcomingCount(state.allEvents);
  return { modules, filteredEvents, upcomingEventCount };
}

export function useProfileContent(state) {
  return { profileData: state.profileData, handlers: buildProfileHandlers(state) };
}
