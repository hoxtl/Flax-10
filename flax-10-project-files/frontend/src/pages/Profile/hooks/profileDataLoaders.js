<<<<<<< HEAD
/*
 * Async data loaders for profile, events, and tasks.
 */

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import { fetchTasks } from "../../../api/taskApi";
import { getAnotherUserProfile, getUserProfile } from "../../../api/userApi";
import { getEvents } from "../../../api/eventApi";

export async function loadProfile(userId) {
  return userId ? getAnotherUserProfile(userId) : getUserProfile();
}

export async function tryLoadProfile(setProfileData, setLoading, userId, isPolling = false) {
  try {
    setProfileData(await loadProfile(userId));
<<<<<<< HEAD
  } catch {}
=======
  } catch (error) {
    console.error("Failed to load profile:", error);
  }
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
  if (!isPolling) setLoading(false);
}

export async function tryLoadEvents(setAllEvents, userId) {
  try {
    const params = userId ? { user_id: userId } : {};
    setAllEvents((await getEvents(params)) || []);
<<<<<<< HEAD
  } catch {}
=======
  } catch (error) {
    console.error("Failed to load events:", error);
  }
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

export async function loadTaskCount(setTaskCount) {
  try {
    const data = await fetchTasks();
    const list = Array.isArray(data) ? data : data?.results || [];
    setTaskCount(list.filter((task) => !task.completed).length);
<<<<<<< HEAD
  } catch {
=======
  } catch (error) {
    console.error("Failed to load task count:", error);
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    setTaskCount(0);
  }
}
