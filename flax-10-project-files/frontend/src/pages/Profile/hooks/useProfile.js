import { useState, useEffect } from "react";
import { fetchTasks } from "../../../api/taskApi";
import { getUserProfile, getAnotherUserProfile } from "../../../api/userApi";
import { getEvents } from "../../../api/eventApi";
import { getFilteredEvents, getUpcomingCount } from "../utils/profileHelpers";
import { useAuth } from "../../../context/AuthContext";

async function tryLoadProfile(setProfileData, setLoading, userId, isPolling = false) {
  try {
    const data = userId ? await getAnotherUserProfile(userId) : await getUserProfile();
    setProfileData(data);
  } catch (e) {
    console.error('Failed to load profile:', e);
  } finally {
    if (!isPolling) setLoading(false);
  }
}

async function tryLoadEvents(setAllEvents, userId) {
  try {
    const params = userId ? { user_id: userId } : {};
    const data = await getEvents(params);
    setAllEvents(data || []);
  } catch (e) {
    console.error('Failed to load events:', e);
  }
}

function useProfileData(userId) {
  const { profile: authProfile, loading: authLoading, refreshProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isSelf = !userId || (authProfile && String(authProfile.id) === String(userId));

  useEffect(() => {
    if (isSelf) {
      if (!authLoading) {
        // Pull a fresh server profile so share counters stay up-to-date
        // even when sharing is toggled from other pages.
        tryLoadProfile(setProfileData, setLoading, null, true);
      }
      return;
    }

    tryLoadProfile(setProfileData, setLoading, userId);
    const intervalId = setInterval(() => {
      tryLoadProfile(setProfileData, setLoading, userId, true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [userId, authProfile, authLoading, isSelf]);

  const reload = () => {
    if (isSelf) {
      refreshProfile();
      tryLoadProfile(setProfileData, setLoading, null, true);
    } else {
      tryLoadProfile(setProfileData, setLoading, userId);
    }
  };

  const setOptimisticShare = (isSharing) => {
    setProfileData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        is_sharing: isSharing,
      };
    });
  };

  const isRemoteStale = !isSelf && userId && (!profileData || String(profileData.id) !== String(userId));
  const resolvedProfileData = isSelf ? (profileData || authProfile) : profileData;
  const resolvedLoading = isSelf ? authLoading : (loading || isRemoteStale);
  return { profileData: resolvedProfileData, loading: resolvedLoading, reload, setOptimisticShare };
}

function useEventsData(userId) {
  const [allEvents, setAllEvents] = useState([]);
  const [eventRange, setEventRange] = useState('month');
  useEffect(() => { tryLoadEvents(setAllEvents, userId); }, [userId]);
  return { allEvents, eventRange, setEventRange };
}

function useModalState() {
  const [showModules, setShowModules] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSharedWith, setShowSharedWith] = useState(false);
  const [showSharedBy, setShowSharedBy] = useState(false);
  return {
    showModules, setShowModules,
    showTasks, setShowTasks,
    showEvents, setShowEvents,
    showEditProfile, setShowEditProfile,
    showSharedWith, setShowSharedWith,
    showSharedBy, setShowSharedBy,
  };
}

function useTaskCountData(userId) {
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (userId) return;

    fetchTasks()
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.results || [];
        setTaskCount(list.filter((task) => !task.completed).length);
      })
      .catch((e) => {
        console.error("Failed to load task count:", e);
        setTaskCount(0);
      });
  }, [userId]);

  return { taskCount: userId ? 0 : taskCount };
}

export function useProfileState(userId) {
  const { profileData, loading, reload, setOptimisticShare } = useProfileData(userId);
  const eventsState = useEventsData(userId);
  const modalState = useModalState();
  const taskState = useTaskCountData(userId);
  const handleSaveProfile = async () => {
    await reload();
  };
  return { viewedUserId: userId, profileData, loading, handleSaveProfile, reload, setOptimisticShare, ...eventsState, ...modalState, ...taskState };
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
