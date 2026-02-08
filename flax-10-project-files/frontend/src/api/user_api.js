import { fetchApi } from "./client";

export async function getUserProfile() {
  return fetchApi(`/user/profile/`);
}

export async function updateUserProfile(data) {
  return fetchApi(`/user/profile/`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changePassword(data) {
  return fetchApi(`/user/change-password/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}