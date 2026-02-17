import { useState } from 'react';
import styles from './TimerPage.module.css';
import { useTimerLogic } from '../components/Timer/hooks/useTimerLogic';
import { useNotificationPermission } from '../components/Timer/utils/timerUtils';
import { MainSection, PopupSection } from '../components/Timer/WrapperComponents';

export default function TimerPage() {
    const timerData = useTimerLogic();
    const [showHistory, setShowHistory] = useState(false);

    const { permission, request } = useNotificationPermission();

    return (
        <div className={styles.container}>
            {permission === 'default' && (
                <button onClick={request} className={styles.notificationBtn}>
                    Enable Notifications
                </button>
            )}
            <MainSection t={timerData} onOpenHistory={() => setShowHistory(true)} />
            <PopupSection t={timerData} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} />
        </div>
    );
}
