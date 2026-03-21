/*
<<<<<<< HEAD
 * Auth API helpers for login, registration, and logout.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function jsonPost(url, body, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Token ${token}`;
  return fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
=======
 * Handles register, login, and logout for unauthenticated requests.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

function jsonPost(url, body, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Token ${token}`;
  return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
}

export const authService = {
  async register(userData) {
    const response = await jsonPost(`${API_BASE_URL}/auth/register/`, userData);
    return { response, data: await response.json() };
  },

  async login(userCredentials) {
    const response = await jsonPost(`${API_BASE_URL}/auth/login/`, userCredentials);
    return { response, data: await response.json() };
  },

  async logout() {
<<<<<<< HEAD
    const token = localStorage.getItem("token");
=======
    const token = localStorage.getItem('token');
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
    const response = await jsonPost(`${API_BASE_URL}/auth/logout/`, {}, token);
    return { response, data: await response.json() };
  },
};
