/*
 * Admin page constants.
 */

export const ADMIN_LIST_PAGE_SIZE = 10;

export const USER_LIST_PAGE_SIZE = 10;

export const USER_FILTER_GROUPS = {
  roles: [
    { value: "student", label: "Student" },
    { value: "teacher", label: "Teacher" },
  ],
  staff: [{ value: "staff", label: "Staff" }],
  status: [
    { value: "active", label: "Active" },
    { value: "banned", label: "Banned" },
  ],
};

export const EMPTY_MESSAGES = {
  courseChanges: "No course switch requests",
  ratifications: "No societies awaiting ratification",
  reports: "No reported societies",
  teachers: "No teacher switch requests",
};
