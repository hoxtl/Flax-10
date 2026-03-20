import { useState, useEffect, useRef } from 'react';
import styles from '../../pages/Timer/TimerPage.module.css';
import { TimerSettings } from './TimerComponents';
import {
    BUILT_IN_PRESETS, AUTOSTART_KEY, loadCustomPresets, saveCustomPresets,
    loadPresetUsage, savePresetUsage, isPresetActive, applyPreset,
    getPresetIcon, getPresetDurationTag,
} from './utils/presetUtils';
import { fmtDuration } from './utils/timerFormatters';
import { useToast } from '../../context/ToastContext';

function PresetCard({ preset, t, onApply, onDelete }) {
    const [ctxMenu, setCtxMenu] = useState(null);
    const ctxRef = useRef(null);
    const active = isPresetActive(preset, t);
    const disabled = t.isActive;
    const tooltipText = `${preset.work}m work · ${preset.brk}m break · ${preset.sessions} sessions`;

    useEffect(() => {
        if (!ctxMenu) return;
        const handler = (e) => { if (ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [ctxMenu]);

    const handleContextMenu = (e) => {
        if (!onDelete) return;
        e.preventDefault();
        setCtxMenu({ x: e.clientX, y: e.clientY });
    };

    return (
        <div className={styles.presetListItemWrap} onContextMenu={handleContextMenu} data-tooltip={tooltipText}>
            <button
                className={`${styles.presetListItem} ${active ? styles.presetListItemActive : ''} ${disabled ? styles.presetListItemDisabled : ''}`}
                onClick={() => !disabled && onApply?.(preset)}
                disabled={disabled}
            >
                <span className={styles.presetListItemTop}>
                    <span className={styles.presetListIcon} aria-hidden="true">{getPresetIcon(preset)}</span>
                    <span className={styles.presetListItemName}>{preset.label}</span>
                    <span className={styles.presetDurationTag}>{getPresetDurationTag(preset)}</span>
                </span>
                <span className={styles.presetListItemMeta}>{preset.sessions} sessions</span>
            </button>
            {onDelete && (
                <button className={styles.presetDeleteBtn} onClick={onDelete} title="Delete preset" aria-label="Delete preset">✕</button>
            )}
            {ctxMenu && onDelete && (
                <div ref={ctxRef} className={styles.presetCtxMenu} style={{ top: ctxMenu.y, left: ctxMenu.x }}>
                    <button className={styles.presetCtxDeleteBtn} onClick={() => { onDelete(); setCtxMenu(null); }}>
                        🗑 Delete preset
                    </button>
                </div>
            )}
        </div>
    );
}

function DailyGoalWidget() {
    const [goalHours, setGoalHours] = useState(() => parseFloat(localStorage.getItem('timerDailyGoalHours') || '4'));
    const [studiedHours, setStudiedHours] = useState(null);
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState('');

    useEffect(() => {
        import('../../api/analyticsService').then(m => {
            m.default.getSummary(1)
                .then(res => setStudiedHours(res?.summary?.total_study_hours ?? 0))
                .catch(() => setStudiedHours(0));
        });
    }, []);

    const pct = Math.min(100, goalHours > 0 && studiedHours !== null
        ? Math.round((studiedHours / goalHours) * 100) : 0);

    const commitGoal = (val) => {
        const n = parseFloat(val);
        if (!isNaN(n) && n > 0) {
            setGoalHours(n);
            try { localStorage.setItem('timerDailyGoalHours', String(n)); } catch {}
        }
        setEditingGoal(false);
    };

    const fmtStudied = studiedHours !== null
        ? `${fmtDuration(Math.round((studiedHours || 0) * 3600))} of ${goalHours}h (${pct}%)`
        : '…';

    return (
        <div className={styles.dailyGoalWidget}>
            <div className={styles.dailyGoalHeader}>
                <span className={styles.dailyGoalLabel}>Today's Goal</span>
                {editingGoal ? (
                    <input
                        className={styles.todayGoalInput}
                        type="number" min={0.5} max={24} step={0.5}
                        value={goalInput}
                        autoFocus
                        onChange={e => setGoalInput(e.target.value)}
                        onBlur={() => commitGoal(goalInput)}
                        onKeyDown={e => { if (e.key === 'Enter') commitGoal(goalInput); if (e.key === 'Escape') setEditingGoal(false); }}
                    />
                ) : (
                    <button className={styles.todayGoalEditBtn} onClick={() => { setGoalInput(String(goalHours)); setEditingGoal(true); }}>
                        {goalHours}h
                    </button>
                )}
            </div>
            <div className={styles.todayGoalBar}>
                <div className={styles.todayGoalFill} style={{ width: `${pct}%` }} />
            </div>
            <span className={styles.dailyGoalProgress}>{fmtStudied}</span>
        </div>
    );
}

function AutoStartToggle() {
    const [autoStart, setAutoStart] = useState(() => localStorage.getItem(AUTOSTART_KEY) === 'true');
    return (
        <label className={styles.autoStartToggle}>
            <input
                type="checkbox"
                checked={autoStart}
                onChange={e => {
                    setAutoStart(e.target.checked);
                    try { localStorage.setItem(AUTOSTART_KEY, String(e.target.checked)); } catch {}
                }}
            />
            Auto-start next session
        </label>
    );
}

export function PresetPanel({ t, embedded = false }) {
    const [customPresets, setCustomPresets] = useState(() => loadCustomPresets());
    const [usageMap, setUsageMap] = useState(() => loadPresetUsage());
    const [saving, setSaving] = useState(false);
    const [saveName, setSaveName] = useState('');
    const toast = useToast();

    const sortedPresets = [...BUILT_IN_PRESETS, ...customPresets].sort((a, b) => {
        const diff = Number(usageMap[b.id] || 0) - Number(usageMap[a.id] || 0);
        return diff !== 0 ? diff : String(a.label).localeCompare(String(b.label));
    });

    const applyPresetAndTrack = (preset) => {
        applyPreset(preset, t);
        const next = { ...usageMap, [preset.id]: Number(usageMap[preset.id] || 0) + 1 };
        setUsageMap(next);
        savePresetUsage(next);
    };

    const handleSave = () => {
        const name = saveName.trim();
        if (!name) return;
        const newPreset = { id: `custom_${Date.now()}`, label: name, work: t.workTime, brk: t.breakTime, sessions: t.targetSessions };
        const updated = [...customPresets, newPreset];
        setCustomPresets(updated);
        saveCustomPresets(updated);
        setSaving(false);
        setSaveName('');
    };

    const handleDelete = (preset) => {
        const updated = customPresets.filter(p => p.id !== preset.id);
        setCustomPresets(updated);
        saveCustomPresets(updated);
        toast?.(`"${preset.label}" deleted.`);
    };

    const content = (
        <>
            <div className={styles.presetPanelGrid}>
                {sortedPresets.map(p => (
                    <PresetCard
                        key={p.id} preset={p} t={t}
                        onApply={applyPresetAndTrack}
                        onDelete={customPresets.some(cp => cp.id === p.id) ? () => handleDelete(p) : null}
                    />
                ))}
            </div>
            <div className={styles.presetSaveArea}>
                {saving ? (
                    <div className={styles.presetSaveForm}>
                        <input
                            className={styles.presetNameInput}
                            placeholder="Preset name…"
                            value={saveName}
                            onChange={e => setSaveName(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setSaving(false); }}
                            autoFocus maxLength={24}
                        />
                        <button className={styles.presetSaveConfirm} onClick={handleSave}>Save</button>
                        <button className={styles.presetSaveCancel} onClick={() => setSaving(false)}>Cancel</button>
                    </div>
                ) : (
                    <button className={styles.presetSaveBtn} onClick={() => { setSaving(true); setSaveName(''); }} disabled={t.isActive}>
                        + Save current
                    </button>
                )}
            </div>
            <DailyGoalWidget />
        </>
    );

    if (embedded) return content;
    return <div className={styles.presetPanelCard}>{content}</div>;
}

export function TimerConfigPanel({ t, embedded = false }) {
    const disabled = t.isActive || t.isPaused;

    const applyMinutes = (minutes) => {
        if (disabled) return;
        t.updateTime('work', minutes);
        t.setTimeLeft(minutes * 60);
    };

    const adjustMinutes = (delta) => {
        if (disabled) return;
        const next = Math.max(5, Number(t.workTime || 25) + delta);
        t.updateTime('work', next);
        t.setTimeLeft(next * 60);
    };

    const content = (
        <div className={styles.configInsetPanel}>
            <TimerSettings work={t.workTime} breakTime={t.breakTime} sessions={t.targetSessions} onUpdate={t.updateTime} />
            <div className={styles.quickAdjustRow}>
                <button type="button" className={styles.quickAdjustBtn} onClick={() => adjustMinutes(-5)} disabled={disabled}>-5m</button>
                <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(25)} disabled={disabled}>25m</button>
                <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(50)} disabled={disabled}>50m</button>
                <button type="button" className={styles.quickAdjustBtn} onClick={() => applyMinutes(90)} disabled={disabled}>90m</button>
                <button type="button" className={styles.quickAdjustBtn} onClick={() => adjustMinutes(5)} disabled={disabled}>+5m</button>
            </div>
            <AutoStartToggle />
        </div>
    );

    if (embedded) return content;
    return <div className={styles.presetPanelCard}>{content}</div>;
}
