/*
 * Notification permission call to action.
 */

import styles from '../TimerPage.module.css';
import PrimaryButton from '../../../components/Common/PrimaryButton/PrimaryButton';

export function NotificationPrompt({ permission, request }) {
  if (permission !== 'default') return null;

  return (
    <PrimaryButton onClick={request} className={styles.notificationBtn} pill>
      Enable Notifications
    </PrimaryButton>
  );
}
