const WELCOME_SEEN_KEY = "flax_welcome_seen_v1";

const USER_FIELDS = ["first_name", "last_name", "username", "email", "password"];

export const validatePasswords = (password, password2) => {
  if (password !== password2) return "The two passwords do not match";
  return null;
};

function getFieldError(data, field) {
  if (!data[field]) return null;
  return Array.isArray(data[field]) ? data[field][0] : data[field];
}

export const getErrorMessage = (data) => {
  const field = USER_FIELDS.find(f => getFieldError(data, f));
  return field ? getFieldError(data, field) : "Unable to register the account, try again...";
};

export const saveUserData = (token, user) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.removeItem(WELCOME_SEEN_KEY);
  window.dispatchEvent(new Event("auth-changed"));
};

export const clearUserData = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem(WELCOME_SEEN_KEY);
  window.dispatchEvent(new Event("auth-changed"));
};