/**
 * Utility helper functions for user authentication
 */

const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";

export const validatePasswords = (password, password2) => {
  if (password !== password2) {
    return "The two passwords do not match";
  }
  return null;
};

export const getErrorMessage = (data) => {
  const userFields = ["first_name", "last_name", "username", "email", "password"];

  for (const field of userFields) {
    if (data[field]) {
      return Array.isArray(data[field]) ? data[field][0] : data[field];
    }
  }
  return "Unable to register the account, try again...";
};

export const saveUserData = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.removeItem(WELCOME_SEEN_KEY);
  window.location.reload();
};

export const clearUserData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem(WELCOME_SEEN_KEY); 
  window.location.reload();
};
