import { useState, useEffect, useRef } from "react";
import styles from "../Profile.module.css";
import { getModules } from "../../../api/moduleApi";

function ProfileWidget({ title, subtitle, action, onClick, children, className = "" }) {
    return (
        <div className={`${styles.glassCard} ${styles.widgetBox} ${className}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className={styles.widgetHeader}>
                <div className={styles.widgetTitleArea}>
                    <div className={styles.cardLabel}>{title}</div>
                    {subtitle && <div className={styles.widgetSubtitle}>{subtitle}</div>}
                </div>
                {action && <div className={styles.widgetAction}>{action}</div>}
            </div>
            <div className={styles.widgetContent}>{children}</div>
        </div>
    );
}

function PersonaHeader({ label, emoji, peakLabel }) {
    return (
        <div className={styles.personaLeft}>
            <span className={styles.personaEmoji} role="img" aria-label={label}>{emoji}</span>
            <span className={styles.personaLabel}>{label}</span>
            {peakLabel && <span className={styles.personaPeak}>{peakLabel}</span>}
        </div>
    );
}

export function PersonaCard({ persona, peakHour }) {
    if (!persona) return null;
    const peakLabel = peakHour != null ? `Based on your ${peakHour % 12 || 12}${peakHour >= 12 ? 'pm' : 'am'} peak` : null;
    return (
        <div className={`${styles.glassCard} ${styles.personaCard}`}>
            <PersonaHeader label={persona.label} emoji={persona.emoji} peakLabel={peakLabel} />
            <p className={styles.personaDesc}>{persona.description}</p>
        </div>
    );
}

function classifyHour(h) {
    if (h >= 5 && h < 12) return 0;
    if (h >= 12 && h < 17) return 1;
    if (h >= 17 && h < 21) return 2;
    return 3;
}

function sumByPeriod(heatmap) {
    const totals = [0, 0, 0, 0];
    const flat = heatmap.data.flat();
    flat.forEach((mins, idx) => { totals[classifyHour(idx % 24)] += mins; });
    return totals;
}

function computeDnaSegments(heatmap) {
    const [m, a, e, n] = sumByPeriod(heatmap);
    const t = m + a + e + n || 1;
    const segments = [
        { label: "Morning", pct: m / t, color: "#F59E0B" },
        { label: "Afternoon", pct: a / t, color: "#D97706" },
        { label: "Evening", pct: e / t, color: "#7C3AED" },
        { label: "Night", pct: n / t, color: "#1E3A5F" },
    ];
    return segments.filter(s => s.pct > 0.01);
}

export function StudyDNA({ heatmap }) {
    if (!heatmap?.data) return null;
    const segments = computeDnaSegments(heatmap);
    return (
        <div className={`${styles.glassCard} ${styles.dnaCard}`}>
            <div className={styles.cardLabel}>STUDY DNA</div>
            <div className={styles.dnaBar}>
                {segments.map((s, i) => (
                    <div key={s.label} className={styles.dnaSegment} style={{ width: `${s.pct * 100}%`, background: s.color, borderRadius: i === 0 ? '5px 0 0 5px' : i === segments.length - 1 ? '0 5px 5px 0' : '0' }} />
                ))}
            </div>
            <div className={styles.dnaLegend}>
                {segments.map(s => (
                    <div key={s.label} className={styles.dnaLegendItem}>
                        <span className={styles.dnaDot} style={{ background: s.color }} /><span className={styles.dnaLegendLabel}>{s.label}</span><span className={styles.dnaLegendPct}>{Math.round(s.pct * 100)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HeatmapCell({ val, maxVal, label }) {
    const getOpacity = v => v === 0 ? 0.07 : 0.15 + (v / maxVal) * 0.85;
    return (
        <div className={styles.heatmapCol}>
            <div className={styles.heatmapCell} style={{ opacity: getOpacity(val) }} title={`${label}: ${(val / 60).toFixed(1)}h`} />
            <span className={styles.heatmapDayLabel}>{label}</span>
        </div>
    );
}

export function MiniHeatmap({ heatmap, onNavigate }) {
    if (!heatmap?.data) return null;
    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const byDow = Array.from({ length: 7 }, () => 0);
    heatmap.data.forEach((row, dayIndex) => { byDow[dayIndex % 7] += row.reduce((s, v) => s + v, 0); });
    const maxVal = Math.max(...byDow, 1);
    return (
        <div className={`${styles.glassCard} ${styles.heatmapCard}`} onClick={() => onNavigate('analytics')} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onNavigate('analytics')}>
            <div className={styles.heatmapHeader}><div className={styles.cardLabel}>STUDY ACTIVITY</div><div className={styles.heatmapLinkBtn}>View full analytics</div></div>
            <div className={styles.miniHeatmap}>
                {byDow.map((val, i) => <HeatmapCell key={i} val={val} maxVal={maxVal} label={DAY_LABELS[i]} />)}
            </div>
        </div>
    );
}

function GoalRing({ percentage, hoursStudied, goalHours, editing, onToggle }) {
    const radius = 34; const circ = 2 * Math.PI * radius;
    const dash = (Math.min(percentage, 100) / 100) * circ;
    return (
        <button className={`${styles.goalRingBtn} ${editing ? styles.goalRingActive : ''}`} onClick={onToggle}>
            <svg width="84" height="84" viewBox="0 0 84 84" className={styles.goalRingSvg}>
                <circle cx="42" cy="42" r={radius} fill="none" stroke="var(--border)" strokeWidth="7" />
                <circle cx="42" cy="42" r={radius} fill="none" stroke={percentage >= 100 ? "#4CAF50" : "var(--primary)"} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            </svg>
            <div className={styles.ringInner}><span className={styles.ringValue}>{hoursStudied}h</span><span className={styles.ringGoal}>/{goalHours}h</span></div>
        </button>
    );
}

function GoalEditor({ val, onSave, onCancel, onChange }) {
    return (
        <div className={styles.goalEditorPanel}>
            <div className={styles.goalEditorLabel}><span>Weekly target</span><span className={styles.goalEditorHrs}>{val}h / week</span></div>
            <input type="range" min="1" max="40" step="1" value={Math.min(val, 40)} onChange={e => onChange(parseInt(e.target.value))} className={styles.goalSlider} />
            <div className={styles.goalEditorActions}><button className={styles.goalCancelBtn} onClick={onCancel}>Cancel</button><button className={styles.goalSaveBtn} onClick={() => onSave(val)}>Save goal</button></div>
        </div>
    );
}

function StreakDisplay({ streaks }) {
    return (
        <div className={styles.streakRow}>
            <div className={styles.streakItem}><span className={styles.streakNum}>{streaks?.current || '—'}</span><span className={styles.streakMeta}>🔥 current</span></div>
            <div className={styles.streakItem}><span className={styles.streakNum}>{streaks?.longest || '—'}</span><span className={styles.streakMeta}>🏆 best</span></div>
        </div>
    );
}

export function ThisWeek({ weekly, streaks, onGoalSave }) {
    const [editing, setEditing] = useState(false);
    const [tempGoal, setTempGoal] = useState(weekly?.goal_hours || 20);
    if (!weekly) return null;
    const handleSave = (n) => { onGoalSave(n); setEditing(false); };
    return (
        <div className={`${styles.glassCard} ${styles.weekCard}`}>
            <div className={styles.cardLabel}>THIS WEEK</div>
            <WeekContent weekly={weekly} streaks={streaks} editing={editing} setEditing={setEditing} tempGoal={tempGoal} setTempGoal={setTempGoal} onSave={handleSave} />
        </div>
    );
}

function WeekContent({ weekly, streaks, editing, setEditing, tempGoal, setTempGoal, onSave }) {
    return (
        <>
            <div className={styles.weekRow}>
                <div className={styles.goalRingWrap}>
                    <GoalRing percentage={weekly.percentage} hoursStudied={weekly.hours_studied} goalHours={weekly.goal_hours} editing={editing} onToggle={() => setEditing(!editing)} />
                    <span className={styles.ringCaption}>{editing ? 'tap to close' : 'tap to edit goal'}</span>
                </div>
                <StreakDisplay streaks={streaks} />
            </div>
            {editing && <div className={styles.goalEditorOpen}><GoalEditor val={tempGoal} onChange={setTempGoal} onSave={onSave} onCancel={() => setEditing(false)} /></div>}
        </>
    );
}

export function BadgesSection({ badges, onOpen }) {
    const meta = { gold: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }, silver: { bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.3)' }, bronze: { bg: 'rgba(146,64,14,0.1)', border: 'rgba(146,64,14,0.25)' } };
    const viewAll = <span className={styles.badgesViewAll}>View all →</span>;
    return (
        <ProfileWidget title="ACHIEVEMENTS" action={viewAll} onClick={onOpen}>
            <div className={styles.badgesSummary}>
                <span className={styles.badgesCount}>{badges?.length || 0}</span>
                <span className={styles.badgesCountLabel}> / 26 unlocked</span>
            </div>
            <div className={styles.badgesGrid}>
                {badges?.slice(0, 6).map(b => (
                    <div key={b.id} className={styles.badge} style={{ background: (meta[b.tier] || meta.bronze).bg, borderColor: (meta[b.tier] || meta.bronze).border }} title={b.description}><span className={styles.badgeEmoji}>{b.emoji}</span>{b.label}</div>
                ))}
            </div>
        </ProfileWidget>
    );
}

function useModuleNameMap() {
    const [nameMap, setNameMap] = useState({});
    useEffect(() => {
        getModules().then(data => {
            const list = Array.isArray(data) ? data : data?.results || [];
            setNameMap(Object.fromEntries(list.filter(m => m.module_code).map(m => [m.module_code, m.module_name])));
        }).catch(() => { });
    }, []);
    return nameMap;
}

export function ModulesSection({ modules, onNavigate }) {
    const nameMap = useModuleNameMap();
    if (!modules?.length) return null;
    return (
        <ProfileWidget title="MODULES" className={styles.modulesWidget}>
            <div className={styles.modulesScroll}>
                {modules.map((code, i) => (
                    <button key={i} className={styles.moduleCard} onClick={() => onNavigate?.(`modules_${code}`)}>
                        <div className={styles.moduleIcon}>📚</div>
                        <div className={styles.moduleCode}>{code}</div>
                        {nameMap[code] && <div className={styles.moduleName}>{nameMap[code]}</div>}
                    </button>
                ))}
            </div>
        </ProfileWidget>
    );
}

export function SocietiesSection({ societies, onNavigate }) {
    if (!societies?.length) return null;
    return (
        <ProfileWidget title="SOCIETIES JOINED">
            <div className={styles.societiesScroll}>
                {societies.map(soc => {
                    const imageUrl = soc.cover_image || soc.image;
                    return (
                        <button key={soc.id} className={styles.societyCard} onClick={() => onNavigate(`societies_${soc.id}`)}>
                            <div className={styles.socLogoWrap}>{imageUrl ? <img src={imageUrl} alt={soc.name} className={styles.socLogo} /> : <div className={styles.socInitial}>{soc.name[0]}</div>}</div>
                            <span className={styles.socName}>{soc.name}</span>
                        </button>
                    );
                })}
            </div>
        </ProfileWidget>
    );
}
