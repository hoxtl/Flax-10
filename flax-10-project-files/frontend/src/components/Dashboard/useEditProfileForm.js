/*
 * Edit profile form state and submission logic.
 */
import { useEffect, useState } from "react";
import { updateUserProfile } from "../../api/userApi";
import { getResolvedUserPhoto } from "../../utils/tutorPhotoFallback";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

function resolveProfilePhoto(user) {
  return getResolvedUserPhoto(user, {
    allowGeneric: false,
    seed: user?.username || user?.id || user?.name,
  });
}

function buildFormData(username, bio, profilePhoto, removePhoto) {
  const formData = new FormData();
  formData.append("username", username);
  formData.append("bio", bio);
  if (profilePhoto) formData.append("profile_photo", profilePhoto);
  else if (removePhoto) formData.append("remove_photo", "true");
  return formData;
}

async function fetchUsernameAvailable(username, token) {
  const response = await fetch(`${API_BASE_URL}/check-username/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Token ${token}` },
    body: JSON.stringify({ username }),
  });
  const data = await response.json();
  return data.available;
}

async function checkUsernameAvailable(username, currentUsername) {
  if (username === currentUsername) return true;

  try {
    return await fetchUsernameAvailable(username, localStorage.getItem("token"));
  } catch {
    return false;
  }
}

async function submitProfileUpdate(formData, onSave, setError, onSaved) {
  try {
    await updateUserProfile(formData);
    await onSave?.();
    onSaved?.();
  } catch (error) {
    setError(error.response?.data?.error || "Failed to update profile");
  }
}

function useProfileFormState(user) {
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(resolveProfilePhoto(user));
  const [removePhoto, setRemovePhoto] = useState(false);
  return { username, setUsername, bio, setBio, profilePhoto, setProfilePhoto, previewUrl, setPreviewUrl, removePhoto, setRemovePhoto };
}

function useProfileFormMeta() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saveSignal, setSaveSignal] = useState(0);
  return { loading, setLoading, error, setError, saveSignal, setSaveSignal };
}

function useSyncProfileFormToUser(user, setters) {
  const { setUsername, setBio, setProfilePhoto, setPreviewUrl, setRemovePhoto, setError } = setters;
  useEffect(() => {
    setUsername(user?.username || "");
    setBio(user?.bio || "");
    setProfilePhoto(null);
    setPreviewUrl(resolveProfilePhoto(user));
    setRemovePhoto(false);
    setError("");
  }, [user, setUsername, setBio, setProfilePhoto, setPreviewUrl, setRemovePhoto, setError]);
}

export function useEditProfileForm(user) {
  const formState = useProfileFormState(user);
  const meta = useProfileFormMeta();
  useSyncProfileFormToUser(user, { ...formState, setError: meta.setError });
  return { ...formState, ...meta };
}

function validateUsername(username, setError, setLoading) {
  if (username.length < 3) {
    setError("Username must be at least 3 characters long");
    setLoading(false);
    return false;
  }
  return true;
}

async function validateUsernameAvailability(username, currentUsername, setError, setLoading) {
  const isAvailable = await checkUsernameAvailable(username, currentUsername);
  if (!isAvailable) {
    setError("Username is already taken");
    setLoading(false);
    return false;
  }
  return true;
}

export function buildEditProfileSubmitHandler(form, user, onSave) {
  const { username, bio, profilePhoto, removePhoto, setLoading, setError, setSaveSignal } = form;
  return async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    if (!validateUsername(username, setError, setLoading)) return;
    if (!(await validateUsernameAvailability(username, user?.username, setError, setLoading))) return;
    await submitProfileUpdate(buildFormData(username, bio, profilePhoto, removePhoto), onSave, setError, () => setSaveSignal((count) => count + 1));
    setLoading(false);
  };
}
