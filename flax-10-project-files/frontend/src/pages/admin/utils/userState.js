/*
 * User state helpers for admin actions.
 */

function updateUser(users, userId, changes) {
  return users.map((user) => (user.id === userId ? { ...user, ...changes } : user));
}

export function banUserState(users, userId, reason) {
  return updateUser(users, userId, { ban_reason: reason, is_active: false });
}

export function unbanUserState(users, userId) {
  return updateUser(users, userId, { ban_reason: "", is_active: true });
}
