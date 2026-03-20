import { getFilteredEvents, getUpcomingCount } from "../utils/profileHelpers";
import {
  useEventsData,
  useModalState,
  useProfileData,
  useTaskCountData,
} from "./useProfileStatePieces";

export function useProfileState(userId) {
  const { profileData, loading, reload, setOptimisticShare } = useProfileData(userId);
  const eventsState = useEventsData(userId);
  const modalState = useModalState();
  const taskState = useTaskCountData(userId);
  const handleSaveProfile = async () => reload();
  return {
    viewedUserId: userId,
    profileData,
    loading,
    handleSaveProfile,
    reload,
    setOptimisticShare,
    ...eventsState,
    ...modalState,
    ...taskState,
  };
}

export function useProfileBodyData(state) {
  const { profileData, allEvents, eventRange } = state;
  const modules = profileData?.modules || [];
  const filteredEvents = getFilteredEvents(allEvents, eventRange);
  const upcomingEventCount = getUpcomingCount(allEvents);
  return { modules, filteredEvents, upcomingEventCount };
}

export function useProfileContent(state) {
  const { profileData, reload, setOptimisticShare, setShowModules, setShowTasks, setShowEvents, setShowEditProfile, setShowSharedWith, setShowSharedBy } = state;
  const handlers = {
    reload,
    setOptimisticShare,
    onModulesClick: () => setShowModules(true),
    onTasksClick: () => setShowTasks(true),
    onEventsClick: () => setShowEvents(true),
    onEditProfile: () => setShowEditProfile(true),
    onSharedWithClick: () => setShowSharedWith(true),
    onSharedByClick: () => setShowSharedBy(true),
  };
  return { profileData, handlers };
}
