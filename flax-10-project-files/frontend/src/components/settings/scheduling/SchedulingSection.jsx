/*
 * Scheduling preference sections for study time, week, and time-of-day.
 */

import AnimatedDropdown from "../../common/animated_dropdown";
import styles from "../../../pages/settings/Settings.module.css";
import SettingsContextCard from "../SettingsContextCard";
import { SectionHeader, SubmitButton } from "../SettingsUI";
import { STUDY_TIME_OPTIONS, WEEK_PREFERENCE_OPTIONS, WORKTIME_PREFERENCE_OPTIONS } from "./useSchedulingState";

function SchedulingDropdownField({ label, value, onChange, options, placeholder }) {
  return (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <AnimatedDropdown className={styles.schedulingDropdown} value={value} onChange={onChange} options={options} placeholder={placeholder} usePortal allowFlipUpward={false} />
    </div>
  );
}

function SchedulingHint({ children }) {
  return <p className={styles.schedulingHint}>{children}</p>;
}

function SchedulingSideCard() {
  return (
    <SettingsContextCard
      className={styles.schedulingInfoCard}
      emoji="🗓️"
      title="Scheduling setup"
      body="These choices guide where auto-planned study blocks land."
      items={[
        "Daily target keeps plans realistic.",
        "Scheduling days decides which days can be used.",
        "Study time preference leans plans toward day or night.",
      ]}
    />
  );
}

function SchedulingTile({ config, value, onChange, onSubmit, isSaving, hasUnsaved, saveSignal, compact }) {
  const desc = compact ? config.compactDesc : config.fullDesc;
  const label = compact ? config.compactLabel : config.fullLabel;
  const tileClass = compact ? `${styles.settingsTile} ${styles.schedulingCompactTile}` : styles.settingsTile;
  return (
    <div className={tileClass}>
      <form onSubmit={onSubmit}>
        <SectionHeader title={config.title} description={desc} />
        <SchedulingDropdownField label={config.label} value={value} onChange={onChange} options={config.options} placeholder={config.placeholder} />
        <SchedulingHint>{config.hint}</SchedulingHint>
        <SubmitButton isSaving={isSaving} label={label} savingLabel="Saving..." hasUnsaved={hasUnsaved} saveSignal={saveSignal} />
      </form>
    </div>
  );
}

function SchedulingSection({ config, value, onChange, onSubmit, isSaving, hasUnsaved, saveSignal, compact }) {
  const tile = <SchedulingTile config={config} value={value} onChange={onChange} onSubmit={onSubmit} isSaving={isSaving} hasUnsaved={hasUnsaved} saveSignal={saveSignal} compact={compact} />;
  return compact ? tile : <div className={styles.twoColLayout}><div>{tile}</div><SettingsContextCard {...config.contextProps} /></div>;
}

const STUDY_TIME_CONFIG = {
  title: "Daily study target",
  compactDesc: "A soft cap for auto plans.",
  fullDesc: "Set a soft limit for auto plans.",
  label: "Daily study time",
  placeholder: "Choose a target",
  hint: "StudyFlax will try to stay within this total each day.",
  compactLabel: "Save target",
  fullLabel: "Save daily study time",
  options: STUDY_TIME_OPTIONS,
  contextProps: { emoji: "📚", title: "Quick guide", items: ["Higher values allow longer study plans.", "Lower values keep busy days lighter."] },
};

const WEEK_CONFIG = {
  title: "Scheduling days",
  compactDesc: "Pick which days can be used.",
  fullDesc: "Pick weekdays, weekends, or both.",
  label: "Days available for scheduling",
  placeholder: "Choose days",
  hint: "Auto plans will stay inside these days.",
  compactLabel: "Save days",
  fullLabel: "Save scheduling days",
  options: WEEK_PREFERENCE_OPTIONS,
  contextProps: { emoji: "📅", title: "Quick guide", items: ["Weekdays add structure around classes.", "Weekends leave room for catch-up blocks."] },
};

const WORKTIME_CONFIG = {
  title: "Study time preference",
  compactDesc: "Pick when plans should lean.",
  fullDesc: "Pick daytime, nighttime, or either.",
  label: "Preferred study time",
  placeholder: "Choose a time",
  hint: "Use this to steer plans toward day or night.",
  compactLabel: "Save study time",
  fullLabel: "Save study time preference",
  options: WORKTIME_PREFERENCE_OPTIONS,
  contextProps: { emoji: "⏰", title: "Quick guide", items: ["Daytime keeps blocks in waking hours.", "Nighttime works better for late focus."] },
};

export function StudyTimeSection(props) {
  return <SchedulingSection config={STUDY_TIME_CONFIG} value={props.minutesPerDay} onChange={props.onMinutesChange} onSubmit={props.onSubmit} isSaving={props.isSaving} hasUnsaved={props.hasUnsaved} saveSignal={props.saveSignal} compact={props.compact} />;
}

export function WeekPreferenceSection(props) {
  return <SchedulingSection config={WEEK_CONFIG} value={props.weekPreference} onChange={props.onWeekPreferenceChange} onSubmit={props.onSubmit} isSaving={props.isSaving} hasUnsaved={props.hasUnsaved} saveSignal={props.saveSignal} compact={props.compact} />;
}

export function WorktimePreferenceSection(props) {
  return <SchedulingSection config={WORKTIME_CONFIG} value={props.worktimePreference} onChange={props.onWorktimePreferenceChange} onSubmit={props.onSubmit} isSaving={props.isSaving} hasUnsaved={props.hasUnsaved} saveSignal={props.saveSignal} compact={props.compact} />;
}

export function SchedulingPanel({ studyTimeProps, weekPreferenceProps, worktimeProps }) {
  return (
    <div className={styles.schedulingLayout}>
      <div className={styles.schedulingPanel}>
        <StudyTimeSection {...studyTimeProps} compact />
        <div className={styles.schedulingSplitRow}>
          <WeekPreferenceSection {...weekPreferenceProps} compact />
          <WorktimePreferenceSection {...worktimeProps} compact />
        </div>
      </div>
      <div className={styles.schedulingAside}>
        <SchedulingSideCard />
      </div>
    </div>
  );
}
