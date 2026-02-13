import { useState } from 'react';
import styles from './TimerPage.module.css';
import { useTimerLogic } from '../hooks/useTimerLogic';
import { MainSection, PopupSection } from '../components/Timer/WrapperComponents';

export default function TimerPage() {
    const timerData = useTimerLogic();
    const [showHistory, setShowHistory] = useState(false);

    return (
        <div className={styles.container}>
            <MainSection t={timerData} onOpenHistory={() => setShowHistory(true)} />
            <PopupSection t={timerData} showHistory={showHistory} onCloseHistory={() => setShowHistory(false)} />
        </div>
    );
}
