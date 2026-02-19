import { useState } from 'react';
import styles from './TimerPage.module.css';
import { useTimerContext } from '../context/TimerContext';
import { useNotificationPermission } from '../hooks/timerUtils';
import { MainSection, PopupSection } from '../components/Timer/WrapperComponents';

function NotificationPrompt({ permission, request }) {
  if (permission !== 'default') return null;
  return <button onClick={request} className={styles.notificationBtn}>Enable Notifications</button>;
}

export default function TimerPage() {
  const timerData = useTimerContext();
  const [showHistory, setShowHistory] = useState(false);
  const { permission, request } = useNotificationPermission();
  return (
    <div className={styles.container}>
      <NotificationPrompt permission={permission} request={request} />
      <MainSection t={timerData} onOpenHistory={() => setShowHistory(true)} />
      <PopupSection t={timerData} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} />
    </div>
  );
}