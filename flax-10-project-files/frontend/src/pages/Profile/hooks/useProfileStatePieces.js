import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { loadTaskCount, tryLoadEvents, tryLoadProfile } from "./profileDataLoaders";

function useOwnProfileRefresh(isSelf, authLoading, setProfileData, setLoading) {
  useEffect(() => {
    if (!isSelf || authLoading) return;
    tryLoadProfile(setProfileData, setLoading, null, true);
  }, [authLoading, isSelf, setLoading, setProfileData]);
}

function useRemoteProfilePolling(isSelf, userId, setProfileData, setLoading) {
  useEffect(() => {
    if (isSelf) return undefined;
    tryLoadProfile(setProfileData, setLoading, userId);
    const intervalId = setInterval(() => {
      tryLoadProfile(setProfileData, setLoading, userId, true);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [isSelf, setLoading, setProfileData, userId]);
}

function useResolvedProfileState(userId, authProfile, authLoading, profileData, loading) {
  const isSelf = !userId || String(authProfile?.id) === String(userId);
  const isRemoteStale = !isSelf && userId && String(profileData?.id) !== String(userId);
  const resolvedProfileData = isSelf ? profileData || authProfile : profileData;
  const resolvedLoading = isSelf ? authLoading : loading || isRemoteStale;
  return { isSelf, resolvedLoading, resolvedProfileData };
}

function buildReload(isSelf, refreshProfile, setProfileData, setLoading, userId) {
  return () => {
    if (isSelf) refreshProfile();
    const targetUserId = isSelf ? null : userId;
    return tryLoadProfile(setProfileData, setLoading, targetUserId, isSelf);
  };
}

export function useProfileData(userId) {
  const { profile: authProfile, loading: authLoading, refreshProfile } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const resolved = useResolvedProfileState(userId, authProfile, authLoading, profileData, loading);
  useOwnProfileRefresh(resolved.isSelf, authLoading, setProfileData, setLoading);
  useRemoteProfilePolling(resolved.isSelf, userId, setProfileData, setLoading);
  const reload = buildReload(resolved.isSelf, refreshProfile, setProfileData, setLoading, userId);
  const setOptimisticShare = (isSharing) => setProfileData((prev) => (prev ? { ...prev, is_sharing: isSharing } : prev));
  return { loading: resolved.resolvedLoading, profileData: resolved.resolvedProfileData, reload, setOptimisticShare };
}

export function useEventsData(userId) {
  const [allEvents, setAllEvents] = useState([]);
  const [eventRange, setEventRange] = useState("month");

  useEffect(() => {
    tryLoadEvents(setAllEvents, userId);
  }, [userId]);

  return { allEvents, eventRange, setEventRange };
}

export function useModalState() {
  const [showModules, setShowModules] = useState(false), [showTasks, setShowTasks] = useState(false);
  const [showEvents, setShowEvents] = useState(false), [showEditProfile, setShowEditProfile] = useState(false);
  const [showSharedWith, setShowSharedWith] = useState(false), [showSharedBy, setShowSharedBy] = useState(false);
  return {
    setShowEditProfile, setShowEvents, setShowModules, setShowSharedBy, setShowSharedWith, setShowTasks,
    showEditProfile, showEvents, showModules, showSharedBy, showSharedWith, showTasks,
  };
}

export function useTaskCountData(userId) {
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    if (userId) return;
    loadTaskCount(setTaskCount);
  }, [userId]);

  return { taskCount: userId ? 0 : taskCount };
}
