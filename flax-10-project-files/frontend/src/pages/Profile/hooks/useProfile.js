import { useState, useEffect } from "react";
import { getUserProfile, getAnotherUserProfile } from "../../../api/userService";
import { getEvents } from "../../../api/eventApi";
import { getFilteredEvents, getUpcomingCount } from "../utils/profileHelpers";

async function tryLoadProfile(setProfileData, setLoading, userId) {
  try {
    const data = userId ? await getAnotherUserProfile(userId) : await getUserProfile();
    setProfileData(data);
  } catch (e) {
    console.error('Failed to load profile:', e);
  } finally {
    setLoading(false);
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
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const reload = () => tryLoadProfile(setProfileData, setLoading, userId);
  useEffect(() => { reload(); }, [userId]);
  return { profileData, loading, reload };
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
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  return {
    showModules, setShowModules,
    showTasks, setShowTasks,
    showEvents, setShowEvents,
    showEditProfile, setShowEditProfile,
    showFollowers, setShowFollowers,
    showFollowing, setShowFollowing,
  };
}

export function useProfileState(userId) {
  const { profileData, loading, reload } = useProfileData(userId);
  const eventsState = useEventsData(userId);
  const modalState = useModalState();
  const handleSaveProfile = async () => {
    await reload();
  };
  return { profileData, loading, handleSaveProfile, ...eventsState, ...modalState };
}

export function useProfileBodyData(state) {
  const { profileData, allEvents, eventRange } = state;
  const modules = profileData?.modules || [];
  const filteredEvents = getFilteredEvents(allEvents, eventRange);
  const upcomingEventCount = getUpcomingCount(allEvents);
  return { modules, filteredEvents, upcomingEventCount };
}

export function useProfileContent(state) {
  const { profileData, setShowModules, setShowTasks, setShowEvents, setShowEditProfile, setShowFollowers, setShowFollowing } = state;
  const handlers = {
    onModulesClick: () => setShowModules(true),
    onTasksClick: () => setShowTasks(true),
    onEventsClick: () => setShowEvents(true),
    onEditProfile: () => setShowEditProfile(true),
    onFollowersClick: () => setShowFollowers(true),
    onFollowingClick: () => setShowFollowing(true),
  };
  return { profileData, handlers };
}