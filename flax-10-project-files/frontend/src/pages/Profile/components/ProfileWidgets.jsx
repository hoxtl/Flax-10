import { useState, useEffect, useRef } from "react";
import styles from "../Profile.module.css";
import { getModules } from "../../../api/moduleApi";
import Badge from "../../../components/common/Badge/Badge";
import Card from "../../../components/common/Card/Card";
import PrimaryButton from "../../../components/common/PrimaryButton/PrimaryButton";
import SectionHeader from "../../../components/common/SectionHeader/SectionHeader";
import { useAttendanceStats } from "../../Attendance/hooks/useAttendanceStats";
import { useTimetableEvents } from "../../Attendance/hooks/useTimetableEvents";
import { useAttendanceRecords } from "../../Attendance/hooks/useAttendanceRecords";
import {
  buildOverallChartData,
  buildByTypeChartData,
  withByTypeColors,
  getEventTypeLabel,
} from "../../Attendance/utils/attendanceChartData";
import { recordAttendance } from "../../../api/attendanceApi";
import OverallAttendanceChart from "../../Attendance/components/OverallAttendanceChart";
import ByTypeAttendanceChart from "../../Attendance/components/ByTypeAttendanceChart";
import SegmentDetailPanel from "../../Attendance/components/SegmentDetailPanel";

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
                        <span className={styles.dnaDot} style={{ background: s.color }} /><span className={styles.dnaLegendLabel}>{s.label}</span><span className={styles.dnaLegendPct}>{Math.round(s.pct * 100)}%</span>
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

export function ThisWeek({ weekly, streaks, onGoalSave }) {
    const [editing, setEditing] = useState(false);
    const [tempGoal, setTempGoal] = useState(weekly?.goal_hours || 20);
    if (!weekly) return null;
    const handleSave = (n) => { onGoalSave(n); setEditing(false); };
    return (
        <Card className={`${styles.glassCard} ${styles.weekCard}`} variant="glass">
            <div className={styles.cardLabel}>THIS WEEK</div>
            <WeekContent weekly={weekly} streaks={streaks} editing={editing} setEditing={setEditing} tempGoal={tempGoal} setTempGoal={setTempGoal} onSave={handleSave} />
        </Card>
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

export function AttendanceWidget() {
  const [selectedSegment, setSelectedSegment] = useState(null);
  const { stats, loading, error, refetch: refetchStats } = useAttendanceStats();
  const { records, recordsByEventId, refetch: refetchRecords } = useAttendanceRecords();
  const { events: timetableEvents } = useTimetableEvents();

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
