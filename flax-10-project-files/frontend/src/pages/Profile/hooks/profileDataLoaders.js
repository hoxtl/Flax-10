import { fetchTasks } from "../../../api/taskService";
import { getAnotherUserProfile, getUserProfile } from "../../../api/userService";
import { getEvents } from "../../../api/eventApi";

export async function loadProfile(userId) {
  return userId ? getAnotherUserProfile(userId) : getUserProfile();
}

export async function tryLoadProfile(setProfileData, setLoading, userId, isPolling = false) {
  try {
    setProfileData(await loadProfile(userId));
  } catch (error) {
    console.error("Failed to load profile:", error);
  }
  if (!isPolling) setLoading(false);
}

export async function tryLoadEvents(setAllEvents, userId) {
  try {
    const params = userId ? { user_id: userId } : {};
    setAllEvents((await getEvents(params)) || []);
  } catch (error) {
    console.error("Failed to load events:", error);
  }
}

export async function loadTaskCount(setTaskCount) {
  try {
    const data = await fetchTasks();
    const list = Array.isArray(data) ? data : data?.results || [];
    setTaskCount(list.filter((task) => !task.completed).length);
  } catch (error) {
    console.error("Failed to load task count:", error);
    setTaskCount(0);
  }
}
