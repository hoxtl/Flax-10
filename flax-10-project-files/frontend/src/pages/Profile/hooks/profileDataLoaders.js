/*
 * Async data loaders for profile, events, and tasks.
 */
import { fetchTasks } from "../../../api/taskApi";
import { getAnotherUserProfile, getUserProfile } from "../../../api/userApi";
import { getEvents } from "../../../api/eventApi";

export async function loadProfile(userId) {
  return userId ? getAnotherUserProfile(userId) : getUserProfile();
}

export async function tryLoadProfile(setProfileData, setLoading, userId, isPolling = false) {
  try {
    setProfileData(await loadProfile(userId));
  } catch {}
  if (!isPolling) setLoading(false);
}

export async function tryLoadEvents(setAllEvents, userId) {
  try {
    const params = userId ? { user_id: userId } : {};
    setAllEvents((await getEvents(params)) || []);
  } catch {}
}

export async function loadTaskCount(setTaskCount) {
  try {
    const data = await fetchTasks();
    const list = Array.isArray(data) ? data : data?.results || [];
    setTaskCount(list.filter((task) => !task.completed).length);
  } catch {
    setTaskCount(0);
  }
}
