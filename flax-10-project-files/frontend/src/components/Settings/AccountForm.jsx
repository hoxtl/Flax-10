/*
 * Account settings form entry point.
 */
<<<<<<< HEAD

=======
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)
import AccountFormContainer from "./account/AccountFormContainer";

export default function AccountForm({ user, onSave, isSaving }) {
  return <AccountFormContainer user={user} onSave={onSave} isSaving={isSaving} />;
}
