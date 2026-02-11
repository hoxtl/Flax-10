import styles from './TimerPage.module.css';
import { useTimerLogic } from '../hooks/useTimerLogic';
import { MainSection, PopupSection } from '../components/Timer/WrapperComponents';

export default function TimerPage() {
    const timerData = useTimerLogic();

    return (
        <div className={styles.container}>
            <MainSection t={timerData} />
            <PopupSection t={timerData} />
        </div>
    );
}
