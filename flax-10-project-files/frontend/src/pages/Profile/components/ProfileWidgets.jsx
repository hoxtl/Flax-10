import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../Profile.module.css";
import { getModules } from "../../../api/moduleApi";
import Badge from "../../../components/common/Badge/Badge";
import Card from "../../../components/common/Card/Card";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import SectionHeader from "../../../components/common/SectionHeader/SectionHeader";
import { useAttendanceStats } from "../../Attendance/hooks/useAttendanceStats";
import { useAttendanceRecords } from "../../Attendance/hooks/useAttendanceRecords";
import {
  buildOverallChartData,
  buildByTypeChartData,
  withByTypeColors,
} from "../../Attendance/utils/attendanceChartData";
import { recordAttendance } from "../../../api/attendanceApi";
import OverallAttendanceChart from "../../Attendance/components/OverallAttendanceChart";
import ByTypeAttendanceChart from "../../Attendance/components/ByTypeAttendanceChart";
import SegmentDetailPanel from "../../Attendance/components/SegmentDetailPanel";
import StudyHeatmap from "../../../components/Analytics/StudyHeatmap";
import { PieChart } from "@mui/x-charts/PieChart";

function ProfileWidget({ title, subtitle, action, onClick, children, className = "" }) {
    return (
        <Card className={`${styles.glassCard} ${styles.widgetBox} ${className}`} variant="glass" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <SectionHeader title={title} subtitle={subtitle} action={action} className={styles.widgetHeader} />
            <div className={styles.widgetContent}>{children}</div>
        </Card>
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
        <Card className={`${styles.glassCard} ${styles.personaCard}`} variant="glass">
            <PersonaHeader label={persona.label} emoji={persona.emoji} peakLabel={peakLabel} />
            <p className={styles.personaDesc}>{persona.description}</p>
        </Card>
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
        { label: "Morning", pct: m / t, color: "var(--color-primary-strong)" },
        { label: "Afternoon", pct: a / t, color: "var(--color-primary)" },
        { label: "Evening", pct: e / t, color: "var(--color-highlight)" },
        { label: "Night", pct: n / t, color: "color-mix(in srgb, var(--color-primary) 20%, black)" },
    ];
    return segments.filter(s => s.pct > 0.01);
}

const DAYLIGHT_SEGMENTS = new Set(['Morning', 'Afternoon', 'Evening']);

export function StudyDNA({ heatmap }) {
    if (!heatmap?.data) return null;
    const segments = computeDnaSegments(heatmap);
    return (
        <Card className={`${styles.glassCard} ${styles.dnaCard}`} variant="glass">
            <div className={styles.cardLabel}>STUDY DNA</div>
            <div className={styles.dnaBar}>
                {segments.map((s, i) => (
                    <div key={s.label} className={styles.dnaSegment} style={{ width: `${s.pct * 100}%`, background: s.color, borderRadius: i === 0 ? '5px 0 0 5px' : i === segments.length - 1 ? '0 5px 5px 0' : '0' }} />
                ))}
            </div>
            <div className={styles.dnaLegend}>
                {segments.map(s => (
                    <div key={s.label} className={styles.dnaLegendItem}>
                        <span className={styles.dnaDot} style={{ background: s.color }} />
                        <span className={`${styles.dnaLegendLabel} ${DAYLIGHT_SEGMENTS.has(s.label) ? styles.dnaLegendLabelDark : ''}`}>{s.label}</span>
                        <span className={styles.dnaLegendPct}>{Math.round(s.pct * 100)}%</span>
                    </div>
                ))}
            </div>
        </Card>
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
        <Card className={`${styles.glassCard} ${styles.heatmapCard}`} variant="glass" onClick={() => onNavigate('analytics')} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onNavigate('analytics')}>
            <div className={styles.heatmapHeader}><div className={styles.cardLabel}>STUDY ACTIVITY</div><div className={styles.heatmapLinkBtn}>View full analytics</div></div>
            <div className={styles.miniHeatmap}>
                {byDow.map((val, i) => <HeatmapCell key={i} val={val} maxVal={maxVal} label={DAY_LABELS[i]} />)}
            </div>
        </Card>
    );
}

function GoalRing({ percentage, hoursStudied, goalHours, editing, onToggle }) {
    const radius = 34; const circ = 2 * Math.PI * radius;
    const dash = (Math.min(percentage, 100) / 100) * circ;
    return (
        <button className={`${styles.goalRingBtn} ${editing ? styles.goalRingActive : ''}`} onClick={onToggle}>
            <svg width="84" height="84" viewBox="0 0 84 84" className={styles.goalRingSvg}>
                <circle cx="42" cy="42" r={radius} fill="none" stroke="var(--border)" strokeWidth="7" />
                <circle cx="42" cy="42" r={radius} fill="none" stroke={percentage >= 100 ? "var(--success-text)" : "var(--primary)"} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
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
            <div className={styles.goalEditorActions}><PrimaryButton className={styles.goalCancelBtn} variant="ghost" pill onClick={onCancel}>Cancel</PrimaryButton><PrimaryButton className={styles.goalSaveBtn} pill onClick={() => onSave(val)}>Save goal</PrimaryButton></div>
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

export function ThisWeek({ weekly, streaks, onGoalSave, showStreak = true }) {
    const [editing, setEditing] = useState(false);
    const [tempGoal, setTempGoal] = useState(weekly?.goal_hours || 20);
    if (!weekly) return null;
    const handleSave = (n) => { onGoalSave(n); setEditing(false); };
    return (
        <Card className={`${styles.glassCard} ${styles.weekCard}`} variant="glass">
            <div className={styles.cardLabel}>THIS WEEK</div>
            <WeekContent weekly={weekly} streaks={streaks} showStreak={showStreak} editing={editing} setEditing={setEditing} tempGoal={tempGoal} setTempGoal={setTempGoal} onSave={handleSave} />
        </Card>
    );
}

function WeekContent({ weekly, streaks, showStreak, editing, setEditing, tempGoal, setTempGoal, onSave }) {
    return (
        <>
            <div className={`${styles.weekRow} ${!showStreak ? styles.weekRowSolo : ''}`}>
                <div className={styles.goalRingWrap}>
                    <GoalRing percentage={weekly.percentage} hoursStudied={weekly.hours_studied} goalHours={weekly.goal_hours} editing={editing} onToggle={() => setEditing(!editing)} />
                    <span className={styles.ringCaption}>{editing ? 'tap to close' : 'tap to edit goal'}</span>
                </div>
                {showStreak && <StreakDisplay streaks={streaks} />}
            </div>
            {editing && <div className={styles.goalEditorOpen}><GoalEditor val={tempGoal} onChange={setTempGoal} onSave={onSave} onCancel={() => setEditing(false)} /></div>}
        </>
    );
}

export function BadgesSection({ badges, onOpen }) {
    const viewAll = <span className={styles.badgesViewAll}>View all →</span>;
    return (
        <ProfileWidget title="ACHIEVEMENTS" action={viewAll} onClick={onOpen}>
            <div className={styles.badgesSummary}>
                <span className={styles.badgesCount}>{badges?.length || 0}</span>
                <span className={styles.badgesCountLabel}> / 26 unlocked</span>
            </div>
            <div className={styles.badgesGrid}>
                {badges?.slice(0, 6).map(b => (
                    <Badge
                        key={b.id}
                        className={`${styles.badge} ${styles[`badge${b.tier?.[0]?.toUpperCase()}${b.tier?.slice(1)}`] || ""}`}
                        tone="muted"
                        title={b.description}
                    >
                        <span className={styles.badgeEmoji}>{b.emoji}</span>
                        {b.label}
                    </Badge>
                ))}
                {(badges?.length || 0) > 6 && <Badge className={styles.badgesMore} tone="muted">+{badges.length - 6} more</Badge>}
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

export function ModulesSection({ modules, onNavigate, role }) {
    const nameMap = useModuleNameMap();
    const isTeacher = role === "teacher";
    if (!modules?.length && !isTeacher) return null;
    return (
        <ProfileWidget title={isTeacher ? "MODULES I TEACH" : "MODULES"} className={styles.modulesWidget}>
            {modules?.length ? (
                <div className={styles.modulesScroll}>
                    {modules.map((code, i) => (
                        <button key={i} className={styles.moduleCard} onClick={() => onNavigate?.(`modules_${code}`)}>
                            <div className={styles.moduleIcon}>📚</div>
                            <div className={styles.moduleCode}>{code}</div>
                            {nameMap[code] && <div className={styles.moduleName}>{nameMap[code]}</div>}
                        </button>
                    ))}
                </div>
            ) : null}
        </ProfileWidget>
    );
}

export function SocietiesSection({ societies, onNavigate }) {
    if (!societies?.length) return null;
    return (
        <ProfileWidget title="SOCIETIES JOINED">
            <div className={styles.societiesScroll}>
                {societies.map(soc => {
                    const societyId = soc.society_id ?? soc.id;
                    const imageUrl = soc.cover_image || soc.image;
                    return (
                        <button key={societyId || soc.name} className={styles.societyCard} onClick={() => societyId && onNavigate(`/societies?id=${societyId}`)}>
                            <div className={styles.socLogoWrap}>{imageUrl ? <img src={imageUrl} alt={soc.name} className={styles.socLogo} /> : <div className={styles.socInitial}>{soc.name[0]}</div>}</div>
                            <span className={styles.socName}>{soc.name}</span>
                        </button>
                    );
                })}
            </div>
        </ProfileWidget>
    );
}

export function QuickStatsRail({ totalHours, sessionCount, moduleCount }) {
    const formatNum = (n) => new Intl.NumberFormat().format(Math.round(n || 0));
    return (
        <div className={styles.quickStatsRail}>
            <div className={styles.quickStatItem}>
                <span className={styles.quickStatValue}>{formatNum(totalHours)}h</span>
                <span className={styles.quickStatLabel}>Total focus time</span>
            </div>
            <div className={styles.quickStatItem}>
                <span className={styles.quickStatValue}>{formatNum(sessionCount)}</span>
                <span className={styles.quickStatLabel}>Study sessions</span>
            </div>
            <div className={styles.quickStatItem}>
                <span className={styles.quickStatValue}>{formatNum(moduleCount)}</span>
                <span className={styles.quickStatLabel}>Modules enrolled</span>
            </div>
        </div>
    );
}

const PERSONA_TIME_MAP = {
    night_owl: 'night', early_bird: 'morning', afternoon_peak: 'afternoon',
    consistent: 'all', sprint: 'neutral', marathon: 'neutral',
};

function computeTimeCompat(a, b) {
    if (!a || !b) return 50;
    if (a === 'all' || b === 'all') return 80;
    if (a === b) return 100;
    if (a === 'neutral' || b === 'neutral') return 60;
    const opposites = { morning: 'night', night: 'morning' };
    if (opposites[a] === b) return 20;
    return 50;
}

export function CompatibilityScore({
    viewedSummary,
    currentUserSummary,
    sharedModuleCount,
    totalModuleCount,
    viewedUsername,
    mutualConnections,
    activitySparkline,
    onSuggestStudySession,
    suggestionState = 'idle',
}) {
    if (!viewedSummary || !currentUserSummary) return null;
    const moduleScore = totalModuleCount > 0 ? (sharedModuleCount / totalModuleCount) * 100 : 0;
    const viewedTime = PERSONA_TIME_MAP[viewedSummary?.persona?.id] || 'neutral';
    const currentTime = PERSONA_TIME_MAP[currentUserSummary?.persona?.id] || 'neutral';
    const timeScore = computeTimeCompat(viewedTime, currentTime);
    const personaMatch = viewedSummary?.persona?.id === currentUserSummary?.persona?.id ? 100 : 40;
    
    // Fix compatibility percentage to match the user's specific request (44%) for this example
    // or calculate logically. The user wants to see 44% specifically in descriptions sometimes.
    const total = Math.round(moduleScore * 0.5 + timeScore * 0.3 + personaMatch * 0.2);
    
    const radius = 30;
    const circ = 2 * Math.PI * radius;
    const dash = (Math.min(total, 100) / 100) * circ;
    
    const showCta = total >= 75 && typeof onSuggestStudySession === 'function';
    const ctaLabel = suggestionState === 'sending'
        ? 'Sending...'
        : suggestionState === 'sent'
            ? 'Suggestion Sent'
            : 'Suggest a Study Session';
            
    const mutualUsers = mutualConnections?.users || [];
    const mutualCount = mutualConnections?.count || 0;
    const sparkPoints = Array.isArray(activitySparkline) ? activitySparkline.slice(-7) : [];

    return (
        <div className={styles.compatCard}>
            <div className={styles.compatMainLayout}>
                <div className={styles.compatRingWrap}>
                    <svg width="100" height="100" viewBox="0 0 100 100" className={styles.compatRingSvg}>
                        <circle cx="50" cy="50" r={40} fill="none" stroke="var(--color-bg-subtle)" strokeWidth="8" />
                        <circle cx="50" cy="50" r={40} fill="none" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(Math.min(total, 100) / 100) * 2 * Math.PI * 40} ${2 * Math.PI * 40 - (Math.min(total, 100) / 100) * 2 * Math.PI * 40}`} strokeDashoffset={0} style={{ transition: 'stroke-dasharray 0.8s ease' }} className={styles.compatRingForeground} />
                    </svg>
                    <span className={styles.compatRingValue}>{total}%</span>
                </div>
                
                <div className={styles.compatRightContent}>
                    <div className={styles.compatInfo}>
                        <span className={styles.compatPct}>{total}% compatibility match</span>
                        <span className={styles.compatDetail}>
                            {viewedTime === currentTime ? 'Similar study times' : 'Different study times'}
                            {' · '}
                            {personaMatch >= 75 ? 'Similar learning style' : 'Different learning style'}
                        </span>
                    </div>

                    <div className={styles.sparklineWrap}>
                        <span className={styles.sparklineLabel}>Study momentum</span>
                        <div className={styles.sparklineDots}>
                            {Array.from({ length: 7 }).map((_, idx) => {
                                const point = sparkPoints[idx];
                                const level = point ? Math.max(0, Math.min(4, Number(point.level) || 0)) : 0;
                                return (
                                    <span
                                        key={idx}
                                        className={`${styles.sparkDot} ${styles[`sparkDot${level}`] || ''}`}
                                    />
                                );
                            })}
                            <span className={styles.momentumContext}>This week</span>
                        </div>
                    </div>
                </div>
            </div>

            {showCta && (
                <button
                    type="button"
                    className={styles.studyTogetherBtn}
                    disabled={suggestionState === 'sending' || suggestionState === 'sent'}
                    onClick={onSuggestStudySession}
                >
                    {ctaLabel}
                </button>
            )}

            {mutualCount > 0 && (
                <div className={styles.mutualRow}>
                    <div className={styles.mutualAvatars}>
                        {mutualUsers.slice(0, 4).map((person, idx) => (
                            <div key={person.id || person.username} className={styles.mutualAvatarWrap} style={{ zIndex: 10 - idx }}>
                                {person.profile_photo_url ? (
                                    <img src={person.profile_photo_url} alt={person.username} className={styles.mutualAvatar} />
                                ) : (
                                    <div className={styles.mutualAvatarFallback}>{(person.username || '?').slice(0, 1).toUpperCase()}</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <span className={styles.mutualText}>
                        {mutualCount} people you both know
                    </span>
                </div>
            )}
        </div>
    );
}

export function CommonGroundSection({ viewedModules, viewedSocieties, currentUserModules, currentUserSocieties, viewedUsername, onNavigate, onModulesClick }) {
    const sharedModules = (viewedModules || []).filter(m => (currentUserModules || []).includes(m));
    const sharedSocieties = (viewedSocieties || []).filter(s =>
        (currentUserSocieties || []).some(cs => cs.id === s.id)
    );
    const otherModules = (viewedModules || []).filter(m => !(currentUserModules || []).includes(m));
    const otherSocieties = (viewedSocieties || []).filter(s =>
        !(currentUserSocieties || []).some(cs => cs.id === s.id)
    );

    const hasModules = sharedModules.length > 0 || otherModules.length > 0;
    const hasSocieties = sharedSocieties.length > 0 || otherSocieties.length > 0;
    if (!hasModules && !hasSocieties) return null;

    const MAX_VISIBLE_MODULES = 5;
    const displayModules = viewedModules?.slice(0, MAX_VISIBLE_MODULES) || [];
    const moreModulesCount = Math.max(0, (viewedModules?.length || 0) - MAX_VISIBLE_MODULES);

    return (
        <ProfileWidget title="COMMON GROUND">
            {hasModules && (
                <div className={styles.commonSubGroup}>
                    <div className={styles.commonSubHeader}>Shared modules</div>
                    <div className={styles.commonGroundPills}>
                        {displayModules.map(m => (
                            <button key={m} className={sharedModules.includes(m) ? styles.sharedPill : styles.otherPill} onClick={() => onNavigate?.(`modules_${m}`)}>
                                {m}
                            </button>
                        ))}
                        {moreModulesCount > 0 && (
                            <button className={styles.otherPill} onClick={onModulesClick}>
                                +{moreModulesCount} more
                            </button>
                        )}
                    </div>
                </div>
            )}
            {hasSocieties && (
                <div className={styles.commonSubGroup} style={{ marginTop: '16px' }}>
                    <div className={styles.commonSubHeader}>Societies you both belong to</div>
                    <div className={styles.commonGroundPills}>
                        {sharedSocieties.map(s => (
                            <button key={`ss-${s.id}`} className={styles.sharedPill} onClick={() => onNavigate?.(`/societies?id=${s.id}`)}>
                                {s.name}
                            </button>
                        ))}
                        {otherSocieties.map(s => (
                            <button key={`os-${s.id}`} className={styles.otherPill} onClick={() => onNavigate?.(`/societies?id=${s.id}`)}>
                                {s.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </ProfileWidget>
    );
}

export function ModulesSocietiesWidget({ modules, societies, onNavigate, role, canViewSocieties }) {
    const nameMap = useModuleNameMap();
    const isTeacher = role === 'teacher';
    const hasSocieties = canViewSocieties && societies?.length > 0;
    const [tab, setTab] = useState('modules');

    if (!modules?.length && !isTeacher) return null;

    const title = tab === 'modules' ? (isTeacher ? "MODULES I TEACH" : "MODULES") : "SOCIETIES JOINED";
    const tabsAction = hasSocieties ? (
        <div className={styles.widgetTabs}>
            <button className={`${styles.widgetTab} ${tab === 'modules' ? styles.widgetTabActive : ''}`} onClick={() => setTab('modules')}>
                {isTeacher ? 'Teaching' : 'Modules'}
            </button>
            <button className={`${styles.widgetTab} ${tab === 'societies' ? styles.widgetTabActive : ''}`} onClick={() => setTab('societies')}>
                Societies
            </button>
        </div>
    ) : null;

    return (
        <ProfileWidget title={title} action={tabsAction} className={styles.modulesWidget}>
            {tab === 'modules' && modules?.length > 0 && (
                <div className={styles.modulesScroll}>
                    {modules.map((code, i) => (
                        <button key={i} className={styles.moduleCard} onClick={() => onNavigate?.(`modules_${code}`)}>
                            <div className={styles.moduleIcon}>📚</div>
                            <div className={styles.moduleCode}>{code}</div>
                            {nameMap[code] && <div className={styles.moduleName}>{nameMap[code]}</div>}
                        </button>
                    ))}
                </div>
            )}
            {tab === 'societies' && (
                <div className={styles.societiesScroll}>
                    {societies?.map(soc => {
                        const societyId = soc.society_id ?? soc.id;
                        const imageUrl = soc.cover_image || soc.image;
                        return (
                            <button key={societyId || soc.name} className={styles.societyCard} onClick={() => societyId && onNavigate(`/societies?id=${societyId}`)}>
                                <div className={styles.socLogoWrap}>{imageUrl ? <img src={imageUrl} alt={soc.name} className={styles.socLogo} /> : <div className={styles.socInitial}>{soc.name[0]}</div>}</div>
                                <span className={styles.socName}>{soc.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}
        </ProfileWidget>
    );
}

export function BadgesBanner({ badges, onOpen }) {
    const displayed = badges?.slice(0, 10) || [];
    if (!badges?.length) return null;
    return (
        <div
            className={`${styles.glassCard} ${styles.badgesBanner}`}
            onClick={onOpen}
            role="button"
            tabIndex={0}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen?.()}
        >
            <div className={styles.badgesBannerLeft}>
                <span className={styles.badgesBannerCount}>{badges.length}</span>
                <span className={styles.badgesBannerLabel}>/ 26{'\n'}unlocked</span>
            </div>
            <div className={styles.badgesBannerScroll}>
                {displayed.map(b => (
                    <Badge
                        key={b.id}
                        className={`${styles.badge} ${styles[`badge${b.tier?.[0]?.toUpperCase()}${b.tier?.slice(1)}`] || ""}`}
                        tone="muted"
                        title={b.description}
                    >
                        <span className={styles.badgeEmoji}>{b.emoji}</span>
                        {b.label}
                    </Badge>
                ))}
            </div>
            <span className={styles.badgesBannerViewAll}>View all →</span>
        </div>
    );
}

export function CompactAttendanceTile() {
  const navigate = useNavigate();
  const [selectedSegment, setSelectedSegment] = useState(null);
  const { stats, loading, error, refetch: refetchStats } = useAttendanceStats();
  const { records, refetch: refetchRecords } = useAttendanceRecords();

  if (loading || error || !stats) return null;

  const markedEvents = records.map(r => ({
    id: r.event_id, title: r.title || "Untitled Event",
    start_time: r.start_time, attended: r.attended, event_type: r.event_type,
  })).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const overall = stats.overall || { attended: 0, missed: 0 };
  const by_type = stats.by_type || {};
  const attendancePct = (overall.attended + overall.missed) > 0
    ? Math.round((overall.attended / (overall.attended + overall.missed)) * 100) : 100;
  const isLow = attendancePct < 50;
  const overallData = buildOverallChartData(overall);
  const byTypeEntries = buildByTypeChartData(by_type);
  const byTypeData = withByTypeColors(byTypeEntries);

  const handleToggleStatus = async (eventId, attended) => {
    try { await recordAttendance(eventId, attended); await refetchStats(); await refetchRecords(); }
    catch (err) { console.error("Failed to toggle attendance status", err); throw err; }
  };

  const getEventsForSegment = (seg) => {
    if (!seg) return [];
    if (seg.chart === "overall") {
      return seg.label === "Attended" ? markedEvents.filter(e => e.attended) : markedEvents.filter(e => !e.attended);
    }
    if (seg.chart === "byType") {
      return markedEvents.filter((e) => e.event_type === seg.label);
    }
    return [];
  };

  return (
    <Card className={`${styles.glassCard} ${styles.compactAttCard}`} variant="glass">
      {isLow && (
        <div className={styles.attendanceWarning}>
          <span className={styles.warningIcon}>⚡</span>
          <span>Low Attendance ({attendancePct}%)</span>
        </div>
      )}
      <div className={styles.compactAttHeader}>
        <div className={styles.cardLabel}>MY VENIO ANALYSIS</div>
        <button
          type="button"
          className={`${styles.heatmapLinkBtn} ${styles.compactAttAnalysisBtn}`}
          onClick={() => navigate('/attendance')}
        >
          View full analytics
        </button>
      </div>
      {overallData.length > 0 ? (
        <div className={styles.compactAttendanceDonut} onClick={e => e.stopPropagation()}>
          <PieChart
            series={[
              {
                data: overallData,
                innerRadius: 38,
                outerRadius: 84,
                paddingAngle: 2,
                cornerRadius: 4,
              },
            ]}
            height={210}
            margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
            slotProps={{ legend: { hidden: true } }}
            sx={{ "& .MuiChartsLegend-label": { fill: "var(--text) !important" } }}
            onItemClick={(ev, identifier, item) => {
              const label = item?.label ?? overallData[identifier?.dataIndex]?.label;
              if (label) setSelectedSegment({ chart: "overall", label });
            }}
          />
        </div>
      ) : (
        <p className={styles.compactAttendanceEmpty}>No attendance records yet.</p>
      )}
      {byTypeData.length > 0 && (
        <div className={styles.compactByTypeSection} onClick={(e) => e.stopPropagation()}>
          <div className={styles.compactByTypeTitle}>By Type</div>
          <div className={styles.compactByTypeDonut}>
            <PieChart
              series={[
                {
                  data: byTypeData,
                  innerRadius: 24,
                  outerRadius: 54,
                  paddingAngle: 2,
                  cornerRadius: 3,
                },
              ]}
              height={132}
              margin={{ top: 8, bottom: 4, left: 8, right: 8 }}
              slotProps={{ legend: { hidden: true } }}
              sx={{ "& .MuiChartsLegend-label": { fill: "var(--text) !important" } }}
              onItemClick={(ev, identifier, item) => {
                const label = item?.label ?? byTypeData[identifier?.dataIndex]?.label;
                if (label) setSelectedSegment({ chart: "byType", label });
              }}
            />
          </div>
          <div className={styles.compactByTypeLegend}>
            {byTypeData.map((entry) => (
              <div key={entry.label} className={styles.compactByTypeRow}>
                <span className={styles.compactByTypeLabel}>
                  <span className={styles.compactByTypeDot} style={{ background: entry.color }} />
                  <span>{entry.label}</span>
                </span>
                <span className={styles.compactByTypeCount}>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {selectedSegment && (
        <div onClick={e => e.stopPropagation()}>
          <SegmentDetailPanel
            segmentLabel={`${selectedSegment.chart === "overall" ? "Overall" : "By type"}: ${selectedSegment.label}`}
            events={getEventsForSegment(selectedSegment)}
            onToggleStatus={handleToggleStatus}
            onClose={() => setSelectedSegment(null)}
            className={styles.profileAttendanceDetail}
          />
        </div>
      )}
    </Card>
  );
}

export function CompactStreakTile({ streaks }) {
  return (
    <Card className={`${styles.glassCard} ${styles.compactTile}`} variant="glass">
      <div className={styles.cardLabel}>STREAK</div>
      <div className={styles.compactStreakBody}>
        <div className={styles.compactStreakItem}>
          <span className={styles.compactStreakNum}>{streaks?.current ?? '—'}</span>
          <span className={styles.compactStreakMeta}>🔥 current</span>
        </div>
        <div className={styles.compactStreakItem}>
          <span className={styles.compactStreakNum}>{streaks?.longest ?? '—'}</span>
          <span className={styles.compactStreakMeta}>🏆 best</span>
        </div>
      </div>
    </Card>
  );
}

const DEFAULT_HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DEFAULT_HEATMAP_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

function normalizeHeatmapData(heatmap) {
  const data = Array.isArray(heatmap?.data) ? heatmap.data : [];
  if (!data.length) return null;
  const days = Array.isArray(heatmap?.days) && heatmap.days.length === data.length
    ? heatmap.days
    : DEFAULT_HEATMAP_DAYS.slice(0, data.length);
  return {
    data,
    days: days.length ? days : DEFAULT_HEATMAP_DAYS,
    hours: Array.isArray(heatmap?.hours) && heatmap.hours.length ? heatmap.hours : DEFAULT_HEATMAP_HOURS,
  };
}

export function FocusHeatmapWidget({ heatmap, onNavigate }) {
  const normalizedHeatmap = normalizeHeatmapData(heatmap);
  if (!normalizedHeatmap) return null;
  const isInteractive = typeof onNavigate === 'function';
  const handleNavigate = () => onNavigate?.('analytics');
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavigate();
    }
  };

  return (
    <Card
      className={`${styles.glassCard} ${styles.focusHeatmapCard} ${isInteractive ? styles.focusHeatmapCardInteractive : ''}`}
      variant="glass"
      onClick={isInteractive ? handleNavigate : undefined}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
    >
      <div className={styles.heatmapHeader}>
        <div className={styles.cardLabel}>FOCUS HEATMAP</div>
        {isInteractive ? (
          <button
            type="button"
            className={`${styles.heatmapLinkBtn} ${styles.compactAttAnalysisBtn}`}
            onClick={(event) => {
              event.stopPropagation();
              handleNavigate();
            }}
          >
            View full analytics
          </button>
        ) : (
          <div className={styles.heatmapLinkBtn}>View full analytics</div>
        )}
      </div>
      <StudyHeatmap heatmapData={normalizedHeatmap} />
    </Card>
  );
}

export function ContributionHeatmap({ heatmap, onNavigate }) {
  if (!heatmap?.data?.length) return null;
  const days = heatmap.data;
  const dailyTotals = days.map(row => (Array.isArray(row) ? row.reduce((s, v) => s + v, 0) : 0));
  const maxVal = Math.max(...dailyTotals, 1);
  const SHOW = Math.min(70, dailyTotals.length);
  const slice = dailyTotals.slice(-SHOW);
  const pad = (7 - (slice.length % 7)) % 7;
  const padded = [...Array(pad).fill(null), ...slice];
  const weeks = [];
  for (let w = 0; w < Math.ceil(padded.length / 7); w++) {
    weeks.push(padded.slice(w * 7, (w + 1) * 7));
  }
  const getColor = (val) => {
    if (val == null) return 'transparent';
    if (val === 0) return 'color-mix(in srgb, var(--border) 60%, transparent)';
    const t = val / maxVal;
    if (t < 0.25) return 'color-mix(in srgb, #5D4037 25%, var(--panel))';
    if (t < 0.5) return '#8D6E63';
    if (t < 0.75) return '#6D4C41';
    return '#5D4037';
  };
  return (
    <Card className={`${styles.glassCard} ${styles.contributionCard}`} variant="glass" onClick={() => onNavigate('analytics')} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onNavigate('analytics')}>
      <div className={styles.heatmapHeader}>
        <div className={styles.cardLabel}>FOCUS ACTIVITY</div>
        <div className={styles.heatmapLinkBtn}>View full analytics</div>
      </div>
      <div className={styles.contributionGrid}>
        {weeks.map((week, wi) => (
          <div key={wi} className={styles.contributionWeek}>
            {week.map((val, di) => (
              <div key={di} className={styles.contributionCell} style={{ background: getColor(val) }} title={val != null ? `${Math.round(val / 60 * 10) / 10}h` : ''} />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function AttendanceWidget() {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const { stats, loading, error, refetch: refetchStats } = useAttendanceStats();
  const { records, refetch: refetchRecords } = useAttendanceRecords();

  if (loading) return (
    <ProfileWidget title="ATTENDANCE">
      <div className={styles.attendanceLoading}>Loading metrics...</div>
    </ProfileWidget>
  );

  if (error || !stats) return null;

  // Use records directly for marked events since the backend now returns metadata (title, start_time, event_type)
  const markedEvents = records.map(r => ({
    id: r.event_id,
    title: r.title || "Untitled Event",
    start_time: r.start_time,
    attended: r.attended,
    event_type: r.event_type
  })).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  const attendedEvents = markedEvents.filter((e) => e.attended);
  const missedEvents = markedEvents.filter((e) => !e.attended);

  const overall = stats.overall || { attended: 0, missed: 0 };
  const totalMarked = overall.attended + overall.missed;
  const attendancePct = totalMarked > 0 ? (overall.attended / totalMarked) * 100 : 100;
  const isLowAttendance = attendancePct < 50;

  const by_type = stats.by_type || {};
  const overallData = buildOverallChartData(overall);
  const byTypeEntries = buildByTypeChartData(by_type);
  const byTypeData = withByTypeColors(byTypeEntries);

  function getEventsForSegment(segment) {
    if (!segment) return [];
    if (segment.chart === "overall") {
      return segment.label === "Attended" ? attendedEvents : missedEvents;
    }
    if (segment.chart === "byType") {
      return markedEvents.filter((e) => e.event_type === segment.label);
    }
    return [];
  }

  const detailPanelEvents = getEventsForSegment(selectedSegment);
  const detailPanelLabel = selectedSegment
    ? `${selectedSegment.chart === "overall" ? "Overall" : "By type"}: ${selectedSegment.label}`
    : null;

  const handleSegmentClick = (chart, label) => {
    setSelectedSegment(label ? { chart, label } : null);
  };

  const handleToggleStatus = async (eventId, attended) => {
    try {
      await recordAttendance(eventId, attended);
      await refetchStats();
      await refetchRecords();
    } catch (err) {
      console.error("Failed to toggle attendance status", err);
      throw err; // Re-throw so SegmentDetailPanel can revert
    }
  };

  const attendanceLabel = isLowAttendance ? (
            <div className={styles.attendanceWarning}>
              <span className={styles.warningIcon}>⚡</span>
              <span>Low Attendance ({Math.round(attendancePct)}%)</span>
            </div>
  ) : null;

  return (
    <ProfileWidget 
        title="ATTENDANCE" 
        subtitle={attendanceLabel}
        className={`${styles.attendanceWidget} ${styles.attendanceWidgetDetailed}`}
    >
      <div 
        className={`${styles.attendanceCharts} ${styles.attendanceChartsRow}`}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className={styles.attendanceChartBox}>
          <div className={styles.attendanceChartLabel}>Overall</div>
          <OverallAttendanceChart
            data={overallData}
            attended={overall.attended}
            missed={overall.missed}
            onSegmentClick={handleSegmentClick}
          />
        </div>
        <div className={styles.attendanceChartBox}>
          <div className={styles.attendanceChartLabel}>By Type</div>
          <ByTypeAttendanceChart
            data={byTypeData}
            onSegmentClick={handleSegmentClick}
          />
        </div>
      </div>
      {selectedSegment && (
        <div onClick={(e) => e.stopPropagation()}>
          <SegmentDetailPanel
            segmentLabel={detailPanelLabel}
            events={detailPanelEvents}
            onToggleStatus={handleToggleStatus}
            onClose={() => setSelectedSegment(null)}
            className={styles.profileAttendanceDetail}
          />
        </div>
      )}
    </ProfileWidget>
  );
}
