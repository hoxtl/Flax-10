/*
 * Account settings form entry point.
 */

import AccountFormContainer from "../account/AccountFormContainer";

export default function AccountForm({ user, onSave, isSaving }) {
  return <AccountFormContainer user={user} onSave={onSave} isSaving={isSaving} />;
}
