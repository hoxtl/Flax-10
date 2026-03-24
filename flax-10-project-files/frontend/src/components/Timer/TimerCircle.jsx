/*
 * Circular timer views.
 */

import styles from '../../pages/Timer/TimerPage.module.css';
import FocusAnimation from './FocusAnimation';
import { TimerDisplay } from './TimerComponents';

function getRingState(t, radius, activeColor) {
  const total = (t.mode === 'work' ? t.workTime : t.breakTime) * 60;
  const ratio = total > 0 ? Math.max(0, t.timeLeft / total) : 1;
  const circumference = 2 * Math.PI * radius;
  const isOvertime = t.isOvertime || t.isBreakOvertime;
  const color = isOvertime ? 'var(--warning)' : t.mode === 'break' ? 'var(--sage)' : activeColor;
  return { circumference, dash: ratio * circumference, isOvertime, color };
}

function buildGuideDashPattern(strokeWidth) {
  const width = Number(strokeWidth) || 4;
  const dash = Math.max(3, Math.round(width));
  return `${dash} ${Math.max(9, dash * 2.8)}`;
}

function TimerRingSvg({ cx, cy, radius, ringState, trackColor, strokeWidth, activeClass, isRunning }) {
  const guideClassName = `${styles.timerProgressGuide} ${isRunning ? styles.timerProgressGuideActive : ''}`.trim();

  return (
    <svg className={styles.timerRingSvg} viewBox={`0 0 ${cx * 2} ${cy * 2}`} aria-hidden="true">
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={ringState.color} strokeWidth={Math.max(1.5, (Number(strokeWidth) || 4) - 1.1)} strokeLinecap="round" strokeDasharray={buildGuideDashPattern(strokeWidth)} className={guideClassName} />
      <circle cx={cx} cy={cy} r={radius} fill="none" stroke={ringState.color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${ringState.dash} ${ringState.circumference - ringState.dash}`} strokeDashoffset={ringState.circumference * 0.25} className={`${activeClass} ${styles.timerProgressRing}`} />
    </svg>
  );
}

function CirclePrimaryButton({ isRunning, action, label, icon }) {
  const className = `${styles.timerCirclePrimaryBtn} ${isRunning ? styles.timerCirclePrimaryBtnRunning : ''}`;

  return (
    <button className={className} onClick={action}>
      <span className={styles.timerPrimaryIcon}>{icon}</span>
      <span className={styles.timerPrimaryLabel}>{label}</span>
    </button>
  );
}

function SecondaryButtons({ t }) {
  if (!t.isActive && !t.isPaused) return null;

  return (
    <div className={styles.timerCircleSecondaryBtns}>
      <button className={styles.timerCircleSecondaryBtn} onClick={t.resetTimer}>Reset</button>
      <button className={styles.timerCircleSecondaryBtn} onClick={() => t.setModal('endEarly')}>End Early</button>
    </div>
  );
}

function getPrimaryAction(t, onPrimaryStart) {
  if (!t.isActive) return () => onPrimaryStart ? onPrimaryStart() : t.setIsActive(true);
  return t.togglePause;
}

function getPrimaryButtonCopy(t) {
  if (!t.isActive) return { label: 'Start', icon: '▶' };
  if (t.isPaused) return { label: 'Resume', icon: '▶' };
  return { label: 'Pause', icon: '❚❚' };
}

export default function TimerCircle({ t, onPrimaryStart, showAnimationPicker = true, showControls = true }) {
  const ringState = getRingState(t, 150, 'var(--focus-accent, var(--primary))');
  const isRunning = t.isActive && !t.isPaused;
  const className = `${styles.timerCircleWrap} ${isRunning ? styles.timerCircleActive : ''} ${isRunning && t.workTime >= 60 ? styles.timerCircleDeep : ''}`;
  const activeClass = isRunning ? styles.timerProgressActive : '';
  const copy = getPrimaryButtonCopy(t);

  return (
    <div className={className}>
      <TimerRingSvg cx={175} cy={175} radius={150} ringState={ringState} trackColor="color-mix(in srgb, var(--focus-accent, var(--primary)) 12%, var(--border))" strokeWidth="4" activeClass={activeClass} isRunning={isRunning} />
      <div className={styles.timerCircleContent}>
        <div className={styles.timerCircleAnimClip}><FocusAnimation progress={t.progress / 100} mode={t.mode} isActive={t.isActive} showPicker={showAnimationPicker} /></div>
        <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={ringState.isOvertime} />
        {showControls ? <CirclePrimaryButton isRunning={isRunning} action={getPrimaryAction(t, onPrimaryStart)} label={copy.label} icon={copy.icon} /> : null}
        {showControls ? <SecondaryButtons t={t} /> : null}
      </div>
    </div>
  );
}

export function TimerRing({ t }) {
  const ringState = getRingState(t, 105, 'var(--primary)');
  const isRunning = t.isActive && !t.isPaused;
  const activeClass = isRunning ? styles.timerProgressActive : '';

  return (
    <div className={styles.timerRingWrap}>
      <TimerRingSvg cx={125} cy={125} radius={105} ringState={ringState} trackColor="var(--border)" strokeWidth="3" activeClass={activeClass} isRunning={isRunning} />
      <div className={styles.timerRingContent}>
        <TimerDisplay timeLeft={t.timeLeft} mode={t.mode} isOvertime={ringState.isOvertime} />
      </div>
    </div>
  );
}
