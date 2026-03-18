import styles from '../../pages/Timer/TimerPage.module.css';
import FocusAnimation from './FocusAnimation';
import { TimerDisplay } from './TimerComponents';

export default function TimerCircle({ t, onPrimaryStart }) {
    const radius = 136;
    const circ = 2 * Math.PI * radius;
    const total = (t.mode === 'work' ? t.workTime : t.breakTime) * 60;
    const ratio = total > 0 ? Math.max(0, t.timeLeft / total) : 1;
    const dash = ratio * circ;
    const isOvertime = t.isOvertime || t.isBreakOvertime;
    const color = isOvertime ? '#f59e0b' : t.mode === 'break' ? 'var(--sage)' : 'var(--focus-accent, var(--primary))';
    const label = !t.isActive ? 'Start' : (t.isPaused ? 'Resume' : 'Pause');
    const isRunning = t.isActive && !t.isPaused;
    const icon = !t.isActive ? '▶' : (t.isPaused ? '▶' : '❚❚');
    const deepFocusMode = t.workTime >= 60;

    const action = !t.isActive
        ? () => { if (onPrimaryStart) { onPrimaryStart(); return; } t.setIsActive(true); }
        : t.togglePause;

    const wrapClass = `${styles.timerCircleWrap} ${isRunning ? styles.timerCircleActive : ''} ${isRunning && deepFocusMode ? styles.timerCircleDeep : ''}`;
    const activeClass = isRunning ? styles.timerProgressActive : '';

    return (
        <div className={wrapClass}>
            <svg className={styles.timerRingSvg} viewBox="0 0 320 320" aria-hidden="true">
                <circle
                    cx="160" cy="160" r={radius}
                    fill="none"
                    stroke="color-mix(in srgb, var(--focus-accent, var(--primary)) 12%, var(--border))"
                    strokeWidth="4"
                />
                <circle
                    cx="160" cy="160" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={circ * 0.25}
                    className={activeClass}
                    style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s ease' }}
                />
            </svg>
            <div className={styles.timerCircleContent}>
                <div className={styles.timerCircleAnimClip}>
                    <FocusAnimation progress={t.progress / 100} mode={t.mode} isActive={t.isActive} />
                </div>
                <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={isOvertime} />
                <button
                    className={`${styles.timerCirclePrimaryBtn} ${isRunning ? styles.timerCirclePrimaryBtnRunning : ''}`}
                    onClick={action}
                >
                    <span className={styles.timerPrimaryIcon}>{icon}</span>
                    <span className={styles.timerPrimaryLabel}>{label}</span>
                </button>
                {(t.isActive || t.isPaused) && (
                    <div className={styles.timerCircleSecondaryBtns}>
                        <button className={styles.timerCircleSecondaryBtn} onClick={t.resetTimer}>Reset</button>
                        <button className={styles.timerCircleSecondaryBtn} onClick={() => t.setModal('endEarly')}>End Early</button>
                    </div>
                )}
            </div>
        </div>
    );
}

export function TimerRing({ t }) {
    const radius = 90;
    const circ = 2 * Math.PI * radius;
    const total = (t.mode === 'work' ? t.workTime : t.breakTime) * 60;
    const ratio = total > 0 ? Math.max(0, t.timeLeft / total) : 1;
    const dash = ratio * circ;
    const isOvertime = t.isOvertime || t.isBreakOvertime;
    const color = isOvertime ? '#f59e0b' : t.mode === 'break' ? 'var(--sage)' : 'var(--primary)';
    const activeClass = t.isActive && !t.isPaused ? styles.timerProgressActive : '';

    return (
        <div className={styles.timerRingWrap}>
            <svg className={styles.timerRingSvg} viewBox="0 0 220 220" aria-hidden="true">
                <circle cx="110" cy="110" r={radius} fill="none" stroke="var(--border)" strokeWidth="3" />
                <circle
                    cx="110" cy="110" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={circ * 0.25}
                    className={activeClass}
                    style={{ transition: 'stroke-dasharray 1s linear, stroke 0.3s ease' }}
                />
            </svg>
            <div className={styles.timerRingContent}>
                <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={isOvertime} />
            </div>
        </div>
    );
}
