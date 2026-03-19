import { useState, useEffect, useCallback } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import analyticsService from '../../api/analyticsService';
import { getNearestMilestone } from './utils/milestoneUtils';

function fmtHours(h) {
    if (!h || h <= 0) return '0m';
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
}

function commitGoal(val, setGoalHours, setEditingGoal) {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) {
        setGoalHours(n);
        try { localStorage.setItem('timerDailyGoalHours', String(n)); } catch {}
    }
    setEditingGoal(false);
}

function GoalEditor({ goalHours, editingGoal, goalInput, setGoalInput, setEditingGoal, setGoalHours }) {
    if (editingGoal) {
        return (
            <input
                className={styles.todayGoalInput}
                type="number" min={0.5} max={24} step={0.5}
                value={goalInput} autoFocus
                onChange={e => setGoalInput(e.target.value)}
                onBlur={() => commitGoal(goalInput, setGoalHours, setEditingGoal)}
                onKeyDown={e => {
                    if (e.key === 'Enter') commitGoal(goalInput, setGoalHours, setEditingGoal);
                    if (e.key === 'Escape') setEditingGoal(false);
                }}
            />
        );
    }
    return (
        <button className={styles.todayGoalEditBtn} onClick={() => { setGoalInput(String(goalHours)); setEditingGoal(true); }}>
            {goalHours}h
        </button>
    );
}

function ProgressBar({ sessions, goalSessions, sessionPct, fillAnimating, isStudying, activePulseLeft, tickCount }) {
    return (
        <div className={styles.todayRibbonBar}>
            <div
                className={`${styles.todayRibbonFill} ${fillAnimating ? styles.todayRibbonFillAnimate : ''} ${isStudying ? styles.todayRibbonFillLive : ''}`}
                style={{ width: `${sessionPct}%` }}
            >
                <span className={styles.todayRibbonFillShimmer} />
            </div>
            <div className={styles.todayRibbonTickLayer}>
                {Array.from({ length: tickCount + 1 }).map((_, idx) => (
                    <span key={`tick-${idx}`} className={styles.todayRibbonTick} style={{ left: `${(idx / tickCount) * 100}%` }} />
                ))}
            </div>
            {isStudying && sessions < goalSessions && (
                <span className={styles.todayRibbonActivePulse} style={{ left: `${activePulseLeft}%` }} />
            )}
        </div>
    );
}

export default function TodayBanner({ onStreakData, isStudying = false }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [monthSummary, setMonthSummary] = useState(null);
    const [goalHours, setGoalHours] = useState(() => parseFloat(localStorage.getItem('timerDailyGoalHours') || '4'));
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('');
    const [lastSessionCount, setLastSessionCount] = useState(null);
    const [fillAnimating, setFillAnimating] = useState(false);
    const [counterAnimating, setCounterAnimating] = useState(false);

    const refresh = useCallback(() => {
        analyticsService.getSummary(1)
            .then(res => { setData(res?.summary ?? null); if (onStreakData) onStreakData(res?.summary ?? null); })
            .catch(() => {})
            .finally(() => setLoading(false));
        analyticsService.getSummary(30)
            .then(res => setMonthSummary(res?.summary ?? null))
            .catch(() => setMonthSummary(null));
    }, [onStreakData]);

    useEffect(() => {
        refresh();
        window.addEventListener('timerHistoryUpdated', refresh);
        window.addEventListener('historyCleared', refresh);
        return () => {
            window.removeEventListener('timerHistoryUpdated', refresh);
            window.removeEventListener('historyCleared', refresh);
        };
    }, [refresh]);

    const sessions = data?.total_sessions ?? 0;
    const hours = data?.total_study_hours ?? 0;
    const streak = data?.current_streak_days ?? 0;
    const goalSessions = Math.max(1, Math.ceil((goalHours * 60) / 25));
    const sessionPct = Math.min(100, Math.round((sessions / goalSessions) * 100));
    const milestone = monthSummary
        ? getNearestMilestone(Number(monthSummary.total_sessions ?? 0), Number(monthSummary.current_streak_days ?? 0), Number(monthSummary.total_study_hours ?? 0))
        : null;
    const weeklyProgressDays = Math.max(0, Math.min(7, streak > 0 && streak % 7 === 0 ? 7 : streak % 7));
    const weeklyGoalText = `🔥 ${weeklyProgressDays}/7 days towards your weekly goal`;
    const streakTooltip = milestone ? `${milestone.remaining} away from ${milestone.label}` : weeklyGoalText;
    const tickCount = Math.max(2, Math.min(goalSessions, 16));
    const activePulseLeft = Math.min(98, Math.max(2, ((Math.min(sessions, goalSessions - 1) + 0.5) / goalSessions) * 100));

    useEffect(() => {
        if (lastSessionCount == null) { setLastSessionCount(sessions); return; }
        if (sessions === lastSessionCount) return;
        setFillAnimating(true);
        setCounterAnimating(true);
        const fillTimer = setTimeout(() => setFillAnimating(false), 900);
        const counterTimer = setTimeout(() => setCounterAnimating(false), 480);
        setLastSessionCount(sessions);
        return () => { clearTimeout(fillTimer); clearTimeout(counterTimer); };
    }, [sessions, lastSessionCount]);

    if (loading) return null;
    return (
        <div className={styles.statsBanner}>
            <div className={styles.statsSection}>
                <div className={styles.statsIconWrap} style={{ background: '#EF6C0018', color: '#EF6C00' }}>
                    <span className={styles.statsEmoji}>🔥</span>
                </div>
                <div className={styles.statsContent}>
                    <span className={styles.statsLabel}>STREAK</span>
                    <div className={styles.statsValueRow}>
                        <span className={styles.statsValue}>{streak} day{streak !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
            
            <div className={styles.statsSection}>
                <div className={styles.statsIconWrap} style={{ background: '#5C6BC018', color: '#5C6BC0' }}>
                    <span className={styles.statsEmoji}>🎯</span>
                </div>
                <div className={styles.statsContent}>
                    <span className={styles.statsLabel}>SESSIONS</span>
                    <div className={styles.statsValueRow}>
                        <span className={styles.statsValue}>
                            {sessions} <span className={styles.statsDenom}>/ {goalSessions}</span>
                        </span>
                    </div>
                    <div className={styles.statsMiniProgress}>
                        <div className={styles.statsMiniFill} style={{ width: `${sessionPct}%` }} />
                    </div>
                </div>
            </div>

            <div className={styles.statsSection}>
                <div className={styles.statsIconWrap} style={{ background: '#388E3C18', color: '#388E3C' }}>
                    <span className={styles.statsEmoji}>🏆</span>
                </div>
                <div className={styles.statsContent}>
                    <span className={styles.statsLabel}>WEEKLY GOAL</span>
                    <div className={styles.statsValueRow}>
                        <span className={styles.statsValue}>
                            {weeklyProgressDays} <span className={styles.statsDenom}>/ 7 days</span>
                        </span>
                    </div>
                    <div className={styles.statsMiniProgress}>
                        <div className={styles.statsMiniFill} style={{ width: `${(weeklyProgressDays / 7) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className={styles.statsSection}>
                <div className={styles.statsIconWrap} style={{ background: '#9E7E5D18', color: '#9E7E5D' }}>
                    <span className={styles.statsEmoji}>⏱</span>
                </div>
                <div className={styles.statsContent}>
                    <span className={styles.statsLabel}>FOCUS TIME</span>
                    <div className={styles.statsValueRow}>
                        <span className={styles.statsValue}>{fmtHours(hours)}</span>
                    </div>
                    <div className={styles.statsSubLabel}>
                        of {goalHours}h · {Math.round((hours / goalHours) * 100)}%
                    </div>
                </div>
            </div>
        </div>
    );
}


