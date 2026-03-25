/*
 * Study heatmap chart.
 */

import styles from './Charts.module.css';
import { useTheme } from '../../context/ThemeContext';
import heatmapColors from './utils/heatmapColorConstants.json';

const LEGEND_INTENSITIES = [0, 0.25, 0.5, 0.75, 1];

const buildHeatColor = (alpha) => `color-mix(in srgb, var(--chart-study) ${Math.round(alpha * 100)}%, transparent)`;

const getHeatmapColor = (value, maxValue, theme) => {
  if (value === 0) return theme === 'dark' ? heatmapColors.emptyDark : heatmapColors.emptyLight;
  return buildHeatColor(0.2 + (value / maxValue) * 0.8);
};

const getLegendColor = (intensity, theme) => intensity === 0
  ? (theme === 'dark' ? heatmapColors.legendEmptyDark : heatmapColors.legendEmptyLight)
  : buildHeatColor(0.2 + intensity * 0.8);

const formatHour = (h) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
const getDisplayHours = (hours) => hours.filter((_, i) => i % 3 === 0).map(formatHour);
const getMaxValue = (data) => Math.max(...data.flat());

const renderDayLabel = (day) => <div key={day} className={styles.dayLabel}>{day}</div>;

const renderHourLabel = (hour, index) => <div key={index} className={styles.hourLabel}>{hour}</div>;

function DayLabels({ days }) {
  return <div className={styles.dayLabels}>{days.map(renderDayLabel)}</div>;
}

function HourLabels({ displayHours }) {
  return <div className={styles.hourLabels}>{displayHours.map(renderHourLabel)}</div>;
}

function HeatmapCell({ value, maxValue, day, hour, theme }) {
  const color = getHeatmapColor(value, maxValue, theme);
  return (
    <div
      className={styles.gridCell}
      style={{ backgroundColor: color }}
      title={`${day} ${hour}:00 - ${value} minutes`}
    >
      {value > 0 && value > maxValue * 0.3 && <span className={styles.cellValue}>{value}</span>}
    </div>
  );
}

function HeatmapRow({ dayData, dayIndex, days, hours, maxValue, theme }) {
  return (
    <div className={styles.gridRow}>
      {dayData.map((value, hourIndex) => (
        <HeatmapCell
          key={hourIndex}
          value={value}
          maxValue={maxValue}
          day={days[dayIndex]}
          hour={hours[hourIndex]}
          theme={theme}
        />
      ))}
    </div>
  );
}

function HeatmapLegend({ theme }) {
  return (
    <div className={styles.legend}>
      <span className={styles.legendLabel}>Less</span>
      <div className={styles.legendGradient}>
        {LEGEND_INTENSITIES.map((intensity, i) => {
          const legendBg = getLegendColor(intensity, theme);
          return <div key={i} className={styles.legendBox} style={{ backgroundColor: legendBg }} />;
        })}
      </div>
      <span className={styles.legendLabel}>More</span>
    </div>
  );
}

function HeatmapRows({ data, days, hours, maxValue, theme }) {
  return data.map((dayData, dayIndex) => (
    <HeatmapRow key={dayIndex} dayData={dayData} dayIndex={dayIndex} days={days} hours={hours} maxValue={maxValue} theme={theme} />
  ));
}

const StudyHeatmap = ({ heatmapData }) => {
  const { mode: theme } = useTheme();
  const { data, days, hours } = heatmapData;
  const maxValue = getMaxValue(data);
  const displayHours = getDisplayHours(hours);
  return (
    <div className={styles.heatmapContainer}>
      <div className={styles.heatmapGrid}>
        <DayLabels days={days} />
        <div className={styles.gridContainer}>
          <HourLabels displayHours={displayHours} />
          <div className={styles.grid}><HeatmapRows data={data} days={days} hours={hours} maxValue={maxValue} theme={theme} /></div>
        </div>
      </div>
      <HeatmapLegend theme={theme} />
    </div>
  );
};

export default StudyHeatmap;
