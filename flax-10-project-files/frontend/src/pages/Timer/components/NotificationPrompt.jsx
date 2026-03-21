/*
 * Notification permission call to action.
 */

import styles from '../TimerPage.module.css';
<<<<<<< HEAD
import PrimaryButton from '../../../components/common/primary_button/PrimaryButton';
=======
import PrimaryButton from '../../../components/common/PrimaryButton/PrimaryButton';
>>>>>>> cfe262a95 (Merge branch 'main' into devop/deploymentConfiguration)

export function NotificationPrompt({ permission, request }) {
  if (permission !== 'default') return null;

  return (
    <PrimaryButton onClick={request} className={styles.notificationBtn} pill>
      Enable Notifications
    </PrimaryButton>
  );
}
