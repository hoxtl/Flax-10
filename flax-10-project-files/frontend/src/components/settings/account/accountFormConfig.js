/*
 * Static account-form configuration values.
 */

export const YEAR_OPTIONS = ["Foundation", "Year 1", "Year 2", "Year 3", "Year 4"].map((year) => ({
  value: year,
  label: year,
}));

export function getInitialAccountData(user) {
  return {
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    year: user?.year || "",
  };
}

export function hasAccountChanges(formData, initialFormData) {
  return ["firstName", "lastName", "email", "year"].some((key) => formData[key] !== initialFormData[key]);
}
